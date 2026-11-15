import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Handle Service Worker for Offline / PWA capability safely without causing preview iframe flickering
if ('serviceWorker' in navigator) {
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  const isDev = Boolean(import.meta.env.DEV);

  if (isDev || isInIframe) {
    // In development or preview iframes, unregister existing service workers to avoid reload loops and caching conflicts
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});
  } else {
    window.addEventListener('load', () => {
      const swPath = '/sw.js';
      navigator.serviceWorker.register(swPath)
        .then((registration) => {
          console.log('[PWA] Service Worker registered successfully:', registration.scope);
        })
        .catch((error) => {
          console.warn('[PWA] Service Worker registration failed:', error);
        });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);


