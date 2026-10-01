import * as THREE from 'three';
import type { GameEventBus } from '../core/events';
import type { Health } from '../core/health';
import type { RunStats } from '../core/runStats';
import type { AleMugField } from '../entities/aleMug';
import type { Player } from '../entities/player';
import type { ImpactSparks } from '../render/impactSparks';

const BOSS_EXPLOSION_BURSTS = 6;
const BOMB_SPARK_INTENSITY = 1.4;
const BOTTLE_SPARK_INTENSITY = 1;

export interface HazardEventDeps {
  events: GameEventBus;
  health: Health;
  player: Player;
  sparks: ImpactSparks;
  aleMugs: AleMugField;
  runStats: RunStats;
}

export function wireHazardEvents(deps: HazardEventDeps): void {
  const { events, health, player, sparks, aleMugs, runStats } = deps;
  const point = new THREE.Vector3();

  function applyKnightHit({ dirX, dirZ, damage, knockback }: { dirX: number; dirZ: number; damage: number; knockback: number }): void {
    if (health.takeDamage(damage)) player.knockback(dirX, dirZ, knockback);
  }

  events.on('BOSS_SLAM', applyKnightHit);
  events.on('HAZARD_HIT', applyKnightHit);
  events.on('BOMB_EXPLODED', ({ x, z }) => {
    point.set(x, 0.6, z);
    sparks.burst(point, BOMB_SPARK_INTENSITY);
  });
  events.on('BOSS_BOTTLE_SHATTER', ({ x, z }) => {
    point.set(x, 0.5, z);
    sparks.burst(point, BOTTLE_SPARK_INTENSITY);
  });
  events.on('BOSS_DEFEATED', ({ x, z, mugCount }) => {
    runStats.addEnemy();
    aleMugs.spawnBurst(x, z, mugCount);
    for (let index = 0; index < BOSS_EXPLOSION_BURSTS; index++) {
      point.set(x + (Math.random() - 0.5) * 3, 1 + Math.random() * 3, z + (Math.random() - 0.5) * 3);
      sparks.burst(point, 1.5);
    }
  });
}
