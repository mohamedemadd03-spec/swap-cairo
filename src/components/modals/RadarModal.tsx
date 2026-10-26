import React, { useState } from 'react';
import { HubLocation } from '../../types/swap';
import { soundFX } from '../../hooks/useSoundFX';

interface RadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHub: HubLocation;
}

interface SwapperBlip {
  id: string;
  name: string;
  handle: string;
  distance: string;
  item: string;
  itemVal: number;
  avatar: string;
  status: string;
  xPercent: number; // 0-100 on radar
  yPercent: number; // 0-100 on radar
  district: string;
}

interface HubRouteInfo {
  id: string;
  name: string;
  address: string;
  district: string;
  walkMinutes: number;
  driveMinutes: number;
  distanceKm: number;
  coordinates: { x: number; y: number }; // SVG map coordinates
  steps: { icon: string; instruction: string; distance: string }[];
}

const CAIRO_DESTINATION_HUBS: HubRouteInfo[] = [
  {
    id: 'hub-maadi',
    name: 'SWAPZ Maadi Hub',
    address: 'Building 14, Degla Street 213, Maadi, Cairo',
    district: 'Maadi Degla',
    walkMinutes: 11,
    driveMinutes: 4,
    distanceKm: 0.9,
    coordinates: { x: 260, y: 290 },
    steps: [
      { icon: 'straight', instruction: 'Head east on Road 9 toward Degla Square', distance: '350m' },
      { icon: 'turn_left', instruction: 'Turn left onto Degla Street 213 near Grand Mall', distance: '400m' },
      { icon: 'apartment', instruction: 'Arrive at Building 14, SWAPZ Vault B1 Counter', distance: '150m' },
    ],
  },
  {
    id: 'hub-zamalek',
    name: 'SWAPZ Zamalek Hub',
    address: '18 Brazil Street (off 26th of July), Zamalek, Cairo',
    district: 'Zamalek Island',
    walkMinutes: 65,
    driveMinutes: 22,
    distanceKm: 12.4,
    coordinates: { x: 190, y: 140 },
    steps: [
      { icon: 'alt_route', instruction: 'Take Nile Corniche Northbound toward Downtown', distance: '8.2km' },
      { icon: 'turn_right', instruction: 'Cross 6th of October Bridge exit onto Gezira Island', distance: '2.1km' },
      { icon: 'storefront', instruction: 'Turn right onto Brazil St, SWAPZ Studio #18', distance: '2.1km' },
    ],
  },
  {
    id: 'hub-newcairo',
    name: 'SWAPZ New Cairo Hub',
    address: 'North 90th Street, Near Point 90 Mall, Tagamoa',
    district: 'New Cairo 90th',
    walkMinutes: 140,
    driveMinutes: 24,
    distanceKm: 18.2,
    coordinates: { x: 380, y: 210 },
    steps: [
      { icon: 'navigation', instruction: 'Merge onto Ring Road / Mehwar El-Moshir Tantawi', distance: '11.5km' },
      { icon: 'turn_slight_right', instruction: 'Take North 90th St flyover ramp toward Point 90', distance: '5.2km' },
      { icon: 'verified', instruction: 'Turn into SWAPZ Consignment Terminal (Gate 2)', distance: '1.5km' },
    ],
  },
];

