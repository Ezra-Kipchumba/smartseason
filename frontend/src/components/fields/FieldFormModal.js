/**
 * FieldFormModal.js  (v2)
 * Create or edit a field (admin only).
 * Adds: latitude, longitude, expected_yield fields.
 */

import React, { useState, useEffect } from 'react';
import { Modal, Alert, Spinner } from '../common';
import MapPicker from '../common/MapPicker';
import api from '../../utils/api';

const CROP_OPTIONS = [
  'Avocados', 'Bananas', 'Beans','Cabbage', 'Carrots','Citrus Fruits',
  'Coffee', 'Flowers', 'Maize', 'Mangoes', 'Onions', 'Pineapples', 
  'Potatoes', 'Sisal', 'Sorghum', 'Sunflower', 'Sugarcane', 'Sweet Potatoes',
  'Tea', 'Tomatoes','Wheat'
];
const LOC_OPTIONS = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa',
  'Homa Bay','Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi',
  'Kirinyaga','Kisii','Kisumu','Kitui','Kwale','Laikipia','Lamu','Machakos',
  'Makueni','Mandera','Marsabit','Meru','Migori','Mombasa','Murang’a',
  'Nairobi','Nakuru','Nandi','Narok','Nyamira','Nyandarua','Nyeri',
  'Samburu','Siaya','Taita-Taveta','Tana River','Tharaka-Nithi',
  'Trans Nzoia','Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot'
];
const IRRIGATION_OPTIONS = ['Rain-fed', 'Drip', 'Sprinkler', 'Flood'];
const SOIL_OPTIONS = ['Loamy', 'Sandy', 'Clay', 'Silty'];

const EMPTY = {
  name: '', crop_type: '', planting_date: '', stage: 'planted',
  location: '', area_hectares: '', assigned_to: '',
  latitude: '', longitude: '', expected_yield: '',
  irrigation_type: '', soil_type: ''
};

export default function FieldFormModal({ field, onClose, onSaved }) {
  const isEdit = !!field;

  const [form, setForm] = useState(field ? {
    name:           field.name,
    crop_type:      field.crop_type,
    planting_date:  field.planting_date?.slice(0, 10),
    stage:          field.stage,
    location:       field.location       || '',
    area_hectares:  field.area_hectares  || '',
    assigned_to:    field.assigned_to    || '',
    latitude:       field.latitude       || '',
    longitude:      field.longitude      || '',
    expected_yield: field.expected_yield || '',
    irrigation_type: field.irrigation_type || '',
    soil_type:      field.soil_type      || ''
  } : EMPTY);

  const [agents, setAgents]   = useState([]);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/users/agents').then(r => setAgents(r.data));
  }, []);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const payload = {
        ...form,
        assigned_to:    form.assigned_to    || null,
        area_hectares:  form.area_hectares  || null,
        latitude:       form.latitude       || null,
        longitude:      form.longitude      || null,
        expected_yield: form.expected_yield || null,
        irrigation_type: form.irrigation_type || null,
        soil_type:      form.soil_type      || null
      };
      if (isEdit) {
        await api.put(`/api/fields/${field.id}`, payload);
      } else {
        await api.post('/api/fields', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save field.');
    } finally {
      setLoading(false);
    }
  };

  // Handling map clicks to update latitude and longitude
     const handleMapSelect = ({ lat, lng, locationName }) => {
     setForm(f => ({
       ...f,
       latitude: lat,
       longitude: lng,
       location: locationName || f.location
     }));
   };

  return (
    <Modal
      title={isEdit ? `Edit — ${field.name}` : 'Add New Field'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" form="field-form" type="submit" disabled={loading}>
            {loading ? <><Spinner size="sm" /> Saving…</> : isEdit ? 'Save Changes' : 'Create Field'}
          </button>
        </>
      }
    >
      <Alert message={error} />
      <form id="field-form" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>

          {/* Full-width: name */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Field Name *</label>
            <input className="form-control" value={form.name} onChange={set('name')} required placeholder="e.g. North Plot" />
          </div>

          <div className="form-group">
            <label className="form-label">Crop Type *</label>
            <select className="form-control" value={form.crop_type} onChange={set('crop_type')} required>
              <option value="">— Select crop —</option>
              {CROP_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Planting Date *</label>
            <input className="form-control" type="date" value={form.planting_date} onChange={set('planting_date')} required />
          </div>

          <div className="form-group">
            <label className="form-label">Current Stage</label>
            <select className="form-control" value={form.stage} onChange={set('stage')}>
              {['planted', 'growing', 'ready', 'harvested'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Agent</label>
            <select className="form-control" value={form.assigned_to} onChange={set('assigned_to')}>
              <option value="">— Unassigned —</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.field_count} fields)</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <select className="form-control" value={form.location} onChange={set('location')}>
              <option value="">— Select location —</option>
              {LOC_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Area (hectares)</label>
            <input className="form-control" type="number" step="0.01" min="0"
              value={form.area_hectares} onChange={set('area_hectares')} placeholder="e.g. 4.5" />
          </div>

          <div className="form-group">
            <label className="form-label">Expected Yield (t/ha)</label>
            <input className="form-control" type="number" step="0.01" min="0"
              value={form.expected_yield} onChange={set('expected_yield')} placeholder="e.g. 3.2" />
          </div>

          <div className="form-group">
           <label className="form-label">Irrigation Type</label>
           <select
             className="form-control"
             value={form.irrigation_type}
             onChange={set('irrigation_type')}
           >
             <option value="">— Select irrigation —</option>
             {IRRIGATION_OPTIONS.map(i => (
               <option key={i} value={i}>{i}</option>
             ))}
           </select>
         </div>
         
         <div className="form-group">
           <label className="form-label">Soil Type</label>
           <select
             className="form-control"
             value={form.soil_type}
             onChange={set('soil_type')}
           >
             <option value="">— Select soil type —</option>
             {SOIL_OPTIONS.map(s => (
               <option key={s} value={s}>{s}</option>
             ))}
           </select>
         </div>

          {/* Geo section */}
          <div style={{ gridColumn: '1 / -1', marginTop: 4, marginBottom: 8 }}>
            <div style={{ fontSize: '.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--stone-500)', marginBottom: 2 }}>
              GPS Coordinates <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(enables map view)</span>
            </div>
          </div>
          
          {/* <div style={{ gridColumn: '1 / -1', marginBottom: 12 }}>
            <MapPicker onSelectLocation={handleMapSelect} />
          </div> */}

          {/* Map Picker */}
          <div style={{ gridColumn: '1 / -1', marginTop: 10 }}>
            <label className="form-label">Select Location on Map</label>
          
            <MapPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={(lat, lng) => {
                setForm(f => ({
                  ...f,
                  latitude: lat,
                  longitude: lng
                }));
              }}
            />
          </div>
          
          {/* Show selected coords (read-only) */}
          <div className="form-group">
            <label className="form-label">Latitude</label>
            <input className="form-control" value={form.latitude || ''} readOnly />
          </div>
          
          <div className="form-group">
            <label className="form-label">Longitude</label>
            <input className="form-control" value={form.longitude || ''} readOnly />
          </div>

        </div>
      </form>
    </Modal>
  );
}