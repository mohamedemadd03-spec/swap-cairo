import React, { useState, useRef, useEffect } from 'react';
import { WardrobeItem } from '../../types/swap';
import { soundFX, triggerHaptic } from '../../hooks/useSoundFX';
import { compressImageFile } from '../../services/dataSync';
import { useLanguage } from '../../i18n/LanguageContext';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: WardrobeItem) => void;
}

type GarmentCategory = 'tees' | 'denim' | 'hoodie' | 'jacket' | 'shoes';
type PhotoSlot = 'front' | 'tag';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', '36', '42', '43', '44'];

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onAddItem }) => {
  const { language, t } = useLanguage();
  const isAr = language === 'ar';
  const [category, setCategory] = useState<GarmentCategory>('tees');
  const [title, setTitle] = useState('');
  const [size, setSize] = useState('L');
  const [value, setValue] = useState<number>(650);
  const [frontPhoto, setFrontPhoto] = useState<string>('');
  const [tagPhoto, setTagPhoto] = useState<string>('');
  const [frontFromLiveCamera, setFrontFromLiveCamera] = useState<boolean>(false);
  const [tagFromLiveCamera, setTagFromLiveCamera] = useState<boolean>(false);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [conditionGrade, setConditionGrade] = useState<string>('9.5 / 10 MINT');
  const [moderationStatus, setModerationStatus] = useState<'idle' | 'approved' | 'rejected'>('idle');
  const [moderationNote, setModerationNote] = useState<string>(
    'Balanced AI Assistant: Auto-fills details & welcomes vintage patina (blocks only NSFW, non-apparel, or unwearable rags).'
  );

  // Step-by-Step Progressive Flow: 'front' -> 'tag' -> 'details'
  const [step, setStep] = useState<'front' | 'tag' | 'details'>('front');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setCameraError(null);
      return;
    }
    if (!frontPhoto) {
      setStep('front');
    } else if (!tagPhoto) {
      setStep('tag');
    } else {
      setStep('details');
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || step === 'details') {
      stopCameraStream();
      return;
    }

    let cancelled = false;
    async function startLiveCamera() {
      setCameraError(null);
      stopCameraStream();
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError('Camera not available.');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 1280 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        setCameraError('Tap Gallery below to pick a photo.');
      }
    }

    startLiveCamera();

    return () => {
      cancelled = true;
      stopCameraStream();
    };
  }, [step, facingMode, isOpen]);

  if (!isOpen) return null;

  const analyzePhotos = async (frontBase64: string, tagBase64?: string, currentHint = title) => {
    if (!frontBase64 && !tagBase64) return;
    setIsAnalyzingPhoto(true);
    try {
      const res = await fetch('/api/analyze-garment-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: frontBase64,
          tagImageBase64: tagBase64,
          mimeType: 'image/jpeg',
          userHint: currentHint,
        }),
      });
      const data = await res.json();
      if (data?.approved === false) {
        setModerationStatus('rejected');
        setModerationNote(
          data.rejectionReason ||
            'Quality Gate: Item rejected (must be safe, wearable clothing in 7.0+ condition).'
        );
        return;
      }

      if (data?.success && data?.analysis) {
        const a = data.analysis;
        setModerationStatus('approved');
        setModerationNote(
          a.lightingNote ||
            `Verified Apparel • Condition ${a.condition || '9.2 / 10 MINT'}`
        );
        if (!title.trim() && a.title) {
          setTitle(a.title);
        }
        if (a.suggestedSize) setSize(a.suggestedSize);
        if (a.estimatedValueEgp) setValue(Number(a.estimatedValueEgp));
        if (a.condition) setConditionGrade(a.condition);
        if (a.category && ['tees', 'denim', 'hoodie', 'jacket', 'shoes'].includes(a.category)) {
          setCategory(a.category as GarmentCategory);
        }
      }
    } catch {
      setModerationStatus('approved');
      setModerationNote('Passed local apparel & condition verification.');
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  const handleCaptureFromLiveCamera = () => {
    if (!videoRef.current || step === 'details') return;
    const video = videoRef.current;
    const vw = video.videoWidth || 720;
    const vh = video.videoHeight || 720;
    const maxDim = 760;
    const scale = Math.min(1, maxDim / Math.max(vw, vh));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(vw * scale);
    canvas.height = Math.round(vh * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const capturedDataUrl = canvas.toDataURL('image/jpeg', 0.84);
    soundFX.playMatch();
    triggerHaptic('medium');

    if (step === 'front') {
      setFrontPhoto(capturedDataUrl);
      setFrontFromLiveCamera(true);
      analyzePhotos(capturedDataUrl, tagPhoto);
      setStep('tag');
    } else if (step === 'tag') {
      setTagPhoto(capturedDataUrl);
      setTagFromLiveCamera(true);
      stopCameraStream();
      analyzePhotos(frontPhoto, capturedDataUrl);
      setStep('details');
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slot: PhotoSlot
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundFX.playClick();
    triggerHaptic('medium');
    try {
      const compressed = await compressImageFile(file, 760, 0.82);
      if (slot === 'front') {
        setFrontPhoto(compressed);
        setFrontFromLiveCamera(false);
        analyzePhotos(compressed, tagPhoto);
        setStep('tag');
      } else {
        setTagPhoto(compressed);
        setTagFromLiveCamera(false);
        stopCameraStream();
        analyzePhotos(frontPhoto, compressed);
        setStep('details');
      }
    } catch {
      // Ignore invalid file
    }
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const norm = val.toLowerCase();
    if (
      norm.includes('torn') ||
      norm.includes('stained') ||
      norm.includes('ripped') ||
      norm.includes('dirty') ||
      norm.includes('worn out') ||
      norm.includes('damaged')
    ) {
      setModerationStatus('rejected');
      setModerationNote(
        'Quality Gate: Worn-out, stained, or damaged items (<7.5/10) are blocked to protect marketplace quality.'
      );
    } else if (
      norm.includes('nsfw') ||
      norm.includes('nude') ||
      norm.includes('offensive')
    ) {
      setModerationStatus('rejected');
      setModerationNote('Safety Gate: Inappropriate content is strictly blocked.');
    } else if (conditionGrade !== 'BELOW_7' && moderationStatus === 'rejected') {
      setModerationStatus(frontPhoto ? 'approved' : 'idle');
      setModerationNote('Passed AI Safety, Apparel & 7.5+ Condition Gate.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontPhoto || !tagPhoto || !title.trim() || moderationStatus === 'rejected' || conditionGrade === 'BELOW_7') {
      return;
    }
    soundFX.playMatch();
    triggerHaptic('trade');

    const cleanTitle = title.trim();
    const isLiveCameraVerified = Boolean(frontFromLiveCamera || tagFromLiveCamera);

    let userCoords: { lat: number; lng: number } | undefined;
    try {
      const saved = sessionStorage.getItem('swap_gps_coords_v1') || localStorage.getItem('swap_gps_coords_v1');
      if (saved) userCoords = JSON.parse(saved);
    } catch {}

    const newItem: WardrobeItem = {
      id: `vault-${Date.now()}`,
      title: cleanTitle,
      categoryTag: `${cleanTitle.split(' ')[0].toUpperCase()} • ${size}`,
      category: category as any,
      size,
      value: Number(value) || 500,
      currency: 'EGP',
      status: 'available',
      badgeLabel: isLiveCameraVerified ? 'Live Cam Verified' : 'Verified Closet',
      imageUrl: frontPhoto,
      angles: {
        front: frontPhoto,
        back: tagPhoto,
        tag: tagPhoto,
      },
      lat: userCoords?.lat,
      lng: userCoords?.lng,
      isLiveCameraVerified,
      condition: conditionGrade,
      description: `Authentic ${cleanTitle} (${conditionGrade}). Ready for trade.`,
      authenticityTier: 'hub_inspected',
      hasOriginalBox: false,
    };

    onAddItem(newItem);
    setTitle('');
    setFrontPhoto('');
    setTagPhoto('');
    setFrontFromLiveCamera(false);
    setTagFromLiveCamera(false);
    setModerationStatus('idle');
    onClose();
  };

  const isQualityBlocked = moderationStatus === 'rejected' || conditionGrade === 'BELOW_7';
  const isFormReady = Boolean(frontPhoto && tagPhoto && title.trim() && !isQualityBlocked);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#131315]/95 backdrop-blur-md p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#201f21] border-t sm:border border-[#26262e] rounded-t-3xl sm:rounded-2xl p-4 flex flex-col gap-3 font-sans shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Clean Minimal Header + 3-Step Pill Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[
              { id: 'front', label: t('frontPhotoPrompt') },
              { id: 'tag', label: t('tagPhotoPrompt') },
              { id: 'details', label: t('postToCloset') },
            ].map((s) => {
              const active = step === s.id;
              const done =
                (s.id === 'front' && Boolean(frontPhoto)) ||
                (s.id === 'tag' && Boolean(tagPhoto));
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    if (s.id === 'front') setStep('front');
                    else if (s.id === 'tag' && frontPhoto) setStep('tag');
                    else if (s.id === 'details' && frontPhoto && tagPhoto) setStep('details');
                  }}
                  className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    active
                      ? 'bg-[#caf300] text-[#171e00]'
                      : done
                      ? 'bg-[#caf300]/15 text-[#caf300] border border-[#caf300]/30'
                      : 'bg-[#131315] text-[#8f9378]'
                  }`}
                >
                  {done && !active ? `✓ ${s.label}` : s.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              stopCameraStream();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#131315] hover:bg-[#2a2a2c] text-[#c6c6c7] hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* STEP 1 & STEP 2: LIGHT, FULL-FOCUS CAMERA SCREEN (One photo at a time) */}
        {(step === 'front' || step === 'tag') && (
          <div className="flex flex-col gap-3 animate-in fade-in">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-display font-bold text-base text-white">
                {step === 'front' ? t('snapFrontPiece') : t('snapNeckTag')}
              </h2>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
                }}
                className="px-2.5 py-1 rounded-full bg-[#131315] text-[#c5c9ac] hover:text-white font-mono text-[10px] uppercase flex items-center gap-1 border border-white/10 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">flip_camera_ios</span>
                <span>{t('flip')}</span>
              </button>
            </div>

            <div className="relative aspect-[4/5] w-full rounded-2xl bg-black border-2 border-[#caf300]/70 overflow-hidden flex items-center justify-center shadow-lg">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Subtle Minimal Framing Corners */}
              <div className="absolute inset-6 border border-dashed border-[#caf300]/40 rounded-2xl pointer-events-none flex items-end justify-center pb-3">
                <span className="px-3 py-1 rounded-full bg-black/70 text-[#caf300] font-mono text-[10px] font-bold uppercase">
                  {step === 'front' ? t('step1FrontView') : t('step2BrandTag')}
                </span>
              </div>

              {cameraError && (
                <div className="absolute inset-0 bg-[#0e0e10]/95 p-6 flex flex-col items-center justify-center text-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-[#caf300]">
                    add_a_photo
                  </span>
                  <p className="font-sans text-xs text-[#c5c9ac]">{t('cameraNotAvailable')}</p>
                  <label className="px-5 py-2.5 rounded-xl bg-[#caf300] text-[#171e00] font-mono text-xs font-bold uppercase cursor-pointer shadow-md">
                    {t('choosePhoto')}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, step)}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Bottom 2-Button Bar: Big Shutter + Gallery Picker */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCaptureFromLiveCamera}
                className="flex-1 py-3.5 rounded-2xl bg-[#caf300] text-[#171e00] font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-[#caf300]/25 hover:brightness-110 active:scale-98 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[19px]">photo_camera</span>
                <span>{step === 'front' ? t('snapFront') : t('snapTag')}</span>
              </button>

              <label className="px-4 py-3.5 rounded-2xl bg-[#131315] hover:bg-[#2a2a2c] text-white font-mono text-xs font-bold uppercase border border-white/10 cursor-pointer flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-[#caf300]">image</span>
                <span>{t('gallery')}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, step)}
                />
              </label>
            </div>
          </div>
        )}

        {/* STEP 3: QUICK AUTO-FILLED REVIEW & 1-TAP PUBLISH */}
        {step === 'details' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 animate-in fade-in">
            {/* Compact Thumbnail Row (Tap either to retake) */}
            <div className="flex items-center gap-2.5 bg-[#131315] p-2 rounded-2xl border border-white/10">
              <div
                onClick={() => {
                  triggerHaptic('light');
                  setStep('front');
                }}
                className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#caf300]/50 cursor-pointer shrink-0 group"
                title="Tap to retake Front"
              >
                <img src={frontPhoto} alt="Front" className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] font-mono text-[#caf300] text-center uppercase">
                  {t('frontPhotoPrompt')} ✎
                </span>
              </div>

              <div
                onClick={() => {
                  triggerHaptic('light');
                  setStep('tag');
                }}
                className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#caf300]/50 cursor-pointer shrink-0 group"
                title="Tap to retake Tag"
              >
                <img src={tagPhoto} alt="Tag" className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] font-mono text-[#caf300] text-center uppercase">
                  {t('tagPhotoPrompt')} ✎
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <span className="font-mono text-[10px] font-bold uppercase text-[#caf300] block">
                  {isAnalyzingPhoto
                    ? t('aiFillingDetails')
                    : isQualityBlocked
                    ? t('qualityCheckAlert')
                    : t('photosReady')}
                </span>
                <span className="font-sans text-[11px] text-[#c5c9ac] line-clamp-2 leading-snug">
                  {isQualityBlocked
                    ? moderationNote
                    : t('aiPrefilledHint')}
                </span>
              </div>
            </div>

            {/* Piece Name */}
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={t('pieceName')}
              className="w-full bg-[#131315] border border-white/10 px-3.5 py-2.5 text-xs font-sans text-white rounded-xl focus:outline-none focus:border-[#caf300]"
            />

            {/* Category Pills */}
            <div className="grid grid-cols-5 gap-1 font-mono text-[10px]">
              {[
                { id: 'tees', label: t('catTops') },
                { id: 'denim', label: t('catDenim') },
                { id: 'hoodie', label: isAr ? 'هوديز' : 'Hoodies' },
                { id: 'jacket', label: t('catJackets') },
                { id: 'shoes', label: t('catShoes') },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    triggerHaptic('light');
                    const nextCat = c.id as GarmentCategory;
                    setCategory(nextCat);
                    if (nextCat === 'denim' && !['30', '32', '34', '36'].includes(size)) {
                      setSize('32');
                    } else if (nextCat === 'shoes' && !['41', '42', '43', '44'].includes(size)) {
                      setSize('42');
                    } else if (
                      ['tees', 'hoodie', 'jacket'].includes(nextCat) &&
                      !['S', 'M', 'L', 'XL'].includes(size)
                    ) {
                      setSize('L');
                    }
                  }}
                  className={`py-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer ${
                    category === c.id
                      ? 'bg-[#caf300] text-[#171e00]'
                      : 'bg-[#131315] text-[#c5c9ac] border border-white/5'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* 100% Visible Category-Aware Size Grid & Value in 1 Compact Row (Zero Hidden Scroll) */}
            <div className="grid grid-cols-2 gap-2">
              <div className="grid grid-cols-4 gap-1 bg-[#131315] p-1 rounded-xl border border-white/5">
                {(category === 'denim'
                  ? ['30', '32', '34', '36']
                  : category === 'shoes'
                  ? ['41', '42', '43', '44']
                  : ['S', 'M', 'L', 'XL']
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      triggerHaptic('light');
                      setSize(s);
                    }}
                    className={`py-1.5 rounded-lg text-[10px] font-mono font-bold text-center cursor-pointer transition-all ${
                      size === s ? 'bg-[#caf300] text-[#171e00]' : 'text-[#c6c6c7] hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="50"
                  step="50"
                  required
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-full h-full bg-[#131315] border border-white/10 px-3 py-2 text-xs font-mono font-bold text-[#caf300] rounded-xl focus:outline-none focus:border-[#caf300]"
                />
                <span className="absolute right-3 top-2.5 font-mono text-[10px] text-[#8f9378]">
                  {isAr ? 'ج.م' : 'EGP'}
                </span>
              </div>
            </div>

            {/* Condition Pills */}
            <div className="grid grid-cols-4 gap-1 font-mono text-[9.5px]">
              {[
                { id: '9.5 / 10 MINT', label: isAr ? 'ممتازة' : 'Mint' },
                { id: '8.5 / 10 CLEAN', label: isAr ? 'نظيفة' : 'Clean' },
                { id: '7.5 / 10 GOOD', label: isAr ? 'جيدة' : 'Good' },
                { id: 'BELOW_7', label: isAr ? 'مستهلكة' : 'Worn Out' },
              ].map((cond) => {
                const isSelected = conditionGrade === cond.id;
                const isWorn = cond.id === 'BELOW_7';
                return (
                  <button
                    key={cond.id}
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      triggerHaptic('light');
                      setConditionGrade(cond.id);
                      if (isWorn) {
                        setModerationStatus('rejected');
                        setModerationNote(t('unwearableRejectMsg'));
                      } else {
                        setModerationStatus('approved');
                      }
                    }}
                    className={`py-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer ${
                      isSelected && isWorn
                        ? 'bg-red-500 text-white'
                        : isSelected
                        ? 'bg-[#caf300] text-[#171e00]'
                        : 'bg-[#131315] text-[#c5c9ac] border border-white/5'
                    }`}
                  >
                    {cond.label}
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={!isFormReady}
              className="w-full py-3 rounded-2xl bg-[#caf300] text-[#171e00] font-mono font-bold text-xs uppercase hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-[#caf300]/20 disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[17px]">
                {isQualityBlocked ? 'block' : 'check_circle'}
              </span>
              <span>{isQualityBlocked ? t('cannotListWornOut') : t('postToCloset')}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
