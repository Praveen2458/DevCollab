import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { http } from '../api/http';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return null;
      }
      const { data } = await http.get('/api/auth/me');
      setUser(data.user);
      return data.user;
    } catch {
      localStorage.removeItem('token');
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const me = await refreshMe();
        if (cancelled) return;
        setUser(me);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshMe]);

  const signup = useCallback(async ({ name, email, password }) => {
    const { data } = await http.post('/api/auth/signup', { name, email, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const { data } = await http.post('/api/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await http.post('/api/auth/logout');
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, signup, login, logout, refreshMe }),
    [user, loading, signup, login, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
