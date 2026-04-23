/**
 * App.js
 * Root component. Sets up routing and the app shell layout.
 * Public routes: /login
 * Protected routes: everything else (wrapped in app shell with sidebar)
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Sidebar from './components/common/Sidebar';

import LoginPage      from './pages/LoginPage';
import DashboardPage  from './pages/DashboardPage';
import FieldsPage     from './pages/FieldsPage';
import FieldDetailPage from './pages/FieldDetailPage';
import UsersPage      from './pages/UsersPage';

/**
 * AppShell wraps authenticated pages with the sidebar + topbar layout.
 * Outlet renders the matched child route.
 */
function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected shell routes */}
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/fields"    element={<FieldsPage />} />
            <Route path="/fields/:id" element={<FieldDetailPage />} />

            {/* Admin-only */}
            <Route path="/users" element={
              <ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>
            } />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
