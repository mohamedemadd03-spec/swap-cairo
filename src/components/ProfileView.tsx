import React, { useState, useRef } from 'react';
import { User } from 'firebase/auth';
import { Garment, HubLocation, SwapOffer } from '../types/swap';
import { soundFX, triggerHaptic } from '../hooks/useSoundFX';
import { hapticEngine } from '../services/haptics';
import { useLanguage } from '../i18n/LanguageContext';
import { PWAInstallButton } from './PWAInstallButton';
import { calculateUserRank } from '../utils/progression';
import { authService } from '../services/authService';

interface ProfileViewProps {
  currentHub: HubLocation;
  allHubs: HubLocation[];
  onSelectHub: (hub: HubLocation) => void;
  stashedGarments: Garment[];
  onSelectGarment: (garment: Garment) => void;
  userTrustPoints?: number;
  currentUser?: any | null;
  completedSwapsCount?: number;
  completedOffers?: SwapOffer[];
  totalSavedAmount?: number;
  onClearDemoCloset?: () => void;
  onResetDemoData?: () => void;
  onSignOut?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentHub,
  allHubs,
  onSelectHub,
  stashedGarments,
  onSelectGarment,
  userTrustPoints = 50,
  currentUser,
  completedSwapsCount = 0,
  completedOffers = [],
  totalSavedAmount = 0,
  onClearDemoCloset,
  onResetDemoData,
  onSignOut,
}) => {
  const [hapticsEnabled, setHapticsEnabled] = useState(() => hapticEngine.getEnabled());
  const [activeSection, setActiveSection] = useState<'hubs' | 'receipts' | 'watchlist' | 'charter'>('hubs');
  const { language, setLanguage, toggleLanguage, t } = useLanguage();
  const isAr = language === 'ar';

  const [avatarUrl, setAvatarUrl] = useState(currentUser?.photoURL || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rankInfo = calculateUserRank(userTrustPoints);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawBase64 = event.target?.result as string;
      if (!rawBase64) {
        setIsUploadingAvatar(false);
        return;
      }

      const img = new Image();
      img.src = rawBase64;
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let { width, height } = img;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        setAvatarUrl(compressedDataUrl);
        triggerHaptic('trade');
        soundFX.playCash();

        if (currentUser?.uid) {
          const updated = { ...currentUser, photoURL: compressedDataUrl };
          authService.setStoredUser(updated);
          try {
            await fetch('/api/auth/update-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ uid: currentUser.uid, photoURL: compressedDataUrl }),
            });
          } catch (err) {
            console.warn('Profile sync warning:', err);
          }
        }
        setIsUploadingAvatar(false);
      };
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-[#131315] max-w-md mx-auto">
      <div className="flex flex-col w-full px-4 pb-6 gap-3.5">
        {/* Profile Header */}
        <section className="flex items-center justify-between pt-2">
          <h1 className="font-display font-bold text-xl uppercase tracking-tight text-white">
            {isAr ? 'البروفايل الشخصي' : 'My Profile'}
          </h1>
          <span className="px-2.5 py-0.5 bg-[#caf300]/15 text-[#caf300] font-mono font-bold text-[10.5px] uppercase rounded-full border border-[#caf300]/30">
            {t('level')} {rankInfo.level} • {rankInfo.currentPoints} {t('pts')}
          </span>
        </section>

        {/* User Card + Interactive Photo Upload */}
        <div className="p-3.5 rounded-xl bg-[#201f21] border border-[#26262e] flex flex-col gap-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()} title={isAr ? 'اضغط لتغيير الصورة الشخصية' : 'Tap to change avatar'}>
              <img
                src={
                  avatarUrl ||
                  currentUser?.photoURL ||
                  'https://api.dicebear.com/7.x/bottts/svg?seed=' + (currentUser?.handle || 'cairo')
                }
                alt="Profile avatar"
                className="w-16 h-16 rounded-full object-cover ring-2 ring-[#caf300] transition-transform active:scale-95"
              />
              <button
                type="button"
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#caf300] text-[#0c0b0e] flex items-center justify-center border-2 border-[#131315] shadow-md hover:scale-110 transition-transform"
                title={isAr ? 'تغيير صورتك' : 'Change photo'}
              >
                <span className="material-symbols-outlined text-[13px] font-bold">photo_camera</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-display font-bold text-base text-white truncate">
                  {currentUser?.displayName || currentUser?.handle || '@cairo_swapper'}
                </span>
                <span className="px-1.5 py-0.2 bg-[#caf300] text-[#171e00] font-mono text-[9.5px] font-bold rounded">
                  {currentUser?.phoneNumber ? (isAr ? 'رقم موثق 🇪🇬' : 'Verified Phone 🇪🇬') : (isAr ? 'موثق' : 'Verified')}
                </span>
              </div>
              <span className="font-mono text-xs text-[#c5c9ac] truncate mt-0.5">
                {currentUser?.phoneNumber ? `📞 ${currentUser.phoneNumber}` : (currentUser?.handle || '@ziad_cairo')}
              </span>
              <span className="font-mono text-[11px] text-[#caf300] mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">location_on</span>
                <span>{isAr ? 'نقطتك:' : 'Your Hub:'} {currentHub.name}</span>
              </span>
            </div>
          </div>

          {/* Gamified Trust & Forgiveness Progress Bar */}
          <div className="p-2.5 rounded-lg bg-[#131315] border border-white/5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="text-[#caf300] font-bold uppercase">
                {isAr ? rankInfo.currentTier.titleAr : rankInfo.currentTier.titleEn} ({isAr ? 'المستوى' : 'Level'} {rankInfo.level})
              </span>
              <span className="text-[#c5c9ac]">
                {rankInfo.nextTier ? (isAr ? `${rankInfo.pointsToNext} نقطة للمستوى التالي` : `${rankInfo.pointsToNext} pts to next level`) : (isAr ? 'أعلى تصنيف' : 'Top Rank')}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#201f21] overflow-hidden">
              <div
                className="h-full bg-[#caf300] transition-all duration-500"
                style={{ width: `${Math.max(8, rankInfo.progressPercent)}%` }}
              />
            </div>
            <span className="font-mono text-[9.5px] text-[#8f9378]">
              ⚡ {isAr ? rankInfo.currentTier.perkAr : rankInfo.currentTier.perkEn}
            </span>
          </div>

          {/* Environmental & Financial Impact Bento */}
          <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-center font-mono">
            <div className="p-2 bg-[#1c1b1d] rounded-lg border border-white/5">
              <span className="text-[10px] text-[#c5c9ac] uppercase block">{isAr ? 'التبادلات' : 'Swaps'}</span>
              <span className="text-base font-bold text-white">{completedSwapsCount}</span>
              <span className="text-[9px] text-[#caf300] block">
                {completedSwapsCount > 0 ? '★ 5.0' : (isAr ? 'جديد' : 'New')}
              </span>
            </div>
            <div className="p-2 bg-[#1c1b1d] rounded-lg border border-white/5">
              <span className="text-[10px] text-[#c5c9ac] uppercase block">{isAr ? 'نقاط الثقة' : 'Trust Points'}</span>
              <span className="text-base font-bold text-[#caf300]">{userTrustPoints}</span>
              <span className="text-[9px] text-[#c5c9ac] block">{isAr ? '+50 كل مقابلة' : '+50 per meet'}</span>
            </div>
            <div className="p-2 bg-[#1c1b1d] rounded-lg border border-white/5">
              <span className="text-[10px] text-[#c5c9ac] uppercase block">{isAr ? 'وفرت' : 'Saved'}</span>
              <span className="text-base font-bold text-white">
                {totalSavedAmount && totalSavedAmount > 0
                  ? totalSavedAmount >= 1000
                    ? `${(totalSavedAmount / 1000).toFixed(1)}k`
                    : `${totalSavedAmount}`
                  : '0'}
              </span>
              <span className="text-[9px] text-[#c5c9ac] block">{isAr ? 'جنيه مقارنة بالسوق' : 'EGP vs retail'}</span>
            </div>
          </div>
        </div>

        {/* 4-Tab Mobile Feature Switcher */}
        <div className="grid grid-cols-4 p-1 rounded-2xl bg-[#201f21] border border-white/10 font-mono text-[9.5px]">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              soundFX.playClick();
              setActiveSection('hubs');
            }}
            className={`py-2 px-1 rounded-xl font-bold uppercase cursor-pointer transition-all flex items-center justify-center gap-1 ${
              activeSection === 'hubs'
                ? 'bg-[#caf300] text-[#171e00] shadow-sm'
                : 'text-[#c5c9ac] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[12px]">radar</span>
            <span>{t('hubsTab')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              soundFX.playClick();
              setActiveSection('receipts');
            }}
            className={`py-2 px-1 rounded-xl font-bold uppercase cursor-pointer transition-all flex items-center justify-center gap-1 ${
              activeSection === 'receipts'
                ? 'bg-[#caf300] text-[#171e00] shadow-sm'
                : 'text-[#c5c9ac] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[12px]">handshake</span>
            <span>{t('receiptsTab')} ({completedOffers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              soundFX.playClick();
              setActiveSection('watchlist');
            }}
            className={`py-2 px-1 rounded-xl font-bold uppercase cursor-pointer transition-all flex items-center justify-center gap-1 ${
              activeSection === 'watchlist'
                ? 'bg-[#caf300] text-[#171e00] shadow-sm'
                : 'text-[#c5c9ac] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[12px]">bookmark</span>
            <span>{t('savedTab')} ({stashedGarments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              soundFX.playClick();
              setActiveSection('charter');
            }}
            className={`py-2 px-1 rounded-xl font-bold uppercase cursor-pointer transition-all flex items-center justify-center gap-1 ${
              activeSection === 'charter'
                ? 'bg-[#caf300] text-[#171e00] shadow-sm'
                : 'text-[#c5c9ac] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[12px]">gavel</span>
            <span>{t('legalTab')}</span>
          </button>
        </div>

        {/* SECTION 2: COMPLETED HANDSHAKE RECEIPTS LOG */}
        {activeSection === 'receipts' && (
          <section className="flex flex-col gap-2 font-mono animate-in fade-in">
            {completedOffers.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#201f21] border border-[#26262e] text-center text-xs text-[#c5c9ac]">
                {isAr
                  ? 'لا توجد إيصالات هاندشيك مسجلة بعد. أكمل مقابلة تبادل لتسجيل أول إيصال رسمي هنا.'
                  : 'No handshake receipts recorded yet. Complete an in-person barter to log your first official receipt here.'}
              </div>
            ) : (
              completedOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="p-3 rounded-xl bg-[#201f21] border border-[#caf300]/30 flex flex-col gap-2 shadow-sm"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#caf300] font-bold uppercase flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">handshake</span>
                      <span>
                        {offer.status === 'completed'
                          ? (isAr ? 'هاندشيك موثق' : 'Verified Handshake')
                          : (isAr ? 'صفقة مؤكدة' : 'Confirmed Deal')}{' '}
                        // #{offer.securityPassCode || 'SWP-7740'}
                      </span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#caf300]/15 text-[#caf300] font-bold">
                      {isAr ? '+50 نقطة' : '+50 Pts'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-[#131315] border border-white/5 text-[10px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={offer.yourItem.imageUrl}
                        alt={offer.yourItem.title}
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[8.5px] text-[#8f9378] uppercase block">
                          {isAr ? 'الطرف الراسل' : 'Sender Item'}
                        </span>
                        <span className="font-sans text-xs font-bold text-white truncate block">
                          {offer.yourItem.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 min-w-0 border-l border-white/10 pl-2">
                      <img
                        src={offer.theirItem.imageUrl}
                        alt={offer.theirItem.title}
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[8.5px] text-[#caf300] uppercase block font-bold">
                          {isAr ? 'الطرف المستلم' : 'Receiver Item'}
                        </span>
                        <span className="font-sans text-xs font-bold text-white truncate block">
                          {offer.theirItem.title}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Verified Handshake Badge & Trust Stamp */}
                  <div className="p-2.5 rounded-xl bg-[#131315] border border-[#caf300]/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 font-mono">
                      <div className="w-8 h-8 rounded-lg bg-[#caf300]/10 border border-[#caf300]/30 flex items-center justify-center text-[#caf300] shrink-0">
                        <span className="material-symbols-outlined text-[16px]">handshake</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-[#caf300] uppercase font-bold flex items-center gap-1">
                          <span>✓ {t('cairoVerifiedStamp')}</span>
                        </span>
                        <p className="font-sans text-[11px] font-bold text-white truncate mt-0.5">
                          {offer.theirItem.title} ⇄ {offer.yourItem.title}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#caf300]/20 text-[#caf300] font-mono text-[9px] font-bold uppercase shrink-0">
                      {isAr ? '+50 نقطة' : '+50 Pts'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[9.5px] text-[#c5c9ac]">
                    <span>{isAr ? 'الطرف الآخر:' : 'Partner:'} @{offer.partner.handle}</span>
                    <span>{offer.hubLocation || currentHub.name}</span>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* SECTION 1: HUBS & SENSORY CONTROLS */}
        {activeSection === 'hubs' && (
          <div className="flex flex-col gap-3 animate-in fade-in">
            {/* Partner Cafés, Vintage Stores & Safe Meetup Spots */}
            <section className="p-3 rounded-xl bg-[#201f21] border border-[#26262e] flex flex-col gap-2 shadow-sm">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-white font-bold uppercase">{isAr ? 'نقاط ومقاهي التبادل المعتمدة' : 'Partner Meetup Spots'}</span>
                <span className="text-[#caf300] font-semibold">{currentHub.activeSwappers} {isAr ? 'متواجدين حالياً' : 'Nearby'}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                {allHubs.map((hub) => (
                  <button
                    key={hub.id}
                    onClick={() => {
                      soundFX.playClick();
                      onSelectHub(hub);
                    }}
                    className={`p-2.5 text-left font-mono text-xs rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      currentHub.id === hub.id
                        ? 'bg-[#2a2a2c] border-[#caf300] text-white shadow-sm'
                        : 'bg-[#1c1b1d] border-white/5 text-[#c6c6c7] hover:text-white'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold truncate">{hub.name}</span>
                      <span className="text-[10px] text-[#c5c9ac] truncate">{hub.address}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 bg-[#201f21] rounded text-[10px] text-[#caf300] font-bold">
                        {hub.distance}
                      </span>
                      <div className="text-[9px] text-[#c5c9ac] mt-0.5">{hub.hours}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* SECTION 2: SAVED WATCHLIST */}
        {activeSection === 'watchlist' && (
          <section className="flex flex-col gap-2 font-mono animate-in fade-in">
            {stashedGarments.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#201f21] border border-[#26262e] text-center text-xs text-[#c5c9ac]">
                {isAr
                  ? 'لا توجد قطع محفوظة بعد. اضغط على علامة الحفظ في الاستكشاف لحفظ القطع هنا.'
                  : 'No saved garments yet. Tap the bookmark icon in Discover to save pieces here.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {stashedGarments.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => onSelectGarment(g)}
                    className="p-2 bg-[#201f21] border border-[#26262e] rounded-xl flex flex-col gap-1.5 cursor-pointer hover:border-[#caf300] transition-colors"
                  >
                    <div
                      className="w-full h-28 bg-cover bg-center rounded-lg border border-white/5"
                      style={{ backgroundImage: `url('${g.imageUrl}')` }}
                    />
                    <div className="font-display font-bold text-xs uppercase text-white truncate">
                      {g.title}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#c5c9ac]">
                      <span>Size {g.size}</span>
                      <span className="text-[#caf300] font-bold">{g.estValue} EGP</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECTION 3: LEGAL POLICIES & BALANCED AI CHARTER */}
        {activeSection === 'charter' && (
          <section className="p-3 rounded-xl bg-[#201f21] border border-[#26262e] flex flex-col gap-2 shadow-sm animate-in fade-in font-sans text-xs text-[#c5c9ac]">
            <div className="p-2.5 rounded-lg bg-[#131315] border border-white/5">
              <span className="font-mono text-[10px] text-[#caf300] font-bold uppercase block mb-0.5">
                {isAr ? '1. رقابة ذكية ومتوازنة' : '1. Balanced & Measured AI Moderation'}
              </span>
              <p className="text-[11px] leading-relaxed">
                {isAr
                  ? 'مساعد الذكاء الاصطناعي يقوم بملء مواصفات القطعة تلقائياً ويحظر فقط المحتوى غير اللائق أو الأشياء غير الملبوسة. التعتيق الفينتدج الطبيعي مرحب به بالكامل.'
                  : 'Our AI assistant auto-fills garment specs and blocks only strictly prohibited content (NSFW imagery, non-clothing objects, or unwearably trashed rags). Authentic vintage fade, natural lighting, and normal wear are welcomed.'}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-[#131315] border border-white/5">
              <span className="font-mono text-[10px] text-[#caf300] font-bold uppercase block mb-0.5">
                {isAr ? '2. فحص شخصي وإلغاء بدون عقوبات' : '2. In-Person Inspection & Zero-Penalty Cancellation'}
              </span>
              <p className="text-[11px] leading-relaxed">
                {isAr
                  ? 'جميع الصفقات غير ملزمة حتى يقابل السوابرز بعضهما وجهاً لوجه ويفحصا الملابس ويفعلا الـ QR Handshake. يمكن لأي طرف الإلغاء إذا كانت القطعة غير مطابقة.'
                  : 'All trades are non-binding until both swappers inspect the physical garments in person and scan the QR Handshake. Either party may cancel if a spot is too far or an item does not match its photos, and locked closet items immediately return to Available.'}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-[#131315] border border-white/5">
              <span className="font-mono text-[10px] text-[#caf300] font-bold uppercase block mb-0.5">
                {isAr ? '3. أمان اللقاءات العامة وخصوصية الـ GPS' : '3. Public Meetup Safety & GPS Privacy'}
              </span>
              <p className="text-[11px] leading-relaxed">
                {isAr
                  ? 'اللقاءات تتم فقط في المقاهي ونقاط التبادل الشريكة المضاءة. موقع الـ GPS المباشر لا يشارك إلا أثناء المقابلة النشطة فقط لحمايتك.'
                  : 'Meet only in public partner cafés, hubs, or well-lit stations. Live GPS Radar pins are shared strictly on-demand inside your active trade chat and are never broadcast publicly.'}
              </p>
            </div>
          </section>
        )}

        {/* Settings & Preferences (Language & Haptics) */}
        <section className="p-3.5 rounded-xl bg-[#201f21] border border-[#26262e] flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-white font-bold uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#caf300]">settings</span>
              <span>{language === 'ar' ? 'الإعدادات (SETTINGS)' : 'SETTINGS & PREFERENCES'}</span>
            </span>
          </div>

          {/* 1. Language Preference */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#131315] border border-white/5 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#caf300] text-[18px]">translate</span>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {language === 'ar' ? 'لغة التطبيق' : 'App Language'}
                  </span>
                  <span className="text-[9.5px] text-[#8f9378] block">
                    {language === 'ar'
                      ? 'العربية (لهجة الشارع والقاهرة)'
                      : 'English (International)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  soundFX.playClick();
                  setLanguage('ar');
                }}
                className={`py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                  language === 'ar'
                    ? 'bg-[#caf300] text-black shadow-sm font-black'
                    : 'bg-[#1c1b1f] hover:bg-[#28272b] text-[#c5c9ac] border border-white/5'
                }`}
              >
                <span className="text-sm">🇪🇬</span>
                <span>العربية (AR)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  soundFX.playClick();
                  setLanguage('en');
                }}
                className={`py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                  language === 'en'
                    ? 'bg-[#caf300] text-black shadow-sm font-black'
                    : 'bg-[#1c1b1f] hover:bg-[#28272b] text-[#c5c9ac] border border-white/5'
                }`}
              >
                <span className="text-sm">🇬🇧</span>
                <span>English (EN)</span>
              </button>
            </div>
          </div>

          {/* 2. Haptic Engine (Strictly ON / OFF) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#131315] border border-white/5 font-mono">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#caf300] text-[18px]">vibration</span>
              <div>
                <span className="text-xs font-bold text-white block">
                  {language === 'ar' ? 'الاهتزاز والتفاعل (Haptics)' : 'Haptic Feedback'}
                </span>
                <span className="text-[9.5px] text-[#8f9378] block">
                  {language === 'ar' ? 'اهتزاز لمسي سريع لـ iPhone & Android' : 'Optimized for iOS & Android'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = hapticEngine.toggle();
                setHapticsEnabled(next);
                if (next) {
                  triggerHaptic('medium');
                }
                soundFX.playClick();
              }}
              className={`px-4 py-1.5 rounded-full font-mono text-xs font-black uppercase cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${
                hapticsEnabled
                  ? 'bg-[#caf300] text-[#0c0b0e] shadow-[0_0_12px_rgba(202,243,0,0.3)]'
                  : 'bg-[#1c1b20] text-[#8f9378] border border-white/10'
              }`}
            >
              <span className={`inline-block w-2 h-2 rounded-full ${hapticsEnabled ? 'bg-[#0c0b0e]' : 'bg-[#8f9378]'}`} />
              <span>{hapticsEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* PWA Mobile Installation Trigger */}
          <PWAInstallButton />
        </section>

        {/* Account Session Controls */}
        <section className="p-3.5 rounded-xl bg-[#201f21] border border-[#26262e] flex flex-col gap-2.5 shadow-sm font-mono">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white font-bold uppercase">إدارة الحساب والجلسة</span>
            <span className="text-[#caf300] text-[10px]">
              {currentUser?.phoneNumber ? `موثق: ${currentUser.phoneNumber}` : 'حساب نشط'}
            </span>
          </div>

          {onSignOut && (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                triggerHaptic('medium');
                onSignOut();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-[#131315] hover:bg-red-500/20 text-[#8f9378] hover:text-red-300 border border-white/10 text-xs font-bold uppercase cursor-pointer transition-colors flex items-center justify-center gap-2 active:scale-98"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>تسجيل الخروج من الحساب</span>
            </button>
          )}

          {/* Admin Moderation Desk: STRICTLY FOR AUTHORIZED SYSTEM ADMINS ONLY */}
          {(currentUser?.role === 'admin' || currentUser?.isAdmin === true) && (
            <div className="pt-2 border-t border-white/5">
              <a
                href="/admin"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  soundFX.playClick();
                  triggerHaptic('medium');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#0d0c0f] hover:bg-[#1a191f] text-[#caf300] border border-[#caf300]/30 text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                  <span>{language === 'ar' ? 'لوحة تحكم الإدارة (ADMIN DESK)' : 'ADMIN COMMAND DESK'}</span>
                </div>
                <span className="text-[10px] text-[#8f9378]">ADMIN ONLY ↗</span>
              </a>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};
