import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AppProvider } from './AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Explore from './pages/Explore';
import MapPage from './pages/MapPage';
import PlanTrip from './pages/PlanTrip';
import HiddenGems from './pages/HiddenGems';
import TrekkingPage from './pages/TrekkingPage';
import WildlifePage from './pages/WildlifePage';
import FestivalCalendar from './pages/FestivalCalendar';
import NewsPage from './pages/NewsPage';
import ReviewsPage from './pages/ReviewsPage';
import CrowdPage from './pages/CrowdPage';
import SOSPage from './pages/SOSPage';
import AuthPage from './pages/AuthPage';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import DistrictPage from './pages/DistrictPage';
import AITravelCompanion from './components/AITravelCompanion';
import TravelAlertsBanner from './components/TravelAlertsBanner';

function NotFound() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: '4rem', fontWeight: 800, color: '#e2e2e0', lineHeight: 1 }}>404</div>
        <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.4rem', margin: '16px 0 8px' }}>Page not found</h1>
        <p style={{ color: '#5a5a5a', marginBottom: 24, fontSize: '0.9rem' }}>The page you are looking for does not exist or has been moved.</p>
        <Link to="/" className="btn btn-primary">Back to home</Link>
      </div>
    </div>
  );
}

function Layout({ children, fullscreen = false, showFooter = true }) {
  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <Navbar />
      <TravelAlertsBanner />
      <main className={`flex-1 ${fullscreen ? 'flex flex-col' : 'block'}`}>
        {children}
      </main>
      {showFooter && <Footer />}
      <AITravelCompanion />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/district/:districtId" element={<Layout><DistrictPage /></Layout>} />
          <Route path="/explore" element={<Layout><Explore /></Layout>} />
          <Route path="/map" element={<Layout fullscreen showFooter={false}><MapPage /></Layout>} />
          <Route path="/plan" element={<Layout><PlanTrip /></Layout>} />
          <Route path="/gems" element={<Layout><HiddenGems /></Layout>} />
          <Route path="/trekking" element={<Layout><TrekkingPage /></Layout>} />
          <Route path="/wildlife" element={<Layout><WildlifePage /></Layout>} />
          <Route path="/festivals" element={<Layout><FestivalCalendar /></Layout>} />
          <Route path="/news" element={<Layout><NewsPage /></Layout>} />
          <Route path="/reviews" element={<Layout><ReviewsPage /></Layout>} />
          <Route path="/crowd" element={<Layout><CrowdPage /></Layout>} />
          <Route path="/sos" element={<Layout><SOSPage /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
          <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
          <Route path="/terms" element={<Layout><Terms /></Layout>} />
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
