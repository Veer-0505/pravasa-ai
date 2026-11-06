# Pravasa AI – Karnataka Tourism Intelligence Platform 🏛️🌴
> **Version 0.2.0** – Full-Stack, AI-Powered, Bilingual Tourism & Geospatial Intelligence Platform for Karnataka, India

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Version: v0.2.0](https://img.shields.io/badge/Version-v0.2.0-gold.svg)](package.json)
[![Node: >=18.0.0](https://img.shields.io/badge/Node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![React: 18.3](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![Express: 4.19](https://img.shields.io/badge/Express-4.19-lightgrey.svg)](https://expressjs.com/)
[![Tailwind: 3.4](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)

---

## 1. Project Overview & Version v0.2.0 Highlights

**Pravasa AI (v0.2.0)** transforms Karnataka travel planning into an authoritative, bilingual (ಕನ್ನಡ + English), national-grade digital experience inspired by the official Karnataka Tourism portal (`karnatakatourism.org`).

### Key Additions in v0.2.0:
1. **Interactive 31-District Silhouette Map**:
   - Geocoded vector SVG boundary map of Karnataka state.
   - Smooth hover & selection transitions with warm gold highlighting (`#E5A93C`) and live district metrics.
   - Dynamic showcase panel rendering district descriptions, division tags, live Open-Meteo weather, and verified attraction photos.
2. **Dual Theme Architecture (Light & Dark Mode)**:
   - Deep forest green (`#0F382E`, `#1A5C4C`), emerald green (`#10B981`), warm gold (`#E5A93C`), and natural beige (`#FAF8F5`).
   - One-click persistent theme toggle (Sun/Moon), remembering traveler preference across sessions.
3. **Cinematic Hero Experience**:
   - Full-width hero background featuring high-definition scenic looping Karnataka footage (Hampi, Western Ghats, Coorg, Arabian Coast).
   - High-contrast gradient overlays, reduced-motion fallback photography, and destination search with autocomplete.
4. **Complete Bilingual System (Kannada & English Everywhere)**:
   - Mandatory bilingual support across all navigation links, headers, cards, chatbot dialogues, and notifications.
   - Exact official navigation labels:
     - **English**: Home, Explore, Smart Map, AI Travel Planner, Hidden Gems, Trekking, Wildlife & Safari, Festivals & Culture, Latest Tourism News, Reviews, Travel Companion.
     - **ಕನ್ನಡ**: ಮುಖಪುಟ, ಅನ್ವೇಷಿಸಿ, ಸ್ಮಾರ್ಟ್ ನಕ್ಷೆ, AI ಪ್ರವಾಸ ಯೋಜಕ, ಗುಪ್ತ ಪ್ರವಾಸಿ ತಾಣಗಳು, ಚಾರಣ, ವನ್ಯಜೀವಿ ಮತ್ತು ಸಫಾರಿ, ಹಬ್ಬಗಳು ಮತ್ತು ಸಂಸ್ಕೃತಿ, ಇತ್ತೀಚಿನ ಪ್ರವಾಸೋದ್ಯಮ ಸುದ್ದಿ, ವಿಮರ್ಶೆಗಳು, ಪ್ರವಾಸಿ ಸಹಾಯಕ.
5. **Advanced AI Travel Chatbot (Fixed & Grounded)**:
   - Natural language comprehension in English and Kannada.
   - Solves common traveler queries: 3-day Coorg trip, hidden gems near Bengaluru, safe waterfalls, trekking permits, wildlife safaris, budget travel, and distance matrices.
   - Returns interactive destination card carousels directly inside chat messages.
   - Audio text-to-speech with bilingual voice playback.
6. **Dedicated Adventure & Wildlife Modules**:
   - **Trekking Explorer**: Kudremukh, Kumara Parvatha, Tadiandamol, Kodachadri, Mullayanagiri, Skandagiri with elevation, trail distance, difficulty, and Aranya permit booking links.
   - **Wildlife & Safari Explorer**: Bandipur, Nagarahole/Kabini, Bhadra, Dandeli Kali with safari timings, vehicle formats, and Jungle Lodges & Resorts (JLR) links.
7. **Living Culture, Festivals & Tourism News**:
   - Cultural calendar covering Mysuru Dasara, Hampi Utsav, Kambala buffalo races, Yakshagana, and Karaga.
   - Verified press updates from Karnataka Tourism Department and KSNDMC advisories.
8. **Visitor Reviews & Rating Intelligence**:
   - Multi-category traveler reviews (Cleanliness, Safety, Transport Ease, Overall Rating) with helpful upvoting and verification badges.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS (with `darkMode: 'class'`), Lucide React, Recharts |
| **Geospatial & Vector** | Interactive Karnataka SVG Geometry (31 Districts), Leaflet 1.9, React-Leaflet |
| **Backend** | Node.js, Express.js 4.19, Multer (media storage), CORS |
| **Security & Auth** | bcryptjs, jsonwebtoken (JWT), express-rate-limit |
| **AI Integration** | Google Generative AI (Gemini 2.0 / 1.5 Flash) with strict data-grounded RAG fallback |
| **Meteorological** | Open-Meteo REST API (real-time WMO weather with 15-minute TTL caching) |
| **Data Storage** | JSON Flat-File Database (`places.json`, `karnataka_districts.geojson`, `reviews.json`, `alerts.json`, `users.json`) |

---

## 3. Directory Structure

```
pravasa-ai/
├── client/                      # React 18 + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AITravelCompanion.jsx       # Fixed bilingual chatbot with card carousel & TTS
│   │   │   ├── CinematicHero.jsx          # High-definition Karnataka video hero
│   │   │   ├── DestinationCard.jsx        # Dual-theme card with daytime photos
│   │   │   ├── KarnatakaDistrictExplorerMap.jsx # Interactive 31-district SVG map (same as video reference)
│   │   │   ├── MapView.jsx                # Leaflet geospatial smart map
│   │   │   ├── Navbar.jsx                 # Bilingual navbar with theme toggle
│   │   │   └── Footer.jsx                 # Comprehensive official footer
│   │   ├── data/
│   │   │   ├── karnatakaDistrictsSvg.js   # 31 district SVG paths & centroids
│   │   │   └── tourismModulesData.js      # Trekking, Wildlife, Culture & News data
│   │   ├── pages/
│   │   │   ├── Home.jsx                   # 19-section transformed homepage
│   │   │   ├── DistrictPage.jsx           # Dedicated 31-district tourism intelligence page
│   │   │   ├── Explore.jsx                # Cascading District, Taluk & Gem explorer
│   │   │   ├── MapPage.jsx                # Fullscreen spatial discovery
│   │   │   ├── PlanTrip.jsx               # Grounded day-by-day itinerary planner
│   │   │   ├── TrekkingPage.jsx           # Dedicated trekking explorer
│   │   │   ├── WildlifePage.jsx           # Forest & tiger reserve explorer
│   │   │   ├── NewsPage.jsx               # Tourism news & advisories
│   │   │   ├── ReviewsPage.jsx            # Traveler reviews & ratings
│   │   │   ├── FestivalCalendar.jsx       # Living culture calendar
│   │   │   └── SOSPage.jsx                # 112 emergency coordination hub
│   │   ├── AppContext.jsx                 # Lang, theme & trip persistence
│   │   └── i18n.js                        # Complete Kannada & English localization
├── server/                      # Express.js REST API backend
│   ├── data/
│   │   ├── districts/                     # 31 modular district research files
│   │   ├── districts.json                 # 31 districts master metadata & statistics
│   │   ├── taluks.json                    # 230 taluk-to-district mappings
│   │   ├── places.json                    # 270 verified destinations (30 fields each)
│   │   ├── karnataka_districts.geojson    # Authentic district polygon boundaries
│   │   ├── reviews.json                   # Traveler community reviews
│   │   ├── alerts.json                    # Official KSNDMC / ASI advisories
│   │   └── users.json                     # Registered accounts (bcrypt hashed)
│   ├── routes/
│   │   ├── districts.js                   # Dedicated district pages & taluks API
│   │   ├── chat.js                        # Fixed RAG & companion chatbot API
│   │   ├── map.js                         # Geospatial bounding box markers API
│   │   ├── places.js                      # Places & live weather API
│   │   ├── plan.js                        # Itinerary generation API
│   │   └── reviews.js                     # Review submission & upvoting API
│   ├── scripts/
│   │   ├── compile_database.py            # Master database compiler & validator
│   │   └── data/                          # Modular division research datasets
│   └── services/
│       ├── gemini.js                      # Google Generative AI integration
│       └── weather.js                     # Open-Meteo meteorological cache
└── package.json                 # v0.2.0 root workspace configuration
```

---

## 4. Setup & Running the Application

### Prerequisites
- Node.js (>= 18.0.0)
- npm (>= 9.0.0)

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Start Both Backend & Frontend Concurrently
```bash
npm run dev
```

The application will be live at:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 3. Optional: Configure Google Gemini API Key
To enable full generative LLM itinerary restructuring, edit `server/.env`:
```env
PORT=5000
JWT_SECRET=your-secure-jwt-secret-key-2026
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```
*(Note: If `GEMINI_API_KEY` is omitted, Pravasa AI operates seamlessly using its built-in, unhallucinated rule-based itinerary planner and bilingual RAG knowledge engine).*

---

## 5. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/districts` | `GET` | Returns all 31 districts with centers, headquarters, taluks, live weather, and counts |
| `/api/districts/:id` | `GET` | Full district tourism intelligence: categorized destinations, live weather, suggested routes |
| `/api/districts/:id/destinations` | `GET` | Filterable destinations within a district by taluk, category, and gem status |
| `/api/districts/taluks/all` | `GET` | Returns all 230 Karnataka taluks mapped to their respective districts |
| `/api/chat` | `POST` | Bilingual AI chatbot companion with suggested destination cards and quick prompts |
| `/api/map/districts` | `GET` | Returns all 31 districts with centers, taluks, and attraction counts |
| `/api/map/markers` | `GET` | Bounding-box filtered markers for interactive Leaflet map |
| `/api/places` | `GET` | Returns verified Karnataka destinations with daytime imagery |
| `/api/places/live-weather` | `GET` | Fetches live Open-Meteo temperature and conditions for any coordinates |
| `/api/reviews` | `GET` / `POST` | Retrieve approved reviews or submit a new destination review |
| `/api/reviews/:id/helpful` | `POST` | Upvote a review as helpful |
| `/api/alerts` | `GET` | Official weather, festival, and ASI conservation advisories |
| `/api/plan` | `POST` | Generates a grounded, day-by-day Karnataka itinerary |

---

## 6. Verification and Testing Status

- [x] **Frontend Rendering**: Fully responsive on desktop, tablet, and mobile screens.
- [x] **Interactive 31-District SVG Map**: Implemented and verified matching the video reference (`karnatakatourism.org`).
- [x] **Light & Dark Mode**: Persistent dual-theme toggle with forest green, emerald, and warm gold palettes.
- [x] **Bilingual Support**: All navigation items, headings, cards, and chatbot queries supported in Kannada and English.
- [x] **AI Chatbot Debugging**: Fixed connectivity, rich answers for 12+ prompt inquiry types, card carousels, and TTS narration.
- [x] **Trekking & Wildlife Modules**: Dedicated interactive pages with official forest booking links.
- [x] **Vite Production Build**: Compiled cleanly with zero errors (`npm --prefix client run build`).

---

&copy; 2026 Pravasa AI. Government Tourism Inspired Intelligence Platform for Karnataka, India.
