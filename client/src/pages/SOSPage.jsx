import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import {
  Phone,
  PhoneCall,
  MapPin,
  AlertTriangle,
  Shield,
  ShieldAlert,
  UserPlus,
  Trash2,
  Navigation,
  Wifi,
  WifiOff,
  HeartPulse,
  Car,
  Search,
  Mountain,
  Flame,
  Wrench,
  CheckCircle2,
  Send,
  LifeBuoy
} from 'lucide-react';

const EMERGENCY_TYPES = [
  { id: 'medical', label: 'Medical Emergency', icon: HeartPulse, desc: 'Injury, acute illness, cardiac event, allergic reaction' },
  { id: 'accident', label: 'Road Accident', icon: Car, desc: 'Vehicle collision, breakdown, rollover, road hazard' },
  { id: 'lost', label: 'Missing / Lost Person', icon: Search, desc: 'Separated from group, stranded without trail' },
  { id: 'trek', label: 'Trekking Distress', icon: Mountain, desc: 'Trail injury, wildlife encounter, extreme fatigue' },
  { id: 'unsafe', label: 'Safety Threat / Crime', icon: AlertTriangle, desc: 'Harassment, intimidation, theft, unsafe environment' },
  { id: 'fire', label: 'Fire / Natural Hazard', icon: Flame, desc: 'Forest fire, flash flood, landslide, structural collapse' },
  { id: 'breakdown', label: 'Vehicle Breakdown', icon: Wrench, desc: 'Stranded in remote sector, fuel depletion, mechanical failure' },
  { id: 'other', label: 'Other Emergency', icon: LifeBuoy, desc: 'Any other critical situation requiring intervention' },
];

