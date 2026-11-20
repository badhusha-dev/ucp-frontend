import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Divider, Stack, TextField, Typography } from '@mui/material';
import {
  exchangeForApplication, fetchMyApplications, isUsablePlatformToken, signInToApplication, workspacesFor,
  type ApplicationSession, type Workspace,
} from '@ecommerce/shared-library/src/auth/applicationSession';

/** The account sign-in kept by the shell (localStorage 'jwt_token'), when it is a live platform token. */
function accountToken(): string | null {
  try {
    const token = localStorage.getItem('jwt_token');
    return token && isUsablePlatformToken(token) ? token : null;
  } catch {
    return null;
  }
}

interface InventoryLoginPageProps {
  onAuthenticated: (session: ApplicationSession) => void;
}

export const InventoryLoginPage: React.FC<InventoryLoginPageProps> = ({ onAuthenticated }) => {
  const [tenantSlug, setTenantSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Workspaces where the signed-in account can open Inventory (a platform Super Admin sees every client that has it):
  // opening one exchanges the current sign-in for an Inventory token, with no second password.
  const token = accountToken();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    fetchMyApplications(token)
      .then((mine) => { if (active) setWorkspaces(workspacesFor(mine, 'INVENTORY')); })
      .catch(() => { if (active) setWorkspaces([]); });
    return () => { active = false; };
  }, [token]);

  const openWorkspace = async (slug: string) => {
    if (!token) return;
    setError('');
    setSubmitting(true);
    try {
      onAuthenticated(await exchangeForApplication({ applicationCode: 'INVENTORY', tenantSlug: slug }, token));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not open this workspace. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      onAuthenticated(await signInToApplication({ applicationCode: 'INVENTORY', tenantSlug, email, password }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2, py: 4, bgcolor: '#F4F7FB' }}>
      <Card sx={{ width: 'min(100%, 440px)', borderRadius: 4, border: '1px solid #E3EAF3', boxShadow: '0 24px 70px rgba(20, 35, 60, .10)' }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={2.5} component="form" onSubmit={signIn}>
            <Box>
              <Typography variant="overline" sx={{ color: '#4F46E5', fontWeight: 800, letterSpacing: '.12em' }}>Universal Commerce</Typography>
              <Typography variant="h4" sx={{ mt: .5, color: '#14233B', fontWeight: 800, letterSpacing: '-.04em' }}>Inventory sign in</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>Use your client workspace and account. Access is checked for this application.</Typography>
            </Box>
            {error && <Alert severity="error">{error}</Alert>}
            {workspaces.length > 0 && (
              <Stack spacing={1} aria-label="Open Inventory with your account">
                <Typography variant="body2" fontWeight={700}>Open with your account</Typography>
                {workspaces.map((workspace) => {
                  const role = workspace.applications.find((app) => app.applicationCode === 'INVENTORY')?.role;
                  return (
                    <Button key={workspace.tenantId} variant="outlined" disabled={submitting} onClick={() => void openWorkspace(workspace.slug)}
                      sx={{ justifyContent: 'space-between', textTransform: 'none', borderRadius: 2, py: 1.25 }}>
                      <span><strong>{workspace.name}</strong> · {workspace.slug}</span>{role && <span>{role.replaceAll('_', ' ')}</span>}
                    </Button>
                  );
                })}
                <Divider sx={{ pt: 1 }}><Typography variant="caption" color="text.secondary">or sign in with a client account</Typography></Divider>
              </Stack>
            )}
            <TextField label="Client workspace" value={tenantSlug} onChange={(event) => setTenantSlug(event.target.value)} placeholder="client-a" autoComplete="organization" required fullWidth />
            <TextField label="Email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" type="email" required fullWidth />
            <TextField label="Password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" type="password" required fullWidth />
            <Button type="submit" size="large" variant="contained" disabled={submitting} sx={{ minHeight: 48, borderRadius: 2, fontWeight: 800, textTransform: 'none' }}>
              {submitting ? <CircularProgress size={22} color="inherit" /> : 'Continue to Inventory'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
