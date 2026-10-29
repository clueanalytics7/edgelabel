/**
 * Sample images generator for instant Computer Vision testing
 */

function createSvgDataUrl(title, subtitle, bgGradient, elementsSvg) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        ${bgGradient}
      </linearGradient>
      <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.25"/>
      </filter>
    </defs>
    <rect width="800" height="600" fill="url(#bg)"/>
    <g opacity="0.12">
      <circle cx="400" cy="300" r="280" fill="white"/>
      <path d="M 0,300 L 800,300 M 400,0 L 400,600" stroke="white" stroke-width="2" stroke-dasharray="8 8"/>
    </g>
    ${elementsSvg}
    <rect x="24" y="24" width="300" height="68" rx="12" fill="#0f172a" fill-opacity="0.8" filter="url(#shadow)"/>
    <text x="44" y="52" fill="#38bdf8" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700">${title}</text>
    <text x="44" y="74" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="12">${subtitle}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getSampleCvDataset() {
  const img1 = createSvgDataUrl(
    'URBAN MOBILITY & TRAFFIC',
    '800x600 • Street intersection scene',
    '<stop offset="0%" stop-color="#1e293b"/><stop offset="100%" stop-color="#0f172a"/>',
    `
    <!-- Road -->
    <path d="M 100,600 L 320,320 L 480,320 L 700,600 Z" fill="#334155"/>
    <line x1="400" y1="320" x2="400" y2="600" stroke="#facc15" stroke-width="6" stroke-dasharray="24 16"/>
    <!-- Vehicle 1 -->
    <g id="car1">
      <rect x="220" y="380" width="160" height="110" rx="16" fill="#3b82f6"/>
      <rect x="240" y="395" width="120" height="45" rx="8" fill="#1e3a8a"/>
      <circle cx="250" cy="485" r="14" fill="#020617"/>
      <circle cx="350" cy="485" r="14" fill="#020617"/>
      <rect x="360" y="440" width="16" height="10" rx="3" fill="#ef4444"/>
    </g>
    <!-- Person -->
    <g id="person1">
      <circle cx="560" cy="360" r="16" fill="#fbbf24"/>
      <rect x="548" y="380" width="24" height="60" rx="6" fill="#10b981"/>
      <rect x="546" y="440" width="12" height="50" rx="4" fill="#1e293b"/>
      <rect x="562" y="440" width="12" height="50" rx="4" fill="#1e293b"/>
    </g>
    <!-- Traffic Sign -->
    <g id="sign1">
      <rect x="680" y="240" width="8" height="240" fill="#94a3b8"/>
      <circle cx="684" cy="240" r="32" fill="#ef4444"/>
      <rect x="668" y="234" width="32" height="12" fill="white"/>
    </g>
    `
  );

  const img2 = createSvgDataUrl(
    'SMART WAREHOUSE ROBOTICS',
    '800x600 • Automated packaging & inventory',
    '<stop offset="0%" stop-color="#18181b"/><stop offset="100%" stop-color="#27272a"/>',
    `
    <!-- Shelves -->
    <rect x="80" y="160" width="640" height="20" fill="#71717a"/>
    <rect x="80" y="340" width="640" height="20" fill="#71717a"/>
    <!-- Boxes -->
    <rect x="140" y="220" width="110" height="120" rx="6" fill="#d97706"/>
    <rect x="280" y="240" width="130" height="100" rx="6" fill="#b45309"/>
    <rect x="440" y="210" width="120" height="130" rx="6" fill="#d97706"/>
    <!-- AGV Robot -->
    <rect x="300" y="440" width="200" height="90" rx="16" fill="#6366f1"/>
    <circle cx="340" cy="525" r="16" fill="#09090b"/>
    <circle cx="460" cy="525" r="16" fill="#09090b"/>
    <rect x="360" y="410" width="80" height="30" rx="4" fill="#f59e0b"/>
    `
  );

  const img3 = createSvgDataUrl(
    'RETAIL CHECKOUT & OBJECTS',
    '800x600 • Point of sale object recognition',
    '<stop offset="0%" stop-color="#042f2e"/><stop offset="100%" stop-color="#115e59"/>',
    `
    <!-- Countertop -->
    <rect x="60" y="320" width="680" height="240" rx="16" fill="#0f766e"/>
    <!-- Laptop / Terminal -->
    <rect x="120" y="220" width="180" height="120" rx="8" fill="#334155"/>
    <rect x="135" y="235" width="150" height="90" rx="4" fill="#38bdf8"/>
    <!-- Beverage Cup -->
    <path d="M 370,250 L 430,250 L 415,370 L 385,370 Z" fill="#f43f5e"/>
    <rect x="360" y="240" width="80" height="12" rx="4" fill="#ffffff"/>
    <!-- Handheld scanner -->
    <rect x="490" y="300" width="90" height="50" rx="10" fill="#e2e8f0"/>
    <rect x="520" y="340" width="30" height="60" rx="6" fill="#475569"/>
    `
  );

  return [
    {
      id: 'sample-traffic-01',
      name: 'urban_traffic_scene.png',
      src: img1,
      width: 800,
      height: 600,
      boxes: [
        { id: 'b1', label: 'Vehicle', x: 215, y: 375, width: 170, height: 125, color: '#3b82f6' },
        { id: 'b2', label: 'Person', x: 535, y: 340, width: 55, height: 160, color: '#10b981' },
        { id: 'b3', label: 'Sign', x: 650, y: 205, width: 70, height: 75, color: '#ef4444' },
      ],
      classification: 'Multi-Object',
    },
    {
      id: 'sample-warehouse-02',
      name: 'warehouse_logistics.png',
      src: img2,
      width: 800,
      height: 600,
      boxes: [
        { id: 'b4', label: 'Product', x: 135, y: 215, width: 120, height: 130, color: '#f59e0b' },
        { id: 'b5', label: 'Product', x: 275, y: 235, width: 140, height: 110, color: '#f59e0b' },
        { id: 'b6', label: 'Vehicle', x: 295, y: 405, width: 210, height: 135, color: '#3b82f6' },
      ],
      classification: 'Warehouse',
    },
    {
      id: 'sample-retail-03',
      name: 'retail_pos_counter.png',
      src: img3,
      width: 800,
      height: 600,
      boxes: [
        { id: 'b7', label: 'Product', x: 360, y: 235, width: 80, height: 140, color: '#f59e0b' },
        { id: 'b8', label: 'Object', x: 110, y: 210, width: 200, height: 140, color: '#8b5cf6' },
      ],
      classification: 'Retail',
    },
  ];
}

