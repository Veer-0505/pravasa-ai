import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <div className="max-w-3xl mx-auto" style={{ padding: '48px 16px 80px' }}>
        <div style={{ marginBottom: 8 }}>
          <Link to="/" style={{ fontSize: '0.82rem', color: '#1a5c4c', textDecoration: 'none' }}>&larr; Back to home</Link>
        </div>
        <h1 style={{ fontSize: '2rem', margin: '0 0 8px', fontFamily: 'Playfair Display, serif' }}>Terms of Use</h1>
        <p style={{ color: '#8a8a8a', fontSize: '0.85rem', marginBottom: 32 }}>Last updated: October 2026</p>

        <div style={{ fontSize: '0.92rem', lineHeight: 1.8, color: '#1c1c1c' }}>
          <h2 style={{ fontSize: '1.2rem', marginTop: 32 }}>1. Nature of this application</h2>
          <p>Pravasa AI is a development-stage travel planning tool. It is not a commercial travel agency, booking platform, or official tourism service. It does not sell tours, transport, accommodation, or insurance.</p>

          <h2 style={{ fontSize: '1.2rem', marginTop: 32 }}>2. No guarantee of accuracy</h2>
          <p>Destination information, including opening hours, entry fees, coordinates, crowd levels, and descriptions, is drawn from a sample dataset created for development. This data may be incomplete, outdated, or incorrect. Always verify details with official sources before travelling.</p>

          <h2 style={{ fontSize: '1.2rem', marginTop: 32 }}>3. Itinerary planning</h2>
          <p>Trip itineraries are generated algorithmically or with optional AI assistance. Route suggestions, cost estimates, and time calculations are approximate. Actual travel conditions, road closures, weather, and local regulations may differ from what the planner suggests.</p>

          <h2 style={{ fontSize: '1.2rem', marginTop: 32 }}>4. Emergency features</h2>
          <p>The SOS feature provides quick access to India's emergency number (112) and records your location for reference. It does not dispatch emergency services, notify authorities, or replace calling 112 directly. In any emergency, dial 112 immediately.</p>

          <h2 style={{ fontSize: '1.2rem', marginTop: 32 }}>5. Crowd reports</h2>
          <p>Crowd data is submitted voluntarily by users. It is not verified, may be inaccurate, and does not represent real-time or official conditions. Do not rely on crowd reports for safety-critical decisions.</p>

          <h2 style={{ fontSize: '1.2rem', marginTop: 32 }}>6. User accounts</h2>
          <p>Account creation is a demonstration feature using browser localStorage. It is not secured for production use. Do not use passwords that you use for other services.</p>

          <h2 style={{ fontSize: '1.2rem', marginTop: 32 }}>7. Third-party content and links</h2>
          <p>The application may link to external services including Google Maps, OpenStreetMap, and WhatsApp. These services are governed by their own terms and privacy policies.</p>

          <h2 style={{ fontSize: '1.2rem', marginTop: 32 }}>8. Limitation of liability</h2>
          <p>This application is provided as-is for development and demonstration purposes. The developers are not liable for any loss, injury, or inconvenience arising from the use of information, suggestions, or features provided by this application.</p>

          <h2 style={{ fontSize: '1.2rem', marginTop: 32 }}>9. Changes</h2>
          <p>These terms may be updated at any time. Continued use of the application constitutes acceptance of the current terms.</p>
        </div>
      </div>
    </div>
  );
}
