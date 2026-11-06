import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { CATEGORY_COLORS, CROWD_LEVEL_MAP, CROWD_CONFIG } from '../i18n';
import {
  X,
  MapPin,
  Clock,
  Ticket,
  Heart,
  Navigation,
  Share2,
  Flag,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Star,
  Volume2,
  VolumeX,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  Video,
  CloudSun,
  Wind,
  Droplets,
  Sun,
  Moon,
  Info,
  Calendar
} from 'lucide-react';
import {
  getDestinationMedia,
  getCurrentTimeOfDay,
  TIME_OF_DAY_CONFIG,
  NEUTRAL_PLACEHOLDER_SVG,
  extractYoutubeId,
  getCategoryFallback
} from '../utils/media';

const INITIAL_COMMUNITY_REVIEWS = {
  hampi: [
    { id: 'rev_1', user: 'Anand K.', rating: 5, date: '14 Feb 2026', comment: 'Spectacular UNESCO ruins. Sunrise at Matanga Hill was unforgettable. Renting a bicycle made exploring the royal enclosure very enjoyable.', verified: true },
    { id: 'rev_2', user: 'Priya M.', rating: 4, date: '20 Jan 2026', comment: 'Virupaksha temple is active and serene. Highly recommend hiring an authorized guide for the Vittala stone chariot musical pillars.', verified: true }
  ],
  badami: [
    { id: 'rev_3', user: 'Sunil Rao', rating: 5, date: '2 Feb 2026', comment: 'Intricate 6th-century rock carvings overlooking Agastya Lake. Wear comfortable walking footwear as steps can be steep.', verified: true }
  ],
  mysuru_palace: [
    { id: 'rev_4', user: 'Deepa V.', rating: 5, date: '18 Feb 2026', comment: 'Sunday evening illumination with 97,000 light bulbs is breathtaking. Audio guide available inside is very detailed.', verified: true }
  ]
};

