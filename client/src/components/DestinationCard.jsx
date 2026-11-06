import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { CATEGORY_COLORS, CROWD_LEVEL_MAP, CROWD_CONFIG } from '../i18n';
import {  Heart, MapPin, Clock, Ticket, Star, Sparkles, CheckCircle2, Video, Sun, Moon, Sunset, Sunrise , Navigation } from 'lucide-react';
import { getDestinationMedia, getCurrentTimeOfDay, TIME_OF_DAY_CONFIG, NEUTRAL_PLACEHOLDER_SVG, getSafeDestinationImage, getCategoryFallback } from '../utils/media';

// Missing or failed destination photographs use an explicit neutral placeholder.
const CATEGORY_LABELS_KN = {
  heritage: 'ಪರಂಪರೆ',
  nature: 'ಪ್ರಕೃತಿ',
  adventure: 'ಸಾಹಸ',
  wildlife: 'ವನ್ಯಜೀವಿ',
  beach: 'ಕಡಲ ತೀರ',
  hills: 'ಗಿರಿಧಾಮ',
  food: 'ಆಹಾರ',
  waterfall: 'ಜಲಪಾತ',
  spiritual: 'ಪವಿತ್ರ ಕ್ಷೇತ್ರ',
  temple: 'ದೇವಾಲಯ',
  fort: 'ಕೋಟೆ',
  lake: 'ಸರೋವರ',
  hidden: 'ಗುಪ್ತ ತಾಣ',
  trekking: 'ಚಾರಣ'
};

function CrowdBadge({ crowdLevel, lang }) {
  const key = CROWD_LEVEL_MAP[crowdLevel] || 'unknown';
  const cfg = CROWD_CONFIG[key] || CROWD_CONFIG.unknown;

  const label = lang === 'kn' ? (
    key === 'low' ? 'ಕಡಿಮೆ ಜನದಟ್ಟಣೆ' :
      key === 'moderate' ? 'ಮಧ್ಯಮ' :
        key === 'high' ? 'ಹೆಚ್ಚು ಜನಸಂದಣಿ' :
          key === 'very_high' ? 'ಅತೀವ ದಟ್ಟಣೆ' : 'ಮಾಹಿತಿ ಇಲ್ಲ'
  ) : cfg.label;

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: cfg.dotColor || '#6b7280' }}
      />
      {label}
    </span>
  );
}

