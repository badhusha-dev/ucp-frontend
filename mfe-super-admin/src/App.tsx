import { request } from './platformRequest';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, AppBar, Box, Button, Card, CardContent, Chip, CircularProgress, Container, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, IconButton, Paper, Stack, Switch,
  Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Toolbar, Typography,
} from '@mui/material';
import { AddRounded, ApartmentRounded, LogoutRounded, RefreshRounded, SecurityRounded } from '@mui/icons-material';
import {
  ApplicationSignInError, clearPlatformSession, hasPlatformPermission, readPlatformSession, signInToPlatform, storePlatformSession,
} from '@ecommerce/shared-library/src/auth/applicationSession';
import { BUSINESS_CURRENCIES, formatMoney } from '@ecommerce/shared-library/src/ui/money';
import { holds, sectionsFor, type SectionKey } from './adminModel';
import SystemHealthView from './views/SystemHealthView';
import UsersView from './views/UsersView';
import NotificationsView from './views/NotificationsView';
import AuditLogView from './views/AuditLogView';
import ClientWorkspaceView from './views/ClientWorkspaceView';

type Tenant = { id: string; slug: string; displayName: string; status: string; currency?: string; displayRates?: Record<string, number> };
type Application = { applicationCode: string; displayName: string; status: string; enabled: boolean };
type Member = { userId: number; email: string; name: string; membershipStatus: string; grantActive: boolean; roleKey?: string };



// Applications the Client access screen can grant, with the roles offered for each (user-service checks every grant).
const GRANTABLE_APPLICATIONS = ['INVENTORY', 'DELIVERY_OPS', 'RETAIL_POS'];
const APPLICATION_ROLES: Record<string, string[]> = {
  INVENTORY: ['WAREHOUSE_OPERATOR'],
  DELIVERY_OPS: ['DELIVERY_ADMIN', 'DISPATCHER', 'DELIVERY_PARTNER', 'DELIVERY_ANALYST'],
  RETAIL_POS: ['POS_MANAGER', 'POS_SUPERVISOR', 'CASHIER', 'POS_ANALYST'],
};
const DEFAULT_ROLE: Record<string, string> = { INVENTORY: 'WAREHOUSE_OPERATOR', DELIVERY_OPS: 'DELIVERY_PARTNER', RETAIL_POS: 'CASHIER' };

