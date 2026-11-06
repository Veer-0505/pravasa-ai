import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Sparkles, X, Send, Bot, Volume2, VolumeX, ShieldCheck, MapPin, ExternalLink, CornerDownLeft, Compass } from 'lucide-react';

const INITIAL_SUGGESTIONS_EN = [
  'Best places to visit in Karnataka?',
  'Plan a three-day Coorg trip',
  'Show hidden gems near Bengaluru',
  'Which waterfalls are safe to visit?',
  'Best trekking destinations?',
  'Wildlife safari destinations?',
  'Places to visit with family?',
  'How far is Hampi from Bengaluru?'
];

const INITIAL_SUGGESTIONS_KN = [
  'ಕರ್ನಾಟಕದ ಅತ್ಯುತ್ತಮ ಪ್ರವಾಸಿ ತಾಣಗಳು?',
  'ಕೂರ್ಗ್ 3 ದಿನಗಳ ಪ್ರವಾಸ ಯೋಜನೆ',
  'ಬೆಂಗಳೂರು ಹತ್ತಿರದ ಗುಪ್ತ ತಾಣಗಳು',
  'ಯಾವ ಜಲಪಾತಗಳು ಸುರಕ್ಷಿತವಾಗಿವೆ?',
  'ಅತ್ಯುತ್ತಮ ಚಾರಣ ತಾಣಗಳು ಯಾವುವು?',
  'ವನ್ಯಜೀವಿ ಸಫಾರಿ ತಾಣಗಳು',
  'ಕುಟುಂಬದೊಂದಿಗೆ ಭೇಟಿ ನೀಡಲು ಸೂಕ್ತ ಸ್ಥಳಗಳು',
  'ಹಂಪಿಯಿಂದ ಬೆಂಗಳೂರಿಗೆ ಎಷ್ಟು ದೂರ?'
];

