/**
 * Web Audio API Sound Alert Synthesizer for Vetri Indane Platform
 * Generates clear, audible notifications without external audio file dependencies.
 */

class SoundAlertManager {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Play Warning Chime for Low Cylinder Inventory (< 50 Units)
   */
  playLowStockAlert() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Two-tone warning beep (E5 -> C5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.setValueAtTime(523.25, now + 0.15); // C5

      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.4);
    } catch (e) {
      console.warn('Audio alert blocked by browser autoplay policy until user interacts.', e);
    }
  }

  /**
   * Play Critical Alarm for Vehicle Overspeeding (>60 km/h)
   */
  playSpeedAlert() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // High-pitched double pulse alarm (880Hz)
      [0, 0.18].forEach(offset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now + offset); // A5

        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
      });
    } catch (e) {
      console.warn('Audio alert error:', e);
    }
  }

  /**
   * Play Notification Chime for Successful Offline Sync
   */
  playSuccessSyncChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Ascending Arpeggio (C5 -> E5 -> G5)
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.2);
      });
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }
}

export const soundAlerts = new SoundAlertManager();
