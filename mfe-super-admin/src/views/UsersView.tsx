import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  IconButton, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { CloseRounded, ContentCopyRounded, SearchRounded } from '@mui/icons-material';
import { request } from '../platformRequest';
import { formatDateTime, humanize, LOCK_DURATIONS, queryString, relativeTime } from '../adminModel';
import { cardSx, ConfirmDialog, type ConfirmState, errorText, SectionHeader, StatusChip } from './common';

export type Account = {
  id: number; email: string; name: string | null; role: string; active: boolean; locked: boolean; lockedUntil: string | null;
  failedLoginAttempts: number; status: string; lastSignInAt: string | null; activeSessions: number;
};
type AccountPage = { items: Account[]; page: number; size: number; total: number; roles: string[] };
type Session = { id: string; kind: string; applicationCode: string | null; tenant: string | null; issuedAt: string; expiresAt: string; ipAddress: string | null; userAgent: string | null };
type SecurityEvent = { id: number; type: string; applicationCode: string | null; tenantSlug: string | null; ipAddress: string | null; createdAt: string };
type Membership = { tenantId: string; slug: string; displayName: string; status: string; applications: string[] };
type AdminAction = { id: number; actorEmail: string | null; action: string; createdAt: string };
type AccountDetail = Account & { sessions: Session[]; history: SecurityEvent[]; memberships: Membership[]; adminActions: AdminAction[] };

export default function UsersView({ token, canManage, onOpenAudit }: { token: string; canManage: boolean; onOpenAudit?: (userId: number) => void }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const [result, setResult] = useState<AccountPage | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const search = useCallback(async (nextPage = page, nextSize = size) => {
    setBusy(true); setError('');
    try {
      setResult(await request<AccountPage>(`/api/platform/users${queryString({ q: query, status, role, page: nextPage, size: nextSize })}`, token));
    } catch (cause) {
      setError(errorText(cause, 'Could not search accounts.'));
    } finally {
      setBusy(false);
    }
  }, [token, query, status, role, page, size]);

  useEffect(() => { void search(0); /* first page on open */ }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (event: React.FormEvent) => { event.preventDefault(); setPage(0); void search(0); };

  return (
    <Stack spacing={3}>
      <SectionHeader title="Users" subtitle="Find any account, see its sessions and sign-in history, and unblock or lock it." />
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      <Card sx={cardSx}><CardContent>
        <Stack component="form" onSubmit={submit} direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField label="Email, name or account id" value={query} onChange={(event) => setQuery(event.target.value)} fullWidth inputProps={{ 'aria-label': 'Search accounts' }} />
          <TextField select label="Status" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: 150 }}>
            <MenuItem value="">All</MenuItem><MenuItem value="ACTIVE">Active</MenuItem><MenuItem value="LOCKED">Locked</MenuItem><MenuItem value="INACTIVE">Deactivated</MenuItem>
          </TextField>
          <TextField select label="Role" value={role} onChange={(event) => setRole(event.target.value)} sx={{ minWidth: 190 }}>
            <MenuItem value="">All roles</MenuItem>
            {(result?.roles || []).map((value) => <MenuItem key={value} value={value}>{humanize(value)}</MenuItem>)}
          </TextField>
          <Button type="submit" variant="contained" startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <SearchRounded />} disabled={busy} sx={{ minWidth: 130, textTransform: 'none' }}>Search</Button>
        </Stack>
      </CardContent></Card>
      <Card sx={cardSx}><CardContent>
        <Table size="small" aria-label="Accounts">
          <TableHead><TableRow><TableCell>Account</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell>Last sign-in</TableCell><TableCell align="right">Sessions</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {(result?.items || []).map((account) => (
              <TableRow key={account.id} hover data-testid={`account-${account.id}`}>
                <TableCell><Typography fontWeight={700}>{account.name || account.email}</Typography><Typography variant="caption" color="text.secondary">{account.email} · #{account.id}</Typography></TableCell>
                <TableCell>{humanize(account.role)}</TableCell>
                <TableCell><StatusChip status={account.status} />{account.failedLoginAttempts > 0 && <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>{account.failedLoginAttempts} failed</Typography>}</TableCell>
                <TableCell><Tooltip title={formatDateTime(account.lastSignInAt)}><span>{relativeTime(account.lastSignInAt)}</span></Tooltip></TableCell>
                <TableCell align="right">{account.activeSessions}</TableCell>
                <TableCell align="right"><Button size="small" onClick={() => setSelectedId(account.id)} sx={{ textTransform: 'none' }}>Open</Button></TableCell>
              </TableRow>
            ))}
            {result && !result.items.length && <TableRow><TableCell colSpan={6}><Typography color="text.secondary" align="center" sx={{ py: 3 }}>No accounts match.</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
        {result && <TablePagination component="div" count={result.total} page={page} rowsPerPage={size} rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={(_, next) => { setPage(next); void search(next); }}
          onRowsPerPageChange={(event) => { const next = Number(event.target.value); setSize(next); setPage(0); void search(0, next); }} />}
      </CardContent></Card>
      <AccountDialog token={token} accountId={selectedId} canManage={canManage} onClose={() => setSelectedId(null)}
        onChanged={() => void search()} onOpenAudit={onOpenAudit} />
    </Stack>
  );
}

