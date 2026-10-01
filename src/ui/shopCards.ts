import type { ArmoryStore } from '../core/armoryState';
import type { GameEventBus } from '../core/events';
import type { MetaProgression } from '../core/metaProgression';

export const BANK_ICON = '🍺';

export interface ShopContext {
  events: GameEventBus;
  meta: MetaProgression;
  armory: ArmoryStore;
  refresh(): void;
}

export function createElement(tag: keyof HTMLElementTagNameMap, className: string, text = ''): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

export function createActionButton(text: string, disabled: boolean, onClick: () => void, extraClass = ''): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `shop-card__buy ${extraClass}`.trim();
  button.textContent = text;
  button.disabled = disabled;
  button.addEventListener('click', onClick);
  return button;
}
