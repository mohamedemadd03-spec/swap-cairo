import React, { useState } from 'react';
import { Garment, WardrobeItem } from '../../types/swap';
import { calculateCashDelta } from '../../utils/swapLogic';

interface CashSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetGarment: Garment;
  userWardrobe: WardrobeItem[];
  onSubmitOffer: (offeredItemId: string, cashDelta: number) => void;
}

export const CashSwapModal: React.FC<CashSwapModalProps> = ({
  isOpen,
  onClose,
  targetGarment,
  userWardrobe,
  onSubmitOffer,
}) => {
  const [selectedWardrobeId, setSelectedWardrobeId] = useState(userWardrobe[0]?.id || '');
  const [customCashTopUp, setCustomCashTopUp] = useState(150);

  if (!isOpen) return null;

  const chosenItem = userWardrobe.find((w) => w.id === selectedWardrobeId) || userWardrobe[0];
  const deltaCalc = calculateCashDelta(chosenItem?.value || 0, targetGarment.estValue);

  const handleSubmit = () => {
    onSubmitOffer(selectedWardrobeId, customCashTopUp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#131317] border-t-2 sm:border-2 border-[#2A2A33] p-5 flex flex-col gap-4 font-mono-zine shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2A2A33] pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#D4FF00]">payments</span>
            <span className="font-display-zine font-extrabold text-lg uppercase text-white">
              CASH + SWAP OFFER
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cash modal"
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white border border-neutral-700"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Target Item Pill */}
        <div className="p-2.5 bg-[#08080A] border border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex flex-col truncate pr-2">
            <span className="text-[10px] text-neutral-400 uppercase">OFFERING FOR:</span>
            <span className="font-bold text-white truncate">{targetGarment.title}</span>
          </div>
          <span className="px-2 py-1 bg-[#D4FF00] text-[#08080A] font-bold shrink-0">
            {targetGarment.estValue} EGP
          </span>
        </div>

        {/* Select Your Garment */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs uppercase text-neutral-400 font-bold">
            // SELECT YOUR PIECE TO TRADE
          </span>
          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
            {userWardrobe.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedWardrobeId(item.id)}
                className={`p-2 border text-left flex items-center justify-between cursor-pointer transition-colors ${
                  selectedWardrobeId === item.id
                    ? 'bg-[#1C1C22] border-[#D4FF00] text-white'
                    : 'bg-[#08080A] border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div
                    className="w-8 h-8 bg-cover bg-center rounded-none shrink-0"
                    style={{ backgroundImage: `url('${item.imageUrl}')` }}
                  />
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-bold truncate">{item.title}</span>
                    <span className="text-[10px] text-neutral-400">{item.size}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#e0b6ff] shrink-0">
                  {item.value} EGP
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Cash Top-up Selector */}
        <div className="flex flex-col gap-2 border-t border-[#2A2A33] pt-3">
          <div className="flex justify-between text-xs">
            <span className="uppercase text-neutral-400 font-bold">// CASH TOP-UP AMOUNT</span>
            <span className="text-[#D4FF00] font-bold">+ {customCashTopUp} EGP</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[50, 100, 150, 300].map((amt) => (
              <button
                key={amt}
                onClick={() => setCustomCashTopUp(amt)}
                className={`py-1.5 text-xs border text-center cursor-pointer transition-colors ${
                  customCashTopUp === amt
                    ? 'bg-[#D4FF00] text-[#08080A] border-black font-bold'
                    : 'bg-[#08080A] text-neutral-300 border-[#2A2A33]'
                }`}
              >
                +{amt}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-neutral-400">
            Suggested fair balance based on market valuation:{' '}
            <span className="text-white font-bold">{deltaCalc.cashAmount} EGP</span>
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-[#D4FF00] hover:bg-white text-[#08080A] font-display-zine font-black text-sm uppercase tracking-wide shadow-[3px_3px_0px_#fff] cursor-pointer transition-colors"
        >
          SEND CASH + TRADE PROPOSAL
        </button>
      </div>
    </div>
  );
};
