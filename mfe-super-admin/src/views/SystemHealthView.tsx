import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, FormControlLabel, Stack, Switch, Table, TableBody, TableCell,
  TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import { RefreshRounded } from '@mui/icons-material';
import { request } from '../platformRequest';
import { formatDateTime, relativeTime } from '../adminModel';
import { cardSx, errorText, Metric, SectionHeader, StatusChip } from './common';

type Instance = { instanceId: string; uri: string; status: string; httpStatus: number | null; responseMs: number; error: string | null };
type ServiceHealth = { name: string; status: string; instanceCount: number; upInstances: number; instances: Instance[] };
type Snapshot = {
  status: string; checkedAt: string; durationMs: number; registryAvailable: boolean; expectedServices: string[];
  counts: Record<string, number>; total: number; services: ServiceHealth[];
};
type DlqSummary = { FAILED: number; REPLAYED: number; RESOLVED: number; total: number; oldestFailedAt: string | null };

const REFRESH_MS = 30_000;

export default function SystemHealthView({ token, canSeeDlq }: { token: string; canSeeDlq: boolean }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [dlq, setDlq] = useState<DlqSummary | null>(null);
  const [dlqError, setDlqError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(true);

  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const [health, backlog] = await Promise.all([
        request<Snapshot>('/api/platform/system/health', token),
        canSeeDlq ? request<DlqSummary>('/api/notifications/dlq/summary', token).then((value) => ({ value, error: '' }))
          .catch((cause) => ({ value: null, error: errorText(cause, 'Dead-letter backlog is unavailable.') })) : Promise.resolve(null),
      ]);
      setSnapshot(health);
      if (backlog) { setDlq(backlog.value); setDlqError(backlog.error); }
    } catch (cause) {
      setError(errorText(cause, 'Could not load platform health.'));
    } finally {
      setBusy(false);
    }
  }, [token, canSeeDlq]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!auto) return undefined;
    const timer = window.setInterval(() => { void load(); }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [auto, load]);

  const counts = snapshot?.counts || {};
  const problems = (counts.DOWN || 0) + (counts.DEGRADED || 0) + (counts.MISSING || 0);

  return (
    <Stack spacing={3}>
      <SectionHeader
        title="System health"
        subtitle="Every service registered in discovery, probed through its actuator health endpoint."
        actions={<>
          <FormControlLabel control={<Switch checked={auto} onChange={(event) => setAuto(event.target.checked)} />} label="Auto-refresh" />
          <Button startIcon={busy ? <CircularProgress size={16} /> : <RefreshRounded />} variant="outlined" onClick={() => void load()} disabled={busy} sx={{ textTransform: 'none' }}>Check now</Button>
        </>}
      />
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {snapshot && (
        <>
          <Card sx={cardSx}><CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="h6" fontWeight={800}>Platform</Typography>
                <StatusChip status={snapshot.status} />
                {!snapshot.registryAvailable && <Alert severity="error" sx={{ py: 0 }}>The service registry could not be read.</Alert>}
              </Stack>
              <Typography variant="body2" color="text.secondary" data-testid="health-checked-at">
                Checked {relativeTime(snapshot.checkedAt)} ({formatDateTime(snapshot.checkedAt)}) in {snapshot.durationMs} ms
              </Typography>
            </Stack>
          </CardContent></Card>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Metric label="Services up" value={`${counts.UP || 0} / ${snapshot.total}`} tone={problems ? undefined : 'success'} />
            <Metric label="Down or degraded" value={(counts.DOWN || 0) + (counts.DEGRADED || 0)} tone={(counts.DOWN || 0) + (counts.DEGRADED || 0) ? 'error' : undefined} />
            <Metric label="Expected but missing" value={counts.MISSING || 0} tone={counts.MISSING ? 'error' : undefined} />
            {canSeeDlq && <Metric label="Dead letters to handle" value={dlq ? dlq.FAILED : '—'} tone={dlq && dlq.FAILED > 0 ? 'warning' : undefined} />}
          </Stack>
          {dlqError && <Alert severity="warning">{dlqError}</Alert>}
          {dlq && dlq.FAILED > 0 && dlq.oldestFailedAt && (
            <Alert severity="warning">The oldest unhandled dead letter arrived {relativeTime(dlq.oldestFailedAt)}. Open Notifications &amp; DLQ to replay or resolve it.</Alert>
          )}
          <Card sx={cardSx}><CardContent>
            <Table size="small" aria-label="Service health">
              <TableHead><TableRow><TableCell>Service</TableCell><TableCell>Status</TableCell><TableCell>Instances</TableCell></TableRow></TableHead>
              <TableBody>
                {snapshot.services.map((service) => (
                  <TableRow key={service.name} data-testid={`service-${service.name}`}>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Typography fontWeight={700}>{service.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {service.status === 'MISSING' ? 'Expected, not registered' : `${service.upInstances} of ${service.instanceCount} instance(s) up`}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}><StatusChip status={service.status} /></TableCell>
                    <TableCell>
                      <Stack spacing={.75}>
                        {service.instances.map((instance) => (
                          <Stack key={instance.instanceId} direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <StatusChip status={instance.status} />
                            <Typography variant="body2" sx={{ fontFamily: 'ui-monospace, Consolas, monospace' }}>{instance.uri}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {instance.httpStatus ? `HTTP ${instance.httpStatus} · ` : ''}{instance.responseMs} ms
                            </Typography>
                            {instance.error && <Tooltip title={instance.error}><Typography variant="caption" color="error.main">{instance.error}</Typography></Tooltip>}
                          </Stack>
                        ))}
                        {!service.instances.length && <Typography variant="body2" color="text.secondary">—</Typography>}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!snapshot.services.length && (
                  <TableRow><TableCell colSpan={3}><Typography color="text.secondary" align="center" sx={{ py: 3 }}>No services are registered in discovery.</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent></Card>
          <Box><Typography variant="body2" color="text.secondary">
            UNKNOWN means the instance answered but its health endpoint is protected or absent; it does not count against the platform.
            {snapshot.expectedServices.length ? ` Expected services: ${snapshot.expectedServices.join(', ')}.` : ' Set platform.health.expected-services in user-service to flag services that should always be registered.'}
          </Typography></Box>
        </>
      )}
      {!snapshot && busy && <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>}
    </Stack>
  );
}
