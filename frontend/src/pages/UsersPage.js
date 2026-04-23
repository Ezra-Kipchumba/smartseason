/**
 * UsersPage.js
 * Admin-only page to manage user accounts.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoadingCenter, EmptyState, ConfirmModal, Modal, Alert, Spinner } from '../components/common';
import api from '../utils/api';
import { format } from 'date-fns';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(() => {
    api.get('/api/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchUsers();
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingCenter />;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1>Manage Users</h1>
          <p style={{ color: 'var(--stone-500)', fontSize: '.875rem', marginTop: 4 }}>{users.length} accounts in the system</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add User</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {users.length === 0 ? (
          <EmptyState title="No users yet" message="Add the first user to get started." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{u.name}</div>
                      {u.id === currentUser.id && <div style={{ fontSize: '.7rem', color: 'var(--green-600)' }}>You</div>}
                    </td>
                    <td style={{ color: 'var(--stone-600)', fontSize: '.875rem' }}>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-growing' : 'badge-planted'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--stone-500)', fontSize: '.875rem' }}>
                      {format(new Date(u.created_at), 'MMM d, yyyy')}
                    </td>
                    <td>
                      {u.id !== currentUser.id ? (
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(u)}>Remove</button>
                      ) : (
                        <span style={{ fontSize: '.75rem', color: 'var(--stone-300)' }}>Cannot remove self</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && <UserFormModal onClose={() => setShowForm(false)} onSaved={fetchUsers} />}
      {deleteTarget && (
        <ConfirmModal
          message={`Remove user "${deleteTarget.name}"? Their fields will be unassigned.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

function UserFormModal({ onClose, onSaved }) {
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'agent' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/api/users', form);
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Add New User"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" form="user-form" type="submit" disabled={loading}>
            {loading ? <><Spinner size="sm" /> Creating…</> : 'Create User'}
          </button>
        </>
      }
    >
      <Alert message={error} />
      <form id="user-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input className="form-control" value={form.name} onChange={set('name')} required placeholder="Jane Doe" />
        </div>
        <div className="form-group">
          <label className="form-label">Email *</label>
          <input className="form-control" type="email" value={form.email} onChange={set('email')} required placeholder="jane@example.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Password *</label>
          <input className="form-control" type="password" value={form.password} onChange={set('password')} required minLength={6} placeholder="Min. 6 characters" />
        </div>
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-control" value={form.role} onChange={set('role')}>
            <option value="agent">Field Agent</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </form>
    </Modal>
  );
}
