import './bossHud.css';
import type { GameEventBus } from '../core/events';
import { t } from '../i18n';

function createElement(tag: keyof HTMLElementTagNameMap, className: string, text = ''): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

export function mountBossHud(root: HTMLElement, events: GameEventBus): void {
  const panel = createElement('div', 'boss-hud boss-hud--hidden');
  const title = createElement('div', 'boss-hud__title', t('boss.giantButcher'));
  const track = createElement('div', 'boss-hud__track');
  const damage = createElement('div', 'boss-hud__damage');
  const fill = createElement('div', 'boss-hud__fill');
  track.append(damage, fill);
  panel.append(title, track);
  root.append(panel);

  function setRatio(ratio: number): void {
    const percent = `${Math.min(Math.max(ratio, 0), 1) * 100}%`;
    fill.style.width = percent;
    damage.style.width = percent;
  }

  function showBanner(headline: string, subline: string): void {
    const banner = createElement('div', 'boss-banner');
    banner.append(createElement('div', 'boss-banner__headline', headline), createElement('div', 'boss-banner__subline', subline));
    banner.addEventListener('animationend', () => banner.remove());
    root.append(banner);
  }

  events.on('BOSS_SPAWNED', () => {
    setRatio(1);
    panel.classList.remove('boss-hud--hidden');
    showBanner(t('boss.warning'), t('boss.incoming'));
  });
  events.on('BOSS_HEALTH', ({ ratio }) => setRatio(ratio));
  events.on('BOSS_DEFEATED', () => {
    panel.classList.add('boss-hud--hidden');
    showBanner(t('boss.defeatedBanner'), t('boss.rewardLine'));
  });
}
