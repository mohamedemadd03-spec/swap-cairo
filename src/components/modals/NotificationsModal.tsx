import React, { useState } from 'react';
import { SwapOffer } from '../../types/swap';
import { soundFX, triggerHaptic } from '../../hooks/useSoundFX';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  offers: SwapOffer[];
  actionableOffers?: SwapOffer[];
  onAcceptOffer: (offerId: string) => void;
  onDeclineOffer: (offerId: string) => void;
  onOpenChat: (offer: SwapOffer) => void;
  onEditOffer?: (offer: SwapOffer) => void;
  onStandFirm?: (offerId: string) => void;
  onSweetenOffer?: (offerId: string, extraTeeTitle: string, cashExtra: number) => void;
  onSimulateIncomingOffer?: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  offers,
  actionableOffers,
  onAcceptOffer,
  onDeclineOffer,
  onOpenChat,
}) => {
  const [pushStatus, setPushStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );

  if (!isOpen) return null;

  const incomingOffers =
    actionableOffers ??
    offers.filter(
      (o) => o.direction !== 'sent' && (o.status === 'pending' || o.status === 'maybe')
    );

  const pastOffers = offers.filter(
    (o) => o.status === 'accepted' || o.status === 'completed' || o.status === 'declined'
  );

  const handleRequestPushPermission = async () => {
    soundFX.playClick();
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPushStatus(perm);
        if (perm === 'granted') {
          soundFX.playMatch();
          new Notification('swap. Notifications Enabled', {
            body: 'You will receive instant notifications for incoming trades with direct Accept / Decline actions.',
            icon: '/assets/aistudio/Image_1_3ba5c951.png',
          });
        }
      } catch {
        // Fallback gracefully
      }
    }
  };

  const handleQuickAccept = (offerId: string) => {
    triggerHaptic('trade');
    soundFX.playMatch();
    onAcceptOffer(offerId);
  };

  const handleQuickDecline = (offerId: string) => {
    triggerHaptic('pass');
    soundFX.playClick();
    onDeclineOffer(offerId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#131315]/95 backdrop-blur-md p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#201f21] border-t sm:border border-[#26262e] rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 flex flex-col gap-3 font-sans shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#caf300] animate-pulse" />
            <div>
              <h2 className="font-display font-bold text-base text-white uppercase tracking-tight">
                Trade Dispatch Notifications
              </h2>
              <span className="font-mono text-[10px] text-[#c5c9ac]">
                Accept or decline trades directly from notifications
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#2a2a2c] text-white flex items-center justify-center hover:bg-[#353437] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Push Notification Integration Bar */}
        <div className="p-3 bg-[#131315] rounded-xl border border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[#caf300] text-[20px] shrink-0">
              notifications_active
            </span>
            <div className="min-w-0">
              <span className="font-mono text-[10.5px] text-white font-bold block truncate">
                Device Push Notifications
              </span>
              <span className="font-mono text-[9px] text-[#8f9378] block truncate">
                {pushStatus === 'granted'
                  ? 'Active: Receive instant trade alerts'
                  : 'Get notified without opening the app'}
              </span>
            </div>
          </div>

          {pushStatus !== 'granted' ? (
            <button
              type="button"
              onClick={handleRequestPushPermission}
              className="px-2.5 py-1.5 rounded-lg bg-[#caf300] text-[#171e00] font-mono text-[10px] font-bold uppercase shrink-0 hover:brightness-110 cursor-pointer"
            >
              Enable
            </button>
          ) : (
            <span className="font-mono text-[9.5px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
              ✓ Enabled
            </span>
          )}
        </div>

        {/* Section 1: Active Incoming Trades with Direct 1-Tap Actions */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10.5px] uppercase text-[#caf300] font-bold">
              Actionable Trade Requests ({incomingOffers.length})
            </span>
            <span className="font-mono text-[9.5px] text-[#8f9378]">Direct 1-tap accept/decline</span>
          </div>

          {incomingOffers.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#131315] text-center border border-dashed border-[#26262e]">
              <span className="font-mono text-xs text-[#8f9378]">
                No pending requests. All trades settled!
              </span>
            </div>
          ) : (
            incomingOffers.map((offer) => (
              <div
                key={offer.id}
                className="p-3 rounded-xl bg-[#18181a] border border-[#caf300]/40 flex flex-col gap-2.5 shadow-sm"
              >
                {/* Notification Item Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={offer.partner.avatarUrl}
                      alt={offer.partner.name}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-[#caf300]"
                    />
                    <div className="min-w-0">
                      <span className="font-mono text-xs text-white font-bold truncate block">
                        @{offer.partner.handle}
                      </span>
                      <span className="font-mono text-[9px] text-[#8f9378]">
                        {offer.timestamp} • {offer.theirItem.size}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {offer.isStandingFirm && (
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#caf300]/20 text-[#caf300] font-bold border border-[#caf300]/40 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[11px]">shield</span>
                        Stood Firm
                      </span>
                    )}
                    {offer.status === 'maybe' && !offer.isStandingFirm && (
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[11px]">bolt</span>
                        Nudged
                      </span>
                    )}
                    <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                      Trade Proposal
                    </span>
                  </div>
                </div>

                {/* Garments Preview (Tap card to inspect, edit, or trade in app) */}
                <div 
                  onClick={() => {
                    soundFX.playClick();
                    onOpenChat(offer);
                    onClose();
                  }}
                  className="bg-[#131315] p-2.5 rounded-xl border border-white/5 cursor-pointer hover:border-[#caf300]/40 transition-colors group flex flex-col gap-1.5"
                  title="Tap to inspect, edit, or trade in app"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={offer.theirItem.imageUrl}
                      alt={offer.theirItem.title}
                      className="w-10 h-10 rounded-md object-cover shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[9px] text-[#caf300] block uppercase font-bold">
                        THEIR PIECE
                      </span>
                      <span className="font-sans text-xs text-white truncate block">
                        {offer.theirItem.title}
                      </span>
                    </div>
                    <span className="text-[#caf300] font-mono text-xs font-bold">⇄</span>
                    <div className="min-w-0 flex-1 text-right">
                      <span className="font-mono text-[9px] text-[#c5c9ac] block uppercase font-bold">
                        FOR YOURS
                      </span>
                      <span className="font-sans text-xs text-white truncate block">
                        {offer.yourItem.title}
                      </span>
                    </div>
                    <img
                      src={offer.yourItem.imageUrl}
                      alt={offer.yourItem.title}
                      className="w-10 h-10 rounded-md object-cover shrink-0 group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono text-[#8f9378] pt-0.5 border-t border-white/5 group-hover:text-[#caf300] transition-colors">
                    <span>Tap to view details &amp; edit terms</span>
                    <span className="flex items-center gap-0.5">
                      <span>Open in App</span>
                      <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                    </span>
                  </div>
                </div>

                {/* Direct Action: Two Options Only (ACCEPT & REFUSE) */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleQuickAccept(offer.id)}
                    className="py-2.5 rounded-xl bg-[#caf300] text-[#171e00] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-md shadow-[#caf300]/20"
                  >
                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                    <span>ACCEPT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDecline(offer.id)}
                    className="py-2.5 rounded-xl bg-[#201f21] hover:bg-red-500/20 text-[#c6c6c7] hover:text-red-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-white/5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                    <span>REFUSE</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Section 2: Recent Resolved Notifications */}
        {pastOffers.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <span className="font-mono text-[10px] uppercase text-[#8f9378] font-bold block">
              Recent Trade History ({pastOffers.length})
            </span>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {pastOffers.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="p-2 rounded-lg bg-[#131315] border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`material-symbols-outlined text-[15px] ${
                        p.status === 'accepted' || p.status === 'completed'
                          ? 'text-emerald-400'
                          : 'text-neutral-500'
                      }`}
                    >
                      {p.status === 'accepted' || p.status === 'completed'
                        ? 'check_circle'
                        : 'cancel'}
                    </span>
                    <span className="font-sans text-white truncate max-w-[200px]">
                      {p.theirItem.title} ⇄ {p.yourItem.title}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[9px] uppercase font-bold ${
                      p.status === 'accepted' || p.status === 'completed'
                        ? 'text-[#caf300]'
                        : 'text-neutral-500'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#2a2a2c] text-white font-mono text-xs uppercase hover:bg-[#353437] cursor-pointer mt-1"
        >
          Close Dispatch
        </button>
      </div>
    </div>
  );
};
