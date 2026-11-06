import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import { DIVISIONS, INTERESTS } from '../i18n';
import {
  Search,
  Filter,
  X,
  MapPin,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Compass,
  ArrowRight,
  Layers,
  Landmark,
  Footprints,
  Trees
} from 'lucide-react';
import DestinationCard from '../components/DestinationCard';
import DestinationModal from '../components/DestinationModal';
import { subscribeToDestinations } from '../supabase';
import { fetchPlaces } from '../utils';

export default function Explore() {
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [places, setPlaces] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [taluksList, setTaluksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedDivision, setSelectedDivision] = useState(searchParams.get('division') || '');
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get('district') || '');
  const [selectedTaluk, setSelectedTaluk] = useState(searchParams.get('taluk') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [hiddenGemFilter, setHiddenGemFilter] = useState(searchParams.get('gem') || 'all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all places and district metadata on mount (Single Source of Truth: Supabase)
  useEffect(() => {
    const loadData = () => {
      Promise.all([
        fetchPlaces({ limit: 500 }),
        fetch('/api/districts').then(res => res.json()),
        fetch('/api/districts/taluks/all').then(res => res.json())
      ])
        .then(([placesList, distRes, talukRes]) => {
          if (Array.isArray(placesList)) setPlaces(placesList);
          if (distRes && distRes.districts) setDistrictsList(distRes.districts);
          if (talukRes && talukRes.taluks) setTaluksList(talukRes.taluks);
          setLoading(false);
        })
        .catch(err => {
          console.error('Explore load error:', err);
          setLoading(false);
        });
    };

    loadData();

    // Supabase Realtime live sync
    const unsubscribe = subscribeToDestinations(() => {
      fetchPlaces({ limit: 500 })
        .then(data => {
          if (Array.isArray(data)) setPlaces(data);
        })
        .catch(() => {});
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Update selected district if searchParams change
  useEffect(() => {
    const qDistrict = searchParams.get('district');
    if (qDistrict) setSelectedDistrict(qDistrict);
  }, [searchParams]);

  // Available districts based on division
  const availableDistricts = useMemo(() => {
    if (!selectedDivision) return districtsList;
    return districtsList.filter(d => d.division.toLowerCase() === selectedDivision.toLowerCase());
  }, [districtsList, selectedDivision]);

  // Available taluks based on selected district
  const availableTaluks = useMemo(() => {
    if (!selectedDistrict) return [];
    const matched = districtsList.find(d => d.name.toLowerCase() === selectedDistrict.toLowerCase() || d.id === selectedDistrict.toLowerCase());
    return matched ? matched.taluks : [];
  }, [districtsList, selectedDistrict]);

  // Matched district object for banner link
  const currentDistrictObj = useMemo(() => {
    if (!selectedDistrict) return null;
    return districtsList.find(d => d.name.toLowerCase() === selectedDistrict.toLowerCase() || d.id === selectedDistrict.toLowerCase());
  }, [districtsList, selectedDistrict]);

  // Master filtering engine
  const filtered = useMemo(() => {
    let list = places;

    // Search query filter (English and Kannada)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.nameKannada || '').includes(q) ||
        (p.aliases || []).some(a => a.toLowerCase().includes(q)) ||
        (p.district || '').toLowerCase().includes(q) ||
        (p.taluk || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    // Division filter
    if (selectedDivision) {
      list = list.filter(p => (p.division || '').toLowerCase() === selectedDivision.toLowerCase());
    }

    // District filter
    if (selectedDistrict) {
      const dLower = selectedDistrict.toLowerCase();
      list = list.filter(p => (p.district || '').toLowerCase().includes(dLower) || dLower.includes((p.district || '').toLowerCase()));
    }

    // Taluk filter
    if (selectedTaluk) {
      list = list.filter(p => (p.taluk || '').toLowerCase() === selectedTaluk.toLowerCase());
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      list = list.filter(p => {
        const cats = Array.isArray(p.category) ? p.category : [p.category];
        return cats.some(c => c && c.toLowerCase() === selectedCategory.toLowerCase()) ||
               (p.subcategory || '').toLowerCase().includes(selectedCategory.toLowerCase());
      });
    }

    // Hidden gem classification status filter
    if (hiddenGemFilter === 'hidden_gem') {
      list = list.filter(p => p.hiddenGemClassification?.status === 'hidden_gem' || p.offbeat === true);
    } else if (hiddenGemFilter === 'lesser_known') {
      list = list.filter(p => p.hiddenGemClassification?.status === 'lesser_known');
    } else if (hiddenGemFilter === 'emerging') {
      list = list.filter(p => p.hiddenGemClassification?.status === 'emerging');
    } else if (hiddenGemFilter === 'popular') {
      list = list.filter(p => p.hiddenGemClassification?.status === 'popular' || (!p.offbeat && p.crowdLevel >= 2));
    }

    return list;
  }, [places, searchQuery, selectedDivision, selectedDistrict, selectedTaluk, selectedCategory, hiddenGemFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDivision('');
    setSelectedDistrict('');
    setSelectedTaluk('');
    setSelectedCategory('');
    setHiddenGemFilter('all');
    setSearchParams({});
  };

  const hasFilters = searchQuery || selectedDivision || selectedDistrict || selectedTaluk || selectedCategory || (hiddenGemFilter !== 'all');

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors">
      {/* Header Banner */}
      <div className="bg-emerald-900 dark:bg-emerald-950 text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-emerald-800 dark:border-emerald-900/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950/80" />
        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2">
            <Compass size={16} />
            <span>{lang === 'kn' ? 'ಕರ್ನಾಟಕ ಪ್ರವಾಸೋದ್ಯಮ ಅನ್ವೇಷಕ' : 'Pravasa AI Intelligence Directory'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white mb-3">
            {lang === 'kn' ? 'ಎಲ್ಲಾ 31 ಜಿಲ್ಲೆಗಳ ಪ್ರವಾಸಿ ತಾಣಗಳು' : 'Discover Every Corner of Karnataka'}
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl leading-relaxed mb-6">
            {lang === 'kn'
              ? 'ಪ್ರಸಿದ್ಧ ಆಕರ್ಷಣೆಗಳು, ಗುಪ್ತ ರತ್ನಗಳು, ಐತಿಹಾಸಿಕ ಕೋಟೆಗಳು, ಜಲಪಾತಗಳು ಮತ್ತು ಪ್ರಾಚೀನ ದೇವಾಲಯಗಳನ್ನು ಅನ್ವೇಷಿಸಿ.'
              : 'Search verified heritage monuments, pristine hidden gems, hill stations, ancient stepwells, and cultural experiences across 31 districts.'}
          </p>

          {/* Search bar with instant bilingual matching */}
          <div className="relative max-w-xl">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={lang === 'kn' ? 'ತಾಣ, ಜಿಲ್ಲೆ ಅಥವಾ ತಾಲೂಕಿನ ಹೆಸರು ನಮೂದಿಸಿ (ಕನ್ನಡ / English)...' : 'Search by destination name, district, or taluk...'}
              className="w-full pl-11 pr-10 py-3 text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-white rounded-xl border border-stone-200 dark:border-stone-700 shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Search destinations"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content & Interactive Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10 pb-16">
        {/* Filter Card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-md mb-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-emerald-700 dark:text-emerald-400" />
              <span className="font-semibold text-sm text-stone-800 dark:text-stone-200">
                {lang === 'kn' ? 'ಫಿಲ್ಟರ್‌ಗಳು ಮತ್ತು ವರ್ಗಗಳು' : 'Filters & Categories'}
              </span>
              {hasFilters && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {lang === 'kn' ? 'ಫಿಲ್ಟರ್ ಸಕ್ರಿಯವಾಗಿದೆ' : 'Active Filters'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:underline px-2 py-1"
                >
                  <X size={14} />
                  <span>{lang === 'kn' ? 'ಎಲ್ಲಾ ತೆರವುಗೊಳಿಸಿ' : 'Clear all'}</span>
                </button>
              )}
              <button
                onClick={() => setShowFilters(o => !o)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <span>{showFilters ? (lang === 'kn' ? 'ಕಡಿಮೆ ಫಿಲ್ಟರ್‌ಗಳು' : 'Fewer filters') : (lang === 'kn' ? 'ಹೆಚ್ಚಿನ ಫಿಲ್ಟರ್‌ಗಳು' : 'More filters')}</span>
                <ChevronDown size={14} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Division Selector Pills */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 mb-2">
              {lang === 'kn' ? 'ಆಡಳಿತ ವಿಭಾಗ:' : 'Administrative Division:'}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setSelectedDivision(''); setSelectedDistrict(''); setSelectedTaluk(''); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  !selectedDivision
                    ? 'bg-emerald-800 text-white font-semibold shadow-sm'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {lang === 'kn' ? 'ಎಲ್ಲಾ ಕರ್ನಾಟಕ' : 'All Karnataka (31 Districts)'}
              </button>
              {DIVISIONS.map(div => (
                <button
                  key={div}
                  onClick={() => { setSelectedDivision(div); setSelectedDistrict(''); setSelectedTaluk(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedDivision === div
                      ? 'bg-emerald-800 text-white font-semibold shadow-sm'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {div} {lang === 'kn' ? 'ವಿಭಾಗ' : 'Division'}
                </button>
              ))}
            </div>
          </div>

          {/* Cascading District Dropdown & Taluk Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4 pt-3 border-t border-stone-100 dark:border-stone-800">
            {/* District dropdown */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                {lang === 'kn' ? 'ಜಿಲ್ಲೆ ಆಯ್ಕೆಮಾಡಿ:' : 'Select District:'}
              </label>
              <select
                value={selectedDistrict}
                onChange={e => { setSelectedDistrict(e.target.value); setSelectedTaluk(''); }}
                className="w-full bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 text-xs font-medium border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">{lang === 'kn' ? 'ಎಲ್ಲಾ 31 ಜಿಲ್ಲೆಗಳು' : 'All 31 Districts'}</option>
                {availableDistricts.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.name} {d.nameKannada ? `(${d.nameKannada})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Cascading Taluk dropdown */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                {lang === 'kn' ? 'ತಾಲೂಕು (ಆಯ್ಕೆಮಾಡಿದ ಜಿಲ್ಲೆ):' : 'Taluk (within District):'}
              </label>
              <select
                value={selectedTaluk}
                onChange={e => setSelectedTaluk(e.target.value)}
                disabled={!selectedDistrict || availableTaluks.length === 0}
                className="w-full bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 text-xs font-medium border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                <option value="">{lang === 'kn' ? 'ಎಲ್ಲಾ ತಾಲೂಕುಗಳು' : 'All Taluks'}</option>
                {availableTaluks.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Hidden Gem Classification filter */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5 flex items-center gap-1">
                <Sparkles size={12} className="text-amber-500" />
                <span>{lang === 'kn' ? 'ವರ್ಗೀಕರಣ (ಗುಪ್ತ ರತ್ನಗಳು):' : 'Gem Classification:'}</span>
              </label>
              <select
                value={hiddenGemFilter}
                onChange={e => setHiddenGemFilter(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 text-xs font-medium border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">{lang === 'kn' ? 'ಎಲ್ಲಾ ತಾಣಗಳು' : 'All Destinations'}</option>
                <option value="hidden_gem">{lang === 'kn' ? '✨ ಪರಿಶುದ್ಧ ಗುಪ್ತ ರತ್ನಗಳು ಮಾತ್ರ' : '✨ Genuine Hidden Gems Only'}</option>
                <option value="lesser_known">{lang === 'kn' ? 'ಕಡಿಮೆ ಪರಿಚಿತ ತಾಣಗಳು' : 'Lesser-Known Places'}</option>
                <option value="emerging">{lang === 'kn' ? 'ಉದಯೋನ್ಮುಖ ಆಕರ್ಷಣೆಗಳು' : 'Emerging Spots'}</option>
                <option value="popular">{lang === 'kn' ? 'ಜನಪ್ರಿಯ ತಾಣಗಳು' : 'Popular Major Attractions'}</option>
              </select>
            </div>
          </div>

          {/* Quick link to dedicated District Page if a district is selected */}
          {currentDistrictObj && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-200 font-medium">
                <Landmark size={16} className="text-emerald-700 dark:text-emerald-400" />
                <span>
                  {lang === 'kn'
                    ? `${currentDistrictObj.name} ಜಿಲ್ಲೆಯ ಸಂಪೂರ್ಣ ಪ್ರವಾಸೋದ್ಯಮ ಮಾರ್ಗದರ್ಶಿ ಲಭ್ಯವಿದೆ.`
                    : `Explore the dedicated ${currentDistrictObj.name} district intelligence guide.`}
                </span>
              </div>
              <Link
                to={`/district/${currentDistrictObj.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white transition-colors"
              >
                <span>{lang === 'kn' ? `${currentDistrictObj.name} ಮಾರ್ಗದರ್ಶಿ ನೋಡಿ` : `Open ${currentDistrictObj.name} Guide`}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {/* Expanded Category Pills */}
          {showFilters && (
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
              <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 mb-2">
                {lang === 'kn' ? 'ಪ್ರವಾಸೋದ್ಯಮ ವರ್ಗ:' : 'Experience Category:'}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    !selectedCategory
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {lang === 'kn' ? 'ಎಲ್ಲಾ ವರ್ಗಗಳು' : 'All Categories'}
                </button>
                {INTERESTS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedCategory(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedCategory === item.id
                        ? 'bg-emerald-800 text-white font-semibold shadow-sm'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            {loading ? (
              <span>{lang === 'kn' ? 'ತಾಣಗಳನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...' : 'Retrieving destinations...'}</span>
            ) : (
              <span>
                {lang === 'kn' ? 'ತೋರಿಸಲಾಗುತ್ತಿದೆ' : 'Showing'}{' '}
                <strong className="text-stone-900 dark:text-white font-bold">{filtered.length}</strong>{' '}
                {lang === 'kn' ? 'ಪ್ರವಾಸಿ ತಾಣಗಳು' : 'destinations'}
                {selectedDistrict && <span> {lang === 'kn' ? 'ಜಿಲ್ಲೆಯಲ್ಲಿ' : 'in'} <strong>{selectedDistrict}</strong></span>}
                {selectedTaluk && <span> › <strong>{selectedTaluk}</strong></span>}
                {hiddenGemFilter === 'hidden_gem' && <span className="text-amber-600 dark:text-amber-400 font-semibold"> (✨ {lang === 'kn' ? 'ಗುಪ್ತ ರತ್ನಗಳು ಮಾತ್ರ' : 'Hidden Gems Only'})</span>}
              </span>
            )}
          </div>

          <div className="text-xs text-stone-500 flex items-center gap-2">
            <span>Karnataka 31 Districts Registry</span>
            <span>•</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">✓ ASI &amp; KSTDC Verified</span>
          </div>
        </div>

        {/* Destination Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-stone-200 dark:bg-stone-800 animate-pulse" />
            ))}
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-20 px-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm max-w-2xl mx-auto">
            <Compass size={52} className="mx-auto text-emerald-700 dark:text-emerald-500 mb-4 animate-bounce" />
            <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-white mb-2">
              {lang === 'kn' ? 'ಇನ್ನೂ ಯಾವುದೇ ಪ್ರವಾಸಿ ತಾಣಗಳು ಲಭ್ಯವಿಲ್ಲ' : 'No destinations available yet'}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
              {lang === 'kn'
                ? 'ಸರ್ಕಾರಿ ಅಧಿಕಾರಿಗಳು ಶೀಘ್ರದಲ್ಲೇ ಪರಿಶೀಲಿಸಿದ ಪ್ರವಾಸಿ ತಾಣಗಳನ್ನು ಸೇರಿಸಲಿದ್ದಾರೆ.'
                : 'Government administrators will add verified destinations soon.'}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            <Compass size={48} className="mx-auto text-stone-400 mb-3" />
            <h3 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-200 mb-1">
              {lang === 'kn' ? 'ಯಾವುದೇ ತಾಣಗಳು ಕಂಡುಬಂದಿಲ್ಲ' : 'No destinations match your criteria'}
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto mb-5">
              {lang === 'kn'
                ? 'ದಯವಿಟ್ಟು ಬೇರೆ ಜಿಲ್ಲೆ, ತಾಲೂಕು ಅಥವಾ ವರ್ಗವನ್ನು ಪ್ರಯತ್ನಿಸಿ, ಅಥವಾ ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ.'
                : 'Try clearing some filters or searching for another district or keyword.'}
            </p>
            <button
              onClick={clearFilters}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-800 text-white hover:bg-emerald-900 transition-colors shadow-sm"
            >
              {lang === 'kn' ? 'ಎಲ್ಲಾ ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ' : 'Reset all filters'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(p => (
              <DestinationCard
                key={p.id}
                place={p}
                onSelect={(place) => setSelectedPlace(place)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Destination Modal */}
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
