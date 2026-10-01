let audioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  return audioContext;
}

export async function unlockAudio(): Promise<AudioContext | null> {
  if (typeof AudioContext === 'undefined') return null;
  audioContext ??= new AudioContext();
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  return audioContext;
}
