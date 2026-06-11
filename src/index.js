import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './assets/fonts/taskor/taskor.css';
import './index.css';
import './styles/mobile.css';
import './mix.css';

const App = lazy(() => import('./App'));

function RootFallback() {
  return (
    <div
      className="site-chrome-placeholder site-chrome-placeholder--header"
      style={{ minHeight: '100vh' }}
      aria-busy="true"
      aria-label="Loading Bazaar"
    />
  );
}

if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Suspense fallback={<RootFallback />}>
      <App />
    </Suspense>
  </React.StrictMode>
);
