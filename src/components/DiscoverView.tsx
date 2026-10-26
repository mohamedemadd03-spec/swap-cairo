import React, { useState, useMemo, useRef } from 'react';
import { Garment, WardrobeItem, FilterSettings } from '../types/swap';
import { soundFX, triggerHaptic } from '../hooks/useSoundFX';
import { BrutalistBurst } from './BrutalistBurst';
import { useLanguage } from '../i18n/LanguageContext';
import {
  rankGarmentsForDiscovery,
  UserTasteProfile,
} from '../services/recommendationEngine';

interface DiscoverViewProps {
  garments: Garment[];
  userWardrobe?: WardrobeItem[];
  currentIndex: number;
  tasteProfile: UserTasteProfile;
  onSwipeRight: (garment: Garment) => void;
  onSwipeLeft: (garment: Garment) => void;
  onResetRadarPasses?: () => void;
  onToggleBookmark: (garment: Garment) => void;
  onOpenItemDetail?: (garment: Garment) => void;
  onRequestSwap?: (garment: Garment) => void;
  onOpenFilters?: () => void;
  activeFilters?: FilterSettings;
  onResetFilters?: () => void;
  onReportGarment?: (garment: Garment, reason: string) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  garments,
  userWardrobe = [],
  currentIndex,
  tasteProfile,
  onSwipeRight,
  onSwipeLeft,
  onResetRadarPasses,
  onToggleBookmark,
  onOpenItemDetail,
  onRequestSwap,
  onOpenFilters,
  activeFilters,
  onResetFilters,
  onReportGarment,
}) => {
  const { language, t } = useLanguage();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [burstActive, setBurstActive] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'grid'>('card');
  const [gridTab, setGridTab] = useState<'all' | 'liked' | 'top'>('all');
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const dragStartXRef = useRef<number | null>(null);
  const didDragRef = useRef(false);

  const cardRef = useRef<HTMLDivElement>(null);

  // Inherit active search query & category from side-panel filters
  const searchQuery = activeFilters?.searchQuery || '';
  const selectedCategory = activeFilters?.category || 'all';
  const maxRadiusKm = activeFilters?.maxDistanceKm || 15;

  // 1. RECOMMENDATION ENGINE: Ranked Unswiped Deck for Single Card Browsing
  const { rankedDeck, matchScores } = useMemo(() => {
    return rankGarmentsForDiscovery(garments, tasteProfile, {
      filterCategory: selectedCategory,
      searchQuery,
      maxDistanceKm: maxRadiusKm,
      excludeSwiped: true, // Only show unswiped items in deck!
    });
  }, [garments, tasteProfile, selectedCategory, searchQuery, maxRadiusKm]);

  // 2. RECOMMENDATION ENGINE: Full Catalog with Match Scores for Grid Browsing
  const { rankedDeck: allRankedGarments, matchScores: allMatchScores } = useMemo(() => {
    return rankGarmentsForDiscovery(garments, tasteProfile, {
      filterCategory: selectedCategory,
      searchQuery,
      maxDistanceKm: maxRadiusKm,
      excludeSwiped: false,
    });
  }, [garments, tasteProfile, selectedCategory, searchQuery, maxRadiusKm]);

  // Liked Garments Collection
  const likedGarments = useMemo(() => {
    const likedSet = new Set(tasteProfile.likedGarmentIds);
    return garments.filter((g) => likedSet.has(g.id));
  }, [garments, tasteProfile.likedGarmentIds]);

  // Displayed Grid Items based on active tab
  const displayedGridGarments = useMemo(() => {
    if (gridTab === 'liked') return likedGarments;
    if (gridTab === 'top') return allRankedGarments.slice(0, 12);
    return allRankedGarments;
  }, [gridTab, likedGarments, allRankedGarments]);

  // Active top card in deck
  const activeGarment = rankedDeck[0] || null;

  const flashToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  // 1-Tap SWAP / Like: Updates taste profile, triggers burst, advances deck immediately
  const handleSwapLike = (garment: Garment) => {
    triggerHaptic('trade');
    soundFX.playMatch();
    setBurstActive(true);
    flashToast(language === 'ar' ? '❤️ اتسجل في ذوقك المفضل!' : '❤️ Added to Liked Fits!');
    onSwipeRight(garment);
  };

  // 1-Tap PASS: Advances deck immediately without sending offers
  const handlePass = (garment: Garment) => {
    triggerHaptic('pass');
    soundFX.playClick();
    flashToast(language === 'ar' ? '✕ تم التخطي' : '✕ Passed');
    onSwipeLeft(garment);
  };

  // Direct Swap Offer Propose: Explicitly opens the closet picker modal
  const handleDirectTradePropose = (garment: Garment) => {
    triggerHaptic('trade');
    soundFX.playClick();
    if (onRequestSwap) {
      onRequestSwap(garment);
    }
  };

  // Touch gesture physics
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartXRef.current = e.clientX;
    didDragRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartXRef.current === null) return;
    const delta = e.clientX - dragStartXRef.current;
    if (Math.abs(delta) > 8) {
      didDragRef.current = true;
    }
    setDragOffsetX(delta);
  };

  const handlePointerEnd = () => {
    if (dragStartXRef.current === null) return;
    const finalDelta = dragOffsetX;
    dragStartXRef.current = null;
    setDragOffsetX(0);

    if (!activeGarment) return;
    if (finalDelta > 80) {
      handleSwapLike(activeGarment);
    } else if (finalDelta < -80) {
      handlePass(activeGarment);
    }
  };

  const hasActiveFilters = Boolean(searchQuery || selectedCategory !== 'all' || maxRadiusKm < 15);

  return (
    <main className="flex-1 flex flex-col relative w-full min-h-dvh pt-16 pb-20 bg-[#131315] max-w-md mx-auto">
      <BrutalistBurst active={burstActive} type="swap" onComplete={() => setBurstActive(false)} />

      <div className="flex flex-col flex-1 w-full">
        {/* Clean, High-Speed Discover Header (Edge-to-Edge in Phone Form) */}
        <div className="px-3 pt-2 pb-2 flex items-center justify-between gap-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#caf300] animate-pulse shrink-0" />
            <h1 className="font-display text-xs font-bold uppercase text-white tracking-tight truncate">
              {t('cairoFeed')}
            </h1>
            <span className="font-mono text-[9px] text-[#caf300] bg-[#caf300]/10 px-1.5 py-0.5 rounded-full font-bold shrink-0">
              {viewMode === 'card' ? rankedDeck.length : allRankedGarments.length} {t('live')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Mode Toggle: Card vs Grid */}
            <div className="flex items-center bg-[#201f21] rounded-full p-0.5 border border-white/5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setViewMode('card');
                }}
                className={`px-2.5 py-1 rounded-full font-mono text-[9.5px] uppercase transition-all cursor-pointer ${
                  viewMode === 'card'
                    ? 'bg-[#caf300] text-[#171e00] font-bold'
                    : 'text-[#c5c9ac] hover:text-white'
                }`}
              >
                {t('cardView')}
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setViewMode('grid');
                }}
                className={`px-2.5 py-1 rounded-full font-mono text-[9.5px] uppercase transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#caf300] text-[#171e00] font-bold'
                    : 'text-[#c5c9ac] hover:text-white'
                }`}
              >
                {t('gridView')}
              </button>
            </div>

            {/* Side-Panel Search & Filter Trigger */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                soundFX.playClick();
                onOpenFilters?.();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#201f21] hover:bg-[#2a2a2c] text-white border border-white/10 font-mono text-[9.5px] font-bold uppercase transition-colors cursor-pointer shrink-0"
              title="Open Search & Category Filters"
            >
              <span className="material-symbols-outlined text-[14px] text-[#caf300]">tune</span>
              <span>{t('filterButton')}</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#caf300] animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Active Filter Removable Banner (Only when filters are active) */}
        {hasActiveFilters && (
          <div className="my-2 mx-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#18181a] border border-[#caf300]/40 font-mono text-[10px] animate-in fade-in">
            <div className="flex items-center gap-1.5 text-white truncate">
              <span className="text-[#caf300] font-bold">{t('activeFiltersLabel')}</span>
              <span className="truncate">
                {selectedCategory !== 'all' ? selectedCategory.toUpperCase() : ''}
                {searchQuery ? ` "${searchQuery}"` : ''}
                {maxRadiusKm < 15 ? ` (<${maxRadiusKm}km)` : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onResetFilters?.();
              }}
              className="text-[#caf300] hover:underline font-bold uppercase shrink-0 ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 1: SINGLE CARD SWIPE DISCOVERY (AI RECOMMENDATION DECK)  */}
        {/* ============================================================== */}
        {viewMode === 'card' && (
          <div className="flex-1 flex flex-col justify-between w-full">
            {activeGarment ? (
              <div className="flex-1 flex flex-col justify-between w-full">
                {/* Primary Discovery Card with gesture physics */}
                <div
                  ref={cardRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  onPointerCancel={handlePointerEnd}
                  onClick={() => {
                    if (!didDragRef.current) {
                      onOpenItemDetail?.(activeGarment);
                    }
                  }}
                  className="relative w-full flex-1 min-h-[calc(100dvh-235px)] overflow-hidden bg-[#0e0e10] shadow-2xl flex flex-col justify-between transition-transform duration-150 ease-out select-none touch-pan-y cursor-grab active:cursor-grabbing border-b border-[#26262e]"
                  style={{
                    transform:
                      dragOffsetX !== 0
                        ? `translateX(${dragOffsetX}px) rotate(${(dragOffsetX * 0.04).toFixed(2)}deg)`
                        : undefined,
                    backgroundImage: `linear-gradient(to top, rgba(14,14,16,0.96) 0%, rgba(14,14,16,0.15) 48%, rgba(14,14,16,0.75) 100%), url('${activeGarment.imageUrl}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {/* Visual Touch-Swipe Stamp Overlays */}
                  {dragOffsetX > 35 && (
                    <div className="absolute top-14 left-4 z-30 px-3.5 py-1.5 rounded-xl border-2 border-[#caf300] bg-[#131315]/95 text-[#caf300] font-display font-black text-base uppercase tracking-wider -rotate-6 shadow-2xl pointer-events-none flex items-center gap-1">
                      <span>SWAP</span>
                      <span>❤️</span>
                    </div>
                  )}
                  {dragOffsetX < -35 && (
                    <div className="absolute top-14 right-4 z-30 px-3.5 py-1.5 rounded-xl border-2 border-red-500/80 bg-[#131315]/95 text-red-400 font-display font-black text-base uppercase tracking-wider rotate-6 shadow-2xl pointer-events-none flex items-center gap-1">
                      <span>PASS</span>
                      <span>✕</span>
                    </div>
                  )}

                  {/* Top Card Micro-HUD: Proximity, Value & Style Match Badge */}
                  <div className="relative z-10 p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#131315]/90 border border-[#caf300]/40 backdrop-blur-md">
                      <span className="material-symbols-outlined text-[#caf300] text-[13px]">location_on</span>
                      <span className="font-mono text-[10.5px] font-bold text-white">
                        {activeGarment.distance}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="px-2.5 py-1 rounded-full bg-[#201f21]/90 backdrop-blur-md border border-white/10">
                        <span className="font-mono text-xs text-[#caf300] font-bold">
                          {activeGarment.estValue} EGP
                        </span>
                      </div>

                      {/* Quality & Safety Flag */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundFX.playClick();
                          setReportMenuOpen(!reportMenuOpen);
                        }}
                        title="Flag worn-out or unsafe listing"
                        className="w-7 h-7 rounded-full bg-[#131315]/90 hover:bg-red-500/20 text-[#8f9378] hover:text-red-400 border border-white/10 flex items-center justify-center backdrop-blur-md cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">flag</span>
                      </button>
                    </div>
                  </div>

                  {/* Quality Report Menu */}
                  {reportMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="relative z-20 mx-3 p-3 rounded-xl bg-[#131315]/95 border border-red-500/40 backdrop-blur-xl flex flex-col gap-1.5 animate-in fade-in"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] text-red-400 font-bold uppercase">
                        <span>🛡️ Report Listing</span>
                        <button
                          type="button"
                          onClick={() => setReportMenuOpen(false)}
                          className="text-[#c5c9ac] hover:text-white cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 font-mono text-[9.5px]">
                        {[
                          { label: 'Worn Out (<7.5)', reason: 'Poor / Worn-Out Condition' },
                          { label: 'Not Clothing', reason: 'Non-Apparel Object' },
                          { label: 'Inappropriate', reason: 'Unsafe Content' },
                        ].map((opt) => (
                          <button
                            key={opt.reason}
                            type="button"
                            onClick={() => {
                              soundFX.playClick();
                              setReportMenuOpen(false);
                              onReportGarment?.(activeGarment, opt.reason);
                              flashToast(`🛡️ Flagged & hidden: ${opt.reason}`);
                            }}
                            className="py-1.5 px-2 rounded-lg bg-[#201f21] hover:bg-red-500/20 text-white hover:text-red-300 border border-white/10 cursor-pointer font-bold"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom Content Overlay with Style Match algorithm badge */}
                  <div className="relative z-10 p-3.5 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-[#caf300] text-[#171e00] font-mono text-[10px] font-bold uppercase">
                        {t('size')} {activeGarment.size}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#201f21]/90 text-[#c5c9ac] font-mono text-[10px] uppercase border border-white/10">
                        {activeGarment.condition || '9.2 / 10 MINT'}
                      </span>
                      
                      {/* AI Style Match Badge */}
                      <span className="px-2 py-0.5 rounded bg-[#caf300]/15 text-[#caf300] font-mono text-[10px] font-bold uppercase border border-[#caf300]/30 flex items-center gap-1">
                        <span>🔥</span>
                        <span>{matchScores.get(activeGarment.id) || 85}% {t('styleMatch')}</span>
                      </span>

                      {(activeGarment.isLiveCameraVerified || activeGarment.angles?.tag) && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9.5px] font-bold uppercase border border-emerald-500/40 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]">photo_camera</span>
                          <span>{t('liveCamBadge')}</span>
                        </span>
                      )}
                    </div>

                    <h2 className="font-display text-xl text-white font-bold tracking-tight leading-snug truncate">
                      {activeGarment.title}
                    </h2>

                    {/* Owner Row */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={activeGarment.owner.avatarUrl}
                          alt={activeGarment.owner.name}
                          className="w-6 h-6 rounded-full object-cover ring-1 ring-[#caf300]/50"
                        />
                        <span className="font-mono text-xs text-white font-medium truncate">
                          @{activeGarment.owner.handle}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#caf300] font-bold">
                        {activeGarment.owner.swapCount} Swaps • {activeGarment.owner.rating}★
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3-ACTION MOBILE CONTROL BAR: PASS ✕ | DIRECT TRADE ⇄ | SWAP ❤️ */}
                <div className="w-full px-3 py-2.5 bg-[#131315] flex items-center justify-between gap-2.5 border-t border-white/5">
                  {/* Left: PASS ✕ */}
                  <button
                    type="button"
                    onClick={() => handlePass(activeGarment)}
                    aria-label="Pass / Skip Item"
                    className="h-12 w-12 rounded-full bg-[#201f21] hover:bg-red-500/20 text-[#c6c6c7] hover:text-red-400 active:scale-90 flex items-center justify-center transition-all border border-white/10 cursor-pointer shrink-0"
                    title={t('passBtn')}
                  >
                    <span className="material-symbols-outlined text-[22px]">close</span>
                  </button>

                  {/* Center: DIRECT PROPOSE SWAP (Selects wardrobe piece to trade) */}
                  <button
                    type="button"
                    onClick={() => handleDirectTradePropose(activeGarment)}
                    className="h-12 flex-1 rounded-full bg-[#201f21] hover:bg-[#2a2a2c] text-white border border-[#caf300]/40 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm px-3"
                    title={t('proposeSwapDirect')}
                  >
                    <span className="material-symbols-outlined text-[17px] text-[#caf300]">sync_alt</span>
                    <span className="font-mono text-[11.5px] font-bold uppercase tracking-wider truncate">
                      {t('proposeSwapDirect')}
                    </span>
                  </button>

                  {/* Right: SWAP ❤️ (Like / Vibe Check - Feeds Algorithm & Liked Collection) */}
                  <button
                    type="button"
                    onClick={() => handleSwapLike(activeGarment)}
                    aria-label="SWAP / Like Item"
                    className="h-12 px-4 rounded-full bg-[#caf300] hover:bg-[#d9ff1a] text-[#171e00] font-mono text-[12px] font-bold uppercase active:scale-90 flex items-center justify-center gap-1.5 shadow-lg shadow-[#caf300]/25 transition-all cursor-pointer shrink-0"
                    title={t('swapLikeBtn')}
                  >
                    <span className="material-symbols-outlined text-[18px]">favorite</span>
                    <span>{t('swapLikeBtn')}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* END OF RADAR DECK (All pieces reviewed in current radius) */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in min-h-[calc(100dvh-235px)]">
                <div className="w-18 h-18 rounded-full bg-[#caf300]/10 border-2 border-[#caf300]/40 flex items-center justify-center mb-4 relative">
                  <span className="w-8 h-8 rounded-full bg-[#caf300] animate-ping absolute opacity-25" />
                  <span className="material-symbols-outlined text-[32px] text-[#caf300]">radar</span>
                </div>
                <h3 className="font-display text-base font-bold uppercase text-white tracking-tight mb-2">
                  {t('deckFinishedTitle')}
                </h3>
                <p className="font-mono text-xs text-[#c5c9ac] max-w-xs mb-4 leading-relaxed">
                  {t('deckFinishedDesc')}
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#201f21] border border-white/10 font-mono text-[11px] text-[#caf300] font-bold mb-6">
                  <span>❤️</span>
                  <span>{tasteProfile.likedGarmentIds.length} {t('likedFits')}</span>
                </div>
                <div className="w-full flex flex-col gap-2.5 max-w-xs">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setViewMode('grid');
                      setGridTab('liked');
                    }}
                    className="w-full py-3 rounded-xl bg-[#caf300] hover:bg-[#d9ff1a] text-[#171e00] font-mono text-xs font-bold uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-[#caf300]/20 cursor-pointer transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[17px]">grid_view</span>
                    <span>{t('viewLikedInGrid')} ({tasteProfile.likedGarmentIds.length})</span>
                  </button>
                  {onResetRadarPasses && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        soundFX.playClick();
                        onResetRadarPasses();
                        flashToast(language === 'ar' ? '🔄 تم تحديث الرادار بستايلي الجديد' : '🔄 Radar deck refreshed');
                      }}
                      className="w-full py-3 rounded-xl bg-[#201f21] hover:bg-[#2a2a2c] text-white border border-white/10 font-mono text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[17px] text-[#caf300]">refresh</span>
                      <span>{t('refreshRadar')}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 2: CONTINUOUS PROXIMITY GRID WITH LIKED FITS & AI PICKS   */}
        {/* ============================================================== */}
        {viewMode === 'grid' && (
          <div className="flex-1 flex flex-col w-full">
            {/* Grid Sub-Filter Tabs (All vs Liked vs Top Match) */}
            <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto border-b border-white/5 scrollbar-none">
              <button
                type="button"
                onClick={() => setGridTab('all')}
                className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase font-bold shrink-0 transition-colors cursor-pointer ${
                  gridTab === 'all'
                    ? 'bg-[#caf300] text-[#171e00]'
                    : 'bg-[#201f21] text-[#c5c9ac] hover:text-white border border-white/5'
                }`}
              >
                {t('gridTabAll')} ({allRankedGarments.length})
              </button>
              <button
                type="button"
                onClick={() => setGridTab('liked')}
                className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase font-bold shrink-0 transition-colors flex items-center gap-1 cursor-pointer ${
                  gridTab === 'liked'
                    ? 'bg-[#caf300] text-[#171e00]'
                    : 'bg-[#201f21] text-[#c5c9ac] hover:text-white border border-white/5'
                }`}
              >
                <span>{t('gridTabLiked')}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[9px]">
                  {likedGarments.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setGridTab('top')}
                className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase font-bold shrink-0 transition-colors cursor-pointer ${
                  gridTab === 'top'
                    ? 'bg-[#caf300] text-[#171e00]'
                    : 'bg-[#201f21] text-[#c5c9ac] hover:text-white border border-white/5'
                }`}
              >
                {t('gridTabTopMatch')}
              </button>
            </div>

            {/* Grid Items List */}
            {displayedGridGarments.length === 0 ? (
              <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-[#201f21] flex items-center justify-center text-[#caf300] mb-2 border border-white/10">
                  <span className="material-symbols-outlined text-xl">favorite_border</span>
                </div>
                <h4 className="font-display text-sm font-bold text-white uppercase">
                  {gridTab === 'liked' ? 'No liked pieces yet' : t('noPiecesMatching')}
                </h4>
                <p className="font-mono text-xs text-[#c5c9ac] mt-1 max-w-xs">
                  {gridTab === 'liked'
                    ? (language === 'ar' ? 'اسحب يمين أو دوس SWAP ❤️ في شاشة الكروت عشان تظهر القطع هنا' : 'Swipe right or tap SWAP ❤️ on cards to save your favorites here')
                    : t('noPiecesHint')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 p-2.5">
                {displayedGridGarments.map((garment) => {
                  const match = allMatchScores.get(garment.id) || 80;
                  const isLiked = tasteProfile.likedGarmentIds.includes(garment.id);

                  return (
                    <div
                      key={garment.id}
                      className="rounded-2xl bg-[#1c1b1d] border border-[#26262e] overflow-hidden flex flex-col group hover:border-[#caf300]/50 transition-all shadow-sm"
                    >
                      {/* Thumbnail with Proximity Distance & Value */}
                      <div
                        onClick={() => onOpenItemDetail?.(garment)}
                        className="relative aspect-square bg-[#0e0e10] bg-cover bg-center cursor-pointer"
                        style={{ backgroundImage: `url('${garment.imageUrl}')` }}
                      >
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#131315]/90 backdrop-blur-md border border-[#caf300]/40 text-[#caf300] font-mono text-[9px] font-bold flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[10px]">near_me</span>
                          <span>{garment.distance}</span>
                        </div>
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#131315]/80 backdrop-blur-md text-white font-mono text-[9.5px] font-bold">
                          {garment.estValue} EGP
                        </div>

                        {/* Top-Right Liked Heart Badge if swiped */}
                        {isLiked && (
                          <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-[#131315]/90 border border-[#caf300]/40 flex items-center justify-center text-[#caf300] shadow-sm">
                            <span className="material-symbols-outlined text-[13px]">favorite</span>
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 flex flex-col flex-1 justify-between gap-2">
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-mono text-[8.5px] uppercase tracking-wider text-[#c5c9ac] truncate">
                              {garment.brand} • {garment.size}
                            </span>
                            <span className="font-mono text-[8.5px] text-[#caf300] font-bold shrink-0">
                              🔥 {match}%
                            </span>
                          </div>
                          <h4
                            onClick={() => onOpenItemDetail?.(garment)}
                            className="font-display text-xs font-bold text-white truncate cursor-pointer hover:text-[#caf300]"
                          >
                            {garment.title}
                          </h4>
                          <p className="font-mono text-[9.5px] text-[#8f9378] truncate mt-0.5">
                            by @{garment.owner.handle}
                          </p>
                        </div>

                        {/* Direct Trade Button on Grid Cards */}
                        <button
                          type="button"
                          onClick={() => handleDirectTradePropose(garment)}
                          className="w-full py-1.5 rounded-lg bg-[#caf300] text-[#171e00] font-mono text-[10.5px] font-bold uppercase tracking-wide flex items-center justify-center gap-1 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[13px]">sync_alt</span>
                          <span>{t('requestSwap')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ephemeral Feedback Toast */}
      {toastMessage && (
        <div className="fixed top-20 inset-x-4 z-50 pointer-events-none flex justify-center animate-in fade-in slide-in-from-top-2">
          <div className="bg-[#201f21]/95 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-[#caf300]/40">
            <span className="material-symbols-outlined text-[#caf300] text-[16px]">verified</span>
            <span className="font-mono text-xs text-white">{toastMessage}</span>
          </div>
        </div>
      )}
    </main>
  );
};
