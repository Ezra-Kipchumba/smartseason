/**
 * FieldsPage.js  (v2)
 * Lists fields with server-side filter bar (crop, location, stage).
 * Admins see all fields + can create/edit/delete.
 * Agents see only their assigned fields.
 * 120-field dataset uses server-side filtering — no client-side slice.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingCenter, StatusBadge, StageBadge, EmptyState, ConfirmModal } from '../components/common';
import FieldFormModal from '../components/fields/FieldFormModal';
import api from '../utils/api';
import { format } from 'date-fns';

const CROP_OPTIONS     = ['Maize', 'Beans', 'Wheat', 'Sorghum', 'Sunflower'];
const LOCATION_OPTIONS = ['Kiambu', 'Thika', 'Ruiru', 'Limuru', 'Naivasha'];
const STAGE_OPTIONS    = ['planted', 'growing', 'ready', 'harvested'];

export default function FieldsPage() {
  const { isAdmin } = useAuth();

  const [fields, setFields]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [editField, setEditField]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // Filter state — changes trigger a fresh API call (server-side filtering)
  const [filters, setFilters] = useState({ crop: '', location: '', stage: '' });

  const fetchFields = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.crop)     params.append('crop', filters.crop);
    if (filters.location) params.append('location', filters.location);
    if (filters.stage)    params.append('stage', filters.stage);

    api.get(`/api/fields?${params.toString()}`)
      .then(r => setFields(r.data))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { fetchFields(); }, [fetchFields]);

  const setFilter   = (key) => (e) => setFilters(f => ({ ...f, [key]: e.target.value }));
  const clearFilters = () => setFilters({ crop: '', location: '', stage: '' });
  const hasFilters  = filters.crop || filters.location || filters.stage;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/fields/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchFields();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1>Fields</h1>
          <p style={{ color: 'var(--stone-500)', fontSize: '.875rem', marginTop: 4 }}>
            {loading ? 'Loading…' : `${fields.length} field${fields.length !== 1 ? 's' : ''}${hasFilters ? ' matching filters' : (isAdmin ? ' total' : ' assigned to you')}`}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditField(null); setShowForm(true); }}>
            + Add Field
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <select value={filters.crop} onChange={setFilter('crop')}>
          <option value="">All Crops</option>
          {CROP_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={filters.location} onChange={setFilter('location')}>
          <option value="">All Locations</option>
          {LOCATION_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>

        <select value={filters.stage} onChange={setFilter('stage')}>
          <option value="">All Stages</option>
          {STAGE_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>

        {hasFilters && (
          <button className="filter-clear" onClick={clearFilters}>✕ Clear</button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Link to="/map" className="btn btn-secondary btn-sm">🗺 Map view</Link>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', borderTop: 'none' }}>
        {loading ? (
          <LoadingCenter />
        ) : fields.length === 0 ? (
          <EmptyState
            title="No fields found"
            message={hasFilters ? 'Try adjusting your filters.' : isAdmin ? 'Create your first field to get started.' : 'No fields assigned to you yet.'}
            action={isAdmin && !hasFilters && (
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>Add Field</button>
            )}
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Field Name</th>
                  <th>Crop</th>
                  <th>Location</th>
                  <th>Planted</th>
                  <th>Stage</th>
                  <th>Status</th>
                  {isAdmin && <th>Agent</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fields.map(field => (
                  <tr key={field.id}>
                    <td>
                      <Link to={`/fields/${field.id}`} style={{ fontWeight: 500, color: 'var(--green-700)' }}>
                        {field.name}
                      </Link>
                      {field.area_hectares && (
                        <div style={{ fontSize: '.72rem', color: 'var(--stone-400)' }}>{field.area_hectares} ha</div>
                      )}
                    </td>
                    <td style={{ color: 'var(--stone-700)', fontSize: '.875rem' }}>{field.crop_type}</td>
                    <td style={{ color: 'var(--stone-500)', fontSize: '.875rem' }}>
                      {field.location ? <>📍 {field.location}</> : '—'}
                    </td>
                    <td style={{ color: 'var(--stone-500)', fontSize: '.875rem' }}>
                      {format(new Date(field.planting_date), 'MMM d, yyyy')}
                    </td>
                    <td><StageBadge stage={field.stage} /></td>
                    <td><StatusBadge status={field.status} /></td>
                    {isAdmin && (
                      <td style={{ fontSize: '.875rem', color: 'var(--stone-600)' }}>
                        {field.agent_name || <span style={{ color: 'var(--stone-300)' }}>Unassigned</span>}
                      </td>
                    )}
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/fields/${field.id}`} className="btn btn-secondary btn-sm">View</Link>
                        {isAdmin && (
                          <>
                            <button className="btn btn-ghost btn-sm"
                              onClick={() => { setEditField(field); setShowForm(true); }}>
                              Edit
                            </button>
                            <button className="btn btn-danger btn-sm"
                              onClick={() => setDeleteTarget(field)}>
                              Del
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <FieldFormModal
          field={editField}
          onClose={() => { setShowForm(false); setEditField(null); }}
          onSaved={fetchFields}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          message={`Delete "${deleteTarget.name}"? This will remove all its update history too.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}