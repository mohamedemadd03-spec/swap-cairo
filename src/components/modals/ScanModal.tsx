import React, { useState, useEffect, useRef } from 'react';
import { soundFX } from '../../hooks/useSoundFX';
import { BrutalistQRCode } from '../common/BrutalistQRCode';
import { useLanguage } from '../../i18n/LanguageContext';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
  activePassCode?: string;
  defaultSpotName?: string;
}

export const ScanModal: React.FC<ScanModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  activePassCode = 'SWP-7740',
  defaultSpotName = 'Espresso Lab Degla Hub #04',
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [mode, setMode] = useState<'my_qr' | 'scan'>('my_qr');
  const [scannedResult, setScannedResult] = useState<{
    code: string;
    type: 'SWAP_PASS' | 'BUYOUT_PASS';
    title: string;
    verifiedAt: string;
    status: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isOpen || mode !== 'scan') {
      setCameraActive(false);
      return;
    }

    // Try starting camera if available
    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setCameraActive(true);
          }
        }
      } catch {
        // Fallback to simulation viewfinder cleanly
        setCameraActive(false);
      }
    }

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleSimulateScan = (codeToScan: string) => {
    soundFX.playSonar();
    soundFX.playStamp();
    const isBuyout = codeToScan.includes('ESCROW');
    const result = {
      code: codeToScan,
      type: (isBuyout ? 'BUYOUT_PASS' : 'SWAP_PASS') as 'SWAP_PASS' | 'BUYOUT_PASS',
      title: isBuyout ? 'Direct Purchase Escrow Pass' : 'Trade Barcode Authentication Pass',
      verifiedAt: new Date().toLocaleTimeString(),
      status: 'VERIFIED // HANDOVER APPROVED',
    };

    setScannedResult(result);
    onScanSuccess(codeToScan);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#131317] border-2 border-[#D4FF00] p-5 flex flex-col gap-4 font-mono-zine shadow-[0_20px_60px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2A33] pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#D4FF00]">confirmation_number</span>
            <span className="font-display-zine font-black text-lg uppercase text-white">
              SWAP PASS // IN-PERSON HANDSHAKE
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close scanner"
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white border border-neutral-700 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {scannedResult ? (
          /* Scanned Result Card */
          <div className="flex flex-col gap-3 animate-in zoom-in-95">
            <div className="p-4 bg-[#08080A] border-2 border-[#D4FF00] relative">
              <div className="w-fit px-2.5 py-0.5 bg-[#D4FF00] text-[#08080A] font-black text-xs uppercase mb-2">
                {scannedResult.status}
              </div>

              <h2 className="text-white font-bold text-base uppercase">
                {scannedResult.title}
              </h2>
              <div className="text-xs text-neutral-400 mt-1">
                Pass Code: <strong className="text-[#D4FF00] font-mono">{scannedResult.code}</strong>
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Verified at: {scannedResult.verifiedAt} • {defaultSpotName}
              </div>

              <div className="mt-3 p-2 bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
                Item ownership exchange authenticated. Handover tokens logged to decentralized ledger.
              </div>
            </div>

            <button
              onClick={() => setScannedResult(null)}
              className="py-2.5 bg-neutral-900 border border-neutral-700 text-neutral-200 hover:text-white text-xs uppercase cursor-pointer"
            >
              SCAN ANOTHER CODE
            </button>
            <button
              onClick={onClose}
              className="py-2.5 bg-[#D4FF00] text-[#08080A] font-bold text-xs uppercase cursor-pointer shadow-[2px_2px_0px_#fff]"
            >
              COMPLETE & CLOSE
            </button>
          </div>
        ) : (
          /* Two-Phone QR Handshake Switcher: The One Who Gives vs The One Who Receives */
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 p-1 rounded-xl bg-black border border-neutral-800 text-[10.5px] font-bold uppercase">
              <button
                type="button"
                onClick={() => setMode('my_qr')}
                className={`py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 ${
                  mode === 'my_qr'
                    ? 'bg-[#D4FF00] text-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">call_made</span>
                <span>{isAr ? 'الطرف المُسلِّم' : 'The One Who Gives'}</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('scan')}
                className={`py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 ${
                  mode === 'scan'
                    ? 'bg-[#D4FF00] text-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">call_received</span>
                <span>{isAr ? 'الطرف المُستلِم' : 'The One Who Receives'}</span>
              </button>
            </div>

            {mode === 'my_qr' ? (
              <div className="flex flex-col items-center gap-2 py-1 w-full">
                <BrutalistQRCode
                  value={activePassCode}
                  onSimulateScan={() => handleSimulateScan(activePassCode)}
                  label={isAr ? 'الدور: الطرف المُسلِّم' : 'ROLE: THE ONE WHO GIVES'}
                  sublabel={isAr ? 'وجّه كاميرا المستلم لمسح الكود وتوثيق السواب فوراً' : 'Point receiver camera to scan QR and verify handshake'}
                />
              </div>
            ) : (
              <>
                <span className="text-[10px] font-bold uppercase text-[#D4FF00] tracking-wider text-center">
                  {isAr ? 'الدور: الطرف المُستلِم (افحص القطعة وامسح كود الطرف الآخر)' : 'ROLE: THE ONE WHO RECEIVES (INSPECT PIECE & SCAN GIVER QR)'}
                </span>
                <div className="relative w-full aspect-square max-w-[260px] mx-auto bg-black border-2 border-neutral-800 overflow-hidden flex items-center justify-center">
                  {/* Live camera stream */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  />

                  {/* Viewfinder Overlay */}
                  <div className="absolute inset-4 border border-dashed border-[#D4FF00]/40 pointer-events-none flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-t-2 border-l-2 border-[#D4FF00]"></div>
                      <div className="w-4 h-4 border-t-2 border-r-2 border-[#D4FF00]"></div>
                    </div>
                    <div className="w-full h-0.5 bg-[#D4FF00] shadow-[0_0_8px_#D4FF00] animate-pulse"></div>
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-b-2 border-l-2 border-[#D4FF00]"></div>
                      <div className="w-4 h-4 border-b-2 border-r-2 border-[#D4FF00]"></div>
                    </div>
                  </div>

                  {!cameraActive && (
                    <div className="text-center p-4 z-10 flex flex-col items-center gap-1.5 text-neutral-500">
                      <span className="material-symbols-outlined text-4xl text-[#D4FF00]">center_focus_weak</span>
                      <span className="text-[10px] uppercase font-bold text-neutral-400">
                        {isAr ? 'ضع كود الـ QR داخل الإطار' : 'ALIGN PARTNER QR IN FRAME'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Manual Code Entry */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={isAr ? 'أدخل كود الهاند شيك...' : 'ENTER PARTNER PASS CODE...'}
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-black border border-neutral-700 px-3 py-2 text-xs text-white uppercase placeholder-neutral-600 focus:outline-none focus:border-[#D4FF00]"
                  />
                  <button
                    onClick={() => handleSimulateScan(manualCode || activePassCode)}
                    className="px-3 py-2 bg-[#D4FF00] text-[#08080A] text-xs font-bold uppercase cursor-pointer"
                  >
                    {isAr ? 'تأكيد' : 'VERIFY'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
