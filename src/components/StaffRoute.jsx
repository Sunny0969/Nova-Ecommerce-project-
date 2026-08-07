import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StaffRoute({ children, permission }) {
  const location = useLocation();
  const { loading, isAuthenticated, hasRole, hasPermission, firstStaffPath } = useAuth();

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const loginPath = `/login?next=${encodeURIComponent(
      `${location.pathname}${location.search || ''}`
    )}`;
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (!hasRole('staff')) {
    return <Navigate to={hasRole('admin') ? '/admin/dashboard' : '/home'} replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to={firstStaffPath || '/home'} replace />;
  }

  return children;
}
