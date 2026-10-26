import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { HubLocation } from '../types/swap';
import { soundFX } from '../hooks/useSoundFX';
import { useLanguage } from '../i18n/LanguageContext';

interface HeaderProps {
  currentHub: HubLocation;
  allHubs: HubLocation[];
  onSelectHub: (hub: HubLocation) => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenLeaderboard?: () => void;
  onOpenScanner?: () => void;
  unreadCount?: number;
  currentUser: User | null;
  onSignOut: () => void;
  onPlayBrandIntro?: () => void;
  onOpenLiveRadar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenProfile,
  unreadCount = 2,
  currentUser,
  onSignOut,
  onPlayBrandIntro,
  onOpenLiveRadar,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoClicks, setLogoClicks] = useState<number[]>([]);
  const { language, toggleLanguage, t } = useLanguage();

  const handleLogoClick = () => {
    onPlayBrandIntro?.();
    const now = Date.now();
    const recent = [...logoClicks.filter((t) => now - t < 1500), now];
    setLogoClicks(recent);

    if (recent.length >= 3) {
      setLogoClicks([]);
      soundFX.playMatch();
      onOpenLiveRadar?.();
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 pt-safe bg-[#131315]/90 backdrop-blur-xl border-b border-[#2a2a2c]/40 shadow-[0_1px_8px_rgba(0,0,0,0.1)]">
      <div className="h-16 px-4 max-w-md mx-auto flex items-center justify-between">
        {/* Brand Logo: strictly lowercase 'swap.' with electric volt dot */}
        <div className="flex items-center gap-2 cursor-pointer select-none" onClick={handleLogoClick}>
          <div className="flex items-baseline">
            <span className="font-display text-[26px] font-bold tracking-tight text-white lowercase">
              swap
            </span>
            <span className="font-display text-[26px] font-bold text-[#caf300] leading-none">.</span>
          </div>
          <span className="font-mono text-[9.5px] uppercase tracking-wider text-[#8f9378] px-2 py-0.5 rounded-full bg-white/5 hidden sm:inline-block">
            {t('fastBarter')}
          </span>
        </div>

        {/* Clean, Focused Action Controls: Notifications & Profile */}
        <div className="flex items-center gap-2">
          {/* Notifications Bell */}
          <button
            onClick={() => {
              soundFX.playClick();
              onOpenNotifications();
            }}
            aria-label="Notifications"
            className="relative w-9 h-9 rounded-full bg-[#1c1b1f] border border-white/5 flex items-center justify-center text-[#c6c6c7] hover:text-white transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[19px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#caf300] shadow-[0_0_6px_#caf300]" />
            )}
          </button>

          {/* User Profile Avatar (Clean, no Login button in top bar) */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-9 h-9 rounded-full p-[1.5px] bg-[#caf300] cursor-pointer"
              type="button"
              aria-label="Profile Menu"
            >
              <img
                src={
                  currentUser?.photoURL ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuDiBFlwRfyYNXXzMMHog4cnQQF4aB7aMTx6jmYgc1oqDyInrgqUHMU_dEBicHujxi6YICVBf-I-dChd_1HAp5YJG5jmU24PI08rtPjdiQOxaFyGGJLHPgqfAMdWprP8Z8Ar7uBKcTHyORErqdcBr_XjOMJ_CLTid-_SeoHMjHqi_pkw1dXC3dZWEKid0tRCavzL4tn8mVFj3sIxSjv6TIMzCDbGoHRiZkTwG8vDF1ZxorcBHjzHnUVq'
                }
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#14161d] border border-[#232733] rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in text-xs font-display">
                <div className="px-3 py-2 border-b border-white/[0.06] text-neutral-300">
                  <div className="font-bold text-white truncate">
                    {currentUser?.displayName || '@youssef_fits'}
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate">
                    {currentUser?.email || 'Verified Swapper'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    onOpenProfile();
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-neutral-300 hover:bg-[#1e2029] hover:text-white transition-colors cursor-pointer mt-1"
                >
                  {language === 'ar' ? 'عرض الكارنيه والبروفايل' : 'View Profile & Vault'}
                </button>
                <button
                  onClick={() => {
                    onSignOut();
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'تبديل الحساب / خروج' : 'Switch Account / Sign Out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
