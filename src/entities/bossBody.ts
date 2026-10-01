import * as THREE from 'three';
import { clampToArena } from '../physics/arenaBounds';
import { animateBoss, createBossPose } from './bossAnimator';
import { KNIGHT_CONTACT_RADIUS, KNOCK_DECAY, MOVING_DISTANCE_MARGIN, STALK_TURN_RATE } from './bossConfig';
import type { BossRig } from './bossRig';

export interface BossAim {
  dirX: number;
  dirZ: number;
  distance: number;
}

export function randomBetween(minimum: number, maximum: number): number {
  return minimum + Math.random() * (maximum - minimum);
}

export class BossBody {
  readonly pose = createBossPose();
  readonly knockVelocity = new THREE.Vector3();
  readonly aim: BossAim = { dirX: 0, dirZ: 1, distance: 0 };
  yaw = 0;

  constructor(readonly rig: BossRig, readonly radius: number) {}

  get position(): THREE.Vector3 {
    return this.rig.root.position;
  }

  setPose(intensity: number, lean: number, raise: number, warning: number, dizzy: number): void {
    this.pose.walkIntensity = intensity;
    this.pose.lean = lean;
    this.pose.raise = raise;
    this.pose.warning = warning;
    this.pose.dizzy = dizzy;
  }

  faceYaw(targetYaw: number, rate: number, deltaSeconds: number): void {
    const difference = targetYaw - this.yaw;
    this.yaw += Math.atan2(Math.sin(difference), Math.cos(difference)) * (1 - Math.exp(-rate * deltaSeconds));
    this.rig.root.rotation.y = this.yaw;
  }

  spinYaw(amount: number): void {
    this.yaw += amount;
    this.rig.root.rotation.y = this.yaw;
  }

  applyKnock(deltaSeconds: number): void {
    this.position.x += this.knockVelocity.x * deltaSeconds;
    this.position.z += this.knockVelocity.z * deltaSeconds;
    this.knockVelocity.multiplyScalar(Math.exp(-KNOCK_DECAY * deltaSeconds));
    clampToArena(this.position, this.radius);
  }

  trackKnight(knightPosition: THREE.Vector3): BossAim {
    const deltaX = knightPosition.x - this.position.x;
    const deltaZ = knightPosition.z - this.position.z;
    const distance = Math.hypot(deltaX, deltaZ);
    if (distance > 1e-3) {
      this.aim.dirX = deltaX / distance;
      this.aim.dirZ = deltaZ / distance;
    }
    this.aim.distance = distance;
    return this.aim;
  }

  facePlayer(knightPosition: THREE.Vector3, rate: number, deltaSeconds: number): void {
    const aim = this.trackKnight(knightPosition);
    this.faceYaw(Math.atan2(aim.dirX, aim.dirZ), rate, deltaSeconds);
  }

  walkToward(knightPosition: THREE.Vector3, speed: number, deltaSeconds: number): void {
    this.facePlayer(knightPosition, STALK_TURN_RATE, deltaSeconds);
    const gap = this.aim.distance - (this.radius + KNIGHT_CONTACT_RADIUS);
    const moving = gap > MOVING_DISTANCE_MARGIN;
    if (moving) {
      this.position.x += this.aim.dirX * speed * deltaSeconds;
      this.position.z += this.aim.dirZ * speed * deltaSeconds;
    }
    this.applyKnock(deltaSeconds);
    this.pose.walkPhase += deltaSeconds * (moving ? 5 : 1.5);
    this.setPose(moving ? 1 : 0.3, 0.1, 0, 0, 0);
  }

  render(): void {
    animateBoss(this.rig, this.pose);
  }
}
