import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Sparkles,
  Users,
  Compass,
  CheckCircle2,
  Phone,
  Mail,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight,
  Plus
} from 'lucide-react';

const KARNATAKA_FESTIVALS = [
  {
    id: 'mysuru_dasara',
    name: 'Mysuru Dasara (ನವರಾತ್ರಿ & ಜಂಬೂ ಸವಾರಿ)',
    months: 'September – October',
    duration: '10 Days',
    district: 'Mysuru',
    venue: 'Mysuru Palace & Bannimantap Grounds',
    description: 'Karnataka’s state festival celebrating the victory of Goddess Chamundeshwari over Mahishasura. Features the world-famous Jamboo Savari elephant procession and illumination of Mysuru Palace with 97,000 bulbs.',
    highlights: ['Jamboo Savari Procession', 'Palace Illumination', 'Torchlight Parade', 'Dasara Exhibition'],
    accessibility: 'Designated seating zones for senior citizens and persons with disabilities at Bannimantap.',
    category: 'Cultural & Heritage',
    officialUrl: 'https://mysoredasara.gov.in'
  },
  {
    id: 'hampi_utsav',
    name: 'Hampi Utsav (ಹಂಪಿ ಉತ್ಸವ)',
    months: 'January / November',
    duration: '3 Days',
    district: 'Vijayanagara',
    venue: 'Hampi World Heritage Ruins & Gayatri Peetha',
    description: 'Mega cultural extravaganza organized amidst the 14th-century Vijayanagara ruins, showcasing classical music, folk dances, Janapada Kalavahini, puppet shows, and sound-and-light projections on monolithic monuments.',
    highlights: ['Light & Sound Show on Stone Chariot', 'Classical Karnataka Sangeetha', 'Rock Climbing Competitions'],
    accessibility: 'Open-air grounds. Battery buggies operate between monument clusters.',
    category: 'Heritage & Arts',
    officialUrl: 'https://karnatakatourism.org'
  },
  {
    id: 'kambala_races',
    name: 'Kambala Traditional Buffalo Races (ಕಂಬಳ)',
    months: 'November – March (Seasonal)',
    duration: 'Weekly circuits',
    district: 'Dakshina Kannada & Udupi',
    venue: 'Moodabidri, Aladangadi, Aikala & Mangaluru',
    description: 'Ancient coastal Karnataka agricultural folk sport where pairs of swift buffaloes dash through slushy paddy tracks guided by traditional jockeys. Celebrated for over a thousand years.',
    highlights: ['Traditional Kare Jockey Races', 'Folk Festivities', 'Coastal Tuluva Cultural Displays'],
    accessibility: 'Spectator galleries along paddy track. Dry elevated viewing decks available.',
    category: 'Traditional Sports',
    officialUrl: 'https://karnatakatourism.org'
  },
  {
    id: 'karaga_shakyotsava',
    name: 'Bengaluru Karaga (ಬೆಂಗಳೂರು ಕರಗ)',
    months: 'March – April (Chaitra Purnima)',
    duration: '9 Days',
    district: 'Bengaluru Urban',
    venue: 'Sri Dharmaraya Swamy Temple, Tigalarapet',
    description: 'One of the oldest festivals of Bengaluru celebrated by the Vahnikula Kshatriya community. The Karaga bearer balances an earthen pot honoring Draupadi across old Bengaluru streets throughout the night.',
    highlights: ['All-night procession', 'Ancient Tigalarapet Heritage Walk', 'Community Harmony Rituals'],
    accessibility: 'Street-level procession. High pedestrian density in old city markets.',
    category: 'Religious & Folk',
    officialUrl: 'https://karnatakatourism.org'
  },
  {
    id: 'pattadakal_dance',
    name: 'Pattadakal Dance Festival (ಪಟ್ಟದಕಲ್ಲು ನೃತ್ಯೋತ್ಸವ)',
    months: 'January – February',
    duration: '3 Days',
    district: 'Bagalkot',
    venue: 'Pattadakal UNESCO Temple Complex',
    description: 'Annual national dance extravaganza staged against the dramatic 8th-century sandstone temples of the Chalukyan dynasty, drawing classical dancers from across India.',
    highlights: ['Bharatanatyam & Kathak Recitals', 'Illuminated Virupaksha Temple Backdrop', 'Chalukya Heritage Walks'],
    accessibility: 'Flat archaeological lawn seating, wheelchair accessible entry ramp.',
    category: 'Classical Arts',
    officialUrl: 'https://karnatakatourism.org'
  },
  {
    id: 'vairamudi_utsav',
    name: 'Vairamudi Brahmotsava (ವೈರಮುಡಿ ಉತ್ಸವ)',
    months: 'March (Phalguna)',
    duration: '1 Night Main Event',
    district: 'Mandya',
    venue: 'Cheluvanarayana Swamy Temple, Melukote',
    description: 'Sacred nocturnal procession where the idol of Lord Cheluvanarayana is adorned with the legendary diamond-studded Vairamudi crown brought under armed police escort from the Mandya district treasury.',
    highlights: ['Nocturnal Diamond Crown Darshan', 'Melukote Puliyogare Prasada', 'Hilltop Yoga Narasimha Temple'],
    accessibility: 'Melukote town streets. High pilgrim density; early arrival advised.',
    category: 'Spiritual',
    officialUrl: 'https://karnatakatourism.org'
  }
];

