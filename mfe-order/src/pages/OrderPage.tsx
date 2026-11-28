// Storefront checkout: cart, delivery address, payment method and a total priced by the server (items, coupon, tax,
// delivery). Online payment opens Razorpay Checkout; the server verifies the payment before the order counts as paid.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Container, Divider, IconButton, InputAdornment, Paper, Stack, TextField, Typography,
} from '@mui/material';
import {
  AccountBalanceRounded, AddRounded, CheckCircleRounded, CreditCardRounded, DeleteOutlineRounded, DiscountRounded, LocalAtmRounded,
  LocalShippingOutlined, LockRounded, QrCode2Rounded, RemoveRounded, ShoppingCartOutlined, ErrorOutlineRounded,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { clearCart, formatAmount, removeFromCart, resolveActiveStorefront, storefrontParams, updateQuantity } from '@ecommerce/shared-library';
import type { AppDispatch, RootState } from '@ecommerce/shared-library';
import { QrCode } from '@ecommerce/shared-library/src/ui/QrCode';
import {
  PAYMENT_LABELS, addressErrors, defaultMethod, loadAddress, minutesLeft, paymentStatusText, placeProblem, placeRequest, quoteRequest,
  fromSaved, razorpayOptions, saveAddress, shippingAddresses, utrProblem, type Address, type SavedAddress, type PaymentCode, type PlacedOrder, type Quote, type RazorpayOrder,
} from '../checkoutModel';

axios.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const METHOD_ICONS: Record<PaymentCode, JSX.Element> = {
  ONLINE: <CreditCardRounded />, COD: <LocalAtmRounded />, UPI: <QrCode2Rounded />, BANK_TRANSFER: <AccountBalanceRounded />,
};

declare global {
  interface Window { Razorpay?: new (options: unknown) => { open(): void; on(event: string, cb: (r: { error?: { description?: string } }) => void): void } }
}

function errorText(cause: unknown, fallback: string): string {
  const e = cause as { response?: { data?: { message?: string; error?: string } }; message?: string; name?: string };
  return e?.response?.data?.message || (e?.name === 'StorefrontLookupError' ? e.message ?? '' : '') || fallback;
}

/** Loads Razorpay Checkout once. */
function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay]');
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('Razorpay could not be loaded. Check your connection and try again.')));
    if (!existing) {
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.dataset.razorpay = 'true';
      document.body.appendChild(script);
    }
  });
}

function Row({ label, value, strong, tone }: { label: React.ReactNode; value: React.ReactNode; strong?: boolean; tone?: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ py: 0.5 }}>
      <Typography variant={strong ? 'subtitle1' : 'body2'} sx={{ color: strong ? '#0F172A' : '#64748B', fontWeight: strong ? 800 : 500 }}>{label}</Typography>
      <Typography variant={strong ? 'h6' : 'body2'} sx={{ fontWeight: strong ? 900 : 700, color: tone ?? '#0F172A' }}>{value}</Typography>
    </Stack>
  );
}

