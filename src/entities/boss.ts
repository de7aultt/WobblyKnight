import * as THREE from 'three';
import type { GameEventBus } from '../core/events';
import { clampToArena } from '../physics/arenaBounds';
import { animateBoss, createBossPose } from './bossAnimator';
import { SLAM_REACH, computeKnightPush, computeSlamDirection } from './bossContact';
import { BOSS_SCALE, createBossMesh } from './bossMesh';
import {
  BOSS_TYPE,
  CHARGE_MAX_SECONDS,
  CHARGE_SPEED,
  DEFEAT_SECONDS,
  DEFEAT_SPIN_RATE,
  GRAVITY,
  HIT_COOLDOWN_SECONDS,
  KNIGHT_CONTACT_RADIUS,
  KNOCK_DECAY,
  KNOCK_SHARE,
  MAX_HEALTH,
  SPAWN_HEIGHT,
  STALK_MAX_SECONDS,
  STALK_MIN_SECONDS,
  STALK_SPEED,
  STALK_TURN_RATE,
  STUN_DAMAGE_MULTIPLIER,
  STUN_SECONDS,
  TELEGRAPH_SECONDS,
  TELEGRAPH_TURN_RATE
} from './bossConfig';
import type { CombatTarget } from './combatTarget';

export type BossState =
  | 'SPAWNING'
  | 'STALKING'
  | 'TELEGRAPH_CHARGE'
  | 'BELLY_CHARGE'
  | 'WALL_STUNNED'
  | 'DEFEATING'
  | 'DEFEATED';

export class Boss implements CombatTarget {
  readonly type = BOSS_TYPE;
  readonly rig = createBossMesh();
  readonly maxHealth = MAX_HEALTH;
  health = MAX_HEALTH;
  state: BossState = 'SPAWNING';
  private readonly pose = createBossPose();
  private readonly chargeDirection = new THREE.Vector3(0, 0, 1);
  private readonly knockVelocity = new THREE.Vector3();
  private stateTimer = 0;
  private hitCooldown = 0;
  private verticalVelocity = 0;
  private chargeElapsed = 0;
  private yaw = 0;
  private lockedYaw = 0;
  private struckKnight = false;

  constructor(private readonly events: GameEventBus, x: number, z: number) {
    this.rig.root.position.set(x, SPAWN_HEIGHT, z);
    this.events.emit('BOSS_SPAWNED');
    this.events.emit('BOSS_HEALTH', { ratio: 1 });
  }

  get position(): THREE.Vector3 {
    return this.rig.root.position;
  }

  get isCollidable(): boolean {
    return (
      this.state === 'STALKING' ||
      this.state === 'TELEGRAPH_CHARGE' ||
      this.state === 'BELLY_CHARGE' ||
      this.state === 'WALL_STUNNED'
    );
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
    const multiplier = this.state === 'WALL_STUNNED' ? STUN_DAMAGE_MULTIPLIER : 1;
    this.health = Math.max(0, this.health - damage * multiplier);
    this.hitCooldown = HIT_COOLDOWN_SECONDS;
    this.knockVelocity.x += impulse.x * KNOCK_SHARE;
    this.knockVelocity.z += impulse.z * KNOCK_SHARE;
    this.events.emit('BOSS_HEALTH', { ratio: this.health / this.maxHealth });
    if (this.health <= 0) this.startDefeat();
  }

  computeKnightPush(knightPosition: THREE.Vector3, out: THREE.Vector3): boolean {
    return this.isCollidable && computeKnightPush(this.position, knightPosition, out);
  }

  update(deltaSeconds: number, knightPosition: THREE.Vector3, knightInvulnerable: boolean): void {
    this.hitCooldown = Math.max(0, this.hitCooldown - deltaSeconds);
    this.pose.elapsed += deltaSeconds;
    if (this.state === 'SPAWNING') this.updateSpawning(deltaSeconds);
    else if (this.state === 'STALKING') this.updateStalking(deltaSeconds, knightPosition);
    else if (this.state === 'TELEGRAPH_CHARGE') this.updateTelegraph(deltaSeconds);
    else if (this.state === 'BELLY_CHARGE') this.updateCharge(deltaSeconds, knightPosition, knightInvulnerable);
    else if (this.state === 'WALL_STUNNED') this.updateStunned(deltaSeconds);
    else if (this.state === 'DEFEATING') this.updateDefeating(deltaSeconds);
    animateBoss(this.rig, this.pose);
  }

  dispose(): void {
    this.rig.root.removeFromParent();
  }

  private setPose(intensity: number, lean: number, raise: number, warning: number, dizzy: number): void {
    this.pose.walkIntensity = intensity;
    this.pose.lean = lean;
    this.pose.raise = raise;
    this.pose.warning = warning;
    this.pose.dizzy = dizzy;
  }

  private faceYaw(targetYaw: number, rate: number, deltaSeconds: number): void {
    const difference = targetYaw - this.yaw;
    this.yaw += Math.atan2(Math.sin(difference), Math.cos(difference)) * (1 - Math.exp(-rate * deltaSeconds));
    this.rig.root.rotation.y = this.yaw;
  }

  private applyKnock(deltaSeconds: number): void {
    this.position.x += this.knockVelocity.x * deltaSeconds;
    this.position.z += this.knockVelocity.z * deltaSeconds;
    this.knockVelocity.multiplyScalar(Math.exp(-KNOCK_DECAY * deltaSeconds));
    clampToArena(this.position, this.type.radius);
  }

