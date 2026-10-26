import React, { useState, useEffect } from 'react';
import { LiveRadarPulse, TelemetryEvent } from '../../types/swap';
import { telemetryService } from '../../services/telemetry';
import { soundFX } from '../../hooks/useSoundFX';
import { useLanguage } from '../../i18n/LanguageContext';

interface LiveRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveRadarModal: React.FC<LiveRadarModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const [pulse, setPulse] = useState<LiveRadarPulse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const isAr = language === 'ar';

  const loadData = async () => {
    setIsLoading(true);
    const data = await telemetryService.fetchPulse();
    if (data) setPulse(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    loadData();

    if (!autoRefresh) return;
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [isOpen, autoRefresh]);

  if (!isOpen) return null;

  const handleClear = async () => {
    if (confirm(isAr ? 'هل أنت متأكد من مسح سجل العمليات؟' : 'Clear all telemetry logs?')) {
      await telemetryService.clearLogs();
      loadData();
    }
  };

  const getEventBadge = (event: TelemetryEvent) => {
    switch (event.type) {
      case 'session_enter':
        return {
          label: isAr ? 'دخول جديد' : 'Enter',
          className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          icon: 'login',
        };
      case 'view_item':
        return {
          label: isAr ? 'معاينة' : 'Inspect',
          className: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
          icon: 'visibility',
        };
      case 'offer_created':
        return {
          label: isAr ? 'عرض سواب' : 'Offer',
          className: 'bg-[#caf300]/20 text-[#caf300] border-[#caf300]/40',
          icon: 'swap_horiz',
        };
      case 'handshake_completed':
        return {
          label: isAr ? 'هاند شيك ✓' : 'Handshake',
          className: 'bg-emerald-500/30 text-emerald-300 border-emerald-400',
          icon: 'handshake',
        };
      case 'fit_check_uploaded':
        return {
          label: isAr ? 'فيت تشيك' : 'Fit Check',
          className: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: 'photo_camera',
        };
      default:
        return {
          label: isAr ? 'نبض' : 'Pulse',
          className: 'bg-white/10 text-white/70 border-white/10',
          icon: 'radar',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="w-full max-w-lg bg-[#131315] border border-[#2a2a2c] rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-[#2a2a2c] flex items-center justify-between bg-[#18181b]">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-3 h-3">
              <span className="absolute w-3 h-3 rounded-full bg-[#caf300] opacity-75 animate-ping" />
              <span className="relative w-2 h-2 rounded-full bg-[#caf300]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                  {isAr ? 'رادار سواب المباشر' : 'SWAP Live Telemetry'}
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#caf300]/15 text-[#caf300] border border-[#caf300]/30 font-bold uppercase">
                  MCP Telemetry
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#8f9378] block">
                {isAr ? 'مراقبة حركة المستخدمين والسيرفر لحظياً' : 'Real-time active users & live traffic'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Live Metrics Bento */}
        <div className="p-4 border-b border-[#2a2a2c] bg-[#161618]">
          <div className="grid grid-cols-4 gap-2 text-center font-mono">
            {/* Online Now */}
            <div className="p-2.5 rounded-xl bg-[#1c1b1f] border border-[#caf300]/30 flex flex-col justify-center">
              <span className="text-[9px] text-[#c5c9ac] uppercase block font-bold">
                {isAr ? 'متصل الآن' : 'Online'}
              </span>
              <span className="text-xl font-black text-[#caf300] mt-0.5">
                {pulse ? pulse.onlineCount : '--'}
              </span>
              <span className="text-[8px] text-emerald-400 block mt-0.5 font-bold">
                ● {isAr ? 'لايف' : 'LIVE'}
              </span>
            </div>

            {/* Total Visits */}
            <div className="p-2.5 rounded-xl bg-[#1c1b1f] border border-white/5 flex flex-col justify-center">
              <span className="text-[9px] text-[#c5c9ac] uppercase block">
                {isAr ? 'زيارات' : 'Visits'}
              </span>
              <span className="text-xl font-black text-white mt-0.5">
                {pulse ? pulse.stats.totalVisits : '--'}
              </span>
              <span className="text-[8px] text-[#8f9378] block mt-0.5">Unique</span>
            </div>

            {/* Total Offers */}
            <div className="p-2.5 rounded-xl bg-[#1c1b1f] border border-white/5 flex flex-col justify-center">
              <span className="text-[9px] text-[#c5c9ac] uppercase block">
                {isAr ? 'عروض' : 'Offers'}
              </span>
              <span className="text-xl font-black text-white mt-0.5">
                {pulse ? pulse.stats.totalOffers : '--'}
              </span>
              <span className="text-[8px] text-[#8f9378] block mt-0.5">Active</span>
            </div>

            {/* Handshakes */}
            <div className="p-2.5 rounded-xl bg-[#1c1b1f] border border-white/5 flex flex-col justify-center">
              <span className="text-[9px] text-[#c5c9ac] uppercase block">
                {isAr ? 'هاند شيك' : 'Handshakes'}
              </span>
              <span className="text-xl font-black text-[#caf300] mt-0.5">
                {pulse ? pulse.stats.totalHandshakes : '--'}
              </span>
              <span className="text-[8px] text-emerald-400 block mt-0.5">Verified</span>
            </div>
          </div>
        </div>

        {/* Live Controls Bar */}
        <div className="px-4 py-2 bg-[#141416] border-b border-[#2a2a2c] flex items-center justify-between font-mono text-[10px]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                autoRefresh
                  ? 'bg-[#caf300]/15 text-[#caf300] border-[#caf300]/40'
                  : 'bg-white/5 text-[#8f9378] border-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">
                {autoRefresh ? 'sync' : 'sync_disabled'}
              </span>
              <span>{autoRefresh ? (isAr ? 'تحديث تلقائي (4ث)' : 'Auto-Sync ON') : (isAr ? 'تحديث يدوي' : 'Manual')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                loadData();
              }}
              disabled={isLoading}
              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 cursor-pointer transition-colors"
            >
              {isLoading ? '...' : (isAr ? 'تحديث الآن' : 'Refresh')}
            </button>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="text-[9.5px] text-red-400/80 hover:text-red-300 cursor-pointer"
          >
            {isAr ? 'مسح السجل' : 'Clear Logs'}
          </button>
        </div>

        {/* Live Event Stream Terminal */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 min-h-[220px]">
          {!pulse || pulse.recentEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#8f9378] font-mono text-xs">
              <span className="material-symbols-outlined text-3xl mb-2 text-white/20">radar</span>
              <span>{isAr ? 'لا توجد حركات مسجلة بعد' : 'Waiting for incoming telemetry events...'}</span>
              <span className="text-[10px] text-white/30 mt-1">
                {isAr ? 'أي حركة في التطبيق ستظهر هنا فوراً' : 'Live interactions will stream here in real time'}
              </span>
            </div>
          ) : (
            pulse.recentEvents.map((evt) => {
              const badge = getEventBadge(evt);
              const timeString = new Date(evt.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-xl bg-[#18181b] border border-white/5 flex items-start justify-between gap-3 font-mono text-xs hover:border-white/10 transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold border uppercase shrink-0 flex items-center gap-1 ${badge.className}`}
                    >
                      <span className="material-symbols-outlined text-[11px]">{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>

                    <div className="min-w-0">
                      <p className="font-sans text-xs font-semibold text-white truncate">
                        {isAr ? evt.summaryAr : evt.summaryEn}
                      </p>
                      <div className="flex items-center gap-2 text-[9.5px] text-[#8f9378] mt-0.5">
                        <span className="text-[#caf300] font-bold">{evt.userHandle}</span>
                        <span>•</span>
                        <span>{evt.device}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[9.5px] text-[#8f9378] shrink-0 font-mono">
                    {timeString}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* MCP Explainer Footer */}
        <div className="p-3 bg-[#111113] border-t border-[#2a2a2c] flex items-center gap-2 text-[10.5px] font-mono text-[#c5c9ac]">
          <span className="material-symbols-outlined text-[#caf300] text-[16px] shrink-0">smart_toy</span>
          <span>
            {isAr
              ? '💡 ميزة الـ MCP: اسألني في الشات "مين فتح الأبلكيشن النهاردة؟" وهجاوبك لايف!'
              : '💡 MCP Active: Ask your AI assistant "Who visited today?" for live conversational reports!'}
          </span>
        </div>
      </div>
    </div>
  );
};
