import * as THREE from 'three';
import type { Input } from '../core/input';
import type { PlayerStats } from '../core/playerStats';
import { clampToArena } from '../physics/arenaBounds';
import type { FlailChain } from '../physics/flailChain';
import { WobblySpring } from '../physics/wobblySpring';
import { DASH_SPEED, DASH_SPIN_RATE, DashController } from './dashController';
import { FlailUnit } from './flailUnit';
import { animateKnight, type KnightPose } from './knightAnimator';
import { createKnightMesh, setKnightFlash, type KnightRig } from './knightMesh';

const MAX_SPEED = 7;
const ACCELERATION_RATE = 10;
const DECELERATION_RATE = 7;
const TURN_SPEED = 14;
const KNIGHT_RADIUS = 0.7;
const WALK_CYCLE_RATE = 2.2;
const KNOCK_DECAY = 5;
const TUMBLE_RATE = 9;
const TUMBLE_LIFT = 0.7;

function shortestAngle(from: number, to: number): number {
  const difference = to - from;
  return Math.atan2(Math.sin(difference), Math.cos(difference));
}

export class Player {
  readonly rig: KnightRig;
  readonly chains: FlailChain[] = [];
  private readonly units: FlailUnit[] = [];
  private readonly dash = new DashController();
  private wobble = new WobblySpring();
  private readonly velocity = new THREE.Vector3();
  private readonly previousVelocity = new THREE.Vector3();
  private readonly acceleration = new THREE.Vector3();
  private readonly moveDirection = new THREE.Vector3();
  private readonly desiredVelocity = new THREE.Vector3();
  private readonly knockVelocity = new THREE.Vector3();
  private readonly pose: KnightPose = { walkPhase: 0, speedRatio: 0, tilt: { pitch: 0, roll: 0 } };
  private yaw = 0;
  private knockedOut = false;
  private tumble = 0;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly input: Input,
    private readonly stats: PlayerStats
  ) {
    this.rig = createKnightMesh();
    scene.add(this.rig.root);
    this.rig.root.updateMatrixWorld(true);
    this.equipFlail(this.rig.handSocket);
  }

  get position(): THREE.Vector3 {
    return this.rig.root.position;
  }

  get isDashing(): boolean {
    return this.dash.isActive;
  }

  setKnockedOut(knockedOut: boolean): void {
    this.knockedOut = knockedOut;
  }

  setDamageFlash(level: number): void {
    setKnightFlash(level);
  }

  reset(): void {
    while (this.units.length > 1) {
      this.units.pop()?.dispose();
      this.chains.pop();
    }
    this.velocity.set(0, 0, 0);
    this.previousVelocity.set(0, 0, 0);
    this.acceleration.set(0, 0, 0);
    this.knockVelocity.set(0, 0, 0);
    this.wobble = new WobblySpring();
    this.dash.reset();
    this.knockedOut = false;
    this.tumble = 0;
    this.yaw = 0;
    this.rig.root.position.set(0, 0, 0);
    this.rig.root.rotation.set(0, 0, 0);
    this.rig.root.updateMatrixWorld(true);
    this.units.forEach((unit) => {
      unit.setReach(this.stats.chainReach);
      unit.reset();
    });
    setKnightFlash(0);
  }

  knockback(directionX: number, directionZ: number, speed: number): void {
    this.knockVelocity.x += directionX * speed;
    this.knockVelocity.z += directionZ * speed;
  }

  nudge(offsetX: number, offsetZ: number): void {
    this.rig.root.position.x += offsetX;
    this.rig.root.position.z += offsetZ;
    clampToArena(this.rig.root.position, KNIGHT_RADIUS);
  }

  get dashCooldownRatio(): number {
    return this.dash.cooldownRatio;
  }

  applyStats(): void {
    if (this.stats.hasDoubleFlail && this.units.length < 2) this.equipFlail(this.rig.leftHandSocket);
    this.units.forEach((unit) => unit.setReach(this.stats.chainReach));
  }

  update(deltaSeconds: number): void {
    if (deltaSeconds <= 0) return;
    this.input.getMoveDirection(this.moveDirection);
    if (this.knockedOut) this.moveDirection.set(0, 0, 0);
    this.dash.tick(deltaSeconds);
    const dashWanted = this.input.consumeDashRequest();
    if (dashWanted && this.stats.hasDash && !this.knockedOut) this.startDash();

    const dashing = this.dash.isActive;
    if (dashing) this.updateDash(deltaSeconds);
    else this.updateMovement(deltaSeconds);
    const yawRate = dashing ? 0 : this.updateFacing(deltaSeconds);

    this.tumble += ((this.knockedOut ? 1 : 0) - this.tumble) * (1 - Math.exp(-TUMBLE_RATE * deltaSeconds));
    this.rig.root.rotation.y = this.yaw;
    this.rig.root.rotation.z = this.tumble * (Math.PI / 2);
    this.rig.root.position.y = this.dash.height + this.tumble * TUMBLE_LIFT;
    this.updatePose(deltaSeconds, yawRate);

    this.rig.root.updateMatrixWorld(true);
    this.units.forEach((unit) => unit.update(deltaSeconds));
  }

  private equipFlail(socket: THREE.Object3D): void {
    const unit = new FlailUnit(this.scene, socket);
    unit.setReach(this.stats.chainReach);
    this.units.push(unit);
    this.chains.push(unit.chain);
  }

  private startDash(): void {
    const wanted = new THREE.Vector3();
    if (this.moveDirection.lengthSq() > 0) wanted.copy(this.moveDirection);
    else wanted.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    if (!this.dash.tryStart(wanted, this.stats.dashCooldownSeconds)) return;
    this.yaw = Math.atan2(this.dash.direction.x, this.dash.direction.z);
  }

  private updateDash(deltaSeconds: number): void {
    this.previousVelocity.copy(this.velocity);
    this.velocity.copy(this.dash.direction).multiplyScalar(DASH_SPEED);
    this.acceleration.set(0, 0, 0);
    this.yaw += DASH_SPIN_RATE * deltaSeconds;
    this.moveBody(deltaSeconds);
  }

  private updateMovement(deltaSeconds: number): void {
    const hasInput = this.moveDirection.lengthSq() > 0;
    const rate = hasInput ? ACCELERATION_RATE : DECELERATION_RATE;
    const blend = 1 - Math.exp(-rate * deltaSeconds);

    this.previousVelocity.copy(this.velocity);
    this.desiredVelocity.copy(this.moveDirection).multiplyScalar(MAX_SPEED);
    this.velocity.lerp(this.desiredVelocity, blend);
    this.acceleration.subVectors(this.velocity, this.previousVelocity).divideScalar(deltaSeconds);
    this.moveBody(deltaSeconds);
  }

  private moveBody(deltaSeconds: number): void {
    const position = this.rig.root.position;
    position.addScaledVector(this.velocity, deltaSeconds);
    position.addScaledVector(this.knockVelocity, deltaSeconds);
    this.knockVelocity.multiplyScalar(Math.exp(-KNOCK_DECAY * deltaSeconds));
    const contact = clampToArena(position, KNIGHT_RADIUS);
    if (contact.hitX) {
      this.velocity.x = 0;
      this.knockVelocity.x = 0;
    }
    if (contact.hitZ) {
      this.velocity.z = 0;
      this.knockVelocity.z = 0;
    }
  }

  private updateFacing(deltaSeconds: number): number {
    if (this.moveDirection.lengthSq() === 0) return 0;
    const targetYaw = Math.atan2(this.moveDirection.x, this.moveDirection.z);
    const difference = shortestAngle(this.yaw, targetYaw);
    const maxTurn = TURN_SPEED * deltaSeconds;
    const turn = Math.min(Math.max(difference, -maxTurn), maxTurn);
    this.yaw += turn;
    return turn / deltaSeconds;
  }

  private updatePose(deltaSeconds: number, yawRate: number): void {
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    this.pose.speedRatio = Math.min(speed / MAX_SPEED, 1);
    this.pose.walkPhase += speed * WALK_CYCLE_RATE * deltaSeconds;
    this.pose.tilt = this.wobble.update(deltaSeconds, this.acceleration, this.yaw, yawRate);
    animateKnight(this.rig, this.pose);
  }
}
