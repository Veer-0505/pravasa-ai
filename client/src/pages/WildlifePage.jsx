import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { WILDLIFE_SANCTUARIES } from '../data/tourismModulesData';
import { Bird, MapPin, ExternalLink, ShieldCheck, Clock, ShieldAlert, Compass } from 'lucide-react';
import { NEUTRAL_PLACEHOLDER_SVG, getSafeDestinationImage } from '../utils/media';

export default function WildlifePage() {
  const { lang, t } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-10 px-4 transition-colors">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">
            <Bird size={16} />
            <span>{lang === 'kn' ? 'ಕರ್ನಾಟಕ ವನ್ಯಜೀವಿ ಮತ್ತು ಅರಣ್ಯ ಪ್ರವಾಸೋದ್ಯಮ' : 'Karnataka Wildlife & Forest Intelligence'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-900 dark:text-white">
            {lang === 'kn' ? 'ವನ್ಯಜೀವಿ ಅಭಯಾರಣ್ಯಗಳು ಮತ್ತು ಸಫಾರಿ' : 'Wildlife Sanctuaries & Tiger Safaris'}
          </h1>
          <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base max-w-3xl mt-2 leading-relaxed">
            {lang === 'kn'
              ? 'ಬಂಡೀಪುರ, ನಾಗರಹೊಳೆ (ಕಬಿನಿ), ಭದ್ರಾ ಮತ್ತು ದಾಂಡೇಲಿ – ಪ್ರಾಜೆಕ್ಟ್ ಟೈಗರ್ ಸಂರಕ್ಷಿತ ತಾಣಗಳು, ಹಿನ್ನೀರಿನ ದೋಣಿ ಸಫಾರಿಗಳು ಮತ್ತು ಅಧಿಕೃತ ಜಂಗಲ್ ಲಾಡ್ಜಸ್ ಬುಕಿಂಗ್ ವಿವರಗಳು.'
              : 'Official guide to Bandipur, Nagarahole (Kabini), Bhadra, and Dandeli. Verified safari hours, backwater boat routes, Project Tiger conservation norms, and Jungle Lodges & Resorts booking links.'}
          </p>
        </div>

        {/* Responsible Wildlife Guidelines Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 sm:p-5 mb-8 flex items-start gap-3.5 shadow-xs">
          <ShieldCheck size={22} className="text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 leading-relaxed">
            <strong className="font-semibold block mb-0.5">
              {lang === 'kn' ? '🌿 ಜವಾಬ್ದಾರಿಯುತ ವನ್ಯಜೀವಿ ಪ್ರವಾಸದ ನಿಯಮಗಳು:' : '🌿 Responsible Wildlife Tourism Protocol:'}
            </strong>
            {lang === 'kn'
              ? 'ವನ್ಯಜೀವಿಗಳ ನೈಸರ್ಗಿಕ ನಡವಳಿಕೆಗೆ ಅಡ್ಡಿಪಡಿಸಬಾರದು. ಸಫಾರಿ ಸಮಯದಲ್ಲಿ ವಾಹನದಿಂದ ಇಳಿಯುವುದು, ಪ್ರಾಣಿಗಳಿಗೆ ಆಹಾರ ನೀಡುವುದು, ಪ್ಲಾಸ್ಟಿಕ್ ಎಸೆಯುವುದು ಮತ್ತು ಫ್ಲ್ಯಾಶ್ ಫೋಟೋಗ್ರಫಿ ಕಟ್ಟುನಿಟ್ಟಾಗಿ ನಿಷೇಧಿಸಲಾಗಿದೆ. ಪ್ರಾಣಿಗಳನ್ನು ನೋಡುವುದು ಪ್ರಾಕೃತಿಕ ಸಂಭವನೀಯತೆಯಾಗಿದ್ದು, ಯಾವುದೇ ಗ್ಯಾರಂಟಿ ಇರುವುದಿಲ್ಲ.'
              : 'Safaris operate inside highly regulated ecological zones. Flash photography, plastic carrying, feeding wild animals, and loud noise are strictly prohibited. Sightings depend on natural movement and weather conditions — wildlife viewing is never guaranteed.'}
          </div>
        </div>

        {/* Sanctuaries List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {WILDLIFE_SANCTUARIES.map(park => (
            <div
              key={park.id}
              className="bg-white dark:bg-stone-800/90 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Photo & Header */}
                <div className="h-60 w-full overflow-hidden relative bg-stone-200 dark:bg-stone-700">
                  <img
                    src={getSafeDestinationImage(park.image) || NEUTRAL_PLACEHOLDER_SVG}
                    alt={park.name}
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.currentTarget.src = NEUTRAL_PLACEHOLDER_SVG;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-stone-950 shadow-md">
                      {park.areaSqKm} km² {lang === 'kn' ? 'ವಿಸ್ತೀರ್ಣ' : 'Reserve Area'}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <h3 className="text-xl font-serif font-bold leading-tight drop-shadow">{park.name}</h3>
                    <div className="text-xs text-emerald-200 font-sans mt-0.5">{park.nameKannada}</div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                    <MapPin size={13} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{park.district} ({park.taluk} Taluk)</span>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                    {lang === 'kn' ? park.descriptionKannada : park.description}
                  </p>

                  {/* Highlights Tags */}
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                      {lang === 'kn' ? 'ಪ್ರಮುಖ ವನ್ಯಜೀವಿಗಳು:' : 'Wildlife Highlights:'}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(lang === 'kn' ? park.wildlifeHighlightsKannada : park.wildlifeHighlights).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700"
                        >
                          🐾 {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Safari Types & Timings */}
                  <div className="bg-stone-50 dark:bg-stone-900/60 p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <Clock size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-stone-800 dark:text-stone-200">
                          {lang === 'kn' ? 'ಸಫಾರಿ ಸಮಯ:' : 'Safari Timings:'}
                        </strong>
                        <span className="text-stone-600 dark:text-stone-400">
                          {lang === 'kn' ? park.timingsKannada : park.timings}
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-200 dark:border-stone-800">
                      <strong>{lang === 'kn' ? 'ಲಭ್ಯವಿರುವ ಸಫಾರಿಗಳು: ' : 'Safari Formats: '}</strong>
                      {park.safariTypes.join(', ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 flex items-center gap-3">
                <a
                  href={park.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>{lang === 'kn' ? 'ಅಧಿಕೃತ ಸಫಾರಿ ಬುಕಿಂಗ್' : 'Official Safari Booking'}</span>
                  <ExternalLink size={13} />
                </a>

                <button
                  onClick={() => navigate(`/map?q=${encodeURIComponent(park.name)}`)}
                  className="py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <MapPin size={14} />
                  <span>{lang === 'kn' ? 'ನಕ್ಷೆ' : 'Map'}</span>
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

