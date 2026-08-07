import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DelayedFallback } from '../components/DelayedSuspense';
import { PageSuspenseFallback } from '../components/RouteFallback';
import { resolveAppShellKey } from '../utils/appShell';

const SHELL_LOADERS = {
  admin: () => import(/* webpackChunkName: "admin-app" */ './AdminAppRoutes'),
  staff: () => import(/* webpackChunkName: "staff-app" */ './StaffAppRoutes'),
  storefront: () => import(/* webpackChunkName: "storefront-app" */ './StorefrontAppRoutes')
};

/** Loaded route shells — avoid re-fetching when navigating within the same app. */
const shellCache = {
  admin: null,
  staff: null,
  storefront: null
};

export default function RouteTree() {
  const { pathname } = useLocation();
  const appKey = resolveAppShellKey(pathname);
  const [Shell, setShell] = useState(() => shellCache[appKey] || null);
  const [pendingKey, setPendingKey] = useState(() => (shellCache[appKey] ? null : appKey));

  useEffect(() => {
    if (shellCache[appKey]) {
      setShell(() => shellCache[appKey]);
      setPendingKey(null);
      return undefined;
    }

    let active = true;
    setPendingKey(appKey);
    setShell(null);

    SHELL_LOADERS[appKey]()
      .then((mod) => {
        shellCache[appKey] = mod.default;
        if (active) {
          setShell(() => mod.default);
          setPendingKey(null);
        }
      })
      .catch(() => {
        if (active) setPendingKey(null);
      });

    return () => {
      active = false;
    };
  }, [appKey]);

  if (!Shell) {
    return (
      <DelayedFallback
        delayMs={200}
        fallback={
          <PageSuspenseFallback label={pendingKey === 'admin' ? 'Loading admin' : 'Loading page'} />
        }
      />
    );
  }

  return <Shell />;
}
