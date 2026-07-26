// Web Audio API Sound Synthesizer for ClimbComp Timer Alerts

class SoundEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // High contrast loud horn signal (Start of climb / End of climb)
  playHorn(duration: number = 0.8, frequency: number = 220) {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.8, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio context error fallback
    }
  }

  // Soft prep beep
  playPrepBeep() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // Audio fallback
    }
  }

  // Double warning beep
  playWarningBeep() {
    this.playPrepBeep();
    setTimeout(() => this.playPrepBeep(), 150);
  }

  // TOP Achievement Bell / Fanfare
  playTopChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.5);
      });
    } catch {
      // Audio fallback
    }
  }

  // ZONE Achievement Chime
  playZoneChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25]; // C5, E5
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.1 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.1);
        osc.stop(this.ctx.currentTime + idx * 0.1 + 0.35);
      });
    } catch {
      // Audio fallback
    }
  }

  // Play custom audio URL or fallback to default synthesizer
  playEventAudio(customAudioUrl?: string, defaultSynthesizerType: 'horn' | 'prep' | 'chime' = 'horn') {
    if (customAudioUrl && customAudioUrl !== 'none') {
      try {
        const audio = new Audio(customAudioUrl);
        audio.play().catch(() => {
          // Fallback to synth if audio fails or is blocked
          this.playDefaultSynth(defaultSynthesizerType);
        });
        return;
      } catch {
        this.playDefaultSynth(defaultSynthesizerType);
        return;
      }
    }

    // If customAudioUrl is 'none', user explicitly muted this event
    if (customAudioUrl === 'none') {
      return;
    }

    // Otherwise play default synthesized sound
    this.playDefaultSynth(defaultSynthesizerType);
  }

  private playDefaultSynth(type: 'horn' | 'prep' | 'chime') {
    if (type === 'horn') {
      this.playHorn(0.8, 220);
    } else if (type === 'prep') {
      this.playPrepBeep();
    } else if (type === 'chime') {
      this.playTopChime();
    }
  }
}

export const soundEngine = new SoundEngine();
