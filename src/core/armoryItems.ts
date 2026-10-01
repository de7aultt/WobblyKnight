import type { TranslationKey } from '../i18n';

export type ArmoryCategory = 'hero' | 'weapon' | 'arena';
export type HeroId = 'classic_knight' | 'golden_paladin' | 'drunk_barbarian';
export type WeaponId = 'iron_morningstar' | 'battle_cleaver' | 'golden_twin';
export type ArenaId = 'tavern_pit' | 'dungeon_crypt' | 'royal_courtyard';

export interface ArmoryItem<Id extends string> {
  id: Id;
  nameKey: TranslationKey;
  descKey: TranslationKey;
  icon: string;
  cost: number;
}

export interface HeroItem extends ArmoryItem<HeroId> {
  abilityIcon: string;
  abilityTitleKey: TranslationKey;
}

export interface WeaponEffects {
  impactMultiplier: number;
  reachMultiplier: number;
  dual: boolean;
}

export interface WeaponItem extends ArmoryItem<WeaponId> {
  effects: WeaponEffects;
}

export const HEROES: readonly HeroItem[] = [
  {
    id: 'classic_knight',
    nameKey: 'hero.classicKnight.name',
    descKey: 'ability.whirlwind.desc',
    abilityTitleKey: 'ability.whirlwind.title',
    icon: '🪖',
    abilityIcon: '🌀',
    cost: 0
  },
  {
    id: 'golden_paladin',
    nameKey: 'hero.goldenPaladin.name',
    descKey: 'ability.holyStomp.desc',
    abilityTitleKey: 'ability.holyStomp.title',
    icon: '👑',
    abilityIcon: '✨',
    cost: 60
  },
  {
    id: 'drunk_barbarian',
    nameKey: 'hero.drunkBarbarian.name',
    descKey: 'ability.aleFrenzy.desc',
    abilityTitleKey: 'ability.aleFrenzy.title',
    icon: '🪓',
    abilityIcon: '🍺',
    cost: 120
  }
];

export const WEAPONS: readonly WeaponItem[] = [
  {
    id: 'iron_morningstar',
    nameKey: 'weapon.ironMorningstar.name',
    descKey: 'weapon.ironMorningstar.desc',
    icon: '⚒️',
    cost: 0,
    effects: { impactMultiplier: 1, reachMultiplier: 1, dual: false }
  },
  {
    id: 'battle_cleaver',
    nameKey: 'weapon.battleCleaver.name',
    descKey: 'weapon.battleCleaver.desc',
    icon: '🔪',
    cost: 40,
    effects: { impactMultiplier: 1.3, reachMultiplier: 0.75, dual: false }
  },
  {
    id: 'golden_twin',
    nameKey: 'weapon.goldenTwin.name',
    descKey: 'weapon.goldenTwin.desc',
    icon: '🔱',
    cost: 100,
    effects: { impactMultiplier: 1, reachMultiplier: 1, dual: true }
  }
];

export const ARENAS: readonly ArmoryItem<ArenaId>[] = [
  { id: 'tavern_pit', nameKey: 'arena.tavernPit.name', descKey: 'arena.tavernPit.desc', icon: '🪵', cost: 0 },
  { id: 'dungeon_crypt', nameKey: 'arena.dungeonCrypt.name', descKey: 'arena.dungeonCrypt.desc', icon: '💀', cost: 50 },
  { id: 'royal_courtyard', nameKey: 'arena.royalCourtyard.name', descKey: 'arena.royalCourtyard.desc', icon: '🏰', cost: 100 }
];

export function itemsOf(category: ArmoryCategory): readonly ArmoryItem<string>[] {
  if (category === 'hero') return HEROES;
  if (category === 'weapon') return WEAPONS;
  return ARENAS;
}

export function findHero(id: HeroId): HeroItem {
  return HEROES.find((hero) => hero.id === id) ?? HEROES[0];
}

export function findWeapon(id: WeaponId): WeaponItem {
  return WEAPONS.find((weapon) => weapon.id === id) ?? WEAPONS[0];
}
