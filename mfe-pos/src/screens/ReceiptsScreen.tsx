import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, InputAdornment,
  List, ListItemButton, ListItemText, MenuItem, Paper, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { AddRounded, PrintRounded, ReceiptLongRounded, RemoveRounded, SearchRounded, UndoRounded } from '@mui/icons-material';
import { EmptyState, ErrorState, LoadingState } from '@ecommerce/shared-library/src/ui/StateViews';
import { PosApiError, posApi, type Me, type Sale, type SaleSummary } from '../api';
import { PAYMENT_LABELS, PAYMENT_METHODS, RANGE_LABELS, dateRange, refundPreview, round2, type PaymentMethod, type RangeKey } from '../posModel';
import { money, time } from '../format';
import { ReceiptView, printReceipt } from '../components/ReceiptView';

interface Props { me: Me; can: (permission: string) => boolean; hasOpenShift: boolean }

const STATUS: Record<Sale['status'], { label: string; color: 'success' | 'warning' | 'default' }> = {
  COMPLETED: { label: 'Paid', color: 'success' }, PARTIALLY_REFUNDED: { label: 'Part refunded', color: 'warning' }, REFUNDED: { label: 'Refunded', color: 'default' },
};

/** Find a receipt (by date or number), reprint it and give refunds against it. */
export function ReceiptsScreen({ me, can, hasOpenShift }: Props) {
  const currency = me.settings.currency;
  const [range, setRange] = useState<RangeKey>('today');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<SaleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Sale | null>(null);
  const [detailError, setDetailError] = useState('');
  const [refunding, setRefunding] = useState(false);
  const seesAll = can('pos:refund') || can('pos:report') || can('pos:manage');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { from, to } = dateRange(range);
      setRows(await posApi.sales({ from, to, query: search.trim() || undefined }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Receipts could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [range, search]);

  useEffect(() => { const t = window.setTimeout(() => void load(), search ? 300 : 0); return () => window.clearTimeout(t); }, [load, search]);

  const open = async (id: string) => {
    setDetailError('');
    try { setSelected(await posApi.sale(id)); } catch (cause) { setDetailError(cause instanceof Error ? cause.message : 'The receipt could not be opened.'); }
  };

  const findByNumber = async () => {
    const number = search.trim();
    if (!/^(R-?)?\d+$/i.test(number)) return;
    const normalized = `R-${number.replace(/\D/g, '').padStart(6, '0')}`;
    try { setSelected(await posApi.saleByReceipt(normalized)); setDetailError(''); }
    catch (cause) { setDetailError(cause instanceof PosApiError && cause.status === 404 ? `No receipt ${normalized}.` : cause instanceof Error ? cause.message : 'Lookup failed.'); }
  };

  const total = useMemo(() => round2(rows.reduce((s, r) => s + Number(r.total) - Number(r.refundedTotal), 0)), [rows]);
  const refundable = selected && selected.status !== 'REFUNDED' && can('pos:refund');

  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '380px minmax(0, 1fr)' }, alignItems: 'start' }}>
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Stack spacing={1.5} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField size="small" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Receipt number, e.g. R-000123"
            onKeyDown={(e) => { if (e.key === 'Enter') void findByNumber(); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> }} />
          <ToggleButtonGroup size="small" exclusive fullWidth value={range} onChange={(_, v: RangeKey | null) => v && setRange(v)}>
            {(Object.keys(RANGE_LABELS) as RangeKey[]).map((key) => <ToggleButton key={key} value={key} sx={{ fontSize: 12 }}>{RANGE_LABELS[key]}</ToggleButton>)}
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary">
            {rows.length} receipt{rows.length === 1 ? '' : 's'} · net {money(total, currency)}{seesAll ? '' : ' · only sales you rang up'}
          </Typography>
        </Stack>
        {loading && <Box sx={{ p: 2 }}><LoadingState layout="lines" rows={6} label="Loading receipts" /></Box>}
        {error && <Box sx={{ p: 2 }}><ErrorState message={error} onRetry={() => void load()} /></Box>}
        {!loading && !error && rows.length === 0 && <Box sx={{ p: 2 }}><EmptyState compact title="No receipts" hint="Pick another day, or search by receipt number." /></Box>}
        {!loading && !error && rows.length > 0 && (
          <List dense sx={{ maxHeight: { md: 'calc(100vh - 360px)' }, overflowY: 'auto', py: 0 }}>
            {rows.map((row) => (
              <ListItemButton key={row.id} selected={selected?.id === row.id} onClick={() => void open(row.id)} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                <ListItemText
                  primary={<Stack direction="row" justifyContent="space-between"><strong>{row.receiptNumber}</strong><strong>{money(row.total, currency)}</strong></Stack>}
                  secondary={<Stack direction="row" justifyContent="space-between" component="span">
                    <span>{time(row.createdAt)} · {row.itemCount} item{row.itemCount === 1 ? '' : 's'}{row.cashierEmail ? ` · ${row.cashierEmail.split('@')[0]}` : ''}</span>
                    {row.status !== 'COMPLETED' && <Chip component="span" size="small" label={STATUS[row.status].label} color={STATUS[row.status].color} sx={{ height: 18, fontSize: 11 }} />}
                  </Stack>}
                  secondaryTypographyProps={{ component: 'div' }} />
              </ListItemButton>
            ))}
          </List>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2, md: 3 }, minHeight: 320 }}>
        {detailError && <Alert severity="error" sx={{ mb: 2 }}>{detailError}</Alert>}
        {!selected && !detailError && (
          <Stack alignItems="center" spacing={1} sx={{ py: 10, color: 'text.secondary' }}>
            <ReceiptLongRounded sx={{ fontSize: 48 }} />
            <Typography fontWeight={700}>Select a receipt</Typography>
            <Typography variant="body2">Reprint it, or give a refund against it.</Typography>
          </Stack>
        )}
        {selected && (
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" fontWeight={800}>{selected.receiptNumber}</Typography>
                <Chip size="small" label={STATUS[selected.status].label} color={STATUS[selected.status].color} />
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button startIcon={<PrintRounded />} onClick={printReceipt}>Print</Button>
                {refundable && (
                  <Button variant="contained" color="warning" startIcon={<UndoRounded />} onClick={() => setRefunding(true)} disabled={!hasOpenShift}>
                    Refund
                  </Button>
                )}
              </Stack>
            </Stack>
            {refundable && !hasOpenShift && <Alert severity="info">Open a shift to give refunds; refunds come out of your drawer.</Alert>}
            <ReceiptView sale={selected} />
          </Stack>
        )}
      </Paper>

      {selected && <RefundDialog open={refunding} sale={selected} onClose={() => setRefunding(false)}
        onRefunded={(sale) => { setSelected(sale); setRefunding(false); void load(); }} />}
    </Box>
  );
}

