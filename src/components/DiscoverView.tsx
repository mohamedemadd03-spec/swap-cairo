import React, { useState, useMemo, useRef } from 'react';
import { Garment, WardrobeItem, FilterSettings } from '../types/swap';
import { soundFX, triggerHaptic } from '../hooks/useSoundFX';
import { BrutalistBurst } from './BrutalistBurst';
import { useLanguage } from '../i18n/LanguageContext';
import { UserTasteProfile, rankCairoFeedEngine, loadTasteProfile } from '../services/recommendationEngine';

interface DiscoverViewProps {
  garments: Garment[];
  userWardrobe?: WardrobeItem[];
  currentIndex: number;
  onSwipeRight: (garment: Garment) => void;
  onSwipeLeft: (garment: Garment) => void;
  onToggleBookmark: (garment: Garment) => void;
  onOpenItemDetail?: (garment: Garment) => void;
  onRequestSwap?: (garment: Garment) => void;
  onOpenFilters?: () => void;
  activeFilters?: FilterSettings;
  onResetFilters?: () => void;
  onReportGarment?: (garment: Garment, reason: string) => void;
  tasteProfile?: UserTasteProfile;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  garments,
  userWardrobe = [],
  currentIndex,
  onSwipeRight,
  onSwipeLeft,
  onToggleBookmark,
  onOpenItemDetail,
  onRequestSwap,
  onOpenFilters,
  activeFilters,
  onResetFilters,
  onReportGarment,
  tasteProfile,
}) => {
  const { language, t } = useLanguage();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [burstActive, setBurstActive] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'grid'>('card');
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const [selectedGenderFit, setSelectedGenderFit] = useState<'all' | 'womens' | 'mens'>('all');
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const dragStartXRef = useRef<number | null>(null);
  const didDragRef = useRef(false);

  const cardRef = useRef<HTMLDivElement>(null);

  // Session Swiped tracking for non-repeating stream behind the scenes
  const [sessionSwipedIds, setSessionSwipedIds] = useState<Set<string>>(() => new Set());

  // Inherit active search query & category from side-panel filters
  const searchQuery = activeFilters?.searchQuery || '';
  const selectedCategory = activeFilters?.category || 'all';
  const maxRadiusKm = activeFilters?.maxDistanceKm || 15;

  const handleResetFilters = () => {
    setSessionSwipedIds(new Set());
    onResetFilters?.();
  };

  // Master Cairo Multi-Vector Recommendation & Trade Synergy Engine
  const { rankedDeck } = useMemo(() => {
    return rankCairoFeedEngine(
      garments,
      tasteProfile || loadTasteProfile(),
      userWardrobe,
      {
        filterCategory: selectedCategory,
        searchQuery,
        maxDistanceKm: maxRadiusKm,
        sessionSwipedIds,
      }
    );
  }, [garments, tasteProfile, userWardrobe, selectedCategory, searchQuery, maxRadiusKm, sessionSwipedIds]);

  const filteredAndSortedGarments = rankedDeck;

  const displayedDeck = useMemo(() => {
    return filteredAndSortedGarments.filter((g) => {
      if (selectedGenderFit === 'all') return true;
      const fit = g.genderFit || 'unisex';
      if (selectedGenderFit === 'womens') {
        return fit === 'womens' || fit === 'unisex';
      }
      if (selectedGenderFit === 'mens') {
        return fit === 'mens' || fit === 'unisex';
      }
      return true;
    });
  }, [filteredAndSortedGarments, selectedGenderFit]);

  const activeIndex = displayedDeck.length > 0 ? currentIndex % displayedDeck.length : 0;
  const activeGarment = displayedDeck[activeIndex];
  const nextGarment = displayedDeck.length > 1 ? displayedDeck[(activeIndex + 1) % displayedDeck.length] : null;

  const flashToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  const handleOpenTradeRequest = (garment: Garment) => {
    triggerHaptic('trade');
    soundFX.playClick();
    if (onRequestSwap) {
      onRequestSwap(garment);
    }
  };

  const handlePass = () => {
    if (!activeGarment) return;
    triggerHaptic('pass');
    soundFX.playClick();
    setSessionSwipedIds((prev) => new Set(prev).add(activeGarment.id));
    onSwipeLeft(activeGarment);
  };

  const handleSave = () => {
    if (!activeGarment) return;
    triggerHaptic('click');
    soundFX.playClick();
    onToggleBookmark(activeGarment);
    flashToast(activeGarment.isStashed ? "Removed from Vault Watchlist" : "Saved to your Vault Watchlist");
  };

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
      triggerHaptic('light');
      soundFX.playClick();
      setSessionSwipedIds((prev) => new Set(prev).add(activeGarment.id));
      onSwipeRight(activeGarment);
    } else if (finalDelta < -80) {
      handlePass();
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
              {filteredAndSortedGarments.length} {t('live')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Mode Toggle */}
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

        {/* Smart Streetwear Gender / Fit Segment Selector */}
        <div className="px-3 pt-2">
          <div className="flex items-center gap-1 bg-[#18171b] p-1 rounded-xl border border-white/10 font-mono text-[10px]">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                soundFX.playClick();
                setSelectedGenderFit('all');
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                selectedGenderFit === 'all'
                  ? 'bg-[#caf300] text-[#171e00] font-black shadow-sm'
                  : 'text-[#c5c9ac] hover:text-white'
              }`}
            >
              <span>{language === 'ar' ? 'الكل / UNISEX' : 'ALL // UNISEX'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                soundFX.playClick();
                setSelectedGenderFit('womens');
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                selectedGenderFit === 'womens'
                  ? 'bg-[#ff69b4] text-[#1a0010] font-black shadow-sm'
                  : 'text-[#c5c9ac] hover:text-[#ff69b4]'
              }`}
            >
              <span>🌸</span>
              <span>{language === 'ar' ? 'بنات (HER)' : 'FOR HER 🌸'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                soundFX.playClick();
                setSelectedGenderFit('mens');
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                selectedGenderFit === 'mens'
                  ? 'bg-[#caf300] text-[#171e00] font-black shadow-sm'
                  : 'text-[#c5c9ac] hover:text-white'
              }`}
            >
              <span>⚡</span>
              <span>{language === 'ar' ? 'شباب (HIM)' : 'FOR HIM ⚡'}</span>
            </button>
          </div>
        </div>

        {/* Active Filter Removable Banner (Only when filters are active) */}
        {hasActiveFilters && (
          <div className="my-2 flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#18181a] border border-[#caf300]/40 font-mono text-[10px] animate-in fade-in">
            <div className="flex items-center gap-1.5 text-white truncate">
              <span className="text-[#caf300] font-bold">ACTIVE:</span>
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
                handleResetFilters();
              }}
              className="text-[#caf300] hover:underline font-bold uppercase shrink-0 ml-2 cursor-pointer"
            >
              Clear ✕
            </button>
          </div>
        )}

        {/* Empty State when filter yields 0 matches */}
        {filteredAndSortedGarments.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-[#201f21] flex items-center justify-center text-[#caf300] mb-3 border border-white/10">
              <span className="material-symbols-outlined text-2xl">travel_explore</span>
            </div>
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-tight">
              {t('noPiecesMatching')}
            </h3>
            <p className="font-sans text-xs text-[#c5c9ac] mt-1 max-w-xs">
              {t('noPiecesHint')}
            </p>
            <button
              type="button"
              onClick={() => {
                handleResetFilters();
              }}
              className="mt-3 px-3.5 py-1.5 rounded-lg bg-[#caf300] text-[#171e00] font-mono text-[11px] font-bold uppercase cursor-pointer"
            >
              {t('resetFilters')}
            </button>
          </div>
        ) : (
          <>
            {/* VIEW MODE 1: SINGLE FOCUSED MOBILE CARD (Full width & height of phone screen) */}
            {viewMode === 'card' && activeGarment && (
              <div className="flex-1 flex flex-col justify-between w-full">
                {/* Primary Discovery Card — spans full phone width with native touch-swipe physics */}
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
                  {/* Live Touch-Swipe Stamp Overlays */}
                  {dragOffsetX > 35 && (
                    <div className="absolute top-14 left-4 z-30 px-3 py-1 rounded-xl border-2 border-[#caf300] bg-[#131315]/90 text-[#caf300] font-display font-black text-base uppercase tracking-wider -rotate-6 shadow-xl pointer-events-none">
                      SWAP ⇄
                    </div>
                  )}
                  {dragOffsetX < -35 && (
                    <div className="absolute top-14 right-4 z-30 px-3 py-1 rounded-xl border-2 border-white/60 bg-[#131315]/90 text-white font-display font-black text-base uppercase tracking-wider rotate-6 shadow-xl pointer-events-none">
                      SKIP →
                    </div>
                  )}
                  {/* Top Card Micro-HUD: Proximity Pill, Value & Quality Flag */}
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

                      {/* Quality & Safety Flag Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundFX.playClick();
                          setReportMenuOpen(!reportMenuOpen);
                        }}
                        title="Flag worn-out, non-clothing, or inappropriate listing"
                        className="w-7 h-7 rounded-full bg-[#131315]/90 hover:bg-red-500/20 text-[#8f9378] hover:text-red-400 border border-white/10 flex items-center justify-center backdrop-blur-md cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">flag</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Report / Quality Gate Popover */}
                  {reportMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="relative z-20 mx-3 p-3 rounded-xl bg-[#131315]/95 border border-red-500/40 backdrop-blur-xl flex flex-col gap-1.5 animate-in fade-in"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] text-red-400 font-bold uppercase">
                        <span>🛡️ Report Quality / Safety Issue</span>
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

                  {/* Bottom Content Overlay (Clean, Mobile-Optimized) */}
                  <div className="relative z-10 p-3.5 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-[#caf300] text-[#171e00] font-mono text-[10px] font-bold uppercase">
                        {t('size')} {activeGarment.size}
                      </span>
                      {activeGarment.isGirlsOnlyCircle ? (
                        <span className="px-2 py-0.5 rounded bg-[#ff69b4]/25 text-[#ff69b4] font-mono text-[9.5px] font-bold uppercase border border-[#ff69b4]/50 flex items-center gap-1">
                          <span>🌸</span>
                          <span>GIRLS CIRCLE</span>
                        </span>
                      ) : activeGarment.genderFit === 'womens' ? (
                        <span className="px-2 py-0.5 rounded bg-[#ff69b4]/20 text-[#ff69b4] font-mono text-[9.5px] font-bold uppercase border border-[#ff69b4]/40">
                          HER FIT 🌸
                        </span>
                      ) : activeGarment.genderFit === 'mens' ? (
                        <span className="px-2 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] font-mono text-[9.5px] font-bold uppercase border border-[#38bdf8]/40">
                          HIM FIT ⚡
                        </span>
                      ) : null}
                      <span className="px-2 py-0.5 rounded bg-[#201f21]/90 text-[#c5c9ac] font-mono text-[10px] uppercase border border-white/10">
                        {activeGarment.condition || '9.2 / 10 MINT'}
                      </span>
                      {(activeGarment.isLiveCameraVerified || activeGarment.angles?.tag) && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9.5px] font-bold uppercase border border-emerald-500/40 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]">photo_camera</span>
                          <span>{t('liveCamBadge')}</span>
                        </span>
                      )}
                      {userWardrobe.some(
                        (w) =>
                          w.status !== 'pending' &&
                          Math.abs((w.value || 0) - activeGarment.estValue) <= 150
                      ) && (
                        <span className="px-2 py-0.5 rounded bg-[#caf300]/20 text-[#caf300] font-mono text-[9.5px] font-bold uppercase border border-[#caf300]/40 flex items-center gap-0.5">
                          <span>{t('highMatchOdds')}</span>
                        </span>
                      )}
                      <span className="ml-auto font-mono text-[10px] text-[#c5c9ac]">
                        {activeIndex + 1} / {displayedDeck.length}
                      </span>
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

                {/* Integrated Mobile Action Bar (Spans full phone width cleanly) */}
                <div className="w-full px-3 py-2.5 bg-[#131315] flex items-center justify-center gap-3">
                  <button
                    onClick={handlePass}
                    aria-label="Next Item"
                    className="h-12 w-12 rounded-full bg-[#201f21] text-[#c6c6c7] hover:text-white active:scale-90 flex items-center justify-center transition-all border border-white/10 cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-[20px]">skip_next</span>
                  </button>

                  <button
                    onClick={() => handleOpenTradeRequest(activeGarment)}
                    className="h-12 flex-1 rounded-full bg-[#caf300] text-[#171e00] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#caf300]/20 hover:brightness-105 cursor-pointer font-bold"
                  >
                    <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
                    <span className="font-mono text-[13px] uppercase tracking-wider font-bold">
                      {t('requestSwap')}
                    </span>
                  </button>

                  <button
                    onClick={handleSave}
                    aria-label="Save to Watchlist"
                    className={`h-12 w-12 rounded-full bg-[#201f21] active:scale-90 flex items-center justify-center transition-all border border-white/10 cursor-pointer shrink-0 ${
                      activeGarment.isStashed ? 'text-[#caf300]' : 'text-[#c6c6c7] hover:text-white'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ fontVariationSettings: activeGarment.isStashed ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      bookmark
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* VIEW MODE 2: CONTINUOUS PROXIMITY GRID */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 gap-2.5 p-2.5">
                {filteredAndSortedGarments.map((garment) => (
                  <div
                    key={garment.id}
                    className="rounded-2xl bg-[#1c1b1d] border border-[#26262e] overflow-hidden flex flex-col group hover:border-[#caf300]/50 transition-all"
                  >
                    {/* Thumbnail with Proximity Distance Pill */}
                    <div
                      onClick={() => onOpenItemDetail?.(garment)}
                      className="relative aspect-square bg-[#0e0e10] bg-cover bg-center cursor-pointer"
                      style={{ backgroundImage: `url('${garment.imageUrl}')` }}
                    >
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#131315]/90 backdrop-blur-md border border-[#caf300]/40 text-[#caf300] font-mono text-[9.5px] font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[11px]">near_me</span>
                        <span>{garment.distance}</span>
                      </div>
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#131315]/80 backdrop-blur-md text-white font-mono text-[10px] font-bold">
                        {garment.estValue} EGP
                      </div>
                    </div>

                    <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                      <div>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[#c5c9ac] block">
                          {garment.brand} • Size {garment.size}
                        </span>
                        <h4
                          onClick={() => onOpenItemDetail?.(garment)}
                          className="font-display text-xs font-bold text-white truncate cursor-pointer hover:text-[#caf300]"
                        >
                          {garment.title}
                        </h4>
                        <p className="font-mono text-[10px] text-[#8f9378] truncate mt-0.5">
                          by {garment.owner.handle}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenTradeRequest(garment)}
                        className="w-full py-2 rounded-lg bg-[#caf300] text-[#171e00] font-mono text-[11px] font-bold uppercase tracking-wide flex items-center justify-center gap-1 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                        <span>Request Swap</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
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
