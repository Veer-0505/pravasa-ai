import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <div className="max-w-3xl mx-auto" style={{ padding: '48px 16px 80px' }}>
        <div style={{ marginBottom: 8 }}>
          <Link to="/" style={{ fontSize: '0.82rem', color: '#1a5c4c', textDecoration: 'none' }}>&larr; Back to home</Link>
        </div>
        <h1 style={{ fontSize: '2rem', margin: '0 0 8px', fontFamily: 'Playfair Display, serif' }}>Privacy Policy</h1>
        <p style={{ color: '#8a8a8a', fontSize: '0.85rem', marginBottom: 32 }}>Last updated: October 2026</p>

        <div style={{ fontSize: '0.92rem', lineHeight: 1.8, color: '#1c1c1c' }}>
          <h2 style={{ fontSize: '1.2rem', marginTop: 32 }}>1. What this application is</h2>
          <p>Pravasa AI is a development-stage travel planning tool for Karnataka, India. It is not a commercial product. This policy describes how data is handled within the application.</p>

          <h2 style={{ fontSize: '1.2rem', marginTop: 32 }}>2. Data stored locally</h2>
          <p>The following data is stored in your browser's localStorage only. It is not transmitted to any external server or third party:</p>
          <ul>
            <li>Language preference</li>
            <li>Account details (name, email) created during sign-up</li>
            <li>Saved trip itineraries</li>
            <li>Favourite destinations</li>
            <li>Emergency contact information</li>
          </ul>
          <p>You can clear all locally stored data at any time through the Profile settings page or by clearing your browser data.</p>

          <h2 style={{ fontSize: '1.2rem', marginTop: 32 }}>3. Data sent to the server</h2>
          <p>When you use the following features, data is sent to the application's backend server:</p>
          <ul>
            <li><strong>Trip planning:</strong> Your form inputs (city, dates, budget, interests) are sent to generate an itinerary. These are processed in memory and not stored persistently.</li>
            <li><strong>Crowd reports:</strong> When you submit a crowd report, the place identifier, crowd level, and any notes you provide are stored in server memory. These are lost when the server restarts.</li>
            <li><strong>SOS events:</strong> When you activate the SOS feature, your location (if shared), emergency type, and timestamp are sent to the server. These are stored in server memory only.</li>
          </ul>

          <h2 style={{ fontSize: '1.2rem', marginTop: 32 }}>4. Third-party services</h2>
          <ul>
            <li><strong>OpenStreetMap:</strong> Map tiles are loaded from OpenStreetMap servers. Their <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c4c' }}>privacy policy</a> applies.</li>
            <li><strong>Google Fonts:</strong> Fonts are loaded from Google's servers. Google's <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c4c' }}>privacy policy</a> applies.</li>
            <li><strong>Google Gemini AI (optional):</strong> If configured by the server operator, trip planning requests may be processed through Google's Gemini API. Google's terms apply.</li>
          </ul>

          <h2 style={{ fontSize: '1.2rem', marginTop: 32 }}>5. Cookies and analytics</h2>
          <p>This application does not use cookies or analytics tracking. No advertising identifiers or behavioural tracking tools are used.</p>

          <h2 style={{ fontSize: '1.2rem', marginTop: 32 }}>6. Authentication</h2>
          <p>Account creation uses localStorage only. Passwords are stored in your browser in plain text for demonstration purposes. This is not suitable for production use. Do not use real passwords.</p>

          <h2 style={{ fontSize: '1.2rem', marginTop: 32 }}>7. Children</h2>
          <p>This application is not directed at children under 13.</p>

          <h2 style={{ fontSize: '1.2rem', marginTop: 32 }}>8. Contact</h2>
          <p>This is a development project. For questions about this policy, contact the project maintainer directly.</p>
        </div>
      </div>
    </div>
  );
}
