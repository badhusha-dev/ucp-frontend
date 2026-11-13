import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Alert, Box, Button, CircularProgress, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import { passwordProblem, tokenFromHash } from './passwordModel';

function Frame({ title, children }: { title: string; children: ReactNode }) {
  return <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center', p: 2 }}>
    <Paper variant="outlined" sx={{ width: 'min(100%, 460px)', p: { xs: 3, sm: 4 }, borderRadius: 3 }}>
      <Typography variant="h5" fontWeight={850} sx={{ mb: 1 }}>{title}</Typography>
      {children}
      <Link component={RouterLink} to="/login" sx={{ display: 'inline-block', mt: 2 }}>Back to sign in</Link>
    </Paper>
  </Box>;
}

/** Self-service reset by email; says plainly when email delivery is not configured. */
export function ForgotPasswordPage() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState('');
  const [failure, setFailure] = useState('');

  useEffect(() => {
    axios.get('/api/users/password/reset-options').then((r) => setAvailable(Boolean(r.data?.emailAvailable))).catch(() => setAvailable(false));
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true); setFailure('');
    try {
      const response = await axios.post('/api/users/password/forgot', { email: email.trim() });
      setDone(response.data?.message || 'If an account exists for that email, a reset link is on its way.');
    } catch (error: any) {
      setFailure(error?.response?.status === 429 ? 'Too many requests. Wait a minute and try again.'
        : error?.response?.data?.message || 'The request could not be sent. Try again shortly.');
    } finally { setSending(false); }
  };

  if (available === null) return <Frame title="Reset your password"><CircularProgress size={28} /></Frame>;
  if (!available) return <Frame title="Reset your password">
    <Alert severity="info">Password reset by email is not set up for this installation. Ask your administrator for a one-time reset link; they can create one from User administration.</Alert>
  </Frame>;
  if (done) return <Frame title="Check your email"><Alert severity="success">{done}</Alert></Frame>;
  return <Frame title="Reset your password">
    <Typography color="text.secondary" sx={{ mb: 2 }}>Enter your account email. We send a link that works once and expires soon.</Typography>
    <Stack component="form" spacing={2} onSubmit={submit}>
      <TextField required type="email" label="Email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      {failure && <Alert severity="error">{failure}</Alert>}
      <Button type="submit" variant="contained" disabled={sending || !email.includes('@')}>{sending ? 'Sending…' : 'Send reset link'}</Button>
    </Stack>
  </Frame>;
}

/** Completes a reset with the one-time token from the link fragment (#token=…), which never reaches a server log. */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [token] = useState(() => tokenFromHash(window.location.hash));
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Drop the token from the address bar and history once read.
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const problem = passwordProblem(password, confirm);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setFailure('');
    try {
      await axios.post('/api/users/password/reset', { token, newPassword: password });
      setDone(true);
    } catch (error: any) {
      setFailure(error?.response?.data?.message || error?.response?.data?.error || 'This reset link is invalid or has expired.');
    } finally { setSaving(false); }
  };

  if (!token) return <Frame title="Choose a new password"><Alert severity="error">This reset link is incomplete. Open the link from your email or administrator again.</Alert></Frame>;
  if (done) return <Frame title="Password changed">
    <Alert severity="success" sx={{ mb: 2 }}>Your password is changed and every earlier session has been signed out.</Alert>
    <Button variant="contained" onClick={() => navigate('/login')}>Sign in</Button>
  </Frame>;
  return <Frame title="Choose a new password">
    <Stack component="form" spacing={2} onSubmit={submit} sx={{ mt: 1 }}>
      <TextField required type="password" label="New password" autoComplete="new-password" value={password}
        onChange={(e) => setPassword(e.target.value)} helperText="12 to 128 characters; not your email name." />
      <TextField required type="password" label="Repeat new password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      {password && problem && <Alert severity="warning">{problem}</Alert>}
      {failure && <Alert severity="error">{failure}</Alert>}
      <Button type="submit" variant="contained" disabled={saving || Boolean(problem)}>{saving ? 'Saving…' : 'Change password'}</Button>
    </Stack>
  </Frame>;
}
