import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import DestinationCard from '../components/DestinationCard';
import DestinationModal from '../components/DestinationModal';
import {
  Search,
  Compass,
  AlertCircle,
  Sparkles,
  MapPin,
  Building,
  Filter,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { fetchPlaces } from '../utils';
import { subscribeToDestinations } from '../supabase';
import { KARNATAKA_DISTRICTS } from '../i18n';

const GEM_THEMES = [
  { id: 'all', label: 'All Hidden Gems', labelKn: 'ಎಲ್ಲಾ ಗುಪ್ತ ತಾಣಗಳು', icon: '✨' },
  { id: 'nature', label: 'Untouched Nature', labelKn: 'ಅಸ್ಪೃಶ್ಯ ಪ್ರಕೃತಿ', icon: '🌿' },
  { id: 'waterfall', label: 'Secret Waterfalls', labelKn: 'ರಹಸ್ಯ ಜಲಪಾತಗಳು', icon: '🌊' },
  { id: 'heritage', label: 'Forgotten Forts & Ruins', labelKn: 'ಮರೆತುಹೋದ ಕೋಟೆಗಳು', icon: '🏰' },
  { id: 'spiritual', label: 'Remote Shrines', labelKn: 'ಏಕಾಂತ ದೇವಾಲಯಗಳು', icon: '🛕' },
  { id: 'hills', label: 'Secluded Peaks', labelKn: 'ರಮಣೀಯ ಶಿಖರಗಳು', icon: '⛰️' }
];

export default function HiddenGems() {
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  useEffect(() => {
    const loadGems = () => {
      fetchPlaces({ limit: 1000 })
        .then(data => {
          const gems = data.filter(p =>
            p.offbeat ||
            p.hiddenGemClassification?.status === 'hidden_gem' ||
            p.hiddenGemClassification?.status === 'lesser_known' ||
            (p.category && p.category.includes('hidden'))
          );
          setPlaces(gems);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    loadGems();

    // Supabase Realtime synchronization
    const unsubscribe = subscribeToDestinations(() => {
      loadGems();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const filtered = useMemo(() => {
    return places.filter(p => {
      // 1. Search Query
      if (search) {
        const q = search.toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchNameKn = (p.nameKannada || '').toLowerCase().includes(q);
        const matchDist = (p.district || '').toLowerCase().includes(q);
        const matchTaluk = (p.taluk || '').toLowerCase().includes(q);
        const matchDesc = (p.description || '').toLowerCase().includes(q);
        if (!matchName && !matchNameKn && !matchDist && !matchTaluk && !matchDesc) return false;
      }

      // 2. District Filter
      if (selectedDistrict) {
        if ((p.district || '').toLowerCase() !== selectedDistrict.toLowerCase()) return false;
      }

      // 3. Theme / Category Filter
      if (selectedTheme !== 'all') {
        const cats = Array.isArray(p.category) ? p.category.map(c => c.toLowerCase()) : [(p.category || '').toLowerCase()];
        const pType = (p.place_type || '').toLowerCase();
        if (!cats.includes(selectedTheme) && pType !== selectedTheme) {
          if (selectedTheme === 'heritage' && !cats.includes('fort') && !pType.includes('fort')) return false;
          if (selectedTheme === 'nature' && !cats.includes('wildlife') && !cats.includes('hills')) return false;
          if (selectedTheme !== 'heritage' && selectedTheme !== 'nature') return false;
        }
      }

      return true;
    });
  }, [places, search, selectedDistrict, selectedTheme]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors">

      {/* Editorial Header Banner */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 text-white pt-12 pb-16 px-4 border-b border-emerald-900/60">
        <div className="max-w-7xl mx-auto space-y-4">

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-200 text-xs font-semibold uppercase tracking-wider">
            <Sparkles size={14} className="text-amber-400" />
            <span>{lang === 'kn' ? '31 ಜಿಲ್ಲೆಗಳ ಅಪರೂಪದ ಪ್ರವಾಸ ಕೋಶ' : '31 Districts Off-the-Beaten-Path Directory'}</span>
          </div>

          <h1 className="font-serif font-extrabold text-3xl sm:text-5xl tracking-tight leading-tight">
            {lang === 'kn' ? 'ಕರ್ನಾಟಕದ ಗುಪ್ತ ಪ್ರವಾಸಿ ರತ್ನಗಳು' : 'Hidden Gems of Karnataka'}
          </h1>

          <p className="text-stone-200 text-sm sm:text-base max-w-3xl leading-relaxed">
            {lang === 'kn'
              ? 'ಪ್ರಸಿದ್ಧ ಪ್ರವಾಸಿ ತಾಣಗಳ ಗದ್ದಲದಿಂದ ದೂರವಿರುವ ಪ್ರಾಚೀನ ಕಲ್ಲಿನ ಮೆಟ್ಟಿಲು ಬಾವಿಗಳು, ಅಜ್ಞಾತ ಕೋಟೆಗಳು, ಗುಹಾ ದೇವಾಲಯಗಳು ಮತ್ತು ರಮಣೀಯ ಜಲಪಾತಗಳು. ಪ್ರತಿಯೊಂದು ಜಿಲ್ಲೆಯಲ್ಲೂ ನೈಜ, ಪರಿಶೀಲಿತ ಗುಪ್ತ ತಾಣಗಳನ್ನು ಅನ್ವೇಷಿಸಿ.'
              : 'Discover authentic lesser-known treasures across all 31 districts: secluded waterfall pools, untouched Hoysala and Chalukya shrines, medieval stepwells, and mist-wrapped forest ridges away from commercial crowds.'}
          </p>

          {/* Travel Caution Advisory Notice */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-xs sm:text-sm text-stone-200 max-w-3xl flex items-start gap-3 mt-4">
            <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {lang === 'kn'
                ? 'ಸೂಚನೆ: ಈ ತಾಣಗಳು ಜನದಟ್ಟಣೆಯಿಂದ ದೂರವಿರುವುದರಿಂದ ಮೊಬೈಲ್ ನೆಟ್‌ವರ್ಕ್ ಮತ್ತು ವಾಣಿಜ್ಯ ಸೌಲಭ್ಯಗಳು ಸೀಮಿತವಾಗಿರಬಹುದು. ಹಗಲಿನ ವೇಳೆಯಲ್ಲಿ ಪ್ರಯಾಣಿಸಿ ಮತ್ತು ಸ್ಥಳೀಯ ಗ್ರಾಮಸ್ಥರ ಮಾರ್ಗದರ್ಶನ ಪಡೆದುಕೊಳ್ಳಿ.'
                : 'Advisory: These offbeat destinations have lower tourist traffic and may have limited mobile reception, fuel outlets, or commercial amenities. Plan daytime arrivals, carry drinking water, and respect local village heritage.'}
            </p>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8 space-y-6 pb-20">

        {/* Multi-Filter Bar (Search, District Selector, Category Pills) */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-lg space-y-4">

          <div className="flex flex-col md:flex-row items-center gap-3">

            {/* Search Box */}
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={lang === 'kn' ? 'ಹೆಸರು, ಜಿಲ್ಲೆ, ಅಥವಾ ತಾಲೂಕಿನ ಮೂಲಕ ಹುಡುಕಿ (ಉದಾ: ಕಂಪ್ಲಿ, ಬಸರಾಳು, ಯಾಣ)...' : 'Search by name, district, or taluk (e.g., Kampli, Basaralu, Yana)...'}
                className="w-full py-2.5 pl-10 pr-4 text-xs sm:text-sm rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
              />
            </div>

            {/* 31 District Dropdown Selector */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Building size={16} className="text-emerald-700 dark:text-emerald-400 shrink-0 hidden sm:block" />
              <select
                value={selectedDistrict}
                onChange={e => setSelectedDistrict(e.target.value)}
                className="w-full md:w-60 py-2.5 px-3 text-xs sm:text-sm rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 outline-none focus:border-emerald-600"
                aria-label="Filter by district"
              >
                <option value="">{lang === 'kn' ? 'ಎಲ್ಲಾ 31 ಜಿಲ್ಲೆಗಳು (ಕರ್ನಾಟಕ)' : 'All 31 Districts (Karnataka)'}</option>
                {KARNATAKA_DISTRICTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Theme / Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
            {GEM_THEMES.map(theme => {
              const active = selectedTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${active
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700'
                    }`}
                >
                  <span>{theme.icon}</span>
                  <span>{lang === 'kn' ? theme.labelKn : theme.label}</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Counter and Active Filters Status Bar */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-stone-600 dark:text-stone-400 px-1">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span>
              {lang === 'kn' ? (
                <>ತೋರಿಸಲಾಗುತ್ತಿದೆ: <strong>{filtered.length}</strong> ಪರಿಶೀಲಿತ ಗುಪ್ತ ತಾಣಗಳು {selectedDistrict && `(${selectedDistrict} ಜಿಲ್ಲೆ)`}</>
              ) : (
                <>Showing <strong>{filtered.length}</strong> verified hidden destinations {selectedDistrict && `in ${selectedDistrict} District`}</>
              )}
            </span>
          </div>

          {(search || selectedDistrict || selectedTheme !== 'all') && (
            <button
              onClick={() => { setSearch(''); setSelectedDistrict(''); setSelectedTheme('all'); }}
              className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
            >
              {lang === 'kn' ? 'ಎಲ್ಲಾ ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ' : 'Clear all filters'}
            </button>
          )}
        </div>

        {/* Destination Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-80 rounded-2xl skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
            <Compass size={48} className="mx-auto text-stone-400 stroke-1" />
            <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-white">
              {lang === 'kn' ? 'ಯಾವುದೇ ತಾಣಗಳು ಕಂಡುಬಂದಿಲ್ಲ' : 'No hidden gems match your criteria'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              {lang === 'kn'
                ? 'ಬೇರೆ ಜಿಲ್ಲೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ ಕರ್ನಾಟಕದ ಎಲ್ಲಾ ಗುಪ್ತ ತಾಣಗಳನ್ನು ಅನ್ವೇಷಿಸಿ.'
                : 'Try choosing another district or resetting your search filter to view all verified destinations across Karnataka.'}
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedDistrict(''); setSelectedTheme('all'); }}
              className="btn btn-primary btn-sm"
            >
              {lang === 'kn' ? 'ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ' : 'Reset filters'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(p => (
              <div key={p.id} className="relative flex flex-col">
                <DestinationCard place={p} onClick={setSelectedPlace} />
                {/* Highlight justification reason under card */}
                {p.hiddenGemClassification?.reason && (
                  <div className="mt-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 leading-tight">
                    <span className="font-semibold text-amber-800 dark:text-amber-300">
                      {lang === 'kn' ? 'ಗುಪ್ತ ತಾಣದ ವಿಶೇಷತೆ: ' : 'Why Offbeat: '}
                    </span>
                    {p.hiddenGemClassification.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Destination Modal View */}
      {selectedPlace && (
        <DestinationModal
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onAddToTrip={(p) => {
            navigate(`/plan?place=${p.id}`);
            setSelectedPlace(null);
          }}
        />
      )}

    </div>
  );
}
