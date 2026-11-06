import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, ShieldAlert, X, ExternalLink } from 'lucide-react';

export default function TravelAlertsBanner() {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch('/api/alerts?activeOnly=true')
      .then(r => r.json())
      .then(data => {
        if (data.ok && Array.isArray(data.alerts) && data.alerts.length > 0) {
          setAlerts(data.alerts);
        }
      })
      .catch(() => {});
  }, []);

  if (dismissed || alerts.length === 0) return null;

  const alert = alerts[currentIndex] || alerts[0];
  const isUrgent = alert.severity === 'warning' || alert.severity === 'urgent';

  return (
    <aside
      aria-label="Official Karnataka Travel Advisory"
      style={{
        background: isUrgent ? '#fffbeb' : '#f0fdf4',
        borderBottom: `1px solid ${isUrgent ? '#fde68a' : '#bbf7d0'}`,
        color: isUrgent ? '#92400e' : '#166534',
        padding: '10px 16px',
        fontSize: '0.84rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        position: 'relative',
        zIndex: 50
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, overflow: 'hidden' }}>
        {isUrgent ? (
          <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0 }} />
        ) : (
          <Info size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem', background: isUrgent ? '#fef3c7' : '#dcfce7', padding: '1px 6px', borderRadius: 4, letterSpacing: '0.04em' }}>
            Official Advisory
          </span>
          <strong style={{ color: isUrgent ? '#78350f' : '#14532d' }}>{alert.title}:</strong>
          <span style={{ color: '#374151' }}>{alert.description}</span>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            — {alert.issuingAuthority}
          </span>
          {alert.sourceUrl && (
            <a
              href={alert.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#1a5c4c', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 2, textDecoration: 'underline' }}
            >
              Verify <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {alerts.length > 1 && (
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            <button
              onClick={() => setCurrentIndex(i => (i + 1) % alerts.length)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a5c4c', fontWeight: 600, fontSize: '0.75rem', textDecoration: 'underline' }}
            >
              Next Alert ({currentIndex + 1}/{alerts.length})
            </button>
          </div>
        )}
        <button
          onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 2 }}
          title="Dismiss advisory banner"
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
}

