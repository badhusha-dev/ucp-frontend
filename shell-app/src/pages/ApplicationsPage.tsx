import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import { AppsRounded, OpenInNewRounded } from '@mui/icons-material';
import {
  exchangeForApplication, fetchMyApplications, storeApplicationSession,
  type ApplicationCode, type MyApplications,
} from '@ecommerce/shared-library';
import { externalOrigins, launchTarget } from './launcherModel';

const origins = externalOrigins(import.meta.env as Record<string, string | undefined>, window.location);

/** Every application the person can open, grouped by client workspace, from their live grants. */
export default function ApplicationsPage() {
  const navigate = useNavigate();
  const [mine, setMine] = useState<MyApplications | null>(null);
  const [failure, setFailure] = useState('');
  const [opening, setOpening] = useState('');
  const token = localStorage.getItem('jwt_token') || '';

  useEffect(() => {
    fetchMyApplications(token).then(setMine).catch((error) => setFailure(error instanceof Error ? error.message : 'Unable to load your applications.'));
  }, [token]);

  const open = async (applicationCode: ApplicationCode, tenantSlug?: string) => {
    const target = launchTarget(applicationCode, origins);
    setFailure('');
    if (target.kind === 'external') { window.open(target.url, '_blank', 'noopener'); return; }
    if (target.kind === 'unavailable' || !tenantSlug) { setFailure(target.kind === 'unavailable' ? target.reason : 'Choose a workspace.'); return; }
    setOpening(`${tenantSlug}:${applicationCode}`);
    try {
      storeApplicationSession(await exchangeForApplication({ applicationCode, tenantSlug }, token), sessionStorage);
      navigate(target.path);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'The application could not be opened.');
    } finally {
      setOpening('');
    }
  };

  if (!mine && !failure) return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 260 }}><CircularProgress /></Box>;
  const empty = mine && mine.platform.length === 0 && mine.workspaces.every((w) => w.applications.length === 0);

  return <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 4 } }}>
    <Typography variant="caption" color="text.secondary">Account › My applications</Typography>
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
      <AppsRounded color="primary" /><Typography variant="h4" fontWeight={850}>My applications</Typography>
    </Stack>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Open any application you have access to. Your sign-in carries over; access is checked for every client workspace.</Typography>
    {failure && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFailure('')}>{failure}</Alert>}
    {empty && <Alert severity="info">Your account has no business applications yet. A client owner can give you access from their Client team page.</Alert>}

    {mine && mine.platform.length > 0 && <Box sx={{ mb: 3 }}>
      <Typography variant="overline" color="text.secondary">Platform</Typography>
      <Stack direction="row" flexWrap="wrap" useFlexGap gap={2}>
        {mine.platform.map((app) => <AppCard key={app.applicationCode} title={app.displayName} subtitle="Opens in a new tab" external
          onOpen={() => void open(app.applicationCode)} />)}
      </Stack>
    </Box>}

    {mine?.workspaces.filter((w) => w.applications.length > 0).map((workspace) => <Box key={workspace.tenantId} sx={{ mb: 3 }}>
      <Typography variant="overline" color="text.secondary">{workspace.name} · {workspace.slug}</Typography>
      <Stack direction="row" flexWrap="wrap" useFlexGap gap={2}>
        {workspace.applications.map((app) => {
          const target = launchTarget(app.applicationCode, origins);
          return <AppCard key={app.applicationCode} title={app.displayName} subtitle={app.role} external={target.kind === 'external'}
            disabled={target.kind === 'unavailable'} busy={opening === `${workspace.slug}:${app.applicationCode}`}
            onOpen={() => void open(app.applicationCode, workspace.slug)} />;
        })}
      </Stack>
    </Box>)}
  </Box>;
}

function AppCard({ title, subtitle, external, disabled, busy, onOpen }: {
  title: string; subtitle: string; external?: boolean; disabled?: boolean; busy?: boolean; onOpen: () => void;
}) {
  return <Card variant="outlined" sx={{ width: { xs: '100%', sm: 250 } }}>
    <CardContent>
      <Typography fontWeight={800}>{title}</Typography>
      <Chip size="small" label={subtitle} sx={{ mt: 1, mb: 2 }} />
      <Box><Button variant="contained" size="small" disabled={disabled || busy} onClick={onOpen}
        endIcon={external ? <OpenInNewRounded fontSize="small" /> : undefined}>{busy ? 'Opening…' : disabled ? 'Not available yet' : 'Open'}</Button></Box>
    </CardContent>
  </Card>;
}
