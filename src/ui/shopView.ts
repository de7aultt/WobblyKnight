import './shopView.css';
import type { ArmoryStore } from '../core/armoryState';
import type { GameEventBus } from '../core/events';
import type { MetaProgression } from '../core/metaProgression';
import { t, type TranslationKey } from '../i18n';
import { createArmoryCards } from './armoryTab';
import { BANK_ICON, createElement, type ShopContext } from './shopCards';
import { createUpgradeCards } from './upgradeTab';

type ShopTab = 'upgrades' | 'hero' | 'weapon' | 'arena';

const TABS: ReadonlyArray<{ id: ShopTab; labelKey: TranslationKey }> = [
  { id: 'upgrades', labelKey: 'armory.tabUpgrades' },
  { id: 'hero', labelKey: 'armory.tabHeroes' },
  { id: 'weapon', labelKey: 'armory.tabWeapons' },
  { id: 'arena', labelKey: 'armory.tabArenas' }
];

export interface ShopOptions {
  root: HTMLElement;
  events: GameEventBus;
  meta: MetaProgression;
  armory: ArmoryStore;
  onBack: () => void;
}

export function openShopView(options: ShopOptions): void {
  const { root, events, meta, armory, onBack } = options;
  const overlay = createElement('div', 'shop interactive');
  const title = createElement('h2', 'shop__title');
  const bank = createElement('div', 'shop__bank');
  const tabBar = createElement('div', 'shop__tabs');
  const grid = createElement('div', 'shop__grid');
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'shop__back';
  let activeTab: ShopTab = 'upgrades';

  const context: ShopContext = { events, meta, armory, refresh: () => render() };

  const tabButtons = TABS.map((tab) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'shop__tab';
    button.addEventListener('click', () => {
      activeTab = tab.id;
      render();
    });
    tabBar.append(button);
    return { tab, button };
  });

  function createCards(): HTMLElement[] {
    return activeTab === 'upgrades' ? createUpgradeCards(context) : createArmoryCards(context, activeTab);
  }

  function render(): void {
    title.textContent = t('shop.title');
    back.textContent = t('shop.back');
    bank.textContent = `${BANK_ICON} ${meta.bank}`;
    tabButtons.forEach(({ tab, button }) => {
      button.textContent = t(tab.labelKey);
      button.classList.toggle('shop__tab--active', tab.id === activeTab);
    });
    grid.className = activeTab === 'upgrades' ? 'shop__grid' : 'shop__grid shop__grid--armory';
    grid.replaceChildren(...createCards());
  }

  const stopListening = events.on('LOCALE_CHANGED', render);
  back.addEventListener('click', () => {
    stopListening();
    overlay.remove();
    onBack();
  });

  overlay.append(title, bank, tabBar, grid, back);
  render();
  root.append(overlay);
}
