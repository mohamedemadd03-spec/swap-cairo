import React, { useState, useEffect } from 'react';
import { SwapOffer, WardrobeItem } from '../../types/swap';
import { soundFX, triggerHaptic } from '../../hooks/useSoundFX';
import { useLanguage } from '../../i18n/LanguageContext';

interface EditOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: SwapOffer | null;
  userWardrobe: WardrobeItem[];
  onSaveRevisedOffer: (
    offerId: string,
    selectedItems: WardrobeItem[],
    cashTopUp: number,
    note?: string
  ) => void;
  onNudgeOffer?: (offerId: string) => void;
}

export const EditOfferModal: React.FC<EditOfferModalProps> = ({
  isOpen,
  onClose,
  offer,
  userWardrobe,
  onSaveRevisedOffer,
}) => {
  const { language, t } = useLanguage();
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [cashTopUp, setCashTopUp] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (offer) {
      const initialIds =
        offer.yourItems && offer.yourItems.length > 0
          ? offer.yourItems.map((i) => i.id)
          : [offer.yourItem.id];
      setSelectedItemIds(initialIds);
      setCashTopUp(offer.cashTopUp || 0);
      setIsSubmitting(false);
    }
  }, [offer]);

  if (!isOpen || !offer) return null;

  const selectedItems = userWardrobe.filter((item) =>
    selectedItemIds.includes(item.id)
  );
  const primarySelected = selectedItems[0] || userWardrobe[0];
  const itemsTotalValue = selectedItems.reduce((acc, curr) => acc + curr.value, 0);
  const totalOfferedValue = itemsTotalValue + cashTopUp;

  const toggleItem = (id: string) => {
    soundFX.playClick();
    setSelectedItemIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((i) => i !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSave = () => {
    if (selectedItems.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    triggerHaptic('trade');
    soundFX.playMatch();
    onSaveRevisedOffer(offer.id, selectedItems, cashTopUp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#131315]/92 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#201f21] border border-[#26262e] rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 max-h-[92vh] overflow-y-auto font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#caf300] text-[20px]">
              edit_note
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-white uppercase tracking-tight">
                {language === 'ar' ? 'تعديل عرض البدل' : language === 'fr' ? 'Modifier l’offre' : 'Edit Trade Selection'}
              </h3>
              <p className="font-mono text-[10px] text-[#c5c9ac]">
                {language === 'ar' ? 'غيّر التيشيرت أو زوّد فرق فلوس مباشرة في المحادثة' : language === 'fr' ? 'Modifiez les pièces ou ajoutez du cash' : 'Update pieces or cash without leaving chat'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#131315] hover:bg-[#2a2a2c] flex items-center justify-center text-[#c6c6c7] hover:text-white cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* 1. SIDE-BY-SIDE LIVE TRADE STAGE */}
        <div className="p-3 rounded-2xl bg-[#131315] border border-[#caf300]/30 relative">
          <div className="grid grid-cols-2 gap-3 items-center">
            {/* Left: Their Piece */}
            <div className="flex flex-col gap-1.5 pr-2 border-r border-white/10">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">
                  {language === 'ar' ? 'قطعة الشريك' : language === 'fr' ? 'SA PIÈCE' : 'THEIR PIECE'}
                </span>
                <span className="font-mono text-[9.5px] text-[#c5c9ac]">
                  Size {offer.theirItem.size}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <img
                  src={offer.theirItem.imageUrl}
                  alt={offer.theirItem.title}
                  className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-sans text-xs font-bold text-white truncate">
                    {offer.theirItem.title}
                  </h4>
                  <span className="font-mono text-[10.5px] text-[#caf300] font-bold block mt-0.5">
                    {offer.theirItem.value} EGP
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Your Revised Offer */}
            <div className="flex flex-col gap-1.5 pl-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#caf300] text-[#171e00] font-bold">
                  {language === 'ar' ? 'عرضك المعدل' : language === 'fr' ? 'VOTRE OFFRE' : 'YOUR OFFER'}
                </span>
                <span className="font-mono text-[9.5px] text-[#caf300] font-bold">
                  {selectedItems.length > 1
                    ? `${selectedItems.length} Pieces`
                    : primarySelected
                    ? `Size ${primarySelected.size}`
                    : 'Pick below'}
                </span>
              </div>
              {primarySelected && (
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <img
                      src={primarySelected.imageUrl}
                      alt={primarySelected.title}
                      className="w-12 h-12 rounded-xl object-cover border border-[#caf300]"
                    />
                    {selectedItems.length > 1 && (
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-[#caf300] text-[#171e00] font-mono text-[9px] font-bold">
                        +{selectedItems.length - 1}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-sans text-xs font-bold text-white truncate">
                      {selectedItems.length > 1
                        ? `${selectedItems.length} Closet Pieces`
                        : primarySelected.title}
                    </h4>
                    <span className="font-mono text-[10.5px] text-[#caf300] font-bold block mt-0.5">
                      {totalOfferedValue} EGP
                      {cashTopUp > 0 ? ` (+${cashTopUp})` : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. VISUAL CLOSET GRID SELECTOR */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-white font-bold">
              {language === 'ar'
                ? `اختر القطع من دولابك (${selectedItems.length} محددة)`
                : language === 'fr'
                ? `Choisir les pièces (${selectedItems.length} sélectionnée(s))`
                : `Select Piece(s) From Your Closet (${selectedItems.length} Selected)`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-0.5">
            {userWardrobe.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className={`rounded-xl p-1.5 flex flex-col text-left cursor-pointer border transition-all relative ${
                    isSelected
                      ? 'bg-[#18181a] border-[#caf300] ring-1 ring-[#caf300] shadow-[0_0_12px_rgba(202,243,0,0.18)]'
                      : 'bg-[#131315] border-white/5 hover:border-white/20 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#0e0e10] mb-1.5">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-[#131315]/90 text-[8.5px] font-mono font-bold text-white">
                      {item.size}
                    </span>
                    <div
                      className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center border ${
                        isSelected
                          ? 'bg-[#caf300] text-[#171e00] border-[#caf300]'
                          : 'bg-black/60 text-transparent border-white/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px] font-bold">
                        check
                      </span>
                    </div>
                  </div>
                  <span className="font-sans text-[10.5px] font-bold text-white truncate w-full">
                    {item.title}
                  </span>
                  <span className="font-mono text-[9.5px] text-[#caf300] font-bold">
                    {item.value} EGP
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. COMPACT CASH SWEETENER PILLS */}
        <div className="p-2.5 rounded-xl bg-[#131315] border border-white/5 flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase text-[#c5c9ac] font-bold shrink-0">
            {language === 'ar' ? '+ فرق كاش إضافي:' : language === 'fr' ? '+ Ajout de Cash :' : '+ Cash Sweetener:'}
          </span>
          <div className="flex items-center gap-1 flex-1 justify-end">
            {[0, 50, 100, 150, 200].map((amt) => {
              const isSelected = cashTopUp === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    soundFX.playCash();
                    setCashTopUp(amt);
                  }}
                  className={`px-2 py-1 rounded-lg font-mono text-[10px] uppercase font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#caf300] text-[#171e00]'
                      : 'bg-[#201f21] text-[#c5c9ac] hover:text-white border border-white/5'
                  }`}
                >
                  {amt === 0 ? (language === 'ar' ? 'بدون' : language === 'fr' ? 'Aucun' : 'None') : `+${amt}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. SUBMIT BAR */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-[#131315] text-[#c6c6c7] hover:text-white font-mono text-xs uppercase cursor-pointer transition-colors"
          >
            {language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={selectedItems.length === 0 || isSubmitting}
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-[#caf300] text-[#171e00] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-[#caf300]/20 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[17px]">check_circle</span>
            <span>
              {isSubmitting
                ? language === 'ar' ? 'جاري الحفظ...' : 'Saving...'
                : language === 'ar' ? 'حفظ وتحديث العرض' : language === 'fr' ? 'Mettre à jour' : 'Update Trade'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
