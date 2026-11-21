import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { RefreshRounded, SyncProblemRounded } from '@mui/icons-material';
import { KpiCard } from '@ecommerce/shared-library/src/ui/KpiCard';
import { EmptyState, ErrorState, LoadingState } from '@ecommerce/shared-library/src/ui/StateViews';
import { posApi, type Me, type Shift, type StockMove, type Summary } from '../api';
import { PAYMENT_LABELS, PAYMENT_METHODS, RANGE_LABELS, dateRange, type RangeKey } from '../posModel';
import { dateTime, money } from '../format';

interface Props { me: Me; can: (permission: string) => boolean }

/** Store performance for a period: sales, refunds, takings by payment, best sellers, shifts and stock sync. */
export function ReportsScreen({ me, can }: Props) {
  const [range, setRange] = useState<RangeKey>('today');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const currency = summary?.currency ?? me.settings.currency;
  const m = (value: number | null | undefined) => money(value ?? 0, currency);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { from, to } = dateRange(range);
      const [s, recent, problems] = await Promise.all([posApi.summary(from, to), posApi.recentShifts(), posApi.stockMoves('REJECTED')]);
      setSummary(s);
      setShifts(recent);
      setMoves(problems);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The report could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { void load(); }, [load]);

  const retry = async () => {
    try {
      const result = await posApi.retryStockMoves();
      setNotice(`${result.queued} stock update${result.queued === 1 ? '' : 's'} sent again.`);
      void load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Retry failed.');
    }
  };

  const maxTaking = summary ? Math.max(1, ...PAYMENT_METHODS.map((k) => Math.abs(Number(summary.takings[k] ?? 0)))) : 1;

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={1.5}>
        <ToggleButtonGroup size="small" exclusive value={range} onChange={(_, v: RangeKey | null) => v && setRange(v)}>
          {(Object.keys(RANGE_LABELS) as RangeKey[]).map((key) => <ToggleButton key={key} value={key}>{RANGE_LABELS[key]}</ToggleButton>)}
        </ToggleButtonGroup>
        <Button startIcon={<RefreshRounded />} onClick={() => void load()}>Refresh</Button>
      </Stack>
      {notice && <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert>}
      {loading && !summary && <LoadingState layout="cards" rows={4} label="Loading the report" />}
      {error && <ErrorState message={error} onRetry={() => void load()} />}
      {summary && (
        <>
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' } }}>
            <KpiCard label="Net sales" value={m(summary.netSales)} hint={`${summary.from === summary.to ? summary.from : `${summary.from} – ${summary.to}`}`} />
            <KpiCard label="Sales" value={String(summary.salesCount)} hint={m(summary.grossSales)} />
            <KpiCard label="Average sale" value={m(summary.averageSale)} />
            <KpiCard label="Refunds" value={m(summary.refunds)}
              hint={summary.grossSales > 0 ? `${Math.round((summary.refunds / summary.grossSales) * 1000) / 10}% of sales` : 'No sales yet'} />
            <KpiCard label="Discounts" value={m(summary.discounts)} />
            <KpiCard label="Tax collected" value={m(summary.tax)} />
          </Box>
          {(summary.stockMovesRejected > 0 || summary.stockMovesPending > 0) && (
            <Alert severity={summary.stockMovesRejected > 0 ? 'warning' : 'info'} icon={<SyncProblemRounded />}
              action={can('pos:manage') && summary.stockMovesRejected > 0 ? <Button color="inherit" size="small" onClick={() => void retry()}>Retry</Button> : undefined}>
              {summary.stockMovesRejected > 0 && `${summary.stockMovesRejected} stock update(s) were refused by Stock (usually stock below zero). `}
              {summary.stockMovesPending > 0 && `${summary.stockMovesPending} waiting to be sent.`}
            </Alert>
          )}
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1.4fr' } }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography fontWeight={800} sx={{ mb: 2 }}>Net takings by payment</Typography>
              <Stack spacing={1.75}>
                {PAYMENT_METHODS.map((method) => {
                  const value = Number(summary.takings[method] ?? 0);
                  return (
                    <Box key={method}>
                      <Stack direction="row" justifyContent="space-between"><Typography>{PAYMENT_LABELS[method]}</Typography><Typography fontWeight={700}>{m(value)}</Typography></Stack>
                      <Box sx={{ mt: 0.5, height: 10, borderRadius: 5, bgcolor: '#EEF2FF', overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${Math.round((Math.abs(value) / maxTaking) * 100)}%`, borderRadius: 5,
                          bgcolor: method === 'CASH' ? '#16A34A' : method === 'CARD' ? '#4F46E5' : '#F59E0B' }} />
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography fontWeight={800} sx={{ mb: 1 }}>Best sellers</Typography>
              {summary.topProducts.length === 0 ? <EmptyState compact title="No sales in this period" /> : (
                <Table size="small">
                  <TableHead><TableRow><TableCell>#</TableCell><TableCell>Product</TableCell><TableCell align="right">Sold</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
                  <TableBody>
                    {summary.topProducts.map((p, i) => (
                      <TableRow key={p.productId}><TableCell>{i + 1}</TableCell><TableCell>{p.name}</TableCell><TableCell align="right">{p.quantity}</TableCell><TableCell align="right">{m(p.amount)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Paper>
          </Box>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, overflowX: 'auto' }}>
            <Typography fontWeight={800} sx={{ mb: 1 }}>Recent shifts</Typography>
            {shifts.length === 0 ? <EmptyState compact title="No shifts yet" /> : (
              <Table size="small">
                <TableHead><TableRow><TableCell>Opened</TableCell><TableCell>Register</TableCell><TableCell>Cashier</TableCell><TableCell>Status</TableCell>
                  <TableCell align="right">Expected</TableCell><TableCell align="right">Counted</TableCell><TableCell align="right">Over / short</TableCell></TableRow></TableHead>
                <TableBody>
                  {shifts.map((s) => {
                    const variance = Number(s.cashVariance ?? 0);
                    return (
                      <TableRow key={s.id} hover>
                        <TableCell>{dateTime(s.openedAt)}</TableCell><TableCell>{s.registerName}</TableCell><TableCell>{s.openedByEmail ?? '—'}</TableCell>
                        <TableCell><Chip size="small" label={s.status === 'OPEN' ? 'Open' : 'Closed'} color={s.status === 'OPEN' ? 'success' : 'default'} /></TableCell>
                        <TableCell align="right">{s.expectedCash === null ? '—' : m(s.expectedCash)}</TableCell>
                        <TableCell align="right">{s.countedCash === null ? '—' : m(s.countedCash)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: s.status !== 'CLOSED' ? 'text.secondary' : variance === 0 ? 'success.main' : variance > 0 ? 'info.main' : 'error.main' }}>
                          {s.status !== 'CLOSED' ? '—' : `${variance > 0 ? '+' : ''}${m(variance)}`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Paper>
          {moves.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, overflowX: 'auto' }}>
              <Typography fontWeight={800} sx={{ mb: 1 }}>Stock updates refused</Typography>
              <Table size="small">
                <TableHead><TableRow><TableCell>When</TableCell><TableCell>Document</TableCell><TableCell>Product</TableCell><TableCell align="right">Change</TableCell><TableCell>Reason</TableCell></TableRow></TableHead>
                <TableBody>
                  {moves.map((move) => (
                    <TableRow key={move.id}><TableCell>{dateTime(move.createdAt)}</TableCell><TableCell>{move.reference}</TableCell><TableCell>#{move.productId}</TableCell>
                      <TableCell align="right">{move.delta > 0 ? `+${move.delta}` : move.delta}</TableCell><TableCell sx={{ maxWidth: 360 }}>{move.lastError ?? '—'}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </>
      )}
    </Stack>
  );
}
