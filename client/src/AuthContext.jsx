import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('invoicepal_token');
    if (!token) { setLoading(false); return; }
    try {
      const data = await api.auth.me();
      setUser(data.user);
    } catch { localStorage.removeItem('invoicepal_token'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const data = await api.auth.login({ email, password });
    localStorage.setItem('invoicepal_token', data.token);
    setUser(data.user);
    return data;
  };

  const signup = async (email, name, password) => {
    const data = await api.auth.signup({ email, name, password });
    localStorage.setItem('invoicepal_token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => { localStorage.removeItem('invoicepal_token'); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error('useAuth must be used within AuthProvider'); return ctx; }