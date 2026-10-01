import { readJson, writeJson } from './storage';

const MUTE_KEY = 'wobbly-knight.muted';

export function loadMuted(): boolean {
  return readJson<boolean>(MUTE_KEY, false) === true;
}

export function saveMuted(muted: boolean): void {
  writeJson(MUTE_KEY, muted);
}
