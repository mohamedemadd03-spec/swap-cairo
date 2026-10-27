import React, { useState } from 'react';
import { WardrobeItem, Garment } from '../../types/swap';
import { soundFX, triggerHaptic } from '../../hooks/useSoundFX';
import { useLanguage } from '../../i18n/LanguageContext';

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WardrobeItem | Garment | any | null;
  onInitiateSwap?: (item: Garment) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  onInitiateSwap,
}) => {
  const { t } = useLanguage();
  const [activeThumb, setActiveThumb] = useState(0);

  if (!isOpen || !item) return null;

  const isGarment = 'owner' in item;
  const itemBrand = item.brand || (item.title ? item.title.split(' ')[0] : 'Vintage');
  const itemValue = 'estValue' in item ? item.estValue : item.value || 450;
  const itemCategory = item.category || (item.categoryTag ? item.categoryTag.split('•')[0].trim() : 'Apparel');

  // Collect actual photos without redundant fluff
  const photos: string[] = [];
  const primary = item.imageUrl || item.angles?.front;
  if (primary) photos.push(primary);
  if (item.angles?.back && item.angles.back !== primary) photos.push(item.angles.back);
  else if (item.photo2 && item.photo2 !== primary) photos.push(item.photo2);
  if (item.angles?.tag && !photos.includes(item.angles.tag)) photos.push(item.angles.tag);
  else if (item.photo3 && !photos.includes(item.photo3)) photos.push(item.photo3);
  if (item.photo4 && !photos.includes(item.photo4)) photos.push(item.photo4);

  if (photos.length === 0) {
    photos.push(primary || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop');
  }

  const currentIdx = activeThumb < photos.length ? activeThumb : 0;
  const currentImg = photos[currentIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0c0b0e]/90 backdrop-blur-md p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-[#151418] border-t sm:border border-[#26262e] rounded-t-3xl sm:rounded-2xl p-4 flex flex-col gap-3 font-sans shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="min-w-0 pr-2">
            <span className="font-mono text-[10px] uppercase font-bold text-[#caf300] block tracking-wider">
              {itemBrand} • {itemCategory}
            </span>
            <h2 className="font-display font-bold text-base text-white truncate">
              {item.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#201f23] hover:bg-[#2b2a30] text-[#c6c6c7] hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Clean Photo Viewport */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#0a0a0c] border border-white/10">
          <img
            src={currentImg}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          {photos.length > 1 && (
            <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-sm font-mono text-[10px] text-white">
              {currentIdx + 1} / {photos.length}
            </div>
          )}
        </div>

        {/* Multi-angle Strip (Only if 2+ photos) */}
        {photos.length > 1 && (
          <div className="flex gap-2 justify-center">
            {photos.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  triggerHaptic('light');
                  setActiveThumb(i);
                }}
                className={`w-12 h-12 rounded-xl overflow-hidden border p-0.5 cursor-pointer transition-all ${
                  currentIdx === i
                    ? 'border-[#caf300] ring-1 ring-[#caf300]'
                    : 'border-white/10 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={p} alt={`Angle ${i + 1}`} className="w-full h-full object-cover rounded-lg" />
              </button>
            ))}
          </div>
        )}

        {/* Essential Specs Grid */}
        <div className="grid grid-cols-3 gap-2 font-mono text-center">
          <div className="bg-[#1c1b20] p-2 rounded-xl border border-white/5">
            <span className="text-[#8f9378] text-[9.5px] uppercase block">{t('size')}</span>
            <span className="text-white font-bold text-xs">{item.size || 'L'}</span>
          </div>
          <div className="bg-[#1c1b20] p-2 rounded-xl border border-white/5">
            <span className="text-[#8f9378] text-[9.5px] uppercase block">{t('condition')}</span>
            <span className="text-[#caf300] font-bold text-xs">{item.condition || '9.5/10'}</span>
          </div>
          <div className="bg-[#1c1b20] p-2 rounded-xl border border-white/5">
            <span className="text-[#8f9378] text-[9.5px] uppercase block">{t('totalClosetValue')}</span>
            <span className="text-white font-bold text-xs">{itemValue} EGP</span>
          </div>
        </div>

        {/* Location & Owner Pill */}
        <div className="px-3 py-2 rounded-xl bg-[#1c1b20] border border-white/5 flex items-center justify-between text-[11px] font-mono text-[#c5c9ac]">
          <div className="flex items-center gap-1.5 truncate">
            <span className="material-symbols-outlined text-[#caf300] text-[15px]">location_on</span>
            <span className="truncate">{isGarment ? item.city || item.owner?.location || 'Degla Hub' : 'Your Closet'}</span>
          </div>
          {isGarment && item.owner?.handle && (
            <span className="text-[#8f9378] shrink-0 font-bold">@{item.owner.handle}</span>
          )}
        </div>

        {/* Concise Description (only if exists and meaningful) */}
        {item.description && item.description.trim().length > 0 && (
          <p className="font-sans text-xs text-[#d0ced4] leading-relaxed px-1">
            {item.description}
          </p>
        )}

        {/* Action Button */}
        <div className="pt-1">
          {isGarment && onInitiateSwap ? (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('trade');
                onClose();
                onInitiateSwap(item as Garment);
              }}
              className="w-full py-3.5 rounded-xl bg-[#caf300] text-[#0c0b0e] font-mono font-bold text-xs uppercase hover:brightness-110 active:scale-98 cursor-pointer shadow-lg shadow-[#caf300]/20 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
              <span>{t('proposeSwapPiece')}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-[#201f23] text-white font-mono text-xs uppercase hover:bg-[#2b2a30] cursor-pointer"
            >
              {t('close')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
