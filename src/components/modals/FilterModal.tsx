import React, { useState, useEffect } from 'react';
import { FilterSettings } from '../../types/swap';
import { soundFX, triggerHaptic } from '../../hooks/useSoundFX';
import { useLanguage } from '../../i18n/LanguageContext';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: FilterSettings;
  onApplyFilters: (filters: FilterSettings) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  currentFilters,
  onApplyFilters,
}) => {
  const { t, isRtl } = useLanguage();
  const [searchQuery, setSearchQuery] = useState(currentFilters.searchQuery || '');
  const [category, setCategory] = useState(currentFilters.category);
  const [maxDistanceKm, setMaxDistanceKm] = useState(currentFilters.maxDistanceKm);
  const [minCondition, setMinCondition] = useState(currentFilters.minCondition);
  const [onlyPro, setOnlyPro] = useState(currentFilters.onlyPro);

  const categories = [
    { id: 'all', label: t('allCategories') },
    { id: 'tees', label: t('catTops') },
    { id: 'hoodie', label: 'Hoodies' },
    { id: 'jacket', label: t('catJackets') },
    { id: 'denim', label: t('catDenim') },
    { id: 'shoes', label: t('catShoes') },
  ];

  useEffect(() => {
    if (isOpen) {
      setSearchQuery(currentFilters.searchQuery || '');
      setCategory(currentFilters.category);
      setMaxDistanceKm(currentFilters.maxDistanceKm);
      setMinCondition(currentFilters.minCondition);
      setOnlyPro(currentFilters.onlyPro);
    }
  }, [isOpen, currentFilters]);

  if (!isOpen) return null;

  const handleApply = () => {
    soundFX.playClick();
    triggerHaptic('medium');
    onApplyFilters({
      ...currentFilters,
      searchQuery: searchQuery.trim(),
      category,
      maxDistanceKm,
      minCondition,
      onlyPro,
    });
    onClose();
  };

  const handleReset = () => {
    soundFX.playClick();
    triggerHaptic('light');
    setSearchQuery('');
    setCategory('all');
    setMaxDistanceKm(15);
    setMinCondition(8.5);
    setOnlyPro(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#1c1b1f] border-t sm:border border-[#26262e] rounded-t-3xl sm:rounded-2xl p-5 flex flex-col gap-4 font-sans shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#caf300]">manage_search</span>
            <div>
              <h2 className="font-display font-bold text-base text-white uppercase tracking-tight">
                {t('searchCategoryFilters')}
              </h2>
              <p className="font-mono text-[10.5px] text-[#c5c9ac]">
                {t('filterSub')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#131315] text-[#c6c6c7] hover:text-white flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* 1. Keyword Search Input */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10.5px] uppercase font-bold text-[#c5c9ac]">
            {t('keywordSearch')}
          </label>
          <div className="relative flex items-center">
            <span className={`material-symbols-outlined absolute ${isRtl ? 'right-3' : 'left-3'} text-[#c5c9ac] text-[18px]`}>
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className={`w-full bg-[#131315] border border-white/10 rounded-xl ${isRtl ? 'pr-9 pl-8' : 'pl-9 pr-8'} py-2.5 text-xs text-white placeholder-[#8f9378] focus:outline-none focus:border-[#caf300]`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSearchQuery('');
                }}
                className={`absolute ${isRtl ? 'left-2.5' : 'right-2.5'} text-[#c5c9ac] hover:text-white`}
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Category Chips */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10.5px] uppercase font-bold text-[#c5c9ac]">
            {t('garmentCategory')}
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {categories.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    triggerHaptic('light');
                    setCategory(cat.id);
                  }}
                  className={`py-2 px-2.5 rounded-xl font-mono text-[10.5px] uppercase font-bold transition-all cursor-pointer truncate border ${
                    isSelected
                      ? 'bg-[#caf300] text-[#171e00] border-[#caf300] shadow-sm'
                      : 'bg-[#131315] text-[#c5c9ac] hover:text-white border-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Proximity Radius */}
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#131315] border border-white/5">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-[#c5c9ac] uppercase font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[#caf300] text-[15px]">near_me</span>
              {t('maxProximityRadius')}
            </span>
            <span className="text-[#caf300] font-bold text-sm">&lt; {maxDistanceKm} KM</span>
          </div>

          <div className="flex items-center gap-1.5">
            {[2, 5, 10, 15, 30].map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  triggerHaptic('light');
                  setMaxDistanceKm(km);
                }}
                className={`flex-1 py-1.5 rounded-lg font-mono text-[10px] uppercase font-bold transition-all cursor-pointer ${
                  maxDistanceKm === km
                    ? 'bg-[#caf300] text-[#171e00]'
                    : 'bg-[#201f21] text-[#c5c9ac] hover:text-white border border-white/5'
                }`}
              >
                &lt;{km}km
              </button>
            ))}
          </div>
        </div>

        {/* 4. Minimum Condition & Verified Swapper Filter */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-[#131315] border border-white/5">
            <span className="font-mono text-[10px] uppercase font-bold text-[#c5c9ac]">
              {t('minConditionLabel')}
            </span>
            <div className="flex items-center gap-1 mt-1">
              {[8.5, 9.0, 9.5].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    triggerHaptic('light');
                    setMinCondition(g);
                  }}
                  className={`flex-1 py-1 rounded font-mono text-[10px] font-bold cursor-pointer ${
                    minCondition === g
                      ? 'bg-[#caf300] text-[#171e00]'
                      : 'bg-[#201f21] text-[#8f9378]'
                  }`}
                >
                  {g}+
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between p-2.5 rounded-xl bg-[#131315] border border-white/5">
            <span className="font-mono text-[10px] uppercase font-bold text-[#c5c9ac]">
              {t('topSwappersOnly')}
            </span>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                triggerHaptic('light');
                setOnlyPro(!onlyPro);
              }}
              className={`py-1 px-2 rounded font-mono text-[10px] font-bold uppercase transition-colors cursor-pointer text-center ${
                onlyPro
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#201f21] text-[#8f9378]'
              }`}
            >
              {onlyPro ? t('topRatedOnly') : t('allSwappers')}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleReset}
            className="py-3 px-3.5 rounded-xl bg-[#131315] text-[#c6c6c7] hover:text-white font-mono text-xs uppercase cursor-pointer"
          >
            {t('resetFilters')}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3 rounded-xl bg-[#caf300] text-[#171e00] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-[#caf300]/20"
          >
            <span className="material-symbols-outlined text-[17px]">check</span>
            <span>{t('applySearchFilters')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
