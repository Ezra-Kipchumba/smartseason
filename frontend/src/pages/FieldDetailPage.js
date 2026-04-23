/**
 * FieldDetailPage.js
 * Shows full field info, history, and allows agents to add updates.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingCenter, StatusBadge, StageBadge, Alert } from '../components/common';
import api from '../utils/api';
import { format, formatDistanceToNow } from 'date-fns';
import { getFieldWeather } from '../utils/api';

const STAGES = ['planted', 'growing', 'ready', 'harvested'];

export default function FieldDetailPage() {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();

  const [field, setField]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateForm, setUpdateForm] = useState({ new_stage: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const fetchField = useCallback(() => {
    api.get(`/api/fields/${id}`)
      .then(r => { setField(r.data); setUpdateForm(f => ({ ...f, new_stage: r.data.stage })); })
      .catch(() => navigate('/fields'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

 useEffect(() => { fetchField(); }, [fetchField]);
 useEffect(() => {
  const fetchWeather = async () => {
    if (!field?.latitude || !field?.longitude) return;

    try {
      setWeatherLoading(true);
      const res = await getFieldWeather(field.id);
      setWeather(res.weather);
    } catch (err) {
      console.error('Weather fetch error:', err);
    } finally {
      setWeatherLoading(false);
    }
  };

  fetchWeather();
 }, [field?.id, field?.latitude, field?.longitude]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!updateForm.notes && updateForm.new_stage === field.stage) {
      setError('Please change the stage or add a note.'); return;
    }
    setError(''); setSubmitting(true);
    try {
      await api.post(`/api/fields/${id}/updates`, updateForm);
      setSuccess('Update recorded successfully!');
      fetchField();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save update.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingCenter />;
  if (!field) return null;

  const canUpdate = isAdmin || field.assigned_to === user?.id;

  return (
    <div className="fade-in">
      {/* Back + header */}
      <div style={{ marginBottom: 24 }}>
        <Link to="/fields" style={{ fontSize: '.85rem', color: 'var(--stone-500)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
          ← Back to Fields
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1>{field.name}</h1>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <StageBadge stage={field.stage} />
              <StatusBadge status={field.status} />
              <span style={{ fontSize: '.8rem', color: 'var(--stone-400)' }}>#{field.id}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
  <h3 style={{ marginBottom: 16 }}>Weather</h3>

  {weatherLoading && (
    <p style={{ fontSize: '.875rem', color: 'var(--stone-400)' }}>
      Loading weather...
    </p>
  )}

  {!weatherLoading && weather && (
    <>
      <InfoRow label="Temperature" value={`${weather.temp} °C`} />
      <InfoRow label="Humidity" value={`${weather.humidity} %`} />
      <InfoRow label="Condition" value={weather.condition} />
    </>
  )}

  {!weatherLoading && !weather && (
    <p style={{ fontSize: '.875rem', color: 'var(--stone-400)' }}>
      Weather data unavailable
    </p>
  )}
</div>
          {/* Field info */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Field Details</h3>
            <InfoRow label="Crop Type"    value={field.crop_type} />
            <InfoRow label="Planting Date" value={format(new Date(field.planting_date), 'MMMM d, yyyy')} />
            <InfoRow label="Location"     value={field.location || '—'} />
            <InfoRow label="Area"         value={field.area_hectares ? `${field.area_hectares} ha` : '—'} />
            <InfoRow label="Assigned To"  value={field.agent_name || <span style={{ color: 'var(--stone-300)' }}>Unassigned</span>} />
            <InfoRow label="Created"      value={formatDistanceToNow(new Date(field.created_at), { addSuffix: true })} />
          </div>

          {/* Update form — visible to assigned agent or admin */}
          {canUpdate && (
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Log an Update</h3>
              <Alert message={error} type="error" />
              <Alert message={success} type="success" />
              <form onSubmit={handleUpdate}>
                <div className="form-group">
                  <label className="form-label">Update Stage</label>
                  <select
                    className="form-control"
                    value={updateForm.new_stage}
                    onChange={e => setUpdateForm(f => ({ ...f, new_stage: e.target.value }))}
                  >
                    {STAGES.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes / Observations</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Describe field conditions, pest activity, moisture levels…"
                    value={updateForm.notes}
                    onChange={e => setUpdateForm(f => ({ ...f, notes: e.target.value }))}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Save Update'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right column: update history */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-header">
            <h3>Update History</h3>
            <span style={{ fontSize: '.8rem', color: 'var(--stone-400)' }}>{field.updates?.length || 0} entries</span>
          </div>
          {!field.updates?.length ? (
            <p style={{ color: 'var(--stone-400)', fontSize: '.875rem' }}>No updates logged yet.</p>
          ) : (
            <div className="timeline">
              {field.updates.map(u => (
                <div className="timeline-item" key={u.id}>
                  <div className="timeline-dot" style={{ background: u.old_stage !== u.new_stage ? 'var(--amber-500)' : 'var(--green-400)' }} />
                  <div className="timeline-content">
                    {u.old_stage !== u.new_stage && (
                      <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <StageBadge stage={u.old_stage} />
                        <span style={{ color: 'var(--stone-400)', fontSize: '.75rem' }}>→</span>
                        <StageBadge stage={u.new_stage} />
                      </div>
                    )}
                    {u.notes && <div className="timeline-text" style={{ fontStyle: 'italic', color: 'var(--stone-600)' }}>"{u.notes}"</div>}
                    <div className="timeline-meta">
                      {u.agent_name} · {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--stone-100)', fontSize: '.875rem' }}>
      <span style={{ color: 'var(--stone-500)', fontWeight: 500 }}>{label}</span>
      <span style={{ color: 'var(--stone-800)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}
