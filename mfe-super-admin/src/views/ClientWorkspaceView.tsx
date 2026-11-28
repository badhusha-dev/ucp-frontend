// Client workspace: the client screens that only platform staff run (moved out of the client's own E-commerce Admin).
// The portal exchanges the platform token for an E-commerce Admin token for the chosen client; every use of that token is
// audited server-side, and the gateway accepts changes to these areas only from a Super Admin acting for the client.

import { useEffect, useMemo, useState } from 'react';
import { Provider } from 'react-redux';
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress, Divider,
  FormControlLabel, FormGroup, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import { SaveRounded, StorefrontRounded } from '@mui/icons-material';
import { store } from '@ecommerce/shared-library';
import {
  ApplicationSignInError, clearApplicationSession, decodeTokenClaims, exchangeForApplication, storeApplicationSession,
  type ApplicationSession,
} from '@ecommerce/shared-library/src/auth/applicationSession';
import { BusinessSetupDialog } from '@ecommerce/shared-library/src/ui/BusinessSetupDialog';
import type { BusinessType, CatalogSettings } from '@ecommerce/shared-library/src/ui/businessTypes';
import StorefrontManagementPage from '../../../mfe-product/src/storefront/StorefrontManagementPage';
import { businessSetupApi } from '../../../mfe-product/src/pages/catalogAdminApi';
import TeamPage from '../../../mfe-user/src/pages/TeamPage';
import CurrencySettingsPage from '../../../mfe-user/src/pages/CurrencySettingsPage';
import ErrorStackApp from '../../../mfe-error-stack/src/App';
import { request } from '../platformRequest';
import { actingAsFromClaims, WORKSPACE_TABS, workspaceOpenError, type WorkspaceTab } from '../adminModel';

interface Tenant { id: string; slug: string; displayName: string; status: string }

export default function ClientWorkspaceView({ token }: { token: string }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [session, setSession] = useState<ApplicationSession | null>(null);
  const [tab, setTab] = useState<WorkspaceTab>('storefront');
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    request<Tenant[]>('/api/platform/tenants', token)
      .then((values) => { setTenants(values); setTenantId((current) => current || values.find((t) => t.status === 'ACTIVE')?.id || ''); })
      .catch((cause: Error) => setError(cause.message));
    // Leaving the section ends the acting-for-client session.
    return () => clearApplicationSession('ECOMMERCE_ADMIN', sessionStorage);
  }, [token]);

  const tenant = tenants.find((t) => t.id === tenantId);

  const open = async () => {
    if (!tenant) return;
    setOpening(true); setError(''); setSession(null);
    clearApplicationSession('ECOMMERCE_ADMIN', sessionStorage);
    try {
      const next = await exchangeForApplication({ applicationCode: 'ECOMMERCE_ADMIN', tenantSlug: tenant.slug }, token);
      storeApplicationSession(next, sessionStorage);
      setSession(next);
    } catch (cause) {
      const status = cause instanceof ApplicationSignInError ? cause.status : 0;
      setError(workspaceOpenError(status, cause instanceof Error ? cause.message : '', tenant.displayName));
    } finally {
      setOpening(false);
    }
  };

  const close = () => { clearApplicationSession('ECOMMERCE_ADMIN', sessionStorage); setSession(null); };
  const actingAs = useMemo(() => actingAsFromClaims(session ? decodeTokenClaims(session.token) : null), [session]);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="primary" fontWeight={800}>Super Admin</Typography>
        <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-.04em', color: '#15243B' }}>Client workspace</Typography>
        <Typography color="text.secondary" sx={{ mt: .75 }}>Storefront, business setup, currency, team and error stack for one client. Clients no longer manage these themselves.</Typography>
      </Box>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      <Card sx={{ border: '1px solid #E4EAF2' }}><CardContent>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TextField select SelectProps={{ native: true }} label="Client" value={tenantId} disabled={opening}
            onChange={(event) => { setTenantId(event.target.value); close(); }} sx={{ minWidth: { md: 320 } }}>
            {!tenants.length && <option value="">No clients</option>}
            {tenants.map((t) => <option key={t.id} value={t.id} disabled={t.status !== 'ACTIVE'}>{t.displayName} · {t.slug}{t.status !== 'ACTIVE' ? ` (${t.status.toLowerCase()})` : ''}</option>)}
          </TextField>
          {!session
            ? <Button variant="contained" startIcon={opening ? <CircularProgress size={18} color="inherit" /> : <StorefrontRounded />} disabled={!tenant || opening}
                onClick={() => void open()} sx={{ textTransform: 'none', fontWeight: 800 }}>Open workspace</Button>
            : <Stack direction="row" spacing={1.5} alignItems="center">
                <Chip color="warning" label={`Acting for ${session.tenantName || tenant?.displayName}`} />
                <Button onClick={close} sx={{ textTransform: 'none' }}>Close workspace</Button>
              </Stack>}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>Every change you make here is recorded in the audit log against your account.</Typography>
      </CardContent></Card>
      {session && <Card key={session.tenantId} sx={{ border: '1px solid #E4EAF2' }}>
        <Tabs value={tab} onChange={(_, value: WorkspaceTab) => setTab(value)} variant="scrollable" scrollButtons="auto" aria-label="Client workspace screens" sx={{ px: 2, borderBottom: '1px solid #E4EAF2' }}>
          {WORKSPACE_TABS.map((item) => <Tab key={item.key} value={item.key} label={item.label} sx={{ textTransform: 'none', fontWeight: 700 }} />)}
        </Tabs>
        <Box sx={{ p: { xs: 1, md: 2 } }}>
          {tab === 'storefront' && <Provider store={store}><StorefrontManagementPage actingAs={actingAs} /></Provider>}
          {tab === 'business' && <BusinessSetupPanel />}
          {tab === 'currency' && <CurrencySettingsPage />}
          {tab === 'team' && <TeamPage />}
          {tab === 'errors' && <ErrorStackApp />}
          {tab === 'modules' && <ModuleConfigPanel token={token} tenantId={tenantId} />}
        </Box>
      </Card>}
    </Stack>
  );
}

