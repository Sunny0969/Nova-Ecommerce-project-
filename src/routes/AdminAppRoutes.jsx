import React, { lazy, Suspense } from 'react';
import { StaffAuthProvider } from '../context/StaffAuthContext';
import RouteFallback from '../components/RouteFallback';

const AdminRoutes = lazy(() =>
  import(/* webpackChunkName: "admin-routes" */ './AdminRoutes')
);

export default function AdminAppRoutes() {
  return (
    <StaffAuthProvider>
      <Suspense fallback={<RouteFallback />}>
        <AdminRoutes />
      </Suspense>
    </StaffAuthProvider>
  );
}