  private returnToStalking(): void {
    this.state = 'STALKING';
    this.stateTimer = STALK_MIN_SECONDS + Math.random() * (STALK_MAX_SECONDS - STALK_MIN_SECONDS);
  }

  private updateSpawning(deltaSeconds: number): void {
    this.verticalVelocity -= GRAVITY * deltaSeconds;
    this.position.y += this.verticalVelocity * deltaSeconds;
    this.setPose(0, 0.1, 0.6, 0, 0);
    if (this.position.y > 0) return;
    this.position.y = 0;
    this.verticalVelocity = 0;
    this.events.emit('BOSS_LANDED');
    this.returnToStalking();
  }

  private updateStalking(deltaSeconds: number, knightPosition: THREE.Vector3): void {
    const deltaX = knightPosition.x - this.position.x;
    const deltaZ = knightPosition.z - this.position.z;
    const distance = Math.hypot(deltaX, deltaZ);
    if (distance > 1e-3) this.faceYaw(Math.atan2(deltaX, deltaZ), STALK_TURN_RATE, deltaSeconds);

    const moving = distance - (this.type.radius + KNIGHT_CONTACT_RADIUS) > 0.3;
    if (moving) {
      this.position.x += (deltaX / distance) * STALK_SPEED * deltaSeconds;
      this.position.z += (deltaZ / distance) * STALK_SPEED * deltaSeconds;
    }
    this.applyKnock(deltaSeconds);
    this.pose.walkPhase += deltaSeconds * (moving ? 5 : 1.5);
    this.setPose(moving ? 1 : 0.3, 0.1, 0, 0, 0);

    this.stateTimer -= deltaSeconds;
    if (this.stateTimer <= 0) this.startTelegraph(deltaX, deltaZ, distance);
  }

  private startTelegraph(deltaX: number, deltaZ: number, distance: number): void {
    this.state = 'TELEGRAPH_CHARGE';
    this.stateTimer = TELEGRAPH_SECONDS;
    if (distance > 1e-3) this.chargeDirection.set(deltaX / distance, 0, deltaZ / distance);
    this.lockedYaw = Math.atan2(this.chargeDirection.x, this.chargeDirection.z);
    this.events.emit('BOSS_TELEGRAPH');
  }

  private updateTelegraph(deltaSeconds: number): void {
    this.faceYaw(this.lockedYaw, TELEGRAPH_TURN_RATE, deltaSeconds);
    this.applyKnock(deltaSeconds);
    const progress = 1 - this.stateTimer / TELEGRAPH_SECONDS;
    const raise = Math.min(progress * 2.4, 1);
    const flash = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(this.pose.elapsed * 22));
    this.setPose(0, -0.18 * raise, raise, flash, 0);
    this.stateTimer -= deltaSeconds;
    if (this.stateTimer > 0) return;
    this.state = 'BELLY_CHARGE';
    this.chargeElapsed = 0;
    this.struckKnight = false;
  }

  private updateCharge(deltaSeconds: number, knightPosition: THREE.Vector3, knightInvulnerable: boolean): void {
    this.position.addScaledVector(this.chargeDirection, CHARGE_SPEED * deltaSeconds);
    const contact = clampToArena(this.position, this.type.radius);
    this.pose.walkPhase += deltaSeconds * 14;
    this.setPose(1, 0.38, 0, 0.7, 0);
    this.checkKnightSlam(knightPosition, knightInvulnerable);

    if (contact.hitX || contact.hitZ) {
      this.state = 'WALL_STUNNED';
      this.stateTimer = STUN_SECONDS;
      this.events.emit('BOSS_STUNNED');
      return;
    }
    this.chargeElapsed += deltaSeconds;
    if (this.chargeElapsed > CHARGE_MAX_SECONDS) this.returnToStalking();
  }

  private checkKnightSlam(knightPosition: THREE.Vector3, knightInvulnerable: boolean): void {
    if (this.struckKnight || knightInvulnerable) return;
    const deltaX = knightPosition.x - this.position.x;
    const deltaZ = knightPosition.z - this.position.z;
    const distance = Math.hypot(deltaX, deltaZ);
    if (distance > SLAM_REACH) return;
    this.struckKnight = true;
    this.events.emit('BOSS_SLAM', computeSlamDirection(this.chargeDirection, deltaX, deltaZ, distance));
  }

  private updateStunned(deltaSeconds: number): void {
    this.applyKnock(deltaSeconds);
    this.setPose(0.2, 0.2, 0, 0, 1);
    this.stateTimer -= deltaSeconds;
    if (this.stateTimer <= 0) this.returnToStalking();
  }

  private startDefeat(): void {
    this.state = 'DEFEATING';
    this.stateTimer = DEFEAT_SECONDS;
  }

  private updateDefeating(deltaSeconds: number): void {
    this.stateTimer -= deltaSeconds;
    const progress = 1 - Math.max(this.stateTimer, 0) / DEFEAT_SECONDS;
    this.yaw += DEFEAT_SPIN_RATE * progress * deltaSeconds;
    this.rig.root.rotation.y = this.yaw;
    this.rig.root.scale.setScalar(BOSS_SCALE * (1 + 0.2 * progress * Math.sin(this.pose.elapsed * 34)));
    this.setPose(0, 0, 1, 0.5 + 0.5 * Math.sin(this.pose.elapsed * 30), 1);
    if (this.stateTimer > 0) return;
    this.state = 'DEFEATED';
    this.events.emit('BOSS_DEFEATED', { x: this.position.x, z: this.position.z });
  }
}
