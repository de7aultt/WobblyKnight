import * as THREE from 'three';
import type { GameEventBus } from '../core/events';
import { AleBottle } from './aleBottle';
import { FirePuddle } from './firePuddle';

const BURN_DAMAGE = 1;
const BURN_KNOCKBACK = 7;

export interface BottleLauncher {
  launch(origin: THREE.Vector3, targetX: number, targetZ: number): void;
}

export class BottleField implements BottleLauncher {
  private readonly bottles: AleBottle[] = [];
  private readonly puddles: FirePuddle[] = [];

  constructor(
    private readonly scene: THREE.Scene,
    private readonly events: GameEventBus
  ) {}

  launch(origin: THREE.Vector3, targetX: number, targetZ: number): void {
    const bottle = new AleBottle(origin, targetX, targetZ);
    this.scene.add(bottle.mesh, bottle.indicator);
    this.bottles.push(bottle);
  }

  update(deltaSeconds: number, knightPosition: THREE.Vector3, knightInvulnerable: boolean): void {
    this.updateBottles(deltaSeconds);
    this.updatePuddles(deltaSeconds, knightPosition, knightInvulnerable);
  }

  clear(): void {
    this.bottles.forEach((bottle) => bottle.dispose());
    this.puddles.forEach((puddle) => puddle.dispose());
    this.bottles.length = 0;
    this.puddles.length = 0;
  }

  private updateBottles(deltaSeconds: number): void {
    for (let index = this.bottles.length - 1; index >= 0; index--) {
      const bottle = this.bottles[index];
      if (!bottle.update(deltaSeconds)) continue;
      bottle.dispose();
      this.bottles.splice(index, 1);
      const puddle = new FirePuddle(bottle.targetX, bottle.targetZ);
      this.scene.add(puddle.mesh);
      this.puddles.push(puddle);
      this.events.emit('BOSS_BOTTLE_SHATTER', { x: bottle.targetX, z: bottle.targetZ });
    }
  }

  private updatePuddles(deltaSeconds: number, knightPosition: THREE.Vector3, knightInvulnerable: boolean): void {
    for (let index = this.puddles.length - 1; index >= 0; index--) {
      const puddle = this.puddles[index];
      puddle.update(deltaSeconds);
      if (!puddle.isAlive) {
        puddle.dispose();
        this.puddles.splice(index, 1);
        continue;
      }
      if (knightInvulnerable || !puddle.tryBurn(knightPosition.x, knightPosition.z)) continue;
      const deltaX = knightPosition.x - puddle.x;
      const deltaZ = knightPosition.z - puddle.z;
      const length = Math.hypot(deltaX, deltaZ) || 1;
      this.events.emit('BOSS_SLAM', {
        dirX: deltaX / length,
        dirZ: deltaZ / length,
        damage: BURN_DAMAGE,
        knockback: BURN_KNOCKBACK
      });
    }
  }
}
