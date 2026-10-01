import type { TranslationKey } from '../i18n';

export type MetaUpgradeId = 'max_hearts' | 'brawler_might' | 'magnetic_tankard' | 'quick_recovery';

export interface MetaUpgradeDefinition {
  id: MetaUpgradeId;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  icon: string;
  costs: readonly number[];
}

export const META_UPGRADES: readonly MetaUpgradeDefinition[] = [
  {
    id: 'max_hearts',
    titleKey: 'meta.maxHearts.title',
    descKey: 'meta.maxHearts.desc',
    icon: '❤️',
    costs: [25, 60]
  },
  {
    id: 'brawler_might',
    titleKey: 'meta.brawlerMight.title',
    descKey: 'meta.brawlerMight.desc',
    icon: '💪',
    costs: [20, 50, 100]
  },
  {
    id: 'magnetic_tankard',
    titleKey: 'meta.magneticTankard.title',
    descKey: 'meta.magneticTankard.desc',
    icon: '🧲',
    costs: [15, 40, 80]
  },
  {
    id: 'quick_recovery',
    titleKey: 'meta.quickRecovery.title',
    descKey: 'meta.quickRecovery.desc',
    icon: '🌀',
    costs: [30, 75]
  }
];
