import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../i18n/LanguageContext';
import { soundFX, triggerHaptic } from '../hooks/useSoundFX';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { language } = useLanguage();
  const isAr = language === 'ar';

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    triggerHaptic('light');
    soundFX.playClick();
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#131315] border border-[#caf300]/30 font-mono shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#caf300]/10 border border-[#caf300]/30 flex items-center justify-center text-[#caf300] shrink-0">
            <span className="material-symbols-outlined text-[18px]">smartphone</span>
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-white block truncate">
              {isAr ? 'تثبيت SWAP على الموبايل' : 'Install SWAP on Phone'}
            </span>
            <span className="text-[9.5px] text-[#8f9378] block truncate">
              {isAr ? 'شاشات كاملة بدون شريط المتصفح وتصفح فوري' : 'Full-screen app mode with zero browser bars'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInstallClick}
          className="px-3 py-1.5 rounded-xl bg-[#caf300] hover:bg-[#d6ff1a] text-black font-mono text-[11px] font-black uppercase transition-colors cursor-pointer flex items-center gap-1 active:scale-95 shadow-sm shrink-0"
        >
          <span className="material-symbols-outlined text-[14px]">download</span>
          <span>{isAr ? 'تثبيت' : 'Install'}</span>
        </button>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div
            className="w-full max-w-xs bg-[#18181b] border-2 border-[#caf300] rounded-2xl p-4.5 font-mono text-xs shadow-2xl"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <span className="font-display font-black text-sm uppercase text-white tracking-wide">
                {isAr ? '📱 التثبيت على الآيفون' : '📱 Install on iPhone'}
              </span>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-[#c5c9ac] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[#c5c9ac] leading-relaxed text-[11.5px] mb-3">
              {isAr ? (
                <>
                  1. اضغط على أيقونة <strong className="text-white">المشاركة (Share ⎋)</strong> في أسفل متصفح Safari.<br />
                  2. انزل واضغط على <strong className="text-[#caf300]">إضافة إلى الصفحة الرئيسية (Add to Home Screen ⊞)</strong>.
                </>
              ) : (
                <>
                  1. Tap the <strong className="text-white">Share icon (⎋)</strong> at the bottom of Safari.<br />
                  2. Scroll down and tap <strong className="text-[#caf300]">Add to Home Screen (⊞)</strong>.
                </>
              )}
            </p>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 rounded-xl bg-[#caf300] text-[#171e00] font-black text-xs uppercase cursor-pointer hover:brightness-105 active:scale-98"
            >
              {isAr ? 'فهمت خلاص ✓' : 'Got It ✓'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
