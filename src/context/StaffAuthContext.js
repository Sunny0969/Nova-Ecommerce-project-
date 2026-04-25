import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StaffAuthContext = createContext(null);

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function StaffAuthProvider({ children }) {
  const navigate = useNavigate();
  const [staffToken, setStaffToken] = useState(() => localStorage.getItem('staffToken') || '');
  const [staffUser, setStaffUser] = useState(() => readJson('staffUser', null));
  const [permissions, setPermissions] = useState(() => readJson('staffPermissions', {}));
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const onStorage = () => {
      setStaffToken(localStorage.getItem('staffToken') || '');
      setStaffUser(readJson('staffUser', null));
      setPermissions(readJson('staffPermissions', {}));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const hasPermission = useCallback(
    (permName) => Boolean(permissions && permName && permissions[permName] === true),
    [permissions]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffPermissions');
    localStorage.removeItem('staffUser');
    setStaffToken('');
    setStaffUser(null);
    setPermissions({});
    setIsBlocked(false);
    navigate('/staff-login', { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({
      staffUser,
      staffToken,
      permissions,
      isBlocked,
      setIsBlocked,
      hasPermission,
      setStaffUser,
      setStaffToken,
      setPermissions,
      logout
    }),
    [staffUser, staffToken, permissions, isBlocked, hasPermission, logout]
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

