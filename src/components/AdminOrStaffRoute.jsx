import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStaffAuth } from '../context/StaffAuthContext';

export default function AdminOrStaffRoute({ children, permission }) {
  const { user } = useAuth();
  const { staffUser, staffToken, permissions } = useStaffAuth();

  // ✅ Admin always allowed
  if (user?.role === 'admin') {
    return children;
  }

  // ✅ If no staff token → redirect to staff login
  if (!staffToken || !staffUser) {
    return <Navigate to="/staff-login" replace />;
  }

  // ✅ If permission not required (like /admin root layout)
  if (!permission) {
    return children;
  }

  // ✅ Staff allowed only if permission true
  if (permissions?.[permission] === true) {
    return children;
  }

  // ✅ Permission denied
  return <Navigate to="/staff/dashboard" replace />;
}