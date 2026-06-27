class SoundManager {
  private ctx: AudioContext | null = null;

  private init() {
    if (typeof window !== 'undefined' && !this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error('Web Audio API not supported', e);
      }
    }
  }

  playCorrect() {
    this.init();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    
    const playNote = (freq: number, start: number, duration: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      
      gainNode.gain.setValueAtTime(0.15, start);
      gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    // Ascending double chime
    playNote(523.25, now, 0.15); // C5
    playNote(659.25, now + 0.08, 0.25); // E5
  }

  playIncorrect() {
    this.init();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    
    const playBuzzer = (freq: number, start: number, duration: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      
      gainNode.gain.setValueAtTime(0.15, start);
      gainNode.gain.linearRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    // Low double buzzer
    playBuzzer(220, now, 0.2); // A3
    playBuzzer(196, now + 0.1, 0.25); // G3
  }

  playFlip() {
    this.init();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'sine';
    // quick pitch slide for paper flip feel
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
    
    gainNode.gain.setValueAtTime(0.04, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playSuccess() {
    this.init();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    
    const playNote = (freq: number, start: number, duration: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      
      gainNode.gain.setValueAtTime(0.12, start);
      gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    // Victory fanfare chords (glorious progression)
    playNote(523.25, now, 0.15); // C5
    playNote(587.33, now + 0.12, 0.15); // D5
    playNote(659.25, now + 0.24, 0.15); // E5
    playNote(783.99, now + 0.36, 0.4); // G5
  }
}

export const sfx = new SoundManager();
