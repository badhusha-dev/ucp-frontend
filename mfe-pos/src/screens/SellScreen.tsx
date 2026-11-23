import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Badge, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment,
  LinearProgress, Paper, Snackbar, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import {
  AddRounded, DeleteOutlineRounded, Inventory2Outlined, LocalOfferOutlined, QrCodeScannerRounded, RemoveRounded, SearchRounded,
  ShoppingCartOutlined, WarningAmberRounded,
} from '@mui/icons-material';
import { PosApiError, newIdempotencyKey, posApi, type CartPricing, type Me, type Quote, type Sale } from '../api';
import {
  addToCart, itemCount, linesSubtotal, looksLikeCode, parseAmount, round2, setLineDiscount, setQuantity, stockShortage, stockWarnings,
  type CartLine, type CatalogItem, type Shortage, type TenderLine,
} from '../posModel';
import { money } from '../format';
import { PaymentDialog } from '../components/PaymentDialog';
import { ReceiptDialog } from '../components/ReceiptDialog';

interface Props { me: Me; can: (permission: string) => boolean; onSaleCompleted: () => void }

// The till fits the window under the shell header, the session bar and the POS tabs, so Charge is always on screen.
const TILL_HEIGHT = 'max(540px, calc(100vh - 340px))';

/** The till: find products (search or scan), build the cart, price it on the server, take payment, give a receipt. */
export function SellScreen({ me, can, onSaleCompleted }: Props) {
  const currency = me.settings.currency;
  const m = (value: number) => money(value, currency);
  const canDiscount = can('pos:discount') || can('pos:manage');
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountType, setDiscountType] = useState<'PERCENT' | 'AMOUNT'>('PERCENT');
  const [discountText, setDiscountText] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [paying, setPaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payError, setPayError] = useState('');
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [shortage, setShortage] = useState<{ items: Shortage[]; canOverride: boolean } | null>(null);
  const [pending, setPending] = useState<{ tenders: TenderLine[]; note: string; key: string } | null>(null);
  const [toast, setToast] = useState('');
  const [editingDiscount, setEditingDiscount] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const discountValue = canDiscount ? parseAmount(discountText || '0') : 0;
  const pricing: CartPricing = useMemo(() => ({
    lines: cart.map((line) => ({ productId: line.productId, quantity: line.quantity, ...(line.lineDiscount > 0 ? { lineDiscount: line.lineDiscount } : {}) })),
    cartDiscountType: discountType,
    cartDiscountValue: Number.isFinite(discountValue) && discountValue > 0 ? discountValue : 0,
  }), [cart, discountType, discountValue]);

  // Product search (debounced).
  useEffect(() => {
    let active = true;
    setLoadingProducts(true);
    const timer = window.setTimeout(() => {
      posApi.catalog(search)
        .then((items) => { if (active) { setProducts(items); setCatalogError(''); } })
        .catch((cause: unknown) => { if (active) setCatalogError(cause instanceof Error ? cause.message : 'Products could not be loaded.'); })
        .finally(() => { if (active) setLoadingProducts(false); });
    }, search ? 250 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search]);

  // Server price for the cart (debounced): discounts, tax and totals exactly as the sale will be saved.
  useEffect(() => {
    if (cart.length === 0) { setQuote(null); setQuoteError(''); return; }
    let active = true;
    setQuoting(true);
    const timer = window.setTimeout(() => {
      posApi.quote(pricing)
        .then((result) => { if (active) { setQuote(result); setQuoteError(''); } })
        .catch((cause: unknown) => { if (active) { setQuote(null); setQuoteError(cause instanceof Error ? cause.message : 'The cart could not be priced.'); } })
        .finally(() => { if (active) setQuoting(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [pricing, cart.length]);

  const add = useCallback((item: CatalogItem) => {
    setCart((current) => addToCart(current, item));
    setToast(`Added ${item.name}`);
  }, []);

  const submitSearch = async () => {
    const text = search.trim();
    if (!text) return;
    if (looksLikeCode(text)) {
      try {
        add(await posApi.lookup(text));
        setSearch('');
        return;
      } catch (cause) {
        if (!(cause instanceof PosApiError && cause.status === 404)) { setToast(cause instanceof Error ? cause.message : 'Lookup failed.'); return; }
      }
    }
    if (products.length === 1) { add(products[0]); setSearch(''); }
    else if (products.length === 0) setToast(`No product matches "${text}".`);
  };

  const total = quote?.totals.total ?? null;
  const canCharge = cart.length > 0 && !!quote && !quoting && !quoteError;

  const openPayment = useCallback(() => { if (canCharge) { setPayError(''); setPaying(true); } }, [canCharge]);

  // Keyboard: F2 jumps to search, F9 takes payment.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'F2') { event.preventDefault(); searchRef.current?.focus(); }
      if (event.key === 'F9') { event.preventDefault(); openPayment(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openPayment]);

  const completeSale = async (tenders: TenderLine[], note: string, key: string, allowOutOfStock = false) => {
    setSaving(true);
    setPayError('');
    try {
      const sale = await posApi.sell({ ...pricing, payments: tenders.map((t) => ({ method: t.method, amount: t.amount, reference: t.reference })),
        customerNote: note || undefined, idempotencyKey: key, allowOutOfStock });
      setPaying(false);
      setShortage(null);
      setPending(null);
      setCart([]);
      setDiscountText('');
      setReceipt(sale);
      onSaleCompleted();
    } catch (cause) {
      const short = cause instanceof PosApiError ? stockShortage(cause.body) : null;
      if (short) { setPending({ tenders, note, key }); setShortage(short); }
      else setPayError(cause instanceof Error ? cause.message : 'The sale could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const warnings = stockWarnings(cart);
  const lineTotal = (productId: number, fallback: number) => {
    const line = quote?.totals.lines.find((l) => l.input.productId === productId);
    return line ? line.lineTotal : fallback;
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 420px' }, gap: 2, alignItems: 'start' }}>
      {/* Products */}
      <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 3, minHeight: { lg: TILL_HEIGHT } }}>
        <TextField inputRef={searchRef} fullWidth autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void submitSearch(); } }}
          placeholder="Search by name or SKU, or scan a barcode" aria-label="Search products"
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment>,
            endAdornment: <InputAdornment position="end"><Tooltip title="Scan or type a code and press Enter (F2 to jump here)"><QrCodeScannerRounded color="action" /></Tooltip></InputAdornment>,
            sx: { fontSize: 18, borderRadius: 3, bgcolor: '#F8FAFC' },
          }} />
        <Box sx={{ height: 4, mt: 1 }}>{loadingProducts && <LinearProgress />}</Box>
        {catalogError && <Alert severity="error" sx={{ mt: 1 }}>{catalogError}</Alert>}
        {!loadingProducts && !catalogError && products.length === 0 && (
          <Stack alignItems="center" spacing={1} sx={{ py: 8, color: 'text.secondary' }}>
            <Inventory2Outlined sx={{ fontSize: 44 }} />
            <Typography fontWeight={700}>{search ? `Nothing matches "${search}"` : 'No products to sell yet'}</Typography>
            <Typography variant="body2">{search ? 'Try another name, or scan the barcode.' : 'Add active products in Catalog Management first.'}</Typography>
          </Stack>
        )}
        <Box sx={{ mt: 1, display: 'grid', gap: 1.25, gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {products.map((item) => {
            const available = item.available;
            const out = available !== null && available !== undefined && available <= 0;
            const low = available !== null && available !== undefined && available > 0 && available <= 5;
            const inCart = cart.find((line) => line.productId === item.id)?.quantity ?? 0;
            return (
              <Badge key={item.id} badgeContent={inCart} color="primary" invisible={inCart === 0} sx={{ display: 'block', '& .MuiBadge-badge': { right: 14, top: 14, fontWeight: 800 } }}>
                <Paper component="button" type="button" variant="outlined" onClick={() => add(item)} aria-label={`Add ${item.name}`}
                  sx={{ width: '100%', textAlign: 'left', p: 1.5, borderRadius: 2.5, cursor: 'pointer', font: 'inherit', color: 'inherit', bgcolor: '#fff',
                    display: 'flex', flexDirection: 'column', gap: 0.75, minHeight: 124, transition: 'all .12s ease', opacity: out ? 0.6 : 1, overflow: 'hidden',
                    '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 14px rgba(79,70,229,.15)', transform: 'translateY(-1px)' },
                    '&:focus-visible': { outline: '3px solid rgba(79,70,229,.45)', outlineOffset: 2 } }}>
                  <Box sx={{ mx: -1.5, mt: -1.5, mb: 0.5, height: 96, flexShrink: 0, position: 'relative', overflow: 'hidden', bgcolor: '#F1F5F9',
                    display: 'grid', placeItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {item.imageUrl
                      ? <Box component="img" src={item.imageUrl} alt="" loading="lazy" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <Inventory2Outlined sx={{ color: '#CBD5E1', fontSize: 36 }} />}
                  </Box>
                  <Typography fontWeight={700} sx={{ lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>{item.sku || `#${item.id}`}{item.category ? ` · ${item.category}` : ''}</Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                    <Typography fontWeight={800} color="primary.main">{m(Number(item.price))}</Typography>
                    {out && <Chip size="small" color="error" label="Out" />}
                    {low && <Chip size="small" color="warning" variant="outlined" label={`${available} left`} />}
                  </Stack>
                </Paper>
              </Badge>
            );
          })}
        </Box>
      </Paper>

      {/* Cart */}
      <Paper variant="outlined" sx={{ borderRadius: 3, display: 'flex', flexDirection: 'column', position: { lg: 'sticky' }, top: { lg: 16 },
        height: { lg: TILL_HEIGHT }, overflow: 'hidden' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ShoppingCartOutlined color="primary" />
            <Typography fontWeight={800}>Current sale</Typography>
            {cart.length > 0 && <Chip size="small" label={`${itemCount(cart)} item${itemCount(cart) === 1 ? '' : 's'}`} />}
          </Stack>
          {cart.length > 0 && <Button size="small" color="inherit" onClick={() => setConfirmClear(true)}>Clear</Button>}
        </Stack>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1, py: 1 }}>
          {cart.length === 0 && (
            <Stack alignItems="center" spacing={1} sx={{ py: 8, px: 3, color: 'text.secondary', textAlign: 'center' }}>
              <ShoppingCartOutlined sx={{ fontSize: 44 }} />
              <Typography fontWeight={700}>The cart is empty</Typography>
              <Typography variant="body2">Tap a product or scan a barcode to start a sale.</Typography>
            </Stack>
          )}
          {cart.map((line) => {
            const gross = round2(line.unitPrice * line.quantity);
            const short = line.available !== null && line.quantity > line.available;
            return (
              <Box key={line.productId} sx={{ px: 1, py: 1.25, borderRadius: 2, '&:hover': { bgcolor: '#F8FAFC' } }}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography fontWeight={700} noWrap title={line.name}>{line.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{m(line.unitPrice)} each{line.sku ? ` · ${line.sku}` : ''}</Typography>
                    {short && <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>Only {Math.max(0, line.available ?? 0)} in stock</Typography>}
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography fontWeight={800}>{m(lineTotal(line.productId, gross - line.lineDiscount))}</Typography>
                    {line.lineDiscount > 0 && <Typography variant="caption" color="success.main">−{m(line.lineDiscount)} off</Typography>}
                  </Box>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.75 }}>
                  <IconButton size="small" aria-label={`One less ${line.name}`} onClick={() => setCart((c) => setQuantity(c, line.productId, line.quantity - 1))}
                    sx={{ border: '1px solid', borderColor: 'divider' }}><RemoveRounded fontSize="small" /></IconButton>
                  <TextField value={line.quantity} size="small" inputMode="numeric" aria-label={`Quantity of ${line.name}`}
                    onChange={(e) => { const q = parseInt(e.target.value, 10); if (!Number.isNaN(q)) setCart((c) => setQuantity(c, line.productId, q)); }}
                    inputProps={{ style: { textAlign: 'center', width: 44, padding: '6px 4px', fontWeight: 700 } }} />
                  <IconButton size="small" aria-label={`One more ${line.name}`} onClick={() => setCart((c) => setQuantity(c, line.productId, line.quantity + 1))}
                    sx={{ border: '1px solid', borderColor: 'divider' }}><AddRounded fontSize="small" /></IconButton>
                  <Box sx={{ flexGrow: 1 }} />
                  {canDiscount && (
                    <Tooltip title="Discount this line">
                      <IconButton size="small" aria-label={`Discount ${line.name}`} color={line.lineDiscount > 0 ? 'success' : 'default'}
                        onClick={() => setEditingDiscount(editingDiscount === line.productId ? null : line.productId)}><LocalOfferOutlined fontSize="small" /></IconButton>
                    </Tooltip>
                  )}
                  <IconButton size="small" aria-label={`Remove ${line.name}`} onClick={() => setCart((c) => setQuantity(c, line.productId, 0))}>
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                </Stack>
                {editingDiscount === line.productId && (
                  <TextField size="small" fullWidth autoFocus sx={{ mt: 1 }} label={`Line discount (max ${m(gross)})`} defaultValue={line.lineDiscount || ''}
                    inputMode="decimal" InputProps={{ startAdornment: <InputAdornment position="start">{currency}</InputAdornment> }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingDiscount(null); }}
                    onBlur={() => setEditingDiscount(null)}
                    onChange={(e) => { const v = parseAmount(e.target.value || '0'); if (!Number.isNaN(v)) setCart((c) => setLineDiscount(c, line.productId, v)); }} />
                )}
              </Box>
            );
          })}
        </Box>

        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2, bgcolor: '#FBFCFE' }}>
          {canDiscount && cart.length > 0 && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <TextField size="small" label="Cart discount" value={discountText} onChange={(e) => setDiscountText(e.target.value)} inputMode="decimal"
                error={Number.isNaN(discountValue)} sx={{ flexGrow: 1 }} placeholder="0" />
              <ToggleButtonGroup size="small" exclusive value={discountType} onChange={(_, v: 'PERCENT' | 'AMOUNT' | null) => v && setDiscountType(v)} aria-label="Discount type">
                <ToggleButton value="PERCENT" sx={{ px: 1.5, fontWeight: 700 }}>%</ToggleButton>
                <ToggleButton value="AMOUNT" sx={{ px: 1.5, fontWeight: 700 }}>{currency}</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          )}
          {quote?.needsManager && !can('pos:manage') && (
            <Alert severity="warning" sx={{ mb: 1.5, py: 0 }}>Discounts above {Number(me.settings.maxCashierDiscountPercent)}% need a store manager.</Alert>
          )}
          {warnings.length > 0 && (
            <Alert severity="warning" icon={<WarningAmberRounded />} sx={{ mb: 1.5, py: 0 }}>
              {warnings.length === 1 ? `${warnings[0].name} may be short on stock.` : `${warnings.length} items may be short on stock.`}
            </Alert>
          )}
          {quoteError && <Alert severity="error" sx={{ mb: 1.5, py: 0 }}>{quoteError}</Alert>}
          <Stack spacing={0.5}>
            <Row label="Subtotal" value={quote ? m(quote.totals.subtotal) : m(linesSubtotal(cart) + cart.reduce((s, l) => s + l.lineDiscount, 0))} />
            {quote && quote.totals.discountTotal > 0 && <Row label="Discounts" value={`−${m(quote.totals.discountTotal)}`} tone="success.main" />}
            <Row label={`Tax${quote ? ` (${Number(quote.totals.taxRatePercent)}%)` : ''}`} value={quote ? m(quote.totals.taxTotal) : '—'} />
          </Stack>
          <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mt: 1, mb: 1.5 }}>
            <Typography fontWeight={800} fontSize={18}>Total</Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              {quoting && <CircularProgress size={16} />}
              <Typography fontWeight={800} sx={{ fontSize: 30, letterSpacing: '-.02em' }}>{total === null ? m(0) : m(total)}</Typography>
            </Stack>
          </Stack>
          <Button fullWidth variant="contained" color="success" size="large" disabled={!canCharge} onClick={openPayment}
            sx={{ minHeight: 58, fontSize: 18, fontWeight: 800, borderRadius: 3 }}>
            {cart.length === 0 ? 'Add items to charge' : `Charge ${total === null ? '' : m(total)}`}
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>F2 search · F9 charge</Typography>
        </Box>
      </Paper>

      <PaymentDialog open={paying} due={total ?? 0} currency={currency} busy={saving} error={payError} onClose={() => setPaying(false)}
        onComplete={(tenders, note) => void completeSale(tenders, note, newIdempotencyKey())} />

      <Dialog open={!!shortage} onClose={() => setShortage(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Not enough stock</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            {shortage?.items.map((item) => (
              <Stack key={item.productId} direction="row" justifyContent="space-between">
                <Typography fontWeight={600}>{item.name}</Typography>
                <Typography color="text.secondary">wanted {item.requested}, {Math.max(0, item.available)} in stock</Typography>
              </Stack>
            ))}
            <Alert severity={shortage?.canOverride ? 'warning' : 'info'}>
              {shortage?.canOverride
                ? 'If the items are on the shelf, you can sell anyway. The stock count will be corrected in Stock.'
                : 'Lower the quantity, or ask a store manager to sell anyway.'}
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShortage(null)}>Change the cart</Button>
          {shortage?.canOverride && pending && (
            <Button variant="contained" color="warning" disabled={saving} onClick={() => void completeSale(pending.tenders, pending.note, pending.key, true)}>
              Sell anyway
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)} maxWidth="xs">
        <DialogTitle>Clear this sale?</DialogTitle>
        <DialogContent><Typography color="text.secondary">All {itemCount(cart)} items and discounts will be removed.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClear(false)}>Keep</Button>
          <Button color="error" variant="contained" onClick={() => { setCart([]); setDiscountText(''); setConfirmClear(false); }}>Clear sale</Button>
        </DialogActions>
      </Dialog>

      <ReceiptDialog sale={receipt} onClose={() => { setReceipt(null); window.setTimeout(() => searchRef.current?.focus(), 50); }} />
      <Snackbar open={!!toast} autoHideDuration={1600} onClose={() => setToast('')} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} />
    </Box>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight={600} color={tone}>{value}</Typography>
    </Stack>
  );
}
