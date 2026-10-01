import './startOverlay.css';
import { unlockAudio } from '../core/audio';
import type { GameEventBus } from '../core/events';
import { t } from '../i18n';

function createElement<Tag extends keyof HTMLElementTagNameMap>(
  tag: Tag,
  className: string,
  text: string
): HTMLElementTagNameMap[Tag] {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

export function mountStartOverlay(root: HTMLElement, events: GameEventBus): void {
  const overlay = document.createElement('div');
  overlay.className = 'start-overlay interactive';

  const title = createElement('h1', 'start-overlay__title', t('game.title'));
  const tagline = createElement('p', 'start-overlay__tagline', t('game.tagline'));
  const button = createElement('button', 'start-overlay__button', t('ui.startBrawl'));
  button.type = 'button';

  button.addEventListener(
    'click',
    () => {
      void unlockAudio();
      events.emit('GAME_START');
      overlay.remove();
    },
    { once: true }
  );

  overlay.append(title, tagline, button);
  root.append(overlay);
}
