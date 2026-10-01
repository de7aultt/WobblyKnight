export interface SynthContext {
  ctx: AudioContext;
  output: AudioNode;
  noise: AudioBuffer;
}

export interface SweepRange {
  from: number;
  to: number;
}

export interface ToneOptions {
  type: OscillatorType;
  from: number;
  to: number;
  duration: number;
  gain: number;
  delay?: number;
  attack?: number;
  lowpass?: SweepRange;
}

export interface NoiseOptions {
  filter: BiquadFilterType;
  from: number;
  to: number;
  duration: number;
  gain: number;
  delay?: number;
  quality?: number;
  attack?: number;
}

const SILENCE = 0.0001;
const DEFAULT_ATTACK = 0.005;

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
  return buffer;
}

export function createSynthContext(ctx: AudioContext): SynthContext {
  const master = ctx.createGain();
  master.gain.value = 0.7;
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -20;
  compressor.knee.value = 24;
  compressor.ratio.value = 10;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;
  master.connect(compressor);
  compressor.connect(ctx.destination);
  return { ctx, output: master, noise: createNoiseBuffer(ctx) };
}

function createEnvelope(synth: SynthContext, start: number, end: number, gain: number, attack: number): GainNode {
  const envelope = synth.ctx.createGain();
  envelope.gain.setValueAtTime(SILENCE, start);
  envelope.gain.linearRampToValueAtTime(gain, start + attack);
  envelope.gain.exponentialRampToValueAtTime(SILENCE, end);
  envelope.connect(synth.output);
  return envelope;
}

function createSweepFilter(
  synth: SynthContext,
  type: BiquadFilterType,
  range: SweepRange,
  start: number,
  end: number,
  quality: number
): BiquadFilterNode {
  const filter = synth.ctx.createBiquadFilter();
  filter.type = type;
  filter.Q.value = quality;
  filter.frequency.setValueAtTime(range.from, start);
  filter.frequency.exponentialRampToValueAtTime(Math.max(range.to, 1), end);
  return filter;
}

export function playTone(synth: SynthContext, options: ToneOptions): void {
  const start = synth.ctx.currentTime + (options.delay ?? 0);
  const end = start + options.duration;
  const oscillator = synth.ctx.createOscillator();
  oscillator.type = options.type;
  oscillator.frequency.setValueAtTime(options.from, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(options.to, 1), end);

  const envelope = createEnvelope(synth, start, end, options.gain, options.attack ?? DEFAULT_ATTACK);
  if (options.lowpass) {
    const filter = createSweepFilter(synth, 'lowpass', options.lowpass, start, end, 1);
    oscillator.connect(filter);
    filter.connect(envelope);
  } else {
    oscillator.connect(envelope);
  }

  oscillator.start(start);
  oscillator.stop(end + 0.02);
  oscillator.onended = () => envelope.disconnect();
}

export function playNoise(synth: SynthContext, options: NoiseOptions): void {
  const start = synth.ctx.currentTime + (options.delay ?? 0);
  const end = start + Math.min(options.duration, 0.95);
  const source = synth.ctx.createBufferSource();
  source.buffer = synth.noise;

  const filter = createSweepFilter(synth, options.filter, options, start, end, options.quality ?? 1);
  const envelope = createEnvelope(synth, start, end, options.gain, options.attack ?? DEFAULT_ATTACK);
  source.connect(filter);
  filter.connect(envelope);

  source.start(start);
  source.stop(end + 0.02);
  source.onended = () => envelope.disconnect();
}
