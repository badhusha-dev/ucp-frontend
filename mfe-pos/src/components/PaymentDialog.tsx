import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, InputAdornment, Stack, TextField,
  ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { AccountBalanceWalletOutlined, CloseRounded, CreditCardRounded, DeleteOutlineRounded, PaymentsRounded } from '@mui/icons-material';
import { PAYMENT_LABELS, parseAmount, paymentState, quickCashAmounts, round2, type PaymentMethod, type TenderLine } from '../posModel';
import { money } from '../format';

const ICONS: Record<PaymentMethod, ReactNode> = {
  CASH: <PaymentsRounded />, CARD: <CreditCardRounded />, OTHER: <AccountBalanceWalletOutlined />,
};

/** Take payment: one or more tenders (split payment), change from cash, and an optional note on the receipt. */
export function PaymentDialog({ open, due, currency, busy, error, onClose, onComplete }: {
  open: boolean; due: number; currency: string; busy: boolean; error: string;
  onClose: () => void; onComplete: (tenders: TenderLine[], note: string) => void;
}) {
  const [tenders, setTenders] = useState<TenderLine[]>([]);
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [amountText, setAmountText] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) { setTenders([]); setMethod('CASH'); setAmountText(round2(due).toFixed(2)); setReference(''); setNote(''); }
  }, [open, due]);

  const state = useMemo(() => paymentState(due, tenders), [due, tenders]);
  const amount = parseAmount(amountText);
  const m = (value: number) => money(value, currency);
  const tooMuchNonCash = method !== 'CASH' && amount > state.remaining + 0.0001;

  const add = (value: number, how: PaymentMethod = method) => {
    if (!(value > 0)) return;
    const next = [...tenders, { method: how, amount: round2(value), reference: how === 'CASH' ? undefined : reference.trim() || undefined }];
    setTenders(next);
    setReference('');
    setAmountText(paymentState(due, next).remaining.toFixed(2));
  };

  const complete = (list: TenderLine[]) => { if (!busy) onComplete(list, note.trim()); };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="pos-payment-title">
      <DialogTitle id="pos-payment-title" sx={{ pr: 7 }}>
        Take payment
        <IconButton aria-label="Close" onClick={onClose} disabled={busy} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseRounded /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="overline" color="text.secondary">Amount due</Typography>
            <Typography sx={{ fontSize: { xs: 38, sm: 46 }, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.1 }}>{m(due)}</Typography>
          </Box>

          <ToggleButtonGroup exclusive fullWidth value={method} onChange={(_, value: PaymentMethod | null) => {
            if (!value) return;
            setMethod(value);
            if (value !== 'CASH' && amount > state.remaining) setAmountText(state.remaining.toFixed(2));
          }} aria-label="Payment method">
            {(['CASH', 'CARD', 'OTHER'] as PaymentMethod[]).map((key) => (
              <ToggleButton key={key} value={key} sx={{ py: 1.5, gap: 1, fontWeight: 700 }}>{ICONS[key]}{PAYMENT_LABELS[key]}</ToggleButton>
            ))}
          </ToggleButtonGroup>

          {method === 'CASH' && state.remaining > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">Customer hands over</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 0.75 }}>
                {quickCashAmounts(state.remaining).map((value, index) => (
                  <Chip key={value} label={index === 0 ? `Exact ${m(value)}` : m(value)} onClick={() => add(value, 'CASH')} disabled={busy}
                    color={index === 0 ? 'primary' : 'default'} variant={index === 0 ? 'filled' : 'outlined'} sx={{ fontWeight: 700, height: 38, px: 0.5 }} />
                ))}
              </Stack>
            </Box>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField label={`${PAYMENT_LABELS[method]} amount`} value={amountText} onChange={(e) => setAmountText(e.target.value)} inputMode="decimal" fullWidth
              autoFocus error={Number.isNaN(amount) || tooMuchNonCash}
              helperText={tooMuchNonCash ? `Card and other can be at most ${m(state.remaining)}.` : ' '}
              InputProps={{ startAdornment: <InputAdornment position="start">{currency}</InputAdornment> }}
              onKeyDown={(e) => { if (e.key === 'Enter' && amount > 0 && !tooMuchNonCash) add(amount); }} />
            {method !== 'CASH' && (
              <TextField label="Reference (optional)" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Approval code or last 4"
                inputProps={{ maxLength: 80 }} fullWidth helperText=" " />
            )}
          </Stack>
          <Button variant="outlined" onClick={() => add(amount)} disabled={busy || !(amount > 0) || tooMuchNonCash || state.remaining === 0}>
            Add {PAYMENT_LABELS[method].toLowerCase()} payment
          </Button>

          {tenders.length > 0 && (
            <Stack spacing={1}>
              {tenders.map((tender, index) => (
                <Stack key={index} direction="row" alignItems="center" spacing={1.5} sx={{ px: 1.5, py: 1, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  {ICONS[tender.method]}
                  <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>{PAYMENT_LABELS[tender.method]}{tender.reference ? ` · ${tender.reference}` : ''}</Typography>
                  <Typography fontWeight={700}>{m(tender.amount)}</Typography>
                  <IconButton size="small" aria-label={`Remove ${PAYMENT_LABELS[tender.method]} payment`} disabled={busy}
                    onClick={() => { const next = tenders.filter((_, i) => i !== index); setTenders(next); setAmountText(paymentState(due, next).remaining.toFixed(2)); }}>
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          )}

          <Divider />
          <Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">Paid</Typography><Typography fontWeight={700}>{m(state.paid)}</Typography></Stack>
          {state.remaining > 0 && (
            <Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">Still to pay</Typography><Typography fontWeight={800} color="warning.main">{m(state.remaining)}</Typography></Stack>
          )}
          {state.change > 0 && (
            <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(22,163,74,.1)', color: '#166534', textAlign: 'center' }}>
              <Typography variant="overline">Change to give</Typography>
              <Typography sx={{ fontSize: 32, fontWeight: 800 }}>{m(state.change)}</Typography>
            </Box>
          )}
          {state.problem && tenders.length > 0 && <Alert severity="warning">{state.problem}</Alert>}
          <TextField label="Note on receipt (optional)" value={note} onChange={(e) => setNote(e.target.value)} inputProps={{ maxLength: 200 }} size="small" />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={busy}>Back to cart</Button>
        <Button variant="contained" color="success" size="large" disabled={busy || !state.canComplete} onClick={() => complete(tenders)}
          sx={{ minWidth: 200, minHeight: 48, fontWeight: 800 }}>
          {busy ? 'Saving…' : 'Complete sale'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
