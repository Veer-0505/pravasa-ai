import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents, ZoomControl, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../AppContext';
import { CROWD_LEVEL_MAP } from '../i18n';
import {
  Navigation,
  Layers,
  Sparkles,
  Building,
  Landmark,
  Compass,
  Eye,
  ShieldCheck,
  MapPin,
  RefreshCw,
  Search,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

// Fix Leaflet default marker icon resolution in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DAY_COLORS = ['#1a5c4c', '#c8702a', '#2563eb', '#c0392b', '#7c3aed', '#059669', '#d97706'];

export const CATEGORY_MARKER_CONFIG = {
  district: { color: '#312e81', bg: '#e0e7ff', symbol: '🏛️', label: 'District' },
  taluk: { color: '#0f766e', bg: '#ccfbf1', symbol: '🏢', label: 'Taluk' },
  village: { color: '#475569', bg: '#f1f5f9', symbol: '🏡', label: 'Village' },
  temple: { color: '#d97706', bg: '#fef3c7', symbol: '🛕', label: 'Temple' },
  spiritual: { color: '#d97706', bg: '#fef3c7', symbol: '🛕', label: 'Spiritual' },
  waterfall: { color: '#0284c7', bg: '#e0f2fe', symbol: '🌊', label: 'Waterfall' },
  beach: { color: '#0369a1', bg: '#e0f2fe', symbol: '🏖️', label: 'Beach' },
  nature: { color: '#15803d', bg: '#dcfce7', symbol: '🌿', label: 'Nature' },
  wildlife: { color: '#166534', bg: '#dcfce7', symbol: '🐘', label: 'Wildlife' },
  fort: { color: '#b91c1c', bg: '#fee2e2', symbol: '🏰', label: 'Fort' },
  heritage: { color: '#1a5c4c', bg: '#e8f5f0', symbol: '🏛️', label: 'Heritage' },
  viewpoint: { color: '#6b21a8', bg: '#f3e8ff', symbol: '⛰️', label: 'Viewpoint' },
  hills: { color: '#6b21a8', bg: '#f3e8ff', symbol: '⛰️', label: 'Hills' },
  lake: { color: '#0891b2', bg: '#cffafe', symbol: '💧', label: 'Lake' },
  park: { color: '#65a30d', bg: '#ecfccb', symbol: '🌳', label: 'Park' },
  food: { color: '#ea580c', bg: '#ffedd5', symbol: '🍛', label: 'Food' },
  hidden: { color: '#7c3aed', bg: '#ede9fe', symbol: '✨', label: 'Hidden Gem' }
};

export function createPlaceMarkerIcon(type, crowdLevel, isSelected, isOffbeat = false) {
  const cfg = isOffbeat ? CATEGORY_MARKER_CONFIG.hidden : (CATEGORY_MARKER_CONFIG[type] || CATEGORY_MARKER_CONFIG.heritage);
  const isDistrict = type === 'district';
  const size = isSelected ? 34 : (isDistrict ? 28 : 24);

  const border = isSelected ? '3px solid #1c1c1c' : '2px solid #ffffff';
  const shadow = isSelected ? '0 4px 14px rgba(0,0,0,0.45)' : '0 2px 6px rgba(0,0,0,0.22)';
  const transform = isSelected ? 'scale(1.15)' : 'scale(1)';

  return L.divIcon({
    html: `<div style="background:${cfg.color};color:#ffffff;width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${size > 28 ? 14 : 11}px;border:${border};box-shadow:${shadow};cursor:pointer;transform:${transform};transition:transform 0.15s ease;">${cfg.symbol}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    className: 'custom-spatial-marker',
  });
}

function MapViewportTracker({ onBoundsChange, onUserMove }) {
  const map = useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      onBoundsChange({
        west: b.getWest(),
        south: b.getSouth(),
        east: b.getEast(),
        north: b.getNorth(),
        zoom: map.getZoom()
      });
      onUserMove?.();
    }
  });

  useEffect(() => {
    const b = map.getBounds();
    onBoundsChange({
      west: b.getWest(),
      south: b.getSouth(),
      east: b.getEast(),
      north: b.getNorth(),
      zoom: map.getZoom()
    });
  }, [map, onBoundsChange]);

  return null;
}

function AutoFit({ stops }) {
  const map = useMap();
  useEffect(() => {
    if (stops?.length > 0) {
      const bounds = L.latLngBounds(stops.map(s => [s.lat || s.latitude, s.lng || s.longitude]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      }
    }
  }, [stops, map]);
  return null;
}

function FlyToMarker({ focus }) {
  const map = useMap();
  useEffect(() => {
    if (focus && (focus.lat || focus.latitude)) {
      const lat = focus.lat || focus.latitude;
      const lng = focus.lng || focus.longitude;
      map.flyTo([lat, lng], Math.max(map.getZoom(), 11), { duration: 1.2 });
    }
  }, [focus, map]);
  return null;
}

function LocateMeControl({ onLocationAcquired }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const locate = () => {
    setLocating(true);
    map.locate({ setView: true, maxZoom: 13, enableHighAccuracy: true });
    map.once('locationfound', (e) => {
      setLocating(false);
      onLocationAcquired?.(e.latlng);
    });
    map.once('locationerror', (err) => {
      setLocating(false);
      alert('Could not determine your location. Please check your browser location permissions.');
    });
  };

  return (
    <div style={{ position: 'absolute', bottom: 100, right: 12, zIndex: 900 }}>
      <button
        onClick={locate}
        style={{
          background: '#ffffff',
          border: '1px solid #e2e2e0',
          borderRadius: 6,
          width: 38,
          height: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          color: locating ? '#1a5c4c' : '#374151',
          transition: 'all 0.15s ease'
        }}
        title="Find my current location"
        aria-label="Find my location"
      >
        <Navigation size={18} className={locating ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}

// TourismMap Component
export default function TourismMap({
  initialPlaces = [],
  highlightPlace = null,
  selectedPlaceId = null,
  onSelectPlace,
  userLocation = null,
  onUserLocationChange,
  activeCategories = [],
  onSearchThisArea,
  searchVisibleTrigger = false
}) {
  const [markers, setMarkers] = useState([]);
  const [currentBounds, setCurrentBounds] = useState(null);
  const [hasMovedMap, setHasMovedMap] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);

  // Handle bounds change
  const handleBoundsChange = useCallback((bounds) => {
    setCurrentBounds(bounds);
  }, []);

  const handleUserMove = useCallback(() => {
    setHasMovedMap(true);
  }, []);

  // Fetch markers when bounds or activeCategories change
  const queryViewportMarkers = useCallback(async () => {
    if (!currentBounds) return;
    try {
      const qs = new URLSearchParams({
        west: currentBounds.west.toFixed(4),
        south: currentBounds.south.toFixed(4),
        east: currentBounds.east.toFixed(4),
        north: currentBounds.north.toFixed(4),
        zoom: currentBounds.zoom.toString(),
        limit: '1500'
      });

      if (activeCategories && activeCategories.length > 0 && !activeCategories.includes('all')) {
        qs.set('types', activeCategories.join(','));
      }

      const res = await fetch(`/api/map/markers?${qs.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.items) {
          setMarkers(data.items);
          setHasMovedMap(false);
        }
      }
    } catch (e) {
      console.error('Failed to query map markers for bounds', e);
    }
  }, [currentBounds, activeCategories]);

  // Initial markers load
  useEffect(() => {
    if (initialPlaces && initialPlaces.length > 0 && markers.length === 0) {
      setMarkers(initialPlaces);
    }
  }, [initialPlaces, markers.length]);

  // Trigger search this area when requested externally
  useEffect(() => {
    if (searchVisibleTrigger) {
      queryViewportMarkers();
    }
  }, [searchVisibleTrigger, queryViewportMarkers]);

  // Voice narration helper
  const handleVoiceNarration = (place) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (speakingId === place.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const text = `${place.name}. Located in ${place.district || 'Karnataka'}. ${place.description || ''}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(place.id);
    window.speechSynthesis.speak(utterance);
  };

  // Determine markers to display
  const displayMarkers = useMemo(() => {
    let list = markers.length > 0 ? markers : initialPlaces;

    // Filter by active category tags if provided
    if (activeCategories && activeCategories.length > 0 && !activeCategories.includes('all')) {
      list = list.filter(m => {
        const pType = (m.place_type || '').toLowerCase();
        const pCats = (m.category || []).map(c => c.toLowerCase());
        return activeCategories.some(ac => ac.toLowerCase() === pType || pCats.includes(ac.toLowerCase()));
      });
    }

    return list;
  }, [markers, initialPlaces, activeCategories]);

  const handleMarkerClick = async (m) => {
    if (!m?.id) return;
    try {
      const res = await fetch(`/api/places/${encodeURIComponent(String(m.id))}`);
      if (!res.ok) throw new Error('Place details unavailable');
      const placeRecord = await res.json();
      onSelectPlace?.(placeRecord);
    } catch {
      onSelectPlace?.(m);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={[14.8, 75.8]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© OpenStreetMap contributors'
          maxZoom={19}
        />
        <ZoomControl position="bottomright" />
        <MapViewportTracker onBoundsChange={handleBoundsChange} onUserMove={handleUserMove} />

        {/* Display all matching place markers */}
        {displayMarkers.map(m => {
          const lat = m.lat || m.latitude;
          const lng = m.lng || m.longitude;
          if (!lat || !lng) return null;

          const isSelected = selectedPlaceId === m.id || highlightPlace?.id === m.id;
          const icon = createPlaceMarkerIcon(m.place_type, m.crowdLevel, isSelected, m.offbeat);

          return (
            <Marker
              key={m.id}
              position={[lat, lng]}
              icon={icon}
              eventHandlers={{
                click: () => handleMarkerClick(m)
              }}
            >
              <Popup>
                <div style={{ minWidth: 200, padding: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: '0.7rem', color: '#1a5c4c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {m.place_type} {m.district ? `· ${m.district}` : ''}
                    </span>
                    {m.offbeat && (
                      <span style={{ fontSize: '0.65rem', background: '#ede9fe', color: '#7c3aed', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>
                        Hidden Gem
                      </span>
                    )}
                  </div>

                  <strong style={{ fontSize: '0.95rem', color: '#1c1c1c', display: 'block', margin: '2px 0' }}>
                    {m.name}
                  </strong>
                  {m.nameKannada && (
                    <div style={{ fontSize: '0.82rem', color: '#5a5a5a', marginBottom: 6 }}>{m.nameKannada}</div>
                  )}

                  {m.distanceKm !== undefined && (
                    <div style={{ fontSize: '0.75rem', color: '#1a5c4c', fontWeight: 600, marginBottom: 6 }}>
                      Distance: {m.distanceKm} km
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button
                      onClick={() => handleMarkerClick(m)}
                      className="btn btn-primary btn-xs"
                      style={{ flex: 1, justifyContent: 'center', fontSize: '0.74rem' }}
                    >
                      View Details
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVoiceNarration(m);
                      }}
                      className="btn btn-outline btn-xs"
                      style={{ padding: '3px 8px' }}
                      title="Audio voice guide"
                    >
                      {speakingId === m.id ? <VolumeX size={12} color="#c0392b" /> : <Volume2 size={12} />}
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* User live position pin */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              html: `<div style="background:#2563eb;width:16px;height:16px;border-radius:50%;border:3px solid #ffffff;box-shadow:0 0 0 6px rgba(37,99,235,0.3);"></div>`,
              iconSize: [16, 16],
              className: 'user-location-pulse'
            })}
          >
            <Popup>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Your Current Location</div>
            </Popup>
          </Marker>
        )}

        {/* Selected place highlight radius */}
        {highlightPlace && (highlightPlace.lat || highlightPlace.latitude) && (
          <Circle
            center={[highlightPlace.lat || highlightPlace.latitude, highlightPlace.lng || highlightPlace.longitude]}
            radius={6000}
            color="#1a5c4c"
            fillOpacity={0.10}
          />
        )}

        <FlyToMarker focus={highlightPlace} />
        <LocateMeControl
          onLocationAcquired={(loc) => {
            onUserLocationChange?.(loc);
          }}
        />

        {/* Attribution & Record Count */}
        <div style={{ position: 'absolute', bottom: 6, left: 6, zIndex: 500, fontSize: '0.68rem', color: '#5a5a5a', background: 'rgba(255,255,255,0.92)', padding: '3px 10px', borderRadius: 4, border: '1px solid #e2e2e0' }}>
          Karnataka Spatial Directory: <strong>{displayMarkers.length}</strong> verified markers · Data: Survey of India &amp; LGD
        </div>
      </MapContainer>

      {/* Floating "Search this area" button (Google Maps style) */}
      {hasMovedMap && (
        <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
          <button
            onClick={() => {
              queryViewportMarkers();
              onSearchThisArea?.();
            }}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e2e0',
              borderRadius: 20,
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#1a5c4c',
              transition: 'transform 0.15s ease'
            }}
            className="hover:scale-105"
          >
            <RefreshCw size={14} /> Search this area
          </button>
        </div>
      )}
    </div>
  );
}

// Side-panel Itinerary Map View for PlanTrip page
export function ItineraryMapView({ plan, selectedDay, focusPlace }) {
  const isAll = selectedDay === 'all';
  const day = !isAll ? plan?.days?.find(d => d.day === selectedDay) : null;
  const stops = isAll ? (plan?.days?.flatMap(d => d.stops) || []) : (day?.stops || []);
  const allStops = plan?.days?.flatMap(d => d.stops) || [];

  return (
    <div className="card" style={{ height: 420, overflow: 'hidden', position: 'relative', borderRadius: 12, border: '1px solid #d1d5db' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', padding: '4px 10px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700, color: '#1a5c4c', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
        {isAll ? `🗺️ Full Journey Route (${allStops.length} stops · ${plan?.days?.length || 0} days)` : `🗺️ Day ${selectedDay} Route (${stops.length} stops)`}
      </div>
      <MapContainer center={[14.5, 75.8]} zoom={7} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
        <ZoomControl position="bottomright" />
        
        {/* Polylines for each day */}
        {plan?.days?.map((d, di) => {
          if (!d.stops || d.stops.length < 2) return null;
          const shouldShow = isAll || d.day === selectedDay;
          if (!shouldShow) return null;
          return (
            <Polyline
              key={d.day}
              positions={d.stops.map(s => [s.lat || s.latitude, s.lng || s.longitude])}
              color={DAY_COLORS[di % DAY_COLORS.length]}
              weight={isAll ? 3 : 4}
              opacity={0.85}
              dashArray={di > 0 && !isAll ? '8,4' : undefined}
            />
          );
        })}

        {/* Markers for stops */}
        {plan?.days?.map((d, di) => {
          const shouldShow = isAll || d.day === selectedDay;
          if (!shouldShow) return null;
          const dayColor = DAY_COLORS[di % DAY_COLORS.length];

          return d.stops.map((s, i) => (
            <Marker
              key={`${d.day}-${s.placeId || i}`}
              position={[s.lat || s.latitude, s.lng || s.longitude]}
              icon={L.divIcon({
                html: `<div style="background:${dayColor};color:white;width:30px;height:30px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:800;font-size:10px;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);line-height:1.1;">
                  <span>${isAll ? `D${d.day}` : `${i + 1}`}</span>
                </div>`,
                iconSize: [30, 30]
              })}
            >
              <Popup>
                <div style={{ minWidth: 150 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: dayColor, textTransform: 'uppercase', marginBottom: 2 }}>
                    Day {d.day} · Stop #{i + 1}
                  </div>
                  <strong style={{ fontSize: '0.88rem', color: '#111827' }}>{s.name}</strong>
                  {s.nameKannada && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{s.nameKannada}</div>}
                  <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: 4, fontWeight: 600 }}>🕒 {s.startTime} – {s.endTime}</div>
                  <div style={{ fontSize: '0.76rem', color: '#374151', marginTop: 2 }}>
                    🎫 Entry: {Number(s.entryFee) === 0 ? 'Free' : `₹${s.entryFee}`}
                  </div>
                </div>
              </Popup>
            </Marker>
          ));
        })}

        {focusPlace && <FlyToMarker focus={stops.find(s => s.placeId === focusPlace) || allStops.find(s => s.placeId === focusPlace)} />}
        <AutoFit stops={stops.length > 0 ? stops : allStops} />
      </MapContainer>
    </div>
  );
}
