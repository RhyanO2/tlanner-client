import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { SpeedInsights } from '@vercel/speed-insights/next';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SpeedInsights />
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
