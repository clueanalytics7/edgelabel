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
