import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-[#D4FF00] text-[#08080A] font-mono-zine font-bold text-[10px] uppercase tracking-wider shadow-[2px_2px_0px_#fff] hover:bg-white transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[13px] font-black">download</span>
        <span>INSTALL</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1 px-2 py-1 border border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white font-mono-zine text-[10px] uppercase cursor-pointer"
        >
          <span className="material-symbols-outlined text-[12px]">add_to_home_screen</span>
          <span>GET APP</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-xs bg-[#131317] border-2 border-[#D4FF00] p-4 font-mono-zine text-xs shadow-2xl">
              <h3 className="font-display-zine font-black text-sm uppercase text-white mb-2">
                INSTALL ON IPHONE / IPAD
              </h3>
              <p className="text-neutral-300 leading-relaxed text-[11px]">
                1. Tap the <strong className="text-white">Share</strong> icon in the Safari navigation bar.<br />
                2. Scroll down and tap <strong className="text-[#D4FF00]">Add to Home Screen</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-3 w-full py-1.5 bg-[#D4FF00] text-[#08080A] font-bold text-xs uppercase cursor-pointer"
              >
                GOT IT
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
