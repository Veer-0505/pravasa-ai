import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { I18N } from './i18n';
import { supabase, isSupabaseConfigured } from './supabase';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('pravasa_lang') || 'en');
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('pravasa_theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pravasa_user')); } catch { return null; }
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('pravasa_token') || null);
  const [savedTrips, setSavedTrips] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pravasa_trips') || '[]'); } catch { return []; }
  });
  const [favourites, setFavourites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pravasa_favs') || '[]'); } catch { return []; }
  });
  const [emergencyContacts, setEmergencyContacts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pravasa_em_contacts') || '[]'); } catch { return []; }
  });
  const [toast, setToast] = useState(null);
  const [crowdReports, setCrowdReports] = useState([]);

  // Sync theme with <html> class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('pravasa_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const t = useCallback((key) => I18N[lang]?.[key] ?? I18N['en']?.[key] ?? key, [lang]);

  const changeLang = (l) => {
    setLang(l);
    localStorage.setItem('pravasa_lang', l);
  };

  const showToast = (msg, duration = 3000) => {
    setToast(msg);
    setTimeout(() => setToast(null), duration);
  };

  // Sync Supabase Auth Session
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const sbUser = session.user;
        const metadataRole = sbUser.user_metadata?.role;
        const isAdmin = metadataRole === 'admin' || metadataRole === 'gov_admin' || 
          ['admin@pravasa.ai', 'veerrr0505@gmail.com', 'sveeresh.in@gmail.com', 'sveerrr0505@gmail.com'].includes(sbUser.email?.toLowerCase());

        const profileUser = {
          id: sbUser.id,
          email: sbUser.email,
          phone: sbUser.phone,
          name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'Traveller',
          role: isAdmin ? 'admin' : (metadataRole || 'customer'),
          avatar_url: sbUser.user_metadata?.avatar_url || null,
          city: sbUser.user_metadata?.city || 'Bengaluru',
          isEmailVerified: Boolean(sbUser.email_confirmed_at),
          isPhoneVerified: Boolean(sbUser.phone_confirmed_at)
        };
        setUser(profileUser);
        setAuthToken(session.access_token);
        localStorage.setItem('pravasa_user', JSON.stringify(profileUser));
        localStorage.setItem('pravasa_token', session.access_token);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAuthToken(null);
        localStorage.removeItem('pravasa_user');
        localStorage.removeItem('pravasa_token');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = (userData, token = null) => {
    setUser(userData);
    localStorage.setItem('pravasa_user', JSON.stringify(userData));
    if (token) {
      setAuthToken(token);
      localStorage.setItem('pravasa_token', token);
    }
  };
  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try { await supabase.auth.signOut(); } catch {}
    }
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('pravasa_user');
    localStorage.removeItem('pravasa_token');
  };

  const authFetch = useCallback((url, options = {}) => {
    const headers = { ...(options.headers || {}) };
    const token = authToken || localStorage.getItem('pravasa_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  }, [authToken]);

  const saveTrip = (plan, formData) => {
    const trip = {
      id: 'trip_' + Date.now(),
      plan,
      formData,
      pricing: plan.meta?.pricing || {
        totalTripCost: plan.budget?.total,
        subtotals: plan.budget?.subtotals,
        lineItems: plan.budget?.lineItems
      },
      savedAt: new Date().toISOString(),
      name: `${formData.days}D Karnataka - ${formData.startCity}${formData.targetPlaceId ? ` (${formData.startCity} → ${plan.days?.[0]?.stops?.[0]?.name || ''})` : ''}`
    };
    const updated = [trip, ...savedTrips].slice(0, 20);
    setSavedTrips(updated);
    localStorage.setItem('pravasa_trips', JSON.stringify(updated));
    return trip;
  };
  const deleteTrip = (id) => {
    const updated = savedTrips.filter(t => t.id !== id);
    setSavedTrips(updated);
    localStorage.setItem('pravasa_trips', JSON.stringify(updated));
  };

  const toggleFavourite = (placeId) => {
    const updated = favourites.includes(placeId)
      ? favourites.filter(f => f !== placeId)
      : [...favourites, placeId];
    setFavourites(updated);
    localStorage.setItem('pravasa_favs', JSON.stringify(updated));
  };
  const isFavourite = (placeId) => favourites.includes(placeId);

  const addEmergencyContact = (contact) => {
    const updated = [...emergencyContacts, { ...contact, id: 'ec_' + Date.now() }];
    setEmergencyContacts(updated);
    localStorage.setItem('pravasa_em_contacts', JSON.stringify(updated));
  };
  const removeEmergencyContact = (id) => {
    const updated = emergencyContacts.filter(c => c.id !== id);
    setEmergencyContacts(updated);
    localStorage.setItem('pravasa_em_contacts', JSON.stringify(updated));
  };

  const addCrowdReport = (report) => setCrowdReports(prev => [report, ...prev]);
  const getCrowdForPlace = (placeId) => {
    const recent = crowdReports
      .filter(r => r.placeId === placeId && Date.now() - new Date(r.ts).getTime() < 6 * 3600 * 1000)
      .sort((a, b) => new Date(b.ts) - new Date(a.ts));
    return recent[0] || null;
  };

  return (
    <AppContext.Provider value={{
      lang, changeLang, t,
      theme, toggleTheme, setTheme,
      user, authToken, authFetch, signIn, signOut,
      savedTrips, saveTrip, deleteTrip,
      favourites, toggleFavourite, isFavourite,
      emergencyContacts, addEmergencyContact, removeEmergencyContact,
      crowdReports, addCrowdReport, getCrowdForPlace,
      toast, showToast,
    }}>
      {children}
      {toast && <div className="toast">{toast}</div>}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
