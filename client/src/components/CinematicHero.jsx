import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { ArrowRight, Volume2, VolumeX, Sparkles, Compass, MapPin, Route } from 'lucide-react';

const OFFICIAL_VIDEO_BANNER = "https://web-cms.karnatakatourism.org/wp-content/uploads/2026/09/Karnataka_Tourism_Banner_desktop.mp4";
const FALLBACK_POSTER = "https://images.unsplash.com/photo-1600100397608-f010e47c9451?auto=format&fit=crop&w=1920&q=80";

export default function CinematicHero() {
  const { lang, t } = useApp();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  const toggleAudio = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full min-h-[660px] lg:min-h-[780px] flex flex-col justify-between overflow-hidden bg-stone-950 text-white select-none">
      
      {/* Background Video Banner */}
      {!videoError ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          poster={FALLBACK_POSTER}
          onError={() => setVideoError(true)}
          className="absolute inset-0 w-full h-full object-cover scale-105 pointer-events-none"
        >
          <source src={OFFICIAL_VIDEO_BANNER} type="video/mp4" />
        </video>
      ) : (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${FALLBACK_POSTER})` }}
        />
      )}

      {/* Cinematic Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/35 pointer-events-none" />

      {/* Top spacing */}
      <div className="relative z-10 pt-16 sm:pt-20" />

      {/* Center Content: Pravasa AI "One State, Many Worlds" typography */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center flex flex-col items-center">
        
        {/* Uppercase Tracked State Title */}
        <p className="text-white text-xs sm:text-sm lg:text-base font-semibold uppercase tracking-[0.35em] mb-2 drop-shadow-md">
          {lang === 'kn' ? 'ಕ ರ್ ನಾ ಟ ಕ' : 'K A R N A T A K A'}
        </p>

        {/* Big Signature Italic Serif Heading */}
        <h1 className="font-serif italic text-white text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight leading-tight mb-8 drop-shadow-lg">
          {lang === 'kn' ? 'ಒಂದು ರಾಜ್ಯ, ಹಲವು ಜಗತ್ತುಗಳು' : 'One State, Many Worlds'}
        </h1>

        {/* Primary CTA: "Explore itineraries around you ➜" */}
        <button
          onClick={() => navigate('/plan')}
          className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-[#00473F] hover:bg-[#003831] text-white text-sm sm:text-base font-medium shadow-2xl transition-all duration-300 hover:scale-105 border border-white/20 mb-5"
        >
          <span>{lang === 'kn' ? 'ನಿಮ್ಮ ಸುತ್ತಲಿನ ಪ್ರವಾಸ ಯೋಜನೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ' : 'Explore itineraries around you'}</span>
          <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
            →
          </span>
        </button>

        {/* Sub-pills: "What's trending? | Explore Bengaluru | Business section" */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs sm:text-sm">
          <button
            onClick={() => scrollToSection('announcements-section')}
            className="px-4 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-105"
          >
            {lang === 'kn' ? 'ಟ್ರೆಂಡಿಂಗ್ ತಾಣಗಳು' : "What's trending?"}
          </button>
          <button
            onClick={() => navigate('/explore?q=Bengaluru')}
            className="px-4 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-105"
          >
            {lang === 'kn' ? 'ಬೆಂಗಳೂರು ಅನ್ವೇಷಿಸಿ' : 'Explore Bengaluru'}
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-105"
          >
            {lang === 'kn' ? 'ಸರ್ಕಾರಿ ವ್ಯವಹಾರ ವಿಭಾಗ' : 'Business section'}
          </button>
          <button
            onClick={() => scrollToSection('district-map-section')}
            className="px-4 py-1.5 rounded-full bg-amber-500/80 hover:bg-amber-500 text-stone-950 font-semibold backdrop-blur-md transition-all hover:scale-105"
          >
            {lang === 'kn' ? 'ಜಿಲ್ಲಾ ನಕ್ಷೆ' : 'Interactive Map'}
          </button>
        </div>

      </div>

      {/* Bottom Row: Audio Toggle (Left) + Pravasa AI Features Strip (Center) */}
      <div className="relative z-10 w-full px-4 sm:px-8 pb-6 pt-10 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/10 bg-gradient-to-t from-black/90 to-transparent">
        
        {/* Left: Audio Toggle Button */}
        <button
          onClick={toggleAudio}
          className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md border border-white/25 flex items-center justify-center text-white transition-transform hover:scale-110 shrink-0"
          title={isMuted ? 'Unmute video audio' : 'Mute video audio'}
          aria-label="Toggle video audio"
        >
          {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>

        {/* Center: Pravasa AI Feature Highlights */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 lg:gap-14">
          
          {/* Feature 1: AI Trip Planner */}
          <div className="flex items-center gap-3 max-w-[260px]">
            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#00473F] border-2 border-white/40 shadow-lg shrink-0 flex items-center justify-center">
              <Sparkles size={22} className="text-amber-400" />
            </div>
            <div className="text-left">
              <div className="font-bold text-xs sm:text-sm text-white leading-tight uppercase tracking-wide">
                {lang === 'kn' ? 'AI ಪ್ರವಾಸ ಯೋಜಕ' : 'AI Trip Planner'}
              </div>
              <div className="w-full h-[0.5px] bg-white/30 my-1" />
              <div className="text-[10px] sm:text-xs text-stone-300 leading-tight">
                {lang === 'kn' ? 'ಬಜೆಟ್ ಆಧಾರಿತ ಸ್ವಯಂಚಾಲಿತ ಯೋಜನೆ' : 'Budget-optimized itineraries with smart routing'}
              </div>
            </div>
          </div>

          {/* Feature 2: 31 Districts Explorer */}
          <div className="flex items-center gap-3 max-w-[260px]">
            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#00473F] border-2 border-white/40 shadow-lg shrink-0 flex items-center justify-center">
              <MapPin size={22} className="text-amber-400" />
            </div>
            <div className="text-left">
              <div className="font-bold text-xs sm:text-sm text-white leading-tight uppercase tracking-wide">
                {lang === 'kn' ? '31 ಜಿಲ್ಲೆಗಳ ನಕ್ಷೆ' : '31 Districts Explorer'}
              </div>
              <div className="w-full h-[0.5px] bg-white/30 my-1" />
              <div className="text-[10px] sm:text-xs text-stone-300 leading-tight">
                {lang === 'kn' ? 'ಸಂವಾದಾತ್ಮಕ ಜಿಲ್ಲಾ ನಕ್ಷೆ' : 'Interactive district map with verified destinations'}
              </div>
            </div>
          </div>

          {/* Feature 3: Smart Navigation */}
          <div className="flex items-center gap-3 max-w-[260px]">
            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#00473F] border-2 border-white/40 shadow-lg shrink-0 flex items-center justify-center">
              <Route size={22} className="text-amber-400" />
            </div>
            <div className="text-left">
              <div className="font-bold text-xs sm:text-sm text-white leading-tight uppercase tracking-wide">
                {lang === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ನ್ಯಾವಿಗೇಶನ್' : 'Smart Navigation'}
              </div>
              <div className="w-full h-[0.5px] bg-white/30 my-1" />
              <div className="text-[10px] sm:text-xs text-stone-300 leading-tight">
                {lang === 'kn' ? 'ನೈಜ-ಸಮಯ ಪ್ರವಾಸ ಮಾಹಿತಿ' : 'Real-time crowd data, SOS & travel alerts'}
              </div>
            </div>
          </div>

        </div>

        {/* Right spacing balance */}
        <div className="w-10 hidden md:block" />

      </div>

    </section>
  );
}
