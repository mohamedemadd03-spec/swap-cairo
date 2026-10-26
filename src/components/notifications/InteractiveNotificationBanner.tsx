import React, { useState, useEffect } from 'react';
import { SwapOffer } from '../../types/swap';
import { soundFX, triggerHaptic } from '../../hooks/useSoundFX';
import { useLanguage } from '../../i18n/LanguageContext';

interface InteractiveNotificationBannerProps {
  incomingOffer: SwapOffer | null;
  onAcceptOffer: (offerId: string) => void;
  onDeclineOffer: (offerId: string) => void;
  onOpenChat: (offer: SwapOffer) => void;
  onEditOffer?: (offer: SwapOffer) => void;
  onNudgeOffer?: (offerId: string) => void;
  onStandFirm?: (offerId: string) => void;
  onSweetenOffer?: (offerId: string, extraTeeTitle: string, cashExtra: number) => void;
  onSendMessage?: (offerId: string, messageText: string) => void;
  onDismiss: () => void;
}

export const InteractiveNotificationBanner: React.FC<InteractiveNotificationBannerProps> = ({
  incomingOffer,
  onAcceptOffer,
  onDeclineOffer,
  onOpenChat,
  onDismiss,
}) => {
  const { t, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (incomingOffer) {
      setIsExpanded(true);
      // Play subtle chime when notification drops down
      soundFX.playBrandIntro();
    }
  }, [incomingOffer?.id]);

  if (!incomingOffer || !isExpanded) return null;

  const isHeld = incomingOffer.status === 'maybe';
  const isStandingFirm = incomingOffer.isStandingFirm;

  const handleAccept = () => {
    triggerHaptic('trade');
    soundFX.playMatch();
    onAcceptOffer(incomingOffer.id);
    setIsExpanded(false);
  };

  const handleDecline = () => {
    triggerHaptic('pass');
    soundFX.playClick();
    onDeclineOffer(incomingOffer.id);
    setIsExpanded(false);
  };

  const handleOpenFullChat = () => {
    soundFX.playClick();
    onOpenChat(incomingOffer);
    setIsExpanded(false);
  };

  return (
    <aside aria-label="Trade request notification" className="fixed top-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[440px] z-[60] animate-in slide-in-from-top-4 duration-300">
      <div className="bg-[#141518]/95 backdrop-blur-2xl border-2 border-[#caf300]/80 rounded-2xl p-3.5 shadow-[0_16px_50px_rgba(0,0,0,0.9)] flex flex-col gap-2.5 font-sans">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-md bg-[#caf300] text-[#171e00] flex items-center justify-center font-black font-display text-[11px] leading-none shrink-0">
              s.
            </div>
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-white truncate">
              {isStandingFirm 
                ? (language === 'ar' ? '🛡️ العرض ثابت' : '🛡️ STANDING FIRM ON OFFER')
                : isHeld 
                ? (language === 'ar' ? '⚡ استنى • جاري الفصال' : '⚡ NUDGED • NEGOTIATING') 
                : (language === 'ar' ? 'عرض تبديل جديد' : 'TRADE REQUEST RECEIVED')}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#caf300] animate-ping shrink-0" />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono text-[9px] text-[#8f9378]">
              {language === 'ar' ? 'تنبيه مباشر' : 'Live alert'}
            </span>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setIsExpanded(false);
                onDismiss();
              }}
              className="text-[#8f9378] hover:text-white p-0.5 rounded cursor-pointer transition-colors"
              title="Dismiss notification banner"
            >
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          </div>
        </div>

        {/* Content: Garment Preview (Tap to open full deal in app) */}
        <div 
          onClick={handleOpenFullChat}
          className="flex items-center gap-3 bg-[#131315]/90 p-2.5 rounded-xl border border-white/5 cursor-pointer hover:border-[#caf300]/40 transition-colors group"
          title="Tap to view, edit, or negotiate inside app"
        >
          <img
            src={incomingOffer.theirItem.imageUrl}
            alt={incomingOffer.theirItem.title}
            className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9.5px] font-bold text-[#caf300]">
                @{incomingOffer.partner.handle}
              </span>
              <span className="font-mono text-[9px] text-[#8f9378] group-hover:text-[#caf300] flex items-center gap-0.5">
                <span>{language === 'ar' ? 'فتح' : 'Open in App'}</span>
                <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
              </span>
            </div>
            <p className="font-sans text-xs text-white font-medium truncate mt-0.5">
              {incomingOffer.theirItem.title} ⇄ {incomingOffer.yourItem.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5 font-mono text-[9px]">
              <span className="text-[#8f9378]">
                {incomingOffer.theirItem.size} • {language === 'ar' ? 'تسليم موثق' : 'Locker Verified'}
              </span>
              {incomingOffer.cashTopUp > 0 && (
                <span className="text-[#caf300] font-bold">
                  +{incomingOffer.cashTopUp} {language === 'ar' ? 'ج.م' : 'EGP'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Two Options Only: ACCEPT & REFUSE */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          {/* 1. ACCEPT */}
          <button
            type="button"
            onClick={handleAccept}
            className="py-2.5 rounded-xl bg-[#caf300] text-[#171e00] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-md shadow-[#caf300]/20"
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{t('agree')}</span>
          </button>

          {/* 2. REFUSE */}
          <button
            type="button"
            onClick={handleDecline}
            className="py-2.5 rounded-xl bg-[#201f21] hover:bg-red-500/20 text-[#c6c6c7] hover:text-red-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-white/5 transition-colors cursor-pointer"
            title="Refuse offer politely"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
            <span>{language === 'ar' ? 'رفض' : 'REFUSE'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