function LocationDisplay({ location, accuracy }) {
  if (!location) return null;
  return (
    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '12px 14px', marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <MapPin size={16} style={{ color: '#16a34a' }} />
        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#166534' }}>GPS Coordinates Acquired</span>
      </div>
      <div style={{ fontSize: '0.88rem', color: '#1e293b', fontFamily: 'monospace', fontWeight: 600 }}>
        {location.lat.toFixed(6)}°N, {location.lng.toFixed(6)}°E
      </div>
      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
        Precision: ±{Math.round(accuracy || 0)} meters · Timestamp: {new Date().toLocaleTimeString()}
      </div>
      <a
        href={`https://maps.google.com/maps?q=${location.lat},${location.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: '0.8rem', color: '#1a5c4c', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontWeight: 600 }}
      >
        <Navigation size={13} /> View on Google Maps
      </a>
    </div>
  );
}

export default function SOSPage() {
  const { t, emergencyContacts, addEmergencyContact, removeEmergencyContact, user, showToast } = useApp();
  const [sosActive, setSosActive] = useState(false);
  const [emergencyType, setEmergencyType] = useState('');
  const [location, setLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [locating, setLocating] = useState(false);
  const [eventSent, setEventSent] = useState(false);
  const [eventId, setEventId] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [callConfirmOpen, setCallConfirmOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', relation: '' });
  const [addingContact, setAddingContact] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const getLocation = () => {
    setLocating(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationAccuracy(pos.coords.accuracy);
        setLocating(false);
      },
      (err) => {
        setLocationError(`Could not retrieve location: ${err.message}. You can specify coordinates manually below.`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const activateSOS = async () => {
    if (!emergencyType) {
      showToast('Please select the primary emergency category first.');
      return;
    }
    setSosActive(true);
    getLocation();
  };

  const sendSOSEvent = async () => {
    if (!online) {
      showToast('Offline: SOS log cannot be dispatched to server. Please dial 112 directly.');
      return;
    }
    const loc = location || (manualLat && manualLng ? { lat: parseFloat(manualLat), lng: parseFloat(manualLng) } : null);
    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          emergencyType,
          location: loc,
          locationAccuracy,
          ts: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      setEventId(data.id);
      setEventSent(true);
      showToast('Incident logged to central dispatch. Continue with telephonic coordination.');
    } catch {
      showToast('Could not register incident on server. Please place a direct phone call to 112.');
    }
  };

  const deactivateSOS = () => {
    setSosActive(false);
    setEmergencyType('');
    setLocation(null);
    setLocationError('');
    setEventSent(false);
    setEventId(null);
  };

  const handleAddContact = () => {
    if (!contactForm.name || !contactForm.phone) {
      showToast('Please supply both full name and phone number.');
      return;
    }
    addEmergencyContact(contactForm);
    setContactForm({ name: '', phone: '', relation: '' });
    setAddingContact(false);
    showToast('Emergency contact saved locally.');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      {/* Header */}
      <div style={{ background: '#991b1b', color: '#ffffff', padding: '44px 16px 52px', borderBottom: '1px solid #7f1d1d' }}>
        <div className="max-w-3xl mx-auto" style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.1)', marginBottom: 14 }}>
            <ShieldAlert size={36} color="#ffffff" />
          </div>
          <h1 style={{ color: '#ffffff', fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', margin: '0 0 10px', fontWeight: 700 }}>
            {t('sosTitle')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', maxWidth: 540, margin: '0 auto 16px', fontSize: '0.95rem', lineHeight: 1.6 }}>
            {t('sosSub')}
          </p>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: online ? 'rgba(22,163,74,0.25)' : 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, padding: '4px 12px', color: '#ffffff', fontSize: '0.8rem' }}>
            {online ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span>{online ? 'Data connection active' : 'Device offline – telephonic calling remains operational'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto" style={{ padding: '0 16px', marginTop: -24 }}>
        {/* Offline Warning */}
        {!online && (
          <div style={{ background: '#fef2f2', border: '1px solid #f87171', borderRadius: 8, padding: '14px 18px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <WifiOff size={16} /> Telephonic Fallback Active
            </div>
            <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.5 }}>
              Web server synchronization is suspended without data connectivity. Dial 112 directly on your mobile keypad; emergency cellular routing functions even with zero network data balance.
            </div>
          </div>
        )}

        {/* PRIMARY CALL 112 ACTION */}
        <div className="emergency-card" style={{ marginBottom: 24, textAlign: 'center', background: '#ffffff', border: '2px solid #ef4444', borderRadius: 8, padding: 24 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            National Emergency Response System
          </div>

          {!callConfirmOpen ? (
            <button
              id="call-112-btn"
              className="btn btn-danger"
              onClick={() => setCallConfirmOpen(true)}
              style={{ fontSize: '1.15rem', padding: '16px 28px', width: '100%', justifyContent: 'center', fontWeight: 700, letterSpacing: '0.02em', borderRadius: 6 }}
            >
              <PhoneCall size={20} style={{ marginRight: 8 }} />
              Dial 112 (Emergency Central)
            </button>
          ) : (
            <div style={{ background: '#fef3c7', border: '1px solid #fde047', borderRadius: 6, padding: '16px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#92400e', fontWeight: 600, fontSize: '0.92rem', marginBottom: 6 }}>
                <AlertTriangle size={16} />
                <span>Immediate Call Confirmation</span>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#78350f', lineHeight: 1.5 }}>
                Tapping confirm will launch your device phone dialler to place a voice call directly to India's unified 112 emergency services.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <a
                  href="tel:112"
                  className="btn btn-danger"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.95rem', fontWeight: 600 }}
                >
                  <Phone size={16} /> Connect Call Now
                </a>
                <button className="btn btn-outline" onClick={() => setCallConfirmOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Departmental direct lines */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0f0ee', display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="tel:100" className="btn btn-outline btn-sm" style={{ fontSize: '0.8rem' }}>
              Police: 100
            </a>
            <a href="tel:101" className="btn btn-outline btn-sm" style={{ fontSize: '0.8rem' }}>
              Fire: 101
            </a>
            <a href="tel:102" className="btn btn-outline btn-sm" style={{ fontSize: '0.8rem' }}>
              Ambulance: 102
            </a>
            <a href="tel:18004254425" className="btn btn-outline btn-sm" style={{ fontSize: '0.8rem' }}>
              Tourist Helpline: 1800-425-4425
            </a>
          </div>
        </div>

        {/* INCIDENT LOGGING */}
        {!sosActive ? (
          <div className="card" style={{ padding: 24, marginBottom: 24, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', margin: '0 0 6px', fontSize: '1.25rem', color: '#1c1c1c' }}>
              Record Incident &amp; Geolocation
            </h3>
            <p style={{ color: '#5a5a5a', fontSize: '0.88rem', margin: '0 0 20px', lineHeight: 1.5 }}>
              Capture exact coordinates and log an incident report before calling emergency operators.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 10, color: '#2b2b2b' }}>
                Select Emergency Category *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                {EMERGENCY_TYPES.map(et => {
                  const Icon = et.icon;
                  const isSelected = emergencyType === et.id;
                  return (
                    <button
                      key={et.id}
                      type="button"
                      onClick={() => setEmergencyType(et.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 6,
                        border: `1.5px solid ${isSelected ? '#991b1b' : '#e2e2e0'}`,
                        background: isSelected ? '#fff5f5' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        transition: 'border-color 0.15s'
                      }}
                    >
                      <div style={{ padding: 6, borderRadius: 4, background: isSelected ? '#fee2e2' : '#f4f4f2', color: isSelected ? '#991b1b' : '#5a5a5a', flexShrink: 0 }}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1c1c1c' }}>{et.label}</div>
                        <div style={{ fontSize: '0.75rem', color: '#5a5a5a', marginTop: 2, lineHeight: 1.4 }}>{et.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              className="btn btn-danger"
              onClick={activateSOS}
              disabled={!emergencyType}
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', padding: '12px', fontWeight: 600 }}
            >
              Acquire Coordinates &amp; Initiate Protocol
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: 24, marginBottom: 24, background: '#ffffff', border: '1.5px solid #dc2626', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #fee2e2', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
                <span style={{ fontWeight: 700, color: '#991b1b', fontSize: '1.05rem' }}>
                  Incident Protocol: {EMERGENCY_TYPES.find(e => e.id === emergencyType)?.label}
                </span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={deactivateSOS} style={{ color: '#5a5a5a' }}>
                Cancel
              </button>
            </div>

            {/* Location */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#2b2b2b', marginBottom: 6 }}>
                GPS Telemetry
              </div>
              {locating && (
                <div style={{ color: '#5a5a5a', fontSize: '0.85rem', padding: '10px 0' }}>
                  Connecting to satellite positioning system...
                </div>
              )}
              {location && <LocationDisplay location={location} accuracy={locationAccuracy} />}
              {locationError && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ color: '#b91c1c', fontSize: '0.82rem', marginBottom: 8, display: 'flex', gap: 6 }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    <span>{locationError}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2b2b2b', marginBottom: 6 }}>Input manual coordinates:</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="input" placeholder="Latitude (e.g. 12.9716)" value={manualLat} onChange={e => setManualLat(e.target.value)} />
                    <input className="input" placeholder="Longitude (e.g. 77.5946)" value={manualLng} onChange={e => setManualLng(e.target.value)} />
                  </div>
                </div>
              )}
              {!location && !locating && !locationError && (
                <button className="btn btn-outline btn-sm" onClick={getLocation} style={{ marginTop: 8 }}>
                  <MapPin size={14} /> Request Coordinates
                </button>
              )}
            </div>

            {/* Send event */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid #f0f0ee' }}>
              {!eventSent ? (
                <button
                  className="btn btn-primary"
                  onClick={sendSOSEvent}
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={!online}
                >
                  <Send size={15} /> Log to Emergency Dispatch Server
                </button>
              ) : (
                <div style={{ flex: 1, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#166534', fontSize: '0.88rem' }}>Incident Logged Successfully</div>
                    <div style={{ fontSize: '0.78rem', color: '#475569' }}>Tracking Reference: {eventId}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emergency Contacts */}
        <div className="card" style={{ padding: 24, marginBottom: 24, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', color: '#1c1c1c' }}>
                Personal Emergency Contacts
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#5a5a5a' }}>
                Stored locally on this device. Quickly reachable during emergencies.
              </p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => setAddingContact(o => !o)}>
              <UserPlus size={14} /> Add Contact
            </button>
          </div>

          {addingContact && (
            <div style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 6, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 12 }}>
                <input
                  className="input"
                  placeholder="Full name *"
                  value={contactForm.name}
                  onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Phone number *"
                  type="tel"
                  value={contactForm.phone}
                  onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Relationship (e.g. Spouse, Guide)"
                  value={contactForm.relation}
                  onChange={e => setContactForm(f => ({ ...f, relation: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={handleAddContact}>
                  Save Contact
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setAddingContact(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {emergencyContacts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#7a7a7a', fontSize: '0.88rem' }}>
              No emergency contacts configured yet. Add trusted family members or tour coordinators for quick single-tap dialling.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {emergencyContacts.map(c => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: '#f8f8f6',
                    border: '1px solid #e8e8e5',
                    borderRadius: 6,
                    padding: '10px 14px'
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 4,
                      background: '#1a5c4c',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      flexShrink: 0
                    }}
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1c1c1c' }}>{c.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#5a5a5a' }}>
                      {c.relation ? `${c.relation} · ` : ''}{c.phone}
                    </div>
                  </div>
                  <a href={`tel:${c.phone}`} className="btn btn-outline btn-sm" aria-label={`Call ${c.name}`}>
                    <Phone size={13} /> Call
                  </a>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeEmergencyContact(c.id)}
                    style={{ color: '#c0392b' }}
                    aria-label={`Remove ${c.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Karnataka Safety Advisory */}
        <div className="card" style={{ padding: 24, marginBottom: 64, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Shield size={18} style={{ color: '#1a5c4c' }} />
            <h3 style={{ fontFamily: 'Playfair Display, serif', margin: 0, fontSize: '1.2rem', color: '#1c1c1c' }}>
              Karnataka State Tourism Safety Advisory
            </h3>
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.88rem', lineHeight: 1.85, color: '#4b5563' }}>
            <li>Prior to forest treks in the Western Ghats (Kudremukha, Agumbe, Brahmagiri), ensure mandatory registered guide escort and department permissions.</li>
            <li>Maintain an offline or printed duplicate of your day itinerary and emergency contact telephone numbers.</li>
            <li>During the southwest monsoon (June through September), adhere strictly to warning signboards near waterfalls and coastal promontories.</li>
            <li>In high-elevation reserves, cellular connectivity on private networks may degrade; BSNL and Airtel retain the widest coverage footprints.</li>
            <li>Dialling <strong>112</strong> connects across all telecom networks in India without SIM airtime or active data subscriptions.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