export default function OrderPage() {
  const cart = useSelector((state: RootState) => state.cart);
  const user = useSelector((state: RootState) => state.auth?.user) as { id?: number; email?: string } | null | undefined;
  const dispatch = useDispatch<AppDispatch>();
  const [params, setParams] = useSearchParams();
  const userKey = String(user?.id ?? user?.email ?? 'guest');

  const [storefront, setStorefront] = useState<Record<string, string> | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState('');
  const [method, setMethod] = useState<PaymentCode | ''>('');
  const [address, setAddress] = useState<Address>(() => loadAddress(typeof window === 'undefined' ? null : window.localStorage, userKey, ''));
  const [showAddressErrors, setShowAddressErrors] = useState(false);
  const [utr, setUtr] = useState('');
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [paying, setPaying] = useState(false);
  const [reload, setReload] = useState(0);
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const placedRef = useRef<PlacedOrder | null>(null);
  placedRef.current = placed;

  useEffect(() => { setAddress(loadAddress(window.localStorage, userKey, '')); }, [userKey]);

  // The shopper's address book, offered as one-click fills (and used when nothing was typed on this device before).
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    axios.get<SavedAddress[]>(`/api/users/${user.id}/addresses`).then((r) => {
      if (!active) return;
      const list = shippingAddresses(r.data ?? []);
      setSaved(list);
      setAddress((a) => (!a.line1.trim() && list[0] ? fromSaved(a, list[0]) : a));
    }).catch(() => undefined);
    return () => { active = false; };
  }, [user?.id]);

  // Which storefront the shopper is in (its tenant prices the order).
  useEffect(() => {
    let active = true;
    resolveActiveStorefront(window.location, window.sessionStorage)
      .then((sf) => { if (active) setStorefront(storefrontParams(sf) as Record<string, string>); })
      .catch((cause) => { if (active) { setStorefront({}); setQuoteError(errorText(cause, 'This storefront could not be found.')); } });
    return () => { active = false; };
  }, []);

  // Resume an order from "Pay now" (?order=123).
  useEffect(() => {
    const id = params.get('order');
    if (!id || !user) return;
    axios.get<PlacedOrder>(`/api/orders/${encodeURIComponent(id)}/checkout`).then((r) => setPlaced(r.data))
      .catch((cause) => setError(errorText(cause, 'That order could not be found.')));
  }, [params, user]);

  // Server price for the cart (debounced): coupon, tax, delivery and the payment methods the store offers.
  const itemsKey = JSON.stringify(cart.items.map((i) => [i.productId, i.quantity]));
  useEffect(() => {
    if (!storefront || cart.items.length === 0 || placed) { setQuote(null); return; }
    if (!user) { setQuote(null); setQuoteError(''); return; }
    let active = true;
    setQuoting(true);
    const timer = window.setTimeout(() => {
      axios.post<Quote>('/api/orders/checkout/quote', quoteRequest(cart.items, coupon, storefront))
        .then((r) => { if (active) { setQuote(r.data); setQuoteError(''); setMethod((m) => defaultMethod(r.data, m)); } })
        .catch((cause) => { if (active) { setQuote(null); setQuoteError(errorText(cause, 'Your total could not be worked out. Try again.')); } })
        .finally(() => { if (active) setQuoting(false); });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, coupon, storefront, user, placed, reload]);

  const currency = quote?.currency ?? placed?.currency ?? undefined;
  const m = useCallback((v: number | null | undefined) => formatAmount(v ?? 0, currency), [currency]);
  const aErrors = useMemo(() => addressErrors(address), [address]);
  const delivery = quote?.orderType !== 'RESTAURANT';
  const problem = placeProblem({ signedIn: !!user, itemCount: cart.items.length, quote, method, address, utr });
  const lineOf = (productId: number) => quote?.lines.find((l) => l.productId === productId);

  const setField = (key: keyof Address) => (e: { target: { value: string } }) => setAddress((a) => ({ ...a, [key]: e.target.value }));

  // ---- online payment ----------------------------------------------------------------------------------------------

  const refresh = async (orderId: number) => {
    const r = await axios.get<PlacedOrder>(`/api/orders/${orderId}/checkout`);
    setPlaced((p) => ({ ...r.data, ...(p?.message ? { message: p.message } : {}) }));
  };

  const openRazorpay = async (order: PlacedOrder, rzp: RazorpayOrder) => {
    setPaying(true);
    setError('');
    try {
      await loadRazorpay();
      if (!window.Razorpay) throw new Error('Razorpay could not be loaded.');
      const checkout = new window.Razorpay(razorpayOptions(rzp, 'Universal Commerce', async (response) => {
        try {
          const r = await axios.post<PlacedOrder>(`/api/orders/${order.orderId}/payments/razorpay/verify`, {
            razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature,
          });
          setPlaced(r.data);
        } catch (cause) {
          setError(errorText(cause, 'The payment could not be confirmed. If money was taken, the order will update automatically.'));
          await refresh(order.orderId).catch(() => undefined);
        } finally {
          setPaying(false);
        }
      }, () => {
        setPaying(false);
        axios.post(`/api/orders/${order.orderId}/payments/razorpay/failed`, { razorpayOrderId: rzp.orderId, reason: 'Checkout closed' }).catch(() => undefined);
      }));
      checkout.on('payment.failed', (r) => {
        axios.post(`/api/orders/${order.orderId}/payments/razorpay/failed`, { razorpayOrderId: rzp.orderId, reason: r.error?.description ?? 'Payment failed' }).catch(() => undefined);
      });
      checkout.open();
    } catch (cause) {
      setPaying(false);
      setError(errorText(cause, 'Online payment could not be started.'));
    }
  };

  const payNow = async () => {
    const order = placedRef.current;
    if (!order) return;
    setPaying(true);
    try {
      const r = await axios.post<RazorpayOrder>(`/api/orders/${order.orderId}/payments/razorpay`);
      await openRazorpay(order, r.data);
    } catch (cause) {
      setPaying(false);
      setError(errorText(cause, 'Online payment could not be started.'));
    }
  };

  // ---- placing the order -------------------------------------------------------------------------------------------

  const placeOrder = async () => {
    if (problem) {
      if (problem === 'Complete the delivery address.') setShowAddressErrors(true);
      setError(problem);
      return;
    }
    if (!quote || !method || !storefront) return;
    setPlacing(true);
    setError('');
    try {
      const body = placeRequest({ items: cart.items, coupon, storefront, method, address: delivery ? address : null, utr, expectedTotal: quote.total, note });
      const r = await axios.post<PlacedOrder>('/api/orders/checkout/place', body);
      if (delivery) saveAddress(window.localStorage, userKey, address);
      dispatch(clearCart());
      setPlaced(r.data);
      setParams((p) => { p.set('order', String(r.data.orderId)); return p; }, { replace: true });
      if (r.data.razorpay) await openRazorpay(r.data, r.data.razorpay);
      else if (r.data.paymentError) setError(r.data.paymentError);
    } catch (cause) {
      const status = (cause as { response?: { status?: number } })?.response?.status;
      setError(errorText(cause, 'Checkout failed. Your cart is unchanged; please try again.'));
      if (status === 409) setReload((n) => n + 1); // prices changed: show the new total before trying again
    } finally {
      setPlacing(false);
    }
  };

  // ---- after checkout ----------------------------------------------------------------------------------------------

  if (placed) {
    const paidOrDone = placed.paymentStatus === 'PAID' || placed.paymentMethod === 'COD' || placed.paymentMethod === 'UPI' || placed.paymentMethod === 'BANK_TRANSFER';
    const left = minutesLeft(placed.payBefore);
    const canPay = placed.paymentMethod === 'RAZORPAY' && placed.paymentStatus !== 'PAID' && placed.status === 'PAYMENT_PENDING';
    return (
      <Box sx={{ bgcolor: '#F8FAFC', minHeight: '80vh', py: 5 }}>
        <Container maxWidth="md">
          <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid #E2E8F0' }} aria-live="polite">
            <Stack alignItems="center" spacing={1.5} sx={{ textAlign: 'center', mb: 3 }}>
              {placed.status === 'CANCELLED'
                ? <ErrorOutlineRounded sx={{ fontSize: 56, color: '#B91C1C' }} />
                : <CheckCircleRounded sx={{ fontSize: 56, color: paidOrDone ? '#10B981' : '#F59E0B' }} />}
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                {placed.status === 'CANCELLED' ? 'Order cancelled' : paidOrDone ? 'Order placed' : 'Almost done: pay to confirm'}
              </Typography>
              <Typography color="text.secondary">Order <b>#{placed.orderId}</b> · {paymentStatusText(placed)}</Typography>
              {placed.message && <Alert severity="warning">{placed.message}</Alert>}
            </Stack>

            {canPay && (
              <Alert severity="info" sx={{ mb: 3 }} action={
                <Button variant="contained" onClick={() => void payNow()} disabled={paying} startIcon={paying ? <CircularProgress size={16} color="inherit" /> : <CreditCardRounded />}>
                  {paying ? 'Opening…' : `Pay ${m(placed.total)}`}
                </Button>}>
                Your order is reserved{left !== null ? ` for ${left} more minute${left === 1 ? '' : 's'}` : ''}. It is cancelled if it is not paid in time.
              </Alert>
            )}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {placed.paymentMethod === 'BANK_TRANSFER' && placed.bankDetails && (
              <Alert severity="info" icon={<AccountBalanceRounded />} sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                <b>Pay {m(placed.total)} to:</b>{'\n'}{placed.bankDetails}{'\n'}Use <b>Order {placed.orderId}</b> as the payment reference.
              </Alert>
            )}

            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <Box>
                <Typography variant="overline" color="text.secondary">Items</Typography>
                {placed.items.map((i) => (
                  <Row key={i.productId} label={`${i.name} × ${i.quantity}`} value={m(Number(i.unitPrice) * i.quantity)} />
                ))}
                {placed.deliveryAddress && (
                  <>
                    <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mt: 2 }}>Delivering to</Typography>
                    <Typography variant="body2">{placed.deliveryAddress}</Typography>
                  </>
                )}
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary">Payment</Typography>
                {placed.subtotal !== null && <Row label="Items" value={m(placed.subtotal)} />}
                {!!placed.discount && Number(placed.discount) > 0 && <Row label="Discount" value={`−${m(placed.discount)}`} tone="#059669" />}
                {placed.delivery !== null && <Row label="Delivery" value={Number(placed.delivery) === 0 ? 'Free' : m(placed.delivery)} />}
                {!!placed.tax && Number(placed.tax) > 0 && <Row label="Tax" value={m(placed.tax)} />}
                <Divider sx={{ my: 1 }} />
                <Row label="Total" value={m(placed.total)} strong />
              </Box>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" sx={{ mt: 4 }}>
              <Button variant="outlined" component={RouterLink} to="/orders/history">My orders</Button>
              <Button variant="contained" component={RouterLink} to="/products"
                onClick={() => { setPlaced(null); setParams((p) => { p.delete('order'); return p; }, { replace: true }); }}>Continue shopping</Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  // ---- checkout ----------------------------------------------------------------------------------------------------

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '80vh', py: 5 }}>
      <Container maxWidth="lg">
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <ShoppingCartOutlined sx={{ color: '#4F46E5', fontSize: 30 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.02em' }}>Checkout</Typography>
            <Typography color="text.secondary">Check your items, tell us where to deliver and choose how to pay.</Typography>
          </Box>
        </Stack>

        {cart.items.length === 0 ? (
          <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '1px solid #E2E8F0' }}>
            <ShoppingCartOutlined sx={{ fontSize: 56, color: '#CBD5E1' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, mt: 1 }}>Your cart is empty</Typography>
            <Button variant="contained" component={RouterLink} to="/products" sx={{ mt: 2 }}>Browse products</Button>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 380px' }, alignItems: 'start' }}>
            <Stack spacing={3}>
              {!user && <Alert severity="warning" action={<Button component={RouterLink} to="/login">Sign in</Button>}>Sign in to see your total and place the order.</Alert>}

              {/* Items */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0' }} component="section" aria-labelledby="items-title">
                <Typography id="items-title" variant="h6" sx={{ fontWeight: 800, mb: 1 }}>1. Items</Typography>
                {cart.items.map((item) => {
                  const line = lineOf(item.productId);
                  return (
                    <Stack key={item.productId} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.25, borderBottom: '1px solid #F1F5F9' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700 }} noWrap title={line?.name ?? item.name}>{line?.name ?? item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{line ? `${m(line.unitPrice)} each` : '…'}</Typography>
                      </Box>
                      <Stack direction="row" alignItems="center" sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
                        <IconButton size="small" aria-label={`One less ${item.name}`} onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity - 1 }))}
                          disabled={item.quantity <= 1}><RemoveRounded fontSize="small" /></IconButton>
                        <Typography sx={{ width: 32, textAlign: 'center', fontWeight: 700 }} aria-label={`Quantity of ${item.name}`}>{item.quantity}</Typography>
                        <IconButton size="small" aria-label={`One more ${item.name}`} onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity + 1 }))}>
                          <AddRounded fontSize="small" /></IconButton>
                      </Stack>
                      <Typography sx={{ width: 96, textAlign: 'right', fontWeight: 800 }}>{line ? m(line.lineTotal) : '…'}</Typography>
                      <IconButton aria-label={`Remove ${item.name}`} onClick={() => dispatch(removeFromCart(item.productId))}><DeleteOutlineRounded /></IconButton>
                    </Stack>
                  );
                })}
              </Paper>

              {/* Address */}
              {delivery && (
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0' }} component="section" aria-labelledby="address-title">
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <LocalShippingOutlined color="primary" />
                    <Typography id="address-title" variant="h6" sx={{ fontWeight: 800 }}>2. Delivery address</Typography>
                  </Stack>
                  {saved.length > 0 && (
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }} aria-label="Saved addresses">
                      {saved.slice(0, 4).map((s) => (
                        <Chip key={s.id} variant={address.line1 === s.street && address.postalCode === s.postalCode ? 'filled' : 'outlined'} color="primary"
                          label={`${s.street}, ${s.city}${s.isDefault ? ' (default)' : ''}`} onClick={() => setAddress((a) => fromSaved(a, s))} />
                      ))}
                    </Stack>
                  )}
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                    {([
                      ['fullName', 'Full name', 'name'], ['phone', 'Phone', 'tel'], ['line1', 'House / street', 'address-line1'], ['line2', 'Area / landmark (optional)', 'address-line2'],
                      ['city', 'City', 'address-level2'], ['state', 'State', 'address-level1'], ['postalCode', 'PIN / postal code', 'postal-code'], ['country', 'Country', 'country-name'],
                    ] as const).map(([key, label, autoComplete]) => (
                      <TextField key={key} label={label} value={address[key]} onChange={setField(key)} size="small" fullWidth
                        required={key !== 'line2' && key !== 'state' && key !== 'country'} inputProps={{ autoComplete }}
                        error={showAddressErrors && !!aErrors[key]} helperText={showAddressErrors ? aErrors[key] ?? ' ' : ' '} />
                    ))}
                  </Box>
                  <TextField label="Delivery instructions (optional)" value={note} onChange={(e) => setNote(e.target.value)} size="small" fullWidth multiline minRows={2}
                    inputProps={{ maxLength: 500 }} />
                </Paper>
              )}

              {/* Payment */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0' }} component="section" aria-labelledby="pay-title">
                <Typography id="pay-title" variant="h6" sx={{ fontWeight: 800, mb: 2 }}>{delivery ? '3.' : '2.'} Payment</Typography>
                {!quote && <Typography color="text.secondary">{quoting ? 'Loading payment options…' : 'Payment options appear with your total.'}</Typography>}
                <Stack spacing={1.25} role="radiogroup" aria-label="Payment method">
                  {quote?.paymentMethods.map((opt) => {
                    const selected = method === opt.code;
                    return (
                      <Paper key={opt.code} role="radio" aria-checked={selected} aria-disabled={!opt.available} tabIndex={opt.available ? 0 : -1} elevation={0}
                        onClick={() => opt.available && setMethod(opt.code)}
                        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && opt.available) { e.preventDefault(); setMethod(opt.code); } }}
                        sx={{ p: 2, borderRadius: 3, border: '2px solid', borderColor: selected ? '#4F46E5' : '#E2E8F0', bgcolor: selected ? 'rgba(79,70,229,.04)' : '#fff',
                          cursor: opt.available ? 'pointer' : 'not-allowed', opacity: opt.available ? 1 : 0.55, '&:focus-visible': { outline: '3px solid rgba(79,70,229,.4)' } }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{ color: selected ? '#4F46E5' : '#64748B', display: 'flex' }}>{METHOD_ICONS[opt.code]}</Box>
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography sx={{ fontWeight: 800 }}>{PAYMENT_LABELS[opt.code].title}</Typography>
                              {opt.code === 'ONLINE' && quote.razorpay?.testMode && <Chip size="small" color="warning" label="Test mode" />}
                            </Stack>
                            <Typography variant="body2" color="text.secondary">{opt.available ? PAYMENT_LABELS[opt.code].detail : opt.reason}</Typography>
                          </Box>
                        </Stack>
                        {selected && opt.code === 'UPI' && quote.upi && (
                          <Stack direction={{ xs: 'column', sm: quote.upi.uri ? 'row' : 'column' }} spacing={2.5} alignItems={{ sm: quote.upi.uri ? 'center' : 'stretch' }} sx={{ mt: 2 }} onClick={(e) => e.stopPropagation()}>
                            {quote.upi.uri
                              ? <Box sx={{ flexShrink: 0 }}><QrCode value={quote.upi.uri} size={180} label={`UPI QR code to pay ${m(quote.total)} to ${quote.upi.payeeName ?? quote.upi.vpa}`} /></Box>
                              : <Alert severity="info">UPI QR codes are for INR prices. Pay from your UPI app instead.</Alert>}
                            <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2">Pay <b>{m(quote.total)}</b> to <b>{quote.upi.vpa}</b>{quote.upi.payeeName ? ` (${quote.upi.payeeName})` : ''}, then enter the 12-digit UTR your UPI app shows.</Typography>
                              <TextField label="UPI reference (UTR)" value={utr} onChange={(e) => setUtr(e.target.value)} size="small" inputMode="numeric"
                                error={!!utr && !!utrProblem(utr)} helperText={utr && utrProblem(utr) ? utrProblem(utr) : 'The store checks it before processing the order.'}
                                inputProps={{ maxLength: 16 }} />
                            </Stack>
                          </Stack>
                        )}
                        {selected && opt.code === 'BANK_TRANSFER' && quote.bankDetails && (
                          <Typography variant="body2" sx={{ mt: 1.5, whiteSpace: 'pre-line', p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2 }}>{quote.bankDetails}</Typography>
                        )}
                      </Paper>
                    );
                  })}
                </Stack>
              </Paper>
            </Stack>

            {/* Summary */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0', position: { md: 'sticky' }, top: { md: 24 } }} component="aside" aria-labelledby="summary-title">
              <Typography id="summary-title" variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>Order summary</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <TextField size="small" fullWidth placeholder="Coupon code" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') setCoupon(couponInput); }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><DiscountRounded fontSize="small" /></InputAdornment> }} inputProps={{ 'aria-label': 'Coupon code', maxLength: 40 }} />
                {coupon && coupon === couponInput
                  ? <Button onClick={() => { setCoupon(''); setCouponInput(''); }}>Remove</Button>
                  : <Button variant="outlined" onClick={() => setCoupon(couponInput)} disabled={!couponInput.trim()}>Apply</Button>}
              </Stack>
              {quote?.coupon && (
                <Typography variant="caption" sx={{ display: 'block', mb: 1, color: quote.coupon.valid ? '#059669' : '#B91C1C' }} role="status">
                  {quote.coupon.valid ? `${quote.coupon.code} applied.` : quote.coupon.message || `${quote.coupon.code} cannot be used.`}
                </Typography>
              )}
              <Divider sx={{ my: 1 }} />
              {quoteError && <Alert severity="error" sx={{ my: 1 }}>{quoteError}</Alert>}
              {quote ? (
                <>
                  <Row label="Items" value={m(quote.subtotal)} />
                  {quote.discount > 0 && <Row label="Discount" value={`−${m(quote.discount)}`} tone="#059669" />}
                  {delivery && <Row label="Delivery" value={quote.delivery === 0 ? 'Free' : m(quote.delivery)} />}
                  {quote.amountForFreeDelivery !== null && quote.amountForFreeDelivery > 0 && (
                    <Typography variant="caption" color="text.secondary">Add {m(quote.amountForFreeDelivery)} more for free delivery.</Typography>
                  )}
                  {quote.tax > 0 && <Row label={`${quote.taxLabel} (${quote.taxRatePercent}%)${quote.taxIncluded ? ', included' : ''}`} value={m(quote.tax)} />}
                  <Divider sx={{ my: 1 }} />
                  <Row label="Total" value={quoting ? <CircularProgress size={18} /> : m(quote.total)} strong />
                </>
              ) : user && !quoteError ? (
                <Stack alignItems="center" sx={{ py: 3 }}><CircularProgress size={24} /></Stack>
              ) : null}
              {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
              <Button fullWidth variant="contained" size="large" sx={{ mt: 2, py: 1.5, fontWeight: 900, borderRadius: 3 }}
                disabled={placing || paying || quoting || !quote} onClick={() => void placeOrder()}
                startIcon={placing ? <CircularProgress size={18} color="inherit" /> : <LockRounded />}>
                {placing ? 'Placing order…' : method === 'ONLINE' && quote ? `Pay ${m(quote.total)}` : quote ? `Place order · ${m(quote.total)}` : 'Place order'}
              </Button>
              {problem && quote && !placing && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }} role="status">{problem}</Typography>}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, textAlign: 'center' }}>
                Prices, discounts, tax and delivery are confirmed by the store when you place the order.
              </Typography>
            </Paper>
          </Box>
        )}
      </Container>
    </Box>
  );
}
