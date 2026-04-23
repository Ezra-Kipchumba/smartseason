/**
 * ProtectedRoute.js
 * Redirects unauthenticated users to /login.
 * Optionally restricts a route to admins only.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingCenter } from './index';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingCenter />;

  if (!user) return <Navigate to="/login" replace />;

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
