import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'accounting_mfe',
      filename: 'remoteEntry.js',
      exposes: { './App': './src/ThemedApp' },
      // react-redux must come from the host too: recharts 3 renders through react-redux, and a bundled copy runs on
      // a second React instance, so every chart crashed the page ("Cannot read properties of null (reading 'useRef')").
      shared: ['react', 'react-dom', 'react-redux', 'react-router-dom'],
    }),
  ],
  resolve: {
    // One MUI/Emotion copy: shared-library/src/ui is imported by path and would otherwise pick up the library's nested MUI 5.
    dedupe: ['@mui/material', '@mui/system', '@mui/utils', '@mui/styled-engine', '@emotion/react', '@emotion/styled'],
    alias: [
      // recharts 3 imports this CommonJS hook, whose require('react') would bind to this remote's own React copy.
      {
        find: /^use-sync-external-store\/shim\/with-selector(\.js)?$/,
        replacement: fileURLToPath(new URL('./src/vendor/useSyncExternalStoreWithSelector.ts', import.meta.url)),
      },
    ],
  },
  build: { modulePreload: false, target: 'esnext', minify: false, cssCodeSplit: false },
  server: { port: 3007, cors: true, proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } } },
  preview: { port: 3007, cors: true },
});
