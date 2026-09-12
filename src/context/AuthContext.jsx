import React, { createContext, useContext, useEffect, useState } from 'react';
import { clearLocalData } from '../db/localDb';

const AuthContext = createContext(null);
const SESSION_KEY = 'earth-movers-auth-session';
const USER_KEY = 'earth-movers-auth-user';
const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
const API_TOKEN = import.meta.env.VITE_API_TOKEN || '';

export const getAuthHeaders = () => {
  const headers = {};
  const session = sessionStorage.getItem(SESSION_KEY);
  if (session) headers.Authorization = `Bearer ${session}`;
  if (API_TOKEN) headers['X-API-Token'] = API_TOKEN;
  return headers;
};

export const getAuthenticatedUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (!session || !API_URL) {
      if (!session) await clearLocalData().catch(() => {});
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Session expired');
      const result = await response.json();
      setUser(result.user);
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(USER_KEY);
      await clearLocalData().catch(() => {});
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const login = async (username, password, role) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(API_TOKEN ? { 'X-API-Token': API_TOKEN } : {}) },
      body: JSON.stringify({ username, password, role })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Login failed');
    const previousUser = getAuthenticatedUser();
    if (previousUser?.id && previousUser.id !== result.user?.id) await clearLocalData();
    sessionStorage.setItem(SESSION_KEY, result.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', headers: getAuthHeaders() });
    } finally {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(USER_KEY);
      await clearLocalData().catch(() => {});
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role || null, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const getSessionKey = () => SESSION_KEY;
