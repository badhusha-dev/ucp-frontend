import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, InputAdornment, Paper, Stack, TextField,
  ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { ArrowDownwardRounded, ArrowUpwardRounded, LockRounded, PrintRounded, RefreshRounded } from '@mui/icons-material';
import { KpiCard } from '@ecommerce/shared-library/src/ui/KpiCard';
import { ErrorState, LoadingState } from '@ecommerce/shared-library/src/ui/StateViews';
import { posApi, type Me, type Shift, type ShiftReport } from '../api';
import { PAYMENT_LABELS, PAYMENT_METHODS, cashVariance, parseAmount } from '../posModel';
import { dateTime, money, time } from '../format';
import { OpenShiftCard } from '../components/OpenShiftCard';
import { printReceipt } from '../components/ReceiptView';

interface Props { me: Me; can: (permission: string) => boolean; onShiftChanged: () => void }

/** The cashier's drawer: live X report, cash in and out, and closing with a cash count (Z report). */
export function ShiftScreen({ me, can, onShiftChanged }: Props) {
  const currency = me.settings.currency;
  const m = (value: number | null | undefined) => money(value ?? 0, currency);
  const [report, setReport] = useState<ShiftReport | null>(null);
  const [closed, setClosed] = useState<ShiftReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [movement, setMovement] = useState<'CASH_IN' | 'CASH_OUT' | null>(null);
  const [closing, setClosing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const current = await posApi.currentShift();
      setReport(current.report ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The shift could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load, me.currentShift?.id]);

  if (loading && !report && !closed) return <LoadingState layout="cards" rows={4} label="Loading your shift" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  if (closed && !report) {
    return (
      <Stack spacing={2} sx={{ maxWidth: 720, mx: 'auto' }}>
        <Alert severity="success">Shift closed. Here is the end-of-shift (Z) report.</Alert>
        <ReportCard report={closed} currency={currency} />
        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Button startIcon={<PrintRounded />} onClick={printReceipt}>Print</Button>
          <Button variant="contained" onClick={() => setClosed(null)}>Open a new shift</Button>
        </Stack>
      </Stack>
    );
  }

  if (!report) {
    return <OpenShiftCard registers={me.registers} canOpen={can('pos:shift')} currency={currency}
      onOpened={() => { onShiftChanged(); void load(); }} />;
  }

  const shift = report.shift;
  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" gap={2}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h5" fontWeight={800}>{shift.registerName}</Typography>
              <Chip size="small" color="success" label="Open" />
            </Stack>
            <Typography color="text.secondary">Opened {dateTime(shift.openedAt)} by {shift.openedByEmail ?? 'you'} · float {m(shift.openingFloat)}</Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button startIcon={<RefreshRounded />} onClick={() => void load()}>Refresh</Button>
            <Button variant="outlined" startIcon={<ArrowDownwardRounded />} onClick={() => setMovement('CASH_IN')}>Cash in</Button>
            <Button variant="outlined" startIcon={<ArrowUpwardRounded />} onClick={() => setMovement('CASH_OUT')}>Cash out</Button>
            <Button variant="contained" color="error" startIcon={<LockRounded />} onClick={() => setClosing(true)}>Close shift</Button>
          </Stack>
        </Stack>
      </Paper>
      <ReportCard report={report} currency={currency} />
      <CashMovementDialog type={movement} shift={shift} currency={currency} drawer={report.expectedCash} onClose={() => setMovement(null)}
        onDone={(next) => { setReport(next); setMovement(null); }} />
      <CloseShiftDialog open={closing} shift={shift} currency={currency} expected={report.expectedCash} onClose={() => setClosing(false)}
        onClosed={(z) => { setClosing(false); setReport(null); setClosed(z); onShiftChanged(); }} />
      <Typography variant="caption" color="text.secondary">Last updated {time(new Date().toISOString())}</Typography>
    </Stack>
  );
}