const CERTIFIED_LOCAL_GUIDES = [
  {
    id: 'guide_1',
    name: 'Ramesh K. Hampi',
    license: 'KSTDC-REG-4029',
    badge: 'Ministry of Tourism Certified',
    districts: ['Vijayanagara (Hampi)', 'Bagalkot (Badami, Pattadakal)'],
    experienceYears: 14,
    languages: ['Kannada', 'English', 'Hindi', 'French'],
    expertise: 'Vijayanagara architecture, epigraphy, rock-cut Chalukya cave art',
    phone: '+91 94480 12345',
    verified: true
  },
  {
    id: 'guide_2',
    name: 'Anupama S. Rao',
    license: 'KSTDC-REG-5122',
    badge: 'State Certified Cultural Guide',
    districts: ['Mysuru', 'Mandya (Srirangapatna)', 'Chamarajanagar'],
    experienceYears: 10,
    languages: ['Kannada', 'English', 'Hindi'],
    expertise: 'Wodeyar dynasty heritage, Tipu Sultan history, palace architecture',
    phone: '+91 98450 67890',
    verified: true
  },
  {
    id: 'guide_3',
    name: 'Ganesh Bhat',
    license: 'KSTDC-REG-6340',
    badge: 'Western Ghats Eco-Guide',
    districts: ['Uttara Kannada (Gokarna)', 'Shivamogga (Jog Falls)'],
    experienceYears: 12,
    languages: ['Kannada', 'English', 'Hindi', 'Konkani'],
    expertise: 'Rainforest trails, temple rituals, coastal biodiversity walks',
    phone: '+91 94812 34567',
    verified: true
  },
  {
    id: 'guide_4',
    name: 'Shankar Murthy',
    license: 'KSTDC-REG-3891',
    badge: 'Archaeological Specialist',
    districts: ['Hassan (Belur, Halebidu)', 'Chikkamagaluru'],
    experienceYears: 16,
    languages: ['Kannada', 'English', 'German'],
    expertise: 'Hoysala soapstone carvings, Jain heritage at Shravanabelagola',
    phone: '+91 99001 23456',
    verified: true
  }
];

