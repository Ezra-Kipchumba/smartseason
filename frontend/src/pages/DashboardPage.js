/**
 * DashboardPage.js
 * Overview screen for both roles.
 * Admins see all-field stats; agents see their own.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingCenter, StageBadge } from '../components/common';
import api from '../utils/api';
import MapView from '../components/MapView';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/fields/stats')
      .then(r => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingCenter />;

  const byStage = Object.fromEntries((stats?.byStage || []).map(r => [r.stage, parseInt(r.count)]));

  return (
    <div className="fade-in">
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1>Dashboard</h1>
        <p style={{ color: 'var(--stone-500)', marginTop: 4, fontSize: '.9rem' }}>
          {isAdmin ? 'Overview of all fields in the system.' : `Your assigned fields overview, ${user?.name?.split(' ')[0]}.`}
        </p>
      </div>

      {/* Top stats */}
      <div className="stats-grid">
        <StatCard label="Total Fields" value={stats?.total ?? 0} icon="🌾" iconClass="stat-icon-green" />
        <StatCard label="Active" value={stats?.byStatus?.Active ?? 0} icon="✅" iconClass="stat-icon-green" />
        <StatCard label="At Risk" value={stats?.byStatus?.['At Risk'] ?? 0} icon="⚠️" iconClass="stat-icon-amber" />
        <StatCard label="Completed" value={stats?.byStatus?.Completed ?? 0} icon="🏁" iconClass="stat-icon-stone" />
      </div>

      {/* Stage breakdown + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Stage breakdown */}
        <div className="card">
          <div className="card-header">
            <h3>By Growth Stage</h3>
          </div>
          {['planted', 'growing', 'ready', 'harvested'].map(stage => {
            const count = byStage[stage] || 0;
            const total = stats?.total || 1;
            const pct   = Math.round((count / total) * 100);
            return (
              <div key={stage} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <StageBadge stage={stage} />
                  <span style={{ fontSize: '.8rem', color: 'var(--stone-500)', fontWeight: 600 }}>{count}</span>
                </div>
                <div style={{ height: 6, background: 'var(--stone-100)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--green-500)', borderRadius: 99, transition: 'width .6s ease' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Map Section */}
        <div style={{ marginTop: 28 }}>
          <MapView />
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Activity</h3>
            <Link to="/fields" style={{ fontSize: '.8rem', color: 'var(--green-600)', fontWeight: 500 }}>View all →</Link>
          </div>
          {!stats?.recentActivity?.length ? (
            <p style={{ color: 'var(--stone-400)', fontSize: '.875rem' }}>No recent updates.</p>
          ) : (
            <div className="timeline">
              {stats.recentActivity.map(a => (
                <div className="timeline-item" key={a.id}>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-text">
                      <strong>{a.field_name}</strong>
                      {a.new_stage !== a.old_stage
                        ? <> stage changed to <StageBadge stage={a.new_stage} /></>
                        : <> updated by {a.agent_name}</>}
                    </div>
                    {a.notes && <div className="timeline-meta" style={{ marginTop: 3, fontStyle: 'italic' }}>"{a.notes}"</div>}
                    <div className="timeline-meta">
                      {a.agent_name} · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
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

// Stat card sub-component
function StatCard({ label, value, icon, iconClass }) {
  return (
    <div className="stat-card">
      <div className={`stat-card-icon ${iconClass}`} style={{ fontSize: '1.1rem' }}>{icon}</div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
    </div>
  );
}