function ReportCard({ report, currency }: { report: ShiftReport; currency: string }) {
  const m = (value: number | null | undefined) => money(value ?? 0, currency);
  const closed = report.shift.status === 'CLOSED';
  const variance = report.shift.cashVariance ?? 0;
  return (
    <Stack spacing={2} className="pos-print-area">
      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
        <KpiCard label="Sales" value={String(report.salesCount)} hint={m(report.grossSales)} />
        <KpiCard label="Net sales" value={m(report.netSales)} hint={report.refundsCount ? `${report.refundsCount} refund(s) ${m(report.refundsTotal)}` : 'No refunds'} />
        <KpiCard label={closed ? 'Counted cash' : 'Cash in drawer'} value={m(closed ? report.shift.countedCash : report.expectedCash)}
          hint={closed ? `Expected ${m(report.expectedCash)}` : 'Expected now'} tone={closed && variance !== 0 ? 'attention' : 'neutral'} />
        <KpiCard label="Discounts given" value={m(report.discounts)} hint={`Tax collected ${m(report.tax)}`} />
      </Box>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography fontWeight={800} sx={{ mb: 1.5 }}>Cash drawer</Typography>
          <Stack spacing={0.75}>
            <Line label="Opening float" value={m(report.shift.openingFloat)} />
            <Line label="+ Cash sales (after change)" value={m(report.cashSales)} />
            <Line label="− Cash refunds" value={m(report.cashRefunds)} />
            <Line label="+ Cash in" value={m(report.cashIn)} />
            <Line label="− Cash out" value={m(report.cashOut)} />
            <Divider />
            <Line label="Expected in drawer" value={m(report.expectedCash)} strong />
            {closed && <Line label="Counted" value={m(report.shift.countedCash)} strong />}
            {closed && (
              <Line label="Over / short" value={`${variance > 0 ? '+' : ''}${m(variance)}`} strong
                tone={variance === 0 ? 'success.main' : variance > 0 ? 'info.main' : 'error.main'} />
            )}
            {closed && report.shift.closeNote && <Typography variant="body2" color="text.secondary">Note: {report.shift.closeNote}</Typography>}
          </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography fontWeight={800} sx={{ mb: 1.5 }}>Takings by payment</Typography>
          <Stack spacing={1.25}>
            {PAYMENT_METHODS.map((method) => {
              const value = Number(report.takings[method] ?? 0);
              const max = Math.max(1, ...PAYMENT_METHODS.map((k) => Math.abs(Number(report.takings[k] ?? 0))));
              return (
                <Box key={method}>
                  <Stack direction="row" justifyContent="space-between"><Typography>{PAYMENT_LABELS[method]}</Typography><Typography fontWeight={700}>{m(value)}</Typography></Stack>
                  <Box sx={{ mt: 0.5, height: 8, borderRadius: 4, bgcolor: '#EEF2FF', overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${Math.round((Math.abs(value) / max) * 100)}%`, bgcolor: method === 'CASH' ? '#16A34A' : method === 'CARD' ? '#4F46E5' : '#F59E0B' }} />
                  </Box>
                </Box>
              );
            })}
          </Stack>
          {closed && <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Closed {dateTime(report.shift.closedAt)}</Typography>}
        </Paper>
      </Box>
    </Stack>
  );
}

function Line({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: string }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography color={strong ? 'text.primary' : 'text.secondary'} fontWeight={strong ? 700 : 400}>{label}</Typography>
      <Typography fontWeight={strong ? 800 : 600} color={tone}>{value}</Typography>
    </Stack>
  );
}

const CASH_REASONS = { CASH_IN: ['Float top-up', 'Change from bank'], CASH_OUT: ['Bank deposit', 'Petty cash', 'Supplier paid in cash'] };

function CashMovementDialog({ type, shift, currency, drawer, onClose, onDone }: {
  type: 'CASH_IN' | 'CASH_OUT' | null; shift: Shift; currency: string; drawer: number; onClose: () => void; onDone: (report: ShiftReport) => void;
}) {
  const [amountText, setAmountText] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (type) { setAmountText(''); setReason(''); setError(''); } }, [type]);
  const amount = parseAmount(amountText);
  const tooMuch = type === 'CASH_OUT' && amount > drawer;
  const save = async () => {
    if (!type) return;
    setBusy(true);
    setError('');
    try { onDone(await posApi.cashMovement(shift.id, type, amount, reason.trim())); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not record the cash movement.'); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open={!!type} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{type === 'CASH_IN' ? 'Put cash into the drawer' : 'Take cash out of the drawer'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Amount" value={amountText} onChange={(e) => setAmountText(e.target.value)} autoFocus inputMode="decimal"
            error={tooMuch} helperText={tooMuch ? `Only ${money(drawer, currency)} should be in the drawer.` : type === 'CASH_OUT' ? `In drawer now: ${money(drawer, currency)}` : ' '}
            InputProps={{ startAdornment: <InputAdornment position="start">{currency}</InputAdornment> }} />
          <TextField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} inputProps={{ maxLength: 200 }} />
          <Stack direction="row" gap={1} flexWrap="wrap">
            {type && CASH_REASONS[type].map((text) => <Chip key={text} label={text} onClick={() => setReason(text)} variant={reason === text ? 'filled' : 'outlined'} />)}
          </Stack>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={busy || !(amount > 0) || tooMuch || !reason.trim()} onClick={() => void save()}>Record</Button>
      </DialogActions>
    </Dialog>
  );
}

function CloseShiftDialog({ open, shift, currency, expected, onClose, onClosed }: {
  open: boolean; shift: Shift; currency: string; expected: number; onClose: () => void; onClosed: (report: ShiftReport) => void;
}) {
  const [countedText, setCountedText] = useState('');
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<'total' | 'notes'>('total');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (open) { setCountedText(''); setNote(''); setError(''); setMode('total'); } }, [open]);
  const counted = parseAmount(countedText);
  const variance = Number.isFinite(counted) ? cashVariance(expected, counted) : 0;
  const needsNote = Number.isFinite(counted) && variance !== 0;
  const save = async () => {
    setBusy(true);
    setError('');
    try { onClosed(await posApi.closeShift(shift.id, counted, note.trim())); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The shift could not be closed.'); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Close shift on {shift.registerName}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography color="text.secondary">Count the cash in the drawer and enter the total. The difference from what is expected is recorded.</Typography>
          <ToggleButtonGroup exclusive size="small" value={mode} onChange={(_, v: 'total' | 'notes' | null) => v && setMode(v)}>
            <ToggleButton value="total">Enter total</ToggleButton>
            <ToggleButton value="notes">Count notes & coins</ToggleButton>
          </ToggleButtonGroup>
          {mode === 'notes' && <DenominationCounter currency={currency} onTotal={(total) => setCountedText(total.toFixed(2))} />}
          <TextField label="Counted cash" value={countedText} onChange={(e) => setCountedText(e.target.value)} autoFocus inputMode="decimal"
            InputProps={{ startAdornment: <InputAdornment position="start">{currency}</InputAdornment> }} />
          <Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">Expected</Typography><Typography fontWeight={700}>{money(expected, currency)}</Typography></Stack>
          {Number.isFinite(counted) && (
            <Alert severity={variance === 0 ? 'success' : 'warning'}>
              {variance === 0 ? 'The drawer balances.' : `${variance > 0 ? 'Over' : 'Short'} by ${money(Math.abs(variance), currency)}.`}
            </Alert>
          )}
          <TextField label={needsNote ? 'Note (required)' : 'Note (optional)'} value={note} onChange={(e) => setNote(e.target.value)} multiline minRows={2}
            inputProps={{ maxLength: 300 }} error={needsNote && !note.trim()} />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="error" disabled={busy || !Number.isFinite(counted) || counted < 0 || (needsNote && !note.trim())} onClick={() => void save()}>
          {busy ? 'Closing…' : 'Close shift'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const DENOMINATIONS = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

/** Optional helper: count each note and coin, and the total fills itself in. */
function DenominationCounter({ currency, onTotal }: { currency: string; onTotal: (total: number) => void }) {
  const [counts, setCounts] = useState<Record<number, string>>({});
  const total = DENOMINATIONS.reduce((sum, d) => sum + d * (parseInt(counts[d] || '0', 10) || 0), 0);
  const report = useRef(onTotal);
  report.current = onTotal;
  useEffect(() => { report.current(total); }, [total]);
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
      {DENOMINATIONS.map((d) => (
        <TextField key={d} size="small" label={`${d} ${currency}`} value={counts[d] ?? ''} inputMode="numeric" placeholder="0"
          onChange={(e) => setCounts((c) => ({ ...c, [d]: e.target.value.replace(/\D/g, '') }))} />
      ))}
    </Box>
  );
}