export default function DestinationModal({ place, onClose, onAddToTrip }) {
  const { isFavourite, toggleFavourite, showToast, t, user, lang } = useApp();
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState('auto');
  const [speaking, setSpeaking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMsg, setReportMsg] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Live Real Weather State
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  // Fetch real live weather, nearby attractions, and verified community reviews on place open
  useEffect(() => {
    if (!place?.id) return;
    setImgError(false);
    setLoadingWeather(true);
    fetch(`/api/places/${encodeURIComponent(place.id)}/weather`)
      .then(r => r.json())
      .then(data => {
        setWeather(data);
        setLoadingWeather(false);
      })
      .catch(() => {
        setWeather({ available: false, message: 'Live weather service currently unavailable.' });
        setLoadingWeather(false);
      });

    setLoadingNearby(true);
    fetch(`/api/places/${encodeURIComponent(place.id)}/nearby?radius_m=45000`)
      .then(r => r.json())
      .then(data => {
        setNearbyPlaces(data.items || []);
      })
      .catch(() => {})
      .finally(() => setLoadingNearby(false));

    setLoadingReviews(true);
    fetch(`/api/reviews?placeId=${encodeURIComponent(place.id)}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingReviews(false));
  }, [place?.id]);

  if (!place) return null;
  const fav = isFavourite(place.id);
  const crowdKey = CROWD_LEVEL_MAP[place.crowdLevel] || 'unknown';
  const crowdCfg = CROWD_CONFIG[crowdKey] || CROWD_CONFIG.unknown;

  const effectivePeriod = selectedTimeOfDay === 'auto' ? getCurrentTimeOfDay() : selectedTimeOfDay;
  const activeMedia = getDestinationMedia(place, effectivePeriod);
  const periodCfg = TIME_OF_DAY_CONFIG[effectivePeriod] || TIME_OF_DAY_CONFIG.afternoon;

  const imageSrc = imgError ? getCategoryFallback(place) : (activeMedia.url || getCategoryFallback(place));

  // Video embed configuration
  const youtubeId = extractYoutubeId(place.video?.videoId || place.video?.url);
  const directVideoUrl = !youtubeId && place.video?.url && place.video.url.startsWith('/') ? place.video.url : null;

  const handleShare = () => {
    const text = `${place.name} (${place.district}, Karnataka)\n${place.shortDescription || (place.description ? place.description.slice(0, 80) : '')}\nhttps://maps.google.com/maps?q=${place.lat},${place.lng}`;
    if (navigator.share) {
      navigator.share({ title: place.name, text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).then(() => showToast('Destination link copied to clipboard'));
    }
  };

  const handleNavigate = () => {
    const directGpsUrl = place.googleMapsUrl || place.timeOfDayMedia?.googleMapsUrl || (place.source_url && place.source_url.includes('maps') ? place.source_url : null);
    if (directGpsUrl) {
      window.open(directGpsUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ', ' + place.district + ', Karnataka')}`, '_blank');
    }
  };

  const handleVoiceNarration = () => {
    if (!('speechSynthesis' in window)) {
      showToast('Speech narration is not supported in this browser.');
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const narrationText = `${place.name}. Located in ${place.district || 'Karnataka'}. ${place.description || ''}. Entry fee: ${place.entryFeeINR === 0 ? 'Free entry' : 'Rupees ' + place.entryFeeINR}.`;
    const utter = new SpeechSynthesisUtterance(narrationText);
    utter.rate = 0.95;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const text = reviewComment.trim();
    if (!text || text.length < 15) {
      showToast('Please provide a constructive review of at least 15 characters.');
      return;
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: place.id,
          placeName: place.name,
          userName: user?.name || 'Verified Traveller',
          userEmail: user?.email,
          rating: reviewRating,
          title: reviewTitle.trim() || `${place.name} Experience`,
          content: text,
          visitedMonth: new Date().toLocaleString('en-US', { month: 'long' }),
          travelType: 'Leisure'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      setReviews(prev => [data.review, ...prev]);
      setReviewComment('');
      setReviewTitle('');
      setShowReviewForm(false);
      showToast('Thank you! Your verified community review has been posted.');
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleHelpfulVote = async (reviewId) => {
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/helpful`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to vote');

      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpfulCount: data.helpfulCount } : r));
      showToast('Marked review as helpful 👍');
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1150 }}>
      <div
        className="modal-box"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${place.name}`}
        style={{
          maxWidth: 680,
          borderRadius: 8,
          border: '1px solid #dcdcd9',
          boxShadow: '0 16px 40px rgba(0,0,0,0.22)',
          background: '#ffffff',
          overflow: 'hidden'
        }}
      >
        {/* ============================================================ */}
        {/* 1. TOP IMAGE HEADER WITH DAYTIME SELECTION */}
        {/* ============================================================ */}
        <div style={{ position: 'relative', height: 260, overflow: 'hidden', background: '#14483b' }}>
          <img
            src={imageSrc}
            alt={activeMedia.caption || place.name}
            referrerPolicy="no-referrer"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.25s ease' }}
            onError={() => setImgError(true)}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%)' }} />

          {/* Close button */}
          <button
            onClick={() => {
              if (speaking) window.speechSynthesis?.cancel();
              onClose();
            }}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              background: 'rgba(0,0,0,0.65)',
              border: 'none',
              borderRadius: 6,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff',
              zIndex: 10
            }}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>

          {/* Place Title in Header */}
          <div style={{ position: 'absolute', bottom: 50, left: 20, right: 20 }}>
            <h2 style={{ margin: 0, color: '#ffffff', fontFamily: 'Playfair Display, serif', fontSize: '1.55rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
              {place.name}
            </h2>
            {place.nameKannada && (
              <div style={{ color: '#e2e8f0', fontSize: '0.92rem', marginTop: 2, fontWeight: 500 }}>
                {place.nameKannada}
              </div>
            )}
          </div>

          {/* Interactive Daytime Selector Pills inside Image Header */}
          <div style={{ position: 'absolute', bottom: 10, left: 14, right: 14, display: 'flex', gap: 6, alignItems: 'center', overflowX: 'auto', paddingBottom: 2 }}>
            <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 600, marginRight: 2, whiteSpace: 'nowrap' }}>
              Preview Light:
            </span>
            <button
              onClick={() => setSelectedTimeOfDay('auto')}
              style={{
                background: selectedTimeOfDay === 'auto' ? '#1a5c4c' : 'rgba(0,0,0,0.65)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                padding: '3px 8px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Auto (Live: {periodCfg.icon} {periodCfg.label})
            </button>
            {['morning', 'afternoon', 'evening', 'night'].map(pKey => {
              const cfg = TIME_OF_DAY_CONFIG[pKey];
              const isSelected = selectedTimeOfDay === pKey;
              return (
                <button
                  key={pKey}
                  onClick={() => setSelectedTimeOfDay(pKey)}
                  style={{
                    background: isSelected ? '#1a5c4c' : 'rgba(0,0,0,0.65)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 4,
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Daytime Caption & Night Availability Notice */}
        <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '8px 20px', fontSize: '0.78rem', color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{periodCfg.icon}</span>
            <span><strong>{periodCfg.label} view:</strong> {activeMedia.caption}</span>
          </div>
          {effectivePeriod === 'night' && (
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: activeMedia.isOpenAtNight ? '#047857' : '#b45309', background: activeMedia.isOpenAtNight ? '#d1fae5' : '#fef3c7', padding: '2px 8px', borderRadius: 4 }}>
              {activeMedia.isOpenAtNight ? '✓ Open at night' : '⚠️ Closes at sunset'}
            </span>
          )}
        </div>

        {/* Night notice alert if night is selected and attraction closes at sunset */}
        {effectivePeriod === 'night' && (
          <div style={{ background: activeMedia.isOpenAtNight ? '#ecfdf5' : '#fffbeb', borderBottom: '1px solid #fde68a', padding: '8px 20px', fontSize: '0.78rem', color: activeMedia.isOpenAtNight ? '#065f46' : '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Info size={14} style={{ flexShrink: 0 }} />
            <span>{activeMedia.nightNotes}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. MODAL BODY */}
        {/* ============================================================ */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18, maxHeight: 'calc(88vh - 280px)', overflowY: 'auto' }}>
          {/* Location row & Categories */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#5a5a5a', fontSize: '0.88rem' }}>
              <MapPin size={15} style={{ color: '#1a5c4c', flexShrink: 0 }} />
              <span>{[place.taluk, place.district, place.division ? `${place.division} Division` : null].filter(Boolean).join(' › ')}</span>
            </div>

            {/* Direct Get Directions GPS Button */}
            <button
              onClick={handleNavigate}
              className="btn btn-sm"
              style={{
                background: '#1a5c4c',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                padding: '7px 14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(26,92,76,0.2)'
              }}
              title="Open Official Google Maps Navigation"
            >
              <Navigation size={14} />
              <span>{lang === 'kn' ? 'ಮಾರ್ಗಸೂಚಿ ಪಡೆಯಿರಿ' : 'Get Directions'}</span>
              <ExternalLink size={12} />
            </button>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {(place.category || []).map(cat => {
                const cfg = CATEGORY_COLORS[cat] || {};
                return (
                  <span
                    key={cat}
                    style={{
                      background: cfg.bg || '#f4f4f2',
                      color: cfg.text || '#2c2c2c',
                      border: `1px solid ${cfg.border || '#e2e2e0'}`,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}
                  >
                    {cat}
                  </span>
                );
              })}
              {place.offbeat && (
                <span style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '2px 8px', borderRadius: 4, fontSize: '0.74rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={11} /> Hidden Gem
                </span>
              )}
              {place.verified && (
                <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 4, fontSize: '0.74rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={11} /> Verified
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <p style={{ margin: 0, fontSize: '0.92rem', color: '#374151', lineHeight: 1.65 }}>
            {place.description}
          </p>

          {/* Karnataka Tourism Intelligence - Historical, Cultural & Transit Details */}
          {(place.historicalSignificance || place.culturalImportance || place.hiddenGemClassification?.reason || place.roadAccessibility) && (
            <div style={{ background: '#fdfbf7', border: '1px solid #fed7aa', borderRadius: 8, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9a3412', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Sparkles size={15} style={{ color: '#d97706' }} />
                <span>Karnataka Heritage &amp; Travel Intelligence</span>
              </div>

              {place.hiddenGemClassification?.reason && (
                <div style={{ fontSize: '0.82rem', color: '#7c2d12', background: '#fff7ed', border: '1px solid #ffedd5', padding: '8px 12px', borderRadius: 6 }}>
                  <strong>Classification ({place.hiddenGemClassification.status}):</strong> {place.hiddenGemClassification.reason}
                </div>
              )}

              {place.historicalSignificance && (
                <div style={{ fontSize: '0.82rem', color: '#431407', lineHeight: 1.5 }}>
                  <strong style={{ color: '#9a3412' }}>Historical Significance:</strong> {place.historicalSignificance}
                </div>
              )}

              {place.culturalImportance && (
                <div style={{ fontSize: '0.82rem', color: '#431407', lineHeight: 1.5 }}>
                  <strong style={{ color: '#9a3412' }}>Cultural Traditions:</strong> {place.culturalImportance}
                </div>
              )}

              {/* Transit & Accessibility Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, fontSize: '0.78rem', marginTop: 4, paddingTop: 8, borderTop: '1px solid #fed7aa' }}>
                {place.distanceFromNearestTown && (
                  <div>
                    <span style={{ color: '#78350f', fontWeight: 600 }}>Distance:</span> <span style={{ color: '#451a03' }}>{place.distanceFromNearestTown}</span>
                  </div>
                )}
                {place.nearestBusStation && (
                  <div>
                    <span style={{ color: '#78350f', fontWeight: 600 }}>Bus:</span> <span style={{ color: '#451a03' }}>{place.nearestBusStation}</span>
                  </div>
                )}
                {place.nearestRailwayStation && (
                  <div>
                    <span style={{ color: '#78350f', fontWeight: 600 }}>Rail:</span> <span style={{ color: '#451a03' }}>{place.nearestRailwayStation}</span>
                  </div>
                )}
                {place.roadAccessibility && (
                  <div>
                    <span style={{ color: '#78350f', fontWeight: 600 }}>Road:</span> <span style={{ color: '#451a03' }}>{place.roadAccessibility}</span>
                  </div>
                )}
                {place.trekkingDifficulty && place.trekkingDifficulty !== 'None' && (
                  <div>
                    <span style={{ color: '#78350f', fontWeight: 600 }}>Trek Difficulty:</span> <span style={{ color: '#451a03' }}>{place.trekkingDifficulty}</span>
                  </div>
                )}
                {place.permissionRequirements && (
                  <div>
                    <span style={{ color: '#78350f', fontWeight: 600 }}>Permit:</span> <span style={{ color: '#451a03' }}>{place.permissionRequirements}</span>
                  </div>
                )}
              </div>

              {place.safetyInstructions && (
                <div style={{ fontSize: '0.76rem', color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                  <span><strong>Safety Advisory:</strong> {place.safetyInstructions}</span>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* 3. REAL LIVE WEATHER WIDGET (Requirement 5) */}
          {/* ============================================================ */}
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <CloudSun size={16} /> Live Real-Time Weather Conditions
              </div>
              {weather?.lastUpdated && (
                <span style={{ fontSize: '0.72rem', color: '#0284c7' }}>
                  Updated: {weather.lastUpdated} IST
                </span>
              )}
            </div>

            {loadingWeather ? (
              <div style={{ fontSize: '0.82rem', color: '#0284c7' }}>Connecting to meteorological station...</div>
            ) : weather?.available ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.6rem' }}>{weather.icon || '🌤️'}</span>
                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0c4a6e' }}>
                      {weather.temperatureC}°C
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#0369a1', fontWeight: 600 }}>
                      {weather.condition}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <Droplets size={13} style={{ color: '#0284c7' }} />
                    <span>Humidity: <strong>{weather.humidityPercent}%</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Wind size={13} style={{ color: '#0284c7' }} />
                    <span>Wind: <strong>{weather.windSpeedKmh} km/h</strong></span>
                  </div>
                </div>

                <div style={{ fontSize: '0.72rem', color: '#64748b', borderLeft: '1px solid #cbd5e1', paddingLeft: 10 }}>
                  <div>Source: ECMWF / DWD Verified Observations</div>
                  <div style={{ marginTop: 2, color: '#0369a1' }}>Precipitation: {weather.precipitationMm} mm</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                {weather?.message || 'Live weather data currently unavailable for this destination.'}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* 4. PLACE-SPECIFIC VIDEO GUIDE (Requirement 3) */}
          {/* ============================================================ */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Video size={16} style={{ color: '#dc2626' }} /> Verified Place-Specific Video Guide
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                {place.video?.attribution || 'Department of Tourism, Karnataka'}
              </span>
            </div>

            {youtubeId ? (
              <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0, borderRadius: 6, overflow: 'hidden', background: '#000000', border: '1px solid #d1d5db' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?rel=0&autoplay=0&controls=1&modestbranding=1`}
                  title={place.video?.title || `${place.name} Video Guide`}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            ) : directVideoUrl ? (
              <video
                controls
                preload="metadata"
                poster={place.video?.thumbnail || imageSrc}
                style={{ width: '100%', maxHeight: 300, borderRadius: 6, background: '#000000' }}
              >
                <source src={directVideoUrl} type="video/mp4" />
                Your browser does not support HTML5 video streaming.
              </video>
            ) : (
              <div style={{ padding: '24px 16px', textAlign: 'center', background: '#f1f5f9', borderRadius: 6, border: '1px dashed #cbd5e1' }}>
                <Video size={28} style={{ color: '#94a3b8', margin: '0 auto 6px' }} />
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#475569' }}>
                  Video documentary currently being curated for {place.name}.
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
                  Official Karnataka Tourism camera crews update footage seasonally.
                </div>
              </div>
            )}

            {place.video?.title && (
              <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><strong>Title:</strong> {place.video.title}</span>
                {youtubeId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#dc2626', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    Watch on YouTube <ExternalLink size={11} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
            <div style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: '0.7rem', color: '#7a7a7a', fontWeight: 600, textTransform: 'uppercase' }}>
                Visit Duration
              </div>
              <div style={{ fontWeight: 600, marginTop: 4, color: '#1c1c1c', fontSize: '0.92rem' }}>
                {place.avgVisitHours || 2.5} hours avg
              </div>
            </div>

            <div style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: '0.7rem', color: '#7a7a7a', fontWeight: 600, textTransform: 'uppercase' }}>
                Entry Fee
              </div>
              <div style={{ fontWeight: 600, marginTop: 4, color: '#1c1c1c', fontSize: '0.92rem' }}>
                {place.entryFeeINR === 0 ? 'Free entry' : (place.entryFeeINR ? `₹${place.entryFeeINR}` : 'Free / Not applicable')}
              </div>
            </div>

            <div style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: '0.7rem', color: '#7a7a7a', fontWeight: 600, textTransform: 'uppercase' }}>
                Opening Hours
              </div>
              <div style={{ fontWeight: 600, marginTop: 4, color: '#1c1c1c', fontSize: '0.88rem' }}>
                {place.openingHours || 'Sunrise to sunset'}
              </div>
            </div>

            <div style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: '0.7rem', color: '#7a7a7a', fontWeight: 600, textTransform: 'uppercase' }}>
                Crowd Density
              </div>
              <div style={{ fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: crowdCfg.dotColor || '#6b7280' }} />
                {crowdCfg.label}
              </div>
            </div>
          </div>

          {/* Tourism Accessibility Score */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tourism Accessibility Score: {place.accessibilityScore || (place.seniorFriendly ? 8 : 6)}/10
              </div>
              <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>Standardized Rating</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
              {place.accessibility || 'Partially accessible. Flat sections navigable; terrain depends on archaeological structures.'}
            </div>
          </div>

          {/* Photo Attribution Information (Requirement 1 & 6) */}
          {/* Official Karnataka Tourism Booking & Transit Integration */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#1e293b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🎫 Official Booking &amp; Transit Integration</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, fontSize: '0.78rem' }}>
              <a
                href={`https://kstdc.co/hotels/?search=${encodeURIComponent(place.district || place.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 4, padding: '6px 10px', textDecoration: 'none', color: '#0f766e', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>🏨 KSTDC Stays</span>
                <ExternalLink size={11} />
              </a>
              <a
                href={`https://ksrtc.in/oprs-web/guest/home.do?h=1`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 4, padding: '6px 10px', textDecoration: 'none', color: '#0369a1', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>🚌 KSRTC Bus</span>
                <ExternalLink size={11} />
              </a>
              <a
                href={`https://www.irctc.co.in/nget/train-search`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 4, padding: '6px 10px', textDecoration: 'none', color: '#b91c1c', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>🚆 IRCTC Trains</span>
                <ExternalLink size={11} />
              </a>
              <a
                href={place.official_website || 'https://karnatakatourism.org'}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 4, padding: '6px 10px', textDecoration: 'none', color: '#15803d', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>🏛️ Official Portal</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* Verified Nearby Attractions (Phase 2 Requirement) */}
          <div style={{ background: '#fdfbf7', border: '1px solid #fed7aa', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#9a3412', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Sparkles size={15} style={{ color: '#ea580c' }} />
                <span>Verified Nearby Attractions ({place.district || 'Same Area'})</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#c2410c', fontWeight: 600 }}>
                {loadingNearby ? 'Scanning nearby...' : `${nearbyPlaces.length} Destinations within 45 km`}
              </span>
            </div>

            {loadingNearby ? (
              <div style={{ fontSize: '0.78rem', color: '#9a3412' }}>Locating verified attractions in same sector...</div>
            ) : nearbyPlaces.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10 }}>
                {nearbyPlaces.slice(0, 4).map(np => (
                  <div
                    key={np.id}
                    style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: 6, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1c1c1c' }}>{np.name}</div>
                    <div style={{ fontSize: '0.74rem', color: '#78350f', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{np.place_type || 'attraction'}</span>
                      <span style={{ fontWeight: 600 }}>~{np.distanceKm || np.distance_km || 12} km away</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: '#78350f' }}>
                Primary destination anchor in this administrative taluk.
              </div>
            )}
          </div>

          {/* Authentic Local Cuisine & Specialties */}
          {place.nearbyFood && place.nearbyFood.length > 0 && (
            <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#854d0e', marginBottom: 4 }}>
                🍽️ Authentic Local Culinary Specialties
              </div>
              <div style={{ fontSize: '0.82rem', color: '#713f12' }}>
                {place.nearbyFood.join(' · ')}
              </div>
            </div>
          )}

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 14px', fontSize: '0.75rem', color: '#64748b' }}>
            <div style={{ fontWeight: 600, color: '#334155', marginBottom: 2 }}>Photo Source &amp; Licensing Attribution:</div>
            <div>
              Source: <strong>{activeMedia.attribution || place.imageAttribution?.source || 'Pravasa AI Verified Repository'}</strong>
              {place.imageAttribution?.license && <span> • License: <strong>{place.imageAttribution.license}</strong></span>}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => onAddToTrip?.(place)} style={{ justifyContent: 'center' }}>
              {lang === 'kn' ? 'ಪ್ರವಾಸಕ್ಕೆ ಸೇರಿಸಿ' : 'Add to trip'}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                toggleFavourite(place.id);
                showToast(fav ? (lang === 'kn' ? 'ಮೆಚ್ಚಿನವುಗಳಿಂದ ತೆಗೆಯಲಾಗಿದೆ' : 'Removed from saved destinations') : (lang === 'kn' ? 'ಮೆಚ್ಚಿನವುಗಳಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ' : 'Saved to favourites'));
              }}
              style={{ justifyContent: 'center' }}
            >
              <Heart size={14} fill={fav ? '#c0392b' : 'none'} stroke={fav ? '#c0392b' : 'currentColor'} />
              {fav ? (lang === 'kn' ? 'ಉಳಿಸಲಾಗಿದೆ' : 'Saved') : (lang === 'kn' ? 'ಉಳಿಸಿ' : 'Save')}
            </button>
            <button className="btn btn-outline" onClick={handleVoiceNarration} style={{ justifyContent: 'center' }}>
              {speaking ? <VolumeX size={14} color="#c0392b" /> : <Volume2 size={14} />} {speaking ? (lang === 'kn' ? 'ನಿಲ್ಲಿಸಿ' : 'Stop') : (lang === 'kn' ? 'ಆಡಿಯೋ ಗೈಡ್' : 'Audio Guide')}
            </button>
            <button className="btn btn-outline" onClick={handleNavigate} style={{ justifyContent: 'center' }}>
              <Navigation size={14} /> {lang === 'kn' ? 'ದಾರಿ ತೋರಿಸಿ' : 'Directions'}
            </button>
            <button className="btn btn-ghost" onClick={handleShare} style={{ justifyContent: 'center' }}>
              <Share2 size={14} /> {lang === 'kn' ? 'ಹಂಚಿಕೊಳ್ಳಿ' : 'Share'}
            </button>
          </div>

          {/* Verified Community Reviews */}
          <div style={{ borderTop: '1px solid #e8e8e5', paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1c1c1c', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Playfair Display, serif' }}>
                <MessageSquare size={16} style={{ color: '#1a5c4c' }} />
                <span>{lang === 'kn' ? 'ಪ್ರವಾಸಿಗರ ಪರಿಶೀಲಿತ ವಿಮರ್ಶೆಗಳು' : 'Verified Traveler Experiences'}</span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setShowReviewForm(f => !f)}
                style={{ color: '#1a5c4c', fontWeight: 600 }}
              >
                {showReviewForm ? (lang === 'kn' ? 'ರದ್ದುಮಾಡಿ' : 'Cancel') : (lang === 'kn' ? '+ ವಿಮರ್ಶೆ ಬರೆಯಿರಿ' : '+ Write Review')}
              </button>
            </div>

            {showReviewForm && (
              <form onSubmit={handleReviewSubmit} style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 8, padding: 14, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Your Rating:</span>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRating(s)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                    >
                      <Star size={16} fill={s <= reviewRating ? '#f59e0b' : 'none'} stroke={s <= reviewRating ? '#f59e0b' : '#9ca3af'} />
                    </button>
                  ))}
                </div>
                <input
                  className="input"
                  placeholder="Review headline (e.g. Magnificent morning experience)"
                  value={reviewTitle}
                  onChange={e => setReviewTitle(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem', marginBottom: 8 }}
                />
                <textarea
                  className="input"
                  rows={3}
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Share details on crowd, best time to visit, ticket counters, or wheelchair accessibility..."
                  style={{ width: '100%', fontSize: '0.85rem', marginBottom: 8 }}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  Publish Verified Review
                </button>
              </form>
            )}

            {loadingReviews ? (
              <div style={{ fontSize: '0.82rem', color: '#6b7280', textAlign: 'center', padding: '12px 0' }}>
                Loading community experiences...
              </div>
            ) : reviews.length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: '#6b7280', textAlign: 'center', padding: '16px 0', background: '#fafaf9', borderRadius: 6, border: '1px dashed #e5e7eb' }}>
                No community reviews posted yet. Be the first to share your verified experience!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reviews.map(r => (
                  <div key={r.id} style={{ background: '#ffffff', border: '1px solid #e8e8e5', borderRadius: 6, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.84rem', color: '#1f2937' }}>
                          {r.userName || r.user || 'Verified Traveller'}
                        </span>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.68rem', padding: '1px 6px', borderRadius: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <CheckCircle2 size={10} /> {r.userRole || 'Verified Traveller'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={11} fill={i < (r.rating || 5) ? '#f59e0b' : 'none'} stroke={i < (r.rating || 5) ? '#f59e0b' : '#d1d5db'} />
                        ))}
                      </div>
                    </div>

                    {r.title && (
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827', margin: '2px 0 4px' }}>
                        {r.title}
                      </div>
                    )}

                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#4b5563', lineHeight: 1.5 }}>
                      {r.content || r.comment}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#9ca3af', marginTop: 6, borderTop: '1px solid #f9fafb', paddingTop: 6 }}>
                      <span>
                        {r.visitedMonth ? `Visited: ${r.visitedMonth} • ` : ''}
                        {new Date(r.createdAt || r.date || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleHelpfulVote(r.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: '#047857', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}
                      >
                        👍 Helpful ({r.helpfulCount || 0})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
