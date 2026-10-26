import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Garment, HubLocation, SwapOffer } from '../types/swap';
import { soundFX, triggerHaptic } from '../hooks/useSoundFX';
import { hapticEngine } from '../services/haptics';
import { useLanguage } from '../i18n/LanguageContext';
import { PWAInstallButton } from './PWAInstallButton';

interface ProfileViewProps {
  currentHub: HubLocation;
  allHubs: HubLocation[];
  onSelectHub: (hub: HubLocation) => void;
  stashedGarments: Garment[];
  onSelectGarment: (garment: Garment) => void;
  userTrustPoints?: number;
  currentUser?: any | null;
  completedSwapsCount?: number;
  completedOffers?: SwapOffer[];
  onClearDemoCloset?: () => void;
  onResetDemoData?: () => void;
  onSignOut?: () => void;
  onOpenModerationDesk?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentHub,
  allHubs,
  onSelectHub,
  stashedGarments,
  onSelectGarment,
  userTrustPoints = 450,
  currentUser,
  completedSwapsCount = 24,
  completedOffers = [],
  onClearDemoCloset,
  onResetDemoData,
  onSignOut,
  onOpenModerationDesk,
}) => {
  const [hapticsEnabled, setHapticsEnabled] = useState(() => hapticEngine.getEnabled());
  const [activeSection, setActiveSection] = useState<'hubs' | 'receipts' | 'watchlist' | 'charter'>('hubs');
  const { language, setLanguage, toggleLanguage, t } = useLanguage();

  const level = Math.floor(userTrustPoints / 100);
  const nextLevelProgress = userTrustPoints % 100;

  return (
    <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-[#131315] max-w-md mx-auto">
      <div className="flex flex-col w-full px-4 pb-6 gap-3.5">
        {/* Profile Header */}
        <section className="flex items-center justify-between pt-2">
          <h1 className="font-display font-bold text-xl uppercase tracking-tight text-white">
            {t('swapperPassport')}
          </h1>
          <span className="px-2.5 py-0.5 bg-[#caf300]/15 text-[#caf300] font-mono font-bold text-[10.5px] uppercase rounded-full border border-[#caf300]/30">
            {t('level')} {level} • {userTrustPoints} {t('pts')}
          </span>
        </section>

        {/* User Card + Gamified Level Progress */}
        <div className="p-3.5 rounded-xl bg-[#201f21] border border-[#26262e] flex flex-col gap-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={
                  currentUser?.photoURL ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuDiBFlwRfyYNXXzMMHog4cnQQF4aB7aMTx6jmYgc1oqDyInrgqUHMU_dEBicHujxi6YICVBf-I-dChd_1HAp5YJG5jmU24PI08rtPjdiQOxaFyGGJLHPgqfAMdWprP8Z8Ar7uBKcTHyORErqdcBr_XjOMJ_CLTid-_SeoHMjHqi_pkw1dXC3dZWEKid0tRCavzL4tn8mVFj3sIxSjv6TIMzCDbGoHRiZkTwG8vDF1ZxorcBHjzHnUVq'
                }
                alt="Profile avatar"
                className="w-14 h-14 rounded-full object-cover ring-2 ring-[#caf300]"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#caf300] border-2 border-[#131315]"></span>
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-base text-white truncate">
                  {currentUser?.displayName || '@cairo_swapper'}
                </span>
                <span className="px-1.5 py-0.2 bg-[#caf300] text-[#171e00] font-mono text-[9px] font-bold rounded">
                  {currentUser?.isGuest ? 'GUEST' : t('verified')}
                </span>
              </div>
              <span className="font-mono text-xs text-[#c5c9ac] truncate">
                {currentUser?.email || t('barterTagline')}
              </span>
              <span className="font-mono text-[11px] text-[#caf300] mt-0.5">
                {t('defaultSpot')} {currentHub.name}
              </span>
            </div>
          </div>

          {/* Gamified Trust & Forgiveness Progress Bar */}
          <div className="p-2.5 rounded-lg bg-[#131315] border border-white/5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="text-[#caf300] font-bold uppercase">
                {t('rankProgress')} {level} → {level + 1}
              </span>
              <span className="text-[#c5c9ac]">{100 - nextLevelProgress} {t('toNextRank')}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#201f21] overflow-hidden">
              <div
                className="h-full bg-[#caf300] transition-all duration-500"
                style={{ width: `${Math.max(12, nextLevelProgress)}%` }}
              />
            </div>
            <span className="font-mono text-[9.5px] text-[#8f9378]">
              {t('zeroPenalty')}
            </span>
          </div>

          {/* Environmental & Financial Impact Bento */}
          <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-center font-mono">
            <div className="p-2 bg-[#1c1b1d] rounded-lg border border-white/5">
              <span className="text-[10px] text-[#c5c9ac] uppercase block">{t('swapsCount')}</span>
              <span className="text-base font-bold text-white">{completedSwapsCount}</span>
              <span className="text-[9px] text-[#caf300] block">★ 4.9</span>
            </div>
            <div className="p-2 bg-[#1c1b1d] rounded-lg border border-white/5">
              <span className="text-[10px] text-[#c5c9ac] uppercase block">{t('trustScore')}</span>
              <span className="text-base font-bold text-[#caf300]">{userTrustPoints}</span>
              <span className="text-[9px] text-[#c5c9ac] block">{t('perQrScan')}</span>
            </div>
            <div className="p-2 bg-[#1c1b1d] rounded-lg border border-white/5">
              <span className="text-[10px] text-[#c5c9ac] uppercase block">Saved</span>
              <span className="text-base font-bold text-white">14.2k</span>
              <span className="text-[9px] text-[#c5c9ac] block">{t('savedVsRetail')}</span>
            </div>
          </div>
        </div>

        {/* 4-Tab Mobile Feature Switcher */}
        <div className="grid grid-cols-4 p-1 rounded-2xl bg-[#201f21] border border-white/10 font-mono text-[9.5px]">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              soundFX.playClick();
              setActiveSection('hubs');
            }}
            className={`py-2 px-1 rounded-xl font-bold uppercase cursor-pointer transition-all flex items-center justify-center gap-1 ${
              activeSection === 'hubs'
                ? 'bg-[#caf300] text-[#171e00] shadow-sm'
                : 'text-[#c5c9ac] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[12px]">radar</span>
            <span>{t('hubsTab')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              soundFX.playClick();
              setActiveSection('receipts');
            }}
            className={`py-2 px-1 rounded-xl font-bold uppercase cursor-pointer transition-all flex items-center justify-center gap-1 ${
              activeSection === 'receipts'
                ? 'bg-[#caf300] text-[#171e00] shadow-sm'
                : 'text-[#c5c9ac] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[12px]">handshake</span>
            <span>{t('receiptsTab')} ({completedOffers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              soundFX.playClick();
              setActiveSection('watchlist');
            }}
            className={`py-2 px-1 rounded-xl font-bold uppercase cursor-pointer transition-all flex items-center justify-center gap-1 ${
              activeSection === 'watchlist'
                ? 'bg-[#caf300] text-[#171e00] shadow-sm'
                : 'text-[#c5c9ac] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[12px]">bookmark</span>
            <span>{t('savedTab')} ({stashedGarments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              soundFX.playClick();
              setActiveSection('charter');
            }}
            className={`py-2 px-1 rounded-xl font-bold uppercase cursor-pointer transition-all flex items-center justify-center gap-1 ${
              activeSection === 'charter'
                ? 'bg-[#caf300] text-[#171e00] shadow-sm'
                : 'text-[#c5c9ac] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[12px]">gavel</span>
            <span>{t('legalTab')}</span>
          </button>
        </div>

        {/* SECTION 2: COMPLETED HANDSHAKE RECEIPTS LOG */}
        {activeSection === 'receipts' && (
          <section className="flex flex-col gap-2 font-mono animate-in fade-in">
            {completedOffers.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#201f21] border border-[#26262e] text-center text-xs text-[#c5c9ac]">
                No Handshake receipts yet. Complete an in-person scan in Deals to log your swap pass here.
              </div>
            ) : (
              completedOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="p-3 rounded-xl bg-[#201f21] border border-[#caf300]/30 flex flex-col gap-2 shadow-sm"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#caf300] font-bold uppercase flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">handshake</span>
                      <span>
                        {offer.status === 'completed' ? 'Verified Handshake' : 'Locked Deal'} // #
                        {offer.securityPassCode || 'SWP-7740'}
                      </span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#caf300]/15 text-[#caf300] font-bold">
                      +50 PTS
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-[#131315] border border-white/5 text-[10px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={offer.yourItem.imageUrl}
                        alt={offer.yourItem.title}
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[8.5px] text-[#8f9378] uppercase block">
                          The One Who Gives
                        </span>
                        <span className="font-sans text-xs font-bold text-white truncate block">
                          {offer.yourItem.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 min-w-0 border-l border-white/10 pl-2">
                      <img
                        src={offer.theirItem.imageUrl}
                        alt={offer.theirItem.title}
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[8.5px] text-[#caf300] uppercase block font-bold">
                          The One Who Receives
                        </span>
                        <span className="font-sans text-xs font-bold text-white truncate block">
                          {offer.theirItem.title}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Verified Handshake Badge & Trust Stamp */}
                  <div className="p-2.5 rounded-xl bg-[#131315] border border-[#caf300]/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 font-mono">
                      <div className="w-8 h-8 rounded-lg bg-[#caf300]/10 border border-[#caf300]/30 flex items-center justify-center text-[#caf300] shrink-0">
                        <span className="material-symbols-outlined text-[16px]">handshake</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-[#caf300] uppercase font-bold flex items-center gap-1">
                          <span>✓ {t('cairoVerifiedStamp')}</span>
                        </span>
                        <p className="font-sans text-[11px] font-bold text-white truncate mt-0.5">
                          {offer.theirItem.title} ⇄ {offer.yourItem.title}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#caf300]/20 text-[#caf300] font-mono text-[9px] font-bold uppercase shrink-0">
                      +50 PTS
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[9.5px] text-[#c5c9ac]">
                    <span>Partner: @{offer.partner.handle}</span>
                    <span>{offer.hubLocation || currentHub.name}</span>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* SECTION 1: HUBS & SENSORY CONTROLS */}
        {activeSection === 'hubs' && (
          <div className="flex flex-col gap-3 animate-in fade-in">
            {/* Haptic Engine Vibrations Control Card */}
            <section className="p-3 rounded-xl bg-[#201f21] border border-[#caf300]/40 flex flex-col gap-2.5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[#caf300] text-[20px] shrink-0">vibration</span>
                  <div className="min-w-0">
                    <h2 className="font-mono text-xs font-bold uppercase text-white truncate">
                      {t('hapticsTitle')}
                    </h2>
                    <span className="font-mono text-[9.5px] text-[#c5c9ac] block truncate">
                      {t('hapticsSub')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = hapticEngine.toggle();
                    setHapticsEnabled(next);
                    triggerHaptic('medium');
                    soundFX.playClick();
                  }}
                  className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase cursor-pointer transition-colors shrink-0 ${
                    hapticsEnabled
                      ? 'bg-[#caf300] text-[#171e00]'
                      : 'bg-[#131315] text-[#8f9378] border border-white/10'
                  }`}
                >
                  {hapticsEnabled ? t('hapticsActive') : t('hapticsMuted')}
                </button>
              </div>

              {/* Instant Test Haptic Buzz Controls */}
              {hapticsEnabled && (
                <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
                  <span className="font-mono text-[9px] uppercase text-[#8f9378] shrink-0">
                    {language === 'ar' ? 'تجربة النبض:' : 'Test Buzz:'}
                  </span>
                  <div className="flex items-center gap-1 flex-1 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        soundFX.playClick();
                      }}
                      className="px-2 py-0.5 rounded-lg bg-[#18181a] hover:bg-[#28272b] text-[#c5c9ac] hover:text-[#caf300] font-mono text-[9.5px] uppercase border border-white/10 cursor-pointer active:scale-95"
                    >
                      {language === 'ar' ? 'خفيف' : 'Light'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('trade');
                        soundFX.playMatch();
                      }}
                      className="px-2.5 py-0.5 rounded-lg bg-[#caf300]/20 hover:bg-[#caf300]/30 text-[#caf300] font-mono text-[9.5px] font-bold uppercase border border-[#caf300]/40 cursor-pointer active:scale-95"
                    >
                      {language === 'ar' ? 'نبض سواب' : 'Swap Buzz'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('heavy');
                        soundFX.playCash();
                      }}
                      className="px-2 py-0.5 rounded-lg bg-[#18181a] hover:bg-[#28272b] text-[#c5c9ac] hover:text-white font-mono text-[9.5px] uppercase border border-white/10 cursor-pointer active:scale-95"
                    >
                      {language === 'ar' ? 'قوي' : 'Heavy'}
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Partner Cafés, Vintage Stores & Safe Meetup Spots */}
            <section className="p-3 rounded-xl bg-[#201f21] border border-[#26262e] flex flex-col gap-2 shadow-sm">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-white font-bold uppercase">Partner Meetup Spots</span>
                <span className="text-[#caf300] font-semibold">{currentHub.activeSwappers} Nearby</span>
              </div>

              <div className="flex flex-col gap-1.5">
                {allHubs.map((hub) => (
                  <button
                    key={hub.id}
                    onClick={() => {
                      soundFX.playClick();
                      onSelectHub(hub);
                    }}
                    className={`p-2.5 text-left font-mono text-xs rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      currentHub.id === hub.id
                        ? 'bg-[#2a2a2c] border-[#caf300] text-white shadow-sm'
                        : 'bg-[#1c1b1d] border-white/5 text-[#c6c6c7] hover:text-white'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold truncate">{hub.name}</span>
                      <span className="text-[10px] text-[#c5c9ac] truncate">{hub.address}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 bg-[#201f21] rounded text-[10px] text-[#caf300] font-bold">
                        {hub.distance}
                      </span>
                      <div className="text-[9px] text-[#c5c9ac] mt-0.5">{hub.hours}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* SECTION 2: SAVED WATCHLIST */}
        {activeSection === 'watchlist' && (
          <section className="flex flex-col gap-2 font-mono animate-in fade-in">
            {stashedGarments.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#201f21] border border-[#26262e] text-center text-xs text-[#c5c9ac]">
                No saved garments yet. Tap the bookmark icon in Discover to save pieces here.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {stashedGarments.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => onSelectGarment(g)}
                    className="p-2 bg-[#201f21] border border-[#26262e] rounded-xl flex flex-col gap-1.5 cursor-pointer hover:border-[#caf300] transition-colors"
                  >
                    <div
                      className="w-full h-28 bg-cover bg-center rounded-lg border border-white/5"
                      style={{ backgroundImage: `url('${g.imageUrl}')` }}
                    />
                    <div className="font-display font-bold text-xs uppercase text-white truncate">
                      {g.title}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#c5c9ac]">
                      <span>Size {g.size}</span>
                      <span className="text-[#caf300] font-bold">{g.estValue} EGP</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECTION 3: LEGAL POLICIES & BALANCED AI CHARTER (Always visible when selected) */}
        {activeSection === 'charter' && (
          <section className="p-3 rounded-xl bg-[#201f21] border border-[#26262e] flex flex-col gap-2 shadow-sm animate-in fade-in font-sans text-xs text-[#c5c9ac]">
            <div className="p-2.5 rounded-lg bg-[#131315] border border-white/5">
              <span className="font-mono text-[10px] text-[#caf300] font-bold uppercase block mb-0.5">
                1. Balanced &amp; Measured AI Moderation
              </span>
              <p className="text-[11px] leading-relaxed">
                Our AI assistant auto-fills garment specs and blocks only strictly prohibited content (NSFW imagery, non-clothing objects, or unwearably trashed rags). Authentic vintage fade, natural lighting, and normal wear are welcomed.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-[#131315] border border-white/5">
              <span className="font-mono text-[10px] text-[#caf300] font-bold uppercase block mb-0.5">
                2. In-Person Inspection &amp; Zero-Penalty Cancellation
              </span>
              <p className="text-[11px] leading-relaxed">
                All trades are non-binding until both swappers inspect the physical garments in person and scan the QR Handshake. Either party may cancel if a spot is too far or an item does not match its photos, and locked closet items immediately return to Available.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-[#131315] border border-white/5">
              <span className="font-mono text-[10px] text-[#caf300] font-bold uppercase block mb-0.5">
                3. Public Meetup Safety &amp; GPS Privacy
              </span>
              <p className="text-[11px] leading-relaxed">
                Meet only in public partner cafés, hubs, or well-lit stations. Live GPS Radar pins are shared strictly on-demand inside your active trade chat and are never broadcast publicly.
              </p>
            </div>
          </section>
        )}

        {/* Settings & Language Preference */}
        <section className="p-3.5 rounded-xl bg-[#201f21] border border-[#26262e] flex flex-col gap-2.5 shadow-sm">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-white font-bold uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#caf300]">settings</span>
              <span>{language === 'ar' ? 'الإعدادات واللغة' : 'SETTINGS & PREFERENCES'}</span>
            </span>
          </div>

          <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#131315] border border-white/5 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#caf300] text-[18px]">translate</span>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {language === 'ar' ? 'لغة التطبيق' : 'App Language'}
                  </span>
                  <span className="text-[9.5px] text-[#8f9378] block">
                    {language === 'ar'
                      ? 'العربية (لهجة الشارع والقاهرة)'
                      : 'English (International)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  soundFX.playClick();
                  setLanguage('ar');
                }}
                className={`py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                  language === 'ar'
                    ? 'bg-[#caf300] text-black shadow-sm font-black'
                    : 'bg-[#1c1b1f] hover:bg-[#28272b] text-[#c5c9ac] border border-white/5'
                }`}
              >
                <span className="text-sm">🇪🇬</span>
                <span>العربية (AR)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  soundFX.playClick();
                  setLanguage('en');
                }}
                className={`py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                  language === 'en'
                    ? 'bg-[#caf300] text-black shadow-sm font-black'
                    : 'bg-[#1c1b1f] hover:bg-[#28272b] text-[#c5c9ac] border border-white/5'
                }`}
              >
                <span className="text-sm">🇬🇧</span>
                <span>English (EN)</span>
              </button>
            </div>
          </div>

          {/* PWA Mobile Installation Trigger */}
          <PWAInstallButton />
        </section>

        {/* Moderation Desk (Admin / Owner Safety Controls) */}
        <section className="p-3.5 rounded-xl bg-[#201f21] border border-[#26262e] flex flex-col gap-2.5 shadow-sm">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-white font-bold uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#caf300]">shield</span>
              <span>{language === 'ar' ? 'إدارة البلاغات والأمان' : 'SAFETY & MODERATION'}</span>
            </span>
            <span className="px-2 py-0.2 bg-[#caf300]/15 text-[#caf300] font-mono text-[9.5px] font-bold rounded">
              ADMIN DESK
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#131315] border border-white/5 font-mono">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-bold text-white">
                {language === 'ar' ? 'سجل بلاغات القطع والمستخدمين' : 'Garment & User Reports Log'}
              </span>
              <span className="text-[9.5px] text-[#8f9378]">
                {language === 'ar'
                  ? 'مراجعة البلاغات، فحص الأسباب، واتخاذ قرار الحذف أو فك الحجب'
                  : 'Review complaints, verify authenticity, and approve/delete listings'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                soundFX.playClick();
                onOpenModerationDesk?.();
              }}
              className="py-2 px-3 rounded-xl bg-[#caf300] hover:bg-[#b5d800] text-[#171e00] font-bold text-xs uppercase cursor-pointer transition-transform active:scale-95 shrink-0 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">policy</span>
              <span>{language === 'ar' ? 'فتح اللوحة' : 'Open Desk'}</span>
            </button>
          </div>
        </section>

        {/* Closet & Account Session Controls */}
        <section className="p-3.5 rounded-xl bg-[#201f21] border border-[#26262e] flex flex-col gap-2.5 shadow-sm">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-white font-bold uppercase">// CLOSET &amp; ACCOUNT</span>
            <span className="text-[#8f9378] text-[10px]">
              {currentUser ? 'Signed In' : 'Local Session'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 font-mono text-[9.5px]">
            {onClearDemoCloset && (
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onClearDemoCloset();
                }}
                className="py-2 px-2 rounded-xl bg-[#131315] hover:bg-[#2a2a2c] text-[#caf300] border border-[#caf300]/30 font-bold uppercase cursor-pointer transition-colors"
              >
                {t('freshCloset')}
              </button>
            )}
            {onResetDemoData && (
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onResetDemoData();
                }}
                className="py-2 px-2 rounded-xl bg-[#131315] hover:bg-[#2a2a2c] text-[#c5c9ac] hover:text-white border border-white/10 font-bold uppercase cursor-pointer transition-colors"
              >
                {t('restoreDemo')}
              </button>
            )}
            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onSignOut();
                }}
                className="py-2 px-2 rounded-xl bg-[#131315] hover:bg-red-500/20 text-[#8f9378] hover:text-red-300 border border-white/10 font-bold uppercase cursor-pointer transition-colors"
              >
                {t('switchUser')}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};
