class SoundService {
  private enabled: boolean = true;
  private volume: number = 0.5;
  private scheme: 'system' | 'custom' | 'off' = 'system';
  private customSounds: Record<string, string> = {};

  setSettings(
    soundEnabled: boolean,
    soundVolume: number,
    soundScheme: 'system' | 'custom' | 'off',
    customSounds: Record<string, string>
  ) {
    this.enabled = soundEnabled;
    this.volume = soundVolume;
    this.scheme = soundScheme;
    this.customSounds = customSounds;
  }

  play(event: 'success' | 'error' | 'warning' | 'delete' | 'click' | 'navigation') {
    if (!this.enabled || this.scheme === 'off') {
      return;
    }

    if (this.scheme === 'custom' && this.customSounds[event]) {
      this.playCustomSound(this.customSounds[event]);
      return;
    }

    this.playSynthesizedSound(event);
  }

  private playCustomSound(url: string) {
    try {
      const audio = new Audio(url);
      audio.volume = this.volume;
      audio.play().catch(e => {
        console.warn(`Failed to play custom sound for url ${url}:`, e);
        // Fall back to synthesized sound if custom URL fails to play
        const eventName = Object.keys(this.customSounds).find(key => this.customSounds[key] === url);
        if (eventName) {
          this.playSynthesizedSound(eventName);
        }
      });
    } catch (e) {
      console.warn("Error playing custom sound:", e);
    }
  }

  private playSynthesizedSound(event: string) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);

      if (event === 'success') {
        // High-quality double chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        gain.gain.linearRampToValueAtTime(this.volume * 0.4, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now + 0.1); // E5
        gain2.gain.setValueAtTime(0, now + 0.1);
        gain2.gain.linearRampToValueAtTime(this.volume * 0.5, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        osc.start(now);
        osc.stop(now + 0.3);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.45);
      } else if (event === 'error') {
        // Double warning buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        gain.gain.linearRampToValueAtTime(this.volume * 0.4, now + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        
        osc.frequency.setValueAtTime(100, now + 0.18);
        gain.gain.linearRampToValueAtTime(this.volume * 0.4, now + 0.22);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.start(now);
        osc.stop(now + 0.4);
      } else if (event === 'warning') {
        // Soft single warning chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(392.00, now); // G4
        gain.gain.linearRampToValueAtTime(this.volume * 0.6, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.start(now);
        osc.stop(now + 0.5);
      } else if (event === 'delete') {
        // Rapid downward frequency sweep
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);
        
        gain.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

        osc.start(now);
        osc.stop(now + 0.3);
      } else if (event === 'click') {
        // Very quick light mechanical tick
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);
        
        gain.gain.linearRampToValueAtTime(this.volume * 0.15, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.start(now);
        osc.stop(now + 0.045);
      } else if (event === 'navigation') {
        // Soft elegant page sweep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        
        gain.gain.linearRampToValueAtTime(this.volume * 0.2, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.16);
      }
    } catch (e) {
      console.warn("Web Audio playback failed:", e);
    }
  }
}

export const soundService = new SoundService();
