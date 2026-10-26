import React, { useState } from 'react';
import { SwapOffer, WardrobeItem } from '../types/swap';
import { soundFX, triggerHaptic } from '../hooks/useSoundFX';
import { BrutalistBurst } from './BrutalistBurst';
import { ItemDetailModal } from './modals/ItemDetailModal';
import { useLanguage } from '../i18n/LanguageContext';

interface MatchesViewProps {
  offers: SwapOffer[];
  userWardrobe?: WardrobeItem[];
  userTrustPoints?: number;
  onAcceptOffer: (offerId: string) => void;
  onDeclineOffer: (
    offerId: string,
    reason?: 'too_far' | 'condition_mismatch' | 'cant_agree' | 'partner_flaked' | 'other'
  ) => void;
  onUpdateOfferGpsPin?: (
    offerId: string,
    gpsPin: { lat: number; lng: number; label: string; distanceMeters?: number }
  ) => void;
  onCounterOffer?: (offerId: string, counterDetails: { cashTopUp?: number; requestedItemTitle?: string; note?: string }) => void;
  onMaybeOffer?: (offerId: string) => void;
  onStandFirm?: (offerId: string) => void;
  onAskQuestion?: (offerId: string, question: string) => void;
  onAnswerQuestion?: (offerId: string, answer: string) => void;
  onSweetenOffer?: (offerId: string, extraTeeTitle: string, cashExtra: number) => void;
  onEditOffer?: (offer: SwapOffer) => void;
  onMarkFinalOffer?: (offerId: string) => void;
  onSendMessage: (offerId: string, messageText: string) => void;
  onScanBarcodeSuccess: (offerId: string, fitCheckPhoto?: string) => void;
  onNavigateToVault?: () => void;
  onNavigateToDiscover?: () => void;
}

const CAIRO_GPS_HUBS: Array<{ name: string; lat: number; lng: number }> = [
  { name: 'Espresso Lab Degla Hub #04', lat: 29.9602, lng: 31.2764 },
  { name: 'Zamalek Hub (Brazil St 14)', lat: 30.0609, lng: 31.2197 },
  { name: 'New Cairo Waterway Station', lat: 30.0419, lng: 31.4758 },
  { name: 'Maadi Smart Lockers Pod #18', lat: 29.9585, lng: 31.2589 },
];

const COMMON_HUBS = CAIRO_GPS_HUBS.map((h) => h.name);

function computeDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  offers,
  userTrustPoints = 450,
  onAcceptOffer,
  onDeclineOffer,
  onUpdateOfferGpsPin,
  onMaybeOffer,
  onStandFirm,
  onSweetenOffer,
  onEditOffer,
  onSendMessage,
  onScanBarcodeSuccess,
  onNavigateToDiscover,
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'incoming' | 'sent'>('incoming');
  const [burstActive, setBurstActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [inspectItem, setInspectItem] = useState<any | null>(null);

  // Active chat view: null means scrolling the requests feed; string means inside focused quick chat
  const [activeChatOfferId, setActiveChatOfferId] = useState<string | null>(null);

  // Meeting location & Live GPS state per active trade
  const [selectedLocation, setSelectedLocation] = useState<string>(COMMON_HUBS[0]);
  const [isCancelDrawerOpen, setIsCancelDrawerOpen] = useState<boolean>(false);
  const [isPinningGps, setIsPinningGps] = useState<boolean>(false);
  const [userGpsCoords, setUserGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [postScanRated, setPostScanRated] = useState<'mint' | 'worn' | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  // Barcode scanner modal
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeTargetOffer, setBarcodeTargetOffer] = useState<SwapOffer | null>(null);
  const [qrTab, setQrTab] = useState<'my_qr' | 'scan_camera' | 'verified'>('my_qr');
  const [manualPinInput, setManualPinInput] = useState('');
  const [lockerUnlockToken, setLockerUnlockToken] = useState<string | null>(null);
  const qrVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const qrStreamRef = React.useRef<MediaStream | null>(null);

  const [fitCheckPhoto, setFitCheckPhoto] = useState<string | null>(null);
  const fitCheckFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Chat message input
  const [messageInput, setMessageInput] = useState('');

  const flashToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  };

  const incomingOffers = offers.filter((o) => o.direction !== 'sent');
  const sentOffers = offers.filter((o) => o.direction === 'sent');
  const currentFeedOffers = activeTab === 'incoming' ? incomingOffers : sentOffers;

  const activeChatOffer = offers.find((o) => o.id === activeChatOfferId);

  const handleQuickAccept = (offer: SwapOffer) => {
    triggerHaptic('trade');
    soundFX.playMatch();
    setBurstActive(true);
    onAcceptOffer(offer.id);
    flashToast(
      language === 'ar'
        ? '⚡ تم قبول الصفقة بنجاح! افتح الشات للتنسيق وكود المصافحة.'
        : `⚡ Deal Accepted! Traded piece removed from Discover feed. Tap 'Hop Into Chat' for locker PIN.`
    );
  };

  const handleQuickDecline = (
    offer: SwapOffer,
    reason?: 'too_far' | 'condition_mismatch' | 'cant_agree' | 'partner_flaked' | 'other'
  ) => {
    triggerHaptic('pass');
    soundFX.playClick();
    onDeclineOffer(offer.id, reason);
    setIsCancelDrawerOpen(false);
    flashToast(
      language === 'ar'
        ? 'تم رفض العرض وفك الحجز عن القطع في الدولاب.'
        : `Deal canceled & synced. Both pieces unlocked in closets.`
    );
  };

  const handlePinExactGpsLocation = () => {
    if (!activeChatOffer) return;
    soundFX.playProximityPing();
    setIsPinningGps(true);

    const finalizeGpsPin = (lat: number, lng: number) => {
      setUserGpsCoords({ lat, lng });
      // Find closest Cairo hub for context
      let closestHub = CAIRO_GPS_HUBS[0];
      let minKm = computeDistanceKm(lat, lng, closestHub.lat, closestHub.lng);
      for (const h of CAIRO_GPS_HUBS) {
        const d = computeDistanceKm(lat, lng, h.lat, h.lng);
        if (d < minKm) {
          minKm = d;
          closestHub = h;
        }
      }
      const spotLabel =
        minKm <= 1.5
          ? `${closestHub.name} (${Math.round(minKm * 1000)}m)`
          : `Live GPS Radar • ${closestHub.name.split(' ')[0]} (${minKm}km)`;
      setSelectedLocation(spotLabel);
      setIsPinningGps(false);

      if (onUpdateOfferGpsPin) {
        onUpdateOfferGpsPin(activeChatOffer.id, {
          lat,
          lng,
          label: spotLabel,
          distanceMeters: Math.round(minKm * 1000),
        });
      } else {
        handleSendChatMessage(
          `📍 Exact GPS Meetup Pin Shared: ${spotLabel} (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`
        );
      }
      flashToast(
        language === 'ar'
          ? '📍 تم مشاركة موقعك المباشر في الشات!'
          : `📍 Exact GPS Meetup Pin shared in chat!`
      );
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          finalizeGpsPin(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Fallback to Cairo Degla coordinates if user denies browser geolocation prompt
          finalizeGpsPin(29.9604, 31.2762);
        },
        { enableHighAccuracy: true, timeout: 4000 }
      );
    } else {
      finalizeGpsPin(29.9604, 31.2762);
    }
  };

  const handleQuickMaybe = (offer: SwapOffer) => {
    triggerHaptic('click');
    soundFX.playClick();
    if (onMaybeOffer) {
      onMaybeOffer(offer.id);
    }
    flashToast(t('nudgeToast'));
  };

  const handleOpenChat = (offer: SwapOffer) => {
    soundFX.playClick();
    setActiveChatOfferId(offer.id);
  };

  const handleSendChatMessage = (textToSend?: string) => {
    if (!activeChatOffer) return;
    const text = textToSend || messageInput.trim();
    if (!text) return;

    soundFX.playClick();
    onSendMessage(activeChatOffer.id, text);
    setMessageInput('');
  };

  const handleSelectLocation = (hub: string) => {
    soundFX.playClick();
    setSelectedLocation(hub);
    const hubInfo = CAIRO_GPS_HUBS.find((h) => h.name === hub) || CAIRO_GPS_HUBS[0];
    if (activeChatOffer && onUpdateOfferGpsPin) {
      onUpdateOfferGpsPin(activeChatOffer.id, {
        lat: hubInfo.lat,
        lng: hubInfo.lng,
        label: hub,
        distanceMeters: 120,
      });
    } else {
      handleSendChatMessage(`📍 Let's meet at ${hub} for the handover.`);
    }
    flashToast(`Meeting spot set to ${hub}`);
  };

  React.useEffect(() => {
    if (activeChatOfferId) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  }, [activeChatOfferId, activeChatOffer?.messages?.length]);

  const stopQrCamera = () => {
    if (qrStreamRef.current) {
      qrStreamRef.current.getTracks().forEach((t) => t.stop());
      qrStreamRef.current = null;
    }
  };

  React.useEffect(() => {
    if (!isBarcodeModalOpen || qrTab !== 'scan_camera') {
      stopQrCamera();
      return;
    }
    let cancelled = false;
    let detectorTimer: number | null = null;

    async function startQrCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false,
          });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          qrStreamRef.current = stream;
          if (qrVideoRef.current) {
            qrVideoRef.current.srcObject = stream;
            await qrVideoRef.current.play().catch(() => {});

            // Native BarcodeDetector auto-scan loop when available
            if ('BarcodeDetector' in window && barcodeTargetOffer) {
              try {
                // @ts-ignore
                const detector = new window.BarcodeDetector({
                  formats: ['qr_code', 'code_128'],
                });
                const detectFrame = async () => {
                  if (cancelled || !qrVideoRef.current) return;
                  try {
                    const codes = await detector.detect(qrVideoRef.current);
                    if (codes && codes.length > 0 && codes[0].rawValue) {
                      completeQrHandshake(barcodeTargetOffer);
                      return;
                    }
                  } catch {
                    // Continue scanning next frame
                  }
                  detectorTimer = window.setTimeout(detectFrame, 300);
                };
                detectFrame();
              } catch {
                // Fallback to tap-to-scan or PIN entry
              }
            }
          }
        }
      } catch {
        // Fallback to manual PIN entry cleanly
      }
    }
    startQrCamera();
    return () => {
      cancelled = true;
      if (detectorTimer) clearTimeout(detectorTimer);
      stopQrCamera();
    };
  }, [isBarcodeModalOpen, qrTab, barcodeTargetOffer]);

  const completeQrHandshake = async (offer: SwapOffer) => {
    stopQrCamera();
    soundFX.playMatch();
    soundFX.playCash();
    triggerHaptic('handshake');

    try {
      const res = await fetch('/api/lockers/verify-handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passCode: offer.securityPassCode || 'SWP-7740',
          lockerPodId: selectedLocation,
          userHandle: '@you',
          partnerHandle: `@${offer.partner.handle}`,
        }),
      });
      const data = await res.json();
      if (data?.unlockToken) {
        setLockerUnlockToken(data.unlockToken);
      }
    } catch {
      setLockerUnlockToken(`POD-OPEN-${Date.now().toString(36).toUpperCase()}`);
    }

    setQrTab('verified');
    onScanBarcodeSuccess(offer.id);
  };

  const handleFitCheckFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !barcodeTargetOffer) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setFitCheckPhoto(dataUrl);
        triggerHaptic('success');
        soundFX.playMatch();
        onScanBarcodeSuccess(barcodeTargetOffer.id, dataUrl);
        flashToast(language === 'ar' ? '📸 تم توثيق الفيت تشيك في الكارنيه!' : '📸 Fit Check stamped in your Passport!');
      }
    };
    reader.readAsDataURL(file);
  };

  const openScanner = (offer: SwapOffer) => {
    soundFX.playClick();
    setBarcodeTargetOffer(offer);
    setFitCheckPhoto(offer.fitCheckPhoto || null);
    setQrTab('my_qr');
    setManualPinInput(offer.securityPassCode || 'SWP-7740');
    setLockerUnlockToken(null);
    setIsBarcodeModalOpen(true);
  };

  // Convert offer items to full inspectable objects
  const makeInspectable = (item: any, owner?: any, isYourItem = false) => ({
    ...item,
    brand: item.brand || item.title?.split(' ')[0] || 'Vintage',
    condition: item.condition || (isYourItem ? '9.5 / 10 MINT' : '9.8 / 10 MINT'),
    value: item.value,
    estValue: item.value,
    description:
      item.description ||
      `Authentic ${item.title}. Heavyweight washed cotton fabric with original brand tags and double-needle stitching. Zero pinholes, stains, or cracking.`,
    city: owner?.location || (isYourItem ? 'Your Cairo Vault' : 'Maadi Hub'),
    owner: owner || { name: 'You', handle: '@you' },
  });

  return (
    <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-[#131315] max-w-md mx-auto">
      <BrutalistBurst active={burstActive} type="swap" onComplete={() => setBurstActive(false)} />

      {/* Clean Top Header Bar (Trust Pts removed from Deals as requested) */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between bg-[#0e0e10] border-b border-[#26262e]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#caf300] animate-pulse" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-white font-semibold">
            {activeChatOffer ? `${t('chatWith')}${activeChatOffer.partner.handle}` : t('dealsQueue')}
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#8f9378] uppercase flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px] text-[#caf300]">radar</span>
          <span>{t('autoSonar')}</span>
        </span>
      </div>

      {/* MODE 1: ULTRA-CLEAN 2-PART WHATSAPP-STYLE TRADE CHAT */}
      {activeChatOffer ? (
        <div className="px-3 pt-2 flex-1 flex flex-col gap-2 animate-in fade-in">
          {/* Unified Top Header + Compact Pinned Trade Strip (All in 1 clean card) */}
          <div className="rounded-2xl bg-[#1c1b1d] border border-[#26262e] overflow-hidden flex flex-col shadow-md">
            {/* Row 1: Partner Avatar, Handle & Primary Action */}
            <div className="p-2.5 flex items-center justify-between gap-2 border-b border-white/5">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setActiveChatOfferId(null);
                  }}
                  className="w-8 h-8 rounded-xl bg-[#131315] hover:bg-[#2a2a2c] text-[#caf300] flex items-center justify-center border border-white/10 cursor-pointer shrink-0"
                  title="Back to Deals"
                >
                  <span className="material-symbols-outlined text-[17px]">arrow_back</span>
                </button>
                <img
                  src={activeChatOffer.partner.avatarUrl}
                  alt={activeChatOffer.partner.name}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-[#caf300]/50 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs font-bold text-white truncate">
                      @{activeChatOffer.partner.handle}
                    </span>
                    <span className="font-mono text-[10px] text-[#caf300]">
                      {activeChatOffer.partner.rating}★
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-[#8f9378] block truncate">
                    {activeChatOffer.status === 'accepted'
                      ? `🔒 Locked (${Math.max(
                          1,
                          Math.ceil(
                            ((activeChatOffer.lockExpiresAt || Date.now() + 48 * 3600 * 1000) -
                              Date.now()) /
                              (3600 * 1000)
                          )
                        )}h left) • PIN ${activeChatOffer.securityPassCode || 'SWP-7740'}`
                      : activeChatOffer.status === 'completed'
                      ? '✓ Swap Completed'
                      : 'Negotiating Trade'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {activeChatOffer.status !== 'accepted' && activeChatOffer.status !== 'completed' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onEditOffer?.(activeChatOffer)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#131315] hover:bg-[#2a2a2c] text-[#c5c9ac] hover:text-white font-mono text-[10px] uppercase font-bold border border-white/10 cursor-pointer"
                    >
                      {t('edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAccept(activeChatOffer)}
                      className="px-3 py-1.5 rounded-xl bg-[#caf300] text-[#171e00] font-mono text-[10.5px] font-bold uppercase cursor-pointer shadow-sm flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      <span>{t('agree')}</span>
                    </button>
                  </>
                ) : (
                  <>
                    {activeChatOffer.status === 'accepted' && (
                      <button
                        type="button"
                        onClick={() => {
                          handleSendChatMessage(
                            `📍 I'm here at ${selectedLocation}! Opening Handshake now.`
                          );
                          openScanner(activeChatOffer);
                        }}
                        title="Notify partner you've arrived & open Handshake"
                        className="px-2 py-1.5 rounded-xl bg-[#131315] hover:bg-[#caf300]/15 text-[#caf300] font-mono text-[9.5px] uppercase font-bold border border-[#caf300]/40 cursor-pointer transition-colors"
                      >
                        {t('imHere')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        setIsCancelDrawerOpen(!isCancelDrawerOpen);
                      }}
                      title="Cancel deal and auto-return items to closets"
                      className={`px-2 py-1.5 rounded-xl font-mono text-[9.5px] uppercase font-bold border cursor-pointer transition-colors ${
                        isCancelDrawerOpen
                          ? 'bg-red-500/20 text-red-300 border-red-500/40'
                          : 'bg-[#131315] hover:bg-red-500/20 text-[#8f9378] hover:text-red-400 border-white/10'
                      }`}
                    >
                      {isCancelDrawerOpen ? 'Close' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openScanner(activeChatOffer)}
                      className="px-3 py-1.5 rounded-xl bg-[#caf300] text-[#171e00] font-mono text-[10px] font-bold uppercase cursor-pointer shadow-sm flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">handshake</span>
                      <span>{t('handshake')}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Row 2: Slim 1-Line Pinned Items Strip (Tap either item to inspect) */}
            <div className="px-2.5 py-2 bg-[#131315] flex items-center justify-between gap-2">
              <div
                onClick={() => {
                  soundFX.playClick();
                  setInspectItem(makeInspectable(activeChatOffer.theirItem, activeChatOffer.partner));
                }}
                className="flex items-center gap-2 min-w-0 cursor-pointer group flex-1"
              >
                <img
                  src={activeChatOffer.theirItem.imageUrl}
                  alt={activeChatOffer.theirItem.title}
                  className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
                />
                <div className="min-w-0">
                  <span className="font-sans text-[11px] text-white font-bold truncate block group-hover:text-[#caf300]">
                    {activeChatOffer.theirItem.title}
                  </span>
                  <span className="font-mono text-[9px] text-[#c5c9ac]">
                    {activeChatOffer.theirItem.size} • {activeOfferValue(activeChatOffer.theirItem)} EGP
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1 px-1 shrink-0">
                <span className="text-[#caf300] font-mono text-xs font-bold leading-none">⇄</span>
                {activeChatOffer.status !== 'accepted' && activeChatOffer.status !== 'completed' && onEditOffer && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFX.playClick();
                      triggerHaptic('light');
                      onEditOffer(activeChatOffer);
                    }}
                    className="px-2 py-0.5 rounded-md bg-[#caf300]/15 hover:bg-[#caf300]/25 text-[#caf300] border border-[#caf300]/40 font-mono text-[9px] font-bold uppercase transition-all cursor-pointer flex items-center gap-0.5 active:scale-95 shadow-xs"
                    title={language === 'ar' ? 'تعديل العرض' : 'Edit Offer'}
                  >
                    <span className="material-symbols-outlined text-[12px]">edit_note</span>
                    <span>{language === 'ar' ? 'تعديل' : language === 'fr' ? 'Modifier' : 'Edit'}</span>
                  </button>
                )}
              </div>

              <div
                onClick={() => {
                  soundFX.playClick();
                  setInspectItem(makeInspectable(activeChatOffer.yourItem, undefined, true));
                }}
                className="flex items-center gap-2 min-w-0 cursor-pointer group flex-1 text-right justify-end"
              >
                <div className="min-w-0">
                  <span className="font-sans text-[11px] text-white font-bold truncate block group-hover:text-[#caf300]">
                    {activeChatOffer.yourItem.title}
                  </span>
                  <span className="font-mono text-[9px] text-[#caf300] font-bold">
                    {activeChatOffer.yourItem.size} • {activeOfferValue(activeChatOffer.yourItem)} EGP
                    {activeChatOffer.cashTopUp > 0 ? ` (+${activeChatOffer.cashTopUp})` : ''}
                  </span>
                </div>
                <img
                  src={activeChatOffer.yourItem.imageUrl}
                  alt={activeChatOffer.yourItem.title}
                  className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
                />
              </div>
            </div>

            {/* Optional Cancel Reason Strip (Only visible when user taps Cancel) */}
            {isCancelDrawerOpen && (
              <div className="p-2.5 bg-[#18181a] border-t border-red-500/30 flex flex-col gap-1.5 animate-in fade-in">
                <span className="font-mono text-[9.5px] uppercase font-bold text-red-300">
                  Why cancel? (Both items immediately return to closets):
                </span>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[9.5px]">
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickDecline(activeChatOffer, 'too_far');
                      setActiveChatOfferId(null);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-[#131315] hover:bg-white/5 text-white border border-white/10 text-left cursor-pointer"
                  >
                    📍 Spot Too Far
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickDecline(activeChatOffer, 'cant_agree');
                      setActiveChatOfferId(null);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-[#131315] hover:bg-white/5 text-white border border-white/10 text-left cursor-pointer"
                  >
                    🤝 Can't Agree Details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickDecline(activeChatOffer, 'condition_mismatch');
                      setActiveChatOfferId(null);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-[#131315] hover:bg-red-500/15 text-red-300 border border-white/10 text-left cursor-pointer"
                  >
                    🛡️ Item Worn / Mismatch
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickDecline(activeChatOffer, 'partner_flaked');
                      setActiveChatOfferId(null);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-[#131315] hover:bg-red-500/15 text-red-300 border border-white/10 text-left cursor-pointer"
                  >
                    ⏱️ Partner Backed Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Full-Height Conversation Stream with Custom SWAP Brutalist GPS Radar Cards */}
          <div className="h-[calc(100dvh-252px)] min-h-[280px] rounded-2xl bg-[#1c1b1d] border border-[#26262e] overflow-hidden flex flex-col shadow-lg">
            <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-y-auto">
              {(activeChatOffer.messages && activeChatOffer.messages.length > 0
                ? activeChatOffer.messages
                : [
                    {
                      id: 'm1',
                      sender: 'them' as const,
                      text: `Hey! Interested in swapping for my ${activeChatOffer.theirItem.title}. Tap the 📍 GPS button below to drop a live meetup radar pin!`,
                      timestamp: '10m ago',
                    },
                  ]
              ).map((msg) => {
                const isYou = msg.sender === 'you';
                const isLocationPin = Boolean(msg.gpsPin || msg.text.includes('📍'));
                const pinLat = msg.gpsPin?.lat || userGpsCoords?.lat || 29.9602;
                const pinLng = msg.gpsPin?.lng || userGpsCoords?.lng || 31.2764;
                const pinLabel =
                  msg.gpsPin?.label ||
                  activeChatOffer.gpsMeetupPin?.label ||
                  selectedLocation;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[88%] ${
                      isYou ? 'self-end items-end' : 'self-start items-start'
                    }`}
                  >
                    {isLocationPin ? (
                      /* Custom SWAP Brutalist Live GPS Radar Card (Better than WhatsApp Live Location) */
                      <div className="w-64 rounded-2xl bg-[#111215] border-2 border-[#caf300]/70 overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.6)] flex flex-col">
                        {/* Visual Tactical Radar Grid Canvas */}
                        <div
                          className="relative h-28 w-full bg-[#0b0c0e] overflow-hidden flex items-center justify-center"
                          style={{
                            backgroundImage:
                              'radial-gradient(circle, rgba(202,243,0,0.16) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
                            backgroundSize: '18px 18px',
                          }}
                        >
                          {/* Radar Concentric Rings */}
                          <div className="w-24 h-24 rounded-full border border-[#caf300]/20 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full border border-[#caf300]/40 bg-[#caf300]/5 flex items-center justify-center relative">
                              <span className="w-3 h-3 rounded-full bg-[#caf300] animate-ping absolute" />
                              <span className="w-2.5 h-2.5 rounded-full bg-[#caf300] relative z-10 shadow-[0_0_10px_#caf300]" />
                            </div>
                          </div>

                          {/* Top-Left Live Telemetry Tag */}
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 border border-[#caf300]/40 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#caf300] animate-pulse" />
                            <span className="font-mono text-[8.5px] text-[#caf300] font-bold uppercase">
                              SWAP GPS RADAR
                            </span>
                          </div>

                          {/* Bottom-Right Coordinates */}
                          <span className="absolute bottom-1.5 right-2 font-mono text-[8px] text-[#c5c9ac] bg-black/70 px-1.5 py-0.5 rounded">
                            {pinLat.toFixed(4)}°N, {pinLng.toFixed(4)}°E
                          </span>
                        </div>

                        {/* Radar Footer Details & 1-Tap Navigation */}
                        <div className="p-2.5 bg-[#16171b] flex flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-display text-xs font-bold text-white truncate">
                              {pinLabel}
                            </span>
                            <span className="font-mono text-[8.5px] text-[#caf300] shrink-0 font-bold">
                              LIVE PIN
                            </span>
                          </div>
                          <p className="font-mono text-[9.5px] text-[#8f9378] leading-snug">
                            Auto 100m proximity sonar active when you approach this spot.
                          </p>
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${pinLat},${pinLng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="py-1.5 rounded-lg bg-[#caf300] text-[#171e00] font-mono text-[9.5px] font-bold uppercase text-center hover:brightness-110 flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[12px]">near_me</span>
                              <span>Navigate ↗</span>
                            </a>
                            <button
                              type="button"
                              onClick={handlePinExactGpsLocation}
                              className="py-1.5 rounded-lg bg-[#201f21] hover:bg-[#2a2a2c] text-white font-mono text-[9.5px] font-bold uppercase border border-white/10 cursor-pointer flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[12px] text-[#caf300]">
                                my_location
                              </span>
                              <span>Share Mine</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-xs font-sans leading-relaxed ${
                          isYou
                            ? 'bg-[#caf300] text-[#171e00] font-medium rounded-br-xs'
                            : 'bg-[#252429] text-white rounded-bl-xs border border-white/10'
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}
                    <span className="text-[9px] font-mono text-[#8f9378] mt-0.5 px-1">
                      {isYou ? 'You' : `@${activeChatOffer.partner.handle}`} • {msg.timestamp}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* 100% Visible 3-Column Quick Coordination Bar (No hidden horizontal scroll) */}
            <div className="px-2.5 py-1.5 bg-[#18181a] border-t border-white/5 grid grid-cols-3 gap-1.5">
              {[
                { label: t('shareGps'), action: handlePinExactGpsLocation, highlight: true },
                {
                  label: t('deglaHub'),
                  action: () => handleSelectLocation('Espresso Lab Degla Hub #04'),
                },
                {
                  label: t('meet6pm'),
                  action: () => handleSendChatMessage('Can we meet today around 6 PM? 🕕'),
                },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={chip.action}
                  className={`py-1.5 px-1.5 rounded-lg font-mono text-[9.5px] text-center truncate border cursor-pointer transition-colors ${
                    chip.highlight
                      ? 'bg-[#caf300]/15 text-[#caf300] border-[#caf300]/40 font-bold'
                      : 'bg-[#201f21] hover:bg-[#2a2a2c] text-[#c5c9ac] hover:text-white border-white/5'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* WhatsApp-Style Message Input Bar with Integrated Live GPS Share Button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage();
              }}
              className="p-2 bg-[#131315] border-t border-white/5 flex items-center gap-1.5"
            >
              <button
                type="button"
                onClick={handlePinExactGpsLocation}
                disabled={isPinningGps}
                title="Share Live SWAP GPS Radar Card in chat"
                className="w-10 h-10 rounded-xl bg-[#201f21] hover:bg-[#2a2a2c] text-[#caf300] border border-[#caf300]/40 flex items-center justify-center cursor-pointer shrink-0 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[19px]">
                  {isPinningGps ? 'sync' : 'my_location'}
                </span>
              </button>
              {activeChatOffer.status !== 'accepted' && activeChatOffer.status !== 'completed' && onEditOffer && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    triggerHaptic('light');
                    onEditOffer(activeChatOffer);
                  }}
                  title={language === 'ar' ? 'تعديل العرض' : language === 'fr' ? 'Modifier l’offre' : 'Edit Offer'}
                  className="h-10 px-2.5 rounded-xl bg-[#201f21] hover:bg-[#2a2a2c] text-[#caf300] border border-[#caf300]/40 flex items-center justify-center gap-1 cursor-pointer shrink-0 transition-all active:scale-95 font-mono text-[10.5px] font-bold uppercase shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  <span>{language === 'ar' ? 'تعديل' : language === 'fr' ? 'Modifier' : 'Edit'}</span>
                </button>
              )}
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Message @${activeChatOffer.partner.handle}...`}
                className="flex-1 bg-[#201f21] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#8f9378] focus:outline-none focus:border-[#caf300]"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="w-10 h-10 rounded-xl bg-[#caf300] text-[#171e00] flex items-center justify-center disabled:opacity-40 cursor-pointer hover:brightness-110 transition-all shrink-0 font-bold"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* MODE 2: FLUID FEED OF REQUESTS (Scrollable, casual, polite, zero-awkwardness) */
        <div className="px-4 flex-1 flex flex-col gap-3">
          {/* Tab Switcher: Incoming vs Sent */}
          <div className="mt-2.5 grid grid-cols-2 p-1 rounded-xl bg-[#201f21] border border-white/5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                soundFX.playClick();
                setActiveTab('incoming');
              }}
              className={`py-1.5 rounded-lg font-mono text-[11px] uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'incoming'
                  ? 'bg-[#caf300] text-[#171e00] shadow-sm'
                  : 'text-[#c5c9ac] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">call_received</span>
              <span>{t('incomingTab')} ({incomingOffers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                soundFX.playClick();
                setActiveTab('sent');
              }}
              className={`py-1.5 rounded-lg font-mono text-[11px] uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'sent'
                  ? 'bg-[#caf300] text-[#171e00] shadow-sm'
                  : 'text-[#c5c9ac] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">call_made</span>
              <span>{t('sentTab')} ({sentOffers.length})</span>
            </button>
          </div>

          {/* Social Friction Shield Subtitle */}
          <div className="flex items-center justify-between text-[10px] font-mono text-[#8f9378] px-1">
            <span>{t('scrollableQueue')}</span>
            <span>{t('zeroAwkwardness')}</span>
          </div>

          {/* Feed List */}
          {currentFeedOffers.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-[#201f21] border border-white/10 flex items-center justify-center text-[#caf300] mb-3">
                <span className="material-symbols-outlined text-2xl">checkroom</span>
              </div>
              <h3 className="font-display text-sm font-bold text-white uppercase tracking-tight">
                {t('noRequestsInQueue')}
              </h3>
              <p className="font-sans text-xs text-[#c5c9ac] mt-1 max-w-xs">
                Browse nearby items in Discover and propose a swap.
              </p>
              <button
                type="button"
                onClick={onNavigateToDiscover}
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#caf300] text-[#171e00] font-mono text-xs font-bold uppercase cursor-pointer"
              >
                {t('browseDiscover')}
              </button>
            </div>
          ) : (
            currentFeedOffers.map((offer) => {
              const isAccepted = offer.status === 'accepted' || offer.status === 'completed';
              const isMaybe = offer.status === 'maybe';
              const isDeclined = offer.status === 'declined';

              return (
                <div
                  key={offer.id}
                  className={`rounded-2xl p-4 border transition-all ${
                    isAccepted
                      ? 'bg-[#1c1b1d] border-[#caf300]/60 shadow-[0_0_20px_rgba(202,243,0,0.1)]'
                      : isMaybe
                      ? 'bg-[#18181a] border-[#caf300]/40'
                      : 'bg-[#201f21] border-[#26262e]'
                  }`}
                >
                  {/* Card Header: Partner Handle & Status */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={offer.partner.avatarUrl}
                        alt={offer.partner.name}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-[#caf300]/50"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-white truncate">
                            {offer.partner.name}
                          </span>
                          <span className="font-mono text-[10px] text-[#caf300]">
                            ({offer.partner.rating}★)
                          </span>
                        </div>
                        <span className="font-mono text-[9.5px] text-[#c5c9ac] block truncate">
                          {offer.partner.handle} • {offer.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-1">
                      {offer.isStandingFirm && (
                        <span className="px-2 py-0.5 rounded-full bg-[#caf300]/20 text-[#caf300] font-mono text-[9.5px] uppercase font-bold border border-[#caf300]/40 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">shield</span>
                          {t('stoodFirm')}
                        </span>
                      )}
                      {isAccepted && (
                        <span className="px-2 py-0.5 rounded-full bg-[#caf300]/20 text-[#caf300] font-mono text-[9.5px] uppercase font-bold border border-[#caf300]/40 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">check_circle</span>
                          {t('statusAgreed')}
                        </span>
                      )}
                      {isMaybe && !offer.isStandingFirm && (
                        <span className="px-2 py-0.5 rounded-full bg-[#caf300]/15 text-[#caf300] font-mono text-[9.5px] uppercase font-bold border border-[#caf300]/30 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">psychology</span>
                          {offer.direction === 'sent' ? t('partnerThinking') : t('nudged')}
                        </span>
                      )}
                      {isDeclined && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 font-mono text-[9.5px] uppercase font-bold border border-red-500/30">
                          {t('statusPassed')}
                        </span>
                      )}
                      {!isAccepted && !isMaybe && !isDeclined && !offer.isStandingFirm && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-mono text-[9.5px] uppercase font-bold border border-blue-500/30">
                          {offer.direction === 'sent' ? t('statusAwaitingPartner') : t('statusNewOffer')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Side-by-Side Garments (The One Who Receives ⇄ The One Who Gives) */}
                  <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-[#131315] border border-white/5">
                    {/* Left: What you receive */}
                    <div
                      onClick={() => {
                        soundFX.playClick();
                        setInspectItem(makeInspectable(offer.theirItem, offer.partner));
                      }}
                      className="flex flex-col gap-1 cursor-pointer group"
                    >
                      <span className="font-mono text-[9px] text-[#caf300] uppercase font-bold flex items-center justify-between">
                        <span>{t('youReceive')}</span>
                        <span className="text-[8px] text-[#c5c9ac] underline">{t('inspect')}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <img
                          src={offer.theirItem.imageUrl}
                          alt={offer.theirItem.title}
                          className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform"
                        />
                        <div className="min-w-0">
                          <h4 className="font-sans text-xs font-bold text-white truncate group-hover:text-[#caf300]">
                            {offer.theirItem.title}
                          </h4>
                          <span className="font-mono text-[9.5px] text-[#c5c9ac] block">
                            Size {offer.theirItem.size}
                          </span>
                          <span className="font-mono text-[10px] text-[#caf300] font-semibold">
                            {activeOfferValue(offer.theirItem)} EGP
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: What you give */}
                    <div
                      onClick={() => {
                        soundFX.playClick();
                        setInspectItem(makeInspectable(offer.yourItem, undefined, true));
                      }}
                      className="flex flex-col gap-1 border-l border-white/10 pl-2 cursor-pointer group"
                    >
                      <span className="font-mono text-[9px] text-[#c5c9ac] uppercase font-bold flex items-center justify-between">
                        <span>{t('youGive')}</span>
                        <span className="text-[8px] text-[#c5c9ac] underline">{t('inspect')}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <img
                          src={offer.yourItem.imageUrl}
                          alt={offer.yourItem.title}
                          className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform"
                        />
                        <div className="min-w-0">
                          <h4 className="font-sans text-xs font-bold text-white truncate group-hover:text-[#caf300]">
                            {offer.yourItem.title}
                          </h4>
                          <span className="font-mono text-[9.5px] text-[#c5c9ac] block">
                            Size {offer.yourItem.size}
                          </span>
                          <span className="font-mono text-[10px] text-[#caf300] font-semibold">
                            {activeOfferValue(offer.yourItem)} EGP
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cash Top-Up Note if applicable */}
                  {offer.cashTopUp > 0 && (
                    <div className="mt-2 px-2.5 py-1 rounded-lg bg-[#18181a] border border-white/5 flex items-center justify-between font-mono text-[10px]">
                      <span className="text-[#c5c9ac]">{t('cashSweetener')}</span>
                      <span className="text-[#caf300] font-bold">+{offer.cashTopUp} EGP</span>
                    </div>
                  )}

                  {/* Bundled Extra Items Note if sweetened */}
                  {offer.extraItemsOffered && offer.extraItemsOffered.length > 0 && (
                    <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-[#18181a] border border-[#caf300]/20 flex items-center justify-between font-mono text-[10px]">
                      <span className="text-[#caf300] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">layers</span>
                        {t('sweetenedBundle')}
                      </span>
                      <span className="text-white font-bold truncate max-w-[200px]">
                        +{offer.extraItemsOffered.map((it) => it.title.split(' ')[0]).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Stood Firm Banner Indicator */}
                  {offer.isStandingFirm && (
                    <div className="mt-2 px-3 py-2 rounded-xl bg-[#18181a] border border-[#caf300]/40 flex items-center justify-between font-mono text-[10.5px] animate-in fade-in">
                      <span className="text-[#caf300] font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px]">shield</span>
                        {t('stoodFirmNotice')}
                      </span>
                      <span className="text-[#c5c9ac] text-[9.5px]">{t('readyToAcceptOrDecline')}</span>
                    </div>
                  )}

                  {/* Clean 1-Line Nudged Status Bar */}
                  {isMaybe && !isAccepted && !isDeclined && (
                    <div className="mt-2.5 px-3 py-2 rounded-xl bg-[#18181a] border border-[#caf300]/30 flex items-center justify-between font-mono text-[11px] animate-in fade-in">
                      <span className="text-[#caf300] font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#caf300] animate-pulse" />
                        {t('nudgedStatus')}
                      </span>
                      <button
                        type="button"
                        onClick={() => onEditOffer?.(offer)}
                        className="text-white hover:text-[#caf300] text-[10.5px] font-bold underline cursor-pointer"
                      >
                        {t('editOffer')}
                      </button>
                    </div>
                  )}

                  {/* Fast Action Suite (Feed Level) */}
                  {!isAccepted && !isDeclined && offer.direction !== 'sent' && (
                    <div className="mt-3 flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        {/* 1. Agree */}
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('trade');
                            handleQuickAccept(offer);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-[#caf300] text-[#171e00] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-md shadow-[#caf300]/20"
                        >
                          <span className="material-symbols-outlined text-[15px]">check_circle</span>
                          <span>{t('agree')}</span>
                        </button>

                        {/* 2. Nudge (1-tap directly without options) */}
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('nudge');
                            handleQuickMaybe(offer);
                          }}
                          className={`px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase flex items-center justify-center gap-1 border transition-colors cursor-pointer ${
                            isMaybe
                              ? 'bg-[#caf300]/20 text-[#caf300] border-[#caf300]/40'
                              : 'bg-[#201f21] hover:bg-[#2a2a2c] text-[#c5c9ac] hover:text-[#caf300] border-white/10'
                          }`}
                          title="1-tap: Signal partner that you're hesitating/waiting"
                        >
                          <span className="material-symbols-outlined text-[15px] text-[#caf300]">
                            front_hand
                          </span>
                          <span>{isMaybe ? t('nudged') : t('nudge')}</span>
                        </button>

                        {/* 3. Edit Counter-Offer */}
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            onEditOffer?.(offer);
                          }}
                          className="px-3 py-2.5 rounded-xl bg-[#201f21] hover:bg-[#2a2a2c] text-white hover:text-[#caf300] font-mono text-xs font-bold uppercase flex items-center justify-center gap-1 border border-white/10 transition-colors cursor-pointer"
                          title="Counter-select which closet piece to give"
                        >
                          <span className="material-symbols-outlined text-[15px] text-[#caf300]">
                            edit_note
                          </span>
                          <span>{t('edit')}</span>
                        </button>

                        {/* 4. Refuse (X icon only) */}
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('warning');
                            handleQuickDecline(offer);
                          }}
                          className="w-10 h-10 rounded-xl bg-[#201f21] hover:bg-red-500/20 text-[#c5c9ac] hover:text-red-400 flex items-center justify-center border border-white/5 transition-colors cursor-pointer shrink-0"
                          title={t('refuse')}
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>

                        {/* 5. Chat */}
                        <button
                          type="button"
                          onClick={() => handleOpenChat(offer)}
                          className="w-10 h-10 rounded-xl bg-[#201f21] hover:bg-[#2a2a2c] text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer shrink-0"
                          title="Ask questions or coordinate location in chat"
                        >
                          <span className="material-symbols-outlined text-[16px] text-[#caf300]">chat</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[9.5px] font-mono text-[#8f9378] px-1">
                        <span>{t('tapNudgeHint')}</span>
                        <span>{t('instantOneTap')}</span>
                      </div>
                    </div>
                  )}

                  {/* Sent Offers Action Suite (Including Edit / Sweeten when partner holds) */}
                  {!isAccepted && !isDeclined && offer.direction === 'sent' && (
                    <div className="mt-3 flex flex-col gap-2">
                      {isMaybe ? (
                        <div className="p-3 rounded-xl bg-[#18181a] border border-[#caf300]/40 flex flex-col gap-2 animate-in fade-in">
                          <div className="flex items-center justify-between font-mono text-[10.5px]">
                            <span className="text-[#caf300] font-bold uppercase flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#caf300] animate-pulse" />
                              {t('partnerNudgedNotice')}
                            </span>
                            <span className="text-[#c5c9ac] text-[10px]">
                              {t('waitingOnYou')}
                            </span>
                          </div>
                          <p className="font-sans text-[11px] text-[#e5e1e4] leading-relaxed">
                            {t('sweetenOfferHint', { handle: offer.partner.handle })}
                          </p>
                          <div className="flex items-center gap-1.5 pt-1">
                            {/* Main Reply Button: هاا */}
                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playClick();
                                triggerHaptic('light');
                                onSendMessage?.(offer.id, language === 'ar' ? 'هاا؟' : 'Hmmm?');
                                flashToast(t('haaToast'));
                              }}
                              className="flex-1 py-2.5 rounded-xl bg-[#caf300] text-[#171e00] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-[#caf300]/20 transition-all active:scale-98"
                              title={t('haaBtn')}
                            >
                              <span>{t('haaBtn')}</span>
                            </button>

                            {/* Stand Firm */}
                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playClick();
                                onStandFirm?.(offer.id);
                                flashToast(t('stoodFirmToast'));
                              }}
                              className="px-2.5 py-2.5 rounded-xl bg-[#201f21] hover:bg-[#2a2a2c] text-[#caf300] font-mono text-xs font-bold uppercase border border-[#caf300]/30 flex items-center gap-1 cursor-pointer"
                              title="Stand firm: Original proposal stands"
                            >
                              <span className="material-symbols-outlined text-[14px]">shield</span>
                              <span>{t('standFirmBtn')}</span>
                            </button>

                            {/* +50 Cash */}
                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playCash();
                                onSweetenOffer?.(offer.id, '', 50);
                                flashToast(t('sweetenCashToast'));
                              }}
                              className="px-2.5 py-2.5 rounded-xl bg-[#201f21] hover:bg-[#2a2a2c] text-[#caf300] font-mono text-xs font-bold uppercase border border-[#caf300]/30 cursor-pointer"
                            >
                              {t('sweetenCashBtn')}
                            </button>

                            {/* Swap Piece */}
                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playClick();
                                onEditOffer?.(offer);
                              }}
                              className="w-10 h-10 rounded-xl bg-[#201f21] hover:bg-[#2a2a2c] text-[#caf300] font-mono text-xs font-bold uppercase flex items-center justify-center border border-white/10 cursor-pointer shrink-0"
                              title={t('editSweetenBtn')}
                            >
                              <span className="material-symbols-outlined text-[16px]">edit_note</span>
                            </button>

                            {/* Chat */}
                            <button
                              type="button"
                              onClick={() => handleOpenChat(offer)}
                              className="w-10 h-10 rounded-xl bg-[#201f21] hover:bg-[#2a2a2c] text-[#8f9378] hover:text-white font-mono text-xs font-bold uppercase flex items-center justify-center border border-white/10 cursor-pointer shrink-0"
                              title={t('chat')}
                            >
                              <span className="material-symbols-outlined text-[16px]">chat</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              soundFX.playClick();
                              onEditOffer?.(offer);
                            }}
                            className="flex-1 py-2 rounded-xl bg-[#201f21] hover:bg-[#2a2a2c] text-[#caf300] hover:text-white font-mono text-xs font-bold uppercase flex items-center justify-center gap-1.5 border border-[#caf300]/30 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">edit</span>
                            <span>{t('editOffer')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenChat(offer)}
                            className="px-3.5 py-2 rounded-xl bg-[#201f21] hover:bg-[#2a2a2c] text-[#8f9378] hover:text-white font-mono text-xs font-bold uppercase flex items-center justify-center gap-1 border border-white/10 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">chat</span>
                            <span>{t('chat')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickDecline(offer)}
                            className="px-3 py-2 rounded-xl bg-[#131315] hover:bg-red-500/20 text-[#8f9378] hover:text-red-400 font-mono text-xs uppercase border border-white/5 cursor-pointer"
                            title="Withdraw offer"
                          >
                            {t('withdrawOffer')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* If deal is already accepted */}
                  {isAccepted && (
                    <div className="mt-3 p-2.5 rounded-xl bg-[#131315] border border-[#caf300]/40 flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="font-mono text-[9px] uppercase text-[#caf300] font-bold block">
                          AGREEMENT REACHED
                        </span>
                        <span className="font-mono text-[10px] text-white">
                          PIN: <strong className="text-[#caf300]">{offer.securityPassCode || 'SWAP-CAI-7740'}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenChat(offer)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#201f21] hover:bg-[#2a2a2c] text-white font-mono text-[10px] uppercase font-bold border border-white/10 cursor-pointer"
                        >
                          {t('openChat')}
                        </button>
                        <button
                          type="button"
                          onClick={() => openScanner(offer)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#caf300] text-[#171e00] font-mono text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[13px]">handshake</span>
                          <span>{t('handshake')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL: FULL 4K GARMENT DETAILS (View piece in entirety) */}
      <ItemDetailModal
        isOpen={!!inspectItem}
        onClose={() => setInspectItem(null)}
        item={inspectItem}
      />

      {/* MODAL: OPTIMIZED IN-PERSON HANDSHAKE (THE ONE WHO GIVES vs THE ONE WHO RECEIVES) */}
      {isBarcodeModalOpen && barcodeTargetOffer && (
        <div className="fixed inset-0 z-50 bg-[#131315]/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-[#201f21] border-2 border-[#caf300]/70 rounded-3xl p-4 shadow-[0_24px_60px_rgba(0,0,0,0.9)] flex flex-col items-center text-center relative">
            <button
              type="button"
              onClick={() => {
                stopQrCamera();
                setIsBarcodeModalOpen(false);
              }}
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-[#131315] border border-white/10 flex items-center justify-center text-[#c6c6c7] hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-1.5 mb-3">
              <span className="material-symbols-outlined text-[#caf300] text-[19px]">handshake</span>
              <span className="font-display font-bold text-sm uppercase tracking-wider text-white">
                {t('handshake')}
              </span>
            </div>

            {/* Unified Smart Role Cards: Tap "The One Who Gives" (QR) or "The One Who Receives" (Camera) */}
            {qrTab !== 'verified' && (
              <div className="w-full grid grid-cols-2 gap-2 mb-3.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    soundFX.playClick();
                    setQrTab('my_qr');
                  }}
                  className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                    qrTab === 'my_qr'
                      ? 'bg-[#caf300] text-[#171e00] border-[#caf300] shadow-[0_0_18px_rgba(202,243,0,0.25)]'
                      : 'bg-[#131315] text-white border-white/10 hover:border-white/25'
                  }`}
                >
                  <img
                    src={barcodeTargetOffer.yourItem.imageUrl}
                    alt={barcodeTargetOffer.yourItem.title}
                    className="w-9 h-9 rounded-xl object-cover shrink-0 border border-black/20"
                  />
                  <div className="min-w-0 flex-1">
                    <span
                      className={`font-mono text-[8.5px] uppercase font-bold block leading-tight ${
                        qrTab === 'my_qr' ? 'text-[#171e00]' : 'text-[#caf300]'
                      }`}
                    >
                      {t('giverRole')}
                    </span>
                    <span
                      className={`font-sans text-[10.5px] font-bold truncate block ${
                        qrTab === 'my_qr' ? 'text-[#171e00]' : 'text-white'
                      }`}
                    >
                      {barcodeTargetOffer.yourItem.title}
                    </span>
                    <span
                      className={`font-mono text-[8px] uppercase block ${
                        qrTab === 'my_qr' ? 'text-[#171e00]/80 font-bold' : 'text-[#8f9378]'
                      }`}
                    >
                      {t('giverSub')}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    soundFX.playClick();
                    setQrTab('scan_camera');
                  }}
                  className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                    qrTab === 'scan_camera'
                      ? 'bg-[#caf300] text-[#171e00] border-[#caf300] shadow-[0_0_18px_rgba(202,243,0,0.25)]'
                      : 'bg-[#131315] text-white border-white/10 hover:border-white/25'
                  }`}
                >
                  <img
                    src={barcodeTargetOffer.theirItem.imageUrl}
                    alt={barcodeTargetOffer.theirItem.title}
                    className="w-9 h-9 rounded-xl object-cover shrink-0 border border-black/20"
                  />
                  <div className="min-w-0 flex-1">
                    <span
                      className={`font-mono text-[8.5px] uppercase font-bold block leading-tight ${
                        qrTab === 'scan_camera' ? 'text-[#171e00]' : 'text-[#caf300]'
                      }`}
                    >
                      {t('receiverRole')}
                    </span>
                    <span
                      className={`font-sans text-[10.5px] font-bold truncate block ${
                        qrTab === 'scan_camera' ? 'text-[#171e00]' : 'text-white'
                      }`}
                    >
                      {barcodeTargetOffer.theirItem.title}
                    </span>
                    <span
                      className={`font-mono text-[8px] uppercase block ${
                        qrTab === 'scan_camera' ? 'text-[#171e00]/80 font-bold' : 'text-[#8f9378]'
                      }`}
                    >
                      {t('receiverSub')}
                    </span>
                  </div>
                </button>
              </div>
            )}

            {/* ROLE 1: THE ONE WHO GIVES (Clean QR + PIN only) */}
            {qrTab === 'my_qr' && (
              <div className="flex flex-col items-center w-full gap-3 animate-in fade-in">
                <div
                  onClick={() => completeQrHandshake(barcodeTargetOffer)}
                  title="Tap QR to simulate partner scan"
                  className="p-3.5 rounded-2xl bg-white border-4 border-[#caf300] shadow-[0_0_25px_rgba(202,243,0,0.25)] cursor-pointer transition-transform active:scale-95"
                >
                  <svg viewBox="0 0 21 21" className="w-40 h-40">
                    <rect width="21" height="21" fill="#ffffff" />
                    <path
                      d="M1,1 h7 v7 h-7 z M2,2 v5 h5 v-5 z M3,3 h3 v3 h-3 z
                         M13,1 h7 v7 h-7 z M14,2 v5 h5 v-5 z M15,3 h3 v3 h-3 z
                         M1,13 h7 v7 h-7 z M2,14 v5 h5 v-5 z M3,15 h3 v3 h-3 z"
                      fill="#111215"
                      fillRule="evenodd"
                    />
                    {Array.from({ length: 121 }).map((_, idx) => {
                      const r = 1 + Math.floor(idx / 11) + (idx % 2);
                      const c = 1 + (idx % 11) + Math.floor(idx / 15);
                      if (
                        (r <= 8 && c <= 8) ||
                        (r <= 8 && c >= 12) ||
                        (r >= 12 && c <= 8) ||
                        r >= 20 ||
                        c >= 20
                      ) {
                        return null;
                      }
                      const codeStr = barcodeTargetOffer.securityPassCode || 'SWP-7740';
                      const charCode = codeStr.charCodeAt(idx % codeStr.length);
                      const on = (charCode + idx * 7) % 3 !== 0;
                      return on ? (
                        <rect key={idx} x={c} y={r} width="1" height="1" fill="#111215" />
                      ) : null;
                    })}
                  </svg>
                </div>

                <div className="px-4 py-1.5 rounded-xl bg-[#131315] border border-[#caf300]/40 font-mono text-xs text-[#caf300] font-bold tracking-wider">
                  PIN: {barcodeTargetOffer.securityPassCode || 'SWP-7740'}
                </div>
              </div>
            )}

            {/* ROLE 2: THE ONE WHO RECEIVES (Live Camera Scanner + PIN Verify) */}
            {qrTab === 'scan_camera' && (
              <div className="flex flex-col items-center w-full gap-3 animate-in fade-in">
                <div
                  onClick={() => completeQrHandshake(barcodeTargetOffer)}
                  title="Align QR or tap frame to scan"
                  className="relative w-full aspect-square max-w-[195px] rounded-2xl bg-[#0e0e10] border-2 border-[#caf300] overflow-hidden flex items-center justify-center shadow-[0_0_25px_rgba(202,243,0,0.2)] cursor-pointer"
                >
                  <video
                    ref={qrVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-4 border border-dashed border-[#caf300]/60 rounded-xl pointer-events-none flex flex-col justify-between">
                    <div className="w-full h-0.5 bg-[#caf300] shadow-[0_0_12px_#caf300] animate-bounce" />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 w-full">
                  <input
                    type="text"
                    value={manualPinInput}
                    onChange={(e) => setManualPinInput(e.target.value.toUpperCase())}
                    placeholder={t('pinPlaceholder')}
                    className="flex-1 bg-[#131315] border border-white/10 rounded-xl px-3 py-2.5 font-mono text-xs text-white uppercase focus:outline-none focus:border-[#caf300]"
                  />
                  <button
                    type="button"
                    onClick={() => completeQrHandshake(barcodeTargetOffer)}
                    className="px-4 py-2.5 rounded-xl bg-[#caf300] text-[#171e00] font-mono text-xs font-bold uppercase cursor-pointer"
                  >
                    {t('verifyPin')}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: HANDSHAKE COMPLETE — DIGITAL SWAP PASS RECEIPT */}
            {qrTab === 'verified' && (
              <div className="flex flex-col items-center py-1 w-full animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-[#caf300]/20 border-2 border-[#caf300] flex items-center justify-center text-[#caf300] mb-2 shadow-[0_0_20px_rgba(202,243,0,0.4)]">
                  <span className="material-symbols-outlined text-2xl">handshake</span>
                </div>

                <span className="font-mono text-[9.5px] text-[#caf300] uppercase font-bold tracking-widest">
                  {t('handshakeReceipt')} // #{barcodeTargetOffer.securityPassCode || 'SWP-7740'}
                </span>
                <h3 className="font-display text-base font-bold text-white uppercase mt-0.5">
                  {t('piecesSwappedWith')} @{barcodeTargetOffer.partner.handle}
                </h3>

                {/* Impact & Trust Points Reward Strip */}
                <div className="mt-2 grid grid-cols-2 gap-2 w-full font-mono text-[10px]">
                  <div className="p-2 rounded-xl bg-[#131315] border border-[#caf300]/30 flex items-center justify-center gap-1.5 text-[#caf300] font-bold">
                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                    <span>{t('trustPtsReward')}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#131315] border border-white/10 flex items-center justify-center gap-1.5 text-[#c5c9ac] font-bold">
                    <span className="material-symbols-outlined text-[14px] text-[#caf300]">eco</span>
                    <span>{barcodeTargetOffer.co2SavedKg || 4.2}kg {t('co2SavedLabel')}</span>
                  </div>
                </div>

                {/* Visual Swapped Ownership Card */}
                <div className="mt-2 p-2.5 rounded-2xl bg-[#131315] border border-[#caf300]/30 w-full flex items-center justify-between gap-2 text-left">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={barcodeTargetOffer.theirItem.imageUrl}
                      alt={barcodeTargetOffer.theirItem.title}
                      className="w-10 h-10 rounded-xl object-cover border border-[#caf300]/50 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-mono text-[8.5px] uppercase text-[#caf300] font-bold block">
                        {t('addedToYourCloset')}
                      </span>
                      <span className="font-sans text-xs font-bold text-white truncate block">
                        {barcodeTargetOffer.theirItem.title}
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#caf300] text-[18px]">
                    verified
                  </span>
                </div>

                {/* FIT CHECK POLAROID CARD */}
                <div className="mt-2.5 w-full flex flex-col items-center">
                  <input
                    type="file"
                    ref={fitCheckFileInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={handleFitCheckFileSelected}
                    className="hidden"
                  />

                  {!fitCheckPhoto ? (
                    <button
                      type="button"
                      onClick={() => fitCheckFileInputRef.current?.click()}
                      className="w-full py-3 px-3.5 rounded-xl border-2 border-dashed border-[#caf300]/40 hover:border-[#caf300] bg-[#caf300]/5 hover:bg-[#caf300]/10 flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-98 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#caf300]/20 flex items-center justify-center text-[#caf300] shrink-0 group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <span className="font-mono text-[11px] font-bold text-[#caf300] block uppercase tracking-wider">
                          {t('snapFitCheck')}
                        </span>
                        <span className="font-mono text-[9px] text-[#8f9378] block truncate">
                          {t('fitCheckPrompt')}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-[#caf300] text-[16px] shrink-0">
                        arrow_forward
                      </span>
                    </button>
                  ) : (
                    <div className="w-full max-w-[270px] bg-[#f5f4ef] text-[#131315] p-2.5 pb-4 rounded-sm shadow-[0_12px_35px_rgba(0,0,0,0.6)] border border-white/20 transform rotate-[-1deg] transition-all hover:rotate-0 animate-in zoom-in-95">
                      {/* Polaroid Image */}
                      <div className="relative aspect-square w-full bg-[#18181a] overflow-hidden rounded-xs border border-black/10">
                        <img
                          src={fitCheckPhoto}
                          alt="Fit Check Polaroid"
                          className="w-full h-full object-cover filter contrast-[1.04]"
                        />
                        {/* Cairo Stamp Watermark */}
                        <div className="absolute bottom-2 right-2 border-2 border-red-600/90 text-red-600 font-mono text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-tighter rotate-[-6deg] bg-white/80 backdrop-blur-xs shadow-xs">
                          {t('cairoVerifiedStamp')}
                        </div>
                      </div>

                      {/* Polaroid Caption Footer */}
                      <div className="mt-2.5 px-0.5 flex flex-col gap-0.5 font-mono">
                        <div className="flex items-center justify-between text-[9px] font-bold text-black/80">
                          <span>@{barcodeTargetOffer.partner.handle} ⇄ You</span>
                          <span className="text-black/50 text-[8px]">
                            {barcodeTargetOffer.hubLocation || 'Cairo Hub'}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-black truncate">
                          {barcodeTargetOffer.theirItem.title}
                        </p>
                      </div>

                      {/* Polaroid Quick Action Row */}
                      <div className="mt-2 pt-2 border-t border-black/10 flex items-center justify-between gap-1 text-[9px] font-mono">
                        <button
                          type="button"
                          onClick={() => fitCheckFileInputRef.current?.click()}
                          className="text-black/60 hover:text-black font-bold flex items-center gap-0.5 cursor-pointer underline"
                        >
                          <span className="material-symbols-outlined text-[12px]">refresh</span>
                          <span>{t('retakePhoto')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            triggerHaptic('light');
                            soundFX.playClick();
                            const shareText = `Just traded for ${barcodeTargetOffer.theirItem.title} with @${barcodeTargetOffer.partner.handle} on swap.! 📸`;
                            if (navigator.share) {
                              await navigator.share({
                                title: 'swap. Fit Check',
                                text: shareText,
                                url: window.location.href,
                              }).catch(() => {});
                            } else {
                              flashToast(t('stampedInPassport'));
                            }
                          }}
                          className="px-2 py-1 rounded bg-[#131315] text-[#caf300] font-bold flex items-center gap-1 cursor-pointer hover:bg-black"
                        >
                          <span className="material-symbols-outlined text-[12px]">ios_share</span>
                          <span>{t('sharePolaroid')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2-Tap Post-Swap Condition & 5★ Partner Rating */}
                <div className="mt-2 p-2.5 rounded-xl bg-[#18181a] border border-white/10 w-full flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] uppercase text-[#c5c9ac] font-bold">
                    {t('ratePartnerPiece')}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('success');
                        soundFX.playMatch();
                        setPostScanRated('mint');
                      }}
                      className={`py-1.5 rounded-lg font-bold uppercase cursor-pointer border transition-all ${
                        postScanRated === 'mint'
                          ? 'bg-[#caf300] text-[#171e00] border-[#caf300]'
                          : 'bg-[#131315] text-[#caf300] border-[#caf300]/30 hover:bg-[#caf300]/10'
                      }`}
                    >
                      {t('mintSwap')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        soundFX.playClick();
                        setPostScanRated('worn');
                      }}
                      className={`py-1.5 rounded-lg font-bold uppercase cursor-pointer border transition-all ${
                        postScanRated === 'worn'
                          ? 'bg-red-500/20 text-red-300 border-red-500/40'
                          : 'bg-[#131315] text-[#c5c9ac] border-white/10 hover:text-white'
                      }`}
                    >
                      {t('slightlyWorn')}
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 w-full">
                  <button
                    type="button"
                    onClick={async () => {
                      triggerHaptic('light');
                      soundFX.playClick();
                      const text = `Swapped ${barcodeTargetOffer.yourItem.title} ⇄ ${barcodeTargetOffer.theirItem.title} with @${barcodeTargetOffer.partner.handle} on swap. (#${barcodeTargetOffer.securityPassCode || 'SWP-7740'})`;
                      if (navigator.share) {
                        await navigator.share({ title: 'swap. Handshake Receipt', text, url: window.location.href }).catch(() => {});
                      } else if (navigator.clipboard) {
                        await navigator.clipboard.writeText(text).catch(() => {});
                        flashToast('Receipt copied to clipboard!');
                      }
                    }}
                    className="py-2.5 rounded-xl bg-[#131315] hover:bg-[#2a2a2c] text-[#caf300] border border-[#caf300]/40 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">ios_share</span>
                    <span>{t('shareReceipt')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setPostScanRated(null);
                      setIsBarcodeModalOpen(false);
                    }}
                    className="py-2.5 rounded-xl bg-[#caf300] text-[#171e00] font-mono text-xs font-bold uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-md"
                  >
                    {t('saveReceiptDone')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ephemeral Feedback Toast */}
      {toastMessage && (
        <div className="fixed top-20 inset-x-4 z-50 pointer-events-none flex justify-center animate-in fade-in slide-in-from-top-2">
          <div className="bg-[#201f21]/95 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-[#caf300]/40">
            <span className="material-symbols-outlined text-[#caf300] text-[16px]">verified</span>
            <span className="font-mono text-xs text-white">{toastMessage}</span>
          </div>
        </div>
      )}
    </main>
  );
};

// Helper for value extraction
function activeOfferValue(item: any) {
  return item?.estValue || item?.value || 450;
}
