import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../AppContext';
import { INTERESTS, CITIES, MONTHS, MAJOR_GATEWAYS, KARNATAKA_DISTRICTS, KARNATAKA_TALUKS } from '../i18n';
import {
  Sparkles,
  ChevronRight,
  RotateCcw,
  Download,
  Share2,
  Heart,
  Trash2,
  Plus,
  Clock,
  Car,
  Utensils,
  Ticket,
  Hotel,
  Leaf,
  AlertTriangle,
  Lightbulb,
  Info,
  CheckCircle2,
  Calendar,
  Compass,
  LifeBuoy,
  Volume2,
  VolumeX,
  ShieldCheck,
  Zap,
  MapPin,
  Search,
  X,
  ExternalLink,
  Map as MapIcon
} from 'lucide-react';
import TourismMap, { ItineraryMapView } from '../components/MapView';
import BudgetPanel from '../components/BudgetPanel';

function ChatBox({ plan, setPlan }) {
  const { t } = useApp();
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    if (!msg.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, plan }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      if (data?.days) setPlan(data);
      setMsg('');
    } catch (e) {
      setError('Could not process request. ' + (e.message || ''));
    }
    setLoading(false);
  };

  return (
    <div className="card" style={{ padding: 18, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.95rem', marginBottom: 10, fontFamily: 'Playfair Display, serif', color: '#1c1c1c' }}>
        <Sparkles size={16} style={{ color: '#1a5c4c' }} />
        <span>Refine Itinerary with AI</span>
      </div>
      {plan?.meta?.source === 'ai' ? (
        <div style={{ background: '#e8f5f0', border: '1px solid #c2e2d5', borderRadius: 6, padding: '8px 12px', fontSize: '0.78rem', color: '#1a5c4c', marginBottom: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
          <Sparkles size={14} style={{ flexShrink: 0, color: '#1a5c4c' }} />
          <span><strong>Google Gemini AI active:</strong> Natural language refinement ready. Ask to add stops, lighten days, or modify food.</span>
        </div>
      ) : (
        <div style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 6, padding: '8px 12px', fontSize: '0.78rem', color: '#5a5a5a', marginBottom: 10, display: 'flex', gap: 6 }}>
          <Info size={14} style={{ flexShrink: 0, marginTop: 1, color: '#7a7a7a' }} />
          <span>Deterministic offline planner active. Configure Gemini in Admin to unlock full LLM reasoning.</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="input"
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="e.g. Add heritage temple on Day 2, prioritize coastal stops..."
          onKeyDown={e => e.key === 'Enter' && send()}
          style={{ width: '100%', fontSize: '0.85rem' }}
        />
        <button className="btn btn-primary btn-sm" onClick={send} disabled={loading || !msg.trim()} style={{ whiteSpace: 'nowrap' }}>
          {loading ? 'Processing...' : 'Apply'}
        </button>
      </div>
      {error && <div style={{ color: '#c0392b', fontSize: '0.8rem', marginTop: 6 }}>{error}</div>}
      <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['Lighter pace Day 2', 'Add more food stops', 'Include offbeat destinations', 'Reduce travel drive time'].map(s => (
          <button
            key={s}
            className="btn btn-ghost btn-xs"
            onClick={() => setMsg(s)}
            style={{ background: '#f4f4f2', color: '#374151', border: '1px solid #e2e2e0', borderRadius: 4, padding: '3px 8px' }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PlanTrip() {
  const { t, saveTrip, showToast, lang } = useApp();
  const [searchParams] = useSearchParams();
  const [hasGemini, setHasGemini] = useState(false);
  const [targetPlace, setTargetPlace] = useState(null);

  const [form, setForm] = useState({
    startCity: 'Bengaluru',
    days: 4,
    travellers: 2,
    month: new Date().getMonth() + 1,
    budget: 25000,
    budgetStyle: 'Medium',
    interests: ['heritage', 'nature'],
    groupType: 'Couple',
    pace: 'Balanced',
    travelMode: 'Personal car',
    offbeat: false,
    accessibilityNeeds: false,
    targetPlaceId: '',
    autoBudgetSelection: false
  });

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState('all');
  const [focusPlace, setFocusPlace] = useState(null);
  const [tripSaved, setTripSaved] = useState(false);
  const [speakingStopId, setSpeakingStopId] = useState(null);
  const [rescuingId, setRescuingId] = useState(null);

  // Real-time Destination Search and Integrated Map state
  const [allPlaces, setAllPlaces] = useState([]);
  const [destSearch, setDestSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showFormMap, setShowFormMap] = useState(true);

  useEffect(() => {
    fetch('/api/places?limit=160')
      .then(r => r.json())
      .then(res => {
        const list = Array.isArray(res) ? res : res.data || [];
        setAllPlaces(list);
      })
      .catch(() => {});
  }, []);

  const handleDestSearch = (text) => {
    setDestSearch(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    const rawQ = text.toLowerCase().trim();
    const cleanQ = rawQ
      .replace(/\b(district|dist|taluk|taluka|tk|city|town|village|place|places|in|near|at|around|close\s+to|from|to|ಹತ್ತಿರ|ಜಿಲ್ಲೆ|ತಾಲೂಕು|ನಗರ|ತಾಣಗಳು)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const q = cleanQ || rawQ;
    const normStr = s => (s || '').toLowerCase().replace(/th/g, 't').replace(/[^a-z0-9]/g, '');
    const qNorm = normStr(q);
    const tokens = q.split(' ').filter(t => t.length > 2);

    const matches = allPlaces.filter(p => {
      const pName = (p.name || '').toLowerCase();
      const pNameKn = (p.nameKannada || '').toLowerCase();
      const pDist = (p.district || '').toLowerCase();
      const pTaluk = (p.taluk || '').toLowerCase();
      const pType = (p.place_type || '').toLowerCase();

      // 1. Direct name match
      if (pName.includes(q) || pNameKn.includes(q) || normStr(pName).includes(qNorm)) return true;

      // 2. District & Taluk matching
      if (pDist && (pDist.includes(q) || (q.length >= 3 && q.includes(pDist)) || normStr(pDist).includes(qNorm))) return true;
      if (pTaluk && (pTaluk.includes(q) || (q.length >= 3 && q.includes(pTaluk)) || normStr(pTaluk).includes(qNorm))) return true;

      // 3. Category/Type
      if (pType && pType === q) return true;

      // 4. Token match
      if (tokens.length > 0) {
        return tokens.some(t =>
          pName.includes(t) || (pDist && pDist.includes(t)) || (pTaluk && pTaluk.includes(t))
        );
      }
      return false;
    }).slice(0, 16);
    setSearchResults(matches);
  };

  const selectTargetDestination = (p) => {
    setTargetPlace(p);
    setDestSearch(p.name);
    setSearchResults([]);
    setForm(prev => ({
      ...prev,
      targetPlaceId: p.id,
      interests: Array.from(new Set([...prev.interests, ...(p.category ? (Array.isArray(p.category) ? p.category : [p.category]) : [p.place_type])].filter(Boolean))),
      offbeat: p.offbeat ? true : prev.offbeat,
      autoBudgetSelection: true
    }));
    showToast(`Added ${p.name} (${p.district}) as target destination for your trip.`);
  };

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setHasGemini(!!d?.env?.hasGeminiKey))
      .catch(() => {});

    const placeId = searchParams.get('place');
    if (placeId) {
      fetch('/api/places')
        .then(r => r.json())
        .then(res => {
          const list = Array.isArray(res) ? res : res.data || [];
          const found = list.find(p => p.id === placeId);
          if (found) {
            setTargetPlace(found);
            setForm(prev => ({
              ...prev,
              targetPlaceId: found.id,
              interests: Array.from(new Set([...prev.interests, ...(found.category || [])])),
              offbeat: found.offbeat ? true : prev.offbeat,
              autoBudgetSelection: true
            }));
          }
        })
        .catch(() => {});
    }
  }, [searchParams]);

  const submit = async () => {
    if (form.days < 1 || form.days > 10) {
      setError('Trip duration must be between 1 and 10 days.');
      return;
    }
    if (form.budget < 1000) {
      setError('Minimum budget calculation starts from ₹1,000.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (form.autoBudgetSelection && !form.targetPlaceId) {
        throw new Error('Search for and select a destination before using automatic budget-based attraction selection.');
      }
      const planEndpoint = form.autoBudgetSelection ? '/api/plan/auto-budget' : '/api/plan';
      const res = await fetch(planEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Server error');
      }
      const data = await res.json();
      setPlan(data);
      setSelectedDay('all');
      setTripSaved(false);
    } catch (e) {
      setError(e.message || 'Could not generate plan. Please try again.');
    }
    setLoading(false);
  };

  const removeStop = async (placeId, day) => {
    try {
      const res = await fetch('/api/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          action: 'remove',
          placeId,
          day,
          preferences: {
            travellers: form.travellers,
            travelMode: form.travelMode,
            budgetStyle: form.budgetStyle,
            budget: form.budget,
            startCity: form.startCity
          }
        })
      });
      setPlan(await res.json());
      showToast('Stop removed and budget recalculated.');
    } catch {}
  };

  // Smart Trip Rescue: Alternative rerouting
  const handleRescueStop = async (placeId, day) => {
    setRescuingId(placeId);
    try {
      const res = await fetch('/api/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          action: 'rescue',
          placeId,
          day,
          preferences: {
            travellers: form.travellers,
            travelMode: form.travelMode,
            budgetStyle: form.budgetStyle,
            budget: form.budget,
            startCity: form.startCity
          }
        })
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Could not find alternative');
      setPlan(updated);
      showToast('Smart Trip Rescue: Alternative destination assigned & costs updated!');
    } catch (err) {
      showToast(err.message);
    }
    setRescuingId(null);
  };

  // Voice narration for stops
  const handleVoiceNarration = (stop) => {
    if (!('speechSynthesis' in window)) {
      showToast('Speech narration is not supported in this browser.');
      return;
    }

    if (speakingStopId === stop.placeId) {
      window.speechSynthesis.cancel();
      setSpeakingStopId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const narrationText = `${stop.name}. Scheduled from ${stop.startTime} to ${stop.endTime}. ${stop.description}. Traveler Tip: ${stop.tip || 'Follow posted signs.'}`;
    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingStopId(null);
    utterance.onerror = () => setSpeakingStopId(null);

    setSpeakingStopId(stop.placeId);
    window.speechSynthesis.speak(utterance);
    showToast(`Playing AI Voice Guide for ${stop.name}`);
  };

  const downloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      const el = document.getElementById('itinerary-content');
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 1.5, useCORS: true });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(img, 'PNG', 0, 0, w, Math.min(h, pdf.internal.pageSize.getHeight()));
      pdf.save(`pravasa-karnataka-${form.days}days.pdf`);
      showToast('PDF downloaded successfully.');
    } catch (e) {
      showToast('PDF download failed: ' + e.message);
    }
  };

  const shareWA = () => {
    if (!plan) return;
    let text = `My Karnataka Travel Itinerary (${form.days} Days, Budget: ₹${form.budget.toLocaleString('en-IN')})\n\n`;
    plan.days.forEach(d => {
      text += `Day ${d.day}: ` + d.stops.map(s => s.name).join(' → ') + '\n';
    });
    text += `\nOrganized with Pravasa AI`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSaveTrip = () => {
    if (!plan) return;
    saveTrip(plan, form);
    setTripSaved(true);
    showToast('Itinerary saved to your profile for offline access.');
  };

  const toggleInterest = (id) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(id) ? f.interests.filter(x => x !== id) : [...f.interests, id],
    }));
  };

  // FORM VIEW
  if (!plan) {
    return (
      <div style={{ minHeight: '100vh', background: '#fafaf8', paddingBottom: 60 }}>
        {/* Top Banner */}
        <div style={{ background: '#1a5c4c', color: '#ffffff', padding: '40px 16px 52px', borderBottom: '1px solid #14483b' }}>
          <div className="max-w-7xl mx-auto">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e8f5f0', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  <Compass size={16} />
                  <span>{lang === 'kn' ? 'ವೈಯಕ್ತಿಕ ಯಾತ್ರಾ ಮಾರ್ಗ ರಚನೆ' : 'Personalized Route Engineering'}</span>
                </div>
                <h1 style={{ color: '#ffffff', fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 700, margin: '0 0 10px' }}>
                  {t('planTitle')}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1rem', lineHeight: 1.6, margin: 0, maxWidth: 650 }}>
                  {t('planSub')}
                </p>
              </div>

              {/* Direct Link to Full Smart Map */}
              <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '12px 18px', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ fontSize: '0.82rem', color: '#e8f5f0', marginBottom: 4 }}>
                  {lang === 'kn' ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್ ಶೈಲಿಯ ಅನ್ವೇಷಣೆ ಬೇಕೇ?' : 'Looking for Google Maps-style discovery?'}
                </div>
                <a
                  href="/map"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    background: '#ffffff',
                    color: '#1a5c4c',
                    padding: '6px 14px',
                    borderRadius: 6,
                    marginTop: 4
                  }}
                >
                  <MapIcon size={15} /> {lang === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ನಕ್ಷೆ ತೆರೆಯಿರಿ' : 'Open All-in-One Smart Map'}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto" style={{ padding: '0 16px', marginTop: -26 }}>
          {/* Top Search Bar & Destination Selector */}
          <div className="card" style={{ padding: '18px 22px', background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8, marginBottom: 18, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1a5c4c', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Search size={17} /> {lang === 'kn' ? 'ಯಾವುದೇ ಜಿಲ್ಲೆ, ತಾಲೂಕು, ನಗರ ಅಥವಾ ತಾಣ ಹುಡುಕಿ' : 'Search Any Karnataka District, Taluk, City, or Destination'}
              </label>
              <button
                type="button"
                onClick={() => setShowFormMap(s => !s)}
                className="btn btn-ghost btn-xs"
                style={{ color: '#1a5c4c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <MapIcon size={14} /> {showFormMap ? (lang === 'kn' ? 'ನಕ್ಷೆ ಮರೆಮಾಡಿ' : 'Hide Real-Time Map') : (lang === 'kn' ? 'ನಕ್ಷೆ ತೋರಿಸಿ' : 'Show Real-Time Map')}
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                className="input"
                value={destSearch}
                onChange={e => handleDestSearch(e.target.value)}
                placeholder={lang === 'kn' ? 'ಯಾವುದೇ ಜಿಲ್ಲೆ, ತಾಲೂಕು, ನಗರ ಅಥವಾ ತಾಣ ಹುಡುಕಿ (ಉದಾ: ಶಿವಮೊಗ್ಗ, ತೀರ್ಥಹಳ್ಳಿ, ಬಾದಾಮಿ, ಬೀದರ್, ಹಂಪಿ, ಉಡುಪಿ)...' : 'Search any district, taluk, city, or place (e.g. Shivamogga district, Tirthahalli taluk, Badami, Bidar, Hampi, Udupi)...'}
                style={{ width: '100%', paddingLeft: 40, height: 44, fontSize: '0.92rem' }}
              />
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              {destSearch && (
                <button
                  type="button"
                  onClick={() => { setDestSearch(''); setSearchResults([]); }}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Auto-complete Dropdown */}
            {searchResults.length > 0 && (
              <div style={{ position: 'absolute', left: 22, right: 22, zIndex: 200, background: '#ffffff', border: '1px solid #d1d5db', borderRadius: 8, marginTop: 4, maxHeight: 300, overflowY: 'auto', boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}>
                {searchResults.map(p => (
                  <div
                    key={p.id}
                    onClick={() => selectTargetDestination(p)}
                    style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#111827' }}>
                        {p.name} {p.nameKannada && <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>({p.nameKannada})</span>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>
                        {p.district} • <span style={{ textTransform: 'capitalize' }}>{p.place_type || p.category}</span> {p.offbeat && <span style={{ color: '#047857', fontWeight: 600 }}>• ✨ Hidden Gem</span>}
                      </div>
                    </div>
                    <button type="button" className="btn btn-primary btn-xs" style={{ pointerEvents: 'none' }}>
                      + Set as Target
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Two-Column Grid: Planner Form + Integrated Map */}
          <div style={{ display: 'grid', gridTemplateColumns: showFormMap ? 'repeat(auto-fit, minmax(380px, 1fr))' : '1fr', gap: 24, alignItems: 'start' }}>
            {/* Left Column: Form Controls */}
            <div className="card" style={{ padding: 28, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
              {/* Target Destination Notice */}
              {targetPlace && (
                <div style={{ background: '#e8f5f0', border: '1px solid #c2e2d5', borderRadius: 6, padding: '12px 16px', marginBottom: 18, fontSize: '0.84rem', color: '#1a5c4c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={16} />
                    <span>Target Destination Added: <strong>{targetPlace.name}</strong> ({targetPlace.district})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setTargetPlace(null); setForm(f => ({ ...f, targetPlaceId: '', autoBudgetSelection: false })); setDestSearch(''); }}
                    style={{ background: 'none', border: 'none', color: '#1a5c4c', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Information Notice */}
              <div style={{ background: hasGemini ? '#e8f5f0' : '#f8f8f6', border: `1px solid ${hasGemini ? '#c2e2d5' : '#e8e8e5'}`, borderRadius: 6, padding: '12px 16px', marginBottom: 20, fontSize: '0.82rem', color: hasGemini ? '#14483b' : '#475569', display: 'flex', alignItems: 'center', gap: 10 }}>
                {hasGemini ? <Sparkles size={16} style={{ color: '#1a5c4c', flexShrink: 0 }} /> : <Info size={16} style={{ color: '#5a5a5a', flexShrink: 0 }} />}
                <div>
                  <strong>Planner Engine:</strong> {hasGemini ? 'Google Gemini AI active. Itinerary synthesis and natural chat adjustments will use Gemini LLM.' : 'Deterministic offline planner active. Configure Gemini in Admin Dashboard to enable generative AI reasoning.'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 18 }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2b2b2b', display: 'block', marginBottom: 6 }}>
                    {lang === 'kn' ? 'ಪ್ರಾರಂಭ ನಗರ / ಗೇಟ್‌ವೇ (31 ಜಿಲ್ಲೆಗಳು & ತಾಲೂಕುಗಳು)' : 'Starting Point / Gateway (31 Districts & Taluks)'}
                  </label>
                  <select
                    className="input"
                    value={form.startCity}
                    onChange={e => setForm(f => ({ ...f, startCity: e.target.value }))}
                    style={{ width: '100%', fontSize: '0.86rem' }}
                  >
                    <optgroup label={lang === 'kn' ? '🌟 ಪ್ರಮುಖ ನಗರಗಳು' : '🌟 Major Gateways'}>
                      {MAJOR_GATEWAYS.map(c => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                    <optgroup label={lang === 'kn' ? '🏛️ ಎಲ್ಲಾ 31 ಜಿಲ್ಲೆಗಳು' : '🏛️ All 31 Karnataka Districts'}>
                      {KARNATAKA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </optgroup>
                    <optgroup label={lang === 'kn' ? '📍 ಪ್ರಮುಖ ತಾಲೂಕುಗಳು & ಪಟ್ಟಣಗಳು' : '📍 Popular Taluks & Towns'}>
                      {KARNATAKA_TALUKS.map(t => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2b2b2b', display: 'block', marginBottom: 6 }}>
                    {t('days')} (1–10)
                  </label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={10}
                    value={form.days}
                    onChange={e => setForm(f => ({ ...f, days: +e.target.value }))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2b2b2b', display: 'block', marginBottom: 6 }}>
                    {lang === 'kn' ? 'ಪ್ರಯಾಣಿಕರು' : 'Travellers'}
                  </label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={20}
                    value={form.travellers || 2}
                    onChange={e => setForm(f => ({ ...f, travellers: Math.max(1, +e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2b2b2b', display: 'block', marginBottom: 6 }}>
                    {t('month')}
                  </label>
                  <select
                    className="input"
                    value={form.month}
                    onChange={e => setForm(f => ({ ...f, month: +e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i + 1}>
                        {typeof m === 'object' ? (lang === 'kn' ? m.kn : m.en) : m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2b2b2b', display: 'block', marginBottom: 6 }}>
                    {t('budget')} (₹ INR)
                  </label>
                  <input
                    className="input"
                    type="number"
                    min={1000}
                    step={500}
                    value={form.budget}
                    onChange={e => setForm(f => ({ ...f, budget: +e.target.value }))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2b2b2b', display: 'block', marginBottom: 8 }}>
                  {t('budgetStyle')}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: 'Low', en: 'Low / Budget', kn: 'ಬಜೆಟ್ / ಕಡಿಮೆ' },
                    { id: 'Medium', en: 'Medium / Balanced', kn: 'ಮಧ್ಯಮ / ಆರಾಮದಾಯಕ' },
                    { id: 'Premium', en: 'Premium / Luxury', kn: 'ಐಷಾರಾಮಿ / ಹೆರಿಟೇಜ್' }
                  ].map(b => (
                    <button
                      key={b.id}
                      type="button"
                      className={`btn ${form.budgetStyle === b.id ? 'btn-primary' : 'btn-outline'} btn-sm`}
                      onClick={() => setForm(f => ({ ...f, budgetStyle: b.id }))}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      {lang === 'kn' ? b.kn : b.en}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2b2b2b', display: 'block', marginBottom: 8 }}>
                  {lang === 'kn' ? 'ಪ್ರಯಾಣದ ಆಸಕ್ತಿಗಳು' : 'Travel Interests'}
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {INTERESTS.map(i => {
                    const active = form.interests.includes(i.id);
                    return (
                      <button
                        key={i.id}
                        className={`pill ${active ? 'pill-active' : 'pill-inactive'}`}
                        onClick={() => toggleInterest(i.id)}
                        type="button"
                        style={{ cursor: 'pointer' }}
                      >
                        {lang === 'kn' ? (i.labelKn || i.label) : i.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2b2b2b', display: 'block', marginBottom: 6 }}>
                    {t('groupType')}
                  </label>
                  <select
                    className="input"
                    value={form.groupType}
                    onChange={e => setForm(f => ({ ...f, groupType: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    {[
                      { id: 'Solo', en: 'Solo Traveler', kn: 'ಒಂಟಿ ಪ್ರವಾಸಿ' },
                      { id: 'Couple', en: 'Couple', kn: 'ದಂಪತಿ' },
                      { id: 'Family with kids', en: 'Family with kids', kn: 'ಕುಟುಂಬ (ಮಕ್ಕಳೊಂದಿಗೆ)' },
                      { id: 'Seniors', en: 'Seniors', kn: 'ಹಿರಿಯ ನಾಗರಿಕರು' },
                      { id: 'Friends group', en: 'Friends group', kn: 'ಸ್ನೇಹಿತರ ಗುಂಪು' }
                    ].map(g => (
                      <option key={g.id} value={g.id}>
                        {lang === 'kn' ? g.kn : g.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2b2b2b', display: 'block', marginBottom: 6 }}>
                    {t('pace')}
                  </label>
                  <select
                    className="input"
                    value={form.pace}
                    onChange={e => setForm(f => ({ ...f, pace: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    {[
                      { id: 'Relaxed', en: 'Relaxed (1-2 places/day)', kn: 'ನಿರಾಳ (ದಿನಕ್ಕೆ 1-2 ತಾಣ)' },
                      { id: 'Balanced', en: 'Balanced (2-3 places/day)', kn: 'ಮಧ್ಯಮ (ದಿನಕ್ಕೆ 2-3 ತಾಣ)' },
                      { id: 'Packed', en: 'Packed (4+ places/day)', kn: 'ವೇಗದ ಪ್ರವಾಸ (ದಿನಕ್ಕೆ 4+ ತಾಣ)' }
                    ].map(p => (
                      <option key={p.id} value={p.id}>
                        {lang === 'kn' ? p.kn : p.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2b2b2b', display: 'block', marginBottom: 6 }}>
                    {lang === 'kn' ? 'ಸಾರಿಗೆ ವಿಧಾನ' : 'Transport Mode'}
                  </label>
                  <select
                    className="input"
                    value={form.travelMode}
                    onChange={e => setForm(f => ({ ...f, travelMode: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    {[
                      { id: 'Personal car', en: 'Personal Car', kn: 'ಸ್ವಂತ ಕಾರು' },
                      { id: 'Personal bike', en: 'Personal Bike / Scooter', kn: 'ಸ್ವಂತ ಬೈಕ್' },
                      { id: 'Rental car', en: 'Rental Car (Self-Drive)', kn: 'ಬಾಡಿಗೆ ಕಾರು' },
                      { id: 'Rental bike', en: 'Rental Two-Wheeler', kn: 'ಬಾಡಿಗೆ ಬೈಕ್' },
                      { id: 'Taxi', en: 'Taxi / Cab (Chauffeur)', kn: 'ಟ್ಯಾಕ್ಸಿ / ಕ್ಯಾಬ್' },
                      { id: 'Bus', en: 'KSRTC Rajahamsa / Express Bus', kn: 'ಕೆಎಸ್‌ಆರ್‌ಟಿಸಿ ಬಸ್' },
                      { id: 'Train', en: 'Indian Railways Express', kn: 'ರೈಲು' },
                      { id: 'Electric Vehicle', en: 'Electric Vehicle (EV)', kn: 'ಎಲೆಕ್ಟ್ರಿಕ್ ವಾಹನ (EV)' }
                    ].map(m => (
                      <option key={m.id} value={m.id}>
                        {lang === 'kn' ? m.kn : m.en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checkboxes: Offbeat & Accessibility */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 6, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="offbeat"
                    checked={form.offbeat}
                    onChange={e => setForm(f => ({ ...f, offbeat: e.target.checked }))}
                    style={{ accentColor: '#1a5c4c', width: 17, height: 17 }}
                  />
                  <label htmlFor="offbeat" style={{ fontSize: '0.85rem', color: '#2b2b2b', cursor: 'pointer', fontWeight: 500 }}>
                    {lang === 'kn' ? 'ಗುಪ್ತ ಮತ್ತು ಆಫ್‌ಬೀಟ್ ತಾಣಗಳಿಗೆ ಆದ್ಯತೆ ನೀಡಿ' : 'Prioritize hidden gems & off-beat destinations'}
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="accessibilityNeeds"
                    checked={form.accessibilityNeeds}
                    onChange={e => setForm(f => ({ ...f, accessibilityNeeds: e.target.checked }))}
                    style={{ accentColor: '#1a5c4c', width: 17, height: 17 }}
                  />
                  <label htmlFor="accessibilityNeeds" style={{ fontSize: '0.85rem', color: '#2b2b2b', cursor: 'pointer', fontWeight: 500 }}>
                    {lang === 'kn' ? 'ವಿಶೇಷ ಸೌಲಭ್ಯಗಳು (ವೀಲ್‌ಚೇರ್ ರ‍್ಯಾಂಪ್, ಸಮತಟ್ಟಾದ ದಾರಿ)' : 'Special accessibility needs (Wheelchair ramps, flat terrain)'}
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingTop: 4 }}>
                  <input
                    type="checkbox"
                    id="autoBudgetSelection"
                    checked={Boolean(form.autoBudgetSelection)}
                    onChange={e => setForm(f => ({ ...f, autoBudgetSelection: e.target.checked }))}
                    style={{ accentColor: '#1a5c4c', width: 17, height: 17, marginTop: 2 }}
                  />
                  <label htmlFor="autoBudgetSelection" style={{ fontSize: '0.85rem', color: '#1a5c4c', cursor: 'pointer', fontWeight: 700 }}>
                    {lang === 'kn' ? 'ನನ್ನ ಬಜೆಟ್ ಒಳಗೆ ತಾಣಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಆಯ್ಕೆಮಾಡಿ' : 'Automatically select attractions within my budget'}
                    <span style={{ display: 'block', color: '#64748b', fontWeight: 400, fontSize: '0.76rem', marginTop: 3 }}>
                      {lang === 'kn' ? 'ಹೋಗುವ ಮತ್ತು ಹಿಂದಿರುಗುವ ಪ್ರಯಾಣದ ವೆಚ್ಚವನ್ನು ಮೊದಲು ಕಾಯ್ದಿರಿಸುತ್ತದೆ.' : 'Reserves outbound and return travel, food and stay costs before choosing attractions.'}
                    </span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={submit}
                  disabled={loading}
                  style={{ flex: 2, justifyContent: 'center', minWidth: 180, padding: '12px 20px', fontWeight: 600 }}
                >
                  <Sparkles size={16} /> {loading ? (lang === 'kn' ? 'ಯೋಜನೆ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...' : 'Synthesizing Itinerary...') : (lang === 'kn' ? 'ಪ್ರವಾಸ ಯೋಜನೆ ರಚಿಸಿ' : 'Generate Itinerary')}
                </button>
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => setForm({
                    startCity: 'Bengaluru',
                    days: 4,
                    travellers: 2,
                    month: 10,
                    budget: 25000,
                    budgetStyle: 'Medium',
                    interests: ['heritage', 'nature', 'food'],
                    groupType: 'Family with kids',
                    pace: 'Balanced',
                    travelMode: 'Taxi',
                    offbeat: false,
                    accessibilityNeeds: true,
                    targetPlaceId: '',
                    autoBudgetSelection: false
                  })}
                  style={{ justifyContent: 'center', padding: '12px 18px' }}
                >
                  {lang === 'kn' ? 'ಮಾದರಿ ವಿವರ' : 'Sample Profile'}
                </button>
              </div>

              {error && (
                <div style={{ marginTop: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 14px', color: '#c0392b', fontSize: '0.88rem', display: 'flex', gap: 8 }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Right Column: Integrated Interactive Real-Time Map */}
            {showFormMap && (
              <div className="card" style={{ padding: 18, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.95rem', color: '#1a5c4c', fontFamily: 'Playfair Display, serif' }}>
                    <MapIcon size={18} />
                    <span>Real-Time Pravasa AI Map</span>
                  </div>
                  <a
                    href="/map"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.78rem', color: '#1a5c4c', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 600 }}
                  >
                    Full-Screen Map <ExternalLink size={12} />
                  </a>
                </div>

                <div style={{ height: 490, borderRadius: 6, overflow: 'hidden', border: '1px solid #e5e7eb', position: 'relative' }}>
                  <TourismMap
                    initialPlaces={allPlaces}
                    highlightPlace={targetPlace}
                    selectedPlaceId={targetPlace?.id}
                    onSelectPlace={selectTargetDestination}
                  />
                </div>

                <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#6b7280', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>💡 Click any marker on the map to set it as target destination</span>
                  <span style={{ fontWeight: 600, color: '#1a5c4c' }}>{allPlaces.length} Places Active</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ITINERARY VIEW
  const isAi = plan.meta?.source === 'ai';

  return (
    <div style={{ background: '#fafaf8', minHeight: '100vh' }}>
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e2e0', padding: '14px 16px' }}>
        <div className="max-w-7xl mx-auto" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1.35rem', color: '#1c1c1c' }}>
              {t('itineraryTitle')}
            </h2>
            <span
              style={{
                background: isAi ? '#e8f5f0' : '#f8f8f6',
                color: isAi ? '#1a5c4c' : '#5a5a5a',
                border: `1px solid ${isAi ? '#c2e2d5' : '#e2e2e0'}`,
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 4
              }}
            >
              {isAi ? 'Gemini AI Synthesized' : 'Deterministic Routing Engine'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={downloadPDF}>
              <Download size={14} /> Export PDF
            </button>
            <button className="btn btn-outline btn-sm" onClick={shareWA}>
              <Share2 size={14} /> Share Plan
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleSaveTrip}
              disabled={tripSaved}
              style={tripSaved ? { color: '#16a34a', borderColor: '#16a34a' } : {}}
            >
              <Heart size={14} fill={tripSaved ? '#16a34a' : 'none'} />
              {tripSaved ? 'Saved to Profile' : 'Save Itinerary'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPlan(null)}>
              <RotateCcw size={14} /> New Itinerary
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto" style={{ padding: '24px 16px' }}>
        <div id="itinerary-content" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          {plan.meta?.autoBudgetOptimization && (
            <div className="card" style={{ padding: 18, background: '#e8f5f0', border: '1px solid #c2e2d5', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#14532d', fontWeight: 800, marginBottom: 8 }}>
                <Sparkles size={17} /> Automatic Budget-Based Attraction Selection
              </div>
              <div style={{ color: '#1f2937', fontSize: '0.86rem', lineHeight: 1.6 }}>
                Selected {plan.meta.autoBudgetOptimization.selectedCount} of {plan.meta.autoBudgetOptimization.availableCandidates} nearby attractions.
                The outbound and return journeys are both included in the transportation estimate.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 10, fontSize: '0.82rem', fontWeight: 600, color: '#14532d' }}>
                <span>Outbound: {plan.meta.roundTrip?.outboundDistanceKm ?? '—'} km</span>
                <span>Sightseeing loop: {plan.meta.roundTrip?.sightseeingLoopDistanceKm ?? '—'} km</span>
                <span>Return: {plan.meta.roundTrip?.returnDistanceKm ?? '—'} km</span>
                <span>Total: {plan.meta.roundTrip?.totalDistanceKm ?? '—'} km</span>
              </div>
              <div style={{ marginTop: 8, fontSize: '0.74rem', color: '#475569' }}>
                Road distances are estimates based on the current routing model, not live traffic or confirmed fares.
              </div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: 24, alignItems: 'start' }}>
            {/* Left: Schedule */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Day selector */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  className={`btn btn-sm ${selectedDay === 'all' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setSelectedDay('all')}
                  style={{ minWidth: 150, justifyContent: 'center', fontWeight: 700 }}
                >
                  <Sparkles size={14} style={{ marginRight: 6 }} /> Entire Timeline ({plan.days.length} Days)
                </button>
                {plan.days.map(d => (
                  <button
                    key={d.day}
                    className={`btn btn-sm ${selectedDay === d.day ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setSelectedDay(d.day)}
                    style={{ minWidth: 80, justifyContent: 'center' }}
                  >
                    Day {d.day}
                  </button>
                ))}
              </div>

              {/* Weather advisories banner */}
              {plan.weatherAdvisories && plan.weatherAdvisories.length > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Calendar size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.84rem', color: '#166534', lineHeight: 1.5 }}>
                    <strong>Seasonal Weather Forecast:</strong> {plan.weatherAdvisories[0]}
                  </div>
                </div>
              )}

              {/* Rescued stop notices */}
              {plan.rescues && plan.rescues.length > 0 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <LifeBuoy size={16} style={{ color: '#d97706', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.82rem', color: '#92400e' }}>
                    <strong>Smart Trip Rescue Active:</strong> {plan.rescues[plan.rescues.length - 1].original} was rerouted to {plan.rescues[plan.rescues.length - 1].replacement}.
                  </div>
                </div>
              )}

              {(selectedDay === 'all' ? plan.days : plan.days.filter(d => d.day === selectedDay)).map(d => {
                // Helper: compute departure time (30 min before first stop's travel)
                const firstStop = d.stops[0];
                const lastStop = d.stops[d.stops.length - 1];
                const isLastDay = d.day === plan.days.length;

                // Parse time string HH:MM to get hours/minutes
                const parseTime = (t) => { if (!t) return null; const [h,m] = t.split(':').map(Number); return { h, m, str: t }; };
                const fmtTime = (h, m) => `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
                const subtractMin = (timeStr, mins) => {
                  const t = parseTime(timeStr); if (!t) return '08:00';
                  let totalMin = t.h * 60 + t.m - mins;
                  if (totalMin < 0) totalMin = 0;
                  return fmtTime(Math.floor(totalMin / 60), totalMin % 60);
                };
                const addMin = (timeStr, mins) => {
                  const t = parseTime(timeStr); if (!t) return '18:00';
                  let totalMin = t.h * 60 + t.m + mins;
                  return fmtTime(Math.floor(totalMin / 60) % 24, totalMin % 60);
                };
                const timeToAmPm = (timeStr) => {
                  const t = parseTime(timeStr); if (!t) return timeStr;
                  const ampm = t.h >= 12 ? 'PM' : 'AM';
                  const hr = t.h % 12 || 12;
                  return `${hr}:${String(t.m).padStart(2,'0')} ${ampm}`;
                };

                // Compute departure time
                const departureTime = d.departureTime || (firstStop
                  ? (firstStop.travelFromPrevMin > 0 ? subtractMin(firstStop.startTime, firstStop.travelFromPrevMin) : subtractMin(firstStop.startTime, 30))
                  : (d.day === 1 ? '07:00' : '09:00'));

                // Check if lunch break fits between stops
                const needsLunch = d.stops.length > 0;
                let lunchInsertAfter = -1;
                if (needsLunch) {
                  for (let si = 0; si < d.stops.length; si++) {
                    const endT = parseTime(d.stops[si].endTime);
                    if (endT && endT.h >= 12 && endT.h < 15) {
                      lunchInsertAfter = si;
                      break;
                    }
                  }
                  if (lunchInsertAfter === -1 && d.stops.length > 1) lunchInsertAfter = Math.floor(d.stops.length / 2) - 1;
                }

                // Timeline node styling
                const nodeStyle = (bg, border) => ({
                  width: 32, height: 32, borderRadius: '50%', background: bg,
                  border: `2px solid ${border}`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0, fontSize: '0.85rem', zIndex: 2
                });
                const connectorStyle = { width: 2, background: '#d1d5db', minHeight: 24, margin: '0 auto', zIndex: 1 };
                const travelSegmentStyle = {
                  background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8,
                  padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: '0.8rem', color: '#64748b', marginLeft: 0
                };

                return (
                <div key={d.day} className="card" style={{ padding: 24, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 10, marginBottom: 16 }}>
                  <div style={{ borderBottom: '1px solid #f0f0ee', paddingBottom: 14, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <h3 style={{ margin: '0 0 4px', fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', color: '#1a1a2e' }}>
                        {d.title}
                      </h3>
                      <span style={{ fontSize: '0.78rem', background: '#e6f4ea', color: '#137333', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
                        Day {d.day} of {plan.days.length}
                      </span>
                    </div>
                    <div style={{ color: '#5a5a5a', fontSize: '0.85rem' }}>Sector: {d.region}</div>
                    {d.travelKm > 0 && (
                      <div style={{ color: '#1a5c4c', fontSize: '0.78rem', marginTop: 4, fontWeight: 500 }}>
                        📏 Total travel: {d.travelKm} km · ⏱ Est. driving: {d.estDrivingHours ? `${d.estDrivingHours} hrs` : `${Math.round(d.travelKm / 50 * 60)} min`}
                      </div>
                    )}
                  </div>

                  {/* Empty day — Intelligent transit / arrival / return handling */}
                  {d.stops.length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '12px 0' }}>
                      {d.day === 1 ? (
                        <>
                          {/* 🌅 Morning Departure */}
                          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={nodeStyle('#fef3c7', '#f59e0b')}>🌅</div>
                              <div style={connectorStyle} />
                            </div>
                            <div style={{ flex: 1, paddingTop: 5 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#92400e' }}>
                                07:00 AM — Depart from {plan.meta?.roundTrip?.origin || plan.meta?.startCity || plan.startCity || 'Starting Point'}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>
                                Begin your scenic road journey towards {d.region}
                              </div>
                            </div>
                          </div>

                          {/* 🚗 Highway Travel */}
                          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{ ...connectorStyle, minHeight: 8, borderStyle: 'dashed' }} />
                            </div>
                            <div style={{ flex: 1, padding: '4px 0' }}>
                              <div style={travelSegmentStyle}>
                                <Car size={14} stroke="#94a3b8" />
                                <span>Express highway transit · {d.travelKm || plan.meta?.roundTrip?.outboundDistanceKm || 500} km (~{d.estDrivingHours || 8} hrs driving)</span>
                              </div>
                            </div>
                          </div>

                          {/* 🍽️ Highway Lunch */}
                          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={connectorStyle} />
                              <div style={nodeStyle('#fff7ed', '#f97316')}>🍽️</div>
                              <div style={connectorStyle} />
                            </div>
                            <div style={{ flex: 1, paddingTop: 6, paddingBottom: 6 }}>
                              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 14px' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#9a3412' }}>
                                  01:00 PM – 02:00 PM · Highway Lunch & Refreshment Break
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: 2 }}>
                                  Traditional South Indian thali, Davanagere Benne Dosa or hot filter coffee along the expressway
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 🏨 Destination Hotel Check-in */}
                          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={connectorStyle} />
                              <div style={nodeStyle('#f0fdf4', '#16a34a')}>🏨</div>
                            </div>
                            <div style={{ flex: 1, paddingTop: 6 }}>
                              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#166534' }}>
                                  04:30 PM — Check-in at {d.stay?.area || d.region} & Relax
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#15803d', marginTop: 2 }}>
                                  Freshen up, enjoy a relaxed evening walk through the local town/heritage markets, and relish local Karnataka cuisine
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : isLastDay ? (
                        <>
                          {/* 🌅 Morning Breakfast & Check-out */}
                          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={nodeStyle('#fef3c7', '#f59e0b')}>🌅</div>
                              <div style={connectorStyle} />
                            </div>
                            <div style={{ flex: 1, paddingTop: 5 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#92400e' }}>
                                09:00 AM — Morning Breakfast & Hotel Check-out
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>
                                Relish regional breakfast at {d.stay?.area || d.region} and pack your luggage
                              </div>
                            </div>
                          </div>

                          {/* 🛍️ Souvenirs & Market */}
                          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={connectorStyle} />
                              <div style={nodeStyle('#f3e8ff', '#a855f7')}>🛍️</div>
                              <div style={connectorStyle} />
                            </div>
                            <div style={{ flex: 1, paddingTop: 6, paddingBottom: 6 }}>
                              <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 8, padding: '10px 14px' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#6b21a8' }}>
                                  10:00 AM – 11:30 AM · Local Handicrafts & Souvenir Shopping
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#7e22ce', marginTop: 2 }}>
                                  Pick up genuine local specialties: handloom textiles, authentic regional sweets & local spices
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 🍽️ Farewell Lunch */}
                          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={connectorStyle} />
                              <div style={nodeStyle('#fff7ed', '#f97316')}>🍽️</div>
                              <div style={connectorStyle} />
                            </div>
                            <div style={{ flex: 1, paddingTop: 6, paddingBottom: 6 }}>
                              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 14px' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#9a3412' }}>
                                  12:00 PM – 01:00 PM · Farewell Regional Lunch
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: 2 }}>
                                  Hearty local lunch before hitting the highway
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 🏁 Return Drive & Safe Arrival */}
                          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={connectorStyle} />
                              <div style={nodeStyle('#fef2f2', '#ef4444')}>🏁</div>
                            </div>
                            <div style={{ flex: 1, paddingTop: 6 }}>
                              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#991b1b' }}>
                                  01:00 PM – 08:30 PM · Return Highway Journey to {plan.meta?.roundTrip?.origin || plan.meta?.startCity || plan.startCity || 'Home'}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: 2 }}>
                                  Return trip of {d.travelKm || plan.meta?.roundTrip?.returnDistanceKm || 500} km with tea break. Safe travels home! 🙏
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '24px 16px', background: '#f8fafc', borderRadius: 10, border: '1px dashed #cbd5e1' }}>
                          <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🌴</div>
                          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.05rem', color: '#1a5c4c', marginBottom: 4 }}>Cultural Leisure & Rejuvenation</div>
                          <div style={{ color: '#6b7280', fontSize: '0.85rem', lineHeight: 1.6 }}>
                            Free day for village walks, local heritage exploration, photography, and trying regional cuisine around {d.stay?.area || d.region}.
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {d.stops.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                      {/* 🌅 Morning Departure */}
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={nodeStyle('#fef3c7', '#f59e0b')}>🌅</div>
                          <div style={connectorStyle} />
                        </div>
                        <div style={{ flex: 1, paddingTop: 5 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#92400e' }}>
                            {timeToAmPm(departureTime)} — Depart from {d.day === 1 ? (plan.meta?.startCity || plan.startCity || d.stay?.area || 'starting point') : (plan.days.find(dd => dd.day === d.day - 1)?.stay?.area || d.stay?.area || 'hotel')}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 2 }}>Start your day early for the best experience</div>
                        </div>
                      </div>

                      {/* Stops with travel segments between them */}
                      {d.stops.map((s, i) => (
                        <React.Fragment key={s.placeId + i}>
                          {/* 🚗 Travel segment BEFORE this stop */}
                          {(s.travelFromPrevKm > 0 || i === 0) && (
                            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ ...connectorStyle, minHeight: 8, borderStyle: 'dashed' }} />
                              </div>
                              <div style={{ flex: 1, padding: '4px 0' }}>
                                <div style={travelSegmentStyle}>
                                  <Car size={14} stroke="#94a3b8" />
                                  <span>
                                    {s.travelFromPrevKm > 0
                                      ? `${s.travelFromPrevKm} km · ${s.travelFromPrevMin >= 60 ? `${Math.floor(s.travelFromPrevMin/60)}h ${s.travelFromPrevMin%60}m` : `${s.travelFromPrevMin} min`} drive`
                                      : i === 0 ? 'Short drive to first stop' : 'Nearby'}
                                  </span>
                                  <span style={{ color: '#94a3b8' }}>→ Arrive {timeToAmPm(s.startTime)}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 📍 Stop node */}
                          <div
                            style={{ display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer' }}
                            onClick={() => setFocusPlace(s.placeId)}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={nodeStyle('#1a5c4c', '#1a5c4c')}>
                                <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem' }}>{i + 1}</span>
                              </div>
                              {(i < d.stops.length - 1 || true) && <div style={connectorStyle} />}
                            </div>

                            <div style={{ flex: 1, paddingBottom: 12, background: '#fafafa', borderRadius: 10, padding: '14px 18px', border: '1px solid #f0f0ee' }}>
                              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                {(s.image || allPlaces.find(p => p.id === s.placeId)?.image) && (
                                  <img
                                    src={s.image || allPlaces.find(p => p.id === s.placeId)?.image}
                                    alt={s.name}
                                    referrerPolicy="no-referrer"
                                    loading="lazy"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                    style={{
                                      width: 80,
                                      height: 80,
                                      borderRadius: 8,
                                      objectFit: 'cover',
                                      flexShrink: 0,
                                      border: '1px solid #e5e7eb',
                                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                                    }}
                                  />
                                )}
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                                    <div>
                                      <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#1c1c1c' }}>
                                        {s.name}
                                        {s.nameKannada && <span style={{ fontSize: '0.8rem', color: '#7a7a7a', marginLeft: 6, fontWeight: 400 }}>({s.nameKannada})</span>}
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: '0.82rem' }}>
                                        <span style={{ background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                                          {timeToAmPm(s.startTime)} – {timeToAmPm(s.endTime)}
                                        </span>
                                        <span style={{ color: '#6b7280' }}>
                                          ~{Math.round((new Date('2000-01-01T' + s.endTime).getTime() - new Date('2000-01-01T' + s.startTime).getTime()) / 60000)} min visit
                                        </span>
                                        <span style={{ fontWeight: 500, color: s.entryFee === 0 ? '#16a34a' : '#b45309' }}>
                                          {s.entryFee === 0 ? '🎫 Free' : `🎫 ₹${s.entryFee}`}
                                        </span>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <button onClick={(e) => { e.stopPropagation(); handleVoiceNarration(s); }}
                                        className="btn btn-outline btn-xs" style={{ padding: '3px 6px' }} title="Voice guide">
                                        {speakingStopId === s.placeId ? <VolumeX size={12} color="#c0392b" /> : <Volume2 size={12} />}
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); handleRescueStop(s.placeId, d.day); }}
                                        disabled={rescuingId === s.placeId} className="btn btn-outline btn-xs"
                                        style={{ color: '#d97706', borderColor: '#fde68a', padding: '3px 6px' }} title="Swap for nearby alternative">
                                        <LifeBuoy size={12} className={rescuingId === s.placeId ? 'animate-spin' : ''} /> Rescue
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); removeStop(s.placeId, d.day); }}
                                        className="btn btn-ghost btn-xs" style={{ color: '#c0392b', padding: '3px 6px' }} title="Remove stop">
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>

                                  <div style={{ fontSize: '0.88rem', color: '#374151', marginTop: 8, lineHeight: 1.55 }}>
                                    {s.description}
                                  </div>

                                  {s.tip && (
                                    <div style={{ fontSize: '0.82rem', color: '#1a5c4c', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontStyle: 'italic' }}>
                                      <Lightbulb size={13} style={{ flexShrink: 0 }} />
                                      <span>Traveler Tip: {s.tip}</span>
                                    </div>
                                  )}

                                  {s.food?.length > 0 && (
                                    <div style={{ fontSize: '0.82rem', color: '#92400e', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <Utensils size={13} style={{ flexShrink: 0 }} />
                                      <span>Local specialties: {s.food.join(', ')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 🍽️ Lunch break after this stop */}
                          {i === lunchInsertAfter && i < d.stops.length - 1 && (
                            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={connectorStyle} />
                                <div style={nodeStyle('#fff7ed', '#f97316')}>🍽️</div>
                                <div style={connectorStyle} />
                              </div>
                              <div style={{ flex: 1, paddingTop: 16 }}>
                                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 14px' }}>
                                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#9a3412' }}>
                                    Lunch Break · {timeToAmPm(addMin(s.endTime, 15))} – {timeToAmPm(addMin(s.endTime, 60))}
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: 2 }}>
                                    Enjoy local Karnataka cuisine near {s.name}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      ))}

                      {/* 🏨 Evening Hotel Check-in / Return Journey */}
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={connectorStyle} />
                          <div style={nodeStyle(isLastDay ? '#fef2f2' : '#f0fdf4', isLastDay ? '#ef4444' : '#16a34a')}>
                            {isLastDay ? '🏁' : '🏨'}
                          </div>
                        </div>
                        <div style={{ flex: 1, paddingTop: 16 }}>
                          <div style={{
                            background: isLastDay ? '#fef2f2' : '#f0fdf4',
                            border: `1px solid ${isLastDay ? '#fecaca' : '#bbf7d0'}`,
                            borderRadius: 8, padding: '10px 14px'
                          }}>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: isLastDay ? '#991b1b' : '#166534' }}>
                              {isLastDay
                                ? `${lastStop ? timeToAmPm(addMin(lastStop.endTime, (lastStop.travelFromPrevKm || 30))) : 'Evening'} — Return journey to ${plan.meta?.startCity || plan.startCity || 'home'}`
                                : `${lastStop ? timeToAmPm(addMin(lastStop.endTime, 30)) : 'Evening'} — Check in at ${d.stay?.area || 'hotel'}`
                              }
                            </div>
                            <div style={{ fontSize: '0.78rem', color: isLastDay ? '#b91c1c' : '#15803d', marginTop: 2 }}>
                              {isLastDay
                                ? 'End of your Karnataka adventure! Safe travels home 🙏'
                                : `Rest and recharge for Day ${d.day + 1}'s exploration`
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Day cost summary */}
                  <div style={{ borderTop: '1px solid #f0f0ee', paddingTop: 14, marginTop: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ fontSize: '0.85rem', color: '#5a5a5a', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Hotel size={14} style={{ color: '#1a5c4c' }} />
                      <span>Overnight Hub: <strong>{d.stay.area}</strong> {d.stay.costINR > 0 && `(est. ₹${d.stay.costINR.toLocaleString('en-IN')}/night)`}</span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#374151', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Car size={13} stroke="#5a5a5a" /> Transport: ₹{(d.dayCost?.transport || 0).toLocaleString('en-IN')}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Utensils size={13} stroke="#5a5a5a" /> Meals: ₹{(d.dayCost?.food || 0).toLocaleString('en-IN')}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Ticket size={13} stroke="#5a5a5a" /> Tickets: ₹{(d.dayCost?.entry || 0).toLocaleString('en-IN')}
                      </span>
                      {d.dayCost?.stay > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Hotel size={13} stroke="#5a5a5a" /> Stay: ₹{d.dayCost.stay.toLocaleString('en-IN')}
                        </span>
                      )}
                      <span style={{ fontWeight: 600, color: '#1a5c4c', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Day Total: ₹{(d.dayCost?.total || (d.dayCost?.transport || 0) + (d.dayCost?.food || 0) + (d.dayCost?.entry || 0) + (d.dayCost?.stay || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Right: Map + Budget + Carbon + Chat */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>
              <ItineraryMapView plan={plan} selectedDay={selectedDay} focusPlace={focusPlace} />
              <BudgetPanel plan={plan} />

              {/* Eco-Friendly Carbon Footprint Card */}
              <div className="card" style={{ padding: 18, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.92rem', color: '#1c1c1c' }}>
                    <Leaf size={15} style={{ color: '#1a7a4c' }} />
                    <span>Eco Travel &amp; Carbon Footprint</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, background: '#e8f5f0', color: '#1a5c4c', padding: '2px 8px', borderRadius: 4 }}>
                    {plan.meta?.travelMode || 'Taxi'}
                  </span>
                </div>

                <div style={{ fontSize: '0.84rem', color: '#374151', marginBottom: 8 }}>
                  Estimated Trip Emissions: <strong>{plan.meta?.carbonEstimateKg || 36} kg CO₂e</strong>
                </div>

                <div style={{ height: 6, background: '#f0f0ee', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${plan.ecoScore}/100` ? `${plan.ecoScore}%` : '75%',
                      background: plan.ecoScore > 70 ? '#1a7a4c' : plan.ecoScore > 40 ? '#d97706' : '#c0392b',
                      borderRadius: 3,
                      transition: 'width 0.8s ease'
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.76rem', color: '#5a5a5a', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Route Efficiency: {plan.ecoScore}/100</span>
                  <span>Total Distance: {plan.meta?.totalDistanceKm} km</span>
                </div>
              </div>

              {plan.warnings?.length > 0 && (
                <div style={{ background: '#fef8ee', borderRadius: 8, padding: 16, border: '1px solid #f0dfc0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#7a5a20', marginBottom: 8, fontSize: '0.88rem' }}>
                    <AlertTriangle size={15} />
                    <span>Travel Advisories &amp; Considerations</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: '#7a5a20', fontSize: '0.82rem', lineHeight: 1.6 }}>
                    {plan.warnings.map((w, i) => <li key={i} style={{ marginBottom: 4 }}>{w}</li>)}
                  </ul>
                </div>
              )}

              <ChatBox plan={plan} setPlan={setPlan} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