const REASONS = ['Damaged', 'Wrong item', 'Changed mind', 'Price adjustment'];

function RefundDialog({ open, sale, onClose, onRefunded }: { open: boolean; sale: Sale; onClose: () => void; onRefunded: (sale: Sale) => void }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [reason, setReason] = useState('');
  const [restock, setRestock] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setQuantities({});
    setReason('');
    setRestock(true);
    setError('');
    const paidBy = sale.payments.length === 1 ? sale.payments[0].method : 'CASH';
    setMethod(paidBy);
  }, [open, sale]);

  const remaining = (lineId: string) => {
    const line = sale.lines.find((l) => l.id === lineId);
    return line ? line.quantity - line.refundedQuantity : 0;
  };
  const amount = round2(sale.lines.reduce((sum, line) => sum + refundPreview(line.lineTotal, line.quantity, line.refundedQuantity, line.refundedAmount, quantities[line.id] ?? 0), 0));
  const chosen = Object.values(quantities).some((q) => q > 0);
  const set = (id: string, q: number) => setQuantities((current) => ({ ...current, [id]: Math.max(0, Math.min(remaining(id), q)) }));

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const lines = Object.entries(quantities).filter(([, q]) => q > 0).map(([saleLineId, quantity]) => ({ saleLineId, quantity }));
      onRefunded(await posApi.refund(sale.id, { lines, method, reason: reason.trim(), restock }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The refund could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Refund items from {sale.receiptNumber}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack spacing={1}>
            {sale.lines.map((line) => {
              const left = line.quantity - line.refundedQuantity;
              const q = quantities[line.id] ?? 0;
              return (
                <Stack key={line.id} direction="row" alignItems="center" spacing={1.5} sx={{ p: 1.25, borderRadius: 2, border: '1px solid', borderColor: q > 0 ? 'warning.main' : 'divider', opacity: left === 0 ? 0.5 : 1 }}>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography fontWeight={700} noWrap>{line.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Bought {line.quantity} · {money(line.lineTotal, sale.currency)}{line.refundedQuantity ? ` · ${line.refundedQuantity} already refunded` : ''}
                    </Typography>
                  </Box>
                  <IconButton size="small" disabled={q === 0} onClick={() => set(line.id, q - 1)} aria-label={`One less ${line.name}`}><RemoveRounded fontSize="small" /></IconButton>
                  <Typography sx={{ width: 28, textAlign: 'center', fontWeight: 800 }}>{q}</Typography>
                  <IconButton size="small" disabled={q >= left} onClick={() => set(line.id, q + 1)} aria-label={`One more ${line.name}`}><AddRounded fontSize="small" /></IconButton>
                  <Button size="small" disabled={left === 0 || q === left} onClick={() => set(line.id, left)}>All</Button>
                </Stack>
              );
            })}
          </Stack>
          <TextField select label="Refund by" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            helperText={`Paid by ${sale.payments.map((p) => `${PAYMENT_LABELS[p.method]} ${money(p.amount, sale.currency)}`).join(', ') || '—'}`}>
            {PAYMENT_METHODS.map((m) => <MenuItem key={m} value={m}>{PAYMENT_LABELS[m]}</MenuItem>)}
          </TextField>
          <TextField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} inputProps={{ maxLength: 200 }} />
          <Stack direction="row" gap={1} flexWrap="wrap">
            {REASONS.map((text) => <Chip key={text} label={text} onClick={() => setReason(text)} variant={reason === text ? 'filled' : 'outlined'} />)}
          </Stack>
          <FormControlLabel control={<Checkbox checked={restock} onChange={(e) => setRestock(e.target.checked)} />}
            label="Put the items back into stock (uncheck for damaged goods)" />
          <Box sx={{ p: 2, borderRadius: 3, bgcolor: '#FFFBEB', textAlign: 'center' }}>
            <Typography variant="overline" color="text.secondary">Refund amount</Typography>
            <Typography sx={{ fontSize: 30, fontWeight: 800, color: '#B45309' }}>{money(amount, sale.currency)}</Typography>
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" color="warning" disabled={busy || !chosen || !reason.trim()} onClick={() => void submit()} sx={{ fontWeight: 800 }}>
          {busy ? 'Refunding…' : `Refund ${money(amount, sale.currency)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