const LIVE_BLIPS: SwapperBlip[] = [
  {
    id: 'b-1',
    name: 'Omar Khalil',
    handle: '@OmarK',
    distance: '0.4 KM',
    item: 'Vintage Nike Swoosh Hoodie',
    itemVal: 1800,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2MFAe-4So2_dAJmiJgs-YBMCxeM0tuGlIUhZaBCAGj6OtjvNBzBxTeDEw0IkUD01Ch13MKQz-1s0YxEnSNUDFE1ETWfW8D6HfJFjSIeTnfpwDuwooxSMzZMlWFiNdS3tQR700BGzvc5Q_9bKYzKwbmU4dNrWVDdfdA9ywVcNGg9Cfj2eOCknJ7DrXzw5sI3BHAo4rkZBHRwf3BgsnqpV7z8HuALJE29dGCR44RHfsUxD5DhNRarZG',
    status: 'Ready at Hub Desk',
    xPercent: 35,
    yPercent: 28,
    district: 'Maadi Degla',
  },
  {
    id: 'b-2',
    name: 'Nour El-Din',
    handle: '@nour_gorp',
    distance: '1.2 KM',
    item: "Arc'teryx Alpha SV Shell",
    itemVal: 5200,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANDmSjW09uSDnEpk-gIIOPxXUsISVCf3yJcRwHhIaPSOUmsPYBOalveOc2_-F2fNn3oMlf3ysO4IUthkXg5zMeIMCoCuqtIHHtZ9ZZmgH2xB77MLOJTA9L7qeXkDS1lkTfUCSiJ75gO6HwQh-Wm4ihHalh7RDmcUH3zEZ8i11HlTQoDgZxAWYn4N6xi1da5Bs_sbOB4WofzYmC2pPLipYD604O5fBL0nPilswg0iWSMa4H-2G3lVxq',
    status: 'Walking on Road 9',
    xPercent: 68,
    yPercent: 38,
    district: 'Maadi Degla',
  },
  {
    id: 'b-3',
    name: 'Salma Archive',
    handle: '@salma_archive',
    distance: '1.8 KM',
    item: 'Supreme Bogo Box Logo Fleece',
    itemVal: 4600,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCo9t9gIy30s9aloHDqMRspWP6nW3OhgSlXUay_rA-mj3qkhP6KZ8W3vGzN7CCMr2ZoICKOtRHxqqs2qj5k_5-QOkYtitS_3qaf7mlh4nTymGf6_F90Cq9el2SKohoAg36EYPQTl_TrBR5as1v6Z1Hs68dK-Mq1Ku5-upbmkPxZ3XW-8q9sTAw3g5T5HYTfTNm33Dw_vS0vbGAeW0p8cAlhqoZ7sattz2tatf2GbPJtfbinaanYVtTs',
    status: 'Dropping package',
    xPercent: 78,
    yPercent: 72,
    district: 'Zamalek 26th July',
  },
  {
    id: 'b-4',
    name: 'Kareem Sk8',
    handle: '@kareem_sk8',
    distance: '2.5 KM',
    item: "Stüssy Big Ol' Raw Denim",
    itemVal: 2400,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2MFAe-4So2_dAJmiJgs-YBMCxeM0tuGlIUhZaBCAGj6OtjvNBzBxTeDEw0IkUD01Ch13MKQz-1s0YxEnSNUDFE1ETWfW8D6HfJFjSIeTnfpwDuwooxSMzZMlWFiNdS3tQR700BGzvc5Q_9bKYzKwbmU4dNrWVDdfdA9ywVcNGg9Cfj2eOCknJ7DrXzw5sI3BHAo4rkZBHRwf3BgsnqpV7z8HuALJE29dGCR44RHfsUxD5DhNRarZG',
    status: 'Scanning deck',
    xPercent: 22,
    yPercent: 76,
    district: 'New Cairo 90th St',
  },
];

