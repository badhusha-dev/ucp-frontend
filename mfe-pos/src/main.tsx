import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import ThemedApp from './ThemedApp';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <CssBaseline />
      <ThemedApp />
    </BrowserRouter>
  </React.StrictMode>,
);
