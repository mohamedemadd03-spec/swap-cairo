import React from 'react';
import { soundFX } from '../hooks/useSoundFX';
import { useLanguage } from '../i18n/LanguageContext';

export type TabType = 'discover' | 'closet' | 'matches' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  matchesBadgeCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  matchesBadgeCount = 1,
}) => {
  const { t } = useLanguage();

  const handleTabClick = (tab: TabType) => {
    soundFX.playClick();
    onTabChange(tab);
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#131315]/90 backdrop-blur-xl border-t border-[#2a2a2c]/60 shadow-[0_-1px_8px_rgba(0,0,0,0.15)]"
      aria-label="Main Navigation"
    >
      <div className="h-16 max-w-md mx-auto flex items-center justify-around px-space-xs">
        {/* Discover Tab */}
        <button
          onClick={() => handleTabClick('discover')}
          aria-current={activeTab === 'discover' ? 'page' : undefined}
          className={`flex-1 flex flex-col items-center justify-center min-w-[64px] min-h-[44px] gap-0.5 group transition-colors cursor-pointer ${
            activeTab === 'discover' ? 'text-[#caf300] font-semibold' : 'text-[#c6c6c7] hover:text-[#e5e1e4]'
          }`}
          type="button"
        >
          <div className="relative flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: activeTab === 'discover' ? "'FILL' 1" : "'FILL' 0" }}
            >
              explore
            </span>
          </div>
          <span className="font-mono text-[11px] tracking-wide mt-0.5">
            {t('navDiscover')}
          </span>
        </button>

        {/* Vault Tab */}
        <button
          onClick={() => handleTabClick('closet')}
          aria-current={activeTab === 'closet' ? 'page' : undefined}
          className={`flex-1 flex flex-col items-center justify-center min-w-[64px] min-h-[44px] gap-0.5 group transition-colors cursor-pointer ${
            activeTab === 'closet' ? 'text-[#caf300] font-semibold' : 'text-[#c6c6c7] hover:text-[#e5e1e4]'
          }`}
          type="button"
        >
          <div className="relative flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: activeTab === 'closet' ? "'FILL' 1" : "'FILL' 0" }}
            >
              checkroom
            </span>
          </div>
          <span className="font-mono text-[11px] tracking-wide mt-0.5">
            {t('navCloset')}
          </span>
        </button>

        {/* Deals Tab */}
        <button
          onClick={() => handleTabClick('matches')}
          aria-current={activeTab === 'matches' ? 'page' : undefined}
          className={`flex-1 flex flex-col items-center justify-center min-w-[64px] min-h-[44px] gap-0.5 group transition-colors cursor-pointer relative ${
            activeTab === 'matches' ? 'text-[#caf300] font-semibold' : 'text-[#c6c6c7] hover:text-[#e5e1e4]'
          }`}
          type="button"
        >
          <div className="relative flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: activeTab === 'matches' ? "'FILL' 1" : "'FILL' 0" }}
            >
              swap_horiz
            </span>
            {matchesBadgeCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 rounded-full bg-[#caf300] text-[#171e00] font-mono text-[9px] font-bold">
                {matchesBadgeCount}
              </span>
            )}
          </div>
          <span className="font-mono text-[11px] tracking-wide mt-0.5">
            {t('navDeals')}
          </span>
        </button>

        {/* Profile Tab */}
        <button
          onClick={() => handleTabClick('profile')}
          aria-current={activeTab === 'profile' ? 'page' : undefined}
          className={`flex-1 flex flex-col items-center justify-center min-w-[64px] min-h-[44px] gap-0.5 group transition-colors cursor-pointer ${
            activeTab === 'profile' ? 'text-[#caf300] font-semibold' : 'text-[#c6c6c7] hover:text-[#e5e1e4]'
          }`}
          type="button"
        >
          <div className="relative flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: activeTab === 'profile' ? "'FILL' 1" : "'FILL' 0" }}
            >
              person
            </span>
          </div>
          <span className="font-mono text-[11px] tracking-wide mt-0.5">
            {t('navPassport')}
          </span>
        </button>
      </div>
    </nav>
  );
};
