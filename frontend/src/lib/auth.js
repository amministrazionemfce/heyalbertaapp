import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from './api';
import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  clearLocalAuth,
  clearSessionAuth,
  getAuthPersistenceScope,
  getStoredAuthToken,
  getStoredUserJson,
} from './authStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = getStoredAuthToken();
    const savedUser = getStoredUserJson();
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        const res = await authAPI.me();
        setUser(res.data);
        const scope = getAuthPersistenceScope();
        const json = JSON.stringify(res.data);
        if (scope === 'session') {
          sessionStorage.setItem(AUTH_USER_KEY, json);
        } else {
          localStorage.setItem(AUTH_USER_KEY, json);
        }
      } catch {
        const scope = getAuthPersistenceScope();
        if (scope === 'session') clearSessionAuth();
        else clearLocalAuth();
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  /**
   * @param {string} token
   * @param {object} userObj
   * @param {{ scope?: 'local' | 'session' }} [options] — `session` = tab-only (admin preview); does not overwrite other tabs’ localStorage.
   */
  const applySession = useCallback((token, userObj, options = {}) => {
    const scope = options.scope === 'session' ? 'session' : 'local';
    if (scope === 'session') {
      if (token) sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      if (userObj) {
        sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(userObj));
        setUser(userObj);
      }
      return;
    }
    clearSessionAuth();
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    if (userObj) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userObj));
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

  const logout = useCallback(() => {
    const wasTabPreview = getAuthPersistenceScope() === 'session';
    clearSessionAuth();
    if (wasTabPreview && localStorage.getItem(AUTH_TOKEN_KEY)) {
      void loadUser();
      return;
    }
    clearLocalAuth();
    setUser(null);
  }, [loadUser]);

  const persistUserSnapshot = useCallback((updated) => {
    const json = JSON.stringify(updated);
    const scope = getAuthPersistenceScope();
    if (scope === 'session') sessionStorage.setItem(AUTH_USER_KEY, json);
    if (scope === 'local') localStorage.setItem(AUTH_USER_KEY, json);
  }, []);

  const upgradeToVendor = async () => {
    const res = await authAPI.updateMe({ role: 'vendor' });
    const updated = res.data;
    setUser(updated);
    persistUserSnapshot(updated);
    return updated;
  };

  const updateProfile = async (data) => {
    const res = await authAPI.updateMe(data);
    const updated = res.data;
    setUser(updated);
    persistUserSnapshot(updated);
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