import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack,
  Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography,
} from '@mui/material';
import { RefreshRounded, SearchRounded } from '@mui/icons-material';
import { request } from '../platformRequest';
import { formatDateTime, humanize, isAccountId, prettyJson, queryString, relativeTime, truncate } from '../adminModel';
import { cardSx, ConfirmDialog, type ConfirmState, errorText, Metric, SectionHeader, StatusChip } from './common';
import type { Account } from './UsersView';

type DeadLetter = { id: number; topic: string; partitionId: number | null; offsetNumber: number | null; payload: string; exceptionMessage: string; status: string; createdAt: string };
type DlqSummary = { FAILED: number; REPLAYED: number; RESOLVED: number; total: number; oldestFailedAt: string | null };
type Notification = { id: number; userId: number; type: string; message: string; read?: boolean; isRead?: boolean; createdAt: string };

export default function NotificationsView({ token, canLookUpUsers }: { token: string; canLookUpUsers: boolean }) {
  const [tab, setTab] = useState<'dlq' | 'user'>('dlq');
  return (
    <Stack spacing={3}>
      <SectionHeader title="Notifications & DLQ" subtitle="Replay or close messages that failed processing, and look up what any customer was told." />
      <Tabs value={tab} onChange={(_, value) => setTab(value)} aria-label="Notification tools">
        <Tab value="dlq" label="Dead-letter queue" sx={{ textTransform: 'none', fontWeight: 700 }} />
        <Tab value="user" label="Customer notifications" sx={{ textTransform: 'none', fontWeight: 700 }} />
      </Tabs>
      {tab === 'dlq' ? <DeadLetters token={token} /> : <CustomerNotifications token={token} canLookUpUsers={canLookUpUsers} />}
    </Stack>
  );
}

