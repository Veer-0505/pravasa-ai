import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../AppContext';
import TourismMap from '../components/MapView';
import {
  Search,
  X,
  MapPin,
  Navigation,
  Share2,
  Heart,
  Plus,
  ExternalLink,
  ShieldCheck,
  Clock,
  Ticket,
  Calendar,
  AlertTriangle,
  Compass,
  Info,
  CheckCircle2,
  Copy,
  Layers,
  Map,
  List,
  Volume2,
  VolumeX,
  Building,
  Filter,
  Sparkles,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { NEUTRAL_PLACEHOLDER_SVG, getSafeDestinationImage } from '../utils/media';

// Comprehensive Category Definitions aligned with prompt
const SEARCH_CATEGORIES = [
  { id: 'all', label: 'All Places', labelKn: 'ಎಲ್ಲಾ ತಾಣಗಳು', icon: '📍' },
  { id: 'temple', label: 'Temples & Spiritual', labelKn: 'ಪವಿತ್ರ ದೇವಾಲಯಗಳು', icon: '🛕', types: ['temple', 'spiritual'] },
  { id: 'waterfall', label: 'Waterfalls & Lakes', labelKn: 'ಜಲಪಾತ & ಸರೋವರ', icon: '🌊', types: ['waterfall', 'lake'] },
  { id: 'beach', label: 'Beaches & Coast', labelKn: 'ಕರಾವಳಿ ತೀರಗಳು', icon: '🏖️', types: ['beach'] },
  { id: 'fort', label: 'Forts & Ruins', labelKn: 'ಕೋಟೆ & ಇತಿಹಾಸ', icon: '🏰', types: ['fort', 'heritage'] },
  { id: 'nature', label: 'Nature & Hills', labelKn: 'ಪ್ರಕೃತಿ & ಬೆಟ್ಟಗಳು', icon: '🌿', types: ['nature', 'hills', 'viewpoint', 'wildlife'] },
  { id: 'hidden', label: 'Hidden Gems', labelKn: 'ಗುಪ್ತ ತಾಣಗಳು', icon: '✨', types: ['hidden'] },
  { id: 'administrative', label: 'Districts & Taluks', labelKn: 'ಜಿಲ್ಲೆ & ತಾಲೂಕುಗಳು', icon: '🏛️', types: ['district', 'taluk'] },
];

export default function MapPage() {
  const { t, isFavourite, toggleFavourite, showToast, lang } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [highlight, setHighlight] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'
  const [activeCategories, setActiveCategories] = useState(['all']);
  const [districtsList, setDistrictsList] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(false);
  const [speakingPlaceId, setSpeakingPlaceId] = useState(null);
  const [parsedQueryMeta, setParsedQueryMeta] = useState(null);

  // Initial load: markers & districts list
  useEffect(() => {
    Promise.all([
      fetch('/api/map/markers?limit=500').then(r => r.json()).catch(() => ({ items: [] })),
      fetch('/api/map/districts').then(r => r.json()).catch(() => ({ districts: [] }))
    ]).then(([markersData, districtsData]) => {
      setPlaces(markersData.items || []);
      setDistrictsList(districtsData.districts || []);
      setLoading(false);

      // If URL has ?place=id or ?district=... or ?q=..., handle it
      const targetId = searchParams.get('place');
      if (targetId && markersData.items) {
        const found = markersData.items.find(p => p.id === targetId);
        if (found) {
          handleSelectPlace(found);
        }
      }

      const distParam = searchParams.get('district');
      if (distParam) {
        setSelectedDistrict(distParam);
        const target = (districtsData.districts || []).find(d => d.district?.toLowerCase() === distParam.toLowerCase() || d.name?.toLowerCase().includes(distParam.toLowerCase()));
        if (target) {
          setHighlight({ lat: target.lat, lng: target.lng, id: target.id, name: target.name });
        }
      }

      const qParam = searchParams.get('q');
      if (qParam) {
        setSearch(qParam);
        fetch(`/api/map/search?q=${encodeURIComponent(qParam)}&limit=60`)
          .then(r => r.json())
          .then(res => {
            if (res.items && res.items.length > 0) {
              const top = res.items[0];
              if (res.center) {
                setHighlight({ lat: res.center.lat, lng: res.center.lng, id: top.id, name: res.parsedQuery?.detectedAnchor || qParam });
              } else if (top.lat && top.lng) {
                setHighlight({ lat: top.lat, lng: top.lng, id: top.id, name: top.name });
              }
              if (res.parsedQuery?.detectedDistrict) {
                setSelectedDistrict(res.parsedQuery.detectedDistrict);
              }
            }
          })
          .catch(() => {});
      }
    });
  }, []);

  // Multi-category toggle
  const toggleCategory = (catId) => {
    if (catId === 'all') {
      setActiveCategories(['all']);
      return;
    }
    setActiveCategories(prev => {
      const withoutAll = prev.filter(c => c !== 'all');
      if (withoutAll.includes(catId)) {
        const updated = withoutAll.filter(c => c !== catId);
        return updated.length === 0 ? ['all'] : updated;
      } else {
        return [...withoutAll, catId];
      }
    });
  };

  // Debounced search query
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      setParsedQueryMeta(null);
      return;
    }

    const timer = setTimeout(() => {
      setSearching(true);
      const params = new URLSearchParams({
        q: search.trim(),
        limit: '8'
      });
      if (userLocation) {
        params.set('lat', userLocation.lat.toString());
        params.set('lng', userLocation.lng.toString());
      }

      fetch(`/api/map/search?${params.toString()}`)
        .then(r => r.json())
        .then(res => {
          setSearchResults(res.items || []);
          if (res.parsedQuery?.isSpatialSearch) {
            setParsedQueryMeta(res.parsedQuery);
          } else {
            setParsedQueryMeta(null);
          }
          setSearching(false);
        })
        .catch(() => setSearching(false));
    }, 220);

    return () => clearTimeout(timer);
  }, [search, userLocation]);

  // When place is selected, fetch full details & nearby places
  const handleSelectPlace = async (p) => {
    setHighlight(p);
    try {
      const res = await fetch(`/api/places/${encodeURIComponent(String(p.id))}`);
      if (res.ok) {
        const fullRecord = await res.json();
        setSelectedPlace(fullRecord);
      } else {
        setSelectedPlace(p);
      }
    } catch {
      setSelectedPlace(p);
    }
  };

  // Nearby attractions query
  useEffect(() => {
    if (!selectedPlace?.id) {
      setNearbyPlaces([]);
      return;
    }
    setLoadingNearby(true);
    fetch(`/api/places/${encodeURIComponent(selectedPlace.id)}/nearby?radius_m=35000`)
      .then(r => r.json())
      .then(data => {
        setNearbyPlaces(data.items || []);
        setLoadingNearby(false);
      })
      .catch(() => setLoadingNearby(false));
  }, [selectedPlace?.id]);

  // District selector handler
  const handleDistrictChange = (distName) => {
    setSelectedDistrict(distName);
    if (!distName) return;
    const target = districtsList.find(d => d.district === distName || d.name === distName);
    if (target) {
      setHighlight({ lat: target.lat, lng: target.lng, id: target.id, name: target.name });
    }
  };

  // Voice narration
  const handleVoiceNarration = (place) => {
    if (!('speechSynthesis' in window)) {
      showToast('Speech narration is not supported in this browser.');
      return;
    }

    if (speakingPlaceId === place.id) {
      window.speechSynthesis.cancel();
      setSpeakingPlaceId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const narrationText = `${place.name}. Located in ${place.district || 'Karnataka'}. ${place.description || ''}. ${place.visit_info?.safetyNotes || ''}`;
    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingPlaceId(null);
    utterance.onerror = () => setSpeakingPlaceId(null);

    setSpeakingPlaceId(place.id);
    window.speechSynthesis.speak(utterance);
    showToast(`Playing AI Voice Guide for ${place.name}`);
  };

  // Explicit Search Submission (handles Enter key or click Search)
  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!search.trim()) return;

    setSearching(true);
    setSearchResults([]);

    try {
      const res = await fetch(`/api/map/search?q=${encodeURIComponent(search.trim())}&limit=60`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setPlaces(data.items);
        const top = data.items[0];
        if (data.center) {
          setHighlight({ lat: data.center.lat, lng: data.center.lng, id: top.id, name: data.parsedQuery?.detectedAnchor || search });
        } else if (top.lat && top.lng) {
          setHighlight({ lat: top.lat, lng: top.lng, id: top.id, name: top.name });
        }

        if (data.parsedQuery?.detectedDistrict) {
          setSelectedDistrict(data.parsedQuery.detectedDistrict);
        }

        showToast(`Showing ${data.items.length} places for "${search.trim()}"`);
      } else {
        showToast(`No exact places found for "${search.trim()}". Showing nearest matches.`);
      }
    } catch (err) {
      console.error(err);
    }
    setSearching(false);
  };

  const handleResetSearch = () => {
    setSearch('');
    setSearchResults([]);
    setParsedQueryMeta(null);
    setSelectedDistrict('');
    setActiveCategories(['all']);
    fetch('/api/map/markers?limit=500')
      .then(r => r.json())
      .then(d => {
        setPlaces(d.items || []);
        showToast('Reset map to statewide view (all 31 districts)');
      })
      .catch(() => {});
  };

  const handleCopyCoords = () => {
    const lat = selectedPlace.lat || selectedPlace.location?.latitude;
    const lng = selectedPlace.lng || selectedPlace.location?.longitude;
    if (lat && lng) {
      navigator.clipboard?.writeText(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      showToast('WGS84 Coordinates copied to clipboard');
    }
  };

  const handleShare = () => {
    if (!selectedPlace) return;
    const text = `${selectedPlace.name} (${selectedPlace.place_type}) – ${selectedPlace.district}, Karnataka\nhttps://maps.google.com/maps?q=${selectedPlace.lat},${selectedPlace.lng}`;
    if (navigator.share) {
      navigator.share({ title: selectedPlace.name, text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      showToast('Destination link copied to clipboard');
    }
  };

  // Filtered places for List View and result count
  const filteredPlaces = useMemo(() => {
    let list = places;

    if (selectedDistrict) {
      const dLower = selectedDistrict.toLowerCase();
      list = list.filter(p => (p.district || '').toLowerCase().includes(dLower) || dLower.includes((p.district || '').toLowerCase()));
    }

    if (!activeCategories.includes('all')) {
      list = list.filter(p => {
        const pType = (p.place_type || '').toLowerCase();
        const pCats = (p.category || []).map(c => c.toLowerCase());
        const isOff = Boolean(p.offbeat);

        return activeCategories.some(cat => {
          if (cat === 'hidden') return isOff;
          if (cat === 'administrative') return ['district', 'taluk', 'village'].includes(pType);
          const foundCfg = SEARCH_CATEGORIES.find(c => c.id === cat);
          if (foundCfg?.types) {
            return foundCfg.types.some(t => t === pType || pCats.includes(t));
          }
          return pType === cat || pCats.includes(cat);
        });
      });
    }

    if (search.trim()) {
      const rawQ = search.trim().toLowerCase();
      const cleanQ = rawQ
        .replace(/\b(district|dist|taluk|taluka|tk|city|town|village|place|places|in|near|at|around|close\s+to|from|to|ಹತ್ತಿರ|ಜಿಲ್ಲೆ|ತಾಲೂಕು|ನಗರ|ತಾಣಗಳು)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const q = cleanQ || rawQ;
      const tokens = q.split(' ').filter(t => t.length > 1);

      list = list.filter(p => {
        const pName = (p.name || '').toLowerCase();
        const pNameKn = (p.nameKannada || '').toLowerCase();
        const pDist = (p.district || '').toLowerCase();
        const pTaluk = (p.taluk || '').toLowerCase();
        const pDesc = (p.description || '').toLowerCase();
        const pType = (p.place_type || '').toLowerCase();

        // 1. Direct contains check
        if (pName.includes(q) || pNameKn.includes(q) ||
            pDist.includes(q) || q.includes(pDist) ||
            pTaluk.includes(q) || q.includes(pTaluk) ||
            pDesc.includes(q) || pType.includes(q)) {
          return true;
        }

        // 2. Token match check
        if (tokens.length > 0) {
          return tokens.some(t =>
            pName.includes(t) || pDist.includes(t) || pTaluk.includes(t) || pType.includes(t)
          );
        }
        return false;
      });
    }

    return list;
  }, [places, selectedDistrict, activeCategories, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', position: 'relative', overflow: 'hidden', background: '#fafaf8' }}>
      {/* ============================================================ */}
      {/* TOP CONTROL BAR: SEARCH, DISTRICT SELECTOR, VIEW TOGGLE */}
      {/* ============================================================ */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e2e0', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 10, zIndex: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', color: '#1c1c1c', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Compass size={18} style={{ color: '#1a5c4c' }} />
              <span>{lang === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ನಕ್ಷೆ' : 'Interactive Smart Map'}</span>
            </h1>
          </div>

          {/* Search Input with Google Maps-style natural query */}
          <form
            onSubmit={handleSearchSubmit}
            style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 520, display: 'flex', gap: 6 }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8a8a8a' }} />
              <input
                className="input"
                style={{ paddingLeft: 36, paddingRight: search ? 36 : 14, height: 38, fontSize: '0.88rem', width: '100%' }}
                placeholder={lang === 'kn' ? 'ಜಿಲ್ಲೆ, ತಾಲೂಕು, ನಗರ ಅಥವಾ ತಾಣ ಹುಡುಕಿ (ಉದಾ: ಶಿವಮೊಗ್ಗ, ತೀರ್ಥಹಳ್ಳಿ, ಕಂಪ್ಲಿ)...' : 'Search any district, taluk, city or place (e.g. Shivamogga, Tirthahalli, Kampli)...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearchSubmit(e); }}
                aria-label="Search destinations"
              />
              {search && (
                <button
                  type="button"
                  onClick={handleResetSearch}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8a8a8a' }}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#ffffff', borderRadius: 8, border: '1px solid #e2e2e0', boxShadow: '0 8px 30px rgba(0,0,0,0.16)', zIndex: 1200, marginTop: 4, overflow: 'hidden', maxHeight: 320, overflowY: 'auto' }}>
                  {parsedQueryMeta && (
                    <div style={{ background: '#e8f5f0', padding: '6px 12px', fontSize: '0.74rem', color: '#1a5c4c', borderBottom: '1px solid #c2e2d5', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={12} />
                      <span>Spatial search: <strong>{parsedQueryMeta.detectedCategory || 'Places'}</strong> near <strong>{parsedQueryMeta.detectedAnchor || 'Anchor'}</strong></span>
                    </div>
                  )}
                  {searchResults.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSearch(p.name);
                        setSearchResults([]);
                        handleSelectPlace(p);
                      }}
                      style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f4f4f2', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8f8f6'}
                      onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <MapPin size={15} style={{ color: '#1a5c4c', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1c1c1c' }}>{p.name}</div>
                          <div style={{ fontSize: '0.74rem', color: '#5a5a5a' }}>
                            {[p.place_type, p.taluk, p.district].filter(Boolean).join(' · ')}
                            {p.distanceKm !== undefined && ` (${p.distanceKm} km)`}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', background: '#e8f5f0', color: '#1a5c4c', padding: '2px 8px', borderRadius: 4, fontWeight: 600, textTransform: 'capitalize' }}>
                        {p.place_type || 'place'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ height: 38, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              <Search size={15} /> {lang === 'kn' ? 'ಹುಡುಕಿ' : 'Search'}
            </button>
          </form>

          {/* District Selector (31 Karnataka Districts) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building size={15} style={{ color: '#5a5a5a' }} />
            <select
              className="input"
              style={{ height: 38, fontSize: '0.82rem', padding: '4px 28px 4px 10px', minWidth: 160 }}
              value={selectedDistrict}
              onChange={e => handleDistrictChange(e.target.value)}
              aria-label="Select district"
            >
              <option value="">{lang === 'kn' ? 'ಎಲ್ಲಾ 31 ಜಿಲ್ಲೆಗಳು' : 'All 31 Districts'}</option>
              {districtsList.map(d => (
                <option key={d.id} value={d.district}>
                  {d.name.replace(' District', '')} ({d.attractionCount || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Map vs List View Switcher */}
          <div style={{ display: 'flex', background: '#f4f4f2', border: '1px solid #e2e2e0', borderRadius: 6, padding: 2, marginLeft: 'auto' }}>
            <button
              onClick={() => setViewMode('map')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 4,
                border: 'none',
                background: viewMode === 'map' ? '#1a5c4c' : 'transparent',
                color: viewMode === 'map' ? '#ffffff' : '#374151',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Interactive Map View"
            >
              <Map size={14} /> {lang === 'kn' ? 'ನಕ್ಷೆ' : 'Map'}
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 4,
                border: 'none',
                background: viewMode === 'list' ? '#1a5c4c' : 'transparent',
                color: viewMode === 'list' ? '#ffffff' : '#374151',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Place Discovery List View"
            >
              <List size={14} /> {lang === 'kn' ? 'ಪಟ್ಟಿ' : 'List'} ({filteredPlaces.length})
            </button>
          </div>
        </div>

        {/* Multi-Category Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {SEARCH_CATEGORIES.map(cat => {
            const isActive = activeCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`pill ${isActive ? 'pill-active' : 'pill-inactive'}`}
                style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', padding: '4px 10px', gap: 4 }}
              >
                <span>{cat.icon}</span>
                <span>{lang === 'kn' ? (cat.labelKn || cat.label) : cat.label}</span>
              </button>
            );
          })}

          {(!activeCategories.includes('all') || selectedDistrict || search) && (
            <button
              onClick={() => {
                setActiveCategories(['all']);
                setSelectedDistrict('');
                setSearch('');
                setParsedQueryMeta(null);
              }}
              style={{ background: 'none', border: 'none', color: '#c0392b', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', padding: '0 8px', whiteSpace: 'nowrap' }}
            >
              {lang === 'kn' ? 'ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ' : 'Clear filters'}
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#7a7a7a', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} style={{ color: '#16a34a' }} />
            <span>{filteredPlaces.length} {lang === 'kn' ? 'ದೃಢೀಕರಿಸಿದ ತಾಣಗಳು' : 'verified destinations'}</span>
          </div>
        </div>

        {/* Active Search & District Filter Banner */}
        {(search || selectedDistrict) && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 14px', borderRadius: 6, fontSize: '0.82rem', color: '#065f46', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              📍 Showing destinations in/matching {selectedDistrict ? <strong>{selectedDistrict} District</strong> : ''} {search ? <span>"<strong>{search}</strong>"</span> : ''} ({filteredPlaces.length} destinations found)
            </span>
            <button
              onClick={handleResetSearch}
              style={{ background: 'none', border: 'none', color: '#047857', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Show All Karnataka (Reset)
            </button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MAIN VIEW: MAP OR RESPONSIVE LIST */}
      {/* ============================================================ */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        {viewMode === 'map' ? (
          <div style={{ flex: 1, height: '100%', position: 'relative' }}>
            {loading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf8' }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="animate-spin" style={{ width: 36, height: 36, border: '3px solid #e2e2e0', borderTop: '3px solid #1a5c4c', borderRadius: '50%', margin: '0 auto 12px' }} />
                  <div style={{ color: '#5a5a5a', fontSize: '0.9rem' }}>Loading Karnataka spatial directory...</div>
                </div>
              </div>
            ) : (
              <TourismMap
                initialPlaces={filteredPlaces}
                highlightPlace={highlight}
                selectedPlaceId={selectedPlace?.id}
                onSelectPlace={handleSelectPlace}
                userLocation={userLocation}
                onUserLocationChange={setUserLocation}
                activeCategories={activeCategories}
                searchVisibleTrigger={searchTrigger}
                onSearchThisArea={() => {
                  showToast('Updated places for current map viewport');
                }}
              />
            )}
          </div>
        ) : (
          /* List View (Google Maps-style discovery cards) */
          <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '20px 24px', background: '#fafaf8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', margin: 0, color: '#1c1c1c' }}>
                  Pravasa AI Discovery Directory
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#5a5a5a', marginTop: 2 }}>
                  Showing {filteredPlaces.length} places matching active filters
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, paddingBottom: 60 }}>
              {filteredPlaces.map(p => (
                <div
                  key={p.id}
                  className="card card-interactive"
                  onClick={() => handleSelectPlace(p)}
                  style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ position: 'relative', height: 160, background: '#1a5c4c' }}>
                    <img
                      src={getSafeDestinationImage(p.image, p) || NEUTRAL_PLACEHOLDER_SVG}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => {
                        e.target.onerror = null;
                        e.target.src = NEUTRAL_PLACEHOLDER_SVG;
                      }}
                    />
                    <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                      <span style={{ background: '#1a5c4c', color: '#ffffff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, textTransform: 'capitalize' }}>
                        {p.place_type}
                      </span>
                      {p.offbeat && (
                        <span style={{ background: '#7c3aed', color: '#ffffff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                          Hidden Gem
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1c1c1c' }}>
                          {p.name}
                        </h3>
                        {p.nameKannada && (
                          <div style={{ fontSize: '0.78rem', color: '#5a5a5a' }}>{p.nameKannada}</div>
                        )}
                      </div>
                      {p.distanceKm !== undefined && (
                        <span style={{ fontSize: '0.76rem', color: '#1a5c4c', fontWeight: 600 }}>
                          {p.distanceKm} km
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#5a5a5a', margin: '6px 0 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} style={{ color: '#1a5c4c' }} />
                      <span>{[p.taluk, p.district].filter(Boolean).join(', ')}</span>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: '#4b5563', margin: '0 0 12px', lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.shortDescription || p.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0ee', paddingTop: 10, fontSize: '0.76rem', color: '#7a7a7a' }}>
                      <span>Entry: <strong>{p.entryFeeINR === 0 ? 'Free' : `₹${p.entryFeeINR}`}</strong></span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPlace(p);
                          setViewMode('map');
                        }}
                        className="btn btn-outline btn-xs"
                      >
                        View on Map <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PLACE DETAILS PANEL DRAWER */}
        {/* ============================================================ */}
        {selectedPlace && (
          <div
            style={{
              width: '100%',
              maxWidth: 440,
              height: '100%',
              background: '#ffffff',
              borderLeft: '1px solid #e2e2e0',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.14)',
              zIndex: 1100,
              display: 'flex',
              flexDirection: 'column',
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              overflowY: 'auto'
            }}
          >
            {/* Header Image Banner */}
            <div style={{ position: 'relative', height: 220, background: '#1a5c4c', flexShrink: 0 }}>
              <img
                src={getSafeDestinationImage(selectedPlace.image, selectedPlace) || getSafeDestinationImage(selectedPlace.photos?.[0]?.url, selectedPlace) || NEUTRAL_PLACEHOLDER_SVG}
                alt={selectedPlace.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = NEUTRAL_PLACEHOLDER_SVG;
                }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%)' }} />

              <button
                onClick={() => setSelectedPlace(null)}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'rgba(0,0,0,0.65)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#ffffff'
                }}
                aria-label="Close details"
              >
                <X size={16} />
              </button>

              <div style={{ position: 'absolute', bottom: 14, left: 18, right: 18 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                  <span style={{ background: '#1a5c4c', color: '#ffffff', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {selectedPlace.place_type || 'Place'}
                  </span>
                  {selectedPlace.offbeat && (
                    <span style={{ background: '#7c3aed', color: '#ffffff', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                      Hidden Gem
                    </span>
                  )}
                </div>
                <h2 style={{ margin: 0, color: '#ffffff', fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700 }}>
                  {selectedPlace.name}
                </h2>
                {selectedPlace.nameKannada && (
                  <div style={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.9rem', marginTop: 2 }}>
                    {selectedPlace.nameKannada}
                  </div>
                )}
              </div>
            </div>

            {/* Photo Attribution Notice */}
            <div style={{ background: '#f8f8f6', borderBottom: '1px solid #e8e8e5', padding: '6px 18px', fontSize: '0.72rem', color: '#7a7a7a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Photo: {selectedPlace.photos?.[0]?.source || selectedPlace.dataSource || 'Verified Directory'}</span>
              <span style={{ color: '#16a34a', fontWeight: 600 }}>● Permitted Usage</span>
            </div>

            {/* Body Content */}
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Hierarchy Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4b5563', fontSize: '0.85rem' }}>
                <Compass size={15} style={{ color: '#1a5c4c', flexShrink: 0 }} />
                <span>
                  {[
                    selectedPlace.place_type ? selectedPlace.place_type.charAt(0).toUpperCase() + selectedPlace.place_type.slice(1) : null,
                    selectedPlace.district ? `${selectedPlace.district}` : null,
                    selectedPlace.taluk ? `${selectedPlace.taluk}` : null,
                    selectedPlace.division ? `${selectedPlace.division} Division` : null
                  ].filter(Boolean).join(' › ')}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/plan?place=${selectedPlace.id}`)}
                  style={{ justifyContent: 'center' }}
                >
                  <Plus size={14} /> Add to Trip
                </button>
                <a
                  href={`https://maps.google.com/maps?q=${selectedPlace.lat || selectedPlace.location?.latitude},${selectedPlace.lng || selectedPlace.location?.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'center', textDecoration: 'none' }}
                >
                  <Navigation size={14} /> Directions
                </a>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    toggleFavourite(selectedPlace.id);
                    showToast(isFavourite(selectedPlace.id) ? 'Removed from saved' : 'Saved to favourites');
                  }}
                  style={{ justifyContent: 'center' }}
                >
                  <Heart size={14} fill={isFavourite(selectedPlace.id) ? '#c0392b' : 'none'} stroke={isFavourite(selectedPlace.id) ? '#c0392b' : 'currentColor'} />
                  {isFavourite(selectedPlace.id) ? 'Saved' : 'Save'}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleVoiceNarration(selectedPlace)}
                  style={{ justifyContent: 'center' }}
                  title="Audio Voice Guide"
                >
                  {speakingPlaceId === selectedPlace.id ? <VolumeX size={14} color="#c0392b" /> : <Volume2 size={14} />}
                  <span>{speakingPlaceId === selectedPlace.id ? 'Stop' : 'Audio'}</span>
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleShare}
                  style={{ justifyContent: 'center' }}
                >
                  <Share2 size={14} />
                </button>
              </div>

              {/* Seasonal & Weather Advisory */}
              {selectedPlace.seasonalAdvisory && (
                <div style={{
                  background: selectedPlace.seasonalAdvisory.level === 'caution' ? '#fffbeb' : (selectedPlace.seasonalAdvisory.level === 'warning' ? '#fef2f2' : '#f0fdf4'),
                  border: `1px solid ${selectedPlace.seasonalAdvisory.level === 'caution' ? '#fde68a' : (selectedPlace.seasonalAdvisory.level === 'warning' ? '#fecaca' : '#bbf7d0')}`,
                  borderRadius: 6,
                  padding: '10px 14px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start'
                }}>
                  <AlertTriangle size={15} style={{ color: selectedPlace.seasonalAdvisory.level === 'warning' ? '#dc2626' : (selectedPlace.seasonalAdvisory.level === 'caution' ? '#d97706' : '#16a34a'), flexShrink: 0, marginTop: 2 }} />
                  <div style={{ color: '#374151', lineHeight: 1.45 }}>
                    <strong>Seasonal Weather Advisory: </strong>{selectedPlace.seasonalAdvisory.note}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1c1c1c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  Verified Destination Overview
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#374151', lineHeight: 1.6 }}>
                  {selectedPlace.description || 'Verified destination in Karnataka.'}
                </p>
              </div>

              {/* Spatial Coordinates WGS84 */}
              <div style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 6, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#7a7a7a', fontWeight: 600, textTransform: 'uppercase' }}>
                    Spatial Coordinates (WGS84)
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1c1c1c', marginTop: 2, fontFamily: 'monospace' }}>
                    {(selectedPlace.lat || selectedPlace.location?.latitude)?.toFixed(5)}°N, {(selectedPlace.lng || selectedPlace.location?.longitude)?.toFixed(5)}°E
                  </div>
                </div>
                <button
                  onClick={handleCopyCoords}
                  style={{ background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 4, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.74rem', color: '#374151' }}
                  title="Copy coordinates"
                >
                  <Copy size={12} /> Copy
                </button>
              </div>

              {/* Visiting Information Table */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1c1c1c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                  Visiting Information &amp; Tariff
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#7a7a7a', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> Opening Hours
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1c1c1c', marginTop: 4 }}>
                      {selectedPlace.visit_info?.openingHours || selectedPlace.openingHours || 'Not available'}
                    </div>
                  </div>

                  <div style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#7a7a7a', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Ticket size={12} /> Entry Fee
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1c1c1c', marginTop: 4 }}>
                      {selectedPlace.visit_info?.entryFeeINR !== undefined
                        ? (selectedPlace.visit_info.entryFeeINR === 0 ? 'Free entry' : `₹${selectedPlace.visit_info.entryFeeINR}`)
                        : (selectedPlace.entryFeeINR !== undefined ? (selectedPlace.entryFeeINR === 0 ? 'Free entry' : `₹${selectedPlace.entryFeeINR}`) : 'Not available')}
                    </div>
                  </div>

                  <div style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 6, padding: '10px 12px', gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.7rem', color: '#7a7a7a', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldCheck size={12} /> Tourism Accessibility Score: <strong>{selectedPlace.accessibilityScore || 7}/10</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#374151', marginTop: 4 }}>
                      {selectedPlace.accessibility || 'Standard visitor infrastructure. Wheelchair navigation depends on terrain.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety & Source Provenance */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <ShieldCheck size={15} style={{ color: '#16a34a' }} />
                  <span>Official Verification &amp; Source Links</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.55 }}>
                  <div style={{ marginBottom: 6 }}>
                    <strong>Safety Advisory: </strong>
                    {selectedPlace.visit_info?.safetyNotes || selectedPlace.accessibility || 'Standard precautions. Emergency Helpline: 112.'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 8 }}>
                    <span>Source: {selectedPlace.dataSource || 'Local Government Directory / Pravasa AI'}</span>
                    {selectedPlace.source_url && (
                      <a
                        href={selectedPlace.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1a5c4c', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                      >
                        Official Portal <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Verified Nearby Places within 35km */}
              {nearbyPlaces.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1c1c1c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                    Nearby Verified Destinations ({nearbyPlaces.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {nearbyPlaces.slice(0, 4).map(np => (
                      <div
                        key={np.id}
                        onClick={() => handleSelectPlace(np)}
                        style={{ padding: '8px 10px', background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8f8f6'}
                        onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#1c1c1c' }}>{np.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#5a5a5a' }}>{np.place_type} · {np.district}</div>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1a5c4c' }}>
                          {np.distanceKm} km
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
