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

const AuthContext = createContext();

/** Keeps legacy `axios` calls (cart, wishlist, etc.) authenticated */
function syncGlobalAxiosAuth(token) {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
}

export { TOKEN_KEY };

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

  const checkAuth = useCallback(async () => {
    const stored = localStorage.getItem(TOKEN_KEY);
    setToken(stored);
    syncGlobalAxiosAuth(stored);

    if (!stored) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await authAPI.getMe();
      setUser(data.user || null);
    } catch {
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
      const u = data.user;
      if (newToken) {
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
      const u = data.user;
      if (newToken) {
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
      }
      setUser(u || null);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Registration failed'
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      /* ignore */
    }
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
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);
  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated,
      isAdmin,
      login,
      register,
      logout,
      checkAuth,
      updateProfile
    }),
    [
      user,
      token,
      loading,
      isAuthenticated,
      isAdmin,
      login,
      register,
      logout,
      checkAuth,
      updateProfile
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
