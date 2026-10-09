class RetroSoundEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private musicInterval: number | null = null;
  private currentStep: number = 0;

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.setVolumes(0.7, 0.45, 0.8);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolumes(master: number, music: number, sfx: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : Math.max(0, master), this.ctx.currentTime);
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(Math.max(0, music), this.ctx.currentTime);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(Math.max(0, sfx), this.ctx.currentTime);
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public playTone(freq: number, type: OscillatorType, duration: number, vol = 1.0, pitchEnd?: number) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (pitchEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(10, pitchEnd), now + duration);
    }

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  public playNoise(duration: number, vol = 0.8) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  public playBlip() {
    this.playTone(880, 'square', 0.04, 0.2, 440);
  }

  public playConfirm() {
    this.playTone(523.25, 'triangle', 0.08, 0.4);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.12, 0.4), 80);
  }

  public playHit() {
    this.playNoise(0.12, 0.7);
    this.playTone(140, 'sawtooth', 0.15, 0.6, 40);
  }

  public playCrit() {
    this.playNoise(0.2, 0.9);
    this.playTone(440, 'square', 0.25, 0.8, 880);
  }

  public playShield() {
    this.playTone(300, 'sine', 0.2, 0.6, 600);
  }

  public playHeal() {
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.15, 0.4), idx * 60);
    });
  }

  public playFaint() {
    this.playTone(300, 'sawtooth', 0.4, 0.7, 50);
    this.playNoise(0.3, 0.5);
  }

  public playVictoryFanfare() {
    const notes = [523.25, 523.25, 523.25, 659.25, 783.99, 1046.5];
    const times = [0, 140, 280, 420, 560, 750];
    notes.forEach((n, i) => setTimeout(() => this.playTone(n, 'square', 0.15, 0.6), times[i]));
  }

  public startMusic() {
    this.initContext();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    const melody = [130.81, 155.56, 174.61, 196.0, 174.61, 155.56, 130.81, 196.0];
    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.isMuted) return;
      const freq = melody[this.currentStep % melody.length] ?? 130.81;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.18);

      if (this.currentStep % 2 !== 0) {
        this.playNoise(0.03, 0.08);
      }

      this.currentStep++;
    }, 190);
  }

  public stopMusic() {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
  }
}

export const SoundManager = new RetroSoundEngine();