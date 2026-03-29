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

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('hey_alberta_token', res.data.token);
    localStorage.setItem('hey_alberta_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password, role = 'user') => {
    const res = await authAPI.register({ name, email, password, role });
    localStorage.setItem('hey_alberta_token', res.data.token);
    localStorage.setItem('hey_alberta_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
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
    <AuthContext.Provider value={{ user, loading, login, register, logout, upgradeToVendor, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}