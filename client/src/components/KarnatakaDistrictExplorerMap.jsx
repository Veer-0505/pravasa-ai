import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../AppContext';
import { KARNATAKA_DISTRICTS } from '../data/karnatakaDistrictsSvg';
import karnatakaGeoJson from '../data/karnataka_official.json';
import { MapPin, ArrowRight, Download, Sparkles } from 'lucide-react';
import { getSafeDestinationImage, getCategoryFallback, NEUTRAL_PLACEHOLDER_SVG } from '../utils/media';

/**
 * 1:1 Official Karnataka Tourism Interactive District Map
 * Matches https://karnatakatourism.org/en/ down to exact colors, GeoJSON boundaries and styling.
 * 
 * - Base District Fill: #00473F (Official Karnataka Tourism deep emerald)
 * - Hover / Highlight Fill: #F6B918 (Official warm golden-amber)
 * - District Border: #ffffff (1px crisp white boundary)
 * - Centered hover tooltip with official white badge design
 */

const DEFAULT_STYLE = {
  fillColor: '#00473F',
  fillOpacity: 1,
  color: '#ffffff',
  weight: 1,
  opacity: 1
};

const HOVER_STYLE = {
  fillColor: '#F6B918',
  fillOpacity: 0.95,
  color: '#ffffff',
  weight: 1.5,
  opacity: 1
};

const SELECTED_STYLE = {
  fillColor: '#F6B918',
  fillOpacity: 1,
  color: '#ffffff',
  weight: 2,
  opacity: 1
};

