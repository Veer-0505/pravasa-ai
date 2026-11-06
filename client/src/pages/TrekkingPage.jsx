import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { TREKKING_DESTINATIONS } from '../data/tourismModulesData';
import { Mountain, MapPin, Compass, ShieldAlert, CheckCircle2, ExternalLink, ArrowRight, Filter, AlertTriangle } from 'lucide-react';
import { NEUTRAL_PLACEHOLDER_SVG, getSafeDestinationImage } from '../utils/media';

export default function TrekkingPage() {
  const { lang, t } = useApp();
  const navigate = useNavigate();
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  const filtered = filterDifficulty === 'all'
    ? TREKKING_DESTINATIONS
    : TREKKING_DESTINATIONS.filter(d => d.difficulty.toLowerCase() === filterDifficulty.toLowerCase());

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-10 px-4 transition-colors">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">
            <Mountain size={16} />
            <span>{lang === 'kn' ? 'ಕರ್ನಾಟಕ ಸಾಹಸ ಪ್ರವಾಸೋದ್ಯಮ' : 'Karnataka Adventure Tourism'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-900 dark:text-white">
            {lang === 'kn' ? 'ಚಾರಣ ಮತ್ತು ಪರ್ವತಾರೋಹಣ' : 'Trekking & Mountain Expeditions'}
          </h1>
          <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base max-w-3xl mt-2 leading-relaxed">
            {lang === 'kn'
              ? 'ಕರ್ನಾಟಕದ ಅತ್ಯುನ್ನತ ಮುಳ್ಳಯ್ಯನಗಿರಿಯಿಂದ, ಕುದುರೆಮುಖದ ಶೋಲಾ ಹುಲ್ಲುಗಾವಲುಗಳು ಮತ್ತು ಕುಮಾರ ಪರ್ವತದವರೆಗೆ - ಅಧಿಕೃತ ಅರಣ್ಯ ಪರವಾನಗಿ ನಿಯಮಗಳೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿದ ಚಾರಣ ತಾಣಗಳು.'
              : 'From Mullayanagiri (Karnataka\'s highest summit) to the protected shola ridges of Kudremukh and challenging crests of Kumara Parvatha. Verified with official Forest Department eco-permit requirements.'}
          </p>
        </div>

        {/* Environmental Notice & Forest Rules Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 sm:p-5 mb-8 flex items-start gap-3.5 shadow-xs">
          <AlertTriangle size={22} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong className="font-semibold block mb-0.5">
              {lang === 'kn' ? '⚠️ ಅರಣ್ಯ ಇಲಾಖೆಯ ಅಧಿಕೃತ ನಿಯಮಾವಳಿಗಳು:' : '⚠️ Karnataka Forest Department Mandatory Regulations:'}
            </strong>
            {lang === 'kn'
              ? 'ಪಶ್ಚಿಮ ಘಟ್ಟಗಳ ಪರಿಸರ ಸಂರಕ್ಷಣೆಗಾಗಿ ಕುದುರೆಮುಖ ಮತ್ತು ಸ್ಕಂದಗಿರಿ ಸೇರಿದಂತೆ ಬಹುತೇಕ ಚಾರಣಗಳಿಗೆ ಅರಣ್ಯ ಇಲಾಖೆಯ ಅಧಿಕೃತ ಪೋರ್ಟಲ್ (aranyaviation.karnataka.gov.in) ಮೂಲಕ ಮುಂಗಡ ಇಕೋ-ಪರವಾನಗಿ ಪಡೆಯುವುದು ಕಡ್ಡಾಯ. ಪ್ಲಾಸ್ಟಿಕ್ ಬಾಟಲಿಗಳು ಮತ್ತು ಕ್ಯಾಂಪಿಂಗ್ ಬೆಂಕಿ ಹಾಕುವುದು ಕಟ್ಟುನಿಟ್ಟಾಗಿ ನಿಷೇಧಿಸಲಾಗಿದೆ.'
              : 'To preserve fragile Western Ghats biodiversity, pre-booking verified eco-permits via the Karnataka Forest Department (Aranya portal) is legally required. Plastic packaging, unauthorized night camping, and littering carry statutory penalties under the Wildlife Protection Act.'}
          </div>
        </div>

        {/* Difficulty Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 mr-2 flex items-center gap-1">
            <Filter size={13} /> {lang === 'kn' ? 'ಹಂತ:' : 'Difficulty:'}
          </span>
          {[
            { id: 'all', label: 'All Treks', labelKn: 'ಎಲ್ಲಾ ಚಾರಣಗಳು' },
            { id: 'beginner', label: 'Beginner / Easy', labelKn: 'ಆರಂಭಿಕ / ಸುಲಭ' },
            { id: 'moderate', label: 'Moderate Ridge', labelKn: 'ಮಧ್ಯಮ ಶ್ರೇಣಿ' },
            { id: 'difficult', label: 'Challenging Summit', labelKn: 'ಕಠಿಣ ಸವಾಲು' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterDifficulty(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterDifficulty === f.id
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-stone-200 dark:border-stone-700'
              }`}
            >
              {lang === 'kn' ? f.labelKn : f.label}
            </button>
          ))}
        </div>

        {/* Trekking Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(trek => (
            <div
              key={trek.id}
              className="bg-white dark:bg-stone-800/90 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Photo & Badge */}
                <div className="h-52 w-full overflow-hidden relative bg-stone-200 dark:bg-stone-700">
                  <img
                    src={getSafeDestinationImage(trek.image) || NEUTRAL_PLACEHOLDER_SVG}
                    alt={trek.name}
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.currentTarget.src = NEUTRAL_PLACEHOLDER_SVG;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Difficulty Tag */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${
                      trek.difficulty === 'Difficult'
                        ? 'bg-rose-500/90 text-white'
                        : trek.difficulty === 'Moderate'
                        ? 'bg-amber-500/90 text-stone-950'
                        : 'bg-emerald-600/90 text-white'
                    }`}>
                      {lang === 'kn' ? trek.difficultyKannada : trek.difficulty}
                    </span>
                  </div>

                  {/* Elevation & Distance */}
                  <div className="absolute bottom-3 left-3 right-3 text-white flex items-end justify-between">
                    <div>
                      <div className="text-lg font-serif font-bold leading-tight">{trek.name}</div>
                      <div className="text-xs text-emerald-200 font-sans">{trek.nameKannada}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-amber-300">{trek.elevationMeters} m</div>
                      <div className="text-[10px] text-white/80">{trek.distanceKm} km</div>
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                    <MapPin size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{trek.district} ({trek.taluk} Taluk)</span>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 line-clamp-3 leading-relaxed">
                    {lang === 'kn' ? trek.descriptionKannada : trek.description}
                  </p>

                  {/* Trek Details Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-stone-50 dark:bg-stone-900/60 p-3 rounded-xl border border-stone-100 dark:border-stone-800 text-[11px]">
                    <div>
                      <span className="text-stone-400 block">{lang === 'kn' ? 'ಆರಂಭಿಕ ತಾಣ' : 'Trailhead'}</span>
                      <strong className="text-stone-800 dark:text-stone-200 font-medium">{trek.startingPoint}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block">{lang === 'kn' ? 'ಸಮಯಾವಧಿ' : 'Duration'}</span>
                      <strong className="text-stone-800 dark:text-stone-200 font-medium">{trek.durationHours}</strong>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-stone-200 dark:border-stone-800">
                      <span className="text-stone-400 block">{lang === 'kn' ? 'ಅರಣ್ಯ ಅನುಮತಿ ನಿಯಮ' : 'Forest Permission'}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        {lang === 'kn' ? trek.forestPermissionKannada : trek.forestPermission}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 flex items-center gap-2">
                <a
                  href={trek.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>{lang === 'kn' ? 'ಪರವಾನಗಿ ಪೋರ್ಟಲ್' : 'Official Permit Portal'}</span>
                  <ExternalLink size={12} />
                </a>

                <button
                  onClick={() => navigate(`/map?q=${encodeURIComponent(trek.name)}`)}
                  className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 transition-colors"
                  title="View on Map"
                >
                  <MapPin size={15} />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

