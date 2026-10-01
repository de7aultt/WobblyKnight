import './hearts.css';
import { MAX_HEALTH } from '../core/health';
import type { GameEventBus } from '../core/events';
import { t } from '../i18n';

const HEART_GLYPH = '♥';

function replayShake(heart: HTMLElement): void {
  heart.classList.remove('heart--hit');
  void heart.offsetWidth;
  heart.classList.add('heart--hit');
}

export function mountHearts(root: HTMLElement, events: GameEventBus): void {
  const container = document.createElement('div');
  container.className = 'hearts';
  container.title = t('hud.health');

  const hearts: HTMLElement[] = [];
  for (let index = 0; index < MAX_HEALTH; index++) {
    const heart = document.createElement('span');
    heart.className = 'heart';
    heart.textContent = HEART_GLYPH;
    heart.addEventListener('animationend', () => heart.classList.remove('heart--hit'));
    hearts.push(heart);
    container.append(heart);
  }
  root.append(container);

  let previous = MAX_HEALTH;
  events.on('HEALTH_CHANGED', ({ current, damaged }) => {
    hearts.forEach((heart, index) => heart.classList.toggle('heart--empty', index >= current));
    if (damaged) {
      for (let index = current; index < previous; index++) replayShake(hearts[index]);
    }
    previous = current;
  });
}
