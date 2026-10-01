import type { GameEventBus } from './events';
import type { SoundFx } from './soundFx';

export function wireSoundEvents(events: GameEventBus, sound: SoundFx): void {
  events.on('LEVEL_UP', () => sound.playLevelUp());
  events.on('MUG_COLLECTED', () => sound.playMugPickup());
  events.on('ENEMY_HIT', ({ heavy }) => sound.playHit(heavy));
  events.on('DASH_STARTED', () => sound.playDash());
  events.on('HEALTH_CHANGED', ({ damaged }) => {
    if (damaged) sound.playHit(true);
  });
  events.on('HEART_RESTORED', () => sound.playMugPickup());
  events.on('BOMB_EXPLODED', () => sound.playBossStun());
  events.on('KNOCKED_OUT', () => sound.playBossStun());
  events.on('KNIGHT_REVIVED', () => sound.playLevelUp());
  events.on('SHOP_PURCHASE', () => sound.playMugPickup());
  events.on('SETTINGS_CHANGED', ({ muted, masterVolume }) => sound.setAudio(muted, masterVolume));
  events.on('HOLY_STOMP', () => sound.playBossStun());
  events.on('BOSS_SPAWNED', () => sound.playBossRoar());
  events.on('BOSS_TELEGRAPH', () => sound.playBossRoar());
  events.on('BOSS_DEFEATED', () => sound.playBossRoar());
  events.on('BOSS_LANDED', () => sound.playBossStun());
  events.on('BOSS_STUNNED', () => sound.playBossStun());
}
