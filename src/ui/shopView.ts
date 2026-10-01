import './shopView.css';
import { unlockAudio } from '../core/audio';
import type { GameEventBus } from '../core/events';
import type { MetaProgression } from '../core/metaProgression';
import { META_UPGRADES, type MetaUpgradeDefinition } from '../core/metaUpgrades';
import { t } from '../i18n';

const PIP_FILLED = '●';
const PIP_EMPTY = '○';
const BANK_ICON = '🍺';

export interface ShopOptions {
  root: HTMLElement;
  events: GameEventBus;
  meta: MetaProgression;
  onBack: () => void;
}

function createElement(tag: keyof HTMLElementTagNameMap, className: string, text = ''): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

export function openShopView(options: ShopOptions): void {
  const { root, events, meta, onBack } = options;
  const overlay = createElement('div', 'shop interactive');
  const bank = createElement('div', 'shop__bank');
  const grid = createElement('div', 'shop__grid');
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'shop__back';
  back.textContent = t('shop.back');

  function createPips(definition: MetaUpgradeDefinition): HTMLElement {
    const rank = meta.rankOf(definition.id);
    const pips = createElement('div', 'shop-card__pips');
    pips.title = `${t('shop.rank')} ${rank}/${meta.maxRankOf(definition.id)}`;
    definition.costs.forEach((_, index) => {
      const filled = index < rank;
      pips.append(createElement('span', filled ? 'shop-pip shop-pip--filled' : 'shop-pip', filled ? PIP_FILLED : PIP_EMPTY));
    });
    return pips;
  }

  function createBuyButton(definition: MetaUpgradeDefinition): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'shop-card__buy';
    const maxed = meta.isMaxed(definition.id);
    button.textContent = maxed ? t('shop.maxed') : t('shop.buy');
    button.disabled = maxed || !meta.canAfford(definition.id);
    button.addEventListener('click', () => {
      void unlockAudio();
      if (!meta.buyUpgrade(definition.id)) return;
      events.emit('SHOP_PURCHASE');
      render();
    });
    return button;
  }

  function createCard(definition: MetaUpgradeDefinition): HTMLElement {
    const card = createElement('div', 'shop-card');
    const cost = meta.nextCost(definition.id);
    const header = createElement('div', 'shop-card__header');
    header.append(
      createElement('span', 'shop-card__icon', definition.icon),
      createElement('span', 'shop-card__title', t(definition.titleKey))
    );
    const footer = createElement('div', 'shop-card__footer');
    footer.append(createPips(definition));
    if (cost !== null) footer.append(createElement('span', 'shop-card__cost', `${BANK_ICON} ${cost}`));
    card.append(header, createElement('p', 'shop-card__desc', t(definition.descKey)), footer, createBuyButton(definition));
    return card;
  }

  function render(): void {
    bank.textContent = `${BANK_ICON} ${meta.bank}`;
    grid.replaceChildren(...META_UPGRADES.map(createCard));
  }

  back.addEventListener('click', () => {
    overlay.remove();
    onBack();
  });

  overlay.append(createElement('h2', 'shop__title', t('shop.title')), bank, grid, back);
  render();
  root.append(overlay);
}
