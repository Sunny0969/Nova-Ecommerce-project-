import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo
} from 'react';
import axios from 'axios';
import { authAPI, TOKEN_KEY } from 'api';
import {
  getFirstAllowedStaffPath,
  normalizeStaffPermissions,
  permissionListFromMap
} from '../utils/staffPermissions';

const AuthContext = createContext();
const LEGACY_STAFF_STORAGE_KEYS = ['staffToken', 'staffPermissions', 'staffUser'];

/** Keeps legacy `axios` calls (cart, wishlist, etc.) authenticated */
function syncGlobalAxiosAuth(token) {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
}

export { TOKEN_KEY };

function clearLegacyStaffStorage() {
  LEGACY_STAFF_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

function normalizeAuthUser(rawUser) {
  if (!rawUser || typeof rawUser !== 'object') return null;

  const roles = Array.isArray(rawUser.roles)
    ? rawUser.roles.filter(Boolean)
    : rawUser.role === 'admin'
      ? ['customer', 'admin']
      : rawUser.role
        ? [rawUser.role]
        : [];
  const permissionMap = normalizeStaffPermissions(rawUser.permissionMap || rawUser.permissions || {});

  return {
    ...rawUser,
    role: rawUser.role || (roles.includes('admin') ? 'admin' : roles[0] || ''),
    roles,
    permissionMap,
    permissions: permissionListFromMap(permissionMap)
  };
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    syncGlobalAxiosAuth(token);
  }, [token]);

  useEffect(() => {
    const onSessionExpired = () => {
      clearLegacyStaffStorage();
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      syncGlobalAxiosAuth(null);
    };
    window.addEventListener('nova-auth-expired', onSessionExpired);
    return () => window.removeEventListener('nova-auth-expired', onSessionExpired);
  }, []);

  const checkAuth = useCallback(async () => {
    const stored = localStorage.getItem(TOKEN_KEY);
    setToken(stored);
    syncGlobalAxiosAuth(stored);

    if (!stored) {
      clearLegacyStaffStorage();
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await authAPI.getMe();
      setUser(normalizeAuthUser(data.user));
    } catch {
      clearLegacyStaffStorage();
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      syncGlobalAxiosAuth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await authAPI.login({ email, password });
      const newToken = data.token;
      const u = normalizeAuthUser(data.user);
      if (newToken) {
        clearLegacyStaffStorage();
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
      }
      setUser(u || null);
      return { success: true, user: u };
    } catch (error) {
      const body = error.response?.data;
      return {
        success: false,
        error: body?.message || body?.error || 'Login failed',
        code: body?.code,
        status: error.response?.status
      };
    }
  }, []);

  /**
   * @param {string | object} nameOrPayload - Full name, or legacy register object from forms
   * @param {string} [email]
   * @param {string} [password]
   */
  const register = useCallback(async (nameOrPayload, email, password) => {
    try {
      let name;
      let em;
      let pw;
      let phone = '';

      if (typeof nameOrPayload === 'object' && nameOrPayload !== null) {
        const u = nameOrPayload;
        name =
          u.name ||
          [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
        em = u.email;
        pw = u.password;
        phone = u.phone != null ? String(u.phone).trim() : '';
      } else {
        name = nameOrPayload != null ? String(nameOrPayload).trim() : '';
        em = email;
        pw = password;
      }

      if (!name) {
        return { success: false, error: 'Name is required' };
      }

      const { data } = await authAPI.register({
        name,
        email: em,
        password: pw,
        phone
      });
      const newToken = data.token;
      const u = normalizeAuthUser(data.user);
      if (newToken) {
        clearLegacyStaffStorage();
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
      }
      setUser(u || null);
      return { success: true, code: data.code };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Registration failed',
        code: error.response?.data?.code
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      /* ignore */
    }
    clearLegacyStaffStorage();
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    syncGlobalAxiosAuth(null);

    if (typeof window !== 'undefined') {
      window.location.assign('/');
    }

    return { success: true };
  }, []);

  const updateProfile = useCallback((data) => {
    setUser((prev) => normalizeAuthUser(prev ? { ...prev, ...data } : data));
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);
  const roles = useMemo(() => (Array.isArray(user?.roles) ? user.roles : []), [user]);
  const permissionMap = useMemo(() => normalizeStaffPermissions(user?.permissionMap), [user?.permissionMap]);
  const permissions = useMemo(() => permissionListFromMap(permissionMap), [permissionMap]);
  const hasRole = useCallback((roleName) => roles.includes(roleName), [roles]);
  const hasPermission = useCallback(
    (permissionName) => permissionMap[permissionName] === true,
    [permissionMap]
  );
  const isAdmin = useMemo(() => hasRole('admin'), [hasRole]);
  const isStaff = useMemo(() => hasRole('staff'), [hasRole]);
  const isCustomer = useMemo(() => hasRole('customer'), [hasRole]);
  const canAccessCustomerApp = useMemo(() => isCustomer, [isCustomer]);
  const firstStaffPath = useMemo(() => getFirstAllowedStaffPath(permissionMap), [permissionMap]);

  const value = useMemo(
    () => ({
      user,
      token,
      roles,
      permissions,
      permissionMap,
      loading,
      isAuthenticated,
      isAdmin,
      isStaff,
      isCustomer,
      canAccessCustomerApp,
      firstStaffPath,
      hasRole,
      hasPermission,
      login,
      register,
      logout,
      checkAuth,
      updateProfile
    }),
    [
      user,
      token,
      roles,
      permissions,
      permissionMap,
      loading,
      isAuthenticated,
      isAdmin,
      isStaff,
      isCustomer,
      canAccessCustomerApp,
      firstStaffPath,
      hasRole,
      hasPermission,
      login,
      register,
      logout,
      checkAuth,
      updateProfile
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
