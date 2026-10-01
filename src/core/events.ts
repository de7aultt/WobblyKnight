import type { PerkId } from './perks';

export interface ProgressSnapshot {
  level: number;
  xp: number;
  xpTarget: number;
  mugs: number;
}

export interface GameEvents {
  GAME_START: void;
  RESIZE: { width: number; height: number };
  TICK: { delta: number; elapsed: number };
  ENEMY_DEFEATED: { x: number; z: number };
  PROGRESS_CHANGED: ProgressSnapshot;
  LEVEL_UP: { level: number };
  PERK_ACQUIRED: { perkId: PerkId; level: number };
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