function AccountDialog({ token, accountId, canManage, onClose, onChanged, onOpenAudit }: {
  token: string; accountId: number | null; canManage: boolean; onClose: () => void; onChanged: () => void; onOpenAudit?: (userId: number) => void;
}) {
  const [detail, setDetail] = useState<AccountDetail | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [lockMinutes, setLockMinutes] = useState(60);
  const [resetUrl, setResetUrl] = useState('');
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const load = useCallback(async () => {
    if (accountId == null) return;
    setBusy(true); setError('');
    try { setDetail(await request<AccountDetail>(`/api/platform/users/${accountId}`, token)); }
    catch (cause) { setError(errorText(cause, 'Could not load the account.')); }
    finally { setBusy(false); }
  }, [accountId, token]);

  useEffect(() => { setDetail(null); setNotice(''); setResetUrl(''); setError(''); void load(); }, [load]);

  const act = async <T,>(action: () => Promise<T>, message: string | ((result: T) => string)) => {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await action();
      setNotice(typeof message === 'function' ? message(result) : message);
      setConfirm(null); await load(); onChanged();
    }
    catch (cause) { setError(errorText(cause, 'The change was not made.')); setConfirm(null); }
    finally { setBusy(false); }
  };

  const id = accountId;
  const lockLabel = LOCK_DURATIONS.find((option) => option.minutes === lockMinutes)?.label || `${lockMinutes} minutes`;

  return (
    <Dialog open={accountId != null} onClose={onClose} fullWidth maxWidth="md" aria-labelledby="account-dialog-title">
      <DialogTitle id="account-dialog-title" sx={{ pr: 6 }}>
        {detail ? (detail.name || detail.email) : 'Account'}
        <IconButton aria-label="Close account" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseRounded /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice('')}>{notice}</Alert>}
        {!detail && busy && <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress /></Stack>}
        {detail && id != null && (
          <Stack spacing={2.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
              <Box>
                <Typography variant="body2" color="text.secondary">{detail.email} · account #{detail.id} · {humanize(detail.role)}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  <StatusChip status={detail.status} />
                  {detail.locked && <Typography variant="body2" color="warning.main" data-testid="locked-until">Locked until {formatDateTime(detail.lockedUntil)}</Typography>}
                  {detail.failedLoginAttempts > 0 && <Typography variant="body2" color="text.secondary">{detail.failedLoginAttempts} failed sign-in attempt(s)</Typography>}
                </Stack>
              </Box>
              <Typography variant="body2" color="text.secondary">Last sign-in {relativeTime(detail.lastSignInAt)}</Typography>
            </Stack>

            {canManage && (
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} flexWrap="wrap" useFlexGap>
                {detail.locked ? (
                  <Button variant="contained" color="success" disabled={busy} sx={{ textTransform: 'none' }}
                    onClick={() => setConfirm({ title: 'Unlock account', message: `Let ${detail.email} sign in again now?`, confirmLabel: 'Unlock', withReason: true,
                      onConfirm: (reason) => act(() => request(`/api/platform/users/${id}/unlock`, token, 'POST', { reason }), 'Account unlocked. The person can sign in again.') })}>Unlock</Button>
                ) : (
                  <>
                    <TextField select size="small" label="Lock for" value={lockMinutes} onChange={(event) => setLockMinutes(Number(event.target.value))} sx={{ minWidth: 140 }}>
                      {LOCK_DURATIONS.map((option) => <MenuItem key={option.minutes} value={option.minutes}>{option.label}</MenuItem>)}
                    </TextField>
                    <Button variant="outlined" color="warning" disabled={busy || !detail.active} sx={{ textTransform: 'none' }}
                      onClick={() => setConfirm({ title: 'Lock account', message: `Block sign-in for ${detail.email} for ${lockLabel}? Their live sessions end now.`, confirmLabel: 'Lock', danger: true, withReason: true,
                        onConfirm: (reason) => act(() => request(`/api/platform/users/${id}/lock`, token, 'POST', { minutes: lockMinutes, reason }), `Account locked for ${lockLabel}.`) })}>Lock</Button>
                  </>
                )}
                {detail.active ? (
                  <Button variant="outlined" color="error" disabled={busy} sx={{ textTransform: 'none' }}
                    onClick={() => setConfirm({ title: 'Deactivate account', message: `Deactivate ${detail.email}? They cannot sign in until reactivated, and their live sessions end now.`, confirmLabel: 'Deactivate', danger: true, withReason: true,
                      onConfirm: (reason) => act(() => request(`/api/platform/users/${id}/status`, token, 'PUT', { active: false, reason }), 'Account deactivated.') })}>Deactivate</Button>
                ) : (
                  <Button variant="contained" disabled={busy} sx={{ textTransform: 'none' }}
                    onClick={() => setConfirm({ title: 'Reactivate account', message: `Reactivate ${detail.email}?`, confirmLabel: 'Reactivate', withReason: true,
                      onConfirm: (reason) => act(() => request(`/api/platform/users/${id}/status`, token, 'PUT', { active: true, reason }), 'Account reactivated.') })}>Reactivate</Button>
                )}
                <Button variant="outlined" disabled={busy || !detail.sessions.length} sx={{ textTransform: 'none' }}
                  onClick={() => setConfirm({ title: 'End every session', message: `Sign ${detail.email} out on every device?`, confirmLabel: 'End sessions', danger: true,
                    onConfirm: () => act(() => request<{ ended: number }>(`/api/platform/users/${id}/sessions`, token, 'DELETE'), (result) => `${result.ended} session(s) ended.`) })}>End all sessions</Button>
                <Button variant="outlined" disabled={busy || !detail.active} sx={{ textTransform: 'none' }}
                  onClick={() => void act(async () => { const link = await request<{ resetUrl: string }>(`/api/platform/users/${id}/password-reset-link`, token, 'POST'); setResetUrl(link.resetUrl); }, 'Reset link issued. Give it to the account holder over a trusted channel.')}>Issue reset link</Button>
              </Stack>
            )}
            {resetUrl && (
              <Alert severity="info" action={<IconButton aria-label="Copy reset link" size="small" onClick={() => void navigator.clipboard?.writeText(resetUrl)}><ContentCopyRounded fontSize="small" /></IconButton>}>
                <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'ui-monospace, Consolas, monospace' }}>{resetUrl}</Typography>
              </Alert>
            )}

            <Divider />
            <Box>
              <Typography fontWeight={800} sx={{ mb: 1 }}>Live sessions ({detail.sessions.length})</Typography>
              <Table size="small" aria-label="Live sessions">
                <TableHead><TableRow><TableCell>Kind</TableCell><TableCell>Started</TableCell><TableCell>Expires</TableCell><TableCell>From</TableCell></TableRow></TableHead>
                <TableBody>
                  {detail.sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{session.kind === 'APPLICATION' ? `${session.applicationCode}${session.tenant ? ` · ${session.tenant}` : ''}` : 'Platform'}</TableCell>
                      <TableCell>{formatDateTime(session.issuedAt)}</TableCell>
                      <TableCell>{formatDateTime(session.expiresAt)}</TableCell>
                      <TableCell><Typography variant="body2">{session.ipAddress || '—'}</Typography><Typography variant="caption" color="text.secondary">{session.userAgent || ''}</Typography></TableCell>
                    </TableRow>
                  ))}
                  {!detail.sessions.length && <TableRow><TableCell colSpan={4}><Typography color="text.secondary" variant="body2">No live sessions.</Typography></TableCell></TableRow>}
                </TableBody>
              </Table>
            </Box>
            <Box>
              <Typography fontWeight={800} sx={{ mb: 1 }}>Client memberships</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {detail.memberships.map((membership) => (
                  <Chip key={membership.tenantId} variant="outlined" label={`${membership.displayName} (${membership.status})${membership.applications.length ? ` · ${membership.applications.join(', ')}` : ''}`} />
                ))}
                {!detail.memberships.length && <Typography color="text.secondary" variant="body2">Not a member of any client workspace.</Typography>}
              </Stack>
            </Box>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={800} sx={{ mb: 1 }}>Sign-in history</Typography>
                <Table size="small" aria-label="Sign-in history">
                  <TableBody>
                    {detail.history.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell><StatusChip status={event.type.includes('FAILED') || event.type.includes('LOCKED') || event.type.includes('DEACTIVATED') ? 'FAILED' : 'ACTIVE'} label={humanize(event.type)} /></TableCell>
                        <TableCell>{formatDateTime(event.createdAt)}</TableCell>
                        <TableCell><Typography variant="caption" color="text.secondary">{[event.applicationCode, event.tenantSlug, event.ipAddress].filter(Boolean).join(' · ')}</Typography></TableCell>
                      </TableRow>
                    ))}
                    {!detail.history.length && <TableRow><TableCell><Typography color="text.secondary" variant="body2">No sign-in activity yet.</Typography></TableCell></TableRow>}
                  </TableBody>
                </Table>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={800} sx={{ mb: 1 }}>Recent admin actions</Typography>
                <Table size="small" aria-label="Recent admin actions">
                  <TableBody>
                    {detail.adminActions.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{humanize(entry.action)}</TableCell>
                        <TableCell><Typography variant="caption">{entry.actorEmail || '—'}</Typography></TableCell>
                        <TableCell>{formatDateTime(entry.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                    {!detail.adminActions.length && <TableRow><TableCell><Typography color="text.secondary" variant="body2">None.</Typography></TableCell></TableRow>}
                  </TableBody>
                </Table>
              </Box>
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        {onOpenAudit && id != null && <Button onClick={() => { onClose(); onOpenAudit(id); }} sx={{ textTransform: 'none' }}>Full audit trail</Button>}
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Close</Button>
      </DialogActions>
      <ConfirmDialog state={confirm} busy={busy} onClose={() => setConfirm(null)} />
    </Dialog>
  );
}
