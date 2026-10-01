import type { TranslationKey } from '../i18n';

export type PerkId =
  | 'longer_chain'
  | 'heavy_spikes'
  | 'double_morningstar'
  | 'iron_armor'
  | 'spike_boots'
  | 'ale_magnet'
  | 'chain_lightning'
  | 'vampiric_ale'
  | 'momentum_cleave'
  | 'spiked_trail';

export type PerkTag = 'offense' | 'mobility' | 'utility' | 'defense';

export interface PerkDefinition {
  id: PerkId;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  tagKey: TranslationKey;
  tag: PerkTag;
  icon: string;
}

export const PERKS: readonly PerkDefinition[] = [
  {
    id: 'longer_chain',
    titleKey: 'perk.longerChain.title',
    descKey: 'perk.longerChain.desc',
    tagKey: 'perk.tag.offense',
    tag: 'offense',
    icon: '⛓'
  },
  {
    id: 'heavy_spikes',
    titleKey: 'perk.heavySpikes.title',
    descKey: 'perk.heavySpikes.desc',
    tagKey: 'perk.tag.offense',
    tag: 'offense',
    icon: '✹'
  },
  {
    id: 'double_morningstar',
    titleKey: 'perk.doubleMorningstar.title',
    descKey: 'perk.doubleMorningstar.desc',
    tagKey: 'perk.tag.offense',
    tag: 'offense',
    icon: '⚔'
  },
  {
    id: 'iron_armor',
    titleKey: 'perk.ironArmor.title',
    descKey: 'perk.ironArmor.desc',
    tagKey: 'perk.tag.defense',
    tag: 'defense',
    icon: '🛡️'
  },
  {
    id: 'spike_boots',
    titleKey: 'perk.spikeBoots.title',
    descKey: 'perk.spikeBoots.desc',
    tagKey: 'perk.tag.mobility',
    tag: 'mobility',
    icon: '👢'
  },
  {
    id: 'ale_magnet',
    titleKey: 'perk.aleMagnet.title',
    descKey: 'perk.aleMagnet.desc',
    tagKey: 'perk.tag.utility',
    tag: 'utility',
    icon: '🧲'
  },
  {
    id: 'chain_lightning',
    titleKey: 'perk.chainLightning.title',
    descKey: 'perk.chainLightning.desc',
    tagKey: 'perk.tag.offense',
    tag: 'offense',
    icon: '⚡'
  },
  {
    id: 'vampiric_ale',
    titleKey: 'perk.vampiricAle.title',
    descKey: 'perk.vampiricAle.desc',
    tagKey: 'perk.tag.defense',
    tag: 'defense',
    icon: '🍷'
  },
  {
    id: 'momentum_cleave',
    titleKey: 'perk.momentumCleave.title',
    descKey: 'perk.momentumCleave.desc',
    tagKey: 'perk.tag.offense',
    tag: 'offense',
    icon: '🌀'
  },
  {
    id: 'spiked_trail',
    titleKey: 'perk.spikedTrail.title',
    descKey: 'perk.spikedTrail.desc',
    tagKey: 'perk.tag.mobility',
    tag: 'mobility',
    icon: '✴'
  }
];

export function drawPerks(count: number, isAvailable: (id: PerkId) => boolean): PerkDefinition[] {
  const pool = PERKS.filter((perk) => isAvailable(perk.id));
  for (let index = pool.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }
  return pool.slice(0, count);
}
