import './hearts.css';
import { BASE_MAX_HEARTS } from '../core/baseStats';
import type { GameEventBus } from '../core/events';
import { t } from '../i18n';
import { bindLocalized } from './localized';

const HEART_GLYPH = '♥';

function replayShake(heart: HTMLElement): void {
  heart.classList.remove('heart--hit');
  void heart.offsetWidth;
  heart.classList.add('heart--hit');
}

function createHeart(): HTMLElement {
  const heart = document.createElement('span');
  heart.className = 'heart';
  heart.textContent = HEART_GLYPH;
  heart.addEventListener('animationend', () => heart.classList.remove('heart--hit'));
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
      for (let index = current; index < previous && index < hearts.length; index++) replayShake(hearts[index]);
    }
    previous = current;
  });
}
