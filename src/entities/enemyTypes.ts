export type EnemyKind = 'goblin' | 'brigand';

export interface EnemyType {
  kind: EnemyKind;
  scale: number;
  girth: number;
  speed: number;
  mass: number;
  health: number;
  radius: number;
  height: number;
  skinColor: number;
  tunicColor: number;
  accentColor: number;
  swayAmount: number;
  walkRate: number;
}

export const ENEMY_TYPES: Readonly<Record<EnemyKind, EnemyType>> = {
  goblin: {
    kind: 'goblin',
    scale: 0.85,
    girth: 1,
    speed: 4.6,
    mass: 1,
    health: 1,
    radius: 0.42,
    height: 1.45,
    skinColor: 0x6fae3c,
    tunicColor: 0x6b4a2b,
    accentColor: 0xb3202a,
    swayAmount: 0.14,
    walkRate: 11
  },
  brigand: {
    kind: 'brigand',
    scale: 1.3,
    girth: 1.2,
    speed: 2.4,
    mass: 1.8,
    health: 2,
    radius: 0.7,
    height: 2.15,
    skinColor: 0xd9a27a,
    tunicColor: 0x5b4636,
    accentColor: 0x6d727a,
    swayAmount: 0.2,
    walkRate: 6
  }
};
