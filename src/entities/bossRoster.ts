import type { BossTier } from '../core/bossTier';
import type { CombatTargetType } from './combatTarget';

export const BOSS_LEVEL_INTERVAL = 5;

const TIER_ORDER: readonly BossTier[] = ['butcher', 'goblinKing', 'executioner'];
const EXTRA_CYCLE_HEALTH_BONUS = 0.3;
const EXTRA_CYCLE_MUG_BONUS = 5;

interface TierProfile {
  maxHealth: number;
  mugCount: number;
  type: CombatTargetType;
}

const PROFILES: Record<BossTier, TierProfile> = {
  butcher: { maxHealth: 40, mugCount: 18, type: { mass: 10, radius: 1.6, height: 5.6 } },
  goblinKing: { maxHealth: 60, mugCount: 25, type: { mass: 8, radius: 1.3, height: 4.2 } },
  executioner: { maxHealth: 80, mugCount: 35, type: { mass: 12, radius: 1.7, height: 6.2 } }
};

export interface BossSpec {
  tier: BossTier;
  maxHealth: number;
  mugCount: number;
  type: CombatTargetType;
}

export function resolveBossSpec(level: number): BossSpec {
  const milestone = Math.max(1, Math.floor(level / BOSS_LEVEL_INTERVAL));
  const tier = TIER_ORDER[Math.min(milestone, TIER_ORDER.length) - 1];
  const extraCycles = Math.max(0, milestone - TIER_ORDER.length);
  const profile = PROFILES[tier];
  return {
    tier,
    maxHealth: Math.round(profile.maxHealth * (1 + EXTRA_CYCLE_HEALTH_BONUS * extraCycles)),
    mugCount: profile.mugCount + EXTRA_CYCLE_MUG_BONUS * extraCycles,
    type: profile.type
  };
}
