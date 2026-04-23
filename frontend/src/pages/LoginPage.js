/**
 * LoginPage.js
 * Public login form. Redirects to /dashboard on success.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, Spinner } from '../components/common';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick-fill demo credentials
  const fillDemo = (email) => setForm({ email, password: 'password123' });

  return (
    <div className="auth-page">
      {/* Left branding panel */}
      <div className="auth-panel-left">
        <div className="auth-brand">
          <div className="auth-brand-logo">Smart<span>Season</span></div>
          <div className="auth-brand-tagline">
            Real-time field monitoring for modern agricultural operations.
          </div>
        </div>
        <div className="auth-features">
          {['Track crop stages across all fields', 'Assign & monitor field agents', 'Automated risk detection'].map(f => (
            <div className="auth-feature" key={f}>
              <div className="auth-feature-dot" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-panel-right">
        <div className="auth-form-box fade-in">
          <h1 className="auth-form-title">Welcome back</h1>
          <p className="auth-form-sub">Sign in to your account to continue.</p>

          <Alert message={error} />

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email" name="email" type="email"
                className="form-control" value={form.email}
                onChange={handleChange} required autoFocus
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password" name="password" type="password"
                className="form-control" value={form.password}
                onChange={handleChange} required
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit" className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? <><Spinner size="sm" /> Signing in…</> : 'Sign in'}
            </button>
          </form>

          {/* Demo credential shortcuts */}
          <div style={{ marginTop: 28, padding: '16px', background: 'var(--stone-100)', borderRadius: 'var(--radius)', fontSize: '.8rem' }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--stone-700)' }}>Demo credentials</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['Admin',   'admin@smartseason.com'],
                ['Agent 1', 'agent1@smartseason.com'],
                ['Agent 2', 'agent2@smartseason.com'],
              ].map(([label, email]) => (
                <button
                  key={email}
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', fontSize: '.8rem' }}
                  onClick={() => fillDemo(email)}
                  type="button"
                >
                  <span style={{ background: 'var(--green-700)', color: '#fff', borderRadius: 4, padding: '1px 7px', marginRight: 6, fontSize: '.7rem' }}>{label}</span>
                  {email}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
