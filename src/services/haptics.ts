// Comprehensive Haptic Feedback Engine for swap.
// Combines HTML5 Vibration API patterns with Audio-Tactile Speaker Fallback for iOS/Safari.

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

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('swap_haptics_enabled');
      this.isEnabled = saved !== null ? saved === 'true' : true;
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
      this.trigger('light');
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  // Audio-tactile impulse fallback (sub-bass speaker impulse for devices lacking vibration motors, e.g. iOS Safari)
  private playAudioTactileImpulse(freq = 65, duration = 0.045, gainLevel = 0.35) {
    if (typeof window === 'undefined') return;
    try {
      if (!this.audioCtx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.audioCtx = new AudioCtx();
        }
      }
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + duration);

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

    const hasVibrator = 'vibrate' in navigator;

    try {
      if (typeof pattern === 'number' || Array.isArray(pattern)) {
        if (hasVibrator) navigator.vibrate(pattern);
        this.playAudioTactileImpulse(60, 0.04, 0.2);
        return;
      }

      switch (pattern) {
        case 'light':
        case 'selection':
          if (hasVibrator) navigator.vibrate(12);
          this.playAudioTactileImpulse(80, 0.025, 0.15);
          break;

        case 'medium':
          if (hasVibrator) navigator.vibrate(28);
          this.playAudioTactileImpulse(65, 0.04, 0.25);
          break;

        case 'heavy':
          if (hasVibrator) navigator.vibrate(48);
          this.playAudioTactileImpulse(55, 0.06, 0.35);
          break;

        case 'trade':
        case 'success':
          // Tactile celebratory heartbeat [25ms, 40ms pause, 25ms, 40ms pause, 60ms]
          if (hasVibrator) navigator.vibrate([25, 40, 25, 40, 60]);
          this.playAudioTactileImpulse(70, 0.08, 0.3);
          break;

        case 'nudge':
          // Dual sharp nudge pulses [35ms, 50ms pause, 45ms]
          if (hasVibrator) navigator.vibrate([35, 50, 45]);
          this.playAudioTactileImpulse(95, 0.06, 0.28);
          break;

        case 'handshake':
          // Rich ceremonial handshake haptic burst [50, 40, 70, 50, 100, 60, 160]
          if (hasVibrator) navigator.vibrate([50, 40, 70, 50, 100, 60, 160]);
          this.playAudioTactileImpulse(50, 0.12, 0.4);
          break;

        case 'warning':
        case 'error':
          // Triplet warning pulse
          if (hasVibrator) navigator.vibrate([40, 60, 40, 60, 70]);
          this.playAudioTactileImpulse(45, 0.09, 0.3);
          break;
      }
    } catch {
      // Haptic failsafe
    }
  }
}

export const hapticEngine = new HapticEngine();
