/**
 * Sidebar.js  (v2)
 * Fixed left navigation. Shows different links for admin vs agent.
 * Added: Field Map nav link.
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Inline SVG icons — no external icon library needed
const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const IconFields = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconMap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/>
    <line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
);
const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);
const IconLogout = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

function getInitials(name = '') {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-title">SmartSeason</div>
        <div className="sidebar-logo-sub">Field Monitor</div>
      </div>

      {/* Navigation links */}
      <nav className="sidebar-nav">
        <span className="nav-section-label">Overview</span>

        <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <IconDashboard /> Dashboard
        </NavLink>

        <span className="nav-section-label">Fields</span>

        <NavLink to="/fields" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <IconFields /> All Fields
        </NavLink>

        <NavLink to="/map" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <IconMap /> Field Map
        </NavLink>

        {/* Admin-only section */}
        {isAdmin && (
          <>
            <span className="nav-section-label">Admin</span>
            <NavLink to="/users" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <IconUsers /> Manage Users
            </NavLink>
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{getInitials(user?.name)}</div>
          <div>
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          <IconLogout /> Sign out
        </button>
      </div>
    </aside>
  );
}
