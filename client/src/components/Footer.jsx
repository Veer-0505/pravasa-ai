import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Compass, PhoneCall, ShieldCheck, Heart, MapPin, ExternalLink, Globe } from 'lucide-react';

export default function Footer() {
  const { lang, t } = useApp();

  return (
    <footer className="footer bg-stone-950 text-stone-400 border-t border-stone-800 py-12 px-4 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-700 to-amber-500 flex items-center justify-center text-white font-black text-base shadow-sm">
                P
              </div>
              <span className="font-serif font-bold text-xl text-white">
                {t('appName')} <span className="text-amber-400 text-xs font-sans">v0.2.0</span>
              </span>
            </div>

            <p className="text-xs leading-relaxed text-stone-400 max-w-sm">
              {lang === 'kn'
                ? 'ಕರ್ನಾಟಕದ ಎಲ್ಲಾ 31 ಜಿಲ್ಲೆಗಳಿಗೆ AI-ಆಧಾರಿತ, ಅಧಿಕೃತ ಮತ್ತು ಪರಿಶೀಲಿತ ಪ್ರವಾಸೋದ್ಯಮ ತಂತ್ರಜ್ಞಾನ ವೇದಿಕೆ. ಹಂಪಿಯಿಂದ ಮಲೆನಾಡಿನ ಕಾಫಿ ಬೆಟ್ಟಗಳು ಮತ್ತು ಅರಬ್ಬೀ ಕಡಲ ತೀರಗಳವರೆಗೆ.'
                : 'Full-stack, data-grounded tourism intelligence platform for Karnataka, India. Verified spatial records, live Open-Meteo weather, ASI monument rules, and bilingual travel planning.'}
            </p>

            <div className="pt-2 text-xs text-stone-300 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <PhoneCall size={13} />
                <span>Karnataka Tourist Helpline: 1800-425-4425</span>
              </div>
              <div className="flex items-center gap-2 text-rose-400 font-semibold">
                <PhoneCall size={13} />
                <span>National Emergency Response: 112</span>
              </div>
            </div>
          </div>

          {/* Col 2: Discovery */}
          <div className="space-y-3">
            <div className="footer-heading text-white font-bold text-sm tracking-wide">
              {lang === 'kn' ? 'ಪ್ರವಾಸ ಅನ್ವೇಷಣೆ' : 'Tourism Discovery'}
            </div>
            <div className="flex flex-col space-y-2 text-xs">
              <Link to="/explore" className="hover:text-amber-400 transition-colors">{lang === 'kn' ? 'ಎಲ್ಲಾ ತಾಣಗಳು' : 'All Destinations'}</Link>
              <Link to="/map" className="hover:text-amber-400 transition-colors">{lang === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ನಕ್ಷೆ' : 'Interactive Smart Map'}</Link>
              <Link to="/gems" className="hover:text-amber-400 transition-colors">{lang === 'kn' ? 'ಗುಪ್ತ ತಾಣಗಳು' : 'Hidden Gems'}</Link>
              <Link to="/trekking" className="hover:text-amber-400 transition-colors">{lang === 'kn' ? 'ಚಾರಣ & ಸಾಹಸ' : 'Trekking & Adventure'}</Link>
              <Link to="/wildlife" className="hover:text-amber-400 transition-colors">{lang === 'kn' ? 'ವನ್ಯಜೀವಿ ಸಫಾರಿ' : 'Wildlife & Safaris'}</Link>
            </div>
          </div>

          {/* Col 3: Culture & Planner */}
          <div className="space-y-3">
            <div className="footer-heading text-white font-bold text-sm tracking-wide">
              {lang === 'kn' ? 'ಯೋಜನೆ ಮತ್ತು ಸಂಸ್ಕೃತಿ' : 'Planning & Culture'}
            </div>
            <div className="flex flex-col space-y-2 text-xs">
              <Link to="/plan" className="hover:text-amber-400 transition-colors">{lang === 'kn' ? 'AI ಪ್ರವಾಸ ಯೋಜಕ' : 'AI Travel Planner'}</Link>
              <Link to="/festivals" className="hover:text-amber-400 transition-colors">{lang === 'kn' ? 'ಉತ್ಸವಗಳು & ಸಂಸ್ಕೃತಿ' : 'Festivals & Culture'}</Link>
              <Link to="/news" className="hover:text-amber-400 transition-colors">{lang === 'kn' ? 'ಪ್ರವಾಸೋದ್ಯಮ ಸುದ್ದಿ' : 'Tourism News & Advisories'}</Link>
              <Link to="/reviews" className="hover:text-amber-400 transition-colors">{lang === 'kn' ? 'ಪ್ರವಾಸಿಗರ ವಿಮರ್ಶೆಗಳು' : 'Traveler Reviews'}</Link>
              <Link to="/crowd" className="hover:text-amber-400 transition-colors">{lang === 'kn' ? 'ಜನಸಂದಣಿ ವಿವರ' : 'Crowd Intelligence'}</Link>
            </div>
          </div>

          {/* Col 4: Official Links & Portals */}
          <div className="space-y-3">
            <div className="footer-heading text-white font-bold text-sm tracking-wide">
              {lang === 'kn' ? 'ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್‌ಗಳು' : 'Official Portals'}
            </div>
            <div className="flex flex-col space-y-2 text-xs">
              <a href="https://karnatakatourism.org" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                <span>Karnataka Tourism</span> <ExternalLink size={10} />
              </a>
              <a href="https://ksrtc.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                <span>KSRTC Bus Booking</span> <ExternalLink size={10} />
              </a>
              <a href="https://kstdc.co" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                <span>KSTDC Mayura Hotels</span> <ExternalLink size={10} />
              </a>
              <a href="https://junglelodges.com" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                <span>Jungle Lodges & Resorts</span> <ExternalLink size={10} />
              </a>
              <a href="https://aranyaviation.karnataka.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                <span>Forest Eco-Permits</span> <ExternalLink size={10} />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Line */}
        <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            &copy; {new Date().getFullYear()} Pravasa AI (v0.2.0). {lang === 'kn' ? 'ಕರ್ನಾಟಕ ಪ್ರವಾಸೋದ್ಯಮ AI ವೇದಿಕೆ.' : 'AI-Powered Karnataka Travel Intelligence.'}
          </div>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-stone-300">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-stone-300">Terms of Service</Link>
            <Link to="/sos" className="hover:text-rose-400 font-semibold">SOS 112</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
