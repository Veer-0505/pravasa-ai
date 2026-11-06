import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import {
  MapPin,
  ArrowRight,
  Compass,
  Shield,
  Landmark,
  TreePine,
  Mountain,
  Waves,
  Bird,
  Utensils,
  Droplets,
  Sparkles,
  Calendar,
  Newspaper,
  Star,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  HelpCircle,
  Camera,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';
import CinematicHero from '../components/CinematicHero';
import KarnatakaDistrictExplorerMap from '../components/KarnatakaDistrictExplorerMap';
import DestinationCard from '../components/DestinationCard';
import DestinationModal from '../components/DestinationModal';
import { fetchPlaces } from '../utils';
import { subscribeToDestinations } from '../supabase';
import {
  TREKKING_DESTINATIONS,
  WILDLIFE_SANCTUARIES,
  CULTURAL_FESTIVALS,
  OFFICIAL_TRAVEL_SERVICES
} from '../data/tourismModulesData';
import { NEUTRAL_PLACEHOLDER_SVG, getSafeDestinationImage } from '../utils/media';

// Official Announcements (Matching karnatakatourism.org 1:1)
const OFFICIAL_ANNOUNCEMENTS = [
  {
    id: 'ann_1',
    title: 'Celebrating Excellence: Inaugural Karnataka Tourism Awards 2026 Hits Bengaluru',
    titleKn: 'ಕರ್ನಾಟಕ ಪ್ರವಾಸೋದ್ಯಮ ಪ್ರಶಸ್ತಿಗಳು 2026: ಬೆಂಗಳೂರಿನಲ್ಲಿ ಅದ್ಧೂರಿ ಸಮಾರಂಭ',
    date: '27 Sep 2026',
    image: '/announcements/awards.jpg',
    fallbackImg: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    link: '/news'
  },
  {
    id: 'ann_2',
    title: 'Latest Homestay Guidelines and Circular for Registration & Verification',
    titleKn: 'ಕರ್ನಾಟಕ ಹೋಮ್‌ಸ್ಟೇ ನೋಂದಣಿ ಮತ್ತು ಪರಿಶೀಲನೆಗೆ ಇತ್ತೀಚಿನ ನಿಯಮಾವಳಿಗಳು',
    date: '1 Sep 2026',
    image: '/announcements/homestay.png',
    fallbackImg: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80',
    link: '/news'
  },
  {
    id: 'ann_3',
    title: 'Karnataka Darshana: Student Educational Tour Packages Announced',
    titleKn: 'ಕರ್ನಾಟಕ ದರ್ಶನ: ವಿದ್ಯಾರ್ಥಿಗಳ ಶೈಕ್ಷಣಿಕ ಪ್ರವಾಸ ಯೋಜನೆ ಘೋಷಣೆ',
    date: '1 Jun 2026',
    image: '/announcements/darshana.jpg',
    fallbackImg: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80',
    link: '/news'
  }
];

// 6 Official Themes (from karnatakatourism.org "Pick Your Travel Theme")
const OFFICIAL_THEMES = [
  { id: 'heritage', Icon: Landmark, label: 'Heritage, History and Culture', labelKn: 'ಪರಂಪರೆ, ಇತಿಹಾಸ & ಸಂಸ್ಕೃತಿ', query: 'heritage' },
  { id: 'adventure', Icon: Mountain, label: 'Adventure Activities', labelKn: 'ಸಾಹಸ ಕ್ರೀಡೆಗಳು', query: 'adventure' },
  { id: 'wildlife', Icon: Bird, label: 'Wildlife & Safari', labelKn: 'ವನ್ಯಜೀವಿ & ಸಫಾರಿ', query: 'wildlife' },
  { id: 'food', Icon: Utensils, label: 'Food & Culinary', labelKn: 'ಆಹಾರ & ಸಾಂಪ್ರದಾಯಿಕ ರುಚಿ', query: 'food' },
  { id: 'nature', Icon: Waves, label: 'Tranquility & Nature', labelKn: 'ಪ್ರಶಾಂತತೆ & ಪ್ರಕೃತಿ ಸೌಂದರ್ಯ', query: 'nature' },
  { id: 'luxury', Icon: Sparkles, label: 'Luxury and Grandeur', labelKn: 'ವೈಭವ ಮತ್ತು ರಾಜಾತಿಥ್ಯ', query: 'heritage' }
];

const FAQS = [
  {
    q: 'Do I need prior permission for trekking in Kudremukh or Kumara Parvatha?',
    qKn: 'ಕುದುರೆಮುಖ ಅಥವಾ ಕುಮಾರ ಪರ್ವತ ಚಾರಣಕ್ಕೆ ಮುಂಗಡ ಅನುಮತಿ ಅಗತ್ಯವಿದೆಯೇ?',
    a: 'Yes. The Karnataka Forest Department strictly limits footfall to 50 trekkers per day in Kudremukh. Online pre-booking via the official Aranya portal is mandatory. Camping inside the reserve is strictly prohibited.',
    aKn: 'ಹೌದು. ಕುದುರೆಮುಖದಲ್ಲಿ ಪರಿಸರ ರಕ್ಷಣೆಗಾಗಿ ದಿನಕ್ಕೆ ಕೇವಲ 50 ಜನರಿಗೆ ಮಾತ್ರ ಅವಕಾಶವಿದೆ. ಅರಣ್ಯ ಇಲಾಖೆಯ ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ ಮೂಲಕ ಮುಂಗಡ ಇಕೋ-ಪರವಾನಗಿ ಕಡ್ಡಾಯ.'
  },
  {
    q: 'What are the Archaeological Survey of India (ASI) closing hours for Hampi monuments?',
    qKn: 'ಹಂಪಿಯ ಪ್ರಾಚ್ಯವಸ್ತು ಸಂಶೋಧನಾ ಇಲಾಖೆಯ (ASI) ಸ್ಮಾರಕಗಳು ಯಾವಾಗ ಮುಚ್ಚುತ್ತವೆ?',
    a: 'Per ASI regulations, ticketed monument enclosures (such as Vijaya Vittala Stone Chariot and Zenana Enclosure) open at sunrise and strictly close at 6:00 PM (sunset) daily for archaeological conservation.',
    aKn: 'ASI ನಿಯಮಾವಳಿಗಳ ಪ್ರಕಾರ, ಹಂಪಿಯ ಸಂರಕ್ಷಿತ ಸ್ಮಾರಕ ಆವರಣಗಳು ಸೂರ್ಯೋದಯಕ್ಕೆ ತೆರೆದು ಸಂಜೆ 6:00 ಗಂಟೆಗೆ (ಸೂರ್ಯಾಸ್ತಕ್ಕೆ) ಕಡ್ಡಾಯವಾಗಿ ಮುಚ್ಚಲ್ಪಡುತ್ತವೆ.'
  },
  {
    q: 'How does Pravasa AI calculate trip budgets and travel times?',
    qKn: 'ಪ್ರವಾಸ AI ಬಜೆಟ್ ಮತ್ತು ಪ್ರಯಾಣದ ಸಮಯವನ್ನು ಹೇಗೆ ಲೆಕ್ಕಾಚಾರ ಮಾಡುತ್ತದೆ?',
    a: 'Our grounded trip planner uses real verified road networks (NHAI data), official KSTDC stay rates, authentic ASI entry fees, and Open-Meteo seasonal conditions to create practical, unhallucinated itineraries.',
    aKn: 'ನಮ್ಮ ಯೋಜಕವು ನಿಜವಾದ ರಸ್ತೆ ದೂರ, ಅಧಿಕೃತ ಪ್ರವೇಶ ಶುಲ್ಕಗಳು ಮತ್ತು ಹೋಟೆಲ್ ದರಗಳನ್ನು ಆಧರಿಸಿ ವಾಸ್ತವಿಕ ದಿನವಾರು ವೇಳಾಪಟ್ಟಿಯನ್ನು ತಯಾರಿಸುತ್ತದೆ.'
  }
];

export default function Home() {
  const { lang, t, showToast } = useApp();
  const navigate = useNavigate();

  const [places, setPlaces] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [gems, setGems] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [faqOpen, setFaqOpen] = useState(null);

  useEffect(() => {
    fetchPlaces()
      .then(data => {
        setPlaces(data);
        setFeatured(data.filter(p => !p.offbeat && !['district', 'taluk'].includes(p.place_type)).slice(0, 8));
        setGems(data.filter(p => p.offbeat).slice(0, 4));
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const unsubscribe = subscribeToDestinations(() => {
      fetchPlaces()
        .then(data => {
          setPlaces(data);
          setFeatured(data.filter(p => !p.offbeat && !['district', 'taluk'].includes(p.place_type)).slice(0, 8));
          setGems(data.filter(p => p.offbeat).slice(0, 4));
        })
        .catch(() => {});
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    showToast(lang === 'kn' ? 'ಚಂದಾದಾರರಾಗಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು!' : 'Thank you for subscribing to Pravasa AI updates!');
    setNewsletterEmail('');
  };

  return (
    <div className="bg-[#fcfbf9] dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors">
      
      {/* 1. Official Karnataka Tourism Cinematic Hero Banner */}
      <CinematicHero />

      {/* 2. Official Announcements Carousel (Matches karnatakatourism.org 1:1) */}
      <section id="announcements-section" className="py-12 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#00473F] dark:text-emerald-400 flex items-center justify-center font-bold text-base">
              📢
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white">
              {lang === 'kn' ? 'ಪ್ರಕಟಣೆಗಳು' : 'Announcements'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/news')}
              className="w-10 h-10 rounded-full bg-[#00473F] text-white flex items-center justify-center hover:bg-emerald-950 transition-transform hover:scale-105 shadow-md"
              title="View all announcements"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* 3 Announcement Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {OFFICIAL_ANNOUNCEMENTS.map(ann => (
            <div
              key={ann.id}
              onClick={() => navigate(ann.link)}
              className="group bg-white dark:bg-stone-900 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="h-48 w-full overflow-hidden bg-stone-200 dark:bg-stone-800">
                <img
                  src={ann.image}
                  alt={ann.title}
                  onError={(e) => { e.currentTarget.src = ann.fallbackImg; }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900 dark:text-white group-hover:text-[#00473F] dark:group-hover:text-[#F6B918] transition-colors leading-snug mb-3">
                  {lang === 'kn' ? ann.titleKn : ann.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 font-medium pt-2 border-t border-stone-100 dark:border-stone-800">
                  <Calendar size={13} className="text-[#00473F] dark:text-emerald-400" />
                  <span>{ann.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Favourite Destinations (Exact 1:1 section from official site) */}
      <section className="py-14 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto border-b border-stone-200 dark:border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#00473F] dark:text-[#F6B918] mb-1 block">
              {lang === 'kn' ? 'ಜನಪ್ರಿಯ ಸ್ಥಳಗಳು' : 'Must-Visit Places'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-white">
              {lang === 'kn' ? 'ಮೆಚ್ಚಿನ ಪ್ರವಾಸಿ ತಾಣಗಳು' : 'Favourite Destinations'}
            </h2>
          </div>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white hover:bg-stone-100 transition-colors shadow-xs"
          >
            <span>{lang === 'kn' ? 'ಎಲ್ಲಾ ತಾಣಗಳನ್ನು ನೋಡಿ ➜' : 'View All Destinations ➜'}</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 rounded-2xl skeleton" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.slice(0, 8).map(place => (
              <DestinationCard key={place.id} place={place} onClick={setSelectedPlace} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Explore Karnataka: 1:1 District Map (Matches user's screenshot exactly!) */}
      <div id="district-map-section">
        <KarnatakaDistrictExplorerMap onSelectPlace={(p) => setSelectedPlace(p)} />
      </div>

      {/* 5. Pick Your Travel Theme (Official Karnataka Tourism Themes) */}
      <section className="py-16 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto border-b border-stone-200 dark:border-stone-800">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#00473F] dark:text-[#F6B918] mb-1 block">
            {lang === 'kn' ? 'ಪ್ರವಾಸದ ವಿಷಯವಾರು ಆಯ್ಕೆ' : 'Curated Travel Themes'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-white">
            {lang === 'kn' ? 'ನಿಮ್ಮ ಪ್ರವಾಸದ ವಿಷಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Pick Your Travel Theme'}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {OFFICIAL_THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => navigate(`/explore?category=${theme.query}`)}
              className="group p-5 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-[#00473F] dark:hover:border-[#F6B918] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center justify-between min-h-[170px]"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#00473F] dark:text-[#F6B918] flex items-center justify-center group-hover:scale-110 transition-transform mb-3 shadow-xs">
                <theme.Icon size={26} />
              </div>
              <h3 className="font-serif font-bold text-xs sm:text-sm text-stone-900 dark:text-white group-hover:text-[#00473F] dark:group-hover:text-[#F6B918] transition-colors leading-snug">
                {lang === 'kn' ? theme.labelKn : theme.label}
              </h3>
            </button>
          ))}
        </div>
      </section>

      {/* 6. Upcoming Events & Cultural Festivals */}
      <section className="py-16 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto border-b border-stone-200 dark:border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#00473F] dark:text-[#F6B918] mb-1 block">
              {lang === 'kn' ? 'ಸಾಂಸ್ಕೃತಿಕ ಹಬ್ಬಗಳು' : 'Festivals & Living Traditions'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-white">
              {lang === 'kn' ? 'ಮುಂಬರುವ ಸಾಂಸ್ಕೃತಿಕ ಉತ್ಸವಗಳು' : 'Upcoming Events & Festivals'}
            </h2>
          </div>
          <Link
            to="/festivals"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white hover:bg-stone-100 transition-colors shadow-xs"
          >
            <span>{lang === 'kn' ? 'ಪೂರ್ಣ ಕ್ಯಾಲೆಂಡರ್ ➜' : 'Full Festival Calendar ➜'}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CULTURAL_FESTIVALS.slice(0, 3).map(fest => (
            <div
              key={fest.id}
              onClick={() => navigate('/festivals')}
              className="group cursor-pointer bg-white dark:bg-stone-900 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="h-48 w-full overflow-hidden relative bg-stone-200">
                <img
                  src={getSafeDestinationImage(fest.image) || NEUTRAL_PLACEHOLDER_SVG}
                  alt={fest.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="text-lg font-serif font-bold leading-tight">{fest.title}</div>
                  <div className="text-xs text-amber-300 font-sans mt-0.5">{fest.month} • {fest.venue}</div>
                </div>
              </div>
              <div className="p-4 text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                {lang === 'kn' ? fest.descriptionKannada : fest.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Your One-Stop Travel Resource Hub (Official Karnataka Tourism Resource Hub) */}
      <section className="py-16 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-2xl mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#00473F] dark:text-[#F6B918] mb-1 block">
            {lang === 'kn' ? 'ಪ್ರವಾಸ ಸಂಪನ್ಮೂಲಗಳು' : 'Travel Resource Hub'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-white">
            {lang === 'kn' ? 'ನಿಮ್ಮ ಸಂಪೂರ್ಣ ಪ್ರವಾಸ ಸಂಪನ್ಮೂಲ ಕೇಂದ್ರ' : 'Your One-Stop Travel Resource Hub'}
          </h2>
          <p className="text-stone-600 dark:text-stone-300 text-sm mt-2">
            {lang === 'kn'
              ? 'ಸರ್ಕಾರ ಅನುಮೋದಿತ ಹೋಮ್‌ಸ್ಟೇಗಳು, KSTDC ಹೋಟೆಲ್‌ಗಳು, ಅಧಿಕೃತ ಪ್ರವಾಸಿ ಮಾರ್ಗದರ್ಶಿಗಳು ಮತ್ತು ಪ್ರವಾಸಿ ಮಿತ್ರ (ಪೊಲೀಸ್) ಸೇವೆಗಳು.'
              : 'Verified government homestays, KSTDC accommodations, certified tour operators, and Tourist Mitra (Tourist Police).'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {OFFICIAL_TRAVEL_SERVICES.map(srv => (
            <a
              key={srv.id}
              href={srv.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-[#00473F] shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 mb-3 uppercase tracking-wider">
                  {srv.badge}
                </span>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white mb-2 group-hover:text-[#00473F] dark:group-hover:text-[#F6B918] transition-colors">
                  {lang === 'kn' ? srv.titleKannada : srv.title}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed mb-4">
                  {lang === 'kn' ? srv.descKannada : srv.desc}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#00473F] dark:text-[#F6B918] pt-3 border-t border-stone-100 dark:border-stone-800">
                <span>{lang === 'kn' ? 'ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ➜' : 'Official Portal ➜'}</span>
                <ExternalLink size={13} />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 8. Frequently Asked Questions */}
      <section className="py-16 px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#00473F] dark:text-[#F6B918] mb-1 block">
            {lang === 'kn' ? 'ಪ್ರಶ್ನೋತ್ತರಗಳು' : 'Visitor Guidance'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white">
            {lang === 'kn' ? 'ಪ್ರವಾಸಿಗರ ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೋತ್ತರಗಳು' : 'Frequently Asked Questions'}
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-2xs"
            >
              <button
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-stone-900 dark:text-white"
              >
                <span>{lang === 'kn' ? faq.qKn : faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-stone-400 transition-transform duration-200 shrink-0 ${
                    faqOpen === idx ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </button>
              {faqOpen === idx && (
                <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed border-t border-stone-100 dark:border-stone-800 pt-3">
                  {lang === 'kn' ? faq.aKn : faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 9. Newsletter Subscription */}
      <section className="py-16 px-4 sm:px-6 max-w-[1440px] mx-auto">
        <div className="bg-[#00473F] text-white rounded-3xl p-8 sm:p-14 text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-[#F6B918] text-stone-950 uppercase tracking-wider">
              {lang === 'kn' ? 'ಪ್ರವಾಸೋದ್ಯಮ ಮಾಹಿತಿ ಪತ್ರ' : 'Stay Connected'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold">
              {lang === 'kn' ? 'ಕರ್ನಾಟಕ ಪ್ರವಾಸೋದ್ಯಮದ ಇತ್ತೀಚಿನ ಸುದ್ದಿಗಳು' : 'Stay in the loop with Pravasa AI'}
            </h2>
            <p className="text-stone-200 text-xs sm:text-sm leading-relaxed">
              {lang === 'kn'
                ? 'ಹೊಸ ಚಾರಣ ಮಾರ್ಗಗಳು, ಹವಾಮಾನ ಮುನ್ನೆಚ್ಚರಿಕೆಗಳು, ಮತ್ತು ಹಂಪಿ-ದಸರಾ ಉತ್ಸವ ದಿನಾಂಕಗಳನ್ನು ನೇರವಾಗಿ ಇಮೇಲ್ ಮೂಲಕ ಪಡೆಯಿರಿ.'
                : 'Get official festival dates, weather advisories, seasonal waterfall clearances, and cultural events delivered to your inbox.'}
            </p>

            <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto pt-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                placeholder={lang === 'kn' ? 'ನಿಮ್ಮ ಇಮೇಲ್ ವಿಳಾಸ...' : 'Enter your email...'}
                className="flex-1 py-3 px-5 rounded-full text-sm bg-white/10 text-white placeholder:text-stone-300 border border-white/20 outline-none focus:border-[#F6B918]"
                required
              />
              <button
                type="submit"
                className="py-3 px-7 rounded-full font-bold text-sm bg-[#F6B918] hover:bg-[#e2a814] text-stone-950 shadow-md transition-all shrink-0"
              >
                {lang === 'kn' ? 'ಚಂದಾದಾರರಾಗಿ' : 'Subscribe'}
              </button>
            </form>
          </div>
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        </div>
      </section>

      {/* Destination Modal */}
      {selectedPlace && (
        <DestinationModal
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onAddToTrip={(p) => { navigate(`/plan?place=${p.id}`); setSelectedPlace(null); }}
        />
      )}

    </div>
  );
}
