import { LiveRadarPulse, TelemetryEventType } from '../types/swap';

function getOrGenerateSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  try {
    let sId = window.sessionStorage.getItem('swap_session_id');
    if (!sId) {
      sId = 'swapper_' + Math.random().toString(36).substring(2, 8) + '_' + Date.now().toString(36);
      window.sessionStorage.setItem('swap_session_id', sId);
    }
    return sId;
  } catch {
    return 'anon_session_' + Date.now();
  }
}

function detectDevice(): string {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'Android Mobile';
  if (/iphone|ipad|ipod/i.test(ua)) return 'Apple iOS';
  if (/windows/i.test(ua)) return 'Windows Desktop';
  if (/macintosh/i.test(ua)) return 'Mac Desktop';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Mobile Browser';
}

export const telemetryService = {
  sessionId: getOrGenerateSessionId(),
  device: detectDevice(),

  async trackEvent(
    type: TelemetryEventType,
    options: {
      summaryAr: string;
      summaryEn: string;
      userHandle?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      await fetch('/api/telemetry/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          sessionId: this.sessionId,
          userHandle: options.userHandle || '@swapper',
          device: this.device,
          summaryAr: options.summaryAr,
          summaryEn: options.summaryEn,
          metadata: options.metadata || {},
        }),
      });
    } catch {
      // Non-blocking telemetry
    }
  },

  async trackHeartbeat(userHandle?: string): Promise<void> {
    try {
      await fetch('/api/telemetry/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          userHandle: userHandle || '@swapper',
          device: this.device,
        }),
      });
    } catch {
      // Non-blocking
    }
  },

  async fetchPulse(): Promise<LiveRadarPulse | null> {
    try {
      const res = await fetch('/api/telemetry/pulse', {
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.pulse || null;
    } catch {
      return null;
    }
  },

  async clearLogs(): Promise<boolean> {
    try {
      const res = await fetch('/api/telemetry/clear', { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  },
};