function DeadLetters({ token }: { token: string }) {
  const [status, setStatus] = useState('FAILED');
  const [items, setItems] = useState<DeadLetter[]>([]);
  const [summary, setSummary] = useState<DlqSummary | null>(null);
  const [selected, setSelected] = useState<DeadLetter | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const [list, counts] = await Promise.all([
        request<DeadLetter[]>(`/api/notifications/dlq${queryString({ status })}`, token),
        request<DlqSummary>('/api/notifications/dlq/summary', token),
      ]);
      setItems(list); setSummary(counts);
    } catch (cause) {
      setError(errorText(cause, 'Could not load the dead-letter queue.'));
    } finally {
      setBusy(false);
    }
  }, [status, token]);

  useEffect(() => { void load(); }, [load]);

  const act = async (event: DeadLetter, action: 'replay' | 'resolve') => {
    setBusy(true); setError(''); setNotice('');
    try {
      await request(`/api/notifications/dlq/${event.id}/${action}`, token, 'POST');
      setNotice(action === 'replay' ? `Event #${event.id} was sent back to its topic.` : `Event #${event.id} is resolved.`);
      setConfirm(null); setSelected(null);
      await load();
    } catch (cause) {
      setError(errorText(cause, `Could not ${action} event #${event.id}.`)); setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  const askReplay = (event: DeadLetter) => setConfirm({
    title: `Replay event #${event.id}`,
    message: `Publish the payload again to the topic it came from (${event.topic.replace(/[-._](dlt|dlq)$/i, '')})? Consumers skip messages they already processed.`,
    confirmLabel: 'Replay', onConfirm: () => act(event, 'replay'),
  });
  const askResolve = (event: DeadLetter) => setConfirm({
    title: `Resolve event #${event.id}`,
    message: 'Close this event without replaying it (for example when the data was fixed at the source)?',
    confirmLabel: 'Resolve', onConfirm: () => act(event, 'resolve'),
  });

  return (
    <Stack spacing={2.5}>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {notice && <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert>}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Metric label="Failed" value={summary ? summary.FAILED : '—'} tone={summary && summary.FAILED > 0 ? 'error' : undefined} />
        <Metric label="Replayed" value={summary ? summary.REPLAYED : '—'} />
        <Metric label="Resolved" value={summary ? summary.RESOLVED : '—'} tone={summary && summary.RESOLVED > 0 ? 'success' : undefined} />
      </Stack>
      {summary?.oldestFailedAt && <Typography variant="body2" color="text.secondary">Oldest unhandled failure: {relativeTime(summary.oldestFailedAt)} ({formatDateTime(summary.oldestFailedAt)}).</Typography>}
      <Card sx={cardSx}><CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <TextField select size="small" label="Status" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="FAILED">Failed</MenuItem><MenuItem value="REPLAYED">Replayed</MenuItem><MenuItem value="RESOLVED">Resolved</MenuItem><MenuItem value="">All</MenuItem>
          </TextField>
          <Button startIcon={busy ? <CircularProgress size={16} /> : <RefreshRounded />} onClick={() => void load()} disabled={busy} sx={{ textTransform: 'none' }}>Refresh</Button>
        </Stack>
        <Table size="small" aria-label="Dead letters">
          <TableHead><TableRow><TableCell>#</TableCell><TableCell>Topic</TableCell><TableCell>Status</TableCell><TableCell>Arrived</TableCell><TableCell>Error</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {items.map((event) => (
              <TableRow key={event.id} hover>
                <TableCell>{event.id}</TableCell>
                <TableCell><Typography variant="body2" sx={{ fontFamily: 'ui-monospace, Consolas, monospace' }}>{event.topic}</Typography>
                  <Typography variant="caption" color="text.secondary">{event.partitionId != null ? `partition ${event.partitionId}` : ''}{event.offsetNumber != null ? ` · offset ${event.offsetNumber}` : ''}</Typography></TableCell>
                <TableCell><StatusChip status={event.status} /></TableCell>
                <TableCell>{relativeTime(event.createdAt)}</TableCell>
                <TableCell sx={{ maxWidth: 320 }}><Typography variant="body2" color="error.main">{truncate(event.exceptionMessage, 90)}</Typography></TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Button size="small" onClick={() => setSelected(event)} sx={{ textTransform: 'none' }}>View</Button>
                  <Button size="small" disabled={busy || event.status === 'RESOLVED'} onClick={() => askReplay(event)} sx={{ textTransform: 'none' }}>Replay</Button>
                  <Button size="small" color="success" disabled={busy || event.status === 'RESOLVED'} onClick={() => askResolve(event)} sx={{ textTransform: 'none' }}>Resolve</Button>
                </TableCell>
              </TableRow>
            ))}
            {!items.length && <TableRow><TableCell colSpan={6}><Typography color="text.secondary" align="center" sx={{ py: 3 }}>{busy ? 'Loading…' : 'Nothing in the dead-letter queue for this filter.'}</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>
      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="md">
        <DialogTitle>Dead letter #{selected?.id}</DialogTitle>
        <DialogContent dividers>
          {selected && <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center"><StatusChip status={selected.status} /><Typography variant="body2">{selected.topic} · arrived {formatDateTime(selected.createdAt)}</Typography></Stack>
            <Box><Typography fontWeight={800}>Error</Typography><Typography variant="body2" color="error.main" sx={{ whiteSpace: 'pre-wrap' }}>{selected.exceptionMessage}</Typography></Box>
            <Box><Typography fontWeight={800}>Payload</Typography>
              <Box component="pre" sx={{ m: 0, p: 2, bgcolor: '#0F172A', color: '#E2E8F0', borderRadius: 2, overflow: 'auto', maxHeight: 360, fontSize: 13 }}>{prettyJson(selected.payload)}</Box></Box>
          </Stack>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {selected && selected.status !== 'RESOLVED' && <>
            <Button onClick={() => askReplay(selected)} disabled={busy} sx={{ textTransform: 'none' }}>Replay</Button>
            <Button color="success" onClick={() => askResolve(selected)} disabled={busy} sx={{ textTransform: 'none' }}>Resolve</Button>
          </>}
          <Button onClick={() => setSelected(null)} sx={{ textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog state={confirm} busy={busy} onClose={() => setConfirm(null)} />
    </Stack>
  );
}

function CustomerNotifications({ token, canLookUpUsers }: { token: string; canLookUpUsers: boolean }) {
  const [lookup, setLookup] = useState('');
  const [account, setAccount] = useState<{ id: number; email?: string } | null>(null);
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const find = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = lookup.trim();
    if (!text) return;
    setBusy(true); setError(''); setItems(null); setAccount(null);
    try {
      let target: { id: number; email?: string };
      if (isAccountId(text)) target = { id: Number(text) };
      else {
        if (!canLookUpUsers) throw new Error('Searching by email needs the platform:users.read permission; enter the account id instead.');
        const page = await request<{ items: Account[] }>(`/api/platform/users${queryString({ q: text, size: 5 })}`, token);
        const exact = page.items.find((candidate) => candidate.email.toLowerCase() === text.toLowerCase()) || (page.items.length === 1 ? page.items[0] : undefined);
        if (!exact) throw new Error(page.items.length ? 'Several accounts match; enter the full email or the account id.' : 'No account matches.');
        target = { id: exact.id, email: exact.email };
      }
      setAccount(target);
      setItems(await request<Notification[]>(`/api/notifications/user/${target.id}`, token));
    } catch (cause) {
      setError(errorText(cause, 'Could not load notifications.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Card sx={cardSx}><CardContent>
        <Stack component="form" onSubmit={find} direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField label="Customer email or account id" value={lookup} onChange={(event) => setLookup(event.target.value)} fullWidth />
          <Button type="submit" variant="contained" startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <SearchRounded />} disabled={busy || !lookup.trim()} sx={{ minWidth: 150, textTransform: 'none' }}>Look up</Button>
        </Stack>
      </CardContent></Card>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {items && account && (
        <Card sx={cardSx}><CardContent>
          <Typography fontWeight={800} sx={{ mb: 1 }}>{items.length} notification(s) for {account.email || `account #${account.id}`}</Typography>
          <Table size="small" aria-label="Customer notifications">
            <TableHead><TableRow><TableCell>Sent</TableCell><TableCell>Type</TableCell><TableCell>Message</TableCell><TableCell>Read</TableCell></TableRow></TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(item.createdAt)}</TableCell>
                  <TableCell>{humanize(item.type)}</TableCell>
                  <TableCell>{item.message}</TableCell>
                  <TableCell>{(item.read ?? item.isRead) ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              ))}
              {!items.length && <TableRow><TableCell colSpan={4}><Typography color="text.secondary" align="center" sx={{ py: 3 }}>No notifications for this account.</Typography></TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}
    </Stack>
  );
}
