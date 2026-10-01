import * as THREE from 'three';
import type { PlayerStats } from '../core/playerStats';
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
  linkHitRadius: number;
  minLinkImpactSpeed: number;
  linkDamage: number;
  bodyShoveRadius: number;
  bodyShoveAcceleration: number;
  bodyStaggerSeconds: number;
  bootKickSpeed: number;
}

export const DEFAULT_COMBAT_SETTINGS: CombatSettings = {
  minImpactSpeed: 4,
  heavyImpactSpeed: 12,
  knockbackScale: 1.4,
  maxHorizontalImpulse: 30,
  liftBase: 6,
  liftPerSpeed: 0.12,
  shoveStrength: 4,
  sparkSpeedReference: 20,
  linkHitRadius: 0.3,
  minLinkImpactSpeed: 5,
  linkDamage: 1,
  bodyShoveRadius: 1.2,
  bodyShoveAcceleration: 45,
  bodyStaggerSeconds: 0.12,
  bootKickSpeed: 8
};

export class Combat {
  private readonly tipVelocity = new THREE.Vector3();
  private readonly linkVelocity = new THREE.Vector3();
  private readonly direction = new THREE.Vector3();
  private readonly impulse = new THREE.Vector3();
  private readonly contactPoint = new THREE.Vector3();
  private readonly enemyCenter = new THREE.Vector3();

  constructor(
    private readonly sparks: ImpactSparks,
    private readonly stats: PlayerStats,
    private readonly settings: CombatSettings = DEFAULT_COMBAT_SETTINGS
  ) {}

  update(
    deltaSeconds: number,
    chains: readonly FlailChain[],
    enemies: readonly Enemy[],
    knightPosition: THREE.Vector3
  ): void {
    for (const enemy of enemies) {
      if (!enemy.isCollidable) continue;
      this.shoveFromBody(deltaSeconds, enemy, knightPosition);
      for (const chain of chains) {
        this.resolveTip(deltaSeconds, chain, enemy);
        if (enemy.isHittable) this.resolveLinks(chain, enemy, knightPosition);
      }
    }
  }

  private shoveFromBody(deltaSeconds: number, enemy: Enemy, knightPosition: THREE.Vector3): void {
    const reach = this.settings.bodyShoveRadius + enemy.type.radius * 0.5;
    this.setOutwardDirection(enemy, knightPosition);
    const distance = Math.hypot(enemy.position.x - knightPosition.x, enemy.position.z - knightPosition.z);
    if (distance >= reach) return;
    const depth = 1 + (reach - distance) / reach;
    enemy.shove(this.direction.x, this.direction.z, this.settings.bodyShoveAcceleration * depth * deltaSeconds);
    enemy.stagger(this.settings.bodyStaggerSeconds);
    if (this.stats.bootsLevel > 0 && enemy.isHittable) {
      this.strike(enemy, knightPosition, this.settings.bootKickSpeed, this.stats.bootsLevel >= 2 ? 2 : 1, 1);
    }
  }

  private resolveTip(deltaSeconds: number, chain: FlailChain, enemy: Enemy): void {
    const tipPosition = chain.tipPosition;
    if (!enemy.isCollidable || !enemy.overlapsSphere(tipPosition, chain.tipRadius)) return;
    chain.getTipVelocity(this.tipVelocity);
    const speed = chain.tipSpeed;
    this.resolveTipDirection(tipPosition, enemy);
    if (speed < this.settings.minImpactSpeed) {
      enemy.shove(this.direction.x, this.direction.z, this.settings.shoveStrength * deltaSeconds);
      return;
    }
    if (!enemy.isHittable) return;
    const baseDamage = speed >= this.settings.heavyImpactSpeed ? 2 : 1;
    const multiplier = this.stats.impactMultiplier;
    this.strike(enemy, tipPosition, speed, baseDamage * multiplier, multiplier);
  }

  private resolveLinks(chain: FlailChain, enemy: Enemy, knightPosition: THREE.Vector3): void {
    for (const link of chain.links) {
      if (!enemy.overlapsSphere(link.position, this.settings.linkHitRadius)) continue;
      const speed = chain.getLinkVelocity(link, this.linkVelocity).length();
      if (speed < this.settings.minLinkImpactSpeed) continue;
      this.setOutwardDirection(enemy, knightPosition);
      const multiplier = this.stats.impactMultiplier;
      this.strike(enemy, link.position, speed, this.settings.linkDamage * multiplier, multiplier);
      return;
    }
  }

  private setOutwardDirection(enemy: Enemy, origin: THREE.Vector3): void {
    this.direction.set(enemy.position.x - origin.x, 0, enemy.position.z - origin.z);
    if (this.direction.lengthSq() < 1e-6) this.direction.set(1, 0, 0);
    this.direction.normalize();
  }

  private resolveTipDirection(tipPosition: THREE.Vector3, enemy: Enemy): void {
    const speedPlanar = Math.hypot(this.tipVelocity.x, this.tipVelocity.z);
    if (speedPlanar > this.settings.minImpactSpeed * 0.5) {
      this.direction.set(this.tipVelocity.x / speedPlanar, 0, this.tipVelocity.z / speedPlanar);
      return;
    }
    this.setOutwardDirection(enemy, tipPosition);
  }

  private strike(enemy: Enemy, origin: THREE.Vector3, speed: number, damage: number, force: number): void {
    const { knockbackScale, maxHorizontalImpulse, liftBase, liftPerSpeed } = this.settings;
    const horizontal = Math.min((speed * knockbackScale * force) / enemy.type.mass, maxHorizontalImpulse);
    const lethal = damage >= enemy.health;
    const lift = lethal ? liftBase + speed * liftPerSpeed : 0;
    this.impulse.set(this.direction.x * horizontal, lift, this.direction.z * horizontal);

    this.enemyCenter.copy(enemy.position);
    this.enemyCenter.y += enemy.type.height * 0.5;
    this.contactPoint.lerpVectors(origin, this.enemyCenter, 0.5);
    this.sparks.burst(this.contactPoint, speed / this.settings.sparkSpeedReference);
    enemy.receiveHit(damage, this.impulse);
  }
}
