// Loading, empty and error states for UCP screens, so a screen never shows a bare spinner or a blank area.
// Import by path ('@ecommerce/shared-library/src/ui/StateViews') so each micro-frontend bundles it with its own MUI
// and its own theme applies.
import { Box, Button, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { UCP_COLORS } from './adminTheme';

type LoadingLayout = 'cards' | 'table' | 'lines';

/** Placeholder shaped like the content that is on its way (a row of cards, a table or a few lines). */
export function LoadingState({ layout = 'lines', rows = 4, label = 'Loading' }: { layout?: LoadingLayout; rows?: number; label?: string }) {
  return (
    <Box role="status" aria-live="polite" aria-label={label} sx={{ py: 1 }}>
      {layout === 'cards' && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
          {Array.from({ length: rows }).map((_, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 2 }}>
              <Skeleton width="60%" height={18} />
              <Skeleton width="40%" height={40} />
            </Paper>
          ))}
        </Box>
      )}
      {layout === 'table' && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Skeleton height={28} sx={{ mb: 1 }} />
          {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} height={22} />)}
        </Paper>
      )}
      {layout === 'lines' && (
        <Stack spacing={1}>{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} width={`${90 - i * 12}%`} height={22} />)}</Stack>
      )}
    </Box>
  );
}

/** Nothing to show yet, said in words, with an optional next step. */
export function EmptyState({ title, hint, action, compact = false }: {
  title: string;
  hint?: string;
  action?: { label: string; onClick: () => void };
  compact?: boolean;
}) {
  return (
    <Paper variant="outlined" sx={{ py: compact ? 2.5 : 5, px: 3, textAlign: 'center', borderStyle: 'dashed', bgcolor: UCP_COLORS.canvas }}>
      <Box aria-hidden sx={{ width: 44, height: 44, mx: 'auto', mb: 1.5, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: '#EEF2FF', color: UCP_COLORS.primary, fontSize: 22, fontWeight: 800 }}>
        ∅
      </Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
      {hint && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 460, mx: 'auto' }}>{hint}</Typography>}
      {action && <Button variant="outlined" size="small" sx={{ mt: 2 }} onClick={action.onClick}>{action.label}</Button>}
    </Paper>
  );
}

/** A failed load, with what went wrong and a way to try again. */
export function ErrorState({ message, onRetry, title = 'This could not be loaded' }: { message: string; onRetry?: () => void; title?: string }) {
  return (
    <Paper role="alert" variant="outlined" sx={{ p: 2.5, borderColor: '#FECACA', bgcolor: '#FEF2F2' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
        <Box>
          <Typography variant="subtitle2" sx={{ color: UCP_COLORS.critical }}>{title}</Typography>
          <Typography variant="body2" sx={{ color: '#7F1D1D', mt: 0.25 }}>{message}</Typography>
        </Box>
        {onRetry && <Button variant="contained" color="error" size="small" onClick={onRetry} sx={{ flexShrink: 0 }}>Try again</Button>}
      </Stack>
    </Paper>
  );
}