export default function FestivalCalendar() {
  const { t, showToast, lang } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('festivals'); // 'festivals' | 'guides'
  const [searchQuery, setSearchQuery] = useState('');
  const [inquiryModalGuide, setInquiryModalGuide] = useState(null);
  const [inquiryForm, setInquiryForm] = useState({ name: '', phone: '', dates: '', travelers: '2', notes: '' });

  const filteredFestivals = KARNATAKA_FESTIVALS.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGuides = CERTIFIED_LOCAL_GUIDES.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.districts.some(d => d.toLowerCase().includes(searchQuery.toLowerCase())) ||
    g.languages.some(l => l.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    showToast(lang === 'kn' ? `ಮಾರ್ಗದರ್ಶಿ ಬುಕಿಂಗ್ ವಿನಂತಿಯನ್ನು ${inquiryModalGuide.name} ಅವರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.` : `Guide booking inquiry sent to ${inquiryModalGuide.name}. They will reach you at ${inquiryForm.phone}.`);
    setInquiryModalGuide(null);
    setInquiryForm({ name: '', phone: '', dates: '', travelers: '2', notes: '' });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      {/* Header */}
      <div style={{ background: '#1a5c4c', color: '#ffffff', padding: '48px 16px 56px', borderBottom: '1px solid #14483b' }}>
        <div className="max-w-7xl mx-auto">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e8f5f0', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            <Calendar size={16} />
            <span>{lang === 'kn' ? 'ರಾಜ್ಯದ ಸಾಂಸ್ಕೃತಿಕ ಪರಂಪರೆ ಮತ್ತು ಅನುಭವಗಳು' : 'State Cultural Heritage & Experiences'}</span>
          </div>
          <h1 style={{ color: '#ffffff', fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 700, margin: '0 0 12px' }}>
            {lang === 'kn' ? 'ಕರ್ನಾಟಕ ಉತ್ಸವಗಳ ಕ್ಯಾಲೆಂಡರ್ & ಅಧಿಕೃತ ಪ್ರವಾಸಿ ಮಾರ್ಗದರ್ಶಿಗಳು' : 'Karnataka Festival Calendar & Local Guide Directory'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', maxWidth: 720, fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
            {lang === 'kn'
              ? 'ಕರ್ನಾಟಕದ ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳಲ್ಲಿ ನಡೆಯುವ ನೂರಾರು ವರ್ಷಗಳ ಐತಿಹಾಸಿಕ ಉತ್ಸವಗಳನ್ನು ಅನ್ವೇಷಿಸಿ, ಮತ್ತು ಪ್ರವಾಸೋದ್ಯಮ ಇಲಾಖೆ ಪ್ರಮಾಣೀಕೃತ ಸ್ಥಳೀಯ ಗೈಡ್‌ಗಳನ್ನು ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಿ.'
              : "Discover centuries-old cultural celebrations across Karnataka's districts, and connect with certified local guides authorized by the Department of Tourism."}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto" style={{ padding: '0 16px', marginTop: -24 }}>
        {/* Switcher & Search Bar */}
        <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8 }}>
          <div style={{ display: 'flex', gap: 6, background: '#f4f4f2', border: '1px solid #e2e2e0', borderRadius: 6, padding: 3 }}>
            <button
              onClick={() => setTab('festivals')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                borderRadius: 4,
                border: 'none',
                background: tab === 'festivals' ? '#1a5c4c' : 'transparent',
                color: tab === 'festivals' ? '#ffffff' : '#374151',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Calendar size={15} /> {lang === 'kn' ? 'ಸಾಂಸ್ಕೃತಿಕ ಹಬ್ಬಗಳು' : 'Cultural Festivals'} ({KARNATAKA_FESTIVALS.length})
            </button>
            <button
              onClick={() => setTab('guides')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                borderRadius: 4,
                border: 'none',
                background: tab === 'guides' ? '#1a5c4c' : 'transparent',
                color: tab === 'guides' ? '#ffffff' : '#374151',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Users size={15} /> {lang === 'kn' ? 'ಪ್ರಮಾಣೀಕೃತ ಸ್ಥಳೀಯ ಗೈಡ್‌ಗಳು' : 'Verified Local Guides'} ({CERTIFIED_LOCAL_GUIDES.length})
            </button>
          </div>

          <div style={{ position: 'relative', minWidth: 260 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8a8a8a' }} />
            <input
              className="input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={lang === 'kn' ? 'ಉತ್ಸವ, ಜಿಲ್ಲೆ, ಅಥವಾ ಗೈಡ್ ಹುಡುಕಿ...' : 'Search festivals, district, guides...'}
              style={{ paddingLeft: 34, height: 38, fontSize: '0.86rem', width: '100%' }}
            />
          </div>
        </div>

        {/* Tab 1: Festivals Grid */}
        {tab === 'festivals' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, paddingBottom: 64 }}>
            {filteredFestivals.map(f => (
              <div key={f.id} className="card" style={{ padding: 22, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: '0.72rem', background: '#e8f5f0', color: '#1a5c4c', border: '1px solid #c2e2d5', padding: '2px 8px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>
                    {f.category}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#5a5a5a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={13} style={{ color: '#1a5c4c' }} /> {f.months}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 6px', fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', color: '#1c1c1c', fontWeight: 700 }}>
                  {f.name}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#5a5a5a', marginBottom: 12 }}>
                  <MapPin size={13} style={{ color: '#1a5c4c' }} />
                  <span>{f.venue}, {f.district}</span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.6, margin: '0 0 14px', flex: 1 }}>
                  {f.description}
                </p>

                <div style={{ background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 6, padding: '10px 12px', marginBottom: 14 }}>
                  <div style={{ fontSize: '0.74rem', color: '#7a7a7a', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Key Highlights:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {f.highlights.map((h, i) => (
                      <span key={i} style={{ fontSize: '0.74rem', background: '#ffffff', border: '1px solid #e2e2e0', padding: '2px 8px', borderRadius: 4, color: '#374151' }}>
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 16 }}>
                  <strong>Accessibility: </strong>{f.accessibility}
                </div>

                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #f0f0ee', paddingTop: 12 }}>
                  <button
                    onClick={() => navigate(`/plan?place=${f.district.toLowerCase()}`)}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Plus size={13} /> Plan Itinerary
                  </button>
                  <a
                    href={f.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{ justifyContent: 'center', textDecoration: 'none' }}
                  >
                    Official Portal <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Guides Directory */}
        {tab === 'guides' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, paddingBottom: 64 }}>
            {filteredGuides.map(g => (
              <div key={g.id} className="card" style={{ padding: 22, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: '0.75rem', fontWeight: 700 }}>
                    <ShieldCheck size={16} />
                    <span>{g.badge}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: '#f4f4f2', border: '1px solid #e2e2e0', padding: '2px 6px', borderRadius: 4, color: '#5a5a5a', fontFamily: 'monospace' }}>
                    {g.license}
                  </span>
                </div>

                <h3 style={{ margin: '4px 0 2px', fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', color: '#1c1c1c', fontWeight: 700 }}>
                  {g.name}
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#5a5a5a', marginBottom: 12 }}>
                  {g.experienceYears} years guiding experience across Karnataka circuits
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, marginBottom: 16 }}>
                  <div style={{ fontSize: '0.82rem', color: '#374151' }}>
                    <strong>Districts Covered: </strong>{g.districts.join(' · ')}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#374151' }}>
                    <strong>Languages Spoken: </strong>{g.languages.join(', ')}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#4b5563', lineHeight: 1.5, background: '#f8f8f6', border: '1px solid #e8e8e5', borderRadius: 6, padding: '8px 12px' }}>
                    <strong>Specialization: </strong>{g.expertise}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #f0f0ee', paddingTop: 12 }}>
                  <button
                    onClick={() => setInquiryModalGuide(g)}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Request Booking Inquiry
                  </button>
                  <a
                    href={`tel:${g.phone}`}
                    className="btn btn-outline btn-sm"
                    style={{ justifyContent: 'center', textDecoration: 'none' }}
                  >
                    <Phone size={13} /> Call
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guide Booking Modal */}
      {inquiryModalGuide && (
        <div className="modal-overlay" onClick={() => setInquiryModalGuide(null)} style={{ zIndex: 1200 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 460, padding: 24, borderRadius: 8, background: '#ffffff', border: '1px solid #dcdcd9' }}>
            <h3 style={{ margin: '0 0 6px', fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', color: '#1c1c1c' }}>
              Guide Inquiry: {inquiryModalGuide.name}
            </h3>
            <p style={{ color: '#5a5a5a', fontSize: '0.84rem', margin: '0 0 18px' }}>
              License: <strong>{inquiryModalGuide.license}</strong> · Specialization: {inquiryModalGuide.expertise}
            </p>

            <form onSubmit={handleInquirySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2b2b2b', display: 'block', marginBottom: 4 }}>Your Full Name *</label>
                <input
                  required
                  className="input"
                  value={inquiryForm.name}
                  onChange={e => setInquiryForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2b2b2b', display: 'block', marginBottom: 4 }}>Phone Number *</label>
                <input
                  required
                  type="tel"
                  className="input"
                  value={inquiryForm.phone}
                  onChange={e => setInquiryForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="e.g. +91 98765 43210"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2b2b2b', display: 'block', marginBottom: 4 }}>Planned Date *</label>
                  <input
                    required
                    type="date"
                    className="input"
                    value={inquiryForm.dates}
                    onChange={e => setInquiryForm(f => ({ ...f, dates: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2b2b2b', display: 'block', marginBottom: 4 }}>Group Size</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={inquiryForm.travelers}
                    onChange={e => setInquiryForm(f => ({ ...f, travelers: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2b2b2b', display: 'block', marginBottom: 4 }}>Special Notes / Monuments</label>
                <textarea
                  rows="2"
                  className="input"
                  value={inquiryForm.notes}
                  onChange={e => setInquiryForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Interested in Virupaksha temple history and sunset bouldering"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Submit Inquiry
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setInquiryModalGuide(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

