import type * as THREE from 'three';
import type { GameEventBus } from '../core/events';
import type { BossBody } from './bossBody';
import type { BottleLauncher } from './bottleField';

export interface BossContext {
  body: BossBody;
  events: GameEventBus;
  bottles: BottleLauncher;
}

export interface BossBehavior {
  readonly damageMultiplier: number;
  update(deltaSeconds: number, knightPosition: THREE.Vector3, knightInvulnerable: boolean): void;
}
