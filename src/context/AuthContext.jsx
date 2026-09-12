import React, { createContext, useContext, useEffect, useState } from 'react';
import { clearLocalData } from '../db/localDb';
import { API_URL } from '../utils/apiUrl';

const AuthContext = createContext(null);
const SESSION_KEY = 'earth-movers-auth-session';
const USER_KEY = 'earth-movers-auth-user';

export const getAuthHeaders = () => {
  return { 'X-Client-Request': 'EarthMovers' };
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
    const storedUser = sessionStorage.getItem(USER_KEY);
    if (!storedUser || !API_URL) {
      if (!storedUser) await clearLocalData().catch(() => {});
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, { headers: getAuthHeaders(), credentials: 'include' });
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
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password, role })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Login failed');
    const previousUser = getAuthenticatedUser();
    if (previousUser?.id && previousUser.id !== result.user?.id) await clearLocalData();
    sessionStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const response = await fetch(`${API_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Password change failed');
  };

  const changeManagerPassword = async (currentPassword, newPassword) => {
    const response = await fetch(`${API_URL}/api/auth/change-manager-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Manager password change failed');
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', headers: getAuthHeaders(), credentials: 'include' });
    } finally {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(USER_KEY);
      await clearLocalData().catch(() => {});
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role || null, loading, login, changePassword, changeManagerPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const getSessionKey = () => SESSION_KEY;
