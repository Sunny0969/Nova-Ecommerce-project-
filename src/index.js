import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/mobile.css';
import './mix.css';
import { DelayedFallback } from './components/DelayedSuspense';
import BrandLogoLoader from './components/BrandLogoLoader';
import { prefetchStorefrontRoutes } from './lib/prefetchStorefront';
import { capturePrerenderDocumentSeeds } from './lib/prerenderFallback';

const App = lazy(() => import('./App'));

function RootFallback() {
  return <BrandLogoLoader label="Loading Bazaar" />;
}

const appTree = (
  <React.StrictMode>
    <Suspense fallback={<DelayedFallback delayMs={120} fallback={<RootFallback />} />}>
      <App />
    </Suspense>
  </React.StrictMode>
);

if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

capturePrerenderDocumentSeeds();

if (typeof document !== 'undefined') {
  document.documentElement.classList.add('js');
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Missing #root mount node');
}

createRoot(container).render(appTree);

prefetchStorefrontRoutes();
