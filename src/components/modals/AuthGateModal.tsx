import React, { useState } from 'react';
import { soundFX, triggerHaptic } from '../../hooks/useSoundFX';
import { useLanguage } from '../../i18n/LanguageContext';

interface AuthGateModalProps {
  isOpen: boolean;
  onGoogleSignIn: () => Promise<void> | void;
  onPhoneSignIn: (phoneNumber: string, method: 'call' | 'sms') => Promise<void> | void;
}

export const AuthGateModal: React.FC<AuthGateModalProps> = ({
  isOpen,
  onGoogleSignIn,
  onPhoneSignIn,
}) => {
  const { t, language, toggleLanguage, isRtl } = useLanguage();
  const [phoneStep, setPhoneStep] = useState<'idle' | 'input' | 'calling' | 'code'>('idle');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callerLast4, setCallerLast4] = useState('7740');
  const [enteredDigits, setEnteredDigits] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleTriggerFlashCall = () => {
    if (phoneNumber.replace(/\D/g, '').length < 8) return;
    soundFX.playProximityPing();
    triggerHaptic('medium');
    const generated4 = String(Math.floor(1000 + Math.random() * 9000));
    setCallerLast4(generated4);
    setEnteredDigits(generated4);
    setPhoneStep('calling');
    setTimeout(() => {
      soundFX.playMatch();
      triggerHaptic('nudge');
      setPhoneStep('code');
    }, 1100);
  };

  const handleConfirmPhone = async () => {
    setIsSubmitting(true);
    soundFX.playMatch();
    triggerHaptic('trade');
    try {
      await onPhoneSignIn(phoneNumber, 'call');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0d0e12]/95 backdrop-blur-2xl p-4 animate-in fade-in duration-300">
      {/* Subtle Brutalist Ambient Glow & Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 25%, rgba(202,243,0,0.16), transparent 55%), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 24px 24px, 24px 24px',
        }}
      />

      <div className="relative w-full max-w-sm rounded-3xl bg-[#18181b] border-2 border-[#caf300]/70 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.9)] flex flex-col gap-5 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Language Switcher in Login Screen */}
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              soundFX.playClick();
              toggleLanguage();
            }}
            className="px-2.5 py-1 rounded-full bg-[#131315] hover:bg-[#201f21] border border-white/10 font-mono text-[10.5px] font-bold text-[#caf300] hover:text-white transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
            title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
          >
            <span className="material-symbols-outlined text-[13px]">translate</span>
            <span>{language === 'ar' ? 'English' : 'عربي'}</span>
          </button>
        </div>

        {/* Top Brand Identity (No icon above swap., clean brutalist typography) */}
        <div className="flex flex-col items-center text-center gap-1.5 pt-1">
          <div className="flex items-baseline justify-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white lowercase">
              swap
            </h1>
            <span className="font-display text-4xl font-bold text-[#caf300] leading-none">.</span>
          </div>

          <p className="font-mono text-[10px] uppercase tracking-widest text-[#c5c9ac]">
            {t('brandIntroSlogan')}
          </p>
        </div>

        {/* Step Switcher */}
        {phoneStep === 'idle' && (
          <div className="flex flex-col gap-2.5 animate-in fade-in duration-200">
            {/* Option 1: Google Sign-In */}
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                triggerHaptic('medium');
                onGoogleSignIn();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#caf300] text-[#171e00] font-mono text-xs font-bold uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-[#caf300]/20 flex items-center justify-center gap-2.5"
            >
              <span className="font-display font-black text-[#171e00] text-sm">G</span>
              <span>{t('continueWithGoogle')}</span>
            </button>

            {/* Option 2: Phone Call Verify */}
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                triggerHaptic('light');
                setPhoneStep('input');
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#131315] hover:bg-[#222227] text-white font-mono text-xs font-bold uppercase tracking-wider border border-white/10 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px] text-[#caf300]">
                phone_callback
              </span>
              <span>{t('continueWithPhone')}</span>
            </button>
          </div>
        )}

        {phoneStep === 'input' && (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-right-3 duration-200">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10.5px] uppercase text-[#caf300] font-bold">
                {t('mobileNumber')}
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setPhoneStep('idle');
                }}
                className="font-mono text-[10px] text-[#8f9378] hover:text-white cursor-pointer"
              >
                ← {t('back')}
              </button>
            </div>

            <div className="flex items-center gap-2 bg-[#131315] border border-white/15 focus-within:border-[#caf300] rounded-2xl px-3.5 py-3 transition-colors">
              <span className="font-mono text-xs text-[#caf300] font-bold">+20</span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTriggerFlashCall();
                  }
                }}
                placeholder="10 1234 5678"
                className="w-full bg-transparent text-sm font-mono text-white placeholder-[#8f9378] focus:outline-none"
                autoFocus
              />
            </div>

            <button
              type="button"
              disabled={phoneNumber.replace(/\D/g, '').length < 8}
              onClick={handleTriggerFlashCall}
              className="w-full py-3.5 rounded-2xl bg-[#caf300] text-[#171e00] font-mono text-xs font-bold uppercase tracking-wider disabled:opacity-40 hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-[#caf300]/20 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">ring_volume</span>
              <span>{t('callToVerify')}</span>
            </button>
          </div>
        )}

        {phoneStep === 'calling' && (
          <div className="py-6 flex flex-col items-center text-center gap-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-14 h-14 rounded-full border border-[#caf300]/50 animate-ping" />
              <div className="w-12 h-12 rounded-full bg-[#caf300]/20 border border-[#caf300] flex items-center justify-center text-[#caf300]">
                <span className="material-symbols-outlined text-2xl animate-bounce">
                  phone_in_talk
                </span>
              </div>
            </div>
            <span className="font-mono text-xs text-white font-bold uppercase tracking-wider">
              {t('placingFlashCall')}
            </span>
            <span className="font-mono text-[10px] text-[#8f9378]">
              {t('autoDetectingCaller')}
            </span>
          </div>
        )}

        {phoneStep === 'code' && (
          <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-2.5 rounded-xl bg-[#caf300]/15 border border-[#caf300]/40 flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#caf300] font-bold uppercase">
                {t('callerIdMatched')}
              </span>
              <span className="font-mono text-xs text-white font-bold">#{callerLast4}</span>
            </div>

            <input
              type="text"
              maxLength={4}
              value={enteredDigits}
              onChange={(e) => setEnteredDigits(e.target.value)}
              className="w-full bg-[#131315] border-2 border-[#caf300] rounded-2xl px-4 py-2.5 text-center font-mono text-lg font-bold text-[#caf300] tracking-[0.35em] focus:outline-none"
            />

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmPhone}
              className="w-full py-3.5 rounded-2xl bg-[#caf300] text-[#171e00] font-mono text-xs font-bold uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-[#caf300]/20"
            >
              {isSubmitting ? t('entering') : t('enterSwap')}
            </button>
          </div>
        )}

        <p className="text-center font-mono text-[9.5px] text-[#8f9378] border-t border-white/5 pt-3">
          {t('authSubtitle')}
        </p>
      </div>
    </div>
  );
};
