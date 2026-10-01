import * as THREE from 'three';
import type { Enemy } from '../entities/enemy';
import type { ImpactSparks } from '../render/impactSparks';
import type { FlailChain } from './flailChain';

export interface CombatSettings {
  minImpactSpeed: number;
  heavyImpactSpeed: number;
  knockbackScale: number;
  maxHorizontalImpulse: number;
  liftBase: number;
  liftPerSpeed: number;
  shoveStrength: number;
  sparkSpeedReference: number;
}

export const DEFAULT_COMBAT_SETTINGS: CombatSettings = {
  minImpactSpeed: 4,
  heavyImpactSpeed: 12,
  knockbackScale: 1.4,
  maxHorizontalImpulse: 30,
  liftBase: 6,
  liftPerSpeed: 0.12,
  shoveStrength: 4,
  sparkSpeedReference: 20
};

export class Combat {
  private readonly tipVelocity = new THREE.Vector3();
  private readonly direction = new THREE.Vector3();
  private readonly impulse = new THREE.Vector3();
  private readonly contactPoint = new THREE.Vector3();
  private readonly enemyCenter = new THREE.Vector3();

  constructor(
    private readonly sparks: ImpactSparks,
    private readonly settings: CombatSettings = DEFAULT_COMBAT_SETTINGS
  ) {}

  update(deltaSeconds: number, chain: FlailChain, enemies: readonly Enemy[]): void {
    const speed = chain.tipSpeed;
    const tipPosition = chain.tipPosition;
    const tipRadius = chain.tipRadius;
    chain.getTipVelocity(this.tipVelocity);

    for (const enemy of enemies) {
      if (!enemy.isCollidable || !enemy.overlapsSphere(tipPosition, tipRadius)) continue;
      this.resolveDirection(tipPosition, enemy);
      if (speed < this.settings.minImpactSpeed) {
        enemy.shove(this.direction.x, this.direction.z, this.settings.shoveStrength * deltaSeconds);
      } else if (enemy.isHittable) {
        this.strike(chain, enemy, speed);
      }
    }
  }

  private resolveDirection(tipPosition: THREE.Vector3, enemy: Enemy): void {
    const speedPlanar = Math.hypot(this.tipVelocity.x, this.tipVelocity.z);
    if (speedPlanar > this.settings.minImpactSpeed * 0.5) {
      this.direction.set(this.tipVelocity.x / speedPlanar, 0, this.tipVelocity.z / speedPlanar);
      return;
    }
    this.direction.set(enemy.position.x - tipPosition.x, 0, enemy.position.z - tipPosition.z);
    if (this.direction.lengthSq() < 1e-6) this.direction.set(1, 0, 0);
    this.direction.normalize();
  }

  private strike(chain: FlailChain, enemy: Enemy, speed: number): void {
    const { heavyImpactSpeed, knockbackScale, maxHorizontalImpulse, liftBase, liftPerSpeed } = this.settings;
    const damage = speed >= heavyImpactSpeed ? 2 : 1;
    const horizontal = Math.min((speed * knockbackScale) / enemy.type.mass, maxHorizontalImpulse);
    const lethal = damage >= enemy.health;
    const lift = lethal ? liftBase + speed * liftPerSpeed : 0;
    this.impulse.set(this.direction.x * horizontal, lift, this.direction.z * horizontal);

    this.enemyCenter.copy(enemy.position);
    this.enemyCenter.y += enemy.type.height * 0.5;
    this.contactPoint.lerpVectors(chain.tipPosition, this.enemyCenter, 0.5);
    this.sparks.burst(this.contactPoint, speed / this.settings.sparkSpeedReference);
    enemy.receiveHit(damage, this.impulse);
  }
}
