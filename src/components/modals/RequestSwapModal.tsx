import React, { useState } from 'react';
import { Garment, WardrobeItem, SwapOffer } from '../../types/swap';
import { soundFX, triggerHaptic } from '../../hooks/useSoundFX';
import { useLanguage } from '../../i18n/LanguageContext';

interface RequestSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetGarment: Garment | null;
  userWardrobe: WardrobeItem[];
  onRequestSent: (offer: SwapOffer) => void;
  onOpenAddItem: () => void;
}

export const RequestSwapModal: React.FC<RequestSwapModalProps> = ({
  isOpen,
  onClose,
  targetGarment,
  userWardrobe,
  onRequestSent,
  onOpenAddItem,
}) => {
  const { t } = useLanguage();
  const [selectedVaultItemIds, setSelectedVaultItemIds] = useState<string[]>(
    userWardrobe[0]?.id ? [userWardrobe[0].id] : []
  );
  const [cashTopUp, setCashTopUp] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !targetGarment) return null;

  const selectedItems = userWardrobe.filter((item) =>
    selectedVaultItemIds.includes(item.id)
  );

  const itemsTotalValue = selectedItems.reduce((acc, curr) => acc + curr.value, 0);
  const totalOfferedValue = itemsTotalValue + cashTopUp;
  const primarySelected = selectedItems[0] || userWardrobe[0];

  const toggleItemSelection = (id: string) => {
    soundFX.playClick();
    setSelectedVaultItemIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSendRequest = () => {
    if (selectedItems.length === 0) {
      soundFX.playClick();
      return;
    }

    triggerHaptic('trade');
    soundFX.playMatch();
    setIsSubmitting(true);

    const generatedCode = `SWP-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(
      10 + Math.random() * 90
    )}`;
    const generatedBarcode = `BC-${Date.now().toString().slice(-8)}`;

    const isBundle = selectedItems.length > 1;
    const primaryItem = selectedItems[0];

    const newOffer: SwapOffer = {
      id: `request-${Date.now()}`,
      direction: 'sent',
      partner: targetGarment.owner,
      theirItem: {
        id: targetGarment.id,
        title: targetGarment.title,
        imageUrl: targetGarment.imageUrl,
        value: targetGarment.estValue,
        size: targetGarment.size,
        brand: targetGarment.brand,
        condition: targetGarment.condition,
        description: targetGarment.description,
        category: targetGarment.category,
      },
      yourItem: {
        id: primaryItem.id,
        title: isBundle
          ? `${primaryItem.title} + ${selectedItems.length - 1} more`
          : primaryItem.title,
        imageUrl: primaryItem.imageUrl,
        value: itemsTotalValue,
        size: isBundle ? `${selectedItems.length} pcs` : primaryItem.size,
        brand: primaryItem.title.split(' ')[0],
        condition: primaryItem.condition || '9.8 / 10 MINT',
        description: primaryItem.description,
        category: primaryItem.category,
      },
      bundleItems: isBundle
        ? selectedItems.map((it) => ({
            id: it.id,
            title: it.title,
            imageUrl: it.imageUrl,
            value: it.value,
            size: it.size,
          }))
        : undefined,
      yourItems: selectedItems.map((it) => ({
        id: it.id,
        title: it.title,
        imageUrl: it.imageUrl,
        value: it.value,
        size: it.size,
      })),
      isBundle,
      tradeRatio: isBundle ? `${selectedItems.length}:1` : '1:1',
      cashTopUp,
      topUpBy: cashTopUp > 0 ? 'you' : 'none',
      status: 'pending',
      negotiationRounds: 1,
      hubLocation: `${targetGarment.owner.location || 'Degla Hub'}`,
      scheduledTime: 'Pending partner approval',
      securityPassCode: generatedCode,
      barcode: generatedBarcode,
      timestamp: 'Just now',
      co2SavedKg: isBundle ? 6.8 : 4.2,
      counterDetails: cashTopUp > 0 ? { cashTopUp } : undefined,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'you',
          text: isBundle
            ? `Proposed ${selectedItems.length}-for-1 swap: ${selectedItems
                .map((it) => it.title)
                .join(' + ')}${cashTopUp > 0 ? ` + ${cashTopUp} EGP` : ''} for your ${targetGarment.title}.`
            : `Proposed 1-to-1 swap: my ${primaryItem.title}${
                cashTopUp > 0 ? ` + ${cashTopUp} EGP` : ''
              } for your ${targetGarment.title}.`,
          timestamp: 'Just now',
        },
      ],
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onRequestSent(newOffer);
      onClose();
    }, 280);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#131315]/92 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#201f21] border border-[#26262e] rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 max-h-[92vh] overflow-y-auto font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#caf300] text-[20px]">
              swap_horiz
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-white uppercase tracking-tight">
                {t('selectYourTrade')}
              </h3>
              <p className="font-mono text-[10px] text-[#c5c9ac]">
                {t('pickWhatToOffer')}
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

        {/* 1. SIDE-BY-SIDE LIVE TRADE STAGE (THEIR PIECE ⇄ YOUR OFFER) */}
        <div className="p-3 rounded-2xl bg-[#131315] border border-[#caf300]/30 relative">
          <div className="grid grid-cols-2 gap-3 items-center">
            {/* Left: What You Get */}
            <div className="flex flex-col gap-1.5 pr-2 border-r border-white/10">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">
                  {t('youGet')}
                </span>
                <span className="font-mono text-[9.5px] text-[#c5c9ac]">
                  Size {targetGarment.size}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <img
                  src={targetGarment.imageUrl}
                  alt={targetGarment.title}
                  className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-sans text-xs font-bold text-white truncate">
                    {targetGarment.title}
                  </h4>
                  <span className="font-mono text-[10.5px] text-[#caf300] font-bold block mt-0.5">
                    {targetGarment.estValue} EGP
                  </span>
                </div>
              </div>
            </div>

            {/* Right: What You Offer */}
            <div className="flex flex-col gap-1.5 pl-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#caf300] text-[#171e00] font-bold">
                  {t('youOffer')}
                </span>
                <span className="font-mono text-[9.5px] text-[#caf300] font-bold">
                  {selectedItems.length > 1
                    ? `${selectedItems.length} Pieces`
                    : primarySelected
                    ? `Size ${primarySelected.size}`
                    : 'Pick below'}
                </span>
              </div>
              {primarySelected ? (
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
              ) : (
                <div className="h-12 flex items-center text-xs font-mono text-[#8f9378]">
                  Tap a piece below
                </div>
              )}
            </div>
          </div>

          {/* Live Fairness Meter & 1-Tap Auto-Balance */}
          {(() => {
            const gap = targetGarment.estValue - totalOfferedValue;
            const isFair = Math.abs(gap) <= 100;
            return (
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2 font-mono text-[10px]">
                <span className={isFair ? 'text-[#caf300] font-bold' : 'text-[#c5c9ac]'}>
                  {isFair
                    ? t('fairMatch')
                    : gap > 0
                    ? t('valueGapBelow', { gap })
                    : t('strongOfferAbove', { gap: Math.abs(gap) })}
                </span>
                {gap > 100 && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      soundFX.playClick();
                      setCashTopUp(Math.max(50, Math.round((targetGarment.estValue - itemsTotalValue) / 50) * 50));
                    }}
                    className="px-2 py-0.5 rounded-md bg-[#caf300]/20 hover:bg-[#caf300] text-[#caf300] hover:text-[#171e00] border border-[#caf300]/40 font-bold uppercase shrink-0 cursor-pointer transition-colors"
                  >
                    {t('autoBalance')}
                  </button>
                )}
              </div>
            );
          })()}
        </div>

        {/* 2. VISUAL CLOSET GRID SELECTOR */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-white font-bold">
              Choose Piece(s) From Your Closet ({selectedItems.length} Selected)
            </span>
            <button
              type="button"
              onClick={onOpenAddItem}
              className="text-[#caf300] font-mono text-[10px] uppercase font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">photo_camera</span>
              <span>+ Snap New</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-0.5">
            {userWardrobe.map((item) => {
              const isSelected = selectedVaultItemIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItemSelection(item.id)}
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

            {/* Direct Camera Upload Tile inside Selector */}
            <button
              type="button"
              onClick={onOpenAddItem}
              className="rounded-xl p-2 border border-dashed border-[#caf300]/40 hover:border-[#caf300] bg-[#131315]/60 flex flex-col items-center justify-center gap-1 text-center cursor-pointer min-h-[120px]"
            >
              <span className="material-symbols-outlined text-[#caf300] text-[22px]">
                photo_camera
              </span>
              <span className="font-mono text-[9.5px] font-bold text-white uppercase">
                + Upload Shirt
              </span>
            </button>
          </div>
        </div>

        {/* 3. COMPACT CASH SWEETENER PILLS */}
        <div className="p-2.5 rounded-xl bg-[#131315] border border-white/5 flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase text-[#c5c9ac] font-bold shrink-0">
            + Cash Sweetener:
          </span>
          <div className="flex items-center gap-1 flex-1 justify-end">
            {[0, 50, 100, 200].map((amt) => {
              const isSelected = cashTopUp === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setCashTopUp(amt);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[10px] uppercase font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#caf300] text-[#171e00]'
                      : 'bg-[#201f21] text-[#c5c9ac] hover:text-white border border-white/5'
                  }`}
                >
                  {amt === 0 ? 'None' : `+${amt}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. SUBMIT BAR */}
        <div className="flex gap-2 pt-0.5">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-[#131315] text-[#c6c6c7] hover:text-white font-mono text-xs uppercase cursor-pointer"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            disabled={selectedItems.length === 0 || isSubmitting}
            onClick={handleSendRequest}
            className="flex-1 py-3 rounded-xl bg-[#caf300] text-[#171e00] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-[#caf300]/20 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[17px]">swap_horiz</span>
            <span>
              {isSubmitting
                ? 'Sending...'
                : `${t('confirmTradeOffer')} (${selectedItems.length} pc${
                    selectedItems.length > 1 ? 's' : ''
                  }${cashTopUp > 0 ? ` +${cashTopUp} EGP` : ''})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
