import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AppToaster } from './components/Toast';
import { PageSuspenseFallback } from './components/RouteFallback';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalJsonLd from './components/GlobalJsonLd';
import ScrollToTop from './components/ScrollToTop';
import FacebookPixelTracker from './components/FacebookPixelTracker';
import SkipLink from './components/SkipLink';
import RouteDocumentHead from './components/RouteDocumentHead';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { DeliveryLocationProvider } from './context/DeliveryLocationContext';
import { StaffAuthProvider } from './context/StaffAuthContext';

const StorefrontRoutes = lazy(() => import('./routes/StorefrontRoutes'));
const AdminRoutes = lazy(() => import('./routes/AdminRoutes'));
const StaffRoutes = lazy(() => import('./routes/StaffRoutes'));

const Navbar = lazy(() => import('./components/Navbar'));
const HomeCategoryStrip = lazy(() => import('./components/HomeCategoryStrip'));
const Footer = lazy(() => import('./components/Footer'));
const WhatsAppFloatingButton = lazy(() => import('./components/WhatsAppFloatingButton'));

function RouteTree() {
  const { pathname } = useLocation();

  if (pathname.startsWith('/admin')) {
    return (
      <StaffAuthProvider>
        <AdminRoutes />
      </StaffAuthProvider>
    );
  }

  if (pathname.startsWith('/staff')) {
    return (
      <StaffAuthProvider>
        <StaffRoutes />
      </StaffAuthProvider>
    );
  }

  return <StorefrontRoutes />;
}

function AppShell() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <div className="App">
      {!isAdmin && <RouteDocumentHead />}
      {!isAdmin && <GlobalJsonLd />}
      <AppToaster />
      {!isAdmin && <SkipLink />}
      {!isAdmin && (
        <Suspense fallback={<header className="site-chrome-placeholder site-chrome-placeholder--header" aria-hidden />}>
          <Navbar />
        </Suspense>
      )}
      {!isAdmin && (
        <Suspense fallback={<div className="site-chrome-placeholder site-chrome-placeholder--category-strip" aria-hidden />}>
          <HomeCategoryStrip />
        </Suspense>
      )}
      {!isAdmin && (
        <Suspense fallback={null}>
          <WhatsAppFloatingButton />
        </Suspense>
      )}
      <main
        id="main-content"
        tabIndex={-1}
        className={isAdmin ? 'main-content main-content--admin' : 'main-content'}
      >
        <ErrorBoundary>
          <Suspense fallback={<PageSuspenseFallback />}>
            <RouteTree />
          </Suspense>
        </ErrorBoundary>
      </main>

      {!isAdmin && (
        <Suspense fallback={<footer className="site-chrome-placeholder site-chrome-placeholder--footer" aria-hidden />}>
          <Footer />
        </Suspense>
      )}
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
                <FacebookPixelTracker />
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
