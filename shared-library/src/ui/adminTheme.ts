// One look for every UCP screen. Plain theme options (no MUI runtime import): each micro-frontend bundles its own
// @mui/material, so each passes these to its own createTheme() and ThemeProvider (see the MFEs' ThemedApp.tsx).
import type { ThemeOptions } from '@mui/material/styles';

export const UCP_COLORS = {
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  primaryLight: '#818CF8',
  accent: '#F59E0B',
  ink: '#0F172A',
  muted: '#475569',
  border: '#E2E8F0',
  surface: '#FFFFFF',
  canvas: '#F8FAFC',
  good: '#047857',
  attention: '#B45309',
  critical: '#B91C1C',
} as const;

export const ucpThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: { main: UCP_COLORS.primary, light: UCP_COLORS.primaryLight, dark: UCP_COLORS.primaryDark, contrastText: '#FFFFFF' },
    secondary: { main: UCP_COLORS.accent, contrastText: UCP_COLORS.ink },
    success: { main: '#059669', dark: UCP_COLORS.good },
    warning: { main: '#D97706', dark: UCP_COLORS.attention },
    error: { main: '#DC2626', dark: UCP_COLORS.critical },
    background: { default: UCP_COLORS.canvas, paper: UCP_COLORS.surface },
    text: { primary: UCP_COLORS.ink, secondary: UCP_COLORS.muted },
    divider: UCP_COLORS.border,
  },
  typography: {
    fontFamily: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'].join(','),
    // Headline figures scale with the screen so KPI values (now with currency codes such as RM or MYR) fit their cards.
    h3: { fontSize: 'clamp(1.75rem, 1.1rem + 1.4vw, 3rem)' },
    h4: { fontWeight: 800, letterSpacing: '-0.02em', fontSize: 'clamp(1.35rem, 0.95rem + 0.9vw, 2.125rem)' },
    h5: { fontWeight: 750, letterSpacing: '-0.015em', fontSize: 'clamp(1.1rem, 0.85rem + 0.55vw, 1.5rem)' },
    h6: { fontWeight: 700 },
    subtitle2: { fontWeight: 700 },
    overline: { fontWeight: 800, letterSpacing: '0.1em' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { outlined: { borderColor: UCP_COLORS.border } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, minHeight: 44 } } },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: UCP_COLORS.canvas,
            color: UCP_COLORS.muted,
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          },
        },
      },
    },
    MuiTableRow: { styleOverrides: { hover: { '&:hover': { backgroundColor: '#F1F5F9' } } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: 6 } } },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': { backgroundColor: '#EEF2FF', color: UCP_COLORS.primaryDark, fontWeight: 700 },
          '&.Mui-selected:hover': { backgroundColor: '#E0E7FF' },
        },
      },
    },
    MuiAlert: { styleOverrides: { root: { borderRadius: 10 } } },
    // A long figure wraps inside its card instead of running into the next one.
    MuiTypography: { styleOverrides: { h3: { overflowWrap: 'anywhere' }, h4: { overflowWrap: 'anywhere' }, h5: { overflowWrap: 'anywhere' } } },
  },
};
