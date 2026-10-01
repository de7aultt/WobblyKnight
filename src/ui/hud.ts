import './hud.css';
import type { GameEventBus, ProgressSnapshot } from '../core/events';
import { t } from '../i18n';
import { mountDashIndicator } from './dashIndicator';
import { mountHearts } from './hearts';
import { bindLocalized } from './localized';
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

  track.append(fill);
  xp.append(track, xpLabel);
  mugs.append(mugIcon, mugCount);
  hud.append(badge, xp, mugs);
  root.append(hud);
  mountPerkTray(root, events);
  mountHearts(root, events);
  mountDashIndicator(root, events);

  let latest = initial;

  function render(progress: ProgressSnapshot): void {
    latest = progress;
    badge.title = t('hud.level');
    mugs.title = t('hud.mugs');
    badge.textContent = `${t('hud.levelShort')} ${progress.level}`;
    fill.style.width = `${Math.min(progress.xp / progress.xpTarget, 1) * 100}%`;
    xpLabel.textContent = `${t('hud.xp')} ${progress.xp}/${progress.xpTarget}`;
    mugCount.textContent = String(progress.mugs);
  }

  bindLocalized(events, () => render(latest));
  events.on('PROGRESS_CHANGED', render);
}
