import { findHero } from '../core/armoryItems';
import type { ArmoryLoadout } from '../core/armoryState';
import type { GameEventBus } from '../core/events';
import { t } from '../i18n';
import { bindLocalized } from './localized';

const DEFAULT_LOADOUT: ArmoryLoadout = { hero: 'classic_knight', weapon: 'iron_morningstar', arena: 'tavern_pit' };

export function mountDashIndicator(root: HTMLElement, events: GameEventBus): void {
  const container = document.createElement('div');
  container.className = 'dash-indicator';

  const slot = document.createElement('div');
  slot.className = 'perk-slot perk-slot--mobility';
  const icon = document.createElement('span');
  icon.className = 'perk-slot__icon';
  const cooldown = document.createElement('span');
  cooldown.className = 'perk-slot__cooldown';
  slot.append(icon, cooldown);

  const keyLabel = document.createElement('span');
  keyLabel.className = 'dash-indicator__key';
  container.append(slot, keyLabel);
  root.append(container);

  slot.addEventListener('animationend', () => slot.classList.remove('perk-slot--ready'));

  let loadout = DEFAULT_LOADOUT;

  function render(): void {
    const hero = findHero(loadout.hero);
    icon.textContent = hero.abilityIcon;
    slot.title = `${t(hero.abilityTitleKey)} - ${t(hero.descKey)}`;
    keyLabel.textContent = t('hud.dashKey');
  }

  bindLocalized(events, render);
  events.on('ARMORY_CHANGED', (next) => {
    loadout = next;
    render();
  });

  let previousRatio = 0;
  events.on('DASH_COOLDOWN', ({ ratio }) => {
    if (ratio === previousRatio) return;
    cooldown.style.height = `${ratio * 100}%`;
    if (ratio === 0 && previousRatio > 0) {
      slot.classList.remove('perk-slot--ready');
      void slot.offsetWidth;
      slot.classList.add('perk-slot--ready');
    }
    previousRatio = ratio;
  });
}
