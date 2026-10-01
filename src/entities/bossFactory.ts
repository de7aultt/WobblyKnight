import type { BossTier } from '../core/bossTier';
import type { BossBehavior, BossContext } from './bossBehavior';
import { createExecutionerMesh } from './executionerMesh';
import { ExecutionerBehavior } from './executionerBehavior';
import { createBossMesh } from './bossMesh';
import { ButcherBehavior } from './butcherBehavior';
import { createKingMesh } from './kingMesh';
import { KingBehavior } from './kingBehavior';
import type { BossRig } from './bossRig';

export function createBossRig(tier: BossTier): BossRig {
  if (tier === 'goblinKing') return createKingMesh();
  if (tier === 'executioner') return createExecutionerMesh();
  return createBossMesh();
}

export function createBossBehavior(tier: BossTier, context: BossContext): BossBehavior {
  if (tier === 'goblinKing') return new KingBehavior(context);
  if (tier === 'executioner') return new ExecutionerBehavior(context);
  return new ButcherBehavior(context);
}
