import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AppToaster } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalJsonLd from './components/GlobalJsonLd';
import ScrollToTop from './components/ScrollToTop';
import SkipLink from './components/SkipLink';
import RouteDocumentHead from './components/RouteDocumentHead';
import MobileBottomNav from './components/MobileBottomNav';
import Navbar from './components/Navbar';
import PromoTicker from './components/PromoTicker';
import HomeCategoryStrip from './components/HomeCategoryStrip';
import RouteTree from './routes/RouteTree';
import { isAdminPath, isStaffPath } from './utils/appShell';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { DeliveryLocationProvider } from './context/DeliveryLocationContext';
import { prefetchStorefrontRoutes } from './lib/prefetchStorefront';
import { registerServiceWorker } from './lib/registerServiceWorker';
import PushNotificationPrompt from './components/PushNotificationPrompt';

const Footer = lazy(() => import(/* webpackChunkName: "footer" */ './components/Footer'));
const WhatsAppFloatingButton = lazy(() =>
  import(/* webpackChunkName: "whatsapp-button" */ './components/WhatsAppFloatingButton')
);
const FacebookPixelTracker = lazy(() =>
  import(/* webpackChunkName: "facebook-pixel-tracker" */ './components/FacebookPixelTracker')
);
const DeferredThirdPartyScripts = lazy(() =>
  import(/* webpackChunkName: "deferred-third-party" */ './components/DeferredThirdPartyScripts')
);

function StorefrontAnalytics() {
  return (
    <Suspense fallback={null}>
      <FacebookPixelTracker />
      <DeferredThirdPartyScripts />
    </Suspense>
  );
}

function AppShell() {
  const { pathname } = useLocation();
  const isAdmin = isAdminPath(pathname);
  const isStaff = isStaffPath(pathname);
  const isStorefront = !isAdmin && !isStaff;

  useEffect(() => {
    if (isStorefront) prefetchStorefrontRoutes();
  }, [isStorefront]);

  useEffect(() => {
    if (isStorefront) registerServiceWorker();
  }, [isStorefront]);

  return (
    <div className="App">
      {isStorefront && <RouteDocumentHead />}
      {isStorefront && <GlobalJsonLd />}
      <AppToaster />
      {isStorefront && <SkipLink />}
      {isStorefront && (
        <>
          <PromoTicker />
          <Navbar />
        </>
      )}
      {isStorefront && <HomeCategoryStrip />}
      {isStorefront && (
        <Suspense fallback={null}>
          <WhatsAppFloatingButton />
        </Suspense>
      )}
      {isStorefront && <MobileBottomNav />}
      <main
        id="main-content"
        tabIndex={-1}
        className={isAdmin ? 'main-content main-content--admin' : 'main-content'}
      >
        <ErrorBoundary>
          <RouteTree />
        </ErrorBoundary>
      </main>

      {isStorefront && (
        <Suspense fallback={<footer className="site-chrome-placeholder site-chrome-placeholder--footer" aria-hidden />}>
          <Footer />
        </Suspense>
      )}
      {isStorefront && <StorefrontAnalytics />}
      {isStorefront && <PushNotificationPrompt />}
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <DeliveryLocationProvider>
          <WishlistProvider>
            <CartProvider>
              <Router>
                <ScrollToTop />
                <AppShell />
              </Router>
            </CartProvider>
          </WishlistProvider>
        </DeliveryLocationProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
