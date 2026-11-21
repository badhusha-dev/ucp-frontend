// What the shell loads from this micro-frontend: the app in the shared UCP look. This bundle has its own MUI, so the
// shell's theme cannot reach it; it builds the same theme from the shared options instead.
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ucpThemeOptions } from '@ecommerce/shared-library/src/ui/adminTheme';
import App from './App';

// The options are plain data typed against the shared library's MUI version; this bundle's MUI may differ.
const theme = createTheme(ucpThemeOptions as unknown as Parameters<typeof createTheme>[0]);

export default function ThemedApp() {
  return (
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  );
}