function BusinessSetupPanel() {
  const [settings, setSettings] = useState<CatalogSettings | null>(null);
  const [types, setTypes] = useState<BusinessType[]>([]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  const load = () => Promise.all([businessSetupApi.catalogSettings(), businessSetupApi.businessTypes()])
    .then(([nextSettings, nextTypes]) => { setSettings(nextSettings); setTypes(nextTypes); })
    .catch((cause: Error) => setError(cause.message));
  useEffect(() => { void load(); }, []);

  const name = (code: string) => types.find((t) => t.code === code)?.name ?? code;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!settings) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  return (
    <Stack spacing={2} sx={{ p: 1 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
        <Box>
          <Typography variant="h6" fontWeight={800}>Business setup</Typography>
          <Typography variant="body2" color="text.secondary">The product types this client sells decide which fields its catalog, storefront and POS show.</Typography>
        </Box>
        <Button variant="contained" onClick={() => setEditing(true)} sx={{ textTransform: 'none', fontWeight: 800, alignSelf: { sm: 'center' } }}>Change business setup</Button>
      </Stack>
      {!settings.configured && <Alert severity="info">Not set up yet: the client's catalog uses general products.</Alert>}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip color="primary" label={`Main: ${name(settings.mainType)}`} />
        {settings.extraTypes.map((code) => <Chip key={code} variant="outlined" label={name(code)} />)}
      </Stack>
      {Object.keys(settings.productsByType).length > 0 && <Typography variant="body2" color="text.secondary">
        Products: {Object.entries(settings.productsByType).map(([code, count]) => `${name(code)} ${count}`).join(' · ')}
      </Typography>}
      {settings.hiddenFields.length > 0 && <Typography variant="body2" color="text.secondary">{settings.hiddenFields.length} field(s) switched off.</Typography>}
      {settings.updatedAt && <Typography variant="caption" color="text.secondary">Last changed {new Date(settings.updatedAt).toLocaleString()}{settings.updatedBy ? ` by ${settings.updatedBy}` : ''}</Typography>}
      <BusinessSetupDialog open={editing} canManage settings={settings} allTypes={types} onSave={(body) => businessSetupApi.saveCatalogSettings(body)}
        onClose={(saved) => { setEditing(false); if (saved) setSettings(saved); }} />
    </Stack>
  );
}


// ── All 15 operations menu items (mirrors shell-app/src/operationsMenu.ts) ──────────────────────
const ALL_MODULES: readonly { path: string; label: string; group: string }[] = [
  { path: '/pos', label: 'Point of Sale', group: 'Orders' },
  { path: '/orders/control', label: 'Order Management', group: 'Orders' },
  { path: '/orders/returns', label: 'Returns & Refunds', group: 'Orders' },
  { path: '/orders/admin', label: 'Admin Orders', group: 'Orders' },
  { path: '/cart/admin/abandoned', label: 'Abandoned Carts', group: 'Orders' },
  { path: '/products/manage', label: 'Catalog Management', group: 'Catalog & pricing' },
  { path: '/products/pricing', label: 'Pricing & Promotions', group: 'Catalog & pricing' },
  { path: '/inventory', label: 'Inventory & Procurement', group: 'Inventory & supply' },
  { path: '/stock', label: 'Stock', group: 'Inventory & supply' },
  { path: '/procurement', label: 'Suppliers & Procurement', group: 'Inventory & supply' },
  { path: '/accounting', label: 'Accounting', group: 'Finance & customers' },
  { path: '/crm', label: 'Advanced CRM', group: 'Finance & customers' },
  { path: '/analytics', label: 'Analytics', group: 'Insights & quality' },
  { path: '/admin/quality-center', label: 'Quality Center', group: 'Insights & quality' },
  { path: '/profile/admin', label: 'User Admin', group: 'Administration' },
];
const MODULE_GROUPS = ['Orders', 'Catalog & pricing', 'Inventory & supply', 'Finance & customers', 'Insights & quality', 'Administration'];

function ModuleConfigPanel({ token, tenantId }: { token: string; tenantId: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allAllowed, setAllAllowed] = useState(true); // null from backend = all allowed
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true); setError(''); setSaved(false);
    request<string[] | null>(`/api/platform/tenants/${tenantId}/modules`, token)
      .then((modules) => {
        if (modules === null || modules === undefined) {
          setAllAllowed(true);
          setSelected(new Set(ALL_MODULES.map((m) => m.path)));
        } else {
          setAllAllowed(false);
          setSelected(new Set(modules));
        }
      })
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  }, [token, tenantId]);

  const toggle = (path: string) => {
    setSaved(false);
    const next = new Set(selected);
    if (next.has(path)) next.delete(path); else next.add(path);
    setSelected(next);
    setAllAllowed(false);
  };

  const toggleGroup = (group: string) => {
    setSaved(false);
    const paths = ALL_MODULES.filter((m) => m.group === group).map((m) => m.path);
    const allChecked = paths.every((p) => selected.has(p));
    const next = new Set(selected);
    paths.forEach((p) => allChecked ? next.delete(p) : next.add(p));
    setSelected(next);
    setAllAllowed(false);
  };

  const toggleAll = () => {
    setSaved(false);
    if (selected.size === ALL_MODULES.length) {
      setSelected(new Set());
      setAllAllowed(false);
    } else {
      setSelected(new Set(ALL_MODULES.map((m) => m.path)));
      setAllAllowed(true);
    }
  };

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const modules = allAllowed && selected.size === ALL_MODULES.length ? null : [...selected].sort();
      await request(`/api/platform/tenants/${tenantId}/modules`, token, 'PUT', { modules });
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  return (
    <Stack spacing={2} sx={{ p: 1 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
        <Box>
          <Typography variant="h6" fontWeight={800}>Module access</Typography>
          <Typography variant="body2" color="text.secondary">Choose which operations menu items this client can see. Unchecked modules are hidden from the client\u2019s admin panel.</Typography>
        </Box>
        <Button variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveRounded />}
          disabled={saving} onClick={() => void save()} sx={{ textTransform: 'none', fontWeight: 800, alignSelf: { sm: 'center' } }}>
          {saving ? 'Saving\u2026' : 'Save changes'}
        </Button>
      </Stack>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {saved && <Alert severity="success" onClose={() => setSaved(false)}>Module access saved.</Alert>}
      <FormControlLabel
        control={<Checkbox checked={selected.size === ALL_MODULES.length} indeterminate={selected.size > 0 && selected.size < ALL_MODULES.length} onChange={toggleAll} />}
        label={<Typography fontWeight={700}>Select all modules ({selected.size}/{ALL_MODULES.length})</Typography>}
      />
      <Divider />
      {MODULE_GROUPS.map((group) => {
        const items = ALL_MODULES.filter((m) => m.group === group);
        const checkedCount = items.filter((m) => selected.has(m.path)).length;
        return (
          <Box key={group}>
            <FormControlLabel
              control={<Checkbox checked={checkedCount === items.length} indeterminate={checkedCount > 0 && checkedCount < items.length} onChange={() => toggleGroup(group)} />}
              label={<Typography fontWeight={700} color="text.secondary">{group}</Typography>}
            />
            <FormGroup sx={{ pl: 3 }}>
              {items.map((m) => (
                <FormControlLabel key={m.path} control={<Checkbox checked={selected.has(m.path)} onChange={() => toggle(m.path)} size="small" />}
                  label={<Typography variant="body2">{m.label} <Typography component="span" variant="caption" color="text.disabled">{m.path}</Typography></Typography>} />
              ))}
            </FormGroup>
          </Box>
        );
      })}
    </Stack>
  );
}
