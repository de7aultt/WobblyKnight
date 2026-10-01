import './hud.css';
import type { GameEventBus, ProgressSnapshot } from '../core/events';
import { t } from '../i18n';
import { mountHearts } from './hearts';
import { mountPerkTray } from './perkTray';

function createElement(tag: keyof HTMLElementTagNameMap, className: string): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  return element;
}

export function mountHud(root: HTMLElement, events: GameEventBus, initial: ProgressSnapshot): void {
  const hud = createElement('div', 'hud');

  const badge = createElement('div', 'hud__badge');
  const xp = createElement('div', 'hud__xp');
  const track = createElement('div', 'hud__xp-track');
  const fill = createElement('div', 'hud__xp-fill');
  const xpLabel = createElement('span', 'hud__xp-label');
  const mugs = createElement('div', 'hud__mugs');
  const mugIcon = createElement('span', 'hud__mug-icon');
  const mugCount = createElement('span', 'hud__mug-count');

  badge.title = t('hud.level');
  mugs.title = t('hud.mugs');
  track.append(fill);
  xp.append(track, xpLabel);
  mugs.append(mugIcon, mugCount);
  hud.append(badge, xp, mugs);
  root.append(hud);
  mountPerkTray(root, events);
  mountHearts(root, events);

  function render(progress: ProgressSnapshot): void {
    badge.textContent = `${t('hud.levelShort')} ${progress.level}`;
    fill.style.width = `${Math.min(progress.xp / progress.xpTarget, 1) * 100}%`;
    xpLabel.textContent = `${t('hud.xp')} ${progress.xp}/${progress.xpTarget}`;
    mugCount.textContent = String(progress.mugs);
  }

  render(initial);
  events.on('PROGRESS_CHANGED', render);
}
