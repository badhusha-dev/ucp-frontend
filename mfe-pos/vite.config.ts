import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'pos_mfe',
      filename: 'remoteEntry.js',
      exposes: { './App': './src/ThemedApp' },
      shared: {
        'react': { singleton: true, requiredVersion: false },
        'react-dom': { singleton: true, requiredVersion: false },
        'react-redux': { singleton: true, requiredVersion: false },
        'react-router-dom': { singleton: true, requiredVersion: false },
        '@ecommerce/shared-library': { singleton: true, requiredVersion: false },
      },
    }),
  ],
  resolve: {
    // One MUI/Emotion copy: shared-library/src/ui is imported by path and would otherwise pick up the library's nested MUI 5.
    dedupe: ['@mui/material', '@mui/system', '@mui/utils', '@mui/styled-engine', '@emotion/react', '@emotion/styled'],
  },
  build: { modulePreload: false, target: 'esnext', minify: false, cssCodeSplit: false },
  server: { port: 3015, cors: true, proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } } },
  preview: { port: 3015, cors: true },
});
