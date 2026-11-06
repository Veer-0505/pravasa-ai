import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Landmark,
  Sparkles,
  ShieldAlert,
  Compass,
  Activity,
  Layers,
  Info,
  Key,
  Zap,
  ExternalLink,
  Eye,
  EyeOff,
  Upload,
  Download,
  FileText,
  Search,
  Filter,
  Check,
  AlertCircle,
  Building,
  Navigation,
  Trash2,
  Video,
  Image as ImageIcon,
  Sun,
  Moon,
  Clock,
  Play,
  X
} from 'lucide-react';
import {
  NEUTRAL_PLACEHOLDER_SVG,
  getCurrentTimeOfDay,
  TIME_OF_DAY_CONFIG,
  extractYoutubeId
} from '../utils/media';
import { subscribeToDestinations } from '../supabase';

export default function AdminDashboard() {
  const { t, user, showToast, authFetch, signOut } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('gov_places');
  const [places, setPlaces] = useState([]);
  const [crowdReports, setCrowdReports] = useState([]);
  const [sosEvents, setSosEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gov Destination & Photo Management State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [deleteConfirmPlace, setDeleteConfirmPlace] = useState(null);
  const [editActiveTab, setEditActiveTab] = useState('main');
  const [daytimePeriodTab, setDaytimePeriodTab] = useState('morning');
  const [previewTimeOfDay, setPreviewTimeOfDay] = useState('afternoon');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const [newPlace, setNewPlace] = useState({
    name: '',
    nameKannada: '',
    district: 'Mysuru',
    taluk: 'Mysuru',
    category: 'heritage',
    place_type: 'temple',
    lat: 12.272,
    lng: 76.670,
    description: '',
    image: '',
    imageAttribution: {
      source: 'Pravasa AI Verified Directory',
      author: 'Department of Tourism, Government of Karnataka',
      license: 'Official State Publication'
    },
    entryFeeINR: 0,
    openingHours: '08:00 - 18:00',
    contact: '1800-425-4425',
    official_website: 'https://karnatakatourism.org',
    accessibility: 'Wheelchair ramps and accessible restrooms available',
    parking: true,
    offbeat: false,
    isPublished: true,
    video: {
      type: 'youtube',
      url: 'https://www.youtube.com/watch?v=GJ4sKt93Uto',
      videoId: 'GJ4sKt93Uto',
      title: 'Pravasa AI Official Video Guide'
    }
  });

  // Customer Management & Real-Time Reset Password state
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [generatedReset, setGeneratedReset] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');

  // Gemini state
  const [geminiInfo, setGeminiInfo] = useState(null);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [geminiModelInput, setGeminiModelInput] = useState('gemini-2.5-flash');
  const [testingGemini, setTestingGemini] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showKey, setShowKey] = useState(false);

  // Spatial Pipeline & CSV Import state
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [placeTypeFilter, setPlaceTypeFilter] = useState('all');
  const [destSearch, setDestSearch] = useState('');

  const refreshUsers = () => {
    setLoadingUsers(true);
    authFetch('/api/auth/users')
      .then(r => r.json())
      .then(data => {
        if (data.ok && Array.isArray(data.users)) {
          setUsersList(data.users);
        }
      })
      .catch(() => { })
      .finally(() => setLoadingUsers(false));
  };

  const refreshGeminiStatus = () => {
    fetch('/api/gemini/status')
      .then(r => r.json())
      .then(d => setGeminiInfo(d))
      .catch(() => setGeminiInfo({ configured: false, ok: false }));
  };

  const refreshPlaces = () => {
    setLoading(true);
    fetch(`/api/places?_t=${Date.now()}`)
      .then(r => r.json())
      .then(res => {
        const list = Array.isArray(res) ? res : res.data || [];
        setPlaces(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/auth');
      return;
    }
    Promise.all([
      fetch('/api/places').then(r => r.json()).then(res => Array.isArray(res) ? res : res.data || []).catch(() => []),
      fetch('/api/crowd').then(r => r.json()).catch(() => []),
      fetch('/api/sos').then(r => r.json()).catch(() => []),
      fetch('/api/gemini/status').then(r => r.json()).catch(() => ({ configured: false, ok: false })),
      fetch('/api/auth/users').then(r => r.json()).catch(() => ({ users: [] })),
    ]).then(([p, c, s, g, u]) => {
      setPlaces(p);
      setCrowdReports(c);
      setSosEvents(s);
      setGeminiInfo(g);
      if (u && Array.isArray(u.users)) setUsersList(u.users);
      setLoading(false);
    });

    // Supabase Realtime synchronization: keeps admin list synchronized with database
    const unsubscribe = subscribeToDestinations(() => {
      refreshPlaces();
    });

    return () => {
      unsubscribe();
    };
  }, [user, navigate]);

  const handleUploadFile = async (file, onUploaded) => {
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 75 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast(`File size exceeds limit (${isVideo ? '75MB for video' : '15MB for photo'})`);
      return;
    }

    const formData = new FormData();
    formData.append('media', file);
    formData.append('mediaFile', file);

    setUploading(true);
    setUploadProgress(`Uploading ${file.name} (${Math.round(file.size / 1024)} KB)...`);

    try {
      const res = await authFetch('/api/places/upload-media', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      showToast(`Uploaded ${data.filename} successfully!`);
      if (typeof onUploaded === 'function') {
        onUploaded(data.url);
      }
    } catch (err) {
      showToast('Upload error: ' + err.message);
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleTogglePublish = async (place) => {
    const nextStatus = !place.isPublished;
    try {
      const res = await authFetch(`/api/places/${encodeURIComponent(place.id)}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle publication');
      showToast(nextStatus ? `"${place.name}" is now published on public site.` : `"${place.name}" moved to unpublished draft.`);
      refreshPlaces();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleAddDestination = async (e) => {
    e.preventDefault();
    if (!newPlace.name.trim() || !newPlace.district) {
      showToast('Name and district are required');
      return;
    }
    try {
      const res = await authFetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlace)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add place');
      showToast(`Added "${newPlace.name}" to Pravasa AI database!`);
      if (data.place) {
        setPlaces(prev => [data.place, ...prev]);
      }
      setShowAddModal(false);
      refreshPlaces();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleUpdateDestination = async (e) => {
    e.preventDefault();
    if (!editingPlace) return;
    if (uploading) {
      showToast('Please wait for photo upload to finish before saving.');
      return;
    }
    try {
      const res = await authFetch(`/api/places/${encodeURIComponent(editingPlace.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPlace)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update place');
      showToast(`Updated media, photos & visitor services for "${editingPlace.name}"!`);
      if (data.place) {
        setPlaces(prev => prev.map(p => p.id === data.place.id ? data.place : p));
      }
      setEditingPlace(null);
      refreshPlaces();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmPlace) return;
    try {
      const res = await authFetch(`/api/places/${encodeURIComponent(deleteConfirmPlace.id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      const delId = data.deletedId || deleteConfirmPlace.id;
      setPlaces(prev => prev.filter(p => p.id !== delId));
      showToast(`Destination "${deleteConfirmPlace.name}" deleted from database.`);
      setDeleteConfirmPlace(null);
      refreshPlaces();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleGenerateResetForUser = async (email) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate code');
      setGeneratedReset({ email, code: data.resetCode, role: data.userRole });
      showToast(`Real-time reset code for ${email}: ${data.resetCode}`);
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleSaveAndTestGemini = async () => {
    if (!geminiKeyInput.trim()) {
      showToast('Please enter a Gemini API Key');
      return;
    }
    setTestingGemini(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/gemini/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiKeyInput.trim(), model: geminiModelInput })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save key');

      const testRes = await fetch('/api/gemini/status');
      const testData = await testRes.json();
      setGeminiInfo(testData);
      setTestResult(testData);
      if (testData.ok) {
        showToast('Gemini API verified successfully!');
      } else {
        showToast('Key saved, but test failed: ' + (testData.error || 'Check credentials'));
      }
    } catch (err) {
      setTestResult({ ok: false, error: err.message });
      showToast(err.message);
    }
    setTestingGemini(false);
  };

  const handleTestOnly = async () => {
    setTestingGemini(true);
    setTestResult(null);
    try {
      const testRes = await fetch('/api/gemini/status');
      const testData = await testRes.json();
      setGeminiInfo(testData);
      setTestResult(testData);
      if (testData.ok) {
        showToast('Gemini API ping verified!');
      } else {
        showToast('Gemini test failed: ' + (testData.error || 'Check API key'));
      }
    } catch (err) {
      setTestResult({ ok: false, error: err.message });
      showToast(err.message);
    }
    setTestingGemini(false);
  };

  // CSV / Pipeline handlers
  const handleImportSubmit = async (customData) => {
    const content = customData || importText;
    if (!content.trim()) {
      showToast('Please provide CSV or JSON records to validate and import');
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/places/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: content })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setImportResult(data);
      showToast(`Import processed: ${data.imported} new, ${data.updated} updated.`);
      refreshPlaces();
    } catch (err) {
      setImportResult({ ok: false, error: err.message, errors: [] });
      showToast(err.message);
    }
    setImporting(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setImportText(text);
      showToast(`Loaded ${file.name} (${Math.round(file.size / 1024)} KB)`);
    };
    reader.readAsText(file);
  };

  const loadOfficialSample = () => {
    const sample = `id,name,nameKannada,place_type,parent_id,district,taluk,latitude,longitude,description,openingHours,entryFeeINR,source_url,verification_status
taluk_shivamogga,Shivamogga Taluk,ಶಿವಮೊಗ್ಗ ತಾಲೂಕು,taluk,dist_shivamogga,Shivamogga,Shivamogga,13.9299,75.5681,"Central taluk and gateway to Malenadu hills and waterfalls.",Always Open,0,https://lgdirectory.gov.in,verified
waterfall_barkana,Barkana Falls,ಬರ್ಕಣ ಜಲಪಾತ,waterfall,taluk_tirthahalli,Shivamogga,Tirthahalli,13.5350,75.1480,"One of India's ten highest waterfalls, cascading 850 ft into the dense Western Ghats.",07:00 – 17:00,50,https://karnatakatourism.org,verified
heritage_kavaledurga,Kavaledurga Fort,ಕವಲೇದುರ್ಗ ಕೋಟೆ,fort,taluk_tirthahalli,Shivamogga,Tirthahalli,13.7150,75.1220,"Ancient 9th-century hill fort enveloped in mist and rainforest foliage.",06:00 – 18:00,0,https://karnatakatourism.org,verified
village_kudli,Kudli Sangama,ಕೂಡ್ಲಿ,village,taluk_shivamogga,Shivamogga,Shivamogga,14.0040,75.6720,"Sacred confluence of Tunga and Bhadra rivers with Hoysala Rameshvara temple.",06:00 – 20:00,0,https://lgdirectory.gov.in,verified
taluk_badami,Badami Taluk,ಬಾದಾಮಿ ತಾಲೂಕು,taluk,dist_bagalkot,Bagalkot,Badami,15.9189,75.6766,"Chalukyan heritage taluk home to red sandstone cave temples and Agastya Lake.",Always Open,0,https://lgdirectory.gov.in,verified
`;
    setImportText(sample);
    showToast('Loaded official LGD / Pravasa AI sample dataset');
  };

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf8' }}>
        <div style={{ textAlign: 'center', padding: 40, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
          <Shield size={44} style={{ color: '#c0392b', margin: '0 auto 16px' }} />
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#1c1c1c', margin: '0 0 8px' }}>Administrative Access Required</h2>
          <p style={{ color: '#5a5a5a', fontSize: '0.9rem' }}>You must be authenticated with administrator privileges.</p>
        </div>
      </div>
    );
  }

  // Filter places for Destination Database tab
  const filteredPlaces = places.filter(p => {
    if (placeTypeFilter !== 'all') {
      if (placeTypeFilter === 'administrative') {
        if (!['district', 'taluk', 'town', 'village'].includes(p.place_type)) return false;
      } else if (placeTypeFilter === 'attractions') {
        if (['district', 'taluk', 'town', 'village'].includes(p.place_type)) return false;
      } else if (p.place_type !== placeTypeFilter) {
        return false;
      }
    }
    if (destSearch.trim()) {
      const q = destSearch.trim().toLowerCase();
      const match = (p.name || '').toLowerCase().includes(q) ||
        (p.id || '').toLowerCase().includes(q) ||
        (p.district || '').toLowerCase().includes(q) ||
        (p.taluk || '').toLowerCase().includes(q) ||
        (p.place_type || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const districtsCount = places.filter(p => p.place_type === 'district').length;
  const taluksCount = places.filter(p => p.place_type === 'taluk').length;
  const attractionsCount = places.filter(p => !['district', 'taluk', 'town', 'village'].includes(p.place_type)).length;
  const verifiedCoordsCount = places.filter(p => p.verification_status === 'verified' && (p.lat || p.location?.latitude)).length;

  const stats = [
    { label: 'Registered Entities', value: places.length, icon: Landmark, color: '#1a5c4c' },
    { label: 'Districts (LGD Master)', value: `${districtsCount}/31`, icon: Building, color: '#312e81' },
    { label: 'Taluks & Towns', value: taluksCount, icon: Compass, color: '#0f766e' },
    { label: 'Verified Attractions', value: attractionsCount, icon: Sparkles, color: '#c8702a' },
    { label: 'WGS84 Coordinates', value: `${verifiedCoordsCount}`, icon: CheckCircle2, color: '#16a34a' },
    { label: 'Crowd & SOS Logs', value: crowdReports.length + sosEvents.length, icon: ShieldAlert, color: '#c0392b' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      {/* Header */}
      <div style={{ background: '#1a5c4c', color: '#ffffff', padding: '44px 16px 52px', borderBottom: '1px solid #14483b' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Shield size={22} style={{ color: '#ffffff' }} />
              <h1 style={{ color: '#ffffff', fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', margin: 0, fontWeight: 700 }}>
                {t('adminDash')}
              </h1>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem' }}>
              Authenticated Session: <strong>{user?.name || 'Administrator'}</strong> ({user?.email}) · Authorization: Master Administrator
            </div>
          </div>
          <div>
            <button
              onClick={async () => {
                await signOut();
                showToast('Signed out of Government Admin session');
                navigate('/auth');
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5 shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto" style={{ padding: '0 16px', marginTop: -24 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          {stats.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="card" style={{ padding: '18px 16px', background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: '#5a5a5a', fontWeight: 600 }}>{s.label}</span>
                  <Icon size={18} style={{ color: s.color }} />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            );
          })}
        </div>

        {/* Data Quality Notice */}
        <div style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontWeight: 600, color: '#1c1c1c', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
            <Info size={16} style={{ color: '#1a5c4c' }} />
            <span>Statewide Inventory &amp; Strict Geofence Architecture</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.82rem', color: '#5a5a5a', lineHeight: 1.6 }}>
            <li><strong>Official Administrative Provenance:</strong> District, taluk, and village identifiers map to the Local Government Directory (LGD) with hierarchical <code>parent_id</code> links.</li>
            <li><strong>Geofence Coordinate Verification:</strong> Points are validated against Karnataka boundaries (11.5°N – 18.6°N, 74.0°E – 78.6°E). Records without verified coordinates are never plotted as map markers.</li>
            <li><strong>Stable Entity Addressing:</strong> All markers encode their immutable database <code>id</code>. Tapping any marker retrieves the verified record rather than querying by mutable name strings.</li>
          </ul>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 6, padding: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { id: 'gov_places', label: 'Gov Places & Photo Manager', icon: Building },
            { id: 'customers', label: 'Real-Time Customer Accounts', icon: Users },
            { id: 'destinations', label: 'Destination Database Explorer', icon: Landmark },
            { id: 'import', label: 'Spatial Pipeline & CSV Import', icon: Upload },
            { id: 'crowd', label: 'Crowd Submissions', icon: Users },
            { id: 'sos', label: 'Emergency Event Logs', icon: ShieldAlert },
            { id: 'health', label: 'System & Services Health', icon: Activity },
          ].map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  flex: 1,
                  minWidth: 160,
                  padding: '9px 12px',
                  borderRadius: 4,
                  border: 'none',
                  background: active ? '#1a5c4c' : 'transparent',
                  color: active ? '#ffffff' : '#5a5a5a',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background-color 0.15s, color 0.15s'
                }}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* GOV DESTINATIONS & PHOTO MANAGER TAB */}
        {/* ============================================================ */}
        {tab === 'gov_places' && (
          <div style={{ paddingBottom: 64 }}>
            {/* Header and Add Action */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8, padding: 20, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', color: '#1a5c4c' }}>
                  Official Tourism Places, Photos &amp; Services Maintenance
                </h3>
                <div style={{ fontSize: '0.84rem', color: '#5a5a5a' }}>
                  Add verified Karnataka destinations, update high-resolution photos, adjust timings, and maintain visitor services in real time.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAddModal(true)}
                  style={{ gap: 6, padding: '8px 16px' }}
                >
                  <Building size={14} /> + Add Official Tourist Destination
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={refreshPlaces}
                  style={{ gap: 4 }}
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
            </div>

            {/* Filter Search */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8, padding: 12, marginBottom: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8a8a8a' }} />
                <input
                  className="input"
                  style={{ paddingLeft: 36, height: 38, fontSize: '0.86rem', width: '100%' }}
                  placeholder="Search destinations to update photo, timings, or service facilities..."
                  value={destSearch}
                  onChange={e => setDestSearch(e.target.value)}
                />
              </div>
              <div style={{ fontSize: '0.82rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                Total: <strong>{filteredPlaces.length}</strong> places
              </div>
            </div>

            {/* Places Grid with Photos and Service Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {filteredPlaces.slice(0, 40).map(p => (
                <div key={p.id} className="card" style={{ background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* Photo with live preview */}
                  <div style={{ position: 'relative', height: 160, background: '#f3f4f6' }}>
                    <img
                      src={p.image || NEUTRAL_PLACEHOLDER_SVG}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.src = NEUTRAL_PLACEHOLDER_SVG; }}
                    />
                    <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(0,0,0,0.65)', color: '#ffffff', padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', textTransform: 'capitalize' }}>
                        {p.place_type || p.category}
                      </span>
                      {p.isPublished === false ? (
                        <span style={{ background: '#d97706', color: '#ffffff', padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 }}>
                          Draft (Unpublished)
                        </span>
                      ) : (
                        <span style={{ background: '#16a34a', color: '#ffffff', padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 }}>
                          ✓ Published
                        </span>
                      )}
                    </div>

                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                      {p.video && (
                        <span style={{ background: 'rgba(220, 38, 38, 0.9)', color: '#ffffff', padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600 }} title="Has curated video guide">
                          🎬 Video
                        </span>
                      )}
                      {p.timeOfDayMedia && (
                        <span style={{ background: 'rgba(15, 118, 110, 0.9)', color: '#ffffff', padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600 }} title="Has 4-period daytime imagery">
                          🌅🌙 Day/Night
                        </span>
                      )}
                      {p.offbeat && (
                        <div style={{ background: '#059669', color: '#ffffff', padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 }}>
                          ✨ Hidden Gem
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                          {p.name}
                        </h4>
                        <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {p.entryFeeINR ? `₹${p.entryFeeINR}` : 'Free Entry'}
                        </span>
                      </div>
                      {p.nameKannada && (
                        <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 6 }}>
                          {p.nameKannada}
                        </div>
                      )}
                      <div style={{ fontSize: '0.8rem', color: '#4b5563', marginBottom: 8 }}>
                        📍 {p.district} {p.taluk ? `• ${p.taluk}` : ''}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#6b7280', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Building size={12} /> Hours: {p.openingHours || '08:00 - 18:00'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#047857', background: '#ecfdf5', padding: '4px 8px', borderRadius: 4, marginBottom: 10 }}>
                        Services: {p.accessibility ? p.accessibility.slice(0, 60) + '...' : 'Wheelchair ramps & parking'}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #f3f4f6', paddingTop: 10, marginTop: 6, flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => {
                          setEditingPlace({ ...p });
                          setEditActiveTab('main');
                        }}
                        style={{ flex: 1, minWidth: 120, justifyContent: 'center', fontSize: '0.76rem', gap: 4 }}
                      >
                        Update Media &amp; Info
                      </button>
                      <button
                        className="btn btn-outline btn-xs"
                        onClick={() => handleTogglePublish(p)}
                        style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                        title={p.isPublished === false ? 'Click to Publish' : 'Click to Unpublish'}
                      >
                        {p.isPublished === false ? 'Publish' : 'Unpublish'}
                      </button>
                      <button
                        className="btn btn-outline btn-xs"
                        onClick={() => navigate(`/map?place=${p.id}`)}
                        style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                        title="View on Internal Map"
                      >
                        <Navigation size={12} /> Map
                      </button>
                      <a
                        href={p.lat && p.lng ? `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ', ' + p.district + ', Karnataka')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-xs"
                        style={{ padding: '4px 8px', fontSize: '0.76rem', color: '#1a5c4c', borderColor: '#a7f3d0', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                        title="Direct GPS Navigation in Google Maps"
                      >
                        <MapPin size={12} /> Direct GPS
                      </a>
                      <button
                        className="btn btn-outline btn-xs"
                        onClick={() => setDeleteConfirmPlace(p)}
                        style={{ padding: '4px 8px', fontSize: '0.76rem', color: '#dc2626', borderColor: '#fca5a5' }}
                        title="Delete place"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* REAL-TIME CUSTOMERS & USER ACCOUNTS TAB */}
        {/* ============================================================ */}
        {tab === 'customers' && (
          <div style={{ paddingBottom: 64 }}>
            {/* Header */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8, padding: 20, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', color: '#1a5c4c' }}>
                  Real-Time Customer &amp; User Accounts Directory
                </h3>
                <div style={{ fontSize: '0.84rem', color: '#5a5a5a' }}>
                  Live database records of registered travellers, government officers, and password recovery states.
                </div>
              </div>

              <button
                className="btn btn-outline btn-sm"
                onClick={refreshUsers}
                style={{ gap: 4 }}
              >
                <RefreshCw size={13} className={loadingUsers ? 'animate-spin' : ''} /> Refresh Accounts
              </button>
            </div>

            {/* Real-time Generated Reset Code Banner */}
            {generatedReset && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: '14px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 size={20} style={{ color: '#059669' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#065f46', fontSize: '0.9rem' }}>
                      Real-Time Reset Code Generated for {generatedReset.email}:
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#047857' }}>
                      Give this code to customer or use it on the Sign In page to immediately reset their password.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <code style={{ fontSize: '1.3rem', fontWeight: 800, background: '#ffffff', color: '#047857', padding: '6px 14px', borderRadius: 6, border: '1.5px solid #10b981', letterSpacing: '0.15em' }}>
                    {generatedReset.code}
                  </code>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => setGeneratedReset(null)}
                    style={{ color: '#047857' }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8, padding: 12, marginBottom: 14 }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8a8a8a' }} />
                <input
                  className="input"
                  style={{ paddingLeft: 36, height: 38, fontSize: '0.86rem', width: '100%' }}
                  placeholder="Search customer by name, email, phone number, or home city..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Users Table */}
            <div style={{ overflowX: 'auto', background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8f8f6', borderBottom: '1px solid #e2e2e0', fontSize: '0.74rem', color: '#5a5a5a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>Customer Name</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>Account Type</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>Email Address</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>Phone Number</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>City / District</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>Registered</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>Real-Time Password Reset</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList
                    .filter(u => {
                      if (!customerSearch.trim()) return true;
                      const q = customerSearch.toLowerCase().trim();
                      return (u.name || '').toLowerCase().includes(q) ||
                        (u.email || '').toLowerCase().includes(q) ||
                        (u.phone || '').includes(q) ||
                        (u.city || '').toLowerCase().includes(q);
                    })
                    .map(u => (
                      <tr
                        key={u.id || u.email}
                        style={{ borderBottom: '1px solid #f0f0ee', transition: 'background-color 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafaf8'}
                        onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                      >
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1c1c1c' }}>
                          <div>{u.name}</div>
                          {u.govDesignation && (
                            <div style={{ fontSize: '0.72rem', color: '#1a5c4c', fontWeight: 500 }}>
                              {u.govDesignation}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontWeight: 600,
                              background: u.role === 'admin' || u.role === 'gov_admin' ? '#e8f5f0' : '#eff6ff',
                              color: u.role === 'admin' || u.role === 'gov_admin' ? '#1a5c4c' : '#1e40af',
                              border: `1px solid ${u.role === 'admin' || u.role === 'gov_admin' ? '#c2e2d5' : '#bfdbfe'}`
                            }}
                          >
                            {u.role === 'admin' || u.role === 'gov_admin' ? '🏛️ Gov Officer' : '👤 Traveller'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#4b5563' }}>
                          <code>{u.email}</code>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#4b5563' }}>
                          {u.phone || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#4b5563' }}>
                          {u.city || 'Karnataka'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.76rem', color: '#7a7a7a' }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button
                            className="btn btn-outline btn-xs"
                            onClick={() => handleGenerateResetForUser(u.email)}
                            style={{ gap: 4, fontSize: '0.75rem', padding: '4px 8px' }}
                          >
                            <Key size={12} /> Generate Reset Code
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* DESTINATIONS TAB (Full Explorer) */}
        {/* ============================================================ */}
        {tab === 'destinations' && (
          <div style={{ paddingBottom: 64 }}>
            {/* Filter and Search Bar */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8, padding: 14, marginBottom: 14, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8a8a8a' }} />
                <input
                  className="input"
                  style={{ paddingLeft: 36, height: 36, fontSize: '0.85rem', width: '100%' }}
                  placeholder="Filter by name, database ID, district, or taluk..."
                  value={destSearch}
                  onChange={e => setDestSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Filter size={15} style={{ color: '#5a5a5a' }} />
                <select
                  className="input"
                  style={{ height: 36, fontSize: '0.85rem', paddingRight: 28 }}
                  value={placeTypeFilter}
                  onChange={e => setPlaceTypeFilter(e.target.value)}
                >
                  <option value="all">All Entity Types ({places.length})</option>
                  <option value="administrative">Administrative Only (Districts, Taluks, Villages)</option>
                  <option value="attractions">Attractions Only (Heritage, Nature, etc.)</option>
                  <option value="district">Districts ({districtsCount})</option>
                  <option value="taluk">Taluks ({taluksCount})</option>
                  <option value="heritage">Heritage &amp; History</option>
                  <option value="temple">Temples &amp; Spiritual</option>
                  <option value="nature">Nature &amp; Hills</option>
                  <option value="waterfall">Waterfalls</option>
                  <option value="wildlife">Wildlife &amp; Sanctuaries</option>
                  <option value="beach">Coastal &amp; Beaches</option>
                  <option value="fort">Historic Forts</option>
                </select>
              </div>

              <button
                className="btn btn-outline btn-sm"
                onClick={refreshPlaces}
                style={{ height: 36 }}
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: '0.82rem', color: '#5a5a5a' }}>
              <div>
                Showing <strong>{filteredPlaces.length}</strong> of <strong>{places.length}</strong> registered entities
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>● {verifiedCoordsCount} Verified Coordinates</span>
                <span style={{ color: '#312e81', fontWeight: 600 }}>● 31 Districts Configured</span>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#7a7a7a' }}>Retrieving database records...</div>
            ) : (
              <div style={{ overflowX: 'auto', background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ background: '#f8f8f6', borderBottom: '1px solid #e2e2e0', fontSize: '0.74rem', color: '#5a5a5a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {['Entity Name', 'Database ID', 'Type & Parent', 'District / Taluk', 'WGS84 Coordinates', 'Verification', 'Action'].map(h => (
                        <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlaces.map(p => (
                      <tr
                        key={p.id}
                        style={{ borderBottom: '1px solid #f0f0ee', transition: 'background-color 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafaf8'}
                        onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                      >
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1c1c1c' }}>
                          <div>{p.name}</div>
                          {p.nameKannada && <div style={{ fontSize: '0.74rem', color: '#7a7a7a', marginTop: 2 }}>{p.nameKannada}</div>}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <code style={{ fontSize: '0.76rem', background: '#f4f4f2', padding: '2px 6px', borderRadius: 4, color: '#1a5c4c' }}>
                            {p.id}
                          </code>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: '0.72rem', background: '#e8f5f0', color: '#1a5c4c', border: '1px solid #c2e2d5', padding: '1px 6px', borderRadius: 4, fontWeight: 600, width: 'fit-content', textTransform: 'capitalize' }}>
                              {p.place_type || 'place'}
                            </span>
                            {p.parent_id && (
                              <span style={{ fontSize: '0.72rem', color: '#5a5a5a' }}>
                                Parent: <code style={{ color: '#475569' }}>{p.parent_id}</code>
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#4b5563' }}>
                          <div>{p.district || '—'}</div>
                          {p.taluk && <div style={{ fontSize: '0.74rem', color: '#7a7a7a' }}>{p.taluk}</div>}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#1c1c1c' }}>
                          {p.lat && p.lng ? (
                            <span>{p.lat.toFixed(4)}°N, {p.lng.toFixed(4)}°E</span>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>No coordinates</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {p.verification_status === 'verified' ? (
                            <span style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.76rem', fontWeight: 600 }}>
                              <CheckCircle2 size={13} /> Verified
                            </span>
                          ) : (
                            <span style={{ color: '#d97706', fontSize: '0.76rem', fontWeight: 500 }}>Draft</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/map?place=${p.id}`)}
                            title="View on Map"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', gap: 4 }}
                          >
                            <Navigation size={12} /> Map
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* SPATIAL PIPELINE & CSV IMPORT TAB */}
        {/* ============================================================ */}
        {tab === 'import' && (
          <div style={{ paddingBottom: 64 }}>
            {/* Header banner */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8, padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', color: '#1c1c1c', margin: '0 0 6px', fontWeight: 700 }}>
                    Statewide Spatial Data Pipeline &amp; CSV Ingestion
                  </h2>
                  <div style={{ fontSize: '0.84rem', color: '#5a5a5a', maxWidth: 760, lineHeight: 1.55 }}>
                    Progressively import and calibrate verified administrative entities (districts, taluks, towns, villages) and tourism attractions. Every record is strictly validated against official Karnataka boundaries (11.5°N–18.6°N, 74.0°E–78.6°E) before publication to map viewers.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a
                    href="/api/map/markers/sample-csv"
                    download="karnataka_places_template.csv"
                    className="btn btn-outline btn-sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Download size={14} /> Download CSV Template
                  </a>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={loadOfficialSample}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Sparkles size={14} style={{ color: '#c8702a' }} /> Load Official Sample
                  </button>
                </div>
              </div>
            </div>

            {/* Ingestion Studio Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 20 }}>
              {/* Left Column: Data Input */}
              <div className="card" style={{ padding: 20, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1c1c1c', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={16} style={{ color: '#1a5c4c' }} />
                    <span>CSV or JSON Dataset Input</span>
                  </div>

                  {/* File selector input */}
                  <label
                    style={{
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#1a5c4c',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Upload size={13} />
                    <span>Upload .CSV</span>
                    <input
                      type="file"
                      accept=".csv,.txt,.json"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                <textarea
                  className="input"
                  style={{
                    width: '100%',
                    height: 260,
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    lineHeight: 1.45,
                    resize: 'vertical',
                    padding: 12,
                    marginBottom: 14
                  }}
                  placeholder={`id,name,nameKannada,place_type,parent_id,district,taluk,latitude,longitude,description,openingHours,entryFeeINR,source_url,verification_status\ntaluk_hospet,Hosapete Taluk,ಹೊಸಪೇಟೆ ತಾಲೂಕು,taluk,dist_vijayanagara,Vijayanagara,Hospet,15.2689,76.3909,"Administrative taluk headquarters for Hampi ruins.",Always Open,0,https://lgdirectory.gov.in,verified`}
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setImportText(''); setImportResult(null); }}
                    style={{ fontSize: '0.78rem' }}
                  >
                    Clear Input
                  </button>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleImportSubmit()}
                    disabled={importing || !importText.trim()}
                    style={{ padding: '8px 16px', fontWeight: 600, gap: 6 }}
                  >
                    <CheckCircle2 size={14} className={importing ? 'animate-spin' : ''} />
                    {importing ? 'Validating Bounds & Ingesting...' : 'Validate & Import Records'}
                  </button>
                </div>
              </div>

              {/* Right Column: Specification & Hierarchy Guide */}
              <div className="card" style={{ padding: 20, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1c1c1c', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Layers size={16} style={{ color: '#1a5c4c' }} />
                  <span>Standard Entity Addressing &amp; Field Specs</span>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 10, lineHeight: 1.5 }}>
                  <div style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 6, padding: '10px 12px' }}>
                    <strong style={{ color: '#1c1c1c' }}>1. Stable Database Identifier (<code>id</code>):</strong>
                    <div style={{ fontSize: '0.78rem', marginTop: 3 }}>
                      Must be unique and stable. Use <code>dist_&#123;name&#125;</code> for districts, <code>taluk_&#123;name&#125;</code> for taluks, <code>village_&#123;name&#125;</code> for villages.
                    </div>
                  </div>

                  <div style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 6, padding: '10px 12px' }}>
                    <strong style={{ color: '#1c1c1c' }}>2. Hierarchical Link (<code>parent_id</code>):</strong>
                    <div style={{ fontSize: '0.78rem', marginTop: 3 }}>
                      Links villages to taluks, taluks to districts. Ensures breadcrumbs and administrative grouping without flat duplication.
                    </div>
                  </div>

                  <div style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 6, padding: '10px 12px' }}>
                    <strong style={{ color: '#1c1c1c' }}>3. Boundary Geofence (Karnataka Limits):</strong>
                    <div style={{ fontSize: '0.78rem', marginTop: 3 }}>
                      Latitude: <code>11.5°N – 18.6°N</code> | Longitude: <code>74.0°E – 78.6°E</code>. Points outside these bounds are automatically rejected.
                    </div>
                  </div>

                  <div style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 6, padding: '10px 12px' }}>
                    <strong style={{ color: '#1c1c1c' }}>4. Verified Sources:</strong>
                    <div style={{ fontSize: '0.78rem', marginTop: 3 }}>
                      Administrative data: <a href="https://lgdirectory.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c4c' }}>LGD Directory</a> · Tourism attractions: <a href="https://karnatakatourism.org" target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c4c' }}>Karnataka Tourism</a>.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Validation & Ingestion Results */}
            {importResult && (
              <div
                style={{
                  background: importResult.ok ? '#ffffff' : '#fef2f2',
                  border: `1px solid ${importResult.ok ? (importResult.rejected > 0 ? '#fde68a' : '#c2e2d5') : '#fecaca'}`,
                  borderRadius: 8,
                  padding: 20,
                  marginBottom: 20,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  {importResult.ok ? (
                    importResult.rejected > 0 ? <AlertTriangle size={20} style={{ color: '#d97706' }} /> : <CheckCircle2 size={20} style={{ color: '#16a34a' }} />
                  ) : (
                    <AlertCircle size={20} style={{ color: '#c0392b' }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1c1c1c' }}>
                      {importResult.message || (importResult.ok ? 'Batch Ingestion Complete' : 'Import Execution Error')}
                    </div>
                    {importResult.ok && (
                      <div style={{ fontSize: '0.82rem', color: '#5a5a5a', marginTop: 2 }}>
                        Submitted: {importResult.totalSubmitted} records | Created: <strong style={{ color: '#16a34a' }}>{importResult.imported}</strong> | Updated: <strong style={{ color: '#0284c7' }}>{importResult.updated}</strong> | Rejected: <strong style={{ color: importResult.rejected > 0 ? '#c0392b' : '#5a5a5a' }}>{importResult.rejected}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Errors / Rejections Table if any */}
                {importResult.errors && importResult.errors.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#c0392b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Rejected Records Log ({importResult.errors.length})
                    </div>
                    <div style={{ overflowX: 'auto', background: '#fafaf8', border: '1px solid #e8e8e5', borderRadius: 6 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ background: '#f4f4f2', borderBottom: '1px solid #e2e2e0', textAlign: 'left', color: '#5a5a5a' }}>
                            <th style={{ padding: '8px 12px' }}>Row Index</th>
                            <th style={{ padding: '8px 12px' }}>Record ID / Name</th>
                            <th style={{ padding: '8px 12px' }}>Rejection Cause &amp; Bounds Issue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.errors.map((err, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f0f0ee' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>Row {err.index || i + 1}</td>
                              <td style={{ padding: '8px 12px' }}>
                                <code>{err.id || 'N/A'}</code> ({err.name || 'Unnamed'})
                              </td>
                              <td style={{ padding: '8px 12px', color: '#c0392b' }}>
                                {err.reason}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* CROWD SUBMISSIONS TAB */}
        {/* ============================================================ */}
        {tab === 'crowd' && (
          <div style={{ paddingBottom: 64 }}>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 14, color: '#1c1c1c' }}>
              Crowd Submissions &amp; Observation Queue ({crowdReports.length})
            </div>
            {crowdReports.length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: 'center', color: '#7a7a7a', background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
                No community observations recorded yet. Field submissions from travellers will populate here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {crowdReports.map(r => (
                  <div key={r.id} className="card" style={{ padding: 18, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1c1c1c' }}>{r.placeName || r.placeId}</div>
                        <div style={{ fontSize: '0.8rem', color: '#5a5a5a', marginTop: 3 }}>
                          Observed Density: <strong style={{ color: '#1c1c1c' }}>{r.crowdLevel}</strong> · Source: {r.source} · Time: {new Date(r.ts).toLocaleString('en-IN')}
                        </div>
                        {r.note && <div style={{ fontSize: '0.85rem', color: '#374151', marginTop: 6, fontStyle: 'italic' }}>"{r.note}"</div>}
                        {r.queueEstimate && <div style={{ fontSize: '0.8rem', color: '#5a5a5a', marginTop: 4 }}>Reported Queue: {r.queueEstimate}</div>}
                      </div>
                      <span style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', color: '#5a5a5a', padding: '3px 10px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, alignSelf: 'flex-start' }}>
                        Confidence: {r.confidence || 'low'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* SOS INCIDENTS TAB */}
        {/* ============================================================ */}
        {tab === 'sos' && (
          <div style={{ paddingBottom: 64 }}>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 14, color: '#1c1c1c' }}>
              Emergency Incident Log Queue ({sosEvents.length})
            </div>
            {sosEvents.length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: 'center', color: '#7a7a7a', background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
                No active emergency distress signals recorded in server memory.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sosEvents.map(e => (
                  <div key={e.id} className="card" style={{ padding: 18, borderLeft: '4px solid #c0392b', background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#c0392b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ShieldAlert size={16} />
                          <span>Incident: {e.emergencyType || 'General Distress'}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#5a5a5a', marginTop: 4 }}>
                          Session ID: {e.userId} · Timestamp: {new Date(e.ts).toLocaleString('en-IN')}
                        </div>
                        {e.location && (
                          <div style={{ fontSize: '0.82rem', color: '#1c1c1c', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace' }}>
                            <MapPin size={13} stroke="#1a5c4c" />
                            <span>GPS: {e.location.lat?.toFixed(5)}°N, {e.location.lng?.toFixed(5)}°E {e.locationAccuracy && `(±${Math.round(e.locationAccuracy)}m)`}</span>
                          </div>
                        )}
                      </div>
                      <span style={{ background: '#fdf0ef', border: '1px solid #fca5a5', color: '#c0392b', padding: '4px 12px', borderRadius: 4, fontSize: '0.78rem', fontWeight: 600, alignSelf: 'flex-start' }}>
                        Status: {e.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* HEALTH & SERVICES TAB */}
        {/* ============================================================ */}
        {tab === 'health' && (
          <div style={{ paddingBottom: 64 }}>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 14, color: '#1c1c1c' }}>
              Service Subsystems &amp; API Connectivity
            </div>

            {/* Google Gemini Card */}
            <div className="card" style={{ padding: '20px 22px', background: '#ffffff', border: '1px solid #c2e2d5', borderRadius: 8, marginBottom: 18, boxShadow: '0 2px 8px rgba(26,92,76,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={18} style={{ color: '#1a5c4c' }} />
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1c1c1c' }}>Google Gemini AI LLM Engine</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#5a5a5a', marginTop: 4 }}>
                    Powers intelligent day-by-day travel structuring, offbeat clustering, and chat refinement.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      background: geminiInfo?.ok ? '#e8f5f0' : geminiInfo?.configured ? '#fef8ee' : '#f4f4f2',
                      color: geminiInfo?.ok ? '#16a34a' : geminiInfo?.configured ? '#d97706' : '#5a5a5a',
                      border: `1px solid ${geminiInfo?.ok ? '#bbf7d0' : geminiInfo?.configured ? '#fde68a' : '#e2e2e0'}`,
                      padding: '4px 10px',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: geminiInfo?.ok ? '#16a34a' : geminiInfo?.configured ? '#d97706' : '#9ca3af' }} />
                    {geminiInfo?.ok ? 'Connected & Verified' : geminiInfo?.configured ? 'Key Configured (Untested)' : 'Not Configured (Rules Fallback)'}
                  </span>
                  {geminiInfo?.configured && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={handleTestOnly}
                      disabled={testingGemini}
                      style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    >
                      <RefreshCw size={12} className={testingGemini ? 'animate-spin' : ''} />
                      {testingGemini ? 'Testing...' : 'Test Connection'}
                    </button>
                  )}
                </div>
              </div>

              {/* Key Config Form */}
              <div style={{ background: '#fafaf8', border: '1px solid #e8e8e5', borderRadius: 6, padding: 16 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1c1c1c', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Key size={14} style={{ color: '#1a5c4c' }} />
                    <span>Configure API Credentials</span>
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.76rem', color: '#1a5c4c', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}
                  >
                    <span>Get free Gemini API Key</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showKey ? 'text' : 'password'}
                      className="input"
                      placeholder="Enter GEMINI_API_KEY (AIza...)"
                      value={geminiKeyInput}
                      onChange={e => setGeminiKeyInput(e.target.value)}
                      style={{ width: '100%', fontSize: '0.85rem', paddingRight: 36 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(v => !v)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8a8a8a', padding: 0 }}
                      aria-label="Toggle password visibility"
                    >
                      {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  <select
                    className="input"
                    value={geminiModelInput}
                    onChange={e => setGeminiModelInput(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended, fast &amp; versatile)</option>
                    <option value="gemini-2.0-flash">gemini-2.0-flash (High speed)</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash (Legacy fallback)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ fontSize: '0.75rem', color: '#7a7a7a' }}>
                    Key is securely stored in <code>server/.env</code> and never exposed to public clients.
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveAndTestGemini}
                    disabled={testingGemini || !geminiKeyInput.trim()}
                    style={{ gap: 6 }}
                  >
                    <Zap size={13} />
                    {testingGemini ? 'Verifying...' : 'Save & Verify Key'}
                  </button>
                </div>

                {testResult && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: '10px 14px',
                      borderRadius: 6,
                      fontSize: '0.82rem',
                      background: testResult.ok ? '#e8f5f0' : '#fef2f2',
                      border: `1px solid ${testResult.ok ? '#c2e2d5' : '#fecaca'}`,
                      color: testResult.ok ? '#14483b' : '#c0392b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    {testResult.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>
                      {testResult.ok
                        ? `Connection verified! Model responded: "${testResult.reply}" via ${testResult.model}. AI planning is fully operational.`
                        : `Verification failed: ${testResult.error || 'Please check your key permissions and quota.'}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Subsystems List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { name: 'Node.js Express Application Server', endpoint: '/api/health', required: true, desc: 'Core REST API router, authentication middleware, and spatial marker controller' },
                { name: 'Karnataka Spatial Places Registry', endpoint: '/api/places', required: true, desc: '90+ verified cultural, natural, district, and taluk records with WGS84 coordinates' },
                { name: 'Bounding Box Marker Service', endpoint: '/api/map/markers', required: true, desc: 'Spatial query engine filtering records within viewport boundaries' },
                { name: 'Travel Route Planner Engine', endpoint: null, required: true, desc: 'Heuristic itinerary generation engine supporting multi-day budget constraints' },
                { name: 'OpenStreetMap Tile Network', endpoint: null, required: true, desc: 'Interactive Leaflet GIS map rendering with standard cartographic tiles' },
              ].map(item => (
                <div key={item.name} className="card" style={{ padding: '16px 20px', background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#1c1c1c' }}>{item.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#5a5a5a', marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <span
                      style={{
                        background: item.required ? '#e8f5f0' : '#f8f8f6',
                        color: item.required ? '#1a5c4c' : '#5a5a5a',
                        border: `1px solid ${item.required ? '#c2e2d5' : '#e2e2e0'}`,
                        padding: '3px 10px',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      {item.required ? 'Production Core' : 'Configurable Add-on'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ADD OFFICIAL DESTINATION MODAL */}
        {/* ============================================================ */}
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#ffffff', borderRadius: 10, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #f3f4f6', paddingBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', color: '#1a5c4c' }}>
                  🏛️ Add Official Karnataka Tourist Destination
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#9ca3af' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddDestination} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Place Name (English) *</label>
                    <input
                      className="input"
                      required
                      placeholder="e.g. Kavaledurga Fort"
                      value={newPlace.name}
                      onChange={e => setNewPlace(p => ({ ...p, name: e.target.value }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Place Name (Kannada)</label>
                    <input
                      className="input"
                      placeholder="e.g. ಕವಲೇದುರ್ಗ ಕೋಟೆ"
                      value={newPlace.nameKannada}
                      onChange={e => setNewPlace(p => ({ ...p, nameKannada: e.target.value }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>District *</label>
                    <select
                      className="input"
                      value={newPlace.district}
                      onChange={e => setNewPlace(p => ({ ...p, district: e.target.value }))}
                      style={{ width: '100%' }}
                    >
                      {[
                        'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban',
                        'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga',
                        'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan',
                        'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal',
                        'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga',
                        'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayanagara', 'Vijayapura', 'Yadgir'
                      ].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Taluk</label>
                    <input
                      className="input"
                      placeholder="e.g. Tirthahalli"
                      value={newPlace.taluk}
                      onChange={e => setNewPlace(p => ({ ...p, taluk: e.target.value }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Category</label>
                    <select
                      className="input"
                      value={newPlace.category}
                      onChange={e => setNewPlace(p => ({ ...p, category: e.target.value }))}
                      style={{ width: '100%' }}
                    >
                      <option value="heritage">Heritage &amp; History</option>
                      <option value="religious">Temples &amp; Spiritual</option>
                      <option value="nature">Nature &amp; Hills</option>
                      <option value="adventure">Adventure &amp; Trekking</option>
                      <option value="culture">Art &amp; Culture</option>
                      <option value="family">Family &amp; Recreation</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Place Type</label>
                    <select
                      className="input"
                      value={newPlace.place_type}
                      onChange={e => setNewPlace(p => ({ ...p, place_type: e.target.value }))}
                      style={{ width: '100%' }}
                    >
                      <option value="temple">Temple / Pilgrimage</option>
                      <option value="waterfall">Waterfall</option>
                      <option value="beach">Coastal / Beach</option>
                      <option value="fort">Historic Fort</option>
                      <option value="hills">Hill Station / Trek</option>
                      <option value="wildlife">Wildlife Sanctuary</option>
                      <option value="lake">Lake</option>
                      <option value="cave">Caves / Geological</option>
                      <option value="museum">Museum / Palace</option>
                    </select>
                  </div>
                </div>

                {/* Google Maps GPS Navigation Link Section */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4, color: '#111827' }}>
                    Google Maps GPS Navigation Link *
                  </label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      className="input"
                      type="url"
                      required
                      placeholder="Paste Google Maps destination link here..."
                      value={newPlace.googleMapsUrl || ''}
                      onChange={e => setNewPlace(p => ({ ...p, googleMapsUrl: e.target.value }))}
                      style={{ flex: 1, fontSize: '0.86rem' }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        const url = newPlace.googleMapsUrl?.trim();
                        if (!url) {
                          showToast('Please paste a Google Maps destination link first');
                          return;
                        }
                        if (!url.includes('google.com/maps') && !url.includes('maps.app.goo.gl') && !url.includes('goo.gl/maps') && !url.startsWith('http')) {
                          showToast('Please enter a valid Google Maps sharing link (e.g. https://maps.app.goo.gl/...)');
                          return;
                        }
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                      style={{ gap: 4, whiteSpace: 'nowrap', borderColor: '#10b981', color: '#047857' }}
                    >
                      <MapPin size={14} /> Test GPS Navigation
                    </button>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#6b7280', marginTop: 4 }}>
                    Search the location in Google Maps, tap <strong>Share</strong>, copy the link, and paste here.
                  </div>
                </div>

                {/* Photo URL & Direct Media Upload */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Latest Destination Photo URL / Upload
                    </label>
                    <label style={{ cursor: 'pointer', fontSize: '0.78rem', color: '#1a5c4c', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Upload size={12} />
                      <span>{uploading ? 'Uploading...' : 'Direct Upload (Image/Video)'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadFile(file, uploadedUrl => {
                              if (file.type.startsWith('video/')) {
                                setNewPlace(p => ({
                                  ...p,
                                  video: { ...(p.video || {}), type: 'direct', url: uploadedUrl, title: `${p.name} Official Video` }
                                }));
                              } else {
                                setNewPlace(p => ({ ...p, image: uploadedUrl }));
                              }
                            });
                          }
                        }}
                        style={{ display: 'none' }}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  <input
                    className="input"
                    value={newPlace.image}
                    onChange={e => setNewPlace(p => ({ ...p, image: e.target.value }))}
                    placeholder="https://... or upload local JPG/PNG"
                    style={{ width: '100%', marginBottom: 6 }}
                  />
                  {uploadProgress && (
                    <div style={{ fontSize: '0.74rem', color: '#0284c7', marginBottom: 6, fontWeight: 500 }}>
                      ⏳ {uploadProgress}
                    </div>
                  )}
                  {newPlace.image && (
                    <div style={{ height: 110, width: '100%', borderRadius: 6, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 6 }}>
                      <img
                        src={newPlace.image}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.target.src = NEUTRAL_PLACEHOLDER_SVG; }}
                      />
                    </div>
                  )}
                </div>

                {/* Photo Attribution & Video URL */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Image Attribution / Source</label>
                    <input
                      className="input"
                      placeholder="e.g. Pravasa AI / Wikimedia Commons"
                      value={newPlace.imageAttribution?.source || ''}
                      onChange={e => setNewPlace(p => ({
                        ...p,
                        imageAttribution: { ...(p.imageAttribution || {}), source: e.target.value }
                      }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Curated Video URL (YouTube / MP4)</label>
                    <input
                      className="input"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={newPlace.video?.url || ''}
                      onChange={e => {
                        const val = e.target.value;
                        const ytid = extractYoutubeId(val);
                        setNewPlace(p => ({
                          ...p,
                          video: {
                            type: ytid ? 'youtube' : 'direct',
                            url: val,
                            videoId: ytid || undefined,
                            title: `${p.name || 'Destination'} Video Guide`
                          }
                        }));
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Opening Hours</label>
                    <input
                      className="input"
                      value={newPlace.openingHours}
                      onChange={e => setNewPlace(p => ({ ...p, openingHours: e.target.value }))}
                      placeholder="08:00 - 18:00"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Entry Fee (₹ INR)</label>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={newPlace.entryFeeINR}
                      onChange={e => setNewPlace(p => ({ ...p, entryFeeINR: +e.target.value }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Visitor Facilities &amp; Accessibility</label>
                  <input
                    className="input"
                    value={newPlace.accessibility}
                    onChange={e => setNewPlace(p => ({ ...p, accessibility: e.target.value }))}
                    placeholder="Wheelchair ramps, paved walkways, parking, drinking water"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Description</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={newPlace.description}
                    onChange={e => setNewPlace(p => ({ ...p, description: e.target.value }))}
                    style={{ width: '100%', height: 'auto' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Save Destination to Database
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* DELETE CONFIRMATION MODAL */}
        {/* ============================================================ */}
        {deleteConfirmPlace && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#ffffff', borderRadius: 10, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, color: '#dc2626' }}>
                <AlertTriangle size={28} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#111827' }}>Confirm Destination Deletion</h3>
              </div>
              <p style={{ fontSize: '0.86rem', color: '#4b5563', lineHeight: 1.5, margin: '0 0 16px' }}>
                Are you sure you want to delete <strong>"{deleteConfirmPlace.name}"</strong> from the verified database? This will remove its coordinates, photos, daytime imagery, and visitor facility data.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setDeleteConfirmPlace(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ background: '#dc2626', color: '#ffffff', borderColor: '#dc2626' }}
                  onClick={handleConfirmDelete}
                >
                  Delete Destination
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* EDIT DESTINATION MEDIA, DAYTIME & SERVICES MODAL */}
        {/* ============================================================ */}
        {editingPlace && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto', padding: 24, boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', color: '#1a5c4c' }}>
                    📸 Media Studio &amp; Place Maintenance
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 2 }}>
                    {editingPlace.name} ({editingPlace.district}) • {editingPlace.id}
                  </div>
                </div>
                <button
                  onClick={() => setEditingPlace(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#9ca3af' }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Tabs */}
              <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 6, padding: 3, marginBottom: 16 }}>
                {[
                  { id: 'main', label: 'Main Photo & Attribution', icon: ImageIcon },
                  { id: 'daytime', label: '🌅🌙 Daytime Photos', icon: Sun },
                  { id: 'video', label: '🎬 Video Guide', icon: Video },
                  { id: 'visitor', label: 'Timings & Services', icon: Clock },
                  { id: 'preview', label: '👁️ Card Preview', icon: Eye }
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setEditActiveTab(id)}
                    style={{
                      flex: 1,
                      padding: '7px 8px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      borderRadius: 4,
                      border: 'none',
                      background: editActiveTab === id ? '#ffffff' : 'transparent',
                      color: editActiveTab === id ? '#1a5c4c' : '#6b7280',
                      boxShadow: editActiveTab === id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Upload progress banner if active */}
              {uploading && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '8px 12px', borderRadius: 6, marginBottom: 14, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>{uploadProgress || 'Uploading file to server uploads repository...'}</span>
                </div>
              )}

              <form onSubmit={handleUpdateDestination} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* ---------------- TAB 1: MAIN PHOTO & ATTRIBUTION ---------------- */}
                {editActiveTab === 'main' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Destination Verified Photo URL</label>
                        <label style={{ cursor: 'pointer', fontSize: '0.78rem', color: '#1a5c4c', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Upload size={12} />
                          <span>Direct Photo Upload</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadFile(file, url => setEditingPlace(p => ({ ...p, image: url })));
                            }}
                            style={{ display: 'none' }}
                            disabled={uploading}
                          />
                        </label>
                      </div>
                      <input
                        className="input"
                        value={editingPlace.image || ''}
                        onChange={e => setEditingPlace(p => ({ ...p, image: e.target.value }))}
                        placeholder="https://..."
                        style={{ width: '100%', marginBottom: 8 }}
                      />
                      {editingPlace.image && (
                        <div style={{ height: 160, width: '100%', borderRadius: 6, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                          <img
                            src={editingPlace.image}
                            alt={editingPlace.name}
                            referrerPolicy="no-referrer"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { e.target.src = NEUTRAL_PLACEHOLDER_SVG; }}
                          />
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Photo Source / Platform</label>
                        <input
                          className="input"
                          value={editingPlace.imageAttribution?.source || ''}
                          onChange={e => setEditingPlace(p => ({
                            ...p,
                            imageAttribution: { ...(p.imageAttribution || {}), source: e.target.value }
                          }))}
                          placeholder="e.g. Wikimedia Commons / Department of Tourism"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Photographer / Author</label>
                        <input
                          className="input"
                          value={editingPlace.imageAttribution?.author || ''}
                          onChange={e => setEditingPlace(p => ({
                            ...p,
                            imageAttribution: { ...(p.imageAttribution || {}), author: e.target.value }
                          }))}
                          placeholder="e.g. Official Contributor"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>License Name</label>
                        <input
                          className="input"
                          value={editingPlace.imageAttribution?.license || ''}
                          onChange={e => setEditingPlace(p => ({
                            ...p,
                            imageAttribution: { ...(p.imageAttribution || {}), license: e.target.value }
                          }))}
                          placeholder="e.g. CC BY-SA 4.0 / Public Domain"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>License Terms URL</label>
                        <input
                          className="input"
                          value={editingPlace.imageAttribution?.licenseUrl || ''}
                          onChange={e => setEditingPlace(p => ({
                            ...p,
                            imageAttribution: { ...(p.imageAttribution || {}), licenseUrl: e.target.value }
                          }))}
                          placeholder="https://creativecommons.org/..."
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------- TAB 2: DAYTIME PHOTOS ---------------- */}
                {editActiveTab === 'daytime' && (
                  <div>
                    {/* Period subtabs */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                      {[
                        { key: 'morning', label: '🌅 Morning', color: '#ea580c' },
                        { key: 'afternoon', label: '☀️ Afternoon', color: '#0284c7' },
                        { key: 'evening', label: '🌇 Evening', color: '#d97706' },
                        { key: 'night', label: '🌙 Night', color: '#4338ca' }
                      ].map(({ key, label, color }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setDaytimePeriodTab(key)}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            borderRadius: 6,
                            border: daytimePeriodTab === key ? `1px solid ${color}` : '1px solid #e5e7eb',
                            background: daytimePeriodTab === key ? '#ffffff' : '#f9fafb',
                            color: daytimePeriodTab === key ? color : '#6b7280',
                            cursor: 'pointer'
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Active period editor */}
                    {['morning', 'afternoon', 'evening', 'night'].includes(daytimePeriodTab) && (() => {
                      const period = daytimePeriodTab;
                      const periodData = editingPlace.timeOfDayMedia?.[period] || {};

                      const updatePeriodField = (field, val) => {
                        setEditingPlace(p => ({
                          ...p,
                          timeOfDayMedia: {
                            ...(p.timeOfDayMedia || {}),
                            [period]: {
                              ...(p.timeOfDayMedia?.[period] || {}),
                              [field]: val
                            }
                          }
                        }));
                      };

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <label style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'capitalize' }}>
                                {period} Photo URL / Upload
                              </label>
                              <label style={{ cursor: 'pointer', fontSize: '0.78rem', color: '#1a5c4c', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Upload size={12} />
                                <span>Upload {period} photo</span>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/avif"
                                  onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUploadFile(file, url => updatePeriodField('url', url));
                                  }}
                                  style={{ display: 'none' }}
                                  disabled={uploading}
                                />
                              </label>
                            </div>
                            <input
                              className="input"
                              value={periodData.url || ''}
                              onChange={e => updatePeriodField('url', e.target.value)}
                              placeholder={`https://... photo representing ${period} atmosphere`}
                              style={{ width: '100%', marginBottom: 6 }}
                            />
                            {periodData.url && (
                              <div style={{ height: 140, width: '100%', borderRadius: 6, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                <img
                                  src={periodData.url}
                                  alt={`${period} preview`}
                                  referrerPolicy="no-referrer"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={e => { e.target.src = NEUTRAL_PLACEHOLDER_SVG; }}
                                />
                              </div>
                            )}
                          </div>

                          <div>
                            <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Caption</label>
                            <input
                              className="input"
                              value={periodData.caption || ''}
                              onChange={e => updatePeriodField('caption', e.target.value)}
                              placeholder={`e.g. Sunrise / daytime / sunset / night vista of ${editingPlace.name}`}
                              style={{ width: '100%' }}
                            />
                          </div>

                          {period === 'night' && (
                            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', fontWeight: 600, color: '#1e293b', cursor: 'pointer', marginBottom: 8 }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(periodData.isOpenAtNight)}
                                  onChange={e => updatePeriodField('isOpenAtNight', e.target.checked)}
                                />
                                <span>Attraction is physically open to visitors at night</span>
                              </label>
                              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4, color: '#475569' }}>
                                Night Visitor Instructions &amp; Safety Notice
                              </label>
                              <textarea
                                className="input"
                                rows={2}
                                value={periodData.nightNotes || ''}
                                onChange={e => updatePeriodField('nightNotes', e.target.value)}
                                placeholder="Explain evening illumination timings or why entry closes at sunset..."
                                style={{ width: '100%', height: 'auto', fontSize: '0.8rem' }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ---------------- TAB 3: VIDEO GUIDE ---------------- */}
                {editActiveTab === 'video' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Curated Video URL (YouTube or Direct MP4)</label>
                        <label style={{ cursor: 'pointer', fontSize: '0.78rem', color: '#1a5c4c', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Upload size={12} />
                          <span>Direct Video Upload (MP4/WebM)</span>
                          <input
                            type="file"
                            accept="video/mp4,video/webm"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleUploadFile(file, url => {
                                  setEditingPlace(p => ({
                                    ...p,
                                    video: {
                                      ...(p.video || {}),
                                      type: 'direct',
                                      url,
                                      title: `${p.name} Official Video Guide`
                                    }
                                  }));
                                });
                              }
                            }}
                            style={{ display: 'none' }}
                            disabled={uploading}
                          />
                        </label>
                      </div>
                      <input
                        className="input"
                        value={editingPlace.video?.url || ''}
                        onChange={e => {
                          const val = e.target.value;
                          const ytid = extractYoutubeId(val);
                          setEditingPlace(p => ({
                            ...p,
                            video: {
                              ...(p.video || {}),
                              type: ytid ? 'youtube' : 'direct',
                              url: val,
                              videoId: ytid || undefined
                            }
                          }));
                        }}
                        placeholder="https://www.youtube.com/watch?v=... or direct MP4 URL"
                        style={{ width: '100%', marginBottom: 6 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Video Title</label>
                      <input
                        className="input"
                        value={editingPlace.video?.title || ''}
                        onChange={e => setEditingPlace(p => ({
                          ...p,
                          video: { ...(p.video || {}), title: e.target.value }
                        }))}
                        placeholder="e.g. Wonders of Karnataka | Official Tourism Video"
                        style={{ width: '100%' }}
                      />
                    </div>

                    {/* Embedded preview */}
                    {editingPlace.video?.url && (() => {
                      const ytid = extractYoutubeId(editingPlace.video.url);
                      return (
                        <div style={{ marginTop: 6 }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4, color: '#4b5563' }}>Video Preview</label>
                          {ytid ? (
                            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 6, background: '#000000' }}>
                              <iframe
                                src={`https://www.youtube.com/embed/${ytid}?enablejsapi=1&autoplay=0&rel=0`}
                                title="Video Preview"
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          ) : (
                            <video
                              src={editingPlace.video.url}
                              controls
                              style={{ width: '100%', maxHeight: 220, borderRadius: 6, background: '#000000' }}
                            />
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ---------------- TAB 4: VISITOR INFO & TIMINGS ---------------- */}
                {editActiveTab === 'visitor' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Opening Hours</label>
                        <input
                          className="input"
                          value={editingPlace.openingHours || ''}
                          onChange={e => setEditingPlace(p => ({ ...p, openingHours: e.target.value }))}
                          placeholder="08:00 - 18:00"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Entry Fee (₹ INR)</label>
                        <input
                          className="input"
                          type="number"
                          min={0}
                          value={editingPlace.entryFeeINR || 0}
                          onChange={e => setEditingPlace(p => ({ ...p, entryFeeINR: +e.target.value }))}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    {/* Google Maps GPS Navigation Link */}
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        Google Maps GPS Navigation Link *
                      </label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          className="input"
                          type="url"
                          placeholder="Paste Google Maps destination link here..."
                          value={editingPlace.googleMapsUrl || editingPlace.timeOfDayMedia?.googleMapsUrl || (editingPlace.source_url && editingPlace.source_url.includes('maps') ? editingPlace.source_url : '')}
                          onChange={e => {
                            const val = e.target.value;
                            setEditingPlace(p => ({
                              ...p,
                              googleMapsUrl: val,
                              source_url: val || p.source_url,
                              timeOfDayMedia: { ...(p.timeOfDayMedia || {}), googleMapsUrl: val }
                            }));
                          }}
                          style={{ flex: 1, fontSize: '0.86rem' }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            const url = editingPlace.googleMapsUrl || editingPlace.timeOfDayMedia?.googleMapsUrl || editingPlace.source_url;
                            if (!url) {
                              showToast('Please paste a Google Maps destination link first');
                              return;
                            }
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                          style={{ gap: 4, whiteSpace: 'nowrap', borderColor: '#10b981', color: '#047857' }}
                        >
                          <MapPin size={14} /> Test GPS Navigation
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Service Status</label>
                      <select
                        className="input"
                        value={editingPlace.serviceStatus || 'Operational'}
                        onChange={e => setEditingPlace(p => ({ ...p, serviceStatus: e.target.value }))}
                        style={{ width: '100%' }}
                      >
                        <option value="Operational">Operational &amp; Open to Visitors</option>
                        <option value="Seasonal Maintenance">Seasonal Maintenance / Monsoon Advisory</option>
                        <option value="Temporarily Closed">Temporarily Restricted / Closed</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Accessibility &amp; Visitor Amenities</label>
                      <input
                        className="input"
                        value={editingPlace.accessibility || ''}
                        onChange={e => setEditingPlace(p => ({ ...p, accessibility: e.target.value }))}
                        placeholder="Wheelchair ramps, rest areas, drinking water"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Official Contact / Website</label>
                      <input
                        className="input"
                        value={editingPlace.official_website || ''}
                        onChange={e => setEditingPlace(p => ({ ...p, official_website: e.target.value }))}
                        placeholder="https://karnatakatourism.org"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                )}

                {/* ---------------- TAB 5: PUBLIC CARD PREVIEW ---------------- */}
                {editActiveTab === 'preview' && (() => {
                  const currentPreviewPhoto = editingPlace.timeOfDayMedia?.[previewTimeOfDay]?.url || editingPlace.image || NEUTRAL_PLACEHOLDER_SVG;
                  return (
                    <div>
                      {/* Daytime preview switcher */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4b5563' }}>Preview as:</span>
                        {['morning', 'afternoon', 'evening', 'night'].map(period => (
                          <button
                            key={period}
                            type="button"
                            onClick={() => setPreviewTimeOfDay(period)}
                            style={{
                              padding: '4px 10px',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              borderRadius: 4,
                              border: previewTimeOfDay === period ? '1px solid #1a5c4c' : '1px solid #e5e7eb',
                              background: previewTimeOfDay === period ? '#1a5c4c' : '#ffffff',
                              color: previewTimeOfDay === period ? '#ffffff' : '#4b5563',
                              cursor: 'pointer'
                            }}
                          >
                            {TIME_OF_DAY_CONFIG[period]?.icon} {TIME_OF_DAY_CONFIG[period]?.label}
                          </button>
                        ))}
                      </div>

                      {/* Preview Card Mock */}
                      <div style={{ maxWidth: 360, margin: '0 auto', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                        <div style={{ position: 'relative', height: 180, background: '#f3f4f6' }}>
                          <img
                            src={currentPreviewPhoto}
                            alt="Preview"
                            referrerPolicy="no-referrer"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { e.target.src = NEUTRAL_PLACEHOLDER_SVG; }}
                          />
                          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', color: '#ffffff', padding: '2px 8px', borderRadius: 4, fontSize: '0.74rem' }}>
                            {TIME_OF_DAY_CONFIG[previewTimeOfDay]?.icon} {TIME_OF_DAY_CONFIG[previewTimeOfDay]?.label}
                          </div>
                          {editingPlace.video?.url && (
                            <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(220,38,38,0.9)', color: '#ffffff', padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600 }}>
                              🎬 Video
                            </div>
                          )}
                        </div>
                        <div style={{ padding: 14 }}>
                          <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700 }}>{editingPlace.name}</h4>
                          <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 6 }}>📍 {editingPlace.district} • {editingPlace.entryFeeINR ? `₹${editingPlace.entryFeeINR}` : 'Free'}</div>
                          <div style={{ fontSize: '0.74rem', color: '#047857', background: '#ecfdf5', padding: '4px 8px', borderRadius: 4 }}>
                            {editingPlace.openingHours || '08:00 - 18:00'} • {editingPlace.serviceStatus || 'Operational'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Modal Footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setEditingPlace(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="btn btn-primary"
                    style={{ opacity: uploading ? 0.7 : 1, cursor: uploading ? 'wait' : 'pointer' }}
                  >
                    {uploading ? 'Uploading Photo...' : 'Save All Changes to Database'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
