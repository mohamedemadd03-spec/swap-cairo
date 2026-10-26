import React from 'react';
import { SwapOffer } from '../../types/swap';
import { soundFX } from '../../hooks/useSoundFX';

interface PassModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: SwapOffer;
  onOpenThermalReceipt?: (offer: SwapOffer) => void;
}

export const PassModal: React.FC<PassModalProps> = ({
  isOpen,
  onClose,
  offer,
  onOpenThermalReceipt,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0e12]/90 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-[#14161d] border border-[#d4ff00]/40 rounded-2xl p-5 flex flex-col gap-4 font-sans shadow-2xl relative">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#d4ff00] animate-pulse"></span>
            <span className="font-display font-extrabold text-sm uppercase text-white tracking-wider">
              Safe Hub Locker Pass
            </span>
          </div>
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            aria-label="Close pass"
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-white bg-[#1e2029] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* Big Locker Handover Code */}
        <div className="text-center py-3 bg-[#0d0e12] rounded-xl border border-[#232733] flex flex-col items-center">
          <span className="text-[10px] font-display uppercase tracking-widest text-neutral-400">
            Automated Smart Locker PIN
          </span>
          <span className="font-mono font-black text-2xl tracking-widest text-[#d4ff00] my-1">
            {offer.securityPassCode}
          </span>
          <span className="text-[9px] text-neutral-400 uppercase tracking-wider font-sans">
            Valid for contactless vault drop-off & pickup
          </span>
        </div>

        {/* Barcode Graphic */}
        <div className="w-full bg-white rounded-xl p-3 flex flex-col items-center gap-1 text-black">
          <div
            className="w-full h-10 bg-repeat-x"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, #000 0, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 7px, transparent 7px, transparent 9px, #000 9px, #000 13px, transparent 13px, transparent 15px)',
            }}
          />
          <span className="font-mono text-[9px] tracking-[0.25em] font-bold">
            *{offer.securityPassCode}*
          </span>
        </div>

        {/* Trade Metadata */}
        <div className="flex flex-col gap-1.5 text-xs text-neutral-300 border-t border-white/[0.06] pt-2 font-sans">
          <div className="flex justify-between">
            <span className="text-neutral-400">LOCATION:</span>
            <span className="font-display font-bold text-white text-right truncate max-w-[200px]">
              {offer.hubLocation}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">SCHEDULED:</span>
            <span className="font-display font-bold text-[#d4ff00]">{offer.scheduledTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">PARTNER:</span>
            <span className="font-display font-bold text-white">{offer.partner.handle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">CASH SETTLEMENT:</span>
            <span className="font-display font-bold text-[#d4ff00]">+{offer.cashTopUp} EGP</span>
          </div>
        </div>

        {/* Step-by-Step Handover Protocol */}
        <div className="p-3 bg-[#0d0e12] rounded-xl border border-white/[0.06] text-[11px] text-neutral-400 flex flex-col gap-1">
          <span className="text-[#d4ff00] font-display font-bold uppercase text-[10px]">
            // Handover Protocol
          </span>
          <span>1. Present pass or enter PIN at the hub smart locker terminal.</span>
          <span>2. Deposit item inside locker compartment and close securely.</span>
          <span>3. Partner inspects condition; escrow balance releases instantly.</span>
        </div>

        <div className="flex gap-2">
          {onOpenThermalReceipt && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenThermalReceipt(offer);
              }}
              className="flex-1 py-2.5 rounded-xl bg-[#1e2029] border border-[#d4ff00]/40 text-[#d4ff00] hover:bg-[#282a36] font-display font-bold text-xs uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">receipt_long</span>
              <span>Receipt</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[#d4ff00] hover:brightness-110 text-[#0d0e12] font-display font-black text-xs uppercase shadow-md cursor-pointer transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
