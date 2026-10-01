import type { PerkId } from './perks';

export interface ProgressSnapshot {
  level: number;
  xp: number;
  xpTarget: number;
  mugs: number;
}

export interface GameEvents {
  RESIZE: { width: number; height: number };
  TICK: { delta: number; elapsed: number };
  ENEMY_DEFEATED: { x: number; z: number; smashed: boolean };
  PROGRESS_CHANGED: ProgressSnapshot;
  LEVEL_UP: { level: number };
  PERK_ACQUIRED: { perkId: PerkId; level: number };
  DASH_COOLDOWN: { ratio: number };
  MUG_COLLECTED: void;
  ENEMY_HIT: { heavy: boolean };
  DASH_STARTED: void;
  HEALTH_CHANGED: { current: number; max: number; damaged: boolean };
  KNOCKED_OUT: void;
  KNIGHT_REVIVED: void;
  SHOP_PURCHASE: void;
  MUTE_CHANGED: { muted: boolean };
  RUN_RESET: void;
  BOSS_SPAWNED: void;
  BOSS_LANDED: void;
  BOSS_TELEGRAPH: void;
  BOSS_STUNNED: void;
  BOSS_SLAM: { dirX: number; dirZ: number };
  BOSS_HEALTH: { ratio: number };
  BOSS_DEFEATED: { x: number; z: number };
}

type Handler<Payload> = (payload: Payload) => void;

type Listeners<Events> = { [Key in keyof Events]?: Set<Handler<Events[Key]>> };

type EmitArgs<Payload> = Payload extends void ? [] : [Payload];

export class EventBus<Events> {
  private listeners: Listeners<Events> = {};

  on<Key extends keyof Events>(event: Key, handler: Handler<Events[Key]>): () => void {
    const handlers = this.listeners[event] ?? new Set<Handler<Events[Key]>>();
    handlers.add(handler);
    this.listeners[event] = handlers;
    return () => this.off(event, handler);
  }

  off<Key extends keyof Events>(event: Key, handler: Handler<Events[Key]>): void {
    this.listeners[event]?.delete(handler);
  }

  emit<Key extends keyof Events>(event: Key, ...args: EmitArgs<Events[Key]>): void {
    const payload = args[0] as Events[Key];
    this.listeners[event]?.forEach((handler) => handler(payload));
  }
}

export type GameEventBus = EventBus<GameEvents>;
