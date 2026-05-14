import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStaffAuth } from '../context/StaffAuthContext';

function AccessDenied({ firstAllowedAdminPath, message }) {
  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div className="api-error-banner" role="alert">
        <strong>Access denied.</strong> {message}
      </div>
      {firstAllowedAdminPath ? (
        <p style={{ marginTop: 12 }}>
          <Link to={firstAllowedAdminPath}>Go to your allowed section</Link>
        </p>
      ) : null}
    </div>
  );
}

export default function AdminOrStaffRoute({ children, permission, adminOnly = false }) {
  const location = useLocation();
  const { user } = useAuth();
  const { staffUser, staffToken, hasPermission, hasAnyPermission, firstAllowedAdminPath } = useStaffAuth();

  if (user?.role === 'admin') {
    return children;
  }

  if (!staffToken || !staffUser) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly) {
    if (firstAllowedAdminPath && location.pathname !== firstAllowedAdminPath) {
      return <Navigate to={firstAllowedAdminPath} replace />;
    }

    return (
      <AccessDenied
        firstAllowedAdminPath={firstAllowedAdminPath}
        message="This page is available to administrators only."
      />
    );
  }

  if (!permission) {
    return children;
  }

  if (hasPermission(permission)) {
    return children;
  }

  if (firstAllowedAdminPath && location.pathname !== firstAllowedAdminPath) {
    return <Navigate to={firstAllowedAdminPath} replace />;
  }

  return (
    <AccessDenied
      firstAllowedAdminPath={firstAllowedAdminPath}
      message={
        hasAnyPermission
          ? 'You do not have permission to open this section.'
          : 'Your staff account does not have any admin panel permissions yet.'
      }
    />
  );
}