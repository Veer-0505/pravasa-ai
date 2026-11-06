import React, { useState, useMemo } from 'react';

/**
 * Interactive Karnataka SVG District Map
 * Style: Official Karnataka Tourism (karnatakatourism.org)
 * Dark emerald districts with gold highlight on hover, district name tooltip
 * 
 * SVG paths are approximate boundary shapes for all 31 Karnataka districts
 * positioned within a 600x750 viewBox.
 */

// District boundary paths (simplified polygon approximations)
// Coordinate system: viewBox "0 0 600 750" mapping ~74°E-78.5°E (x) and ~11.5°N-18.5°N (y)
const DISTRICT_PATHS = {
  bidar: "M340,15 L375,10 L410,18 L420,45 L415,70 L390,80 L355,78 L330,65 L325,40 Z",
  kalaburagi: "M255,55 L330,65 L355,78 L390,80 L395,110 L380,140 L340,150 L290,145 L250,120 L240,90 L245,70 Z",
  raichur: "M240,140 L290,145 L340,150 L350,175 L340,210 L305,225 L260,220 L235,195 L225,165 Z",
  yadgir: "M340,150 L380,140 L395,110 L420,115 L435,140 L425,170 L400,185 L355,180 L350,175 Z",
  bijapur: "M145,100 L200,90 L240,90 L250,120 L240,140 L225,165 L195,180 L155,175 L125,155 L120,125 Z",
  bagalkot: "M155,175 L195,180 L225,165 L235,195 L230,225 L205,245 L175,250 L145,235 L130,210 L135,190 Z",
  belgaum: "M35,105 L80,85 L120,90 L145,100 L120,125 L125,155 L155,175 L135,190 L110,195 L75,185 L45,170 L25,145 Z",
  dharwad: "M110,195 L135,190 L145,235 L155,255 L140,275 L115,270 L95,255 L90,225 L100,210 Z",
  gadag: "M155,255 L175,250 L205,245 L230,225 L245,240 L245,270 L225,285 L200,290 L175,280 L155,270 Z",
  haveri: "M140,275 L155,270 L175,280 L200,290 L210,310 L200,335 L175,340 L150,330 L135,310 L130,290 Z",
  koppal: "M245,240 L260,220 L305,225 L325,240 L320,265 L300,280 L275,285 L250,275 L245,270 Z",
  bellary: "M300,280 L320,265 L325,240 L340,210 L365,215 L390,225 L395,255 L385,280 L360,295 L330,300 L305,295 Z",
  ramanagara: "M300,460 L320,450 L340,455 L345,475 L330,490 L310,488 L295,478 Z",
  davanagere: "M225,285 L245,270 L275,285 L300,280 L305,295 L295,320 L275,335 L245,340 L225,330 L215,310 Z",
  chitradurga: "M275,335 L295,320 L305,295 L330,300 L360,295 L375,310 L370,340 L355,360 L330,370 L300,365 L280,350 Z",
  shimoga: "M150,330 L175,340 L200,335 L215,310 L225,330 L245,340 L240,370 L220,395 L195,405 L165,400 L140,380 L130,355 Z",
  uttarakannada: "M25,145 L45,170 L75,185 L110,195 L100,210 L90,225 L95,255 L80,280 L65,310 L50,340 L35,355 L20,335 L10,300 L5,260 L10,220 L15,180 Z",
  udupi: "M50,340 L65,365 L80,380 L75,410 L60,430 L45,435 L30,415 L25,385 L35,355 Z",
  dakshinakannada: "M45,435 L60,430 L75,410 L90,430 L100,460 L95,490 L80,510 L60,515 L45,505 L35,480 L30,455 Z",
  kodagu: "M95,490 L120,475 L145,480 L165,495 L170,520 L155,540 L130,545 L110,530 L95,510 Z",
  hassan: "M165,400 L195,405 L220,395 L240,370 L260,385 L270,410 L260,435 L240,445 L215,450 L190,445 L170,430 L160,415 Z",
  chikmagalur: "M80,280 L95,255 L115,270 L140,275 L130,290 L135,310 L150,330 L130,355 L105,365 L80,380 L65,365 L65,310 Z",
  tumkur: "M260,385 L280,350 L300,365 L330,370 L345,390 L350,420 L340,445 L320,450 L300,460 L280,445 L260,435 L255,410 Z",
  mandya: "M215,450 L240,445 L260,435 L280,445 L300,460 L295,478 L280,495 L255,505 L235,500 L215,490 L205,470 Z",
  mysore: "M145,480 L165,495 L170,520 L205,470 L215,490 L235,500 L255,505 L260,530 L245,555 L220,570 L190,575 L165,560 L140,540 L130,545 L155,540 Z",
  bangalore_urban: "M340,455 L365,440 L385,450 L390,470 L380,485 L360,488 L345,475 Z",
  bangalore_rural: "M345,390 L375,385 L400,395 L410,415 L400,435 L385,450 L365,440 L340,445 L340,425 Z",
  kolar: "M400,395 L430,385 L455,395 L465,420 L455,445 L435,455 L415,445 L400,435 L410,415 Z",
  chikballapur: "M375,385 L400,395 L430,385 L425,365 L410,350 L390,350 L375,360 Z",
  chamarajanagar: "M255,505 L280,495 L310,510 L330,530 L325,560 L300,580 L275,585 L255,570 L245,555 L260,530 Z",
  // Tumkur-Chitradurga junction
};

