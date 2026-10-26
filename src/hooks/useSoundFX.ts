import { hapticEngine, HapticPattern } from '../services/haptics';

// Web Audio API Synthesizer for tactile brutalist streetwear sound FX
// Zero external asset dependencies, zero network latency, instant tactile feedback.

class SoundFXEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check localStorage preference
    const saved = localStorage.getItem('swap_sound_enabled');
    this.isMuted = saved !== null ? saved === 'false' : false;
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('swap_sound_enabled', String(!this.isMuted));
    if (!this.isMuted) {
      this.playClick();
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('swap_sound_enabled', String(!muted));
  }

  // Crisp mechanical tactile click
  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Audio playback failsafe
    }
  }

  // Aerodynamic card swipe whoosh
  public playSwipe(direction: 'left' | 'right' = 'right') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      filter.type = 'lowpass';

      if (direction === 'right') {
        // Uplifting swipe right
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.12);
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(2400, now + 0.12);
      } else {
        // Drop swipe left
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.12);
      }

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio playback failsafe
    }
  }

  // Heavy brutalist stamp thud
  public playStamp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.1);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Audio playback failsafe
    }
  }

  // Metallic cash register / EGP buyout cha-ching
  public playCash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // High bell strike 1
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      // High bell strike 2 (major third / fifth higher)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain2.gain.setValueAtTime(0.25, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.38);
    } catch {
      // Audio playback failsafe
    }
  }

  // Harmonic match arpeggio + sub-bass drop
  public playMatch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 808 Sub-bass drop
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(120, now);
      sub.frequency.exponentialRampToValueAtTime(40, now + 0.4);
      subGain.gain.setValueAtTime(0.4, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 0.5);

      // Triad Chime
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteOsc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        noteOsc.type = 'triangle';
        noteOsc.frequency.setValueAtTime(freq, now + idx * 0.06);

        noteGain.gain.setValueAtTime(0.15, now + idx * 0.06);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.28);

        noteOsc.connect(noteGain);
        noteGain.connect(this.ctx.destination);

        noteOsc.start(now + idx * 0.06);
        noteOsc.stop(now + idx * 0.06 + 0.3);
      });
    } catch {
      // Audio playback failsafe
    }
  }

  // Radar sonar ping
  public playSonar() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.05);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Audio playback failsafe
    }
  }

  // Camera shutter / Fit Polaroid flash
  public playShutter() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      
      // First click
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(800, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.04);

      // Mechanical release click
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(500, now + 0.07);
      gain2.gain.setValueAtTime(0.22, now + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.14);
    } catch {
      // Audio playback failsafe
    }
  }

  // Signature "SWAP" Funny Shout Kid Voice + Cartoon Pop & Sparkle
  public playBrandIntro() {
    if (this.isMuted) return;
    this.initCtx();

    // 1. High-pitched excited kid shouting "SWAPPP!" via Web Speech Synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('SWAPPP!!');
        utterance.rate = 1.35; // Fast, enthusiastic kid tempo
        utterance.pitch = 1.95; // Super high-pitched, comical kid shout!
        utterance.volume = 1.0;

        const speakWithBestVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length > 0) {
            const preferred =
              voices.find(
                (v) =>
                  v.lang.startsWith('en') &&
                  (v.name.includes('Kid') ||
                    v.name.includes('Junior') ||
                    v.name.includes('Child') ||
                    v.name.includes('Zira') ||
                    v.name.includes('Victoria') ||
                    v.name.includes('Samantha') ||
                    v.name.includes('Google US English'))
              ) || voices.find((v) => v.lang.startsWith('en'));
            if (preferred) {
              utterance.voice = preferred;
            }
          }
          window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length > 0) {
          speakWithBestVoice();
        } else {
          window.speechSynthesis.onvoiceschanged = () => {
            speakWithBestVoice();
          };
          window.speechSynthesis.speak(utterance);
        }
      } catch {
        // Speech synthesis failsafe
      }
    }

    // 2. Playful Cartoon Boing + Kid Vocal Formant Shout Synth + Pop
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      // Comical Spring Boing / Cartoon Whistle (380Hz -> 1100Hz -> 520Hz)
      const boingOsc = this.ctx.createOscillator();
      const boingGain = this.ctx.createGain();
      boingOsc.type = 'sine';
      boingOsc.frequency.setValueAtTime(380, now);
      boingOsc.frequency.exponentialRampToValueAtTime(1100, now + 0.12);
      boingOsc.frequency.exponentialRampToValueAtTime(520, now + 0.28);

      boingGain.gain.setValueAtTime(0.28, now);
      boingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      boingOsc.connect(boingGain);
      boingGain.connect(this.ctx.destination);
      boingOsc.start(now);
      boingOsc.stop(now + 0.35);

      // Kid Voice Formant Synthesizer layer ("WA-AA-P!")
      const voiceOsc = this.ctx.createOscillator();
      const voiceFilter = this.ctx.createBiquadFilter();
      const voiceGain = this.ctx.createGain();

      voiceOsc.type = 'sawtooth';
      // Kid fundamental frequency: high F0 ~ 680Hz peaking at 890Hz then falling
      voiceOsc.frequency.setValueAtTime(680, now + 0.05);
      voiceOsc.frequency.exponentialRampToValueAtTime(890, now + 0.16);
      voiceOsc.frequency.exponentialRampToValueAtTime(580, now + 0.3);

      voiceFilter.type = 'bandpass';
      voiceFilter.Q.setValueAtTime(5.0, now + 0.05);
      voiceFilter.frequency.setValueAtTime(1200, now + 0.05);
      voiceFilter.frequency.exponentialRampToValueAtTime(2600, now + 0.18);
      voiceFilter.frequency.exponentialRampToValueAtTime(1400, now + 0.3);

      voiceGain.gain.setValueAtTime(0.001, now);
      voiceGain.gain.linearRampToValueAtTime(0.25, now + 0.08);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      voiceOsc.connect(voiceFilter);
      voiceFilter.connect(voiceGain);
      voiceGain.connect(this.ctx.destination);
      voiceOsc.start(now + 0.05);
      voiceOsc.stop(now + 0.35);

      // Comical Cartoon Bubble Pop ("PLOP!")
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      popOsc.type = 'triangle';
      popOsc.frequency.setValueAtTime(850, now + 0.25);
      popOsc.frequency.exponentialRampToValueAtTime(210, now + 0.32);

      popGain.gain.setValueAtTime(0.3, now + 0.25);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      popOsc.connect(popGain);
      popGain.connect(this.ctx.destination);
      popOsc.start(now + 0.25);
      popOsc.stop(now + 0.36);

      // Playful celebratory twinkle chime (high sparkly kid energy)
      const sparkles = [1318.5, 1760.0, 2349.3]; // E6, A6, D7
      sparkles.forEach((freq, idx) => {
        if (!this.ctx) return;
        const sparkOsc = this.ctx.createOscillator();
        const sparkGain = this.ctx.createGain();
        const startTime = now + 0.28 + idx * 0.04;

        sparkOsc.type = 'sine';
        sparkOsc.frequency.setValueAtTime(freq, startTime);

        sparkGain.gain.setValueAtTime(0.12, startTime);
        sparkGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        sparkOsc.connect(sparkGain);
        sparkGain.connect(this.ctx.destination);
        sparkOsc.start(startTime);
        sparkOsc.stop(startTime + 0.26);
      });
    } catch {
      // Audio playback failsafe
    }
  }

  // 100-Meter Proximity Sonar Ping (triggers when swapper is <100m away)
  public playProximityPing() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const pings = [
        { time: 0, freq: 880, dur: 0.16 },
        { time: 0.18, freq: 1318.5, dur: 0.28 },
      ];
      pings.forEach((p) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(p.freq, now + p.time);
        gain.gain.setValueAtTime(0.22, now + p.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + p.time + p.dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + p.time);
        osc.stop(now + p.time + p.dur + 0.02);
      });
    } catch {
      // Audio playback failsafe
    }
  }
}

export const soundFX = new SoundFXEngine();

// Tactile Haptic Engine integration
export function triggerHaptic(type: HapticPattern | 'like' | 'pass' | 'click' | number | number[]) {
  if (type === 'like') {
    hapticEngine.trigger('success');
  } else if (type === 'pass') {
    hapticEngine.trigger('light');
  } else if (type === 'click') {
    hapticEngine.trigger('selection');
  } else {
    hapticEngine.trigger(type as HapticPattern);
  }
}

export { hapticEngine };
