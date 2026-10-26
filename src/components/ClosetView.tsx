import React, { useState } from 'react';
import { WardrobeItem, WishlistItem } from '../types/swap';
import { soundFX, triggerHaptic } from '../hooks/useSoundFX';
import { useLanguage } from '../i18n/LanguageContext';

interface ClosetViewProps {
  wardrobe: WardrobeItem[];
  wishlist?: WishlistItem[];
  onOpenAddItem: () => void;
  onSelectItem?: (item: WardrobeItem) => void;
  onNavigateToDeals?: () => void;
  onRemoveItem?: (itemId: string) => void;
  onUpdateItemValue?: (itemId: string, delta: number) => void;
  onClearDemoCloset?: () => void;
}

export const ClosetView: React.FC<ClosetViewProps> = ({
  wardrobe,
  onOpenAddItem,
  onSelectItem,
  onRemoveItem,
  onUpdateItemValue,
  onClearDemoCloset,
}) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const hasDemoSeedItems = wardrobe.some((w) => ['w1', 'w2', 'w3', 'w4'].includes(w.id));

  const categories = [
    { id: 'all', label: `${t('allCategories')} (${wardrobe.length})` },
    { id: 'outerwear', label: t('catJackets') },
    { id: 'tops', label: t('catTops') },
    { id: 'footwear', label: t('catShoes') },
  ];

  const filteredItems = wardrobe.filter((item) => {
    if (selectedCategory === 'all') return true;
    const cat = (item.category || item.categoryTag || '').toLowerCase();
    if (selectedCategory === 'outerwear')
      return cat.includes('jacket') || cat.includes('outerwear') || cat.includes('shell') || cat.includes('parka');
    if (selectedCategory === 'tops')
      return cat.includes('top') || cat.includes('tee') || cat.includes('hoodie') || cat.includes('knit');
    if (selectedCategory === 'footwear')
      return cat.includes('shoe') || cat.includes('kicks') || cat.includes('sneaker');
    return true;
  });

  const totalClosetValue = wardrobe.reduce((sum, item) => sum + (item.value || 0), 0);

  return (
    <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-[#131315] max-w-md mx-auto">
      <div className="flex flex-col w-full px-3.5 pb-6">
        {/* Closet Header HUD */}
        <section className="pt-2.5 pb-2 flex items-center justify-between gap-2 border-b border-white/[0.06]">
          <div className="min-w-0">
            <h1 className="font-display font-bold text-base text-white uppercase tracking-tight flex items-center gap-1.5">
              <span>{t('myCloset')}</span>
              <span className="w-2 h-2 rounded-full bg-[#caf300]" />
            </h1>
            <p className="font-mono text-[10px] text-[#c5c9ac] mt-0.5 truncate">
              {wardrobe.length} {t('closetPieces')} • <strong className="text-[#caf300]">{totalClosetValue} EGP</strong>
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {hasDemoSeedItems && onClearDemoCloset && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  soundFX.playClick();
                  onClearDemoCloset();
                }}
                title="Remove demo seed clothes and start with your own closet"
                className="px-2.5 py-2 rounded-xl font-mono text-[9.5px] uppercase font-bold bg-[#201f21] hover:bg-red-500/15 text-[#c5c9ac] hover:text-red-300 border border-white/10 transition-colors cursor-pointer"
              >
                {t('clearDemo')}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                soundFX.playClick();
                onOpenAddItem();
              }}
              className="px-3 py-2 rounded-xl bg-[#caf300] text-[#171e00] font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md shadow-[#caf300]/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <span>{t('addItem')}</span>
            </button>
          </div>
        </section>

        {/* 100% Visible 4-Column Category Grid */}
        <section className="py-2.5 grid grid-cols-4 gap-1.5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  soundFX.playClick();
                  setSelectedCategory(cat.id);
                }}
                className={`py-1.5 px-1 rounded-xl font-mono text-[10px] uppercase font-bold text-center transition-all cursor-pointer truncate ${
                  isSelected
                    ? 'bg-[#caf300] text-[#171e00] shadow-sm'
                    : 'bg-[#201f21] text-[#c5c9ac] hover:text-white border border-white/5'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </section>

        {/* Clean 2-Column Wardrobe Grid */}
        <section className="pt-1 grid grid-cols-2 gap-2.5">
          {/* Quick Upload Tile */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              soundFX.playClick();
              onOpenAddItem();
            }}
            className="aspect-[4/5] rounded-2xl border-2 border-dashed border-[#caf300]/50 hover:border-[#caf300] bg-[#18181a]/50 flex flex-col items-center justify-center gap-2 p-3 text-center cursor-pointer group transition-all hover:bg-[#18181a]"
          >
            <div className="w-10 h-10 rounded-full bg-[#caf300]/20 text-[#caf300] flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-white block uppercase">
                {t('addNewPiece')}
              </span>
              <span className="font-mono text-[9.5px] text-[#8f9378] block mt-0.5">
                {t('snapTwoPhotos')}
              </span>
            </div>
          </button>

          {/* User Wardrobe Items */}
          {filteredItems.map((item) => (
            <article
              key={item.id}
              onClick={() => onSelectItem?.(item)}
              className="rounded-2xl bg-[#201f21] border border-[#26262e] hover:border-[#caf300]/50 overflow-hidden flex flex-col group transition-all cursor-pointer shadow-sm"
            >
              <div className="relative aspect-square bg-[#0e0e10] overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#131315]/90 text-[9.5px] font-mono font-bold text-white backdrop-blur-md">
                  Size {item.size}
                </span>

                {item.status !== 'pending' && onRemoveItem && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFX.playClick();
                      onRemoveItem(item.id);
                    }}
                    title="Remove piece from My Closet"
                    className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-[#131315]/90 hover:bg-red-500/80 text-[#c5c9ac] hover:text-white flex items-center justify-center border border-white/10 backdrop-blur-md cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                )}

                <div className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-md bg-[#131315]/90 px-1.5 py-0.5 backdrop-blur-md border border-white/10">
                  {item.status !== 'pending' && onUpdateItemValue && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFX.playClick();
                        onUpdateItemValue(item.id, -50);
                      }}
                      title="Decrease estimated value by 50 EGP"
                      className="px-1 text-[10px] font-mono font-bold text-[#c5c9ac] hover:text-white cursor-pointer"
                    >
                      −
                    </button>
                  )}
                  <span className="text-[10px] font-mono font-bold text-[#caf300] px-0.5">
                    {item.value} EGP
                  </span>
                  {item.status !== 'pending' && onUpdateItemValue && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFX.playClick();
                        onUpdateItemValue(item.id, 50);
                      }}
                      title="Increase estimated value by 50 EGP"
                      className="px-1 text-[10px] font-mono font-bold text-[#c5c9ac] hover:text-white cursor-pointer"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>

              <div className="p-2.5 flex flex-col flex-1 justify-between gap-1.5">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#8f9378] block">
                    {item.category || item.categoryTag?.split('•')[0] || 'Apparel'}
                  </span>
                  <h3 className="font-sans text-xs font-bold text-white truncate mt-0.5 group-hover:text-[#caf300] transition-colors">
                    {item.title}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5 font-mono text-[9.5px]">
                  {item.status === 'pending' ? (
                    <span className="text-amber-400 flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      {item.badgeLabel || t('lockedInSwap')}
                    </span>
                  ) : (
                    <span className="text-[#caf300] flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#caf300]" />
                      {item.badgeLabel || t('available')}
                    </span>
                  )}
                  <span className="text-[#8f9378] hover:text-white underline">
                    {t('inspect')}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
};
