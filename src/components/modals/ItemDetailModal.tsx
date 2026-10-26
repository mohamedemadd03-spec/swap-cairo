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
  const { t, isRtl } = useLanguage();
  const [activeThumb, setActiveThumb] = useState(0);
  const [copiedShare, setCopiedShare] = useState(false);

  if (!isOpen || !item) return null;

  const isGarment = 'owner' in item;
  const itemBrand = item.brand || (item.title ? item.title.split(' ')[0] : 'Vintage');
  const itemValue = 'estValue' in item ? item.estValue : item.value || 450;
  const itemCategory = item.category || (item.categoryTag ? item.categoryTag.split('•')[0].trim() : 'Apparel');

  // Build the photo gallery strictly from the actual photos provided (no ghost slots)
  const photosList: { label: string; url: string; spec: string; note: string }[] = [];

  const primaryImg = item.imageUrl || item.angles?.front;
  if (primaryImg) {
    photosList.push({
      label: 'FRONT',
      url: primaryImg,
      spec: 'FULL SILHOUETTE // OPTICAL 4K',
      note: 'COLOR & FABRIC TENSION INSPECTED',
    });
  }

  // Second photo (Back / Collar / Tag / Photo 2)
  const secondImg = item.angles?.back || item.photo2;
  if (secondImg && secondImg !== primaryImg) {
    photosList.push({
      label: 'DETAIL / TAG',
      url: secondImg,
      spec: 'BACK PROFILE & ARCHIVE TAG',
      note: 'COLLAR & SEAM INTEGRITY VERIFIED',
    });
  }

  // Third photo (Optional Sleeve / Hardware / Photo 3)
  const thirdImg = item.angles?.tag || item.photo3;
  if (thirdImg && thirdImg !== primaryImg && thirdImg !== secondImg) {
    photosList.push({
      label: 'SLEEVE / HEM',
      url: thirdImg,
      spec: 'SLEEVE & STITCHING DETAIL',
      note: 'DOUBLE-STITCHED HEM INTEGRITY',
    });
  }

  // Fourth photo (Optional extra angle / Photo 4)
  const fourthImg = item.photo4;
  if (fourthImg && fourthImg !== primaryImg && fourthImg !== secondImg && fourthImg !== thirdImg) {
    photosList.push({
      label: 'EXTRA ANGLE',
      url: fourthImg,
      spec: 'MACRO WEAVE INSPECTION',
      note: 'VERIFIED ARCHIVE DETAIL',
    });
  }

  // If only 1 image exists, ensure at least 1 image is in the gallery
  const gallery = photosList.length > 0 ? photosList : [
    {
      label: 'PIECE',
      url: primaryImg || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQIPFLaXbG7hGXYmbB4fPjEyd7MtwoE2DMVtVWbG8gAke6M15nReQTWZXy8YPih8SsJVGIyk1da8n66OyBTkWKx3HDcf2_xvrU44NBfufN1dYuCFreBYK55FX-TfAYCmXm7YXXpPv0IZObr6EQF-leIWqTT8mouLIsZCdu6dpGYC937N-6vn7Nib6AwWPF5peRoXNaIfILl6P3CqvijG7oU5O65-rJglGUVyzJT-551sxRZHFEAp7c',
      spec: 'FULL SILHOUETTE',
      note: 'AUTHENTIC CIRCULAR GARMENT',
    },
  ];

  // Safeguard active thumb index within actual photo count
  const currentPhotoIndex = activeThumb < gallery.length ? activeThumb : 0;
  const currentPhoto = gallery[currentPhotoIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#131315]/95 backdrop-blur-md p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#201f21] border-t sm:border border-[#26262e] rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 font-sans shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-8 h-8 rounded-lg bg-[#2a2a2c] flex items-center justify-center text-[#c6c6c7] hover:text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div className="min-w-0">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#caf300] block">
                {itemBrand} // {t('archiveSpec')}
              </span>
              <h2 className="font-display font-bold text-sm sm:text-base text-white truncate max-w-[240px]">
                {item.title}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {item.isGirlsOnlyCircle ? (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ff69b4]/15 border border-[#ff69b4]/40">
                <span className="text-[11px]">🌸</span>
                <span className="font-mono text-[9px] text-[#ff69b4] uppercase font-bold">GIRLS CIRCLE</span>
              </div>
            ) : item.genderFit === 'womens' ? (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ff69b4]/15 border border-[#ff69b4]/40">
                <span className="text-[11px]">🌸</span>
                <span className="font-mono text-[9px] text-[#ff69b4] uppercase font-bold">HER FIT</span>
              </div>
            ) : item.genderFit === 'mens' ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#38bdf8]/15 border border-[#38bdf8]/40">
                <span className="material-symbols-outlined text-[12px] text-[#38bdf8]">bolt</span>
                <span className="font-mono text-[9px] text-[#38bdf8] uppercase font-bold">HIM FIT</span>
              </div>
            ) : null}
            <button
              type="button"
              onClick={async () => {
                soundFX.playClick();
                triggerHaptic('light');
                const shareText = t('sharePieceText', { title: item.title, size: item.size || 'L', value: String(itemValue) });
                if (navigator.share) {
                  await navigator
                    .share({ title: item.title, text: shareText, url: window.location.href })
                    .catch(() => {});
                } else if (navigator.clipboard) {
                  await navigator.clipboard.writeText(`${shareText} ${window.location.href}`).catch(() => {});
                  setCopiedShare(true);
                  setTimeout(() => setCopiedShare(false), 1800);
                }
              }}
              title="Share piece via WhatsApp / Native Share"
              className="w-8 h-8 rounded-lg bg-[#131315] hover:bg-[#2a2a2c] border border-white/10 flex items-center justify-center text-[#caf300] cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedShare ? 'check' : 'ios_share'}
              </span>
            </button>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#131315] border border-[#caf300]/40">
              <span className="material-symbols-outlined text-[13px] text-[#caf300]">verified</span>
              <span className="font-mono text-[10px] text-[#caf300] uppercase font-bold">{t('vaultCertified')}</span>
            </div>
          </div>
        </div>

        {/* Big Full Inspection Viewport */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#0e0e10] border border-[#26262e] shadow-inner group">
          <img
            src={currentPhoto.url}
            alt={currentPhoto.label}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-[#131315]/90 border border-white/10 font-mono text-[9.5px] text-[#caf300] backdrop-blur-md">
            {currentPhoto.spec}
          </div>
          <div className="absolute bottom-2.5 inset-x-2.5 px-3 py-1.5 rounded-xl bg-[#201f21]/95 backdrop-blur-md border border-white/10 font-mono text-[10.5px] text-white flex items-center justify-between">
            <span className="truncate">{currentPhoto.note}</span>
            <span className="text-[#caf300] text-[10px] uppercase font-bold shrink-0 ml-2">
              {t('viewImage')} {currentPhotoIndex + 1}/{gallery.length}
            </span>
          </div>
        </div>

        {/* Thumbnail Selector Strip - Dynamically sized to EXACT photo count (no empty missing slots) */}
        <div
          className={`grid gap-2 ${
            gallery.length === 1
              ? 'grid-cols-1'
              : gallery.length === 2
              ? 'grid-cols-2'
              : gallery.length === 3
              ? 'grid-cols-3'
              : 'grid-cols-4'
          }`}
        >
          {gallery.map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                soundFX.playClick();
                triggerHaptic('light');
                setActiveThumb(i);
              }}
              className={`aspect-video sm:aspect-square rounded-xl overflow-hidden border p-0.5 cursor-pointer relative transition-all ${
                currentPhotoIndex === i
                  ? 'border-[#caf300] shadow-[0_0_10px_rgba(202,243,0,0.3)] ring-1 ring-[#caf300]'
                  : 'border-[#26262e] opacity-70 hover:opacity-100'
              }`}
            >
              <img src={v.url} alt={v.label} className="w-full h-full object-cover rounded-lg" />
              <span className="absolute bottom-0.5 inset-x-0.5 bg-[#131315]/90 text-[8.5px] font-mono text-white text-center uppercase font-bold truncate px-1">
                {v.label}
              </span>
            </button>
          ))}
        </div>

        {/* Complete Garment Details & Description */}
        <div className="p-3.5 rounded-xl bg-[#131315] border border-white/5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#caf300] uppercase font-semibold">
              {t('fullGarmentDetails')}
            </span>
            <span className="font-mono text-[10px] text-[#c5c9ac]">
              {t('size')} <strong className="text-white">{item.size || 'L'}</strong>
            </span>
          </div>

          <p className="font-sans text-xs text-[#e5e1e4] leading-relaxed">
            {item.description ||
              `Heavyweight authentic circular fashion piece with premium hand-feel. Ribbed collar and double-stitched hem with zero pinholes, stains, or cracking. Inspected with verified photos.`}
          </p>

          {/* Key Specifications Grid */}
          <div className="grid grid-cols-4 gap-1.5 pt-1.5 border-t border-white/5 font-mono text-[9.5px]">
            <div className="bg-[#1c1b1d] p-1.5 rounded-lg">
              <span className="text-[#8f9378] block text-[8px]">{t('navCloset').toUpperCase()}</span>
              <span className="text-white font-bold uppercase truncate block">{itemCategory}</span>
            </div>
            <div className="bg-[#1c1b1d] p-1.5 rounded-lg">
              <span className="text-[#8f9378] block text-[8px]">FIT / دائرة</span>
              <span className={`font-bold uppercase truncate block ${item.isGirlsOnlyCircle ? 'text-[#ff69b4]' : item.genderFit === 'womens' ? 'text-[#ff69b4]' : item.genderFit === 'mens' ? 'text-[#38bdf8]' : 'text-white'}`}>
                {item.isGirlsOnlyCircle ? '🌸 Girls Circle' : item.genderFit === 'womens' ? '🌸 Her Fit' : item.genderFit === 'mens' ? '⚡ Him Fit' : 'Unisex'}
              </span>
            </div>
            <div className="bg-[#1c1b1d] p-1.5 rounded-lg">
              <span className="text-[#8f9378] block text-[8px]">{t('condition').toUpperCase()}</span>
              <span className="text-[#caf300] font-bold truncate block">{item.condition || '9.8 / 10'}</span>
            </div>
            <div className="bg-[#1c1b1d] p-1.5 rounded-lg">
              <span className="text-[#8f9378] block text-[8px]">{t('totalClosetValue').toUpperCase()}</span>
              <span className="text-white font-bold truncate block">{itemValue} EGP</span>
            </div>
          </div>
        </div>

        {/* Girls-Only Swap Circle Banner */}
        {item.isGirlsOnlyCircle && (
          <div className="p-3 rounded-xl bg-[#ff69b4]/10 border border-[#ff69b4]/40 flex items-center gap-2.5 text-[#ff69b4]">
            <span className="text-xl shrink-0">🌸</span>
            <div className="text-[10px] font-mono leading-tight">
              <p className="font-bold text-[11px] uppercase">GIRLS-ONLY SWAP CIRCLE // دائرة سواب بنات فقط</p>
              <p className="text-white/80 text-[9.5px] mt-0.5">هذه القطعة حصرية للبنات، التبادل والتفاوض يتم فقط في بيئة آمنة وخاصة 100%.</p>
            </div>
          </div>
        )}

        {/* Living Streetwear Museum Archival Passport */}
        <div className="p-3.5 rounded-xl bg-[#171619] border border-[#caf300]/30 flex flex-col gap-2 font-mono shadow-sm">
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="text-[#caf300] font-bold uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">museum</span>
              <span>
                MUSEUM PASSPORT // {item.museumProvenance?.lotNumber || item.lot || 'LOT #CAI-8809'}
              </span>
            </span>
            <span className="px-2 py-0.5 rounded bg-[#caf300]/15 text-[#caf300] font-bold text-[9px] uppercase border border-[#caf300]/30">
              {item.museumProvenance?.rarityTier || (item.badge ? item.badge : 'Grail Tier 1')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 rounded-lg bg-[#0e0e11] border border-white/5 flex flex-col gap-0.5">
              <span className="text-[#8f9378] uppercase text-[8.5px]">Era &amp; Origin</span>
              <span className="text-white font-bold truncate">
                {item.museumProvenance?.era || 'Late 1990s Vintage'}
              </span>
              <span className="text-[#caf300] text-[8.5px] truncate">
                {item.museumProvenance?.originCountry || 'Made in USA / Japan'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-[#0e0e11] border border-white/5 flex flex-col gap-0.5">
              <span className="text-[#8f9378] uppercase text-[8.5px]">Fair Barter Index</span>
              <span className="text-[#caf300] font-bold truncate">
                {item.museumProvenance?.fairValueRangeEgp || `${itemValue - 50} – ${itemValue + 150} EGP`}
              </span>
              <span className="text-[#8f9378] text-[8.5px] truncate">
                Global: {item.museumProvenance?.globalResaleUsd || `$${Math.round(itemValue / 45)} USD`}
              </span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-[#0e0e11] border border-white/5 text-[9.5px] flex flex-col gap-1">
            <div className="flex items-center justify-between text-[#c5c9ac]">
              <span className="font-bold text-white truncate max-w-[190px]">
                {item.museumProvenance?.fabricComposition || 'Heavyweight Loopback Cotton Fleece'}
              </span>
              <span className="text-[#8f9378] text-[8.5px] truncate max-w-[120px]">
                {item.museumProvenance?.stitchDetail || 'Single-stitch & satin embroidery'}
              </span>
            </div>
            {(item.museumProvenance?.curatorEditorial || item.description) && (
              <p className="text-[9px] text-[#c5c9ac] font-sans italic leading-relaxed border-t border-white/5 pt-1">
                "{item.museumProvenance?.curatorEditorial || item.description}"
              </p>
            )}
          </div>
        </div>

        {/* Location & Authenticity Assurance */}
        <div className="p-2.5 rounded-xl bg-[#18181a] border border-white/5 flex items-center justify-between text-[11px] font-mono text-[#c5c9ac]">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#caf300] text-[16px]">location_on</span>
            <span>{isGarment ? item.city || item.owner?.location || 'Maadi Hub' : 'Your Cairo Vault'}</span>
          </div>
          <div className="flex items-center gap-1 text-[#caf300]">
            <span className="material-symbols-outlined text-[15px]">shield_check</span>
            <span>{t('verifiedLockerHandover')}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1 flex gap-2">
          {isGarment && onInitiateSwap && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('trade');
                onClose();
                onInitiateSwap(item as Garment);
              }}
              className="flex-1 py-3 rounded-xl bg-[#caf300] text-[#171e00] font-mono font-bold text-xs uppercase hover:brightness-110 active:scale-98 cursor-pointer shadow-md shadow-[#caf300]/20 flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
              <span>{t('proposeSwapPiece')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-4 py-3 rounded-xl bg-[#2a2a2c] text-white font-mono text-xs uppercase hover:bg-[#353437] cursor-pointer"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
