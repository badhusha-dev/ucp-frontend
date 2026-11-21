// A dashboard number with its label: problems above zero stand out, everything else stays calm.
import { Paper, Typography } from '@mui/material';
import { UCP_COLORS } from './adminTheme';
import type { KpiTone } from './format';

const TONES: Record<KpiTone, { bar: string; value: string; bg: string; badge?: string }> = {
  neutral: { bar: 'transparent', value: UCP_COLORS.ink, bg: UCP_COLORS.surface },
  good: { bar: '#10B981', value: UCP_COLORS.good, bg: UCP_COLORS.surface },
  attention: { bar: '#F59E0B', value: UCP_COLORS.attention, bg: '#FFFBEB', badge: 'Needs attention' },
  critical: { bar: '#EF4444', value: UCP_COLORS.critical, bg: '#FEF2F2', badge: 'Act now' },
};

export function KpiCard({ label, value, tone = 'neutral', hint }: { label: string; value: string; tone?: KpiTone; hint?: string }) {
  const t = TONES[tone];
  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%', bgcolor: t.bg, borderLeft: `4px solid ${t.bar === 'transparent' ? UCP_COLORS.border : t.bar}` }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
      <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: t.value, mt: 0.5, lineHeight: 1.2 }}>{value}</Typography>
      {t.badge && (
        <Typography component="span" sx={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: t.value, textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.5 }}>
          {t.badge}
        </Typography>
      )}
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </Paper>
  );
}
