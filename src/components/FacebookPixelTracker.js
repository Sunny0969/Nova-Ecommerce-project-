import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
function isStorefrontPath(pathname) {
  return !pathname.startsWith('/admin') && !pathname.startsWith('/staff');
}

/**
 * SPA analytics on route changes (Meta Pixel PageView + GA4 page_view via dataLayer).
 * Initial hits are sent after deferred third-party scripts load (~2s post-render).
 */
export default function FacebookPixelTracker() {
  const { pathname, search } = useLocation();
  const isFirstNav = useRef(true);

  useEffect(() => {
    if (!isStorefrontPath(pathname)) return;

    if (isFirstNav.current) {
      isFirstNav.current = false;
      return;
    }

    void import('../lib/metaPixel').then(({ trackPageView }) => trackPageView());
  }, [pathname, search]);

  return null;
}
