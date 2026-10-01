import { unlockAudio } from '../core/audio';
import { HEROES, itemsOf, type ArmoryCategory, type ArmoryItem } from '../core/armoryItems';
import { t } from '../i18n';
import { BANK_ICON, createActionButton, createElement, type ShopContext } from './shopCards';

function describe(category: ArmoryCategory, item: ArmoryItem<string>): string {
  if (category !== 'hero') return t(item.descKey);
  const hero = HEROES.find((candidate) => candidate.id === item.id);
  return hero ? `${t(hero.abilityTitleKey)}: ${t(hero.descKey)}` : t(item.descKey);
}

function createActionFor(context: ShopContext, category: ArmoryCategory, item: ArmoryItem<string>): HTMLButtonElement {
  const { armory, events } = context;
  if (armory.isEquipped(category, item.id)) {
    return createActionButton(t('armory.equipped'), true, () => undefined, 'shop-card__buy--equipped');
  }
  if (armory.isUnlocked(category, item.id)) {
    return createActionButton(t('armory.equip'), false, () => {
      void unlockAudio();
      armory.equip(category, item.id);
      context.refresh();
    });
  }
  return createActionButton(`${t('shop.buy')} ${BANK_ICON} ${item.cost}`, !armory.canAfford(category, item.id), () => {
    void unlockAudio();
    if (!armory.buy(category, item.id)) return;
    events.emit('SHOP_PURCHASE');
    context.refresh();
  });
}

function createCard(context: ShopContext, category: ArmoryCategory, item: ArmoryItem<string>): HTMLElement {
  const equipped = context.armory.isEquipped(category, item.id);
  const card = createElement('div', equipped ? 'shop-card shop-card--equipped' : 'shop-card');
  const header = createElement('div', 'shop-card__header');
  header.append(
    createElement('span', 'shop-card__icon', item.icon),
    createElement('span', 'shop-card__title', t(item.nameKey))
  );
  card.append(header, createElement('p', 'shop-card__desc', describe(category, item)), createActionFor(context, category, item));
  return card;
}

export function createArmoryCards(context: ShopContext, category: ArmoryCategory): HTMLElement[] {
  return itemsOf(category).map((item) => createCard(context, category, item));
}
