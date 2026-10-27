import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { soundFX, triggerHaptic } from '../../hooks/useSoundFX';
import { useLanguage } from '../../i18n/LanguageContext';

interface BrutalistQRCodeProps {
  value: string;
  size?: number;
  label?: string;
  sublabel?: string;
  onSimulateScan?: () => void;
  showCopy?: boolean;
}

export const BrutalistQRCode: React.FC<BrutalistQRCodeProps> = ({
  value,
  size = 200,
  label = 'HANDSHAKE',
  sublabel,
  onSimulateScan,
  showCopy = true,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const defaultSublabel = isAr
    ? 'وجّه كاميرا الطرف الآخر لمسح الكود وتوثيق التبادل'
    : 'Point partner camera here to verify exchange';
  const activeSublabel = sublabel || defaultSublabel;

  const [qrSrc, setQrSrc] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const generateQr = async () => {
      try {
        const payload = value || 'SWP-7740';
        const url = await QRCode.toDataURL(payload, {
          width: size * 2,
          margin: 1.5,
          color: {
            dark: '#0c0b0e',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        });
        if (isMounted) setQrSrc(url);
      } catch (err) {
        console.warn('QR generation error:', err);
      }
    };

    generateQr();
    return () => {
      isMounted = false;
    };
  }, [value, size]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFX.playClick();
    triggerHaptic('light');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[280px] mx-auto gap-3 font-mono">
      {/* Brutalist QR Container */}
      <div
        onClick={onSimulateScan}
        title={onSimulateScan ? (isAr ? 'انقر لمحاكاة مسح الكود فورياً' : 'Click to simulate instant scan') : 'QR Scan ready'}
        className="relative p-3 rounded-2xl border-2 border-[#caf300]/80 bg-[#151418] shadow-[0_0_25px_rgba(202,243,0,0.18)] transition-all cursor-pointer group active:scale-98"
      >
        {/* Reticle Corners */}
        <div className="absolute top-1 left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-[#caf300]" />
        <div className="absolute top-1 right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-[#caf300]" />
        <div className="absolute bottom-1 left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-[#caf300]" />
        <div className="absolute bottom-1 right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-[#caf300]" />

        {/* Crisp White QR Backing */}
        <div className="relative p-2 bg-white rounded-xl overflow-hidden flex items-center justify-center">
          {qrSrc ? (
            <img
              src={qrSrc}
              alt="Handshake QR"
              className="w-48 h-48 sm:w-52 sm:h-52 object-contain image-rendering-pixelated"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-[#8f9378] text-xs">
              <span className="material-symbols-outlined animate-spin text-2xl text-[#caf300]">sync</span>
            </div>
          )}

          {/* Center Monogram */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-9 h-9 rounded-xl bg-[#0c0b0e] border-2 border-[#caf300] shadow-[0_0_12px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center p-0.5">
              <span className="text-[8.5px] font-black tracking-tight text-[#caf300] font-mono leading-none">
                SWAP
              </span>
              <span className="text-[7.5px] font-bold text-white tracking-widest leading-none mt-0.5">
                🤝
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Passcode Copy & Verification Bar */}
      <div className="flex flex-col items-center w-full gap-1.5">
        <div className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-[#0d0c0f] border border-white/10 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#8f9378] text-[10px]">PIN:</span>
            <span className="text-[#caf300] font-bold tracking-widest text-sm">{value}</span>
          </div>

          {showCopy && (
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg bg-[#201f23] hover:bg-[#2b2a30] text-white hover:text-[#caf300] text-[10px] uppercase font-bold flex items-center gap-1 border border-white/5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[13px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? (isAr ? 'تم النسخ' : 'COPIED') : (isAr ? 'نسخ' : 'COPY')}</span>
            </button>
          )}
        </div>

        {/* Practical Instruction */}
        <p className="text-[10px] text-center text-[#c5c9ac] leading-tight px-2">
          {activeSublabel}
        </p>

        {onSimulateScan && (
          <button
            type="button"
            onClick={onSimulateScan}
            className="text-[9.5px] text-[#caf300]/80 hover:text-[#caf300] underline mt-0.5 cursor-pointer uppercase transition-colors"
          >
            {isAr ? '[اضغط هنا لمحاكاة المسح والتسليم فوراً 🤝]' : '[Tap here to simulate instant QR handshake 🤝]'}
          </button>
        )}
      </div>
    </div>
  );
};
