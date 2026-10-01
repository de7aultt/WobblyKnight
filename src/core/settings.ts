import type { GameEventBus } from './events';
import { readJson, writeJson } from './storage';

const STORAGE_KEY = 'wobbly_knight_settings';

export type GraphicsQuality = 'high' | 'low';

export interface GameSettings {
  masterVolume: number;
  muted: boolean;
  quality: GraphicsQuality;
}

const DEFAULT_SETTINGS: GameSettings = { masterVolume: 1, muted: false, quality: 'high' };

function sanitize(raw: Partial<GameSettings>): GameSettings {
  const volume = typeof raw.masterVolume === 'number' ? Math.min(Math.max(raw.masterVolume, 0), 1) : DEFAULT_SETTINGS.masterVolume;
  return {
    masterVolume: volume,
    muted: raw.muted === true,
    quality: raw.quality === 'low' ? 'low' : 'high'
  };
}

export class SettingsStore {
  private settings: GameSettings = sanitize(readJson<Partial<GameSettings>>(STORAGE_KEY, {}));

  constructor(private readonly events: GameEventBus) {}

  snapshot(): GameSettings {
    return { ...this.settings };
  }

  announce(): void {
    this.events.emit('SETTINGS_CHANGED', this.snapshot());
  }

  setMasterVolume(volume: number): void {
    this.settings.masterVolume = Math.min(Math.max(volume, 0), 1);
    this.commit();
  }

  setMuted(muted: boolean): void {
    this.settings.muted = muted;
    this.commit();
  }

  toggleMuted(): void {
    this.setMuted(!this.settings.muted);
  }

  setQuality(quality: GraphicsQuality): void {
    this.settings.quality = quality;
    this.commit();
  }

  private commit(): void {
    writeJson(STORAGE_KEY, this.settings);
    this.announce();
  }
}
