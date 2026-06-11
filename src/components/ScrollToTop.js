import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Reset scroll position on route changes so new pages open at the top (not the footer).
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, search, hash]);

  return null;
}