export default function App() {
  const [token, setToken] = useState(() => readPlatformSession(sessionStorage)?.token || '');
  // Platform roles (user-service V20): read-only roles see clients but cannot change them. The API enforces the same.
  const canManage = useMemo(() => hasPlatformPermission(readPlatformSession(sessionStorage), 'platform:tenants.manage'), [token]);
  // Console sections follow the session's platform permissions; every API call is re-checked on the server.
  const permissions = useMemo(() => readPlatformSession(sessionStorage)?.permissions || [], [token]);
  const sections = useMemo(() => sectionsFor(permissions), [permissions]);
  const [section, setSection] = useState<SectionKey>('clients');
  const [auditUserId, setAuditUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedApplicationCode, setSelectedApplicationCode] = useState('DELIVERY_OPS');
  const [selectedRoleKey, setSelectedRoleKey] = useState('DELIVERY_PARTNER');
  const [createOpen, setCreateOpen] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [tenantCurrency, setTenantCurrency] = useState('INR');
  const [ratesOpen, setRatesOpen] = useState(false);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [memberEmail, setMemberEmail] = useState('');

  const selectedTenant = useMemo(() => tenants.find((tenant) => tenant.id === selectedTenantId), [tenants, selectedTenantId]);

  const loadTenants = async (accessToken = token) => {
    const values = await request<Tenant[]>('/api/platform/tenants', accessToken);
    setTenants(values);
    if (!selectedTenantId && values.length) setSelectedTenantId(values[0].id);
    if (selectedTenantId && !values.some((tenant) => tenant.id === selectedTenantId)) setSelectedTenantId(values[0]?.id || '');
  };

  const loadTenantDetails = async (tenantId: string, accessToken = token) => {
    if (!tenantId) { setApplications([]); setMembers([]); return; }
    const [apps, users] = await Promise.all([
      request<Application[]>(`/api/platform/tenants/${tenantId}/applications`, accessToken),
      request<Member[]>(`/api/platform/tenants/${tenantId}/memberships?applicationCode=${selectedApplicationCode}`, accessToken),
    ]);
    setApplications(apps);
    setMembers(users);
  };

  useEffect(() => {
    if (!token) return;
    setBusy(true);
    loadTenants().catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load clients.'))
      .finally(() => setBusy(false));
  }, [token]);

  useEffect(() => {
    if (!token || !selectedTenantId) return;
    loadTenantDetails(selectedTenantId).catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load client access.'));
  }, [token, selectedTenantId, selectedApplicationCode]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setLoginError('');
    try {
      const session = await signInToPlatform({ email, password });
      if (!hasPlatformPermission(session, 'platform:tenants.read'))
        throw new ApplicationSignInError('This portal is limited to platform staff.', 403);
      storePlatformSession(session, sessionStorage);
      setToken(session.token);
      setPassword('');
    } catch (cause) { setLoginError(cause instanceof Error ? cause.message : 'Sign in failed.'); }
    finally { setBusy(false); }
  };

  const signOut = () => { clearPlatformSession(sessionStorage); setToken(''); setTenants([]); setApplications([]); setMembers([]); setSection('clients'); setAuditUserId(''); };

  const withFeedback = async (action: () => Promise<void>, successMessage: string) => {
    setError(''); setNotice(''); setBusy(true);
    try { await action(); setNotice(successMessage); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The operation failed.'); }
    finally { setBusy(false); }
  };

  const createTenant = async () => withFeedback(async () => {
    const created = await request<Tenant>('/api/platform/tenants', token, 'POST', { displayName: tenantName, slug: tenantSlug, currency: tenantCurrency });
    setTenantName(''); setTenantSlug(''); setCreateOpen(false);
    const values = await request<Tenant[]>('/api/platform/tenants', token);
    setTenants(values); setSelectedTenantId(created.id);
  }, 'Client created. Enable an application and add its members below.');

  const openRates = () => {
    setRates(Object.fromEntries(Object.entries(selectedTenant?.displayRates ?? {}).map(([code, rate]) => [code, String(rate)])));
    setRatesOpen(true);
  };
  const ratesInvalid = Object.values(rates).some((value) => !(Number(value) > 0));
  const saveRates = async () => withFeedback(async () => {
    if (!selectedTenant) return;
    const body = { rates: Object.fromEntries(Object.entries(rates).map(([code, value]) => [code, Number(value)])) };
    await request<Tenant>(`/api/platform/tenants/${selectedTenant.id}/display-currencies`, token, 'PUT', body);
    setRatesOpen(false);
    setTenants(await request<Tenant[]>('/api/platform/tenants', token));
  }, 'Display currencies saved. People can switch to them from the header the next time they open an application.');

  const changeCurrency = async (currency: string) => withFeedback(async () => {
    if (!selectedTenant) return;
    await request<Tenant>(`/api/platform/tenants/${selectedTenant.id}/currency`, token, 'PUT', { currency });
    setTenants(await request<Tenant[]>('/api/platform/tenants', token));
  }, `Currency set to ${currency} (${formatMoney(1234.5, currency)}). Users see it the next time they open an application.`);

  const toggleApplication = async (enabled: boolean) => {
    if (!selectedTenant) return;
    await withFeedback(async () => {
      await request<void>(`/api/platform/tenants/${selectedTenant.id}/applications/${selectedApplicationCode}`, token, 'PUT', { enabled });
      await loadTenantDetails(selectedTenant.id);
    }, `${selectedApplicationCode} ${enabled ? 'enabled' : 'disabled'} for ${selectedTenant.displayName}.`);
  };

  const addMember = async () => {
    if (!selectedTenant) return;
    await withFeedback(async () => {
      await request<void>(`/api/platform/tenants/${selectedTenant.id}/memberships`, token, 'POST', { email: memberEmail });
      setMemberEmail(''); await loadTenantDetails(selectedTenant.id);
    }, 'Client membership added.');
  };

  const changeGrant = async (member: Member, grant: boolean) => {
    if (!selectedTenant) return;
    await withFeedback(async () => {
      const path = `/api/platform/tenants/${selectedTenant.id}/memberships/${encodeURIComponent(member.email)}/applications/${selectedApplicationCode}`;
      await request<void>(path, token, grant ? 'PUT' : 'DELETE', grant ? { roleKey: selectedRoleKey } : undefined);
      await loadTenantDetails(selectedTenant.id);
    }, `${grant ? `${selectedApplicationCode} access granted to` : `${selectedApplicationCode} access revoked for`} ${member.email}.`);
  };

  if (!token) return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Card sx={{ width: 'min(100%, 430px)', border: '1px solid #E4EAF2', boxShadow: '0 24px 70px rgba(16,24,40,.10)' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack component="form" spacing={2.5} onSubmit={signIn}>
            <Box><Typography variant="overline" color="primary" fontWeight={800}>Universal Commerce Platform</Typography><Typography variant="h4" fontWeight={800}>Super Admin</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Sign in to configure client access and applications.</Typography></Box>
            {loginError && <Alert severity="error">{loginError}</Alert>}
            <TextField label="Email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
            <TextField label="Password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            <Button type="submit" variant="contained" size="large" disabled={busy} sx={{ minHeight: 48, textTransform: 'none', fontWeight: 800 }}>{busy ? <CircularProgress size={22} color="inherit" /> : 'Sign in securely'}</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );

  const selectedApplication = applications.find((application) => application.applicationCode === selectedApplicationCode);
  const roles = APPLICATION_ROLES[selectedApplicationCode] ?? ['WAREHOUSE_OPERATOR'];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F4F7FB' }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #E4EAF2' }}>
        <Toolbar><ApartmentRounded color="primary" sx={{ mr: 1.5 }} /><Box sx={{ flexGrow: 1 }}><Typography fontWeight={800}>Platform control plane</Typography><Typography variant="caption" color="text.secondary">Clients, health, accounts and audit</Typography></Box>{section === 'clients' && <IconButton aria-label="Refresh clients" onClick={() => void loadTenants()}><RefreshRounded /></IconButton>}<IconButton aria-label="Sign out" onClick={signOut}><LogoutRounded /></IconButton></Toolbar>
        {sections.length > 1 && <Tabs value={sections.some((item) => item.key === section) ? section : false} onChange={(_, value: SectionKey) => { setAuditUserId(''); setSection(value); }} variant="scrollable" scrollButtons="auto" aria-label="Console sections" sx={{ px: 2 }}>
          {sections.map((item) => <Tab key={item.key} value={item.key} label={item.label} sx={{ textTransform: 'none', fontWeight: 700 }} />)}
        </Tabs>}
      </AppBar>
      {section === 'clients' && <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={2}>
            <Box><Typography variant="overline" color="primary" fontWeight={800}>Super Admin</Typography><Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-.04em', color: '#15243B' }}>Client access</Typography><Typography color="text.secondary" sx={{ mt: .75 }}>Create client workspaces, control app entitlements, and grant access per employee.</Typography></Box>
            <Button startIcon={<AddRounded />} variant="contained" disabled={!canManage} onClick={() => setCreateOpen(true)} sx={{ textTransform: 'none', fontWeight: 800 }}>Create client</Button>
          </Stack>
          {notice && <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert>}
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          <Card sx={{ border: '1px solid #E4EAF2' }}><CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ md: 'center' }}>
              <TextField select SelectProps={{ native: true }} label="Client workspace" value={selectedTenantId} onChange={(event) => setSelectedTenantId(event.target.value)} sx={{ minWidth: { md: 300 } }}>
                {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.displayName} · {tenant.slug}</option>)}
              </TextField>
              {selectedTenant && <Stack direction="row" spacing={1} alignItems="center"><Chip size="small" label={selectedTenant.status} color={selectedTenant.status === 'ACTIVE' ? 'success' : 'default'} /><Typography variant="body2" color="text.secondary">{selectedTenant.id}</Typography>
                <TextField select size="small" SelectProps={{ native: true }} label="Currency" value={selectedTenant.currency ?? 'USD'} disabled={!canManage || busy}
                  onChange={(event) => void changeCurrency(event.target.value)} sx={{ minWidth: 110 }}>
                  {BUSINESS_CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}
                </TextField>
                <Button size="small" variant="outlined" disabled={!canManage || busy} onClick={openRates} sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}>
                  Display currencies{Object.keys(selectedTenant.displayRates ?? {}).length ? ` (${Object.keys(selectedTenant.displayRates ?? {}).join(', ')})` : ''}
                </Button></Stack>}
              <TextField select SelectProps={{ native: true }} label="Application" value={selectedApplicationCode} onChange={(event) => { setSelectedApplicationCode(event.target.value); setSelectedRoleKey(DEFAULT_ROLE[event.target.value] ?? 'WAREHOUSE_OPERATOR'); }} sx={{ minWidth: { md: 240 } }}>
                {applications.filter((application) => GRANTABLE_APPLICATIONS.includes(application.applicationCode)).map((application) => <option key={application.applicationCode} value={application.applicationCode}>{application.displayName || application.applicationCode}</option>)}
                {!applications.some((application) => GRANTABLE_APPLICATIONS.includes(application.applicationCode)) && <option value={selectedApplicationCode}>{selectedApplicationCode}</option>}
              </TextField>
            </Stack>
          </CardContent></Card>
          <Card sx={{ border: '1px solid #E4EAF2' }}><CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={2}>
              <Stack direction="row" spacing={1.5} alignItems="center"><SecurityRounded color="primary" /><Box><Typography fontWeight={800}>{selectedApplication?.displayName || selectedApplicationCode} entitlement</Typography><Typography variant="body2" color="text.secondary">Enable the application for this client before granting individual roles.</Typography></Box></Stack>
              {selectedApplication && <Stack direction="row" spacing={1} alignItems="center"><Chip label={selectedApplication.status} size="small" /><Typography variant="body2">{selectedApplication.enabled ? 'Enabled' : 'Disabled'}</Typography><Switch checked={selectedApplication.enabled} disabled={!canManage || busy || selectedApplication.status !== 'ACTIVE' || !selectedTenant} onChange={(event) => void toggleApplication(event.target.checked)} inputProps={{ 'aria-label': `Enable ${selectedApplicationCode} for selected client` }} /></Stack>}
            </Stack>
          </CardContent></Card>
          <Card sx={{ border: '1px solid #E4EAF2' }}><CardContent>
            <Stack spacing={2}>
              <Box><Typography variant="h6" fontWeight={800}>Client members</Typography><Typography variant="body2" color="text.secondary">Add an existing identity, then grant or revoke {selectedApplicationCode} access separately.</Typography></Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><TextField label="Employee email" type="email" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} disabled={!selectedTenant || busy} fullWidth /><Button onClick={() => void addMember()} disabled={!canManage || !selectedTenant || !memberEmail || busy} variant="outlined" sx={{ minWidth: 150, textTransform: 'none' }}>Add member</Button></Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}><Typography variant="body2" color="text.secondary">Role for next grant</Typography><TextField select SelectProps={{ native: true }} size="small" value={selectedRoleKey} onChange={(event) => setSelectedRoleKey(event.target.value)} sx={{ minWidth: 230 }}>{roles.map((role) => <option key={role} value={role}>{role.replaceAll('_', ' ')}</option>)}</TextField></Stack>
              <Divider />
              <Table size="small"><TableHead><TableRow><TableCell>Employee</TableCell><TableCell>Membership</TableCell><TableCell>{selectedApplicationCode} role</TableCell><TableCell align="right">Access</TableCell></TableRow></TableHead><TableBody>
                {members.map((member) => <TableRow key={member.userId}><TableCell><Typography fontWeight={700}>{member.name || member.email}</Typography><Typography variant="caption" color="text.secondary">{member.email}</Typography></TableCell><TableCell>{member.membershipStatus}</TableCell><TableCell>{member.grantActive ? member.roleKey : '—'}</TableCell><TableCell align="right"><Button size="small" onClick={() => void changeGrant(member, !member.grantActive)} disabled={!canManage || busy || !selectedApplication?.enabled || member.membershipStatus !== 'ACTIVE'} color={member.grantActive ? 'error' : 'primary'} sx={{ textTransform: 'none' }}>{member.grantActive ? 'Revoke' : `Grant ${selectedApplicationCode}`}</Button></TableCell></TableRow>)}
                {!members.length && <TableRow><TableCell colSpan={4}><Typography color="text.secondary" align="center" sx={{ py: 3 }}>No client members yet.</Typography></TableCell></TableRow>}
              </TableBody></Table>
            </Stack>
          </CardContent></Card>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'transparent' }}><Typography variant="body2" color="text.secondary">Employees need an account before they can be added here. App access is tenant-scoped; enabling Inventory for a client does not grant it to every member.</Typography></Paper>
        </Stack>
      </Container>}
      {section !== 'clients' && <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {section === 'health' && <SystemHealthView token={token} canSeeDlq={holds(permissions, 'errors:manage')} />}
        {section === 'users' && <UsersView token={token} canManage={holds(permissions, 'platform:users.manage')}
          onOpenAudit={holds(permissions, 'platform:audit.read') ? (userId) => { setAuditUserId(String(userId)); setSection('audit'); } : undefined} />}
        {section === 'notifications' && <NotificationsView token={token} canLookUpUsers={holds(permissions, 'platform:users.read')} />}
        {section === 'workspace' && <ClientWorkspaceView token={token} />}
        {section === 'audit' && <AuditLogView token={token} initialFilters={auditUserId ? { userId: auditUserId } : undefined} />}
      </Container>}
      <Dialog open={ratesOpen} onClose={() => setRatesOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Display currencies for {selectedTenant?.displayName}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            People can switch every screen to these currencies from the header. Amounts stay stored in {selectedTenant?.currency ?? 'USD'} and are converted with your rates for display; the Point of Sale keeps its till currency.
          </Typography>
          <Stack spacing={1.5}>
            {BUSINESS_CURRENCIES.filter((code) => code !== (selectedTenant?.currency ?? 'USD')).map((code) => {
              const on = code in rates;
              return <Stack key={code} direction="row" spacing={2} alignItems="center">
                <Switch checked={on} onChange={(event) => setRates((current) => {
                  const next = { ...current };
                  if (event.target.checked) next[code] = ''; else delete next[code];
                  return next;
                })} />
                <Typography sx={{ width: 48, fontWeight: 700 }}>{code}</Typography>
                {on && <TextField size="small" type="number" label={`1 ${selectedTenant?.currency ?? 'USD'} = ? ${code}`} value={rates[code]}
                  error={!(Number(rates[code]) > 0)} onChange={(event) => setRates((current) => ({ ...current, [code]: event.target.value }))} sx={{ width: 200 }} />}
                {on && Number(rates[code]) > 0 && <Typography variant="body2" color="text.secondary">{formatMoney(100, selectedTenant?.currency ?? 'USD')} = {formatMoney(100 * Number(rates[code]), code)}</Typography>}
              </Stack>;
            })}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setRatesOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" disabled={ratesInvalid || busy} onClick={() => void saveRates()} sx={{ textTransform: 'none' }}>Save</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create client workspace</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField autoFocus label="Client name" value={tenantName} onChange={(event) => setTenantName(event.target.value)} required /><TextField label="Workspace slug" value={tenantSlug} onChange={(event) => setTenantSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} helperText="Lowercase letters, numbers and hyphens. Used at application sign-in." required /><TextField select SelectProps={{ native: true }} label="Currency" value={tenantCurrency} onChange={(event) => setTenantCurrency(event.target.value)} helperText="Every application shows money in this currency.">{BUSINESS_CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}</TextField></Stack></DialogContent>
        <DialogActions sx={{ p: 2.5 }}><Button onClick={() => setCreateOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button><Button variant="contained" disabled={!tenantName.trim() || !tenantSlug.trim() || busy} onClick={() => void createTenant()} sx={{ textTransform: 'none' }}>Create client</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
