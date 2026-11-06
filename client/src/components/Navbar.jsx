import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import {
  Search,
  Volume2,
  Globe,
  Sun,
  Moon,
  User,
  Shield,
  Menu,
  X,
  PhoneCall,
  Sparkles,
  MapPin,
  Map
} from 'lucide-react';

export default function Navbar() {
  const { t, lang, changeLang, theme, toggleTheme, user, signOut, showToast } = useApp();
  const loc = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;
    navigate(`/explore?q=${encodeURIComponent(quickQuery.trim())}`);
    setQuickQuery('');
    setSearchOpen(false);
  };

  const isActive = (to) => to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to);

  return (
    <header className="sticky top-0 z-[250] bg-white/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors duration-200 shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: Pravasa AI Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 text-decoration-none group">
            <div className="bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-xs flex items-center gap-2.5 hover:shadow-md transition-shadow">
              <div className="w-9 h-9 rounded-lg bg-[#00473F] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                P
              </div>
              <div>
                <div className="font-serif font-bold text-sm text-[#00473F] leading-tight">
                  Pravasa AI
                </div>
                <div className="text-[10px] text-stone-500 font-sans uppercase tracking-wider">
                  {lang === 'kn' ? 'ಕರ್ನಾಟಕ ಪ್ರವಾಸೋದ್ಯಮ AI' : 'Karnataka Travel Intelligence'}
                </div>
              </div>
            </div>
          </Link>

          {/* Center Navigation Links (Official Karnataka Tourism Structure) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <Link
              to="/explore"
              className={`px-3.5 py-2 rounded-full text-xs xl:text-sm font-semibold transition-colors ${
                isActive('/explore') ? 'text-[#00473F] dark:text-[#F6B918] bg-emerald-50 dark:bg-emerald-950/60' : 'text-stone-700 dark:text-stone-200 hover:text-[#00473F] dark:hover:text-[#F6B918]'
              }`}
            >
              {lang === 'kn' ? 'ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು' : 'Where to go'}
            </Link>

            <Link
              to="/plan"
              className={`px-3.5 py-2 rounded-full text-xs xl:text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                isActive('/plan') ? 'text-[#00473F] dark:text-[#F6B918] bg-emerald-50 dark:bg-emerald-950/60' : 'text-stone-700 dark:text-stone-200 hover:text-[#00473F] dark:hover:text-[#F6B918]'
              }`}
            >
              <Sparkles size={13} className="text-amber-500" />
              <span>{lang === 'kn' ? 'AI ಪ್ರವಾಸ ಯೋಜಕ' : 'AI Trip Planner'}</span>
            </Link>

            <Link
              to="/map"
              className={`px-3.5 py-2 rounded-full text-xs xl:text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                isActive('/map') ? 'text-[#00473F] dark:text-[#F6B918] bg-emerald-50 dark:bg-emerald-950/60' : 'text-stone-700 dark:text-stone-200 hover:text-[#00473F] dark:hover:text-[#F6B918]'
              }`}
            >
              <Map size={13} className="text-[#00473F] dark:text-emerald-400" />
              <span>{lang === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ನಕ್ಷೆ' : 'Smart Map'}</span>
            </Link>

            <Link
              to="/news"
              className={`px-3.5 py-2 rounded-full text-xs xl:text-sm font-semibold transition-colors ${
                isActive('/news') ? 'text-[#00473F] dark:text-[#F6B918] bg-emerald-50 dark:bg-emerald-950/60' : 'text-stone-700 dark:text-stone-200 hover:text-[#00473F] dark:hover:text-[#F6B918]'
              }`}
            >
              {lang === 'kn' ? 'ಹೊಸ ಸುದ್ದಿಗಳು' : "What's new"}
            </Link>

            <Link
              to="/admin"
              className={`px-3.5 py-2 rounded-full text-xs xl:text-sm font-semibold transition-colors ${
                isActive('/admin') ? 'text-[#00473F] dark:text-[#F6B918] bg-emerald-50 dark:bg-emerald-950/60' : 'text-stone-700 dark:text-stone-200 hover:text-[#00473F] dark:hover:text-[#F6B918]'
              }`}
            >
              {lang === 'kn' ? 'ಸರ್ಕಾರಿ ವ್ಯವಹಾರ' : 'Business & Partnership'}
            </Link>

            <Link
              to="/gems"
              className={`px-3.5 py-2 rounded-full text-xs xl:text-sm font-semibold transition-colors ${
                isActive('/gems') ? 'text-[#00473F] dark:text-[#F6B918] bg-emerald-50 dark:bg-emerald-950/60' : 'text-stone-700 dark:text-stone-200 hover:text-[#00473F] dark:hover:text-[#F6B918]'
              }`}
            >
              {lang === 'kn' ? 'ಗುಪ್ತ ತಾಣಗಳು' : 'Hidden Gems'}
            </Link>
          </nav>

          {/* Right Action Icons (Matching Official karnatakatourism.org layout) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* SOS 112 Official Emergency Button */}
            <Link to="/sos">
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-[#C9352B] hover:bg-[#b02a21] shadow-xs transition-transform hover:scale-105"
                title="24/7 Tourism Emergency Assistance"
              >
                <PhoneCall size={12} className="animate-pulse" />
                <span>SOS</span>
              </button>
            </Link>

            {/* Search Icon Trigger */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-full text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Search destinations"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>

            {/* Bilingual EN / KN Language Switcher */}
            <button
              onClick={() => changeLang(lang === 'en' ? 'kn' : 'en')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-300 dark:border-stone-700 transition-colors"
              title={lang === 'en' ? 'ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ' : 'Switch to English'}
            >
              <Globe size={13} className="text-[#00473F] dark:text-[#F6B918]" />
              <span>{lang === 'en' ? 'ಕನ್ನಡ' : 'EN'}</span>
            </button>

            <span className="text-stone-300 dark:text-stone-700 hidden sm:inline">|</span>

            {/* Login / User Account / Logout */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/profile"
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 transition-colors flex items-center gap-1.5"
                  title={user.email}
                >
                  <User size={13} />
                  <span className="truncate max-w-[85px]">{user.name?.split(' ')[0] || 'User'}</span>
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="px-2.5 py-1.5 rounded-full text-xs font-bold bg-[#00473F] text-white hover:bg-[#003832] transition-colors"
                  >
                    Gov Admin
                  </Link>
                )}
                <button
                  onClick={async () => {
                    await signOut();
                    showToast(lang === 'kn' ? 'ಯಶಸ್ವಿಯಾಗಿ ಲಾಗ್‌ಔಟ್ ಆಗಿದ್ದೀರಿ' : 'Signed out successfully');
                  }}
                  className="px-2.5 py-1.5 rounded-full text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors"
                  title="Sign out of account"
                >
                  {lang === 'kn' ? 'ನಿರ್ಗಮಿಸಿ' : 'Logout'}
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-1.5 rounded-full text-xs font-bold border-2 border-stone-800 dark:border-stone-200 text-stone-900 dark:text-white hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-950 transition-all shadow-xs"
              >
                {lang === 'kn' ? 'ಲಾಗಿನ್' : 'Login'}
              </Link>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

          </div>

        </div>

        {/* Expandable Search Input Row */}
        {searchOpen && (
          <form onSubmit={handleSearchSubmit} className="py-3 pb-4 border-t border-stone-100 dark:border-stone-800 animate-fade-in flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                autoFocus
                value={quickQuery}
                onChange={e => setQuickQuery(e.target.value)}
                placeholder={lang === 'kn' ? 'ಕರ್ನಾಟಕದ 31 ಜಿಲ್ಲೆಗಳು, ದೇವಾಲಯಗಳು, ಜಲಪಾತಗಳು ಹುಡುಕಿ...' : 'Search 31 districts, temples, heritage, waterfalls...'}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-full bg-stone-100 dark:bg-stone-900 text-stone-900 dark:text-white border border-stone-300 dark:border-stone-700 outline-none focus:border-[#00473F]"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 rounded-full text-xs font-bold bg-[#00473F] text-white hover:bg-emerald-950 transition-colors"
            >
              {lang === 'kn' ? 'ಹುಡುಕಿ' : 'Search'}
            </button>
          </form>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="lg:hidden py-4 border-t border-stone-200 dark:border-stone-800 space-y-1 animate-fade-in">
            <Link
              to="/explore"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-800 dark:text-stone-200 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              {lang === 'kn' ? 'ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು (ಅನ್ವೇಷಿಸಿ)' : 'Where to go (Explore)'}
            </Link>
            <Link
              to="/plan"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              ✨ {lang === 'kn' ? 'AI ಪ್ರವಾಸ ಯೋಜಕ' : 'AI Trip Planner'}
            </Link>
            <Link
              to="/map"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-800 dark:text-stone-200 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              🗺️ {lang === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ನಕ್ಷೆ' : 'Smart Map'}
            </Link>
            <Link
              to="/gems"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-800 dark:text-stone-200 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              💎 {lang === 'kn' ? 'ಗುಪ್ತ ತಾಣಗಳು' : 'Hidden Gems'}
            </Link>
            <Link
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-800 dark:text-stone-200 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              🏛️ {lang === 'kn' ? 'ಸರ್ಕಾರಿ ವ್ಯವಹಾರ ವಿಭಾಗ' : 'Business & Partnership'}
            </Link>
          </div>
        )}

      </div>
    </header>
  );
}