export default function DestinationCard({ place, onClick, onSelect }) {
  const { isFavourite, toggleFavourite, showToast, t, lang } = useApp();
  const fav = isFavourite(place.id);
  const [imgError, setImgError] = useState(false);
  const handleSelect = onSelect || onClick;

  const primaryCat = Array.isArray(place.category) ? place.category[0] : (place.category || 'nature');
  const catCfg = CATEGORY_COLORS[primaryCat] || CATEGORY_COLORS.nature;

  const currentPeriod = getCurrentTimeOfDay();
  const activeMedia = getDestinationMedia(place, currentPeriod);
  const periodCfg = TIME_OF_DAY_CONFIG[currentPeriod] || TIME_OF_DAY_CONFIG.afternoon;

  const handleFav = (e) => {
    e.stopPropagation();
    toggleFavourite(place.id);
    showToast(fav ? (lang === 'kn' ? 'ಮೆಚ್ಚಿನವುಗಳಿಂದ ತೆಗೆಯಲಾಗಿದೆ' : 'Removed from favourites') : (lang === 'kn' ? 'ಮೆಚ್ಚಿನವುಗಳಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ' : 'Saved to favourites'));
  };

  const safeImage = getSafeDestinationImage(activeMedia.url, place) || getSafeDestinationImage(place.image, place);
  const imageSrc = imgError || !safeImage ? getCategoryFallback(place) : safeImage;

  const visitHours = place.avgVisitHours || place.visitDurationHours || (primaryCat === 'trekking' ? 4 : 2);
  const displayName = lang === 'kn' && place.nameKannada ? place.nameKannada : place.name;
  const subName = lang === 'kn' && place.nameKannada ? place.name : (place.nameKannada || '');

  return (
    <div
      className="group bg-white dark:bg-stone-900 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer select-none"
      onClick={() => handleSelect?.(place)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleSelect?.(place)}
      aria-label={`View details for ${place.name}`}
    >
      {/* Image with Time-of-Day Context */}
      <div className="relative h-48 w-full overflow-hidden bg-emerald-950">
        <img
          src={imageSrc}
          alt={activeMedia.caption || place.name}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient Shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />

        {/* Category Pill */}
        <span
          className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md shadow-xs"
          style={{
            background: catCfg.bg,
            color: catCfg.text,
            border: `1px solid ${catCfg.border || '#cbd5e1'}`
          }}
        >
          {lang === 'kn' ? (CATEGORY_LABELS_KN[primaryCat] || primaryCat) : primaryCat}
        </span>

        {/* Top-Right: Time of Day & Favourite */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          <span
            title={`Current local view: ${periodCfg.label} (${periodCfg.desc})`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/50 text-white backdrop-blur-md border border-white/20"
          >
            <span>{periodCfg.icon}</span>
            <span>
              {lang === 'kn'
                ? (periodCfg.label === 'Morning' ? 'ಮುಂಜಾನೆ' : periodCfg.label === 'Afternoon' ? 'ಮಧ್ಯಾಹ್ನ' : periodCfg.label === 'Evening' ? 'ಸಂಜೆ' : 'ರಾತ್ರಿ')
                : periodCfg.label}
            </span>
          </span>

          <button
            onClick={handleFav}
            className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform hover:scale-110"
            aria-label={fav ? 'Remove from favourites' : 'Save to favourites'}
          >
            <Heart size={13} fill={fav ? '#ef4444' : 'none'} stroke={fav ? '#ef4444' : '#ffffff'} />
          </button>
        </div>

        {/* Bottom badges: Hidden Gem & Video available */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
          {(place.offbeat || place.hiddenGemClassification?.status === 'hidden_gem') ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-stone-950 shadow-sm">
              <Sparkles size={10} />
              {lang === 'kn' ? 'ಗುಪ್ತ ತಾಣ' : 'Hidden Gem'}
            </span>
          ) : place.hiddenGemClassification?.status === 'lesser_known' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-sm">
              <Sparkles size={10} />
              {lang === 'kn' ? 'ಅಪರೂಪದ ತಾಣ' : 'Lesser-Known'}
            </span>
          ) : null}

          {place.video?.url && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-white backdrop-blur-md border border-white/20">
              <Video size={10} className="text-rose-400" /> {lang === 'kn' ? 'ವೀಡಿಯೊ' : 'Video'}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-white leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
              {displayName}
            </h3>
            <CrowdBadge crowdLevel={place.crowdLevel} lang={lang} />
          </div>

          {subName && (
            <div className="text-xs text-emerald-800 dark:text-emerald-400 font-sans font-medium mb-1.5">
              {subName}
            </div>
          )}

          <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 mb-2">
            <MapPin size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{[place.taluk, place.district].filter(Boolean).join(', ')}</span>
          </div>

          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
            {lang === 'kn' && place.descriptionKannada
              ? (place.descriptionKannada.slice(0, 110) + '...')
              : (place.shortDescription || (place.description ? place.description.slice(0, 110) + '...' : ''))}
          </p>
        </div>

        {/* Footer Meta Row */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {visitHours} {lang === 'kn' ? 'ಗಂಟೆ' : 'hrs'}
            </span>
            <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
              <Ticket size={12} />
              {place.entryFeeINR === 0 ? (lang === 'kn' ? 'ಉಚಿತ' : 'Free') : `₹${place.entryFeeINR}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {(place.googleMapsUrl || place.timeOfDayMedia?.googleMapsUrl || (place.source_url && place.source_url.includes('maps'))) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const targetUrl = place.googleMapsUrl || place.timeOfDayMedia?.googleMapsUrl || place.source_url;
                  window.open(targetUrl, '_blank', 'noopener,noreferrer');
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors border border-emerald-200 dark:border-emerald-800"
                title="Get Directions in Google Maps"
              >
                <Navigation size={10} />
                <span>Directions</span>
              </button>
            )}
            {place.verified !== false && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={12} />
                {lang === 'kn' ? 'ಪರಿಶೀಲಿತ' : 'Verified'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
