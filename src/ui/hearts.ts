import './hearts.css';
import { BASE_MAX_HEARTS } from '../core/baseStats';
import type { GameEventBus } from '../core/events';
import { t } from '../i18n';
import { bindLocalized } from './localized';

const HEART_GLYPH = '♥';

function replayAnimation(heart: HTMLElement, className: string): void {
  heart.classList.remove(className);
  void heart.offsetWidth;
  heart.classList.add(className);
}

function createHeart(): HTMLElement {
  const heart = document.createElement('span');
  heart.className = 'heart';
  heart.textContent = HEART_GLYPH;
  heart.addEventListener('animationend', () => heart.classList.remove('heart--hit', 'heart--restored'));
  return heart;
}

export function mountHearts(root: HTMLElement, events: GameEventBus): void {
  const container = document.createElement('div');
  container.className = 'hearts';
  bindLocalized(events, () => {
    container.title = t('hud.health');
  });
  root.append(container);

  let hearts: HTMLElement[] = [];
  let previous = BASE_MAX_HEARTS;

  function rebuild(count: number): void {
    hearts = Array.from({ length: count }, createHeart);
    container.replaceChildren(...hearts);
  }

  rebuild(BASE_MAX_HEARTS);

  events.on('HEALTH_CHANGED', ({ current, max, damaged }) => {
    if (hearts.length !== max) rebuild(max);
    hearts.forEach((heart, index) => heart.classList.toggle('heart--empty', index >= current));
    if (damaged) {
      for (let index = current; index < previous && index < hearts.length; index++) replayAnimation(hearts[index], 'heart--hit');
    }
    previous = current;
  });
  events.on('HEART_RESTORED', () => {
    const restored = hearts[previous - 1];
    if (restored) replayAnimation(restored, 'heart--restored');
  });
}