// Neighbours for adjacency highlighting (optional, for future use)
export default function KarnatakaSvgMap({ onDistrictClick, selectedDistrict }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const districtNames = {
    bidar: { en: 'Bidar', kn: 'ಬೀದರ್' },
    kalaburagi: { en: 'Kalaburagi', kn: 'ಕಲಬುರಗಿ' },
    raichur: { en: 'Raichur', kn: 'ರಾಯಚೂರು' },
    yadgir: { en: 'Yadgir', kn: 'ಯಾದಗಿರಿ' },
    bijapur: { en: 'Vijayapura', kn: 'ವಿಜಯಪುರ' },
    bagalkot: { en: 'Bagalkot', kn: 'ಬಾಗಲಕೋಟೆ' },
    belgaum: { en: 'Belagavi', kn: 'ಬೆಳಗಾವಿ' },
    dharwad: { en: 'Dharwad', kn: 'ಧಾರವಾಡ' },
    gadag: { en: 'Gadag', kn: 'ಗದಗ' },
    haveri: { en: 'Haveri', kn: 'ಹಾವೇರಿ' },
    koppal: { en: 'Koppal', kn: 'ಕೊಪ್ಪಳ' },
    bellary: { en: 'Ballari', kn: 'ಬಳ್ಳಾರಿ' },
    ramanagara: { en: 'Ramanagara', kn: 'ರಾಮನಗರ' },
    davanagere: { en: 'Davanagere', kn: 'ದಾವಣಗೆರೆ' },
    chitradurga: { en: 'Chitradurga', kn: 'ಚಿತ್ರದುರ್ಗ' },
    shimoga: { en: 'Shivamogga', kn: 'ಶಿವಮೊಗ್ಗ' },
    uttarakannada: { en: 'Uttara Kannada', kn: 'ಉತ್ತರ ಕನ್ನಡ' },
    udupi: { en: 'Udupi', kn: 'ಉಡುಪಿ' },
    dakshinakannada: { en: 'Dakshina Kannada', kn: 'ದಕ್ಷಿಣ ಕನ್ನಡ' },
    kodagu: { en: 'Kodagu', kn: 'ಕೊಡಗು' },
    hassan: { en: 'Hassan', kn: 'ಹಾಸನ' },
    chikmagalur: { en: 'Chikkamagaluru', kn: 'ಚಿಕ್ಕಮಗಳೂರು' },
    tumkur: { en: 'Tumakuru', kn: 'ತುಮಕೂರು' },
    mandya: { en: 'Mandya', kn: 'ಮಂಡ್ಯ' },
    mysore: { en: 'Mysuru', kn: 'ಮೈಸೂರು' },
    bangalore_urban: { en: 'Bengaluru Urban', kn: 'ಬೆಂಗಳೂರು ನಗರ' },
    bangalore_rural: { en: 'Bengaluru Rural', kn: 'ಬೆಂಗಳೂರು ಗ್ರಾಮಾಂತರ' },
    kolar: { en: 'Kolar', kn: 'ಕೋಲಾರ' },
    chikballapur: { en: 'Chikkaballapura', kn: 'ಚಿಕ್ಕಬಳ್ಳಾಪುರ' },
    chamarajanagar: { en: 'Chamarajanagar', kn: 'ಚಾಮರಾಜನಗರ' },
  };

  const handleMouseMove = (e, id) => {
    const svg = e.currentTarget.closest('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 15
    });
    setHoveredId(id);
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 480, margin: '0 auto' }}>
      <svg
        viewBox="0 0 480 620"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto' }}
      >
        {/* Background */}
        <rect width="480" height="620" fill="transparent" />

        {Object.entries(DISTRICT_PATHS).map(([id, path]) => {
          const isHovered = hoveredId === id;
          const isSelected = selectedDistrict === id;
          const isActive = isHovered || isSelected;

          return (
            <path
              key={id}
              d={path}
              fill={isActive ? '#f0b429' : '#1a4c3e'}
              stroke="#ffffff"
              strokeWidth={isActive ? 1.8 : 0.8}
              strokeLinejoin="round"
              style={{
                cursor: 'pointer',
                transition: 'fill 0.2s ease, stroke-width 0.2s ease',
                filter: isActive ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' : 'none'
              }}
              onMouseEnter={(e) => handleMouseMove(e, id)}
              onMouseMove={(e) => handleMouseMove(e, id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onDistrictClick?.(id)}
            />
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredId && districtNames[hoveredId] && (
        <div
          style={{
            position: 'absolute',
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%)',
            background: '#ffffff',
            color: '#1a1a2e',
            padding: '6px 14px',
            borderRadius: 6,
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 100,
            border: '1px solid #e5e7eb'
          }}
        >
          {districtNames[hoveredId].en}
        </div>
      )}
    </div>
  );
}

