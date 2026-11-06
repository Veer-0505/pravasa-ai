import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Heart,
  Calendar,
  Trash2,
  Play,
  MapPin,
  Map,
  Settings,
  User,
  Users,
  Shield,
  CreditCard,
  LogOut,
  FolderOpen
} from 'lucide-react';
import DestinationCard from '../components/DestinationCard';
import DestinationModal from '../components/DestinationModal';

export default function Profile() {
  const { t, user, signOut, savedTrips, deleteTrip, favourites, showToast } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('trips');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    import('../utils').then(({ fetchPlaces }) => fetchPlaces().then(setPlaces).catch(() => {}));
  }, []);

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#fafaf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '48px 24px', background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8, maxWidth: 440 }}>
          <div style={{ display: 'inline-flex', padding: 14, borderRadius: '50%', background: '#f4f4f2', marginBottom: 16, color: '#1a5c4c' }}>
            <User size={36} />
          </div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: 8, fontSize: '1.4rem', color: '#1c1c1c' }}>
            Sign in to Access Your Profile
          </h2>
          <p style={{ color: '#5a5a5a', marginBottom: 24, fontSize: '0.9rem', lineHeight: 1.5 }}>
            Sign in or create an account to organize, review, and export your saved Karnataka itineraries and destinations.
          </p>
          <Link to="/auth" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Sign In / Register
          </Link>
        </div>
      </div>
    );
  }

  const favPlaces = places.filter(p => favourites.includes(p.id));

  const handleDeleteTrip = (id) => {
    if (window.confirm('Are you sure you want to delete this saved itinerary?')) {
      deleteTrip(id);
      showToast('Saved itinerary removed.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      {/* Profile header */}
      <div style={{ background: '#1a5c4c', color: '#ffffff', padding: '44px 16px 52px', borderBottom: '1px solid #14483b' }}>
        <div className="max-w-4xl mx-auto" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 8,
              background: '#ffffff',
              color: '#1a5c4c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              fontWeight: 700,
              flexShrink: 0,
              border: '2px solid rgba(255,255,255,0.4)'
            }}
          >
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ color: '#ffffff' }}>
            <h1 style={{ margin: '0 0 4px', fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontWeight: 700 }}>
              {user.name}
            </h1>
            <div style={{ opacity: 0.85, fontSize: '0.88rem' }}>{user.email}</div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', padding: '2px 10px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                {user.role === 'admin' ? 'Administrator' : 'Traveler'}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', padding: '2px 10px', borderRadius: 4, fontSize: '0.75rem' }}>
                {savedTrips.length} saved {savedTrips.length === 1 ? 'itinerary' : 'itineraries'}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', padding: '2px 10px', borderRadius: 4, fontSize: '0.75rem' }}>
                {favourites.length} bookmarked
              </span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => { signOut(); navigate('/'); showToast('Signed out successfully.'); }}
              className="btn btn-outline"
              style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#ffffff', background: 'transparent' }}
            >
              <LogOut size={14} /> {t('signOut')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto" style={{ padding: '0 16px', marginTop: -20 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 6, padding: 4, marginBottom: 24 }}>
          {[
            { id: 'trips', label: 'My Itineraries', icon: Map },
            { id: 'favourites', label: 'Saved Destinations', icon: Heart },
            { id: 'settings', label: 'Preferences & Storage', icon: Settings },
          ].map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: 4,
                  border: 'none',
                  background: active ? '#1a5c4c' : 'transparent',
                  color: active ? '#ffffff' : '#5a5a5a',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background-color 0.15s, color 0.15s'
                }}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Saved Trips */}
        {tab === 'trips' && (
          <div style={{ paddingBottom: 64 }}>
            {savedTrips.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px 20px', background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
                <FolderOpen size={40} stroke="#8a8a8a" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: 8, fontSize: '1.2rem', color: '#1c1c1c' }}>
                  No saved itineraries yet
                </h3>
                <p style={{ color: '#5a5a5a', marginBottom: 20, fontSize: '0.9rem' }}>
                  Use the itinerary planner to design a route and save it for future reference.
                </p>
                <Link to="/plan" className="btn btn-primary">
                  Plan a New Trip
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {savedTrips.map(trip => (
                  <div key={trip.id} className="card" style={{ padding: 22, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <h3 style={{ margin: '0 0 6px', fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', color: '#1c1c1c' }}>
                          {trip.name}
                        </h3>
                        <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: '#5a5a5a', marginTop: 4, flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Calendar size={13} stroke="#7a7a7a" /> {new Date(trip.savedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <MapPin size={13} stroke="#7a7a7a" /> Starting from {trip.formData?.startCity}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <CreditCard size={13} stroke="#7a7a7a" /> Budget: ₹{trip.formData?.budget?.toLocaleString('en-IN')}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Users size={13} stroke="#7a7a7a" /> {trip.formData?.groupType}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/plan', { state: { trip } })}>
                          <Play size={13} /> View Itinerary
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleDeleteTrip(trip.id)}
                          style={{ color: '#c0392b', borderColor: '#e2e2e0' }}
                          aria-label="Delete saved itinerary"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Day summary */}
                    <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {trip.plan?.days?.map(d => (
                        <div key={d.day} style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 4, padding: '6px 12px', fontSize: '0.78rem' }}>
                          <span style={{ fontWeight: 600, color: '#1a5c4c', marginRight: 6 }}>Day {d.day}:</span>
                          <span style={{ color: '#374151' }}>{d.stops.map(s => s.name).join(' → ') || 'Free exploration'}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 12, fontSize: '0.82rem', color: '#374151', borderTop: '1px solid #f0f0ee', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <strong>Calculated Total: </strong>
                        <span style={{ color: '#1a5c4c', fontWeight: 700, fontSize: '0.95rem' }}>
                          ₹{(trip.pricing?.totalTripCost || trip.plan?.budget?.total || 0).toLocaleString('en-IN')}
                        </span>
                        {trip.plan?.meta?.travellers && (
                          <span style={{ color: '#6b7280', fontSize: '0.78rem', marginLeft: 8 }}>
                            ({trip.plan.meta.travellers} {trip.plan.meta.travellers > 1 ? 'travellers' : 'traveller'} · {trip.formData?.travelMode || trip.plan.meta.travelMode || 'Personal car'})
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#6b7280' }}>
                        Saved: {new Date(trip.savedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    {trip.plan?.budget?.subtotals && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: '0.75rem', color: '#4b5563', background: '#f9fafb', padding: '6px 10px', borderRadius: 4 }}>
                        <span>🚗 ₹{trip.plan.budget.subtotals.transportation?.toLocaleString('en-IN')}</span>
                        <span>🏨 ₹{trip.plan.budget.subtotals.accommodation?.toLocaleString('en-IN')}</span>
                        <span>🍲 ₹{trip.plan.budget.subtotals.food?.toLocaleString('en-IN')}</span>
                        <span>🎟️ ₹{trip.plan.budget.subtotals.entryFees?.toLocaleString('en-IN')}</span>
                        <span>📑 Taxes: ₹{trip.plan.budget.subtotals.taxes?.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Favourites */}
        {tab === 'favourites' && (
          <div style={{ paddingBottom: 64 }}>
            {favPlaces.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px 20px', background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
                <Heart size={40} stroke="#8a8a8a" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: 8, fontSize: '1.2rem', color: '#1c1c1c' }}>
                  No bookmarked destinations
                </h3>
                <p style={{ color: '#5a5a5a', marginBottom: 20, fontSize: '0.9rem' }}>
                  Click the heart icon on any destination card to bookmark it for your itinerary.
                </p>
                <Link to="/explore" className="btn btn-primary">
                  Explore Destinations
                </Link>
              </div>
            ) : (
              <div className="grid-cards">
                {favPlaces.map(p => (
                  <DestinationCard key={p.id} place={p} onClick={setSelectedPlace} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {tab === 'settings' && (
          <div style={{ paddingBottom: 64 }}>
            <div className="card" style={{ padding: 24, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', margin: '0 0 20px', fontSize: '1.2rem', color: '#1c1c1c' }}>
                Storage &amp; Data Preferences
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0ee' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1c1c1c' }}>Language Setting</div>
                    <div style={{ fontSize: '0.82rem', color: '#5a5a5a' }}>Switch interface between English and Kannada (ಕನ್ನಡ)</div>
                  </div>
                  <Link to="/" className="btn btn-outline btn-sm">Switch in Header</Link>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0ee' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1c1c1c' }}>Emergency SOS Contacts</div>
                    <div style={{ fontSize: '0.82rem', color: '#5a5a5a' }}>Update local contacts registered for emergency coordination</div>
                  </div>
                  <Link to="/sos" className="btn btn-outline btn-sm">Manage Contacts</Link>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0ee' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#c0392b' }}>Clear Local Travel Data</div>
                    <div style={{ fontSize: '0.82rem', color: '#5a5a5a' }}>Permanently remove all cached itineraries, bookmarks, and emergency contacts</div>
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ color: '#c0392b', borderColor: '#fca5a5' }}
                    onClick={() => {
                      if (window.confirm('Clear all local itineraries and preferences from this device?')) {
                        ['pravasa_trips', 'pravasa_favs', 'pravasa_em_contacts'].forEach(k => localStorage.removeItem(k));
                        window.location.reload();
                      }
                    }}
                  >
                    Clear Data
                  </button>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#5a5a5a', background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 6, padding: '12px 16px', display: 'flex', gap: 8 }}>
                  <Shield size={16} style={{ color: '#1a5c4c', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>Data Architecture:</strong> Pravasa AI persists itineraries and emergency settings strictly within your browser's private Web Storage API (localStorage). Data is not sold or mirrored to third-party ad networks.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedPlace && <DestinationModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />}
    </div>
  );
}
