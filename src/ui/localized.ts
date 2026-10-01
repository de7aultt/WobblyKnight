import type { GameEventBus } from '../core/events';

export function bindLocalized(events: GameEventBus, apply: () => void): void {
  apply();
  events.on('LOCALE_CHANGED', apply);
}
