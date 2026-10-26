import React, { useState } from 'react';
import { Garment, BuyoutOrder } from '../../types/swap';
import { soundFX } from '../../hooks/useSoundFX';

interface BuyoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  garment: Garment;
  currentHubName: string;
  onConfirmPurchase: (order: BuyoutOrder) => void;
}

export const BuyoutModal: React.FC<BuyoutModalProps> = ({
  isOpen,
  onClose,
  garment,
  currentHubName,
  onConfirmPurchase,
}) => {
  const buyoutAmount = garment.buyoutPrice || Math.round(garment.estValue * 1.1);
  const [paymentMethod, setPaymentMethod] = useState<'cash_at_hub' | 'instapay' | 'vodafone_cash' | 'card_escrow'>('instapay');
  const [includeInspection, setIncludeInspection] = useState(true);
  const [completedOrder, setCompletedOrder] = useState<BuyoutOrder | null>(null);

  if (!isOpen) return null;

  const inspectionFee = includeInspection ? 35 : 0;
  const totalAmount = buyoutAmount + inspectionFee;

  const handleCheckout = () => {
    soundFX.playCash();
    soundFX.playStamp();
    const randomPin = String(Math.floor(100000 + Math.random() * 900000));
    const randomCode = `ESCROW-${garment.brand.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: BuyoutOrder = {
      id: `order-${Date.now()}`,
      garment,
      buyerHandle: '@youssef_fits',
      purchasePrice: buyoutAmount,
      currency: garment.currency,
      paymentMethod,
      inspectionRequested: includeInspection,
      inspectionFee,
      totalAmount,
      pickupHub: currentHubName || 'SWAPZ Maadi Hub (Degla St 213)',
      securityPassCode: randomCode,
      pickupPin: randomPin,
      status: 'confirmed_escrow',
      timestamp: 'Just now',
      estimatedReadyDate: 'Available for immediate pickup at verified hub',
    };

    setCompletedOrder(newOrder);
    onConfirmPurchase(newOrder);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-[#131317] border-2 border-[#D4FF00] p-5 flex flex-col gap-4 font-mono-zine shadow-[0_20px_60px_rgba(0,0,0,0.9)] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2A33] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#D4FF00] inline-block animate-pulse"></span>
            <span className="font-display-zine font-black text-lg uppercase text-white tracking-tight">
              {completedOrder ? 'ESCROW PICKUP PASS' : 'INSTANT BUYOUT // NO TRADE'}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close buyout modal"
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white border border-neutral-700 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* If Checkout is Completed: Show Pickup Pass */}
        {completedOrder ? (
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-[#08080A] border-2 border-[#D4FF00] relative overflow-hidden">
              {/* Confirmed Stamp */}
              <div className="absolute top-3 right-3 rotate-6 px-3 py-0.5 bg-[#D4FF00] text-[#08080A] font-black text-xs uppercase border border-black shadow-[2px_2px_0px_#fff]">
                PAID // SECURED
              </div>

              <div className="text-[10px] uppercase text-[#D4FF00] font-bold tracking-wider">
                BUYER ESCROW AUTH PASS
              </div>
              <h2 className="text-white font-black text-lg uppercase mt-1">
                {completedOrder.garment.title}
              </h2>
              <div className="text-xs text-neutral-400 mt-0.5">
                Seller: <span className="text-white font-bold">{completedOrder.garment.owner.handle}</span> • Size: {completedOrder.garment.size}
              </div>

              {/* Barcode & Security PIN Block */}
              <div className="my-4 p-3 bg-neutral-900 border border-neutral-700 flex flex-col items-center gap-2">
                <div className="barcode-lines w-48 h-10"></div>
                <span className="text-xs text-[#D4FF00] font-mono tracking-widest font-bold">
                  {completedOrder.securityPassCode}
                </span>
                <div className="mt-1 flex items-center gap-2 bg-black px-4 py-1.5 border border-[#D4FF00]/40">
                  <span className="text-[10px] text-neutral-400 uppercase">PICKUP PIN:</span>
                  <span className="text-base text-[#D4FF00] font-bold tracking-widest font-mono">
                    {completedOrder.pickupPin}
                  </span>
                </div>
              </div>

              {/* Hub Handover Specs */}
              <div className="flex flex-col gap-1.5 text-xs border-t border-neutral-800 pt-3">
                <div className="flex justify-between">
                  <span className="text-neutral-500 uppercase">PICKUP HUB:</span>
                  <span className="text-white font-bold">{completedOrder.pickupHub}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 uppercase">TOTAL PAID:</span>
                  <span className="text-[#D4FF00] font-bold">
                    {completedOrder.totalAmount} {completedOrder.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 uppercase">PAYMENT METHOD:</span>
                  <span className="text-white uppercase font-bold">{completedOrder.paymentMethod.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 uppercase">CO2 PRESERVED:</span>
                  <span className="text-emerald-400 font-bold">+3.4 kg virgin cotton footprint</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#131317] border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed">
              Show this barcode or PIN to the authentication desk specialist at <strong className="text-white">{completedOrder.pickupHub}</strong>. Your piece has been transferred to your acquired closet collection!
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-[#D4FF00] hover:bg-white text-[#08080A] font-display-zine font-black text-sm uppercase shadow-[3px_3px_0px_#fff] cursor-pointer transition-colors"
            >
              CLOSE & VIEW IN CLOSET
            </button>
          </div>
        ) : (
          /* Checkout Step */
          <div className="flex flex-col gap-4">
            {/* Garment Summary */}
            <div className="p-3 bg-[#08080A] border border-neutral-800 flex items-center gap-3">
              <img
                src={garment.imageUrl}
                alt={garment.title}
                className="w-16 h-16 object-cover border border-[#D4FF00] shrink-0"
              />
              <div className="flex flex-col truncate">
                <span className="text-[9px] uppercase text-[#D4FF00] font-bold">DIRECT PURCHASE TARGET</span>
                <span className="font-bold text-white text-sm truncate">{garment.title}</span>
                <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
                  <span>Seller: <strong className="text-white">{garment.owner.handle}</strong></span>
                  <span>•</span>
                  <span>Cond: {garment.condition}</span>
                </div>
              </div>
            </div>

            {/* Price Highlight */}
            <div className="p-3.5 bg-[#08080A] border-2 border-[#D4FF00]/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-neutral-400 font-bold block">BUYOUT PRICE</span>
                <span className="text-xs text-neutral-500">Zero trade barter required</span>
              </div>
              <div className="text-right">
                <span className="font-display-zine font-black text-2xl text-[#D4FF00]">
                  {buyoutAmount} {garment.currency}
                </span>
                <span className="text-[10px] text-neutral-400 block">approx ${(buyoutAmount / 48).toFixed(1)} USD</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase text-neutral-400 font-bold">
                // SELECT PAYMENT METHOD
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* 1. InstaPay */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('instapay')}
                  className={`p-2.5 border text-left flex flex-col gap-1 cursor-pointer transition-all ${
                    paymentMethod === 'instapay'
                      ? 'border-[#D4FF00] bg-[#D4FF00]/10 text-white'
                      : 'border-neutral-800 bg-[#08080A] text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-white">InstaPay</span>
                    <span className="material-symbols-outlined text-sm text-[#D4FF00]">account_balance</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Egypt instant bank rails</span>
                </button>

                {/* 2. Cash on Handover at Hub */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash_at_hub')}
                  className={`p-2.5 border text-left flex flex-col gap-1 cursor-pointer transition-all ${
                    paymentMethod === 'cash_at_hub'
                      ? 'border-[#D4FF00] bg-[#D4FF00]/10 text-white'
                      : 'border-neutral-800 bg-[#08080A] text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-white">Cash at Hub</span>
                    <span className="material-symbols-outlined text-sm text-[#D4FF00]">storefront</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Pay when you inspect in person</span>
                </button>

                {/* 3. Vodafone Cash */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('vodafone_cash')}
                  className={`p-2.5 border text-left flex flex-col gap-1 cursor-pointer transition-all ${
                    paymentMethod === 'vodafone_cash'
                      ? 'border-[#D4FF00] bg-[#D4FF00]/10 text-white'
                      : 'border-neutral-800 bg-[#08080A] text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-white">Vodafone Cash</span>
                    <span className="material-symbols-outlined text-sm text-[#D4FF00]">smartphone</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Instant mobile wallet transfer</span>
                </button>

                {/* 4. Escrow Card */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card_escrow')}
                  className={`p-2.5 border text-left flex flex-col gap-1 cursor-pointer transition-all ${
                    paymentMethod === 'card_escrow'
                      ? 'border-[#D4FF00] bg-[#D4FF00]/10 text-white'
                      : 'border-neutral-800 bg-[#08080A] text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-white">Escrow Card</span>
                    <span className="material-symbols-outlined text-sm text-[#D4FF00]">credit_card</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Funds held until verified</span>
                </button>
              </div>
            </div>

            {/* Hub Physical Authentication Addon */}
            <div
              onClick={() => setIncludeInspection(!includeInspection)}
              className="p-3 bg-[#08080A] border border-neutral-800 hover:border-neutral-600 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={includeInspection}
                  onChange={() => {}}
                  className="w-4 h-4 accent-[#D4FF00] cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs text-white font-bold">Hub Tag & Stitch Inspection</span>
                  <span className="text-[10px] text-neutral-400">
                    Physical verification by hub authenticator before release
                  </span>
                </div>
              </div>
              <span className="text-xs text-[#D4FF00] font-bold">+35 EGP</span>
            </div>

            {/* Total Summary */}
            <div className="border-t border-[#2A2A33] pt-3 flex flex-col gap-1 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Garment Buyout:</span>
                <span className="text-white">{buyoutAmount} {garment.currency}</span>
              </div>
              {includeInspection && (
                <div className="flex justify-between text-neutral-400">
                  <span>Physical Inspection Guarantee:</span>
                  <span className="text-white">+35 {garment.currency}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-400">
                <span>Pickup Location:</span>
                <span className="text-[#D4FF00]">{currentHubName || 'Maadi Hub'}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white border-t border-neutral-800 pt-2 mt-1">
                <span>TOTAL PAYABLE:</span>
                <span className="text-[#D4FF00] font-black font-display-zine text-lg">
                  {totalAmount} {garment.currency}
                </span>
              </div>
            </div>

            {/* Submit Action */}
            <button
              onClick={handleCheckout}
              className="w-full py-3 bg-[#D4FF00] hover:bg-white text-[#08080A] font-display-zine font-black text-sm uppercase shadow-[3px_3px_0px_#fff] cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px]"
            >
              CONFIRM PURCHASE & GENERATE PASS
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
