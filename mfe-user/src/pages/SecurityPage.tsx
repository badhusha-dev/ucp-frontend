import { useCallback, useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Snackbar, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { deviceLabel, eventLabel, isWarningEvent, sessionLabel } from './securityModel';
import { errorMessage } from './teamModel';

// Account security always uses the account sign-in (platform token), never a client application session.
const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type Session = { id: string; kind: string; applicationCode: string | null; tenant: string | null; issuedAt: string;
  expiresAt: string; ipAddress: string | null; userAgent: string | null; current: boolean };
type SecurityEvent = { id: number; type: string; applicationCode: string | null; tenantSlug: string | null;
  ipAddress: string | null; userAgent: string | null; createdAt: string };

export default function SecurityPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmAll, setConfirmAll] = useState(false);

  const load = useCallback(async () => {
    setFailure('');
    try {
      const [s, e] = await Promise.all([api.get('/api/users/me/sessions'), api.get('/api/users/me/security-events', { params: { limit: 50 } })]);
      setSessions(s.data); setEvents(e.data);
    } catch (error) { setFailure(errorMessage(error, 'Unable to load account security.')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const endSession = async (id: string) => {
    try { await api.delete(`/api/users/me/sessions/${encodeURIComponent(id)}`); setNotice('Session signed out.'); await load(); }
    catch (error) { setFailure(errorMessage(error, 'The session could not be signed out.')); }
  };
  const endOthers = async () => {
    setConfirmAll(false);
    try { const r = await api.post('/api/users/me/sessions/revoke-others'); setNotice(`Signed out of ${r.data.ended} other session(s).`); await load(); }
    catch (error) { setFailure(errorMessage(error, 'The sessions could not be signed out.')); }
  };

  if (loading) return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 260 }}><CircularProgress /></Box>;

  return <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 1.5, md: 3 } }}>
    <Typography variant="caption" color="text.secondary">Account › Security</Typography>
    <Typography variant="h4" fontWeight={850}>Account security</Typography>
    <Typography color="text.secondary" sx={{ mb: 2 }}>Change your password, see where you are signed in, and review recent sign-in activity.</Typography>
    {failure && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFailure('')}>{failure}</Alert>}

    <PasswordChange onChanged={async () => { setNotice('Password changed. Your other sessions were signed out.'); await load(); }} />

    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mt: 4, mb: 1 }}>
      <Typography variant="h6" fontWeight={800}>Where you are signed in ({sessions.length})</Typography>
      <Button color="warning" variant="outlined" disabled={sessions.filter((s) => !s.current).length === 0} onClick={() => setConfirmAll(true)}>
        Sign out of all other sessions</Button>
    </Stack>
    <TableContainer component={Paper} variant="outlined"><Table size="small"><TableHead><TableRow>
      <TableCell>Session</TableCell><TableCell>Device</TableCell><TableCell>IP address</TableCell><TableCell>Started</TableCell><TableCell>Expires</TableCell><TableCell align="right" />
    </TableRow></TableHead><TableBody>
      {sessions.map((session) => <TableRow key={session.id}>
        <TableCell>{sessionLabel(session)} {session.current && <Chip size="small" color="success" label="This session" sx={{ ml: 1 }} />}</TableCell>
        <TableCell>{deviceLabel(session.userAgent)}</TableCell><TableCell>{session.ipAddress || '—'}</TableCell>
        <TableCell>{new Date(session.issuedAt).toLocaleString()}</TableCell><TableCell>{new Date(session.expiresAt).toLocaleString()}</TableCell>
        <TableCell align="right">{!session.current && <Button size="small" color="warning" onClick={() => void endSession(session.id)}>Sign out</Button>}</TableCell>
      </TableRow>)}
      {sessions.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No active sessions recorded.</TableCell></TableRow>}
    </TableBody></Table></TableContainer>

    <Typography variant="h6" fontWeight={800} sx={{ mt: 4, mb: 1 }}>Recent activity</Typography>
    <TableContainer component={Paper} variant="outlined"><Table size="small"><TableHead><TableRow>
      <TableCell>When</TableCell><TableCell>What</TableCell><TableCell>Where</TableCell><TableCell>Device</TableCell><TableCell>IP address</TableCell>
    </TableRow></TableHead><TableBody>
      {events.map((event) => <TableRow key={event.id}>
        <TableCell>{new Date(event.createdAt).toLocaleString()}</TableCell>
        <TableCell>{isWarningEvent(event.type) ? <Chip size="small" color="warning" label={eventLabel(event.type)} /> : eventLabel(event.type)}</TableCell>
        <TableCell>{[event.applicationCode, event.tenantSlug].filter(Boolean).join(' · ') || '—'}</TableCell>
        <TableCell>{deviceLabel(event.userAgent)}</TableCell><TableCell>{event.ipAddress || '—'}</TableCell>
      </TableRow>)}
      {events.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No activity recorded yet.</TableCell></TableRow>}
    </TableBody></Table></TableContainer>

    <Dialog open={confirmAll} onClose={() => setConfirmAll(false)}>
      <DialogTitle>Sign out everywhere else?</DialogTitle>
      <DialogContent><Typography>Every other browser and application session ends now. This session stays signed in.</Typography></DialogContent>
      <DialogActions><Button onClick={() => setConfirmAll(false)}>Cancel</Button><Button color="warning" variant="contained" onClick={() => void endOthers()}>Sign out others</Button></DialogActions>
    </Dialog>
    <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')}><Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert></Snackbar>
  </Box>;
}

function PasswordChange({ onChanged }: { onChanged: () => Promise<void> }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState('');
  const problem = next.length < 12 || next.length > 128 ? 'Use a new password of 12 to 128 characters.'
    : next !== confirm ? 'The two new passwords do not match.' : next === current ? 'Choose a password different from the current one.' : null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setFailure('');
    try {
      await api.put('/api/users/me/password', { currentPassword: current, newPassword: next });
      setCurrent(''); setNext(''); setConfirm('');
      await onChanged();
    } catch (error) { setFailure(errorMessage(error, 'The password could not be changed.')); }
    finally { setSaving(false); }
  };

  return <Paper variant="outlined" sx={{ p: 2.5 }}>
    <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Change password</Typography>
    <Stack component="form" spacing={2} onSubmit={submit} sx={{ maxWidth: 440 }}>
      <TextField required type="password" label="Current password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      <TextField required type="password" label="New password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)}
        helperText="12 to 128 characters; not your email name. Other sessions are signed out." />
      <TextField required type="password" label="Repeat new password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      {next && problem && <Alert severity="warning">{problem}</Alert>}
      {failure && <Alert severity="error">{failure}</Alert>}
      <Box><Button type="submit" variant="contained" disabled={saving || !current || Boolean(problem)}>{saving ? 'Saving…' : 'Change password'}</Button></Box>
    </Stack>
  </Paper>;
}
