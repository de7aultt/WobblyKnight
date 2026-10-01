import * as THREE from 'three';
import type { GameEventBus } from '../core/events';
import type { BossBehavior } from './bossBehavior';
import { BossBody } from './bossBody';
import {
  DEFEAT_SECONDS,
  DEFEAT_SPIN_RATE,
  GRAVITY,
  HIT_COOLDOWN_SECONDS,
  KNOCK_SHARE,
  SPAWN_HEIGHT
} from './bossConfig';
import { computeKnightPush } from './bossContact';
import { createBossBehavior, createBossRig } from './bossFactory';
import type { BossSpec } from './bossRoster';
import type { BottleLauncher } from './bottleField';
import type { CombatTarget, CombatTargetType } from './combatTarget';

export type BossPhase = 'SPAWNING' | 'FIGHTING' | 'DEFEATING' | 'DEFEATED';

export class Boss implements CombatTarget {
  readonly type: CombatTargetType;
  readonly rig;
  readonly maxHealth: number;
  health: number;
  phase: BossPhase = 'SPAWNING';
  private readonly body: BossBody;
  private readonly behavior: BossBehavior;
  private phaseTimer = 0;
  private hitCooldown = 0;
  private verticalVelocity = 0;

  constructor(
    private readonly spec: BossSpec,
    private readonly events: GameEventBus,
    bottles: BottleLauncher,
    x: number,
    z: number
  ) {
    this.type = spec.type;
    this.maxHealth = spec.maxHealth;
    this.health = spec.maxHealth;
    this.rig = createBossRig(spec.tier);
    this.body = new BossBody(this.rig, spec.type.radius);
    this.behavior = createBossBehavior(spec.tier, { body: this.body, events, bottles });
    this.rig.root.position.set(x, SPAWN_HEIGHT, z);
    this.events.emit('BOSS_SPAWNED', { tier: spec.tier, maxHealth: spec.maxHealth });
    this.emitHealth();
  }

  get position(): THREE.Vector3 {
    return this.rig.root.position;
  }

  get isCollidable(): boolean {
    return this.phase === 'FIGHTING';
  }

  get isHittable(): boolean {
    return this.isCollidable && this.hitCooldown <= 0;
  }

  overlapsSphere(center: THREE.Vector3, radius: number): boolean {
    const reach = this.type.radius + radius;
    const deltaX = center.x - this.position.x;
    const deltaZ = center.z - this.position.z;
    if (deltaX * deltaX + deltaZ * deltaZ > reach * reach) return false;
    return center.y - radius < this.position.y + this.type.height && center.y + radius > this.position.y;
  }

  shove(): void {}

  stagger(): void {}

  receiveHit(damage: number, impulse: THREE.Vector3): void {
    this.health = Math.max(0, this.health - damage * this.behavior.damageMultiplier);
    this.hitCooldown = HIT_COOLDOWN_SECONDS;
    this.body.knockVelocity.x += impulse.x * KNOCK_SHARE;
    this.body.knockVelocity.z += impulse.z * KNOCK_SHARE;
    this.emitHealth();
    if (this.health <= 0) this.startDefeat();
  }

  computeKnightPush(knightPosition: THREE.Vector3, out: THREE.Vector3): boolean {
    return this.isCollidable && computeKnightPush(this.position, this.type.radius, knightPosition, out);
  }

  update(deltaSeconds: number, knightPosition: THREE.Vector3, knightInvulnerable: boolean): void {
    this.hitCooldown = Math.max(0, this.hitCooldown - deltaSeconds);
    this.body.pose.elapsed += deltaSeconds;
    if (this.phase === 'SPAWNING') this.updateSpawning(deltaSeconds);
    else if (this.phase === 'FIGHTING') this.behavior.update(deltaSeconds, knightPosition, knightInvulnerable);
    else if (this.phase === 'DEFEATING') this.updateDefeating(deltaSeconds);
    this.body.render();
  }

  dispose(): void {
    this.rig.setDanger(0);
    this.rig.root.removeFromParent();
  }

  private emitHealth(): void {
    this.events.emit('BOSS_HEALTH', {
      ratio: this.health / this.maxHealth,
      current: this.health,
      max: this.maxHealth
    });
  }

  private updateSpawning(deltaSeconds: number): void {
    this.verticalVelocity -= GRAVITY * deltaSeconds;
    this.position.y += this.verticalVelocity * deltaSeconds;
    this.body.setPose(0, 0.1, 0.6, 0, 0);
    if (this.position.y > 0) return;
    this.position.y = 0;
    this.verticalVelocity = 0;
    this.phase = 'FIGHTING';
    this.events.emit('BOSS_LANDED');
  }

  private startDefeat(): void {
    this.phase = 'DEFEATING';
    this.phaseTimer = DEFEAT_SECONDS;
    this.rig.setDanger(0);
    this.body.pose.orbit = 0;
  }

  private updateDefeating(deltaSeconds: number): void {
    this.phaseTimer -= deltaSeconds;
    const progress = 1 - Math.max(this.phaseTimer, 0) / DEFEAT_SECONDS;
    this.body.spinYaw(DEFEAT_SPIN_RATE * progress * deltaSeconds);
    this.rig.root.scale.setScalar(this.rig.baseScale * (1 + 0.2 * progress * Math.sin(this.body.pose.elapsed * 34)));
    this.body.setPose(0, 0, 1, 0.5 + 0.5 * Math.sin(this.body.pose.elapsed * 30), 1);
    if (this.phaseTimer > 0) return;
    this.phase = 'DEFEATED';
    this.events.emit('BOSS_DEFEATED', {
      x: this.position.x,
      z: this.position.z,
      tier: this.spec.tier,
      mugCount: this.spec.mugCount
    });
  }
}