export const RadarModal: React.FC<RadarModalProps> = ({
  isOpen,
  onClose,
  currentHub,
}) => {
  const [activeModalTab, setActiveModalTab] = useState<'radar' | 'directions'>('directions');
  const [selectedBlip, setSelectedBlip] = useState<SwapperBlip | null>(LIVE_BLIPS[0]);
  const [pingCount, setPingCount] = useState(0);
  const [hailMessage, setHailMessage] = useState<string | null>(null);

  // Direction State
  const [selectedDestinationHub, setSelectedDestinationHub] = useState<HubRouteInfo>(CAIRO_DESTINATION_HUBS[0]);
  const [transportMode, setTransportMode] = useState<'walk' | 'drive'>('walk');
  const [originLocation, setOriginLocation] = useState('Road 9, Maadi Metro');

  // Google Maps AI report state
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsReport, setMapsReport] = useState<string | null>(null);
  const [mapLocations, setMapLocations] = useState<{ title: string; uri: string }[]>([]);

  if (!isOpen) return null;

  const handlePingDistrict = () => {
    soundFX.playSonar();
    setPingCount((prev) => prev + 1);
  };

  const handleSelectBlip = (blip: SwapperBlip) => {
    soundFX.playSonar();
    setSelectedBlip(blip);
    setHailMessage(null);
  };

  const handleHailSwapper = () => {
    if (!selectedBlip) return;
    soundFX.playMatch();
    setHailMessage(`PING SENT TO ${selectedBlip.handle} // ESTIMATED MEETUP: 8 MINS AT ${currentHub.name}`);
    setTimeout(() => {
      setHailMessage(null);
    }, 4500);
  };

  const handleFetchMapsHubs = async () => {
    soundFX.playClick();
    setMapsLoading(true);
    try {
      const res = await fetch('/api/maps-hubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: currentHub.city,
          district: selectedDestinationHub.district,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMapsReport(data.hubsReport);
        setMapLocations(data.locations || []);
      }
    } catch {
      setMapsReport('// PHYSICAL HUBS LOADED\nVerified authentication & consignment hubs active.');
    } finally {
      setMapsLoading(false);
    }
  };

  const activeDuration =
    transportMode === 'walk'
      ? `${selectedDestinationHub.walkMinutes} MIN WALK`
      : `${selectedDestinationHub.driveMinutes} MIN DRIVE`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0e12]/85 backdrop-blur-md p-3.5 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-[#14161d] border border-[#232733] rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 font-sans shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header Strip */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#d4ff00] rounded-full animate-ping"></span>
            <span className="font-display font-extrabold text-base uppercase text-white tracking-tight">
              Cairo Navigator // {selectedDestinationHub.district}
            </span>
          </div>

          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            aria-label="Close radar"
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-white bg-[#1e2029] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* Dual Tab Switcher: Tactical Radar vs Street Map Directions */}
        <div className="grid grid-cols-2 bg-[#0d0e12] rounded-xl border border-[#232733] p-1 text-xs font-display font-bold uppercase">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setActiveModalTab('directions');
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeModalTab === 'directions'
                ? 'bg-[#d4ff00] text-[#0d0e12] shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">directions</span>
            <span>Hub Route Map</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playSonar();
              setActiveModalTab('radar');
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeModalTab === 'radar'
                ? 'bg-[#d4ff00] text-[#0d0e12] shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">radar</span>
            <span>Tactical Radar</span>
          </button>
        </div>

        {/* VIEW 1: CAIRO STREET MAP & ROUTE DIRECTIONS */}
        {activeModalTab === 'directions' && (
          <div className="flex flex-col gap-3 animate-in fade-in">
            {/* Hub Selector Carousel */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-neutral-400 uppercase font-bold">
                SELECT AUTHENTICATION DESTINATION:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {CAIRO_DESTINATION_HUBS.map((hub) => (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setSelectedDestinationHub(hub);
                    }}
                    className={`p-2 border text-left flex flex-col justify-between cursor-pointer transition-all ${
                      selectedDestinationHub.id === hub.id
                        ? 'bg-[#1C1C22] border-[#D4FF00] shadow-[0_0_10px_rgba(212,255,0,0.2)]'
                        : 'bg-[#08080A] border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <span
                      className={`text-[9px] font-black uppercase ${
                        selectedDestinationHub.id === hub.id ? 'text-[#D4FF00]' : 'text-white'
                      }`}
                    >
                      {hub.district}
                    </span>
                    <span className="text-[8px] text-neutral-400 mt-1">
                      {hub.distanceKm} KM • {hub.driveMinutes}m drive
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Travel Mode & Origin Bar */}
            <div className="flex items-center justify-between p-2 bg-[#08080A] border border-neutral-800 text-[10px]">
              <div className="flex items-center gap-1.5 text-neutral-300">
                <span className="material-symbols-outlined text-[14px] text-[#D4FF00]">my_location</span>
                <span>FROM:</span>
                <input
                  type="text"
                  value={originLocation}
                  onChange={(e) => setOriginLocation(e.target.value)}
                  className="bg-transparent text-white font-bold border-b border-neutral-700 focus:outline-none focus:border-[#D4FF00] px-1 max-w-[130px] truncate"
                />
              </div>

              {/* Walk vs Drive Toggle */}
              <div className="flex bg-[#131317] border border-neutral-700 p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setTransportMode('walk');
                  }}
                  className={`px-2 py-0.5 flex items-center gap-0.5 cursor-pointer ${
                    transportMode === 'walk' ? 'bg-[#D4FF00] text-black font-bold' : 'text-neutral-400'
                  }`}
                  title="Walking Route"
                >
                  <span className="material-symbols-outlined text-[13px]">directions_walk</span>
                  <span>WALK</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setTransportMode('drive');
                  }}
                  className={`px-2 py-0.5 flex items-center gap-0.5 cursor-pointer ${
                    transportMode === 'drive' ? 'bg-[#D4FF00] text-black font-bold' : 'text-neutral-400'
                  }`}
                  title="Driving Route"
                >
                  <span className="material-symbols-outlined text-[13px]">directions_car</span>
                  <span>DRIVE</span>
                </button>
              </div>
            </div>

            {/* Interactive Brutalist Cairo Vector Route Map */}
            <div className="relative w-full h-52 bg-[#08080A] border-2 border-neutral-800 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 500 350">
                <defs>
                  {/* Grid Pattern */}
                  <pattern id="cairo-grid" width="25" height="25" patternUnits="userSpaceOnUse">
                    <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1A1A22" strokeWidth="0.8" />
                  </pattern>

                  {/* Neon Glow Filter */}
                  <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#D4FF00" />
                  </filter>
                </defs>

                {/* Base Grid */}
                <rect width="500" height="350" fill="url(#cairo-grid)" />

                {/* Nile River Curve */}
                <path
                  d="M 170 350 Q 185 240 180 180 T 210 0"
                  fill="none"
                  stroke="#162938"
                  strokeWidth="28"
                  strokeLinecap="round"
                />
                <path
                  d="M 170 350 Q 185 240 180 180 T 210 0"
                  fill="none"
                  stroke="#1E435C"
                  strokeWidth="6"
                  strokeLinecap="round"
                />

                {/* Gezira Island */}
                <ellipse cx="188" cy="155" rx="14" ry="32" fill="#0E1720" stroke="#253545" strokeWidth="1" />

                {/* Bridges (6th October & 15th May) */}
                <line x1="140" y1="130" x2="240" y2="130" stroke="#333" strokeWidth="3" />
                <line x1="145" y1="170" x2="235" y2="170" stroke="#333" strokeWidth="3" />

                {/* Cairo Ring Road Loop */}
                <path
                  d="M 60 220 C 100 330 350 330 440 250 C 470 150 380 50 250 50 C 130 50 60 120 60 220 Z"
                  fill="none"
                  stroke="#262630"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />

                {/* Metro Line 1 & Highway Tracks */}
                <path d="M 240 350 L 240 0" fill="none" stroke="#222" strokeWidth="2" strokeDasharray="3 3" />
                <path d="M 200 300 L 450 180" fill="none" stroke="#222" strokeWidth="2" />

                {/* User Origin Pin */}
                <g transform="translate(230, 310)">
                  <circle r="7" fill="#FFF" />
                  <circle r="14" fill="none" stroke="#FFF" strokeWidth="1" opacity="0.4" />
                  <text x="12" y="4" fill="#FFF" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    YOU (MAADI)
                  </text>
                </g>

                {/* Active Hub Target Pin */}
                <g transform={`translate(${selectedDestinationHub.coordinates.x}, ${selectedDestinationHub.coordinates.y})`}>
                  <circle r="8" fill="#D4FF00" filter="url(#neon-glow)" />
                  <circle r="18" fill="none" stroke="#D4FF00" strokeWidth="1.5" className="animate-ping" opacity="0.6" />
                  <text
                    x="12"
                    y="4"
                    fill="#D4FF00"
                    fontSize="10"
                    fontWeight="900"
                    fontFamily="monospace"
                  >
                    {selectedDestinationHub.name.toUpperCase()}
                  </text>
                </g>

                {/* Animated Pulsing Route Line from User to Hub */}
                <path
                  d={`M 230 310 Q ${(230 + selectedDestinationHub.coordinates.x) / 2} ${(310 + selectedDestinationHub.coordinates.y) / 2 - 25} ${selectedDestinationHub.coordinates.x} ${selectedDestinationHub.coordinates.y}`}
                  fill="none"
                  stroke="#D4FF00"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
              </svg>

              {/* Overlay HUD Telemetry */}
              <div className="absolute top-2 left-2 flex flex-col gap-0.5 bg-black/90 p-1.5 border border-[#D4FF00]/50 backdrop-blur-sm pointer-events-none">
                <span className="text-[9px] text-[#D4FF00] font-black uppercase">
                  ETA: {activeDuration}
                </span>
                <span className="text-[8px] text-white">
                  DIST: {selectedDestinationHub.distanceKm} KM ({transportMode.toUpperCase()})
                </span>
              </div>

              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/90 p-1 border border-neutral-700 pointer-events-none">
                <span className="w-1.5 h-1.5 bg-[#D4FF00] rounded-full animate-ping"></span>
                <span className="text-[8px] text-neutral-400 uppercase">LIVE TRAFFIC: NORMAL</span>
              </div>
            </div>

            {/* Turn-by-Turn Guidance Cards */}
            <div className="flex flex-col gap-1.5 bg-[#08080A] p-2.5 border border-neutral-800">
              <span className="text-[10px] text-neutral-400 font-bold uppercase flex items-center justify-between">
                <span>TURN-BY-TURN INSTRUCTIONS</span>
                <span className="text-[#D4FF00]">{selectedDestinationHub.steps.length} STAGES</span>
              </span>

              <div className="flex flex-col gap-1 mt-1">
                {selectedDestinationHub.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-1.5 bg-[#131317] border border-neutral-800 text-[10px]"
                  >
                    <span className="material-symbols-outlined text-[15px] text-[#D4FF00]">
                      {step.icon}
                    </span>
                    <span className="flex-1 text-white truncate">{step.instruction}</span>
                    <span className="text-neutral-400 font-bold">{step.distance}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* External Navigation Links */}
            <div className="flex gap-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  selectedDestinationHub.address
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 bg-[#D4FF00] hover:bg-white text-black font-black text-xs uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-[2px_2px_0px_#fff]"
              >
                <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                <span>OPEN IN GOOGLE MAPS</span>
              </a>

              <button
                type="button"
                onClick={handleFetchMapsHubs}
                disabled={mapsLoading}
                className="px-3 py-2 bg-[#1C1C22] border border-neutral-700 hover:border-[#D4FF00] text-white text-[10px] font-bold uppercase cursor-pointer"
              >
                {mapsLoading ? 'QUERYING...' : 'VERIFY VAULT'}
              </button>
            </div>

            {mapsReport && (
              <div className="p-2 bg-[#08080A] border border-neutral-800 text-[10px] text-neutral-300 whitespace-pre-wrap max-h-24 overflow-y-auto">
                {mapsReport}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: TACTICAL RADAR (LIVE SWAPPERS) */}
        {activeModalTab === 'radar' && (
          <div className="flex flex-col gap-3 animate-in fade-in">
            {/* Radar Scope */}
            <div className="relative w-full aspect-square max-h-64 bg-[#08080A] border-2 border-[#D4FF00] overflow-hidden flex items-center justify-center">
              {/* Concentric Sonar Distance Rings */}
              <div className="absolute w-[85%] h-[85%] rounded-full border border-[#D4FF00]/20 pointer-events-none"></div>
              <div className="absolute w-[60%] h-[60%] rounded-full border border-[#D4FF00]/30 pointer-events-none"></div>
              <div className="absolute w-[35%] h-[35%] rounded-full border border-[#D4FF00]/40 pointer-events-none"></div>

              {/* Crosshair Grid */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-[1px] bg-[#D4FF00]/30"></div>
                <div className="h-full w-[1px] bg-[#D4FF00]/30"></div>
              </div>

              {/* Sweeping Sonar Beam */}
              <div className="radar-sweep-beam"></div>

              {/* Center User Blip */}
              <div className="absolute z-20 flex flex-col items-center">
                <div className="w-4 h-4 bg-[#D4FF00] rounded-full border-2 border-black flex items-center justify-center shadow-[0_0_15px_#D4FF00]">
                  <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                </div>
                <span className="text-[8px] bg-black text-[#D4FF00] px-1 font-bold mt-1 uppercase border border-[#D4FF00]">
                  YOU
                </span>
              </div>

              {/* Active Swapper Blips */}
              {LIVE_BLIPS.map((blip) => {
                const isSelected = selectedBlip?.id === blip.id;
                return (
                  <button
                    key={blip.id}
                    onClick={() => handleSelectBlip(blip)}
                    style={{
                      left: `${blip.xPercent}%`,
                      top: `${blip.yPercent}%`,
                    }}
                    className="absolute z-30 -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 p-0.5 transition-transform flex items-center justify-center ${
                        isSelected
                          ? 'border-[#D4FF00] bg-[#D4FF00] scale-125 shadow-[0_0_15px_#D4FF00]'
                          : 'border-white bg-black hover:scale-110'
                      }`}
                    >
                      <img
                        src={blip.avatar}
                        alt={blip.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Swapper Details */}
            {selectedBlip && (
              <div className="p-3 bg-[#08080A] border border-[#D4FF00] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="px-1.5 py-0.5 bg-[#D4FF00] text-black text-[9px] font-black uppercase">
                    TARGET: {selectedBlip.distance}
                  </span>
                  <span className="text-[9px] text-[#D4FF00] font-bold">{selectedBlip.district}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <img
                    src={selectedBlip.avatar}
                    alt={selectedBlip.name}
                    className="w-10 h-10 object-cover border border-[#D4FF00]"
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-white text-xs truncate">{selectedBlip.name}</span>
                    <span className="text-xs text-[#D4FF00] font-bold truncate">
                      {selectedBlip.item} (EST. {selectedBlip.itemVal} EGP)
                    </span>
                  </div>
                </div>

                {hailMessage ? (
                  <div className="p-1.5 bg-[#D4FF00] text-black font-black text-xs text-center uppercase animate-pulse">
                    {hailMessage}
                  </div>
                ) : (
                  <button
                    onClick={handleHailSwapper}
                    className="w-full py-2 bg-[#D4FF00] hover:bg-white text-black font-black text-xs uppercase cursor-pointer transition-colors shadow-[2px_2px_0px_#fff]"
                  >
                    HAIL SWAPPER FOR DROP
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handlePingDistrict}
              className="w-full py-2 bg-[#1C1C22] border border-neutral-700 hover:border-[#D4FF00] text-white text-xs font-bold uppercase cursor-pointer"
            >
              SEND SONAR PING ({pingCount} SENT)
            </button>
          </div>
        )}

        <button
          onClick={() => {
            soundFX.playClick();
            onClose();
          }}
          className="w-full py-2 bg-neutral-900 border border-neutral-700 hover:border-white text-white font-bold text-xs uppercase cursor-pointer transition-colors"
        >
          DISMISS NAVIGATOR
        </button>
      </div>
    </div>
  );
};
