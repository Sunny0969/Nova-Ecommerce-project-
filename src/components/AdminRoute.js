import React, { createContext, useContext, useState, useEffect } from 'react';
import { staffAPI } from 'api';

const StaffAuthContext = createContext(null);

export const useStaffAuth = () => {
  const context = useContext(StaffAuthContext);
  if (!context) {
    // Return default values instead of throwing error to prevent hook issues
    return {
      staffToken: null,
      staffUser: null,
      loading: false,
      permissions: [],
      login: async () => ({ success: false }),
      logout: () => {},
      hasPermission: () => false
    };
  }
  return context;
};

export const StaffAuthProvider = ({ children }) => {
  const [staffUser, setStaffUser] = useState(null);
  const [staffToken, setStaffToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  // Check if staff is logged in on mount
  useEffect(() => {
    checkStaffAuth();
  }, []);

  const checkStaffAuth = async () => {
    try {
      const token = localStorage.getItem('staffToken');
      
      if (!token) {
        setLoading(false);
        return;
      }

      setStaffToken(token);

      // Verify token with backend and get staff info + permissions
      const response = await staffAPI.getMe();
      
      if (response.data.success) {
        setStaffUser(response.data.staff);
        setPermissions(response.data.permissions || []);
      } else {
        // Invalid token - clear everything
        localStorage.removeItem('staffToken');
        setStaffToken(null);
        setStaffUser(null);
        setPermissions([]);
      }
    } catch (error) {
      console.error('Staff auth check failed:', error);
      localStorage.removeItem('staffToken');
      setStaffToken(null);
      setStaffUser(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await staffAPI.login({ email, password });
      
      if (response.data.success) {
        const { token, staff, permissions: staffPermissions } = response.data;
        
        // Save token to localStorage
        localStorage.setItem('staffToken', token);
        
        // Update state
        setStaffToken(token);
        setStaffUser(staff);
        setPermissions(staffPermissions || []);
        
        return { success: true };
      }
      
      return { 
        success: false, 
        message: response.data.message || 'Login failed' 
      };
    } catch (error) {
      console.error('Staff login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await staffAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear everything
      localStorage.removeItem('staffToken');
      setStaffToken(null);
      setStaffUser(null);
      setPermissions([]);
    }
  };

  const hasPermission = (moduleName) => {
    // Super admin has all permissions (if somehow they use staff context)
    if (staffUser?.role === 'admin') return true;
    
    // Staff members - check permissions array
    return permissions.includes(moduleName);
  };

  const value = {
    staffUser,
    staffToken,
    loading,
    permissions,
    login,
    logout,
    hasPermission,
    checkStaffAuth
  };

  return (
    <StaffAuthContext.Provider value={value}>
      {children}
    </StaffAuthContext.Provider>
  );
};

export default StaffAuthContext;