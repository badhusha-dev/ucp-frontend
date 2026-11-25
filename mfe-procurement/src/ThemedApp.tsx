// What the storefront loads from this micro-frontend: the app in the shared UCP look. This bundle has its own MUI, so
// the storefront's theme cannot reach it; it builds the same theme from the shared options instead.
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ucpThemeOptions } from '@ecommerce/shared-library/src/ui/adminTheme';
import App from './App';

// The options are plain data typed against the shared library's MUI version; this bundle's MUI may differ.
// Procurement is laid out on a dark canvas, so it takes the shared options with a dark palette: the light palette's grey
// secondary text and pale table headers were almost invisible on it.
const base = ucpThemeOptions as unknown as { palette?: Record<string, unknown>; components?: Record<string, unknown> };
const theme = createTheme({
  ...(base as object),
  palette: {
    ...(base.palette ?? {}),
    mode: 'dark',
    background: { default: '#0B1220', paper: '#121B2D' },
    text: { primary: '#E7EDF7', secondary: '#A7B4C8' },
    divider: '#26334B',
  },
  components: {
    ...(base.components ?? {}),
    MuiTableHead: { styleOverrides: { root: { '& .MuiTableCell-head': { backgroundColor: '#172338', color: '#A7B4C8', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' } } } },
    MuiTableRow: { styleOverrides: { hover: { '&:hover': { backgroundColor: '#1A2740' } } } },
  },
} as Parameters<typeof createTheme>[0]);

export default function ThemedApp() {
  return (
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  );
}
