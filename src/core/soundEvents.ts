import type { GameEventBus } from './events';
import type { SoundFx } from './soundFx';

const WHOOSH_REFERENCE_SPEED = 28;

export function wireSoundEvents(events: GameEventBus, sound: SoundFx): void {
  events.on('LEVEL_UP', () => sound.playLevelUp());
  events.on('MUG_COLLECTED', () => sound.playMugPickup());
  events.on('ENEMY_HIT', ({ heavy }) => sound.playHit(heavy));
  events.on('DASH_STARTED', () => sound.playDash());
  events.on('FLAIL_SPEED', ({ speed }) => sound.playWhoosh(Math.min(speed / WHOOSH_REFERENCE_SPEED, 1)));
  events.on('BOSS_SPAWNED', () => sound.playBossRoar());
  events.on('BOSS_TELEGRAPH', () => sound.playBossRoar());
  events.on('BOSS_DEFEATED', () => sound.playBossRoar());
  events.on('BOSS_LANDED', () => sound.playBossStun());
  events.on('BOSS_STUNNED', () => sound.playBossStun());
}
