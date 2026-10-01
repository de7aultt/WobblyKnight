import * as THREE from 'three';
import { clampToArena } from '../physics/arenaBounds';
import { createEnemyMesh, type EnemyRig } from './enemyMesh';
import { ENEMY_TYPES, type EnemyKind, type EnemyType } from './enemyTypes';

export type EnemyState = 'CHASING' | 'STAGGERED' | 'FLYING' | 'DEAD';

const HIT_COOLDOWN_SECONDS = 0.2;
const STAGGER_SECONDS = 0.25;
const GRAVITY = 26;
const KNOCK_DECAY = 6;
const TURN_RATE = 10;
const KNIGHT_CONTACT_DISTANCE = 1.1;
const MAX_FLIGHT_SECONDS = 2.5;
const MIN_LANDING_FLIGHT_SECONDS = 0.15;
const MAX_BOUNCES = 2;
const BOUNCE_RESTITUTION = 0.35;
const BOUNCE_FRICTION = 0.6;
const SETTLED_HORIZONTAL_SPEED = 2;
const STAGGER_LEAN = -0.5;
const CHASE_LEAN = 0.12;
const STRIDE_LENGTH = 0.15;
const BOB_HEIGHT = 0.06;

export class Enemy {
  readonly type: EnemyType;
  readonly rig: EnemyRig;
  readonly knockVelocity = new THREE.Vector3();
  readonly separation = new THREE.Vector3();
  state: EnemyState = 'CHASING';
  health: number;
  private hitCooldown = 0;
  private staggerTimer = 0;
  private flightTime = 0;
  private bounceCount = 0;
  private walkPhase = Math.random() * Math.PI * 2;
  private yaw = 0;
  private readonly tumble = new THREE.Vector2();

  constructor(kind: EnemyKind, x: number, z: number) {
    this.type = ENEMY_TYPES[kind];
    this.health = this.type.health;
    this.rig = createEnemyMesh(this.type);
    this.rig.root.position.set(x, 0, z);
  }

  get position(): THREE.Vector3 {
    return this.rig.root.position;
  }

  get isCollidable(): boolean {
    return this.state === 'CHASING' || this.state === 'STAGGERED';
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

  shove(directionX: number, directionZ: number, strength: number): void {
    this.knockVelocity.x += directionX * strength;
    this.knockVelocity.z += directionZ * strength;
  }

  receiveHit(damage: number, impulse: THREE.Vector3): void {
    this.hitCooldown = HIT_COOLDOWN_SECONDS;
    this.health -= damage;
    this.knockVelocity.copy(impulse);
    if (this.health > 0) {
      this.state = 'STAGGERED';
      this.staggerTimer = STAGGER_SECONDS;
      return;
    }
    this.state = 'FLYING';
    this.flightTime = 0;
    this.bounceCount = 0;
    this.tumble.set((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18);
  }

  update(deltaSeconds: number, target: THREE.Vector3): void {
    this.hitCooldown = Math.max(0, this.hitCooldown - deltaSeconds);
    if (this.state === 'CHASING') this.updateChasing(deltaSeconds, target);
    else if (this.state === 'STAGGERED') this.updateStaggered(deltaSeconds);
    else if (this.state === 'FLYING') this.updateFlying(deltaSeconds);
  }

  dispose(): void {
    this.state = 'DEAD';
    this.rig.root.removeFromParent();
  }

  private updateChasing(deltaSeconds: number, target: THREE.Vector3): void {
    const deltaX = target.x - this.position.x;
    const deltaZ = target.z - this.position.z;
    const distance = Math.hypot(deltaX, deltaZ);
    const hasTarget = distance > 1e-3;
    const arrived = distance < this.type.radius + KNIGHT_CONTACT_DISTANCE;
    const approachSpeed = hasTarget && !arrived ? this.type.speed : 0;

    if (hasTarget) this.faceDirection(deltaX, deltaZ, deltaSeconds);
    const moveX = hasTarget ? (deltaX / distance) * approachSpeed : 0;
    const moveZ = hasTarget ? (deltaZ / distance) * approachSpeed : 0;
    this.advance(deltaSeconds, moveX + this.separation.x, moveZ + this.separation.z);

    this.walkPhase += this.type.walkRate * deltaSeconds * (approachSpeed > 0 ? 1 : 0.25);
    this.animateWalk(approachSpeed > 0 ? 1 : 0.3, CHASE_LEAN);
  }

  private updateStaggered(deltaSeconds: number): void {
    this.staggerTimer -= deltaSeconds;
    this.advance(deltaSeconds, 0, 0);
    this.animateWalk(0, STAGGER_LEAN);
    if (this.staggerTimer <= 0) this.state = 'CHASING';
  }

  private updateFlying(deltaSeconds: number): void {
    this.flightTime += deltaSeconds;
    this.knockVelocity.y -= GRAVITY * deltaSeconds;
    this.position.addScaledVector(this.knockVelocity, deltaSeconds);
    this.rig.root.rotation.x += this.tumble.x * deltaSeconds;
    this.rig.root.rotation.z += this.tumble.y * deltaSeconds;

    const contact = clampToArena(this.position, this.type.radius);
    if (contact.hitX || contact.hitZ) {
      this.state = 'DEAD';
      return;
    }

    if (this.position.y <= 0 && this.knockVelocity.y < 0 && this.flightTime > MIN_LANDING_FLIGHT_SECONDS) {
      this.land();
    }
    if (this.flightTime > MAX_FLIGHT_SECONDS) this.state = 'DEAD';
  }

  private land(): void {
    this.position.y = 0;
    this.bounceCount += 1;
    this.knockVelocity.y *= -BOUNCE_RESTITUTION;
    this.knockVelocity.x *= BOUNCE_FRICTION;
    this.knockVelocity.z *= BOUNCE_FRICTION;
    const horizontalSpeed = Math.hypot(this.knockVelocity.x, this.knockVelocity.z);
    if (this.bounceCount >= MAX_BOUNCES || horizontalSpeed < SETTLED_HORIZONTAL_SPEED) {
      this.state = 'DEAD';
    }
  }

  private advance(deltaSeconds: number, moveX: number, moveZ: number): void {
    this.position.x += (moveX + this.knockVelocity.x) * deltaSeconds;
    this.position.z += (moveZ + this.knockVelocity.z) * deltaSeconds;
    this.knockVelocity.multiplyScalar(Math.exp(-KNOCK_DECAY * deltaSeconds));
    const contact = clampToArena(this.position, this.type.radius);
    if (contact.hitX) this.knockVelocity.x = 0;
    if (contact.hitZ) this.knockVelocity.z = 0;
  }

  private faceDirection(deltaX: number, deltaZ: number, deltaSeconds: number): void {
    const difference = Math.atan2(deltaX, deltaZ) - this.yaw;
    const wrapped = Math.atan2(Math.sin(difference), Math.cos(difference));
    this.yaw += wrapped * (1 - Math.exp(-TURN_RATE * deltaSeconds));
    this.rig.root.rotation.set(0, this.yaw, 0);
  }

  private animateWalk(intensity: number, lean: number): void {
    const stride = Math.sin(this.walkPhase);
    this.rig.body.rotation.x = lean;
    this.rig.body.rotation.z = stride * this.type.swayAmount * intensity;
    this.rig.body.position.y = Math.abs(stride) * BOB_HEIGHT * intensity;
    this.rig.leftFoot.position.z = 0.04 + stride * STRIDE_LENGTH * intensity;
    this.rig.rightFoot.position.z = 0.04 - stride * STRIDE_LENGTH * intensity;
  }
}
