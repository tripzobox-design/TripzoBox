import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConfirmationDialog } from './components/common/ConfirmationDialog';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './styles/globals.css';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <ConfirmationDialog />
    </ErrorBoundary>
  </React.StrictMode>
);
