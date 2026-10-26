import React, { useState, useEffect } from 'react';
import { ModerationReport } from '../../types/swap';
import { soundFX, triggerHaptic } from '../../hooks/useSoundFX';
import { useLanguage } from '../../i18n/LanguageContext';

interface ModerationDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGarmentDeleted?: (garmentId: string) => void;
  onGarmentRestored?: (garmentId: string) => void;
}

export const ModerationDeskModal: React.FC<ModerationDeskModalProps> = ({
  isOpen,
  onClose,
  onGarmentDeleted,
  onGarmentRestored,
}) => {
  const { language } = useLanguage();
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.success && Array.isArray(data.reports)) {
        setReports(data.reports);
      }
    } catch (err) {
      console.warn('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResolve = async (reportId: string, action: 'delete' | 'dismiss', garmentId: string) => {
    setActionInProgress(reportId);
    triggerHaptic(action === 'delete' ? 'heavy' : 'light');
    if (action === 'delete') {
      soundFX.playCash();
    } else {
      soundFX.playClick();
    }

    try {
      const res = await fetch(`/api/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? {
                  ...r,
                  status: action === 'delete' ? 'resolved_deleted' : 'resolved_dismissed',
                  resolvedAt: new Date().toISOString(),
                }
              : r
          )
        );

        if (action === 'delete') {
          onGarmentDeleted?.(garmentId);
        } else {
          onGarmentRestored?.(garmentId);
        }
      }
    } catch (err) {
      console.error('Failed to resolve report:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const displayedReports = reports.filter((r) => (filter === 'pending' ? r.status === 'pending' : true));
  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-[#131317] border-2 border-[#caf300] p-4 sm:p-5 flex flex-col gap-3 font-mono shadow-[0_20px_60px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2A33] pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#caf300] text-xl">shield</span>
            <div>
              <span className="font-display font-black text-base sm:text-lg uppercase text-white block">
                {language === 'ar' ? 'لوحة البلاغات والإشراف' : 'MODERATION DESK'}
              </span>
              <span className="text-[10px] text-[#c5c9ac] block">
                {language === 'ar'
                  ? `فحص وإدارة شكاوى وبلاغات المستخدمين (${pendingCount} معلق)`
                  : `User reports & listing compliance (${pendingCount} pending)`}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            aria-label="Close moderation desk"
            className="w-8 h-8 flex items-center justify-center text-[#c5c9ac] hover:text-white border border-[#2A2A33] hover:border-white/20 rounded-lg cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* 3-Step Procedure Info Card */}
        <div className="p-3 bg-[#1c1b1f] border border-[#caf300]/20 rounded-xl text-[10px] flex flex-col gap-1.5 leading-relaxed">
          <div className="flex items-center gap-1.5 text-[#caf300] font-bold uppercase">
            <span className="material-symbols-outlined text-[14px]">info</span>
            <span>{language === 'ar' ? 'إجراءات السيستم عند الإبلاغ:' : 'System Moderation Protocol:'}</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[#c5c9ac]">
            <li>
              <strong className="text-white">
                {language === 'ar' ? 'حجب فوري تلقائي:' : 'Instant Auto-Quarantine:'}
              </strong>{' '}
              {language === 'ar'
                ? 'القطعة تختفي فوراً من شاشة المبلّغ وتتجمد العروض المرتبطة بها لحماية التعاملات.'
                : 'Item is instantly hidden from user feed and active offers are frozen.'}
            </li>
            <li>
              <strong className="text-white">
                {language === 'ar' ? 'تسجيل البلاغ بالسيرفر:' : 'Server Recording:'}
              </strong>{' '}
              {language === 'ar'
                ? 'يتم توثيق تفاصيل الشكوى وصور القطعة وتاريخ البلاغ في قاعدة البيانات.'
                : 'Report details, reason, and photo evidence are stored persistently on server.'}
            </li>
            <li>
              <strong className="text-white">
                {language === 'ar' ? 'مراجعة الأدمن واتخاذ القرار:' : 'Admin Adjudication:'}
              </strong>{' '}
              {language === 'ar'
                ? 'يمكنك فحص القطعة واختيار إما الحذف النهائي من التطبيق، أو فك الحجب والاستمرار.'
                : 'Review details and either permanently delete the item or dismiss and restore it.'}
            </li>
          </ol>
        </div>

        {/* Filter Tabs */}
        <div className="flex border border-neutral-800 bg-[#0c0c0e] p-1 gap-1 text-[10.5px] uppercase font-bold rounded-xl">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              soundFX.playClick();
              setFilter('pending');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              filter === 'pending' ? 'bg-[#caf300] text-black font-black' : 'text-[#c5c9ac] hover:text-white'
            }`}
          >
            <span>{language === 'ar' ? 'قيد المراجعة' : 'Pending'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/20 text-current font-mono">
              {pendingCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              soundFX.playClick();
              setFilter('all');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-[#caf300] text-black font-black' : 'text-[#c5c9ac] hover:text-white'
            }`}
          >
            {language === 'ar' ? 'كل السجل' : 'All History'} ({reports.length})
          </button>
        </div>

        {/* Reports List */}
        <div className="flex flex-col gap-2.5 overflow-y-auto pr-1 flex-1 min-h-[220px]">
          {loading && (
            <div className="text-center py-8 text-xs text-[#c5c9ac] animate-pulse">
              {language === 'ar' ? 'جارٍ تحميل البلاغات...' : 'Loading reports...'}
            </div>
          )}

          {!loading && displayedReports.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-white/5 rounded-xl bg-[#0e0e11] gap-2">
              <span className="material-symbols-outlined text-4xl text-[#caf300]">verified</span>
              <span className="font-bold text-white text-sm">
                {language === 'ar' ? 'لا توجد بلاغات معلقة حالياً' : 'No Pending Reports'}
              </span>
              <p className="text-[11px] text-[#8f9378] max-w-xs">
                {language === 'ar'
                  ? 'مجتمع سواب نظيف ومطابق لمعايير الشارع والقطع الأصلية.'
                  : 'The community is clean. All active listings comply with archive standards.'}
              </p>
            </div>
          )}

          {!loading &&
            displayedReports.map((report) => {
              const isPending = report.status === 'pending';
              const isDeleted = report.status === 'resolved_deleted';
              const isBusy = actionInProgress === report.id;

              return (
                <div
                  key={report.id}
                  className={`p-3 rounded-xl border flex flex-col gap-2.5 transition-all ${
                    isPending
                      ? 'bg-[#18181b] border-[#caf300]/40 shadow-sm'
                      : isDeleted
                      ? 'bg-[#121113] border-red-500/30 opacity-70'
                      : 'bg-[#121113] border-white/10 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {report.garmentImageUrl ? (
                        <img
                          src={report.garmentImageUrl}
                          alt={report.garmentTitle}
                          className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#201f21] border border-white/10 flex items-center justify-center text-[#caf300] shrink-0">
                          <span className="material-symbols-outlined text-xl">styler</span>
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate">{report.garmentTitle}</span>
                        <span className="text-[10px] text-[#caf300] font-mono">
                          {language === 'ar' ? 'صاحب القطعة:' : 'Owner:'} {report.garmentOwnerHandle}
                        </span>
                        <span className="text-[9.5px] text-[#8f9378]">
                          {language === 'ar' ? 'أُبلغ بواسطة:' : 'Reported by:'} {report.reportedBy} •{' '}
                          {new Date(report.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase shrink-0 ${
                        isPending
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : isDeleted
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isPending
                        ? language === 'ar'
                          ? 'قيد المراجعة'
                          : 'Pending'
                        : isDeleted
                        ? language === 'ar'
                          ? 'تم الحذف'
                          : 'Deleted'
                        : language === 'ar'
                        ? 'تم التجاهل'
                        : 'Dismissed'}
                    </span>
                  </div>

                  {/* Reason Callout */}
                  <div className="p-2 rounded-lg bg-[#0e0e11] border border-white/5 flex items-start gap-1.5 text-[10.5px]">
                    <span className="material-symbols-outlined text-red-400 text-[14px] shrink-0 mt-0.5">
                      report_problem
                    </span>
                    <span className="text-white font-medium break-words">
                      <strong className="text-red-400">{language === 'ar' ? 'السبب:' : 'Reason:'}</strong>{' '}
                      {report.reason}
                    </span>
                  </div>

                  {/* Action Controls (Only available when report is pending) */}
                  {isPending && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleResolve(report.id, 'delete', report.garmentId)}
                        className="py-2 px-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/50 text-[10.5px] font-bold uppercase flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[13px]">delete_forever</span>
                        <span>{language === 'ar' ? 'حذف القطعة نهائياً' : 'Delete Item'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleResolve(report.id, 'dismiss', report.garmentId)}
                        className="py-2 px-2.5 rounded-xl bg-[#201f21] hover:bg-[#28272b] text-[#c5c9ac] hover:text-white border border-white/10 text-[10.5px] font-bold uppercase flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        <span>{language === 'ar' ? 'تجاهل واستعادة' : 'Dismiss & Restore'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#2A2A33] flex justify-end">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-[#201f21] hover:bg-[#28272b] text-white font-bold text-xs uppercase cursor-pointer border border-white/10 transition-colors"
          >
            {language === 'ar' ? 'إغلاق اللوحة' : 'Close Desk'}
          </button>
        </div>
      </div>
    </div>
  );
};
