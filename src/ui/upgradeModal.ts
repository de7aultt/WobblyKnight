import './upgradeModal.css';
import type { GameEventBus } from '../core/events';
import type { GameLoop } from '../core/loop';
import { drawPerks, type PerkDefinition, type PerkId } from '../core/perks';
import type { PlayerStats } from '../core/playerStats';
import { t } from '../i18n';

const CARD_COUNT = 3;

export interface UpgradeModalOptions {
  root: HTMLElement;
  events: GameEventBus;
  loop: GameLoop;
  stats: PlayerStats;
  onPerkChosen: (perkId: PerkId) => void;
}

function createElement(tag: keyof HTMLElementTagNameMap, className: string, text = ''): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function createCard(perk: PerkDefinition, index: number, onChoose: () => void): HTMLButtonElement {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = `perk-card perk-card--${perk.tag}`;
  card.append(
    createElement('span', 'perk-card__key', String(index + 1)),
    createElement('span', 'perk-card__icon', perk.icon),
    createElement('span', 'perk-card__tag', t(perk.tagKey)),
    createElement('span', 'perk-card__title', t(perk.titleKey)),
    createElement('span', 'perk-card__desc', t(perk.descKey))
  );
  card.addEventListener('click', onChoose);
  return card;
}

export function mountUpgradeModal(options: UpgradeModalOptions): void {
  const { root, events, loop, stats, onPerkChosen } = options;
  let overlay: HTMLElement | null = null;
  let offeredPerks: PerkDefinition[] = [];

  function close(): void {
    overlay?.remove();
    overlay = null;
    window.removeEventListener('keydown', handleKey);
    loop.setPaused(false);
  }

  function choose(perk: PerkDefinition): void {
    if (!overlay) return;
    onPerkChosen(perk.id);
    close();
  }

  function handleKey(event: KeyboardEvent): void {
    const index = ['Digit1', 'Digit2', 'Digit3'].indexOf(event.code);
    if (index >= 0 && offeredPerks[index]) choose(offeredPerks[index]);
  }

  function open(level: number): void {
    if (overlay) return;
    loop.setPaused(true);
    offeredPerks = drawPerks(CARD_COUNT, (id) => stats.isPerkAvailable(id));

    const cards = createElement('div', 'upgrade-modal__cards');
    offeredPerks.forEach((perk, index) => cards.append(createCard(perk, index, () => choose(perk))));

    overlay = createElement('div', 'upgrade-modal interactive');
    overlay.append(
      createElement('div', 'upgrade-modal__level', `${t('hud.levelShort')} ${level}`),
      createElement('h2', 'upgrade-modal__banner', t('levelUp.banner')),
      createElement('p', 'upgrade-modal__prompt', t('levelUp.prompt')),
      cards,
      createElement('p', 'upgrade-modal__hint', t('levelUp.hint'))
    );
    root.append(overlay);
    window.addEventListener('keydown', handleKey);
  }

  events.on('LEVEL_UP', ({ level }) => open(level));
}
