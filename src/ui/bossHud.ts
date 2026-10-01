import './bossHud.css';
import type { BossTier } from '../core/bossTier';
import type { GameEventBus } from '../core/events';
import { t } from '../i18n';
import { BOSS_TEXT } from './bossText';
import { bindLocalized } from './localized';

function createElement(tag: keyof HTMLElementTagNameMap, className: string, text = ''): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

export function mountBossHud(root: HTMLElement, events: GameEventBus): void {
  const panel = createElement('div', 'boss-hud boss-hud--hidden');
  const title = createElement('div', 'boss-hud__title');
  const subtitle = createElement('div', 'boss-hud__subtitle');
  const track = createElement('div', 'boss-hud__track');
  const damage = createElement('div', 'boss-hud__damage');
  const fill = createElement('div', 'boss-hud__fill');
  const value = createElement('div', 'boss-hud__value');
  track.append(damage, fill, value);
  panel.append(title, subtitle, track);
  root.append(panel);

  let activeTier: BossTier | null = null;

  bindLocalized(events, () => {
    if (!activeTier) return;
    title.textContent = t(BOSS_TEXT[activeTier].name);
    subtitle.textContent = t(BOSS_TEXT[activeTier].title);
  });

  function setRatio(ratio: number): void {
    const percent = `${Math.min(Math.max(ratio, 0), 1) * 100}%`;
    fill.style.width = percent;
    damage.style.width = percent;
  }

  function showBanner(tier: BossTier, headline: string, subline: string): void {
    const banner = createElement('div', `boss-banner boss-banner--${tier}`);
    banner.append(createElement('div', 'boss-banner__headline', headline), createElement('div', 'boss-banner__subline', subline));
    banner.addEventListener('animationend', () => banner.remove());
    root.append(banner);
  }

  events.on('BOSS_SPAWNED', ({ tier, maxHealth }) => {
    activeTier = tier;
    panel.className = `boss-hud boss-hud--${tier}`;
    title.textContent = t(BOSS_TEXT[tier].name);
    subtitle.textContent = t(BOSS_TEXT[tier].title);
    value.textContent = `${maxHealth} / ${maxHealth}`;
    setRatio(1);
    showBanner(tier, t('boss.warning'), t(BOSS_TEXT[tier].incoming));
  });
  events.on('BOSS_HEALTH', ({ ratio, current, max }) => {
    setRatio(ratio);
    value.textContent = `${Math.ceil(current)} / ${max}`;
  });
  events.on('RUN_RESET', () => {
    panel.classList.add('boss-hud--hidden');
    root.querySelectorAll('.boss-banner').forEach((banner) => banner.remove());
  });
  events.on('BOSS_DEFEATED', ({ tier }) => {
    panel.classList.add('boss-hud--hidden');
    showBanner(tier, t(BOSS_TEXT[tier].defeated), t('boss.rewardLine'));
  });
}
