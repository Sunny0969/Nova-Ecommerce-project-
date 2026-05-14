import React, { createContext, useContext, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { hasAnyStaffPermission } from '../utils/staffPermissions';

const StaffAuthContext = createContext(null);

export function StaffAuthProvider({ children }) {
  const {
    user,
    token,
    permissionMap,
    hasPermission,
    logout,
    firstStaffPath
  } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);
  const staffUser = user?.roles?.includes('staff') ? user : null;
  const permissions = staffUser ? permissionMap : {};
  const staffToken = staffUser ? token : '';
  const hasAnyPermission = useMemo(() => hasAnyStaffPermission(permissions), [permissions]);

  const value = useMemo(
    () => ({
      staffUser,
      staffToken,
      permissions,
      isBlocked,
      setIsBlocked,
      hasPermission,
      hasAnyPermission,
      firstAllowedAdminPath: firstStaffPath,
      setStaffUser: () => {},
      setStaffToken: () => {},
      setPermissions: () => {},
      logout
    }),
    [
      staffUser,
      staffToken,
      permissions,
      isBlocked,
      hasPermission,
      hasAnyPermission,
      firstStaffPath,
      logout
    ]
  );

  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>;
}

export function useStaffAuth() {
  const v = useContext(StaffAuthContext);
  if (!v) {
    throw new Error('useStaffAuth must be used within StaffAuthProvider');
  }
  return v;
}