export default function KarnatakaDistrictExplorerMap({ onSelectPlace }) {
  const { lang } = useApp();
  const navigate = useNavigate();
  const [selectedDistrictName, setSelectedDistrictName] = useState('Belagavi');
  const [hoveredDistrictName, setHoveredDistrictName] = useState(null);
  const geoJsonRef = useRef(null);

  // Map district metadata from KARNATAKA_DISTRICTS by matching name
  const districtMetadataMap = useMemo(() => {
    const map = {};
    KARNATAKA_DISTRICTS.forEach(d => {
      const key = d.name.toLowerCase().trim().replace(/[\s_-]+/g, '');
      map[key] = d;
      map[d.id.toLowerCase().trim().replace(/[\s_-]+/g, '')] = d;
    });
    return map;
  }, []);

  const getDistrictData = (name) => {
    if (!name) return KARNATAKA_DISTRICTS[0];
    const key = name.toLowerCase().trim().replace(/[\s_-]+/g, '');
    return districtMetadataMap[key] || KARNATAKA_DISTRICTS.find(d => d.name.toLowerCase().includes(name.toLowerCase())) || KARNATAKA_DISTRICTS[0];
  };

  const activeDistrict = getDistrictData(selectedDistrictName);

  // Normalize GeoJSON district name
  const getFeatureDistrictName = (feature) => {
    return feature.properties.district || feature.properties.district_en || feature.properties.name || '';
  };

  // Re-apply styles on selection or hover change
  useEffect(() => {
    if (!geoJsonRef.current) return;
    geoJsonRef.current.eachLayer(layer => {
      const name = getFeatureDistrictName(layer.feature);
      if (name === selectedDistrictName) {
        layer.setStyle(SELECTED_STYLE);
      } else if (name === hoveredDistrictName) {
        layer.setStyle(HOVER_STYLE);
      } else {
        layer.setStyle(DEFAULT_STYLE);
      }
    });
  }, [selectedDistrictName, hoveredDistrictName]);

  const onEachFeature = (feature, layer) => {
    const rawName = getFeatureDistrictName(feature);
    const meta = getDistrictData(rawName);
    const displayName = lang === 'kn' && (feature.properties.district_kn || meta.nameKannada)
      ? (feature.properties.district_kn || meta.nameKannada)
      : rawName;

    // Official Tooltip centered on district centroid
    layer.bindTooltip(displayName, {
      direction: 'center',
      permanent: false,
      className: 'kt-official-map-tooltip'
    });

    layer.on({
      mouseover: (e) => {
        setHoveredDistrictName(rawName);
        e.target.setStyle(HOVER_STYLE);
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          e.target.bringToFront();
        }
      },
      mouseout: (e) => {
        setHoveredDistrictName(null);
        if (rawName !== selectedDistrictName) {
          e.target.setStyle(DEFAULT_STYLE);
        } else {
          e.target.setStyle(SELECTED_STYLE);
        }
      },
      click: () => {
        setSelectedDistrictName(rawName);
      }
    });
  };

  return (
    <section className="w-full bg-[#fbfbfa] dark:bg-stone-950 py-12 lg:py-20 border-t border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16">
        
        {/* Main Grid: Left 60% Content, Right 40% Map (Official Karnataka Tourism Layout) */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-16">
          
          {/* Left Column: District Info & Featured Attractions */}
          <div className="w-full lg:w-[58%] order-2 lg:order-1 flex flex-col justify-between">
            <div>
              {/* Section Header */}
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 mb-3 border border-emerald-300 dark:border-emerald-800">
                  <Sparkles size={12} className="text-amber-500" />
                  {lang === 'kn' ? 'ಕರ್ನಾಟಕ ಪ್ರವಾಸೋದ್ಯಮ ನಕ್ಷೆ' : 'Interactive Tourism Map'}
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 dark:text-white leading-tight">
                  {lang === 'kn' ? 'ಕರ್ನಾಟಕವನ್ನು ಅನ್ವೇಷಿಸಿ' : 'Explore Karnataka'}
                </h2>
                <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base mt-2">
                  {lang === 'kn'
                    ? 'ನಕ್ಷೆಯ ಮೇಲೆ ಜಿಲ್ಲೆಯನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ ಆ ಜಿಲ್ಲೆಯ ಪ್ರಮುಖ ತಾಣಗಳು ಮತ್ತು ಇತಿಹಾಸವನ್ನು ಅನ್ವೇಷಿಸಿ.'
                    : 'Click any district on the map to discover its rich heritage, nature, and top tourist destinations.'}
                </p>
              </div>

              {/* Active District Card */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm transition-all duration-300">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-[#00473F] dark:text-[#F6B918]" size={26} />
                    <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white">
                      {activeDistrict.name}
                      <span className="text-lg font-sans font-normal text-emerald-800 dark:text-emerald-400 ml-2">
                        {activeDistrict.nameKannada}
                      </span>
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                    {activeDistrict.division} {lang === 'kn' ? 'ವಿಭಾಗ' : 'Division'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed mb-6">
                  {lang === 'kn' && activeDistrict.descriptionKannada
                    ? activeDistrict.descriptionKannada
                    : activeDistrict.description}
                </p>

                {/* District Stats Row */}
                <div className="grid grid-cols-3 gap-3 mb-6 bg-stone-50 dark:bg-stone-800/60 rounded-xl p-3 sm:p-4 border border-stone-200 dark:border-stone-700 text-center">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                      {lang === 'kn' ? 'ತಾಲೂಕುಗಳು' : 'Taluks'}
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-[#00473F] dark:text-[#F6B918] mt-0.5">
                      {activeDistrict.taluks?.length || 0}
                    </div>
                  </div>
                  <div className="border-l border-r border-stone-200 dark:border-stone-700">
                    <div className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                      {lang === 'kn' ? 'ಕೇಂದ್ರ ಕಚೇರಿ' : 'Headquarters'}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-100 mt-1 truncate px-1">
                      {activeDistrict.headquarters}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                      {lang === 'kn' ? 'ಉತ್ತಮ ಕಾಲ' : 'Best Season'}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-100 mt-1">
                      {lang === 'kn' ? 'ಅಕ್ಟೋ – ಮಾರ್ಚ್' : 'Oct – Mar'}
                    </div>
                  </div>
                </div>

                {/* Top Spots Preview if available */}
                {activeDistrict.topSpots?.length > 0 && (
                  <div className="mb-6">
                    <div className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">
                      {lang === 'kn' ? 'ಪ್ರಮುಖ ಆಕರ್ಷಣೆಗಳು' : `Top Attractions in ${activeDistrict.name}`}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {activeDistrict.topSpots.slice(0, 4).map(spot => {
                        const img = getSafeDestinationImage(spot.image, spot) || getCategoryFallback(spot);
                        return (
                          <div
                            key={spot.id || spot.name}
                            onClick={() => onSelectPlace ? onSelectPlace(spot) : navigate(`/explore?q=${encodeURIComponent(spot.name)}`)}
                            className="group/spot rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:shadow-md transition-all cursor-pointer"
                          >
                            <div className="h-20 bg-stone-200 dark:bg-stone-900 overflow-hidden">
                              <img
                                src={img}
                                alt={spot.name}
                                onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = NEUTRAL_PLACEHOLDER_SVG; }}
                                className="w-full h-full object-cover group-hover/spot:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="p-2">
                              <div className="text-xs font-semibold text-stone-900 dark:text-white truncate">
                                {spot.name}
                              </div>
                              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                                {Number(spot.entryFeeINR ?? spot.entry_fee ?? 0) > 0 ? `₹${spot.entryFeeINR ?? spot.entry_fee}` : (lang === 'kn' ? 'ಉಚಿತ' : 'Free Entry')}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action Buttons: View More + Plan Trip */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => navigate(`/explore?district=${encodeURIComponent(activeDistrict.name)}`)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white text-sm font-semibold bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors shadow-xs"
                  >
                    <span>{lang === 'kn' ? 'ಇನ್ನಷ್ಟು ವೀಕ್ಷಿಸಿ ➜' : 'View More ➜'}</span>
                  </button>
                  <button
                    onClick={() => navigate(`/plan?district=${encodeURIComponent(activeDistrict.name)}`)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold bg-[#F6B918] text-stone-950 hover:bg-[#e0a714] transition-colors shadow-sm"
                  >
                    <Sparkles size={14} />
                    <span>{lang === 'kn' ? 'ಪ್ರವಾಸ ಯೋಜಿಸಿ ➜' : 'Plan Trip Here ➜'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Exact 1:1 Karnataka Tourism Map (Order 1 on mobile, 2 on desktop) */}
          <div className="w-full lg:w-[42%] order-1 lg:order-2 flex flex-col items-center">
            
            {/* Top Bar on Map: Download Tour Map Button (matching official site) */}
            <div className="w-full flex justify-between items-center mb-3 px-2">
              <span className="text-xs text-stone-500 font-medium">
                {lang === 'kn' ? '31 ಜಿಲ್ಲೆಗಳು' : '31 Districts of Karnataka'}
              </span>
              <a
                href="https://d2zamic3s4554j.cloudfront.net/static/Karnataka+Map.pdf"
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#00473F] text-white hover:bg-emerald-950 transition-colors shadow-xs"
              >
                <Download size={12} />
                <span>{lang === 'kn' ? 'ನಕ್ಷೆ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ➜' : 'Download Tour Map ➜'}</span>
              </a>
            </div>

            {/* Map Container - Zero tile layer, pure GeoJSON on clean canvas */}
            <div className="w-full h-[540px] sm:h-[640px] lg:h-[720px] relative rounded-2xl overflow-hidden bg-transparent flex items-center justify-center">
              <MapContainer
                style={{ height: '100%', width: '100%', background: 'transparent' }}
                center={[14.6173, 75.9]}
                zoom={7}
                zoomControl={false}
                scrollWheelZoom={false}
                dragging={false}
                doubleClickZoom={false}
                attributionControl={false}
              >
                <GeoJSON
                  ref={geoJsonRef}
                  data={karnatakaGeoJson}
                  style={(feature) => {
                    const name = getFeatureDistrictName(feature);
                    if (name === selectedDistrictName) return SELECTED_STYLE;
                    if (name === hoveredDistrictName) return HOVER_STYLE;
                    return DEFAULT_STYLE;
                  }}
                  onEachFeature={onEachFeature}
                />
              </MapContainer>

              {/* Subtle legend at bottom */}
              <div className="absolute bottom-2 left-4 right-4 pointer-events-none flex items-center justify-between text-[11px] text-stone-500 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#00473F]" />
                  <span>{lang === 'kn' ? 'ಜಿಲ್ಲೆ' : 'District'}</span>
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#F6B918] ml-2" />
                  <span>{lang === 'kn' ? 'ಆಯ್ಕೆ / ಹೋವರ್' : 'Selected / Hover'}</span>
                </span>
                <span className="font-semibold text-stone-700 dark:text-stone-300">
                  {selectedDistrictName}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Official Map Tooltip CSS (matches the exact white card badge from karnatakatourism.org) */}
      <style>{`
        .kt-official-map-tooltip {
          background: #ffffff !important;
          color: #262626 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          line-height: 1.2 !important;
          padding: 5px 11px !important;
          border-radius: 6px !important;
          border: 1px solid rgba(0, 0, 0, 0.12) !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18) !important;
          white-space: nowrap !important;
          pointer-events: none !important;
        }
        .kt-official-map-tooltip::before {
          display: none !important;
        }
        .leaflet-container {
          background-color: transparent !important;
        }
      `}</style>
    </section>
  );
}
