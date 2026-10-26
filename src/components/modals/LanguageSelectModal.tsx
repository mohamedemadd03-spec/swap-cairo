import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Language } from '../../i18n/translations';
import { soundFX, triggerHaptic } from '../../hooks/useSoundFX';

interface LanguageSelectModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  canClose?: boolean;
}

export const LanguageSelectModal: React.FC<LanguageSelectModalProps> = ({
  isOpen,
  onConfirm,
  canClose = false,
}) => {
  const { language, setLanguage } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<Language>(language);

  if (!isOpen) return null;

  const handleSelect = (lang: Language) => {
    setSelectedLang(lang);
    setLanguage(lang);
    triggerHaptic('light');
    soundFX.playClick();
  };

  const handleConfirm = () => {
    soundFX.playMatch();
    triggerHaptic('trade');
    if (typeof window !== 'undefined') {
      localStorage.setItem('swap_lang_selected_v1', 'true');
    }
    onConfirm();
  };

  const options: Array<{
    id: Language;
    flag: string;
    nativeName: string;
    sublabel: string;
    badge: string;
    sampleTerms: string;
  }> = [
    {
      id: 'ar',
      flag: '🇪🇬',
      nativeName: 'العربية',
      sublabel: 'لهجة الشارع والقاهرة (سواب سريع)',
      badge: 'CAIRO STREET',
      sampleTerms: 'شات • هاند شيك • استنى • هاا',
    },
    {
      id: 'en',
      flag: '🇬🇧',
      nativeName: 'English',
      sublabel: 'Global Archival Streetwear Exchange',
      badge: 'INTERNATIONAL',
      sampleTerms: 'Chat • Handshake • Hold • Hmmm?',
    },
    {
      id: 'fr',
      flag: '🇫🇷',
      nativeName: 'Français',
      sublabel: 'Mode Urbaine & Archive Haute Couture',
      badge: 'PARIS ARCHIVE',
      sampleTerms: 'Chat • Handshake • Attendez • Euh?',
    },
  ];

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-[#0d0e12]/95 backdrop-blur-2xl p-4 animate-in fade-in duration-300">
      {/* Brutalist Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 30%, rgba(202,243,0,0.18), transparent 60%), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 24px 24px, 24px 24px',
        }}
      />

      <div
        className="relative w-full max-w-sm rounded-3xl bg-[#18181b] border-2 border-[#caf300]/70 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.9)] flex flex-col gap-5 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        dir={selectedLang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Optional Close Button if opened from Profile */}
        {canClose && (
          <button
            type="button"
            onClick={onConfirm}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-1.5 pt-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-[#caf300]/15 text-[#caf300] font-black uppercase tracking-wider border border-[#caf300]/30">
              STEP 2/2 // LANGUAGE
            </span>
          </div>

          <h2 className="font-display text-2xl font-black text-white mt-1">
            {selectedLang === 'ar'
              ? 'اختر لغة التجربة'
              : selectedLang === 'fr'
              ? 'Choisissez Votre Langue'
              : 'Choose Your Language'}
          </h2>

          <p className="font-mono text-[10.5px] text-[#c5c9ac]">
            {selectedLang === 'ar'
              ? 'حدد لغة التطبيق المفضلة للتنقل والتفاوض'
              : selectedLang === 'fr'
              ? 'Sélectionnez la langue pour vos négociations'
              : 'Select your preferred language for swaps & deals'}
          </p>
        </div>

        {/* Language Cards */}
        <div className="flex flex-col gap-2.5">
          {options.map((opt) => {
            const isSelected = selectedLang === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt.id)}
                className={`p-3.5 rounded-2xl border transition-all text-start flex items-center justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-[#caf300]/15 border-[#caf300] shadow-md shadow-[#caf300]/10 scale-[1.01]'
                    : 'bg-[#131315] hover:bg-[#201f21] border-white/10 text-white/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{opt.flag}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-sm font-black text-white block">
                        {opt.nativeName}
                      </span>
                      <span
                        className={`font-mono text-[8.5px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          isSelected
                            ? 'bg-[#caf300] text-black'
                            : 'bg-white/10 text-[#8f9378]'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-[#c5c9ac] block truncate mt-0.5">
                      {opt.sublabel}
                    </span>
                    <span className="font-mono text-[9px] text-[#8f9378] block truncate mt-0.5">
                      {opt.sampleTerms}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'border-[#caf300] bg-[#caf300] text-black'
                      : 'border-white/20'
                  }`}
                >
                  {isSelected && (
                    <span className="material-symbols-outlined text-[14px] font-black">
                      check
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Confirm Action Button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-4 px-4 rounded-2xl bg-[#caf300] text-[#171e00] font-mono text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-[#caf300]/25 flex items-center justify-center gap-2 mt-1"
        >
          <span>
            {selectedLang === 'ar'
              ? 'تأكيد ودخول التطبيق'
              : selectedLang === 'fr'
              ? 'Confirmer et Entrer'
              : 'Confirm & Enter SWAP'}
          </span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
