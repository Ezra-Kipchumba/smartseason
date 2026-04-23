/**
 * AuthContext.js
 * Global auth state — provides user info and login/logout to all components.
 * Using React Context avoids prop-drilling through every component layer.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [loading, setLoading] = useState(true);

  // On mount, verify token is still valid with the backend
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    api.get('/api/auth/me')
      .then(res => setUser(res.data))
      .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
