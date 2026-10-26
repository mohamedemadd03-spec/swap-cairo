import React, { useState } from 'react';
import { Garment, WardrobeItem } from '../../types/swap';
import { calculateCashDelta } from '../../utils/swapLogic';
import { soundFX } from '../../hooks/useSoundFX';

interface CompareClosetModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetGarment: Garment;
  userWardrobe: WardrobeItem[];
  onProposeSwap: (myWardrobeItem: WardrobeItem, target: Garment, bundleItems?: WardrobeItem[]) => void;
  onOpenBuyout: (garment: Garment) => void;
}

export const CompareClosetModal: React.FC<CompareClosetModalProps> = ({
  isOpen,
  onClose,
  targetGarment,
  userWardrobe,
  onProposeSwap,
  onOpenBuyout,
}) => {
  // Support multi-selection of items for 1:1, 2:1, or N:1 bundle trades
  const [selectedItems, setSelectedItems] = useState<WardrobeItem[]>([userWardrobe[0]]);

  if (!isOpen) return null;

  const totalOfferedValue = selectedItems.reduce((sum, item) => sum + (item.value || 0), 0);
  const delta = calculateCashDelta(totalOfferedValue, targetGarment.estValue);
  const buyoutPrice = targetGarment.buyoutPrice || Math.round(targetGarment.estValue * 1.1);

  const isBundle = selectedItems.length > 1;

  const handleToggleItem = (item: WardrobeItem) => {
    soundFX.playClick();
    setSelectedItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) {
        if (prev.length === 1) return prev; // Keep at least one item selected
        return prev.filter((i) => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleSelectSingle = (item: WardrobeItem) => {
    soundFX.playClick();
    setSelectedItems([item]);
  };

  const handleSelectTwoTeesBundle = () => {
    soundFX.playClick();
    // Select first 2 items from vault
    if (userWardrobe.length >= 2) {
      setSelectedItems([userWardrobe[0], userWardrobe[1]]);
    }
  };

  const handleConfirmProposal = () => {
    soundFX.playCash();
    soundFX.playStamp();
    onProposeSwap(selectedItems[0], targetGarment, selectedItems.slice(1));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0d0e12]/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#14161d] border-t sm:border border-[#232733] rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 flex flex-col gap-3 font-sans shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#d4ff00]">swap_horiz</span>
            <span className="font-display font-extrabold text-sm sm:text-base uppercase text-white tracking-wide">
              Trade Sheet // {isBundle ? `${selectedItems.length}-for-1 Bundle` : 'Closet Match'}
            </span>
          </div>
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            aria-label="Close compare"
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white bg-[#1e2029] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Quick Preset Buttons (1 Piece vs 2-Piece Bundle) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelectSingle(userWardrobe[0])}
            className={`px-3 py-1 rounded-full text-[10.5px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
              !isBundle
                ? 'bg-[#d4ff00] text-[#0d0e12] shadow-sm'
                : 'bg-[#181920] text-neutral-400 hover:text-white border border-white/5'
            }`}
          >
            1 Piece Trade
          </button>
          <button
            type="button"
            onClick={handleSelectTwoTeesBundle}
            className={`px-3 py-1 rounded-full text-[10.5px] font-display font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
              isBundle
                ? 'bg-[#d4ff00] text-[#0d0e12] shadow-sm'
                : 'bg-[#181920] text-neutral-400 hover:text-white border border-white/5'
            }`}
          >
            <span className="text-[12px]">📦</span>
            <span>Bundle 2 Pieces (2-for-1)</span>
          </button>
        </div>

        {/* 1-to-1 or N-to-1 Visual Trade Comparison */}
        <div className="grid grid-cols-2 gap-2.5 items-stretch relative">
          {/* Target Piece: What you receive */}
          <div className="p-2.5 rounded-xl bg-[#0d0e12] border border-[#232733] flex flex-col justify-between">
            <div>
              <span className="font-display text-[9px] uppercase font-bold text-[#7bd0ff] block mb-1">
                You Receive ({targetGarment.owner.handle})
              </span>
              <div className="aspect-[4/5] rounded-lg overflow-hidden bg-[#181920] mb-2 border border-white/[0.05]">
                <img
                  src={targetGarment.imageUrl}
                  alt={targetGarment.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="font-display font-bold text-xs text-white truncate leading-tight">
                {targetGarment.title}
              </h4>
              <p className="text-[10px] text-neutral-400">{targetGarment.size}</p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-[#232733] flex justify-between text-xs">
              <span className="text-neutral-400 text-[10px] uppercase font-display">Est. Val</span>
              <span className="font-display font-bold text-white">{targetGarment.estValue} EGP</span>
            </div>
          </div>

          {/* Selected Wardrobe Pieces: What you trade */}
          <div className="p-2.5 rounded-xl bg-[#0d0e12] border border-[#d4ff00]/50 flex flex-col justify-between relative shadow-[0_0_15px_rgba(212,255,0,0.08)]">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-display text-[9px] uppercase font-bold text-[#d4ff00] block">
                  You Trade (Your Vault)
                </span>
                {isBundle && (
                  <span className="px-1.5 py-0.2 rounded bg-[#d4ff00] text-[#0d0e12] font-display text-[9px] font-black uppercase">
                    {selectedItems.length} PIECES
                  </span>
                )}
              </div>

              {/* Single item or Stacked Mini-Cards for bundle */}
              {!isBundle ? (
                <div className="aspect-[4/5] rounded-lg overflow-hidden bg-[#181920] mb-2 border border-white/[0.05]">
                  <img
                    src={selectedItems[0].imageUrl}
                    alt={selectedItems[0].title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[4/5] relative rounded-lg overflow-hidden bg-[#181920] mb-2 border border-[#d4ff00]/30 flex flex-col">
                  {/* Layered stack preview */}
                  <div className="grid grid-cols-2 gap-1 p-1 h-full">
                    {selectedItems.slice(0, 4).map((it) => (
                      <div key={it.id} className="relative rounded overflow-hidden bg-black/40">
                        <img src={it.imageUrl} alt={it.title} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-mono text-[#d4ff00] px-1 truncate">
                          {it.value} EGP
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h4 className="font-display font-bold text-xs text-white truncate leading-tight">
                {isBundle
                  ? selectedItems.map((s) => s.title.split(' ')[0]).join(' + ')
                  : selectedItems[0].title}
              </h4>
              <p className="text-[10px] text-neutral-400">
                {isBundle ? `${selectedItems.length} items bundled` : selectedItems[0].size}
              </p>
            </div>

            <div className="mt-2 pt-1.5 border-t border-[#232733] flex justify-between text-xs">
              <span className="text-neutral-400 text-[10px] uppercase font-display">
                {isBundle ? 'Total Val' : 'Est. Val'}
              </span>
              <span className="font-display font-bold text-[#d4ff00]">{totalOfferedValue} EGP</span>
            </div>
          </div>
        </div>

        {/* Value Balance Equalizer Explanation */}
        <div className="p-3 bg-[#0d0e12] rounded-xl border border-[#232733] flex items-center justify-between text-xs font-sans">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#d4ff00]/10 text-[#d4ff00] font-display font-black text-xs flex items-center justify-center">
              Δ
            </span>
            <div>
              <div className="font-display font-bold text-white text-[11px] uppercase flex items-center gap-1.5">
                <span>Cash Difference</span>
                {isBundle && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-neutral-300 font-mono">
                    Bundle Equalizer
                  </span>
                )}
              </div>
              <div className="text-[11px] text-neutral-400">
                {delta.cashAmount === 0
                  ? 'Even trade! Zero cash settlement needed.'
                  : delta.payer === 'partner'
                  ? `Partner adds +${delta.cashAmount} EGP cash to you`
                  : `You add +${delta.cashAmount} EGP cash to partner`}
              </div>
            </div>
          </div>
          <span className="font-display font-extrabold text-sm text-[#d4ff00]">
            {delta.cashAmount === 0 ? '0 EGP' : `+${delta.cashAmount} EGP`}
          </span>
        </div>

        {/* Multi-Select Pieces from Your Wardrobe with Checkboxes */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-display uppercase tracking-wider text-neutral-400 block font-bold">
              Select Pieces from Your Vault ({selectedItems.length} selected):
            </span>
            <span className="text-[9px] font-mono text-[#d4ff00]">
              Multi-Select Checkboxes
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {userWardrobe.map((item) => {
              const isChecked = selectedItems.some((i) => i.id === item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleItem(item)}
                  className={`relative p-1.5 rounded-xl border flex flex-col gap-1 text-left transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-[#1e2029] border-[#d4ff00] shadow-[0_0_10px_rgba(212,255,0,0.25)]'
                      : 'bg-[#0d0e12] border-[#232733] opacity-75 hover:opacity-100'
                  }`}
                >
                  {/* Glowing checkbox indicator */}
                  <div
                    className={`absolute top-2 right-2 w-4 h-4 rounded flex items-center justify-center transition-all z-10 ${
                      isChecked
                        ? 'bg-[#d4ff00] text-[#0d0e12] shadow-[0_0_6px_#d4ff00]'
                        : 'bg-[#181920] border border-white/20 text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                  </div>

                  <div className="aspect-square rounded-lg overflow-hidden bg-[#181920]">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <span className="font-display text-[10px] font-bold text-white truncate block">
                    {item.title}
                  </span>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#d4ff00] font-mono">{item.value} EGP</span>
                    <span className="text-neutral-500 font-sans">{item.size}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleConfirmProposal}
            className="w-full py-3.5 rounded-xl bg-[#d4ff00] hover:brightness-110 active:scale-[0.99] text-[#0d0e12] font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(212,255,0,0.3)] cursor-pointer transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">handshake</span>
            <span>
              Send {isBundle ? `${selectedItems.length}-Piece Bundle` : 'Swap'} Proposal to Live Chat
            </span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenBuyout(targetGarment);
            }}
            className="w-full py-2.5 rounded-xl bg-[#0d0e12] hover:bg-[#181920] border border-[#232733] text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px] text-[#d4ff00]">shopping_bag</span>
            <span>Buy outright for {buyoutPrice} {targetGarment.currency} (No Trade)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
