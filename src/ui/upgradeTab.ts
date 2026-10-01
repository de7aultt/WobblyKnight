import { unlockAudio } from '../core/audio';
import { META_UPGRADES, type MetaUpgradeDefinition } from '../core/metaUpgrades';
import { t } from '../i18n';
import { BANK_ICON, createActionButton, createElement, type ShopContext } from './shopCards';

const PIP_FILLED = '●';
const PIP_EMPTY = '○';

function createPips(context: ShopContext, definition: MetaUpgradeDefinition): HTMLElement {
  const rank = context.meta.rankOf(definition.id);
  const pips = createElement('div', 'shop-card__pips');
  pips.title = `${t('shop.rank')} ${rank}/${context.meta.maxRankOf(definition.id)}`;
  definition.costs.forEach((_, index) => {
    const filled = index < rank;
    pips.append(createElement('span', filled ? 'shop-pip shop-pip--filled' : 'shop-pip', filled ? PIP_FILLED : PIP_EMPTY));
  });
  return pips;
}

function createCard(context: ShopContext, definition: MetaUpgradeDefinition): HTMLElement {
  const { meta, events } = context;
  const card = createElement('div', 'shop-card');
  const cost = meta.nextCost(definition.id);
  const header = createElement('div', 'shop-card__header');
  header.append(
    createElement('span', 'shop-card__icon', definition.icon),
    createElement('span', 'shop-card__title', t(definition.titleKey))
  );
  const footer = createElement('div', 'shop-card__footer');
  footer.append(createPips(context, definition));
  if (cost !== null) footer.append(createElement('span', 'shop-card__cost', `${BANK_ICON} ${cost}`));

  const maxed = meta.isMaxed(definition.id);
  const buyButton = createActionButton(maxed ? t('shop.maxed') : t('shop.buy'), maxed || !meta.canAfford(definition.id), () => {
    void unlockAudio();
    if (!meta.buyUpgrade(definition.id)) return;
    events.emit('SHOP_PURCHASE');
    context.refresh();
  });
  card.append(header, createElement('p', 'shop-card__desc', t(definition.descKey)), footer, buyButton);
  return card;
}

export function createUpgradeCards(context: ShopContext): HTMLElement[] {
  return META_UPGRADES.map((definition) => createCard(context, definition));
}
