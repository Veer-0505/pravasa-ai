import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import {
  MapPin,
  Compass,
  Sparkles,
  CloudSun,
  Calendar,
  Layers,
  ArrowLeft,
  Search,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Car,
  Footprints,
  Landmark,
  Trees,
  Flame,
  Palette
} from 'lucide-react';
import DestinationCard from '../components/DestinationCard';
import DestinationModal from '../components/DestinationModal';

export default function DistrictPage() {
  const { districtId } = useParams();
  const navigate = useNavigate();
  const { lang, theme } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [districtData, setDistrictData] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTaluk, setSelectedTaluk] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetch(`/api/districts/${districtId}`)
      .then(res => {
        if (!res.ok) throw new Error(`District '${districtId}' not found`);
        return res.json();
      })
      .then(data => {
        if (!isCancelled) {
          setDistrictData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!isCancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { isCancelled = true; };
  }, [districtId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
            {lang === 'kn' ? 'ಜಿಲ್ಲಾ ಪ್ರವಾಸೋದ್ಯಮ ಮಾಹಿತಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading Karnataka district tourism intelligence...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !districtData) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 bg-stone-50 dark:bg-stone-950">
        <div className="max-w-md text-center p-8 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-lg">
          <ShieldAlert size={48} className="mx-auto text-amber-500 mb-4" />
          <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-2">
            {lang === 'kn' ? 'ಜಿಲ್ಲೆ ಕಂಡುಬಂದಿಲ್ಲ' : 'District Not Found'}
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
            {lang === 'kn'
              ? 'ಕ್ಷಮಿಸಿ, ಈ ಹೆಸರಿನ ಜಿಲ್ಲೆ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಕರ್ನಾಟಕದ 31 ಜಿಲ್ಲೆಗಳಲ್ಲಿ ಒಂದನ್ನು ಆಯ್ಕೆ ಮಾಡಿ.'
              : `Unable to locate tourism data for '${districtId}'. Please explore another verified Karnataka district.`}
          </p>
          <button
            onClick={() => navigate('/#karnataka-map')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-800 text-white hover:bg-emerald-900 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>{lang === 'kn' ? 'ಜಿಲ್ಲಾ ನಕ್ಷೆಗೆ ಹಿಂತಿರುಗಿ' : 'Back to District Map'}</span>
          </button>
        </div>
      </div>
    );
  }

  const { district, counts, categories, suggestedRoutes } = districtData;

  // Filter destinations based on activeTab, selectedTaluk, and searchQuery
  let currentList = categories[activeTab] || categories.all || [];

  if (selectedTaluk !== 'all') {
    currentList = currentList.filter(p => (p.taluk || '').toLowerCase() === selectedTaluk.toLowerCase());
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    currentList = currentList.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.nameKannada || '').includes(q) ||
      (p.taluk || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }

  const tabOptions = [
    { id: 'all', label: lang === 'kn' ? 'ಎಲ್ಲಾ ತಾಣಗಳು' : 'All Destinations', count: counts.total, icon: Layers },
    { id: 'hiddenGems', label: lang === 'kn' ? 'ಗುಪ್ತ ರತ್ನಗಳು' : 'Hidden Gems', count: counts.hiddenGems, icon: Sparkles, gold: true },
    { id: 'heritage', label: lang === 'kn' ? 'ಪರಂಪರೆ & ಕೋಟೆ' : 'Heritage & Forts', count: counts.heritage, icon: Landmark },
    { id: 'spiritual', label: lang === 'kn' ? 'ಧಾರ್ಮಿಕ ತಾಣಗಳು' : 'Spiritual & Temples', count: counts.spiritual, icon: Flame },
    { id: 'nature', label: lang === 'kn' ? 'ನಿಸರ್ಗ & ಜಲಪಾತ' : 'Nature & Waterfalls', count: counts.nature, icon: Trees },
    { id: 'adventure', label: lang === 'kn' ? 'ಸಾಹಸ & ಚಾರಣ' : 'Adventure & Treks', count: counts.adventure, icon: Footprints },
    { id: 'culture', label: lang === 'kn' ? 'ಸಂಸ್ಕೃತಿ & ಕರಕುಶಲ' : 'Culture & Crafts', count: counts.culture, icon: Palette }
  ];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-emerald-950 text-white py-16 lg:py-24">
        {district.bannerImage && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay filter blur-[1px] transform scale-105"
            style={{ backgroundImage: `url(${district.bannerImage})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/80 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-4">
            <Link to="/" className="hover:text-emerald-300 transition-colors">
              {lang === 'kn' ? 'ಮುಖಪುಟ' : 'Home'}
            </Link>
            <ChevronRight size={14} className="text-emerald-600" />
            <Link to="/#karnataka-map" className="hover:text-emerald-300 transition-colors">
              {lang === 'kn' ? 'ಕರ್ನಾಟಕ ಜಿಲ್ಲೆಗಳು' : 'Karnataka Districts'}
            </Link>
            <ChevronRight size={14} className="text-emerald-600" />
            <span className="text-emerald-200">{district.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-900/60 border border-emerald-700/50 text-emerald-300">
                <MapPin size={14} />
                <span>{district.division} {lang === 'kn' ? 'ವಿಭಾಗ' : 'Division'}</span>
                <span>•</span>
                <span>{counts.total} {lang === 'kn' ? 'ದೃಢೀಕೃತ ತಾಣಗಳು' : 'Verified Destinations'}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white flex flex-wrap items-baseline gap-4">
                <span>{district.name}</span>
                <span className="text-2xl sm:text-3xl lg:text-4xl font-normal text-emerald-300 font-sans">
                  {district.nameKannada}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-emerald-100/90 max-w-3xl leading-relaxed">
                {lang === 'kn' ? district.descriptionKannada || district.description : district.description}
              </p>

              {/* Administrative Highlights Bar */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-emerald-200">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-emerald-400">{lang === 'kn' ? 'ಜಿಲ್ಲಾ ಕೇಂದ್ರ:' : 'Headquarters:'}</span>
                  <span>{district.headquarters}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-emerald-400">{lang === 'kn' ? 'ತಾಲೂಕುಗಳು:' : 'Taluks:'}</span>
                  <span>{district.taluks?.length || 0} ({district.taluks?.slice(0, 4).join(', ')}...)</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-emerald-400">{lang === 'kn' ? 'ಅತ್ಯುತ್ತಮ ಕಾಲ:' : 'Best Season:'}</span>
                  <span>{lang === 'kn' ? 'ಅಕ್ಟೋಬರ್ – ಮಾರ್ಚ್' : 'October to March'}</span>
                </div>
              </div>
            </div>

            {/* Live Weather & Quick Action Widget */}
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4">
              {district.weather && district.weather.available && (
                <div className="flex-1 bg-white/10 dark:bg-stone-900/60 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-white shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <CloudSun size={14} className="animate-pulse" />
                      {lang === 'kn' ? 'ನೈಜ ಹವಾಮಾನ' : 'Live District Weather'}
                    </span>
                    <span className="text-[11px] text-white/70">{district.headquarters}</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold">{district.weather.temperatureC}°C</span>
                    <span className="text-sm font-medium text-emerald-200">{district.weather.condition}</span>
                  </div>
                  <p className="text-xs text-white/70 mt-1">
                    {district.weather.conditionDescription} • {lang === 'kn' ? 'ಗಾಳಿ' : 'Wind'}: {district.weather.windSpeedKmH} km/h
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/map?district=${encodeURIComponent(district.name)}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-gold-500 hover:bg-gold-600 text-stone-950 shadow-lg hover:shadow-xl transition-all"
                >
                  <Compass size={16} />
                  <span>{lang === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ನಕ್ಷೆಯಲ್ಲಿ ವೀಕ್ಷಿಸಿ' : 'View on Smart Map'}</span>
                </button>
                <button
                  onClick={() => navigate(`/plan?destination=${encodeURIComponent(district.name)}`)}
                  className="inline-flex items-center justify-center px-4 py-3 rounded-xl font-semibold text-sm bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all"
                  title="Plan Trip with AI"
                >
                  <Calendar size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Suggested Travel Itineraries Carousel / Cards */}
      {suggestedRoutes && suggestedRoutes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedRoutes.map((route, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Clock size={14} />
                      {route.duration}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {lang === 'kn' ? 'ಶಿಫಾರಸು ಮಾಡಿದ ಯಾತ್ರೆ' : 'Recommended Circuit'}
                    </span>
                  </div>
                  <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-white mb-2">
                    {lang === 'kn' ? route.titleKannada || route.title : route.title}
                  </h3>
                  <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
                    {route.stops?.map((stop, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px]">
                          {sIdx + 1}
                        </span>
                        <span className="font-medium text-stone-800 dark:text-stone-200">
                          {stop.name} {lang === 'kn' && stop.nameKannada ? `(${stop.nameKannada})` : ''}
                        </span>
                        <span className="text-stone-400">• {stop.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-xs text-stone-500">
                    {lang === 'kn' ? 'AI ಪ್ರವಾಸ ಯೋಜಕದಲ್ಲಿ ತೆರೆಯಿರಿ' : 'Open in Pravasa AI Planner'}
                  </span>
                  <Link
                    to={`/plan?destination=${encodeURIComponent(district.name)}`}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>{lang === 'kn' ? 'ಯೋಜನೆ ಆರಂಭಿಸಿ' : 'Customize Route'}</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Explorer Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin border-b border-stone-200 dark:border-stone-800">
          {tabOptions.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? (tab.gold
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-emerald-800 text-white shadow-md')
                    : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          {/* Search inside district */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'kn' ? `${district.name} ತಾಣಗಳಲ್ಲಿ ಹುಡುಕಿ (ಕನ್ನಡ / English)...` : `Search destinations in ${district.name} (English or Kannada)...`}
              className="w-full pl-10 pr-4 py-2 text-sm bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white rounded-xl border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Taluk Filter Dropdown */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-stone-400" />
              <label className="text-xs font-semibold text-stone-600 dark:text-stone-300 whitespace-nowrap">
                {lang === 'kn' ? 'ತಾಲೂಕು:' : 'Taluk:'}
              </label>
              <select
                value={selectedTaluk}
                onChange={(e) => setSelectedTaluk(e.target.value)}
                className="bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 text-xs font-medium border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">{lang === 'kn' ? 'ಎಲ್ಲಾ ತಾಲೂಕುಗಳು' : 'All Taluks'}</option>
                {district.taluks?.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">
              {lang === 'kn' ? `${currentList.length} ತಾಣಗಳು` : `${currentList.length} destinations`}
            </div>
          </div>
        </div>

        {/* Destination Cards Grid */}
        {currentList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentList.map(place => (
              <DestinationCard
                key={place.id}
                place={place}
                onSelect={(p) => setSelectedPlace(p)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            <Compass size={40} className="mx-auto text-stone-400 mb-3" />
            <h4 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-200 mb-1">
              {lang === 'kn' ? 'ಯಾವುದೇ ತಾಣಗಳು ಕಂಡುಬಂದಿಲ್ಲ' : 'No destinations match your filter'}
            </h4>
            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto mb-4">
              {lang === 'kn'
                ? 'ಬೇರೆ ತಾಲೂಕು ಅಥವಾ ವರ್ಗವನ್ನು ಆಯ್ಕೆ ಮಾಡಲು ಪ್ರಯತ್ನಿಸಿ.'
                : 'Try selecting a different taluk or clearing your search keywords.'}
            </p>
            <button
              onClick={() => { setSelectedTaluk('all'); setSearchQuery(''); setActiveTab('all'); }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-800 text-white hover:bg-emerald-900 transition-colors"
            >
              {lang === 'kn' ? 'ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ' : 'Reset All Filters'}
            </button>
          </div>
        )}

        {/* Taluk Directory Overview Pills */}
        <div className="mt-16 bg-emerald-950/5 dark:bg-stone-900/40 rounded-2xl p-6 border border-emerald-900/10 dark:border-stone-800">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3">
            <MapPin size={16} />
            <span>{district.name} {lang === 'kn' ? 'ಆಡಳಿತಾತ್ಮಕ ತಾಲೂಕುಗಳು' : 'Administrative Taluks Directory'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {district.taluks?.map(talukName => (
              <button
                key={talukName}
                onClick={() => { setSelectedTaluk(talukName); setActiveTab('all'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedTaluk.toLowerCase() === talukName.toLowerCase()
                    ? 'bg-emerald-800 text-white font-semibold shadow-sm'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-emerald-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700'
                }`}
              >
                {talukName}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Destination Quick Details Modal */}
      {selectedPlace && (
        <DestinationModal
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}
    </div>
  );
}

