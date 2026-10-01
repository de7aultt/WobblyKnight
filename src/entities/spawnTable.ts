import type { EnemyKind, SpecialEnemyKind } from './enemyTypes';

interface Unlock {
  kind: SpecialEnemyKind;
  level: number;
}

const UNLOCKS: readonly Unlock[] = [
  { kind: 'bomber', level: 6 },
  { kind: 'shieldGuard', level: 11 },
  { kind: 'ghoul', level: 16 }
];

const BRIGAND_RAMP_SECONDS = 60;
const MAX_BRIGAND_CHANCE = 0.4;
const SPECIAL_SPAWN_CHANCE = 0.35;

export function pendingUnlocks(level: number, announced: ReadonlySet<EnemyKind>): SpecialEnemyKind[] {
  return UNLOCKS.filter((unlock) => level >= unlock.level && !announced.has(unlock.kind)).map((unlock) => unlock.kind);
}

export function pickEnemyKind(level: number, elapsedSeconds: number): EnemyKind {
  const unlocked = UNLOCKS.filter((unlock) => level >= unlock.level);
  if (unlocked.length > 0 && Math.random() < SPECIAL_SPAWN_CHANCE) {
    return unlocked[Math.floor(Math.random() * unlocked.length)].kind;
  }
  const brigandChance = Math.min(elapsedSeconds / BRIGAND_RAMP_SECONDS, 1) * MAX_BRIGAND_CHANCE;
  return Math.random() < brigandChance ? 'brigand' : 'goblin';
}