export const CLINICAL_WOUND_CLASSES = [
  { id: 'w1', name: 'Erythema (Inflamed Margin)', color: '#ef4444' },
  { id: 'w2', name: 'Purulent Exudate (Pus)', color: '#eab308' },
  { id: 'w3', name: 'Necrotic Slough', color: '#451a03' },
  { id: 'w4', name: 'Granulation Bed', color: '#f43f5e' },
  { id: 'w5', name: 'Epithelial Edge', color: '#10b981' },
  { id: 'w6', name: 'Cellulitic Induration', color: '#8b5cf6' },
  { id: 'w7', name: 'Ulceration Dermis Breach', color: '#0284c7' },
];

export function getClinicalWoundDataset() {
  // Case 1: Diabetic Foot Ulcer (Wagner Grade 2)
  const woundImg1 = createSvgDataUrl(
    'DIABETIC FOOT ULCER • WAGNER GRADE 2',
    '800x600 • Plantar first metatarsal head lesion',
    '<stop offset="0%" stop-color="#292524"/><stop offset="100%" stop-color="#1c1917"/>',
    `
    <!-- Plantar foot tissue surface -->
    <ellipse cx="400" cy="330" rx="310" ry="220" fill="#f5d0b5"/>
    <ellipse cx="400" cy="330" rx="280" ry="195" fill="#eec0a0" opacity="0.6"/>

    <!-- Periwound Erythema flare (inflammation zone) -->
    <ellipse cx="395" cy="325" rx="170" ry="135" fill="#f87171" opacity="0.55"/>
    <ellipse cx="395" cy="325" rx="145" ry="115" fill="#ef4444" opacity="0.45"/>

    <!-- Ulceration border / Indurated callous rim -->
    <ellipse cx="390" cy="320" rx="110" ry="85" fill="#d4d4d8" opacity="0.7"/>

    <!-- Granulation tissue bed (healthy healing vascular tissue) -->
    <ellipse cx="390" cy="320" rx="95" ry="72" fill="#be123c"/>
    <circle cx="350" cy="310" r="18" fill="#e11d48"/>
    <circle cx="430" cy="330" r="22" fill="#9f1239"/>
    <circle cx="400" cy="345" r="16" fill="#e11d48"/>

    <!-- Central Necrotic Slough (devitalized fibrinous tissue) -->
    <path d="M 360,290 Q 410,285 435,310 Q 445,340 410,355 Q 365,350 350,325 Z" fill="#ca8a04"/>
    <path d="M 375,305 Q 405,298 420,318 Q 415,340 385,338 Z" fill="#78350f" opacity="0.85"/>

    <!-- Serosanguinous discharge sheen -->
    <ellipse cx="385" cy="315" rx="35" ry="20" fill="#fef08a" opacity="0.5"/>
    `
  );

  // Case 2: Acute Bacterial Cellulitis & Purulent Skin Infection
  const woundImg2 = createSvgDataUrl(
    'BACTERIAL CELLULITIS & ABSCESS',
    '800x600 • Spreading cutaneous infection with purulent focus',
    '<stop offset="0%" stop-color="#18181b"/><stop offset="100%" stop-color="#09090b"/>',
    `
    <!-- Lower extremity dermal background -->
    <rect x="120" y="100" width="560" height="420" rx="40" fill="#fcd9bd"/>

    <!-- Diffuse cellulitic erythematous spread -->
    <ellipse cx="400" cy="310" rx="230" ry="170" fill="#f87171" opacity="0.6"/>
    <ellipse cx="390" cy="315" rx="175" ry="130" fill="#dc2626" opacity="0.5"/>

    <!-- Warm indurated plateau -->
    <ellipse cx="380" cy="310" rx="120" ry="85" fill="#991b1b" opacity="0.65"/>

    <!-- Central Purulent Abscess Collection -->
    <circle cx="375" cy="305" r="42" fill="#fef08a"/>
    <circle cx="372" cy="302" r="34" fill="#fef9c3"/>
    <circle cx="368" cy="298" r="16" fill="#ffffff" opacity="0.9"/>

    <!-- Inflamed hair follicles / petechiae -->
    <circle cx="310" cy="260" r="3" fill="#7f1d1d"/>
    <circle cx="330" cy="245" r="2.5" fill="#7f1d1d"/>
    <circle cx="430" cy="270" r="3" fill="#7f1d1d"/>
    <circle cx="450" cy="340" r="3.5" fill="#7f1d1d"/>
    <circle cx="320" cy="360" r="3" fill="#7f1d1d"/>
    <circle cx="410" cy="380" r="2.5" fill="#7f1d1d"/>

    <!-- Demarcation pen marking (clinical progression tracker) -->
    <path d="M 220,260 Q 300,160 480,200 Q 580,310 520,430 Q 350,480 230,380 Z" fill="none" stroke="#2563eb" stroke-width="3" stroke-dasharray="10 6" opacity="0.8"/>
    <text x="235" y="245" fill="#2563eb" font-family="system-ui" font-size="11" font-weight="bold">10:30 AM MARGIN</text>
    `
  );

  // Case 3: Post-Surgical Dehiscence with Exudate
  const woundImg3 = createSvgDataUrl(
    'SURGICAL DEHISCENCE & SITE INFECTION',
    '800x600 • Post-laparotomy incision with localized dehiscence',
    '<stop offset="0%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#0f172a"/>',
    `
    <!-- Abdominal skin field -->
    <rect x="100" y="100" width="600" height="420" rx="24" fill="#fed7aa"/>

    <!-- Incision Line -->
    <line x1="160" y1="310" x2="640" y2="310" stroke="#7c2d12" stroke-width="4"/>

    <!-- Sutures intact -->
    <g stroke="#18181b" stroke-width="2">
      <line x1="200" y1="295" x2="200" y2="325"/>
      <line x1="250" y1="295" x2="250" y2="325"/>
      <line x1="550" y1="295" x2="550" y2="325"/>
      <line x1="600" y1="295" x2="600" y2="325"/>
    </g>

    <!-- Dehiscence gap (wound separation) -->
    <ellipse cx="390" cy="310" rx="95" ry="38" fill="#450a0a"/>
    <!-- Deep dermis granulation -->
    <ellipse cx="390" cy="310" rx="82" ry="28" fill="#991b1b"/>
    <!-- Purulent exudate pooling -->
    <path d="M 330,310 Q 380,325 440,312 Q 410,328 350,324 Z" fill="#fef08a" opacity="0.9"/>

    <!-- Perilesional erythema around dehisced segment -->
    <ellipse cx="390" cy="310" rx="140" ry="65" fill="#f87171" opacity="0.45"/>
    `
  );

  return [
    {
      id: 'wound-dfu-01',
      name: 'diabetic_foot_ulcer_plantar.png',
      src: woundImg1,
      width: 800,
      height: 600,
      boxes: [
        { id: 'wb1', label: 'Erythema (Inflamed Margin)', x: 230, y: 195, width: 330, height: 260, color: '#ef4444' },
        { id: 'wb2', label: 'Granulation Bed', x: 295, y: 245, width: 190, height: 150, color: '#f43f5e' },
        { id: 'wb3', label: 'Necrotic Slough', x: 345, y: 280, width: 100, height: 80, color: '#451a03' },
      ],
      classification: 'Diabetic Ulcer (Wagner 2)',
    },
    {
      id: 'wound-cellulitis-02',
      name: 'acute_cellulitis_abscess.png',
      src: woundImg2,
      width: 800,
      height: 600,
      boxes: [
        { id: 'wb4', label: 'Cellulitic Induration', x: 180, y: 150, width: 440, height: 320, color: '#8b5cf6' },
        { id: 'wb5', label: 'Erythema (Inflamed Margin)', x: 260, y: 220, width: 250, height: 180, color: '#ef4444' },
        { id: 'wb6', label: 'Purulent Exudate (Pus)', x: 330, y: 260, width: 90, height: 90, color: '#eab308' },
      ],
      classification: 'Acute Bacterial Cellulitis',
    },
    {
      id: 'wound-dehiscence-03',
      name: 'surgical_site_dehiscence.png',
      src: woundImg3,
      width: 800,
      height: 600,
      boxes: [
        { id: 'wb7', label: 'Erythema (Inflamed Margin)', x: 250, y: 245, width: 280, height: 130, color: '#ef4444' },
        { id: 'wb8', label: 'Ulceration Dermis Breach', x: 295, y: 270, width: 190, height: 80, color: '#0284c7' },
        { id: 'wb9', label: 'Purulent Exudate (Pus)', x: 330, y: 295, width: 115, height: 35, color: '#eab308' },
      ],
      classification: 'Incision Dehiscence SSI',
    },
  ];
}
