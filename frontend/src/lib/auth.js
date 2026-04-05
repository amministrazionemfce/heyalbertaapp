import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('hey_alberta_token');
    const savedUser = localStorage.getItem('hey_alberta_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        const res = await authAPI.me();
        setUser(res.data);
        localStorage.setItem('hey_alberta_user', JSON.stringify(res.data));
      } catch {
        localStorage.removeItem('hey_alberta_token');
        localStorage.removeItem('hey_alberta_user');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const applySession = useCallback((token, userObj) => {
    if (token) localStorage.setItem('hey_alberta_token', token);
    if (userObj) {
      localStorage.setItem('hey_alberta_user', JSON.stringify(userObj));
      setUser(userObj);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      applySession(res.data.token, res.data.user);
      return res.data;
    } catch (e) {
      if (e.response?.status === 403 && e.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        e.isEmailNotVerified = true;
      }
      throw e;
    }
  };

  const register = async (name, email, password, role = 'user') => {
    const res = await authAPI.register({ name, email, password, role });
    const { token, user: u } = res.data;
    if (token) {
      applySession(token, u);
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('hey_alberta_token');
    localStorage.removeItem('hey_alberta_user');
    setUser(null);
  };

  const upgradeToVendor = async () => {
    const res = await authAPI.updateMe({ role: 'vendor' });
    const updated = res.data;
    setUser(updated);
    localStorage.setItem('hey_alberta_user', JSON.stringify(updated));
    return updated;
  };

  const updateProfile = async (data) => {
    const res = await authAPI.updateMe(data);
    const updated = res.data;
    setUser(updated);
    localStorage.setItem('hey_alberta_user', JSON.stringify(updated));
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        upgradeToVendor,
        updateProfile,
        refreshUser: loadUser,
        applySession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}