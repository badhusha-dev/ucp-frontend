import { useCallback, useEffect, useState } from 'react';
import { Box, Chip, IconButton, Stack, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import {
  FullscreenExitRounded, FullscreenRounded, InsightsRounded, PointOfSaleRounded, ReceiptLongRounded, SettingsRounded, StorefrontRounded, TimerOutlined,
} from '@mui/icons-material';
import { roleLabel } from '@ecommerce/shared-library';
import { ErrorState, LoadingState } from '@ecommerce/shared-library/src/ui/StateViews';
import { posApi, type Me } from './api';
import { SCREEN_LABELS, screensFor, type ScreenKey } from './posModel';
import { time } from './format';
import { OpenShiftCard } from './components/OpenShiftCard';
import { SellScreen } from './screens/SellScreen';
import { ShiftScreen } from './screens/ShiftScreen';
import { ReceiptsScreen } from './screens/ReceiptsScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const ICONS: Record<ScreenKey, React.ReactElement> = {
  sell: <PointOfSaleRounded fontSize="small" />, receipts: <ReceiptLongRounded fontSize="small" />, shift: <TimerOutlined fontSize="small" />,
  reports: <InsightsRounded fontSize="small" />, settings: <SettingsRounded fontSize="small" />,
};

/** The Point of Sale workspace: the till and the screens a cashier, supervisor or store manager needs. */
export function PosApp() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState('');
  const [screen, setScreen] = useState<ScreenKey>('sell');
  const [fullscreen, setFullscreen] = useState(false);

  const load = useCallback(async () => {
    try {
      const next = await posApi.me();
      setMe(next);
      setError('');
      setScreen((current) => (screensFor(next.permissions).includes(current) ? current : screensFor(next.permissions)[0]));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Point of Sale could not be loaded.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  };

  if (error && !me) return <Box sx={{ p: 3 }}><ErrorState message={error} onRetry={() => void load()} title="Point of Sale is not available" /></Box>;
  if (!me) return <Box sx={{ p: 3 }}><LoadingState layout="cards" rows={4} label="Opening Point of Sale" /></Box>;

  const can = (permission: string) => me.permissions.includes(permission) || me.permissions.includes('*');
  const screens = screensFor(me.permissions);
  const shift = me.currentShift;
  const storeName = me.settings.receiptHeader?.split('\n')[0]?.trim() || 'Point of Sale';

  return (
    <Box sx={{ bgcolor: '#F4F6FB', minHeight: 'calc(100vh - 110px)', px: { xs: 1.5, md: 2.5 }, py: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" gap={1.5} sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: '#fff', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
            <StorefrontRounded />
          </Box>
          <Box>
            <Typography fontWeight={800} fontSize={18} lineHeight={1.2}>{storeName}</Typography>
            <Typography variant="caption" color="text.secondary">{me.email} · {roleLabel(me.role) || me.role}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          {shift
            ? <Chip color="success" variant="outlined" label={`${shift.registerName} · shift since ${time(shift.openedAt)}`} />
            : <Chip variant="outlined" label="No open shift" />}
          <Tooltip title={fullscreen ? 'Leave full screen' : 'Full screen for the till'}>
            <IconButton onClick={toggleFullscreen} aria-label={fullscreen ? 'Leave full screen' : 'Full screen'}>
              {fullscreen ? <FullscreenExitRounded /> : <FullscreenRounded />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Tabs value={screen} onChange={(_, value: ScreenKey) => setScreen(value)} variant="scrollable" scrollButtons={false} aria-label="Point of Sale screens"
        sx={{ mb: 2, minHeight: 44, '& .MuiTab-root': { minHeight: 44, fontWeight: 700 }, borderBottom: '1px solid', borderColor: 'divider' }}>
        {screens.map((key) => <Tab key={key} value={key} label={SCREEN_LABELS[key]} icon={ICONS[key]} iconPosition="start" />)}
      </Tabs>

      {screen === 'sell' && (shift
        ? <SellScreen me={me} can={can} onSaleCompleted={() => undefined} />
        : <OpenShiftCard registers={me.registers} canOpen={can('pos:shift')} currency={me.settings.currency} onOpened={() => void load()} />)}
      {screen === 'receipts' && <ReceiptsScreen me={me} can={can} hasOpenShift={!!shift} />}
      {screen === 'shift' && <ShiftScreen me={me} can={can} onShiftChanged={() => void load()} />}
      {screen === 'reports' && <ReportsScreen me={me} can={can} />}
      {screen === 'settings' && <SettingsScreen me={me} onSaved={() => void load()} />}
    </Box>
  );
}
