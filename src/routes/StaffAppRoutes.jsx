import React, { lazy, Suspense } from 'react';
import { StaffAuthProvider } from '../context/StaffAuthContext';
import RouteFallback from '../components/RouteFallback';

const StaffRoutes = lazy(() =>
  import(/* webpackChunkName: "staff-routes" */ './StaffRoutes')
);

export default function StaffAppRoutes() {
  return (
    <StaffAuthProvider>
      <Suspense fallback={<RouteFallback />}>
        <StaffRoutes />
      </Suspense>
    </StaffAuthProvider>
  );
}
