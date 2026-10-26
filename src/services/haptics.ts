// Comprehensive Haptic Feedback Engine for swap.
// Combines HTML5 Vibration API with High-Energy Acoustic-Tactile Transducer for iOS Safari.

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

  // Audio-tactile impulse fallback (sub-bass speaker transducer for devices lacking hardware vibration motor like iOS Safari)
  private playAudioTactileImpulse(freq = 145, duration = 0.055, gainLevel = 0.85) {
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

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + duration);

      gain.gain.setValueAtTime(gainLevel, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.01);
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
        this.playAudioTactileImpulse(140, 0.05, 0.7);
        return;
      }

      switch (pattern) {
        case 'light':
        case 'selection':
          // 38ms threshold guarantees linear resonant actuator (LRA/ERM) motor spin-up on modern Android phones
          if (hasVibrator) {
            try {
              navigator.vibrate(38);
            } catch {}
          }
          this.playAudioTactileImpulse(160, 0.04, 0.65);
          break;

        case 'medium':
          if (hasVibrator) {
            try {
              navigator.vibrate(65);
            } catch {}
          }
          this.playAudioTactileImpulse(140, 0.055, 0.85);
          break;

        case 'heavy':
          if (hasVibrator) {
            try {
              navigator.vibrate(110);
            } catch {}
          }
          this.playAudioTactileImpulse(115, 0.08, 0.95);
          break;

        case 'trade':
        case 'success':
          // Tactile celebratory heartbeat
          if (hasVibrator) {
            try {
              navigator.vibrate([45, 40, 45, 40, 85]);
            } catch {}
          }
          this.playAudioTactileImpulse(150, 0.09, 0.85);
          break;

        case 'nudge':
          // Sharp double-punch pulse
          if (hasVibrator) {
            try {
              navigator.vibrate([50, 40, 65]);
            } catch {}
          }
          this.playAudioTactileImpulse(170, 0.07, 0.85);
          break;

        case 'handshake':
          // Heavy ceremonial handshake haptic burst
          if (hasVibrator) {
            try {
              navigator.vibrate([60, 40, 85, 45, 130, 50, 190]);
            } catch {}
          }
          this.playAudioTactileImpulse(120, 0.14, 0.95);
          break;

        case 'warning':
        case 'error':
          // Warning vibration pulse
          if (hasVibrator) {
            try {
              navigator.vibrate([55, 45, 55, 45, 75]);
            } catch {}
          }
          this.playAudioTactileImpulse(100, 0.09, 0.85);
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
