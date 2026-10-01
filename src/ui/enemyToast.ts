import './enemyToast.css';
import type { GameEventBus } from '../core/events';
import type { SpecialEnemyKind } from '../entities/enemyTypes';
import { t, type TranslationKey } from '../i18n';

const NAME_KEYS: Record<SpecialEnemyKind, TranslationKey> = {
  bomber: 'enemy.bomber.name',
  shieldGuard: 'enemy.shieldGuard.name',
  ghoul: 'enemy.ghoul.name'
};

function createElement(className: string, text: string): HTMLElement {
  const element = document.createElement('div');
  element.className = className;
  element.textContent = text;
  return element;
}

export function mountEnemyToast(root: HTMLElement, events: GameEventBus): void {
  events.on('ENEMY_UNLOCKED', ({ kind }) => {
    const toast = createElement('enemy-toast', '');
    toast.append(createElement('enemy-toast__label', t('enemy.unlocked')), createElement('enemy-toast__name', t(NAME_KEYS[kind])));
    toast.addEventListener('animationend', () => toast.remove());
    root.append(toast);
  });
  events.on('RUN_RESET', () => {
    root.querySelectorAll('.enemy-toast').forEach((toast) => toast.remove());
  });
}
