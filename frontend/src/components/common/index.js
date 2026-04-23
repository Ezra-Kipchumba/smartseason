/**
 * common/index.js
 * Small reusable UI primitives used throughout the app.
 */

import React from 'react';

// ── Loading Spinner ────────────────────────────────────────────────────────
export function Spinner({ size = '' }) {
  return <div className={`spinner ${size === 'sm' ? 'spinner-sm' : ''}`} role="status" aria-label="Loading" />;
}

export function LoadingCenter() {
  return <div className="loading-center"><Spinner /></div>;
}

// ── Status / Stage Badges ──────────────────────────────────────────────────
const STATUS_DOTS = { Active: '🟢', 'At Risk': '🟡', Completed: '⚫' };
const STAGE_LABELS = { planted: 'Planted', growing: 'Growing', ready: 'Ready', harvested: 'Harvested' };

export function StatusBadge({ status }) {
  const cls = status === 'At Risk' ? 'badge-at-risk'
            : status === 'Completed' ? 'badge-completed' : 'badge-active';
  return <span className={`badge ${cls}`}>{STATUS_DOTS[status]} {status}</span>;
}

export function StageBadge({ stage }) {
  return <span className={`badge badge-${stage}`}>{STAGE_LABELS[stage] || stage}</span>;
}

// ── Alert Banner ───────────────────────────────────────────────────────────
export function Alert({ type = 'error', message }) {
  if (!message) return null;
  return <div className={`alert alert-${type}`}>{message}</div>;
}

// ── Modal ─────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, footer }) {
  // Close on overlay click
  const handleOverlay = (e) => { if (e.target === e.currentTarget) onClose(); };
  return (
    <div className="modal-overlay" onClick={handleOverlay}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────
export function EmptyState({ title, message, icon = '🌾', action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" style={{ fontSize: '1.8rem' }}>{icon}</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

// ── Confirm Delete Dialog ──────────────────────────────────────────────────
export function ConfirmModal({ message, onConfirm, onCancel, loading }) {
  return (
    <Modal
      title="Confirm Action"
      onClose={onCancel}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Confirm'}
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--stone-700)', fontSize: '.95rem' }}>{message}</p>
    </Modal>
  );
}
