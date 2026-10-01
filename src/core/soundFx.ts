import { getAudioContext } from './audio';
import { MASTER_VOLUME, createSynthContext, playNoise, playTone, type SynthContext } from './soundSynth';

const LEVEL_UP_NOTES: readonly number[] = [523.25, 659.25, 783.99, 1046.5];
const CLANG_PARTIALS: readonly number[] = [180, 270, 410, 655];

export class SoundFx {
  private synth: SynthContext | null = null;
  private muted = false;
  private volume = 1;

  setAudio(muted: boolean, volume: number): void {
    this.muted = muted;
    this.volume = volume;
    if (this.synth) this.synth.master.gain.value = this.outputGain();
  }

  playHit(heavy: boolean): void {
    const synth = this.resolve();
    if (!synth) return;
    const weight = heavy ? 1 : 0.7;
    playTone(synth, { type: 'sine', from: 140, to: 35, duration: 0.16 + weight * 0.06, gain: 0.55 * weight });
    playNoise(synth, { filter: 'lowpass', from: 600, to: 150, duration: 0.08, gain: 0.35 * weight });
    if (heavy) playTone(synth, { type: 'sine', from: 380, to: 370, duration: 0.3, gain: 0.05 });
  }

  playMugPickup(): void {
    const synth = this.resolve();
    if (!synth) return;
    playTone(synth, { type: 'sine', from: 520, to: 520, duration: 0.12, gain: 0.2 });
    playTone(synth, { type: 'sine', from: 660, to: 680, duration: 0.2, gain: 0.2, delay: 0.07 });
  }

  playLevelUp(): void {
    const synth = this.resolve();
    if (!synth) return;
    LEVEL_UP_NOTES.forEach((frequency, index) => {
      playTone(synth, { type: 'triangle', from: frequency, to: frequency, duration: 0.55, gain: 0.16, delay: index * 0.09 });
    });
    playTone(synth, { type: 'sine', from: 261.63, to: 261.63, duration: 0.8, gain: 0.12 });
  }

  playDash(): void {
    const synth = this.resolve();
    if (!synth) return;
    playNoise(synth, { filter: 'lowpass', from: 1600, to: 200, duration: 0.35, gain: 0.28 });
    playTone(synth, { type: 'sine', from: 200, to: 60, duration: 0.3, gain: 0.22 });
  }

  playBossRoar(): void {
    const synth = this.resolve();
    if (!synth) return;
    const sweep = { from: 700, to: 140 };
    playTone(synth, { type: 'sawtooth', from: 72, to: 44, duration: 1.1, gain: 0.3, attack: 0.12, lowpass: sweep });
    playTone(synth, { type: 'sawtooth', from: 76, to: 47, duration: 1.1, gain: 0.26, attack: 0.12, lowpass: sweep });
    playNoise(synth, { filter: 'lowpass', from: 500, to: 90, duration: 0.95, gain: 0.16 });
  }

  playBossStun(): void {
    const synth = this.resolve();
    if (!synth) return;
    CLANG_PARTIALS.forEach((frequency) => {
      playTone(synth, { type: 'square', from: frequency, to: frequency * 0.97, duration: 0.7, gain: 0.07 });
    });
    playTone(synth, { type: 'sine', from: 95, to: 38, duration: 0.35, gain: 0.4 });
    playNoise(synth, { filter: 'highpass', from: 3000, to: 1200, duration: 0.12, gain: 0.22 });
  }

  playBottleShatter(): void {
    const synth = this.resolve();
    if (!synth) return;
    playTone(synth, { type: 'sine', from: 95, to: 38, duration: 0.3, gain: 0.12 });
    playNoise(synth, { filter: 'highpass', from: 3000, to: 1200, duration: 0.12, gain: 0.07 });
  }

  private outputGain(): number {
    return this.muted ? 0 : MASTER_VOLUME * this.volume;
  }

  private resolve(): SynthContext | null {
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return null;
    if (!this.synth || this.synth.ctx !== ctx) {
      this.synth = createSynthContext(ctx);
      this.synth.master.gain.value = this.outputGain();
    }
    return this.synth;
  }
}
