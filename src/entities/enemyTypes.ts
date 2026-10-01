export type SpecialEnemyKind = 'bomber' | 'shieldGuard' | 'ghoul';
export type EnemyKind = 'goblin' | 'brigand' | SpecialEnemyKind;

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
  hunch: number;
  hasShield: boolean;
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
    walkRate: 11,
    hunch: 0,
    hasShield: false
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
    walkRate: 6,
    hunch: 0,
    hasShield: false
  },
  bomber: {
    kind: 'bomber',
    scale: 0.95,
    girth: 1,
    speed: 3.2,
    mass: 1,
    health: 2,
    radius: 0.45,
    height: 1.6,
    skinColor: 0xd9a27a,
    tunicColor: 0x6a4a2e,
    accentColor: 0x2d5fd1,
    swayAmount: 0.16,
    walkRate: 8,
    hunch: 0,
    hasShield: false
  },
  shieldGuard: {
    kind: 'shieldGuard',
    scale: 1.1,
    girth: 1.15,
    speed: 2.6,
    mass: 1.6,
    health: 3,
    radius: 0.62,
    height: 1.95,
    skinColor: 0xd9a27a,
    tunicColor: 0x4b5563,
    accentColor: 0x9aa3ad,
    swayAmount: 0.1,
    walkRate: 6,
    hunch: 0,
    hasShield: true
  },
  ghoul: {
    kind: 'ghoul',
    scale: 0.95,
    girth: 0.9,
    speed: 5.4,
    mass: 1,
    health: 2,
    radius: 0.45,
    height: 1.4,
    skinColor: 0x9a7fc4,
    tunicColor: 0x2b2236,
    accentColor: 0x6b3fa0,
    swayAmount: 0.18,
    walkRate: 12,
    hunch: 0.42,
    hasShield: false
  }
};
