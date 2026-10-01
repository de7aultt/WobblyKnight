import * as THREE from 'three';
import type { GameEventBus } from '../core/events';
import { Boss } from './boss';
import { BOSS_LEVEL_INTERVAL, resolveBossSpec } from './bossRoster';
import { BottleField } from './bottleField';

const BOSS_SPAWN_DISTANCE = 8;

export class BossDirector {
  boss: Boss | null = null;
  private readonly bottles: BottleField;
  private nextBossLevel = BOSS_LEVEL_INTERVAL;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly events: GameEventBus
  ) {
    this.bottles = new BottleField(scene, events);
  }

  reset(): void {
    this.boss?.dispose();
    this.boss = null;
    this.bottles.clear();
    this.nextBossLevel = BOSS_LEVEL_INTERVAL;
  }

  shouldSpawn(reachedLevel: number): boolean {
    return this.boss === null && reachedLevel >= this.nextBossLevel;
  }

  spawn(reachedLevel: number, playerPosition: THREE.Vector3): void {
    const spec = resolveBossSpec(this.nextBossLevel);
    this.nextBossLevel = (Math.floor(reachedLevel / BOSS_LEVEL_INTERVAL) + 1) * BOSS_LEVEL_INTERVAL;
    let directionX = -playerPosition.x;
    let directionZ = -playerPosition.z;
    let length = Math.hypot(directionX, directionZ);
    if (length < 1) {
      directionX = 1;
      directionZ = 1;
      length = Math.SQRT2;
    }
    this.boss = new Boss(
      spec,
      this.events,
      this.bottles,
      (directionX / length) * BOSS_SPAWN_DISTANCE,
      (directionZ / length) * BOSS_SPAWN_DISTANCE
    );
    this.scene.add(this.boss.rig.root);
  }

  update(
    deltaSeconds: number,
    playerPosition: THREE.Vector3,
    knightInvulnerable: boolean
  ): boolean {
    this.bottles.update(deltaSeconds, playerPosition, knightInvulnerable);
    if (!this.boss) return false;
    this.boss.update(deltaSeconds, playerPosition, knightInvulnerable);
    if (this.boss.phase !== 'DEFEATED') return false;
    this.boss.dispose();
    this.boss = null;
    return true;
  }
}