export default function AITravelCompanion() {
  const { lang, theme } = useApp();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: lang === 'kn'
        ? 'ನಮಸ್ಕಾರ! 🙏 ನಾನು ನಿಮ್ಮ ಅಧಿಕೃತ ಕರ್ನಾಟಕ ಪ್ರವಾಸ AI ಸಹಾಯಕ. ನೀವು ಪ್ರಸಿದ್ಧ ತಾಣಗಳು, 3 ದಿನಗಳ ಯಾತ್ರಾ ಯೋಜನೆ, ದೇವಸ್ಥಾನಗಳ ಸಮಯ, ಸುರಕ್ಷಿತ ಜಲಪಾತಗಳು ಅಥವಾ ಚಾರಣ ಮಾರ್ಗಗಳ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಬಹುದು.'
        : 'Namaskara! 🙏 I am your Pravasa AI Karnataka Travel Companion. Ask me about heritage itineraries, temple timings, safe waterfalls, trekking permits, wildlife safaris, or distance calculations.',
      suggestedPlaces: [],
      quickPrompts: lang === 'kn' ? INITIAL_SUGGESTIONS_KN.slice(0, 4) : INITIAL_SUGGESTIONS_EN.slice(0, 4),
      source: 'Pravasa AI Verified Database',
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const speakText = (text, idx) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_•]/g, '');
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.rate = 0.95;
    if (lang === 'kn') utter.lang = 'kn-IN';
    utter.onend = () => setSpeakingIdx(null);
    utter.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utter);
  };

  const handleSend = async (customText) => {
    const query = (customText || input).trim();
    if (!query) return;

    const userMsg = {
      role: 'user',
      text: query,
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          isCompanionChat: true,
          lang
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: data.reply || (lang === 'kn' ? 'Pravasa AI ಪರಿಶೀಲಿಸಿದ ಮಾಹಿತಿ.' : 'Verified Pravasa AI travel information.'),
            suggestedPlaces: data.suggestedPlaces || [],
            quickPrompts: data.quickPrompts || (lang === 'kn' ? INITIAL_SUGGESTIONS_KN.slice(0, 3) : INITIAL_SUGGESTIONS_EN.slice(0, 3)),
            source: data.source || 'Pravasa AI Master Registry',
            ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: lang === 'kn'
              ? 'ಕರ್ನಾಟಕ ಪ್ರವಾಸೋದ್ಯಮ ಸಹಾಯವಾಣಿ 1800-425-4425 ಸಂಪರ್ಕಿಸಬಹುದು ಅಥವಾ ಸಂವಾದಾತ್ಮಕ ನಕ್ಷೆಯಲ್ಲಿ ತಾಣಗಳನ್ನು ವೀಕ್ಷಿಸಬಹುದು.'
              : 'Tourism Helpline is reachable at 1800-425-4425 for immediate support. You can also explore all 31 districts on our smart map.',
            suggestedPlaces: [],
            quickPrompts: lang === 'kn' ? INITIAL_SUGGESTIONS_KN.slice(0, 3) : INITIAL_SUGGESTIONS_EN.slice(0, 3),
            source: 'Emergency Tourism Line 1800-425-4425',
            ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: lang === 'kn'
            ? 'ಕರ್ನಾಟಕದ ಎಲ್ಲಾ 31 ಜಿಲ್ಲೆಗಳ 159+ ಪರಿಶೀಲಿಸಿದ ತಾಣಗಳನ್ನು ಸ್ಮಾರ್ಟ್ ನಕ್ಷೆಯಲ್ಲಿ ವೀಕ್ಷಿಸಬಹುದು.'
            : 'All 159+ verified Karnataka destinations across all 31 districts are accessible directly on the interactive smart map.',
          suggestedPlaces: [],
          quickPrompts: lang === 'kn' ? INITIAL_SUGGESTIONS_KN.slice(0, 3) : INITIAL_SUGGESTIONS_EN.slice(0, 3),
          source: 'Pravasa Offline Fallback',
          ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }

    setLoading(false);
  };

  const activeSuggestions = lang === 'kn' ? INITIAL_SUGGESTIONS_KN : INITIAL_SUGGESTIONS_EN;

  return (
    <div className="fixed bottom-5 right-5 z-[999]">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-800 to-teal-700 hover:from-emerald-900 hover:to-teal-800 text-white font-medium text-sm shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-emerald-600/30"
          aria-label="Open AI Travel Companion"
        >
          <div className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center">
            <Sparkles size={14} className="animate-spin-slow" />
          </div>
          <span className="font-semibold tracking-wide">
            {lang === 'kn' ? 'AI ಪ್ರವಾಸಿ ಸಹಾಯಕ' : 'AI Travel Companion'}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      ) : (
        <div className="w-[380px] max-w-[calc(100vw-32px)] h-[560px] max-h-[calc(100vh-80px)] bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-stone-800 flex flex-col overflow-hidden animate-fade-in backdrop-blur-md">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white px-4 py-3 flex items-center justify-between border-b border-emerald-700/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 border border-white/10 shadow-inner">
                <Bot size={20} />
              </div>
              <div>
                <div className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                  <span>Pravasa AI Companion</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-700/60 text-emerald-200 border border-emerald-600/50">v0.2.0</span>
                </div>
                <div className="text-[11px] text-emerald-200/90 font-sans flex items-center gap-1">
                  <ShieldCheck size={11} className="text-emerald-400" />
                  <span>{lang === 'kn' ? 'ಅಧಿಕೃತ Pravasa AI ಪ್ರವಾಸ ಸಹಾಯಕ' : 'Verified Pravasa AI Travel Assistant'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (speakingIdx !== null) window.speechSynthesis?.cancel();
                setIsOpen(false);
              }}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div className="bg-stone-50 dark:bg-stone-950/80 px-3 py-2 border-b border-gray-100 dark:border-stone-800 flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
            {activeSuggestions.slice(0, 5).map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-stone-700 dark:text-stone-300 hover:text-emerald-800 dark:hover:text-emerald-400 border border-gray-200 dark:border-stone-700 transition-colors shadow-2xs"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Message List */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-stone-50/50 dark:bg-stone-900/40">
            {messages.map((m, idx) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div key={idx} className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-xs ${
                      isAssistant
                        ? 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-gray-100 dark:border-stone-700/80 rounded-tl-sm'
                        : 'bg-emerald-800 text-white rounded-tr-sm'
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.text}</div>

                    {/* Suggested Place Cards inside message */}
                    {isAssistant && m.suggestedPlaces && m.suggestedPlaces.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-stone-700 space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          {lang === 'kn' ? 'ಶಿಫಾರಸು ಮಾಡಿದ ತಾಣಗಳು:' : 'Recommended Destinations:'}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {m.suggestedPlaces.map(p => (
                            <div
                              key={p.id}
                              onClick={() => navigate(`/explore?q=${encodeURIComponent(p.name)}`)}
                              className="group cursor-pointer bg-stone-50 dark:bg-stone-900/90 rounded-lg overflow-hidden border border-gray-200 dark:border-stone-700 hover:border-emerald-500 transition-all shadow-xs"
                            >
                              <div className="h-16 w-full overflow-hidden bg-stone-200 dark:bg-stone-700 relative">
                                {p.image ? (
                                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">Pravasa</div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-1 left-1.5 right-1.5 text-white text-[11px] font-semibold truncate">
                                  {p.name}
                                </div>
                              </div>
                              <div className="p-1.5 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                  {p.entryFeeINR ? `₹${p.entryFeeINR}` : (lang === 'kn' ? 'ಉಚಿತ' : 'Free')}
                                </span>
                                <span className="text-[10px] text-gray-400 flex items-center gap-0.5 group-hover:text-emerald-600">
                                  {lang === 'kn' ? 'ನೋಡಿ' : 'View'} →
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata & Controls */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100 dark:border-stone-700/50 text-[10px] opacity-70">
                      <span>{m.ts}</span>
                      {isAssistant && (
                        <div className="flex items-center gap-2">
                          {m.source && (
                            <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-medium truncate max-w-[160px]">
                              ✓ {m.source}
                            </span>
                          )}
                          <button
                            onClick={() => speakText(m.text, idx)}
                            className="p-1 hover:text-emerald-600 transition-colors"
                            title="Read Aloud / ಆಡಿಯೋ ಕೇಳಿ"
                          >
                            {speakingIdx === idx ? <VolumeX size={12} className="text-rose-500" /> : <Volume2 size={12} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contextual Follow-up Chips for Assistant */}
                  {isAssistant && m.quickPrompts && m.quickPrompts.length > 0 && idx === messages.length - 1 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                      {m.quickPrompts.map((qp, qi) => (
                        <button
                          key={qi}
                          onClick={() => handleSend(qp)}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/60 transition-all font-medium"
                        >
                          {qp}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 bg-white dark:bg-stone-800 p-3 rounded-xl border border-gray-200 dark:border-stone-700 w-fit text-xs text-gray-500 dark:text-gray-400 animate-pulse">
                <Sparkles size={14} className="text-amber-500 animate-spin" />
                <span>{lang === 'kn' ? 'ಕರ್ನಾಟಕ ಪ್ರವಾಸ ದತ್ತಾಂಶ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...' : 'Analyzing verified Karnataka spatial registry...'}</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white dark:bg-stone-900 border-t border-gray-200 dark:border-stone-800">
            <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 rounded-xl px-3 py-1.5 border border-gray-200 dark:border-stone-700 focus-within:ring-2 focus-within:ring-emerald-600">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={lang === 'kn' ? 'ದೇವಸ್ಥಾನ, ಜಲಪಾತ, ಚಾರಣ, ದೂರದ ಬಗ್ಗೆ ಕೇಳಿ...' : 'Ask about temples, waterfalls, trekking, distances...'}
                className="flex-1 bg-transparent text-xs sm:text-sm text-stone-900 dark:text-white outline-none placeholder:text-stone-400"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-xs shrink-0"
                aria-label="Send message"
              >
                <Send size={14} />
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
