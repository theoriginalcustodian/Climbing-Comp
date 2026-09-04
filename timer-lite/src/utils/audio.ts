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

  // Loud horn signal (Start / End of climb)
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
    } catch { /* fallback */ }
  }

  // Soft prep beep
  playPrepBeep() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch { /* fallback */ }
  }

  // Double warning beep
  playWarningBeep() {
    this.playPrepBeep();
    setTimeout(() => this.playPrepBeep(), 150);
  }

  // Triple end signal
  playEndSignal() {
    this.playHorn(0.5, 330);
    setTimeout(() => this.playHorn(0.5, 330), 600);
    setTimeout(() => this.playHorn(1.0, 220), 1200);
  }

  playEventAudio(url: string | undefined, defaultType: 'horn' | 'prep' | 'chime' | 'tick' = 'horn') {
    if (url && url !== 'none') {
      const audio = new Audio(url);
      audio.play().catch(() => this.playFallback(defaultType));
    } else {
      this.playFallback(defaultType);
    }
  }

  private playFallback(type: 'horn' | 'prep' | 'chime' | 'tick') {
    if (type === 'horn') this.playHorn();
    else if (type === 'prep') this.playPrepBeep();
    else if (type === 'chime') this.playWarningBeep();
    else if (type === 'tick') this.playTick();
  }

  playTick() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch { /* fallback */ }
  }
}

export const soundEngine = new SoundEngine();
