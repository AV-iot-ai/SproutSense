/**
 * main.jsx — src/
 * Vite entry point for SproutSense React app.
 *
 * CSS import order matters:
 *  1. variables.css — CSS custom properties (colors, spacing, etc.)
 *  2. globals.css   — resets, body/html, theme transition system
 *  (App.css + page-level CSS are imported inside their respective components)
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// ── Global styles (import FIRST so variables are available to all components)
import './styles/variables.css';
import './styles/globals.css';

import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
