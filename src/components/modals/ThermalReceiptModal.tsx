import React, { useState } from 'react';
import { SwapOffer, BuyoutOrder } from '../../types/swap';
import { soundFX } from '../../hooks/useSoundFX';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer?: SwapOffer | null;
  buyoutOrder?: BuyoutOrder | null;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  offer,
  buyoutOrder,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  const isBuyout = !!buyoutOrder;
  const passCode = isBuyout
    ? buyoutOrder.securityPassCode
    : offer?.securityPassCode || 'SWAP-CAI-7740';
  const hubLoc = isBuyout
    ? buyoutOrder.pickupHub
    : offer?.hubLocation || 'SWAPZ Maadi Hub (Degla St 213)';
  const dateStr = isBuyout
    ? buyoutOrder.timestamp
    : offer?.scheduledTime || 'TODAY AT 6:30 PM';

  const handleCopyCode = () => {
    soundFX.playClick();
    navigator.clipboard?.writeText(passCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulatedPrint = () => {
    soundFX.playStamp();
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
      try {
        window.print();
      } catch {
        // Fallback for iframe restrictions
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-sm my-auto flex flex-col items-center">
        {/* Action Controls Bar */}
        <div className="w-full flex items-center justify-between pb-3 px-1 font-mono-zine text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#D4FF00] inline-block animate-pulse"></span>
            <span className="text-white font-bold uppercase tracking-wider text-[11px]">
              VERIFIED THERMAL RECEIPT
            </span>
          </div>
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="w-7 h-7 flex items-center justify-center border border-neutral-700 bg-neutral-900 text-white hover:border-[#D4FF00] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* The Brutalist Physical Thermal Paper Ticket */}
        <div
          id="thermal-receipt"
          className="relative w-full bg-[#f6f6f2] text-black font-mono-zine p-5 shadow-[0_25px_60px_rgba(0,0,0,0.95)] border-x-2 border-neutral-400 select-text"
          style={{
            filter: isPrinting ? 'contrast(130%)' : 'none',
          }}
        >
          {/* Jagged Perforated Zig-Zag Top Edge */}
          <div
            className="absolute -top-3 left-0 right-0 h-3 bg-repeat-x pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 10' width='16' height='10'%3E%3Cpolygon points='0,10 8,0 16,10' fill='%23f6f6f2'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Header Title */}
          <div className="flex flex-col items-center text-center border-b-2 border-black pb-3">
            <span className="font-display-zine font-black text-2xl tracking-tighter uppercase leading-none">
              SWAP // CAIRO
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest mt-1">
              PEER-TO-PEER STREETWEAR EXCHANGE
            </span>
            <span className="text-[8px] text-neutral-600 mt-0.5">
              TERMINAL ID: #CAI-MD-HUB-04 • EGYPT
            </span>
          </div>

          {/* Transaction Metadata */}
          <div className="py-2.5 border-b border-dashed border-black/80 flex flex-col gap-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-neutral-600">PASS CODE:</span>
              <span className="font-bold tracking-wider">{passCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">TIMESTAMP:</span>
              <span className="font-bold">{dateStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">HUB COUNTER:</span>
              <span className="font-bold truncate max-w-[200px] text-right">{hubLoc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">INSPECTOR:</span>
              <span className="font-bold">#AUTH-CHIEF-09 [PASSED]</span>
            </div>
          </div>

          {/* Item Breakdown */}
          <div className="py-3 border-b-2 border-black flex flex-col gap-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-neutral-700">
              {isBuyout ? 'PURCHASED PIECE' : 'EXCHANGED PIECES'}
            </span>

            {isBuyout && buyoutOrder ? (
              <div className="flex justify-between text-xs font-bold">
                <div className="flex flex-col">
                  <span className="uppercase">{buyoutOrder.garment.title}</span>
                  <span className="text-[9px] text-neutral-600 font-normal">
                    {buyoutOrder.garment.brand} • {buyoutOrder.garment.size} • COND {buyoutOrder.garment.condition}
                  </span>
                </div>
                <span className="font-black">{buyoutOrder.purchasePrice} EGP</span>
              </div>
            ) : offer ? (
              <>
                <div className="flex justify-between text-[11px] font-bold">
                  <div className="flex flex-col">
                    <span className="uppercase truncate max-w-[190px]">{offer.theirItem.title}</span>
                    <span className="text-[8px] text-neutral-600 font-normal">
                      PARTNER PIECE • {offer.theirItem.size} • EST. {offer.theirItem.value} EGP
                    </span>
                  </div>
                  <span>INCOMING</span>
                </div>

                <div className="flex justify-between text-[11px] font-bold">
                  <div className="flex flex-col">
                    <span className="uppercase truncate max-w-[190px]">{offer.yourItem.title}</span>
                    <span className="text-[8px] text-neutral-600 font-normal">
                      YOUR PIECE • {offer.yourItem.size} • EST. {offer.yourItem.value} EGP
                    </span>
                  </div>
                  <span>OUTGOING</span>
                </div>
              </>
            ) : null}
          </div>

          {/* Financial Settlement */}
          <div className="py-2.5 border-b border-dashed border-black/80 flex flex-col gap-1 text-[11px]">
            {isBuyout && buyoutOrder ? (
              <>
                <div className="flex justify-between">
                  <span className="text-neutral-600">SUBTOTAL:</span>
                  <span>{buyoutOrder.purchasePrice}.00 EGP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">INSPECTION FEE:</span>
                  <span>+{buyoutOrder.inspectionFee}.00 EGP</span>
                </div>
                <div className="flex justify-between font-black text-sm border-t border-black pt-1">
                  <span>TOTAL ESCROW:</span>
                  <span>{buyoutOrder.totalAmount}.00 EGP</span>
                </div>
              </>
            ) : offer ? (
              <div className="flex justify-between font-black text-sm">
                <span>CASH BALANCE DELTA:</span>
                <span className="text-black font-black">
                  +{offer.cashTopUp}.00 EGP ({offer.topUpBy === 'partner' ? 'FROM PARTNER' : 'FROM YOU'})
                </span>
              </div>
            ) : null}
          </div>

          {/* Physical Authentication Checklist */}
          <div className="py-2.5 border-b border-black flex flex-col gap-1 text-[8px] uppercase tracking-wider text-neutral-700">
            <span className="font-bold text-[9px] text-black">// PHYSICAL VAULT VERIFICATION:</span>
            <div className="flex items-center justify-between">
              <span>[OK] FABRIC WEAVE & GAUGE CHECKED</span>
              <span className="font-bold text-black">PASS</span>
            </div>
            <div className="flex items-center justify-between">
              <span>[OK] WASH TAG & SERIAL LOT AUDITED</span>
              <span className="font-bold text-black">PASS</span>
            </div>
            <div className="flex items-center justify-between">
              <span>[OK] ZIPPER HARDWARE & SEAM GRADE</span>
              <span className="font-bold text-black">PASS</span>
            </div>
            <div className="flex items-center justify-between">
              <span>[OK] TAMPER-PROOF SECURITY ZIP SEAL</span>
              <span className="font-bold text-black">APPLIED</span>
            </div>
          </div>

          {/* Ecological Impact */}
          <div className="py-2 flex items-center justify-between text-[9px] font-bold border-b border-dashed border-black/80">
            <span className="uppercase text-neutral-600">CARBON OFFSET:</span>
            <span className="px-1.5 py-0.5 bg-black text-white text-[8px] font-black">
              -{offer?.co2SavedKg || 4.8} KG CO2 AVOIDED
            </span>
          </div>

          {/* Barcode Strip */}
          <div className="pt-3 pb-1 flex flex-col items-center gap-1">
            <div
              className="w-full h-11 bg-repeat-x opacity-90"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, #000 0, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 7px, transparent 7px, transparent 9px, #000 9px, #000 13px, transparent 13px, transparent 15px)',
              }}
            />
            <span className="text-[9px] tracking-[0.3em] font-black uppercase">
              *{passCode}*
            </span>
            <span className="text-[7px] text-neutral-500 uppercase tracking-widest text-center mt-1">
              AUTHORIZED FOR COUNTER RELEASE AT ANY SWAPZ HUB
            </span>
          </div>

          {/* Jagged Perforated Zig-Zag Bottom Edge */}
          <div
            className="absolute -bottom-3 left-0 right-0 h-3 bg-repeat-x pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 10' width='16' height='10'%3E%3Cpolygon points='0,0 8,10 16,0' fill='%23f6f6f2'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Bottom Interactive Toolbar */}
        <div className="w-full flex items-center gap-2 mt-5 font-mono-zine text-xs">
          <button
            onClick={handleSimulatedPrint}
            className="flex-1 py-2.5 bg-[#D4FF00] hover:bg-white text-black font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#fff] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>PRINT THERMAL PASS</span>
          </button>

          <button
            onClick={handleCopyCode}
            className="px-3.5 py-2.5 bg-[#131317] border border-neutral-700 hover:border-[#D4FF00] text-white font-bold uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors"
            title="Copy verification code"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'COPIED' : 'CODE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
