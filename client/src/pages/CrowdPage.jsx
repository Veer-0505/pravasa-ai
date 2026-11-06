import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { CROWD_LEVEL_MAP, CROWD_CONFIG } from '../i18n';
import { Users, Clock, Info, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { fetchPlaces } from '../utils';

const CROWD_OPTIONS = ['low', 'moderate', 'high', 'very-high'];

function CrowdReportModal({ place, onClose, onSubmit }) {
  const [level, setLevel] = useState('moderate');
  const [queue, setQueue] = useState('');
  const [parking, setParking] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit({
      placeId: place.id,
      placeName: place.name,
      crowdLevel: level,
      queueEstimate: queue,
      parkingStatus: parking,
      note,
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-box"
        style={{ maxWidth: 480, background: '#ffffff', borderRadius: 8, border: '1px solid #dcdcd9', boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Submit crowd observation for ${place.name}`}
      >
        <div style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 6px', fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', color: '#1c1c1c' }}>
            Submit Crowd Observation
          </h3>
          <p style={{ color: '#5a5a5a', fontSize: '0.88rem', margin: '0 0 20px' }}>
            Reporting on <strong>{place.name}</strong> ({place.district}). Your feedback assists fellow travellers.
          </p>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 8, color: '#2b2b2b' }}>
              Observed Visitor Density *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CROWD_OPTIONS.map(opt => {
                const cfg = CROWD_CONFIG[opt];
                const active = level === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setLevel(opt)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 6,
                      border: `1.5px solid ${active ? '#1a5c4c' : '#e2e2e0'}`,
                      background: active ? '#f0fdf9' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'border-color 0.15s'
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dotColor }} />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1c1c1c' }}>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 6, color: '#2b2b2b' }}>
              Queue Waiting Time (optional)
            </label>
            <input
              className="input"
              placeholder="e.g. No wait, 15 minutes, 45+ minutes"
              value={queue}
              onChange={e => setQueue(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 6, color: '#2b2b2b' }}>
              Parking Availability (optional)
            </label>
            <select
              className="input"
              value={parking}
              onChange={e => setParking(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Select current status</option>
              <option value="Available">Ample parking available</option>
              <option value="Limited">Limited / slow turnover</option>
              <option value="Full">Lot full / roadside only</option>
              <option value="Not applicable">No vehicle parking required</option>
            </select>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 6, color: '#2b2b2b' }}>
              Additional Context (optional)
            </label>
            <textarea
              className="input"
              rows={2}
              placeholder="Special festival, VIP movement, ticket counter delays, etc."
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{ resize: 'vertical', width: '100%' }}
            />
          </div>

          <div style={{ background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 14px', fontSize: '0.8rem', color: '#475569', marginBottom: 20, display: 'flex', gap: 8 }}>
            <Info size={15} style={{ flexShrink: 0, marginTop: 2, color: '#0284c7' }} />
            <span>
              Submissions are published as community observations with a timestamp and help inform seasonal congestion estimates.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} type="button">
              {submitting ? 'Submitting...' : 'Submit Observation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CrowdPage() {
  const { t, addCrowdReport, showToast } = useApp();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedForReport, setSelectedForReport] = useState(null);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetchPlaces()
      .then(data => { setPlaces(data); setLoading(false); })
      .catch(() => setLoading(false));
    fetch('/api/crowd')
      .then(r => r.json())
      .then(setReports)
      .catch(() => {});
  }, []);

  const handleSubmitReport = async (report) => {
    try {
      const res = await fetch('/api/crowd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...report, ts: new Date().toISOString(), source: 'traveller-report', confidence: 'low' }),
      });
      const data = await res.json();
      addCrowdReport(data);
      setReports(prev => [data, ...prev]);
      showToast('Crowd observation recorded. Thank you for contributing.');
    } catch {
      showToast('Could not submit report. Please check your internet connection.');
    }
  };

  const getLatestReport = (placeId) => {
    const placeReports = reports.filter(r => r.placeId === placeId).sort((a, b) => new Date(b.ts) - new Date(a.ts));
    return placeReports[0] || null;
  };

  const isStale = (ts) => {
    if (!ts) return true;
    return Date.now() - new Date(ts).getTime() > 6 * 3600 * 1000;
  };

  const getCrowdDisplay = (place) => {
    const report = getLatestReport(place.id);
    if (report && !isStale(report.ts)) {
      return { level: report.crowdLevel || CROWD_LEVEL_MAP[place.crowdLevel] || 'unknown', source: 'Recent traveller observation', ts: report.ts, fresh: true };
    }
    return { level: CROWD_LEVEL_MAP[place.crowdLevel] || 'unknown', source: 'Historical seasonal average', ts: null, fresh: false };
  };

  const formatTime = (ts) => {
    if (!ts) return 'No recent reports';
    const diff = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
    if (diff < 60) return `${diff} min ago`;
    return `${Math.round(diff / 60)}h ago`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      {/* Header */}
      <div style={{ background: '#1a5c4c', color: '#ffffff', padding: '48px 16px 56px', borderBottom: '1px solid #14483b' }}>
        <div className="max-w-7xl mx-auto">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e8f5f0', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            <Users size={16} />
            <span>Real-Time Visitor Density</span>
          </div>
          <h1 style={{ color: '#ffffff', fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 700, margin: '0 0 12px' }}>
            {t('crowdTitle')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', maxWidth: 680, fontSize: '1rem', lineHeight: 1.6, margin: '0 0 24px' }}>
            {t('crowdSub')}
          </p>
          <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '12px 16px', fontSize: '0.82rem', color: '#ffffff', maxWidth: 680, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              Congestion levels combine historical visitor footfall trends with crowd submissions from on-site travellers. Always plan early morning departures for high-traffic destinations.
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto" style={{ padding: '0 16px', marginTop: -24 }}>
        {/* Legend */}
        <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1c1c1c' }}>Density Guide:</div>
          {Object.entries(CROWD_CONFIG).filter(([k]) => k !== 'unknown').map(([key, cfg]) => (
            <span
              key={key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 4,
                background: '#f4f4f2',
                border: '1px solid #e2e2e0',
                color: '#2b2b2b'
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dotColor }} />
              {cfg.label}
            </span>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#5a5a5a', display: 'flex', gap: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#166534', fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} /> Live report (&lt;6h)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#7a7a7a' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9ca3af' }} /> Historical baseline
            </span>
          </div>
        </div>

        {/* Crowd grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card skeleton" style={{ height: 160, borderRadius: 8 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, paddingBottom: 64 }}>
            {places.map(place => {
              const crowd = getCrowdDisplay(place);
              const cfg = CROWD_CONFIG[crowd.level] || CROWD_CONFIG.unknown;
              const latest = getLatestReport(place.id);

              return (
                <div
                  key={place.id}
                  className="card"
                  style={{
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    background: '#ffffff',
                    border: '1px solid #e2e2e0',
                    borderRadius: 8
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a2e', fontFamily: 'Playfair Display, serif' }}>
                        {place.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#5a5a5a', marginTop: 2 }}>
                        {[place.taluk, place.district].filter(Boolean).join(', ')}
                      </div>
                    </div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        padding: '3px 9px',
                        borderRadius: 4,
                        background: '#f4f4f2',
                        border: '1px solid #e2e2e0',
                        color: '#1c1c1c',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dotColor }} />
                      {cfg.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.78rem', color: '#5a5a5a' }}>
                    <Clock size={13} stroke="#7a7a7a" />
                    <span>{formatTime(crowd.ts)}</span>
                    <span
                      style={{
                        background: crowd.fresh ? '#dcfce7' : '#f4f4f2',
                        color: crowd.fresh ? '#15803d' : '#5a5a5a',
                        border: `1px solid ${crowd.fresh ? '#bbf7d0' : '#e2e2e0'}`,
                        padding: '1px 7px',
                        borderRadius: 4,
                        fontSize: '0.7rem',
                        fontWeight: 600
                      }}
                    >
                      {crowd.fresh ? 'Fresh report' : 'Baseline'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#7a7a7a' }}>
                    Source: {crowd.source}
                  </div>

                  {latest && (latest.note || latest.queueEstimate) && (
                    <div style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 6, padding: '8px 12px', fontSize: '0.8rem', color: '#2b2b2b' }}>
                      {latest.note && <div style={{ fontStyle: 'italic', marginBottom: 2 }}>"{latest.note}"</div>}
                      {latest.queueEstimate && <div>Queue wait: <strong>{latest.queueEstimate}</strong></div>}
                    </div>
                  )}

                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setSelectedForReport(place)}
                    style={{ justifyContent: 'center', marginTop: 4, width: '100%' }}
                  >
                    <Users size={13} /> Report current crowd
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedForReport && (
        <CrowdReportModal
          place={selectedForReport}
          onClose={() => setSelectedForReport(null)}
          onSubmit={handleSubmitReport}
        />
      )}
    </div>
  );
}
