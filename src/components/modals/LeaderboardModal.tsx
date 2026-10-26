import React, { useState } from 'react';
import { LeaderboardEntry } from '../../types/swap';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LeaderboardEntry[];
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, entries }) => {
  const [metric, setMetric] = useState<'co2' | 'swaps' | 'buyouts'>('co2');

  if (!isOpen) return null;

  const sortedEntries = [...entries].sort((a, b) => {
    if (metric === 'co2') return b.co2SavedKg - a.co2SavedKg;
    if (metric === 'swaps') return b.swapsCompleted - a.swapsCompleted;
    return b.buyoutsCompleted - a.buyoutsCompleted;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-[#131317] border-2 border-[#D4FF00] p-5 flex flex-col gap-4 font-mono-zine shadow-[0_20px_60px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2A33] pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#D4FF00]">trophy</span>
            <span className="font-display-zine font-black text-lg uppercase text-white">
              CIRCULAR LEADERBOARD
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close leaderboard"
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white border border-neutral-700 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Global Impact Banner */}
        <div className="p-3 bg-[#08080A] border border-neutral-800 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-[#D4FF00] font-bold">TOTAL COMMUNITY IMPACT</span>
            <span className="font-display-zine font-extrabold text-xl text-white">
              148.6 KG CO2 SAVED
            </span>
            <span className="text-[10px] text-neutral-400">Equivalent to 42 virgin denim pieces averted</span>
          </div>
          <span className="px-2 py-1 bg-[#D4FF00] text-[#08080A] text-xs font-black uppercase">
            ISSUE #04
          </span>
        </div>

        {/* Metric Tabs */}
        <div className="flex border border-neutral-800 bg-[#08080A] p-1 gap-1 text-[10px] uppercase font-bold">
          <button
            onClick={() => setMetric('co2')}
            className={`flex-1 py-1.5 transition-colors cursor-pointer ${
              metric === 'co2' ? 'bg-[#D4FF00] text-[#08080A]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            CO2 PRESERVED
          </button>
          <button
            onClick={() => setMetric('swaps')}
            className={`flex-1 py-1.5 transition-colors cursor-pointer ${
              metric === 'swaps' ? 'bg-[#D4FF00] text-[#08080A]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            TOTAL SWAPS
          </button>
          <button
            onClick={() => setMetric('buyouts')}
            className={`flex-1 py-1.5 transition-colors cursor-pointer ${
              metric === 'buyouts' ? 'bg-[#D4FF00] text-[#08080A]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            DIRECT BUYOUTS
          </button>
        </div>

        {/* Rankings List */}
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          {sortedEntries.map((user, idx) => {
            const isTop3 = idx < 3;
            const isUser = user.handle === '@youssef_fits';

            return (
              <div
                key={user.handle}
                className={`p-2.5 border grid grid-cols-[auto_1fr_auto] items-center gap-2.5 ${
                  isUser
                    ? 'bg-[#1C1C22] border-[#D4FF00] text-white shadow-[2px_2px_0px_#D4FF00]'
                    : isTop3
                    ? 'bg-[#08080A] border-neutral-700 text-neutral-200'
                    : 'bg-[#08080A] border-neutral-800 text-neutral-400'
                }`}
              >
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`w-5 text-center font-black text-sm ${
                      idx === 0
                        ? 'text-[#D4FF00]'
                        : idx === 1
                        ? 'text-white'
                        : idx === 2
                        ? 'text-[#e0b6ff]'
                        : 'text-neutral-500'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 object-cover border border-[#D4FF00]"
                  />
                </div>

                <div className="flex flex-col min-w-0 pr-1">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-xs text-white truncate">{user.handle}</span>
                    {isUser && (
                      <span className="px-1 bg-[#D4FF00] text-[#08080A] text-[8px] font-bold shrink-0">YOU</span>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400 truncate">{user.city}</span>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-[#D4FF00] whitespace-nowrap block">
                    {metric === 'co2'
                      ? `${user.co2SavedKg} kg`
                      : metric === 'swaps'
                      ? `${user.swapsCompleted} swaps`
                      : `${user.buyoutsCompleted} buys`}
                  </span>
                  <span className="text-[9px] text-neutral-500 whitespace-nowrap block">
                    {user.swapsCompleted}s / {user.buyoutsCompleted}b
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white text-xs uppercase cursor-pointer"
        >
          CLOSE LEADERBOARD
        </button>
      </div>
    </div>
  );
};
