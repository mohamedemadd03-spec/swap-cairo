// Professional Haptic Feedback Engine for swap.
// Optimized for iOS (iPhone WebKit/PWA) and Android (Chrome Vibration API).

export type HapticPattern =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'trade'
  | 'nudge'
  | 'handshake'
  | 'warning'
  | 'error'
  | 'selection';

class HapticEngine {
  private isEnabled: boolean = true;
  private audioCtx: AudioContext | null = null;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('swap_haptics_enabled');
      this.isEnabled = saved !== null ? saved === 'true' : true;
    }
  }

  public init() {
    if (this.isUnlocked || typeof window === 'undefined') return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioCtx) {
          this.audioCtx = new AudioCtx();
        }
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
        this.isUnlocked = true;
      }
    } catch {
      // Audio failsafe
    }
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('swap_haptics_enabled', String(enabled));
    }
    if (enabled) {
      this.trigger('medium');
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  /**
   * Sub-bass acoustic-tactile impulse for iPhone / iOS Safari
   * Plays a 50Hz sub-audible acoustic kick through the bottom speaker chassis
   * creating a real physical tactile tap in the palm of the hand.
   */
  private playIosTactilePulse(freq = 55, duration = 0.028, gainLevel = 0.8) {
    if (typeof window === 'undefined') return;
    try {
      this.init();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + duration);

      // Fast attack & decay for a sharp crisp tap without audible audio pop
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(gainLevel, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.005);
    } catch {
      // Audio failsafe
    }
  }

  public trigger(pattern: HapticPattern | number | number[]) {
    if (!this.isEnabled) return;
    if (typeof window === 'undefined') return;

    this.init();

    const hasVibrator = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

    try {
      if (typeof pattern === 'number' || Array.isArray(pattern)) {
        if (hasVibrator) {
          try {
            navigator.vibrate(pattern);
          } catch {}
        }
        this.playIosTactilePulse(55, 0.03, 0.7);
        return;
      }

      switch (pattern) {
        case 'light':
        case 'selection':
          // 18ms crisp micro-tick on Android LRA
          if (hasVibrator) {
            try {
              navigator.vibrate(18);
            } catch {}
          }
          this.playIosTactilePulse(65, 0.022, 0.6);
          break;

        case 'medium':
          // 32ms solid button engagement
          if (hasVibrator) {
            try {
              navigator.vibrate(32);
            } catch {}
          }
          this.playIosTactilePulse(55, 0.03, 0.8);
          break;

        case 'heavy':
          // 55ms pronounced pulse
          if (hasVibrator) {
            try {
              navigator.vibrate(55);
            } catch {}
          }
          this.playIosTactilePulse(48, 0.045, 0.95);
          break;

        case 'trade':
        case 'success':
          // Celebratory double-pulse [20ms, pause 35ms, 30ms]
          if (hasVibrator) {
            try {
              navigator.vibrate([20, 35, 30]);
            } catch {}
          }
          this.playIosTactilePulse(60, 0.03, 0.85);
          setTimeout(() => this.playIosTactilePulse(50, 0.035, 0.9), 40);
          break;

        case 'nudge':
          // Sharp double-pulse [25ms, pause 30ms, 25ms]
          if (hasVibrator) {
            try {
              navigator.vibrate([25, 30, 25]);
            } catch {}
          }
          this.playIosTactilePulse(70, 0.025, 0.8);
          setTimeout(() => this.playIosTactilePulse(60, 0.03, 0.85), 35);
          break;

        case 'handshake':
          // Smooth ceremonial sequence
          if (hasVibrator) {
            try {
              navigator.vibrate([30, 35, 45, 35, 65]);
            } catch {}
          }
          this.playIosTactilePulse(52, 0.04, 0.9);
          setTimeout(() => this.playIosTactilePulse(48, 0.05, 0.95), 50);
          break;

        case 'warning':
        case 'error':
          if (hasVibrator) {
            try {
              navigator.vibrate([35, 40, 35]);
            } catch {}
          }
          this.playIosTactilePulse(45, 0.04, 0.85);
          break;
      }
    } catch {
      // Haptic failsafe
    }
  }
}

export const hapticEngine = new HapticEngine();

// Auto-unlock audio haptic context on first user touch anywhere on mobile
if (typeof window !== 'undefined') {
  const unlockAudioHaptics = () => {
    hapticEngine.init();
    window.removeEventListener('pointerdown', unlockAudioHaptics);
    window.removeEventListener('touchstart', unlockAudioHaptics);
  };
  window.addEventListener('pointerdown', unlockAudioHaptics, { passive: true, once: true });
  window.addEventListener('touchstart', unlockAudioHaptics, { passive: true, once: true });
}
