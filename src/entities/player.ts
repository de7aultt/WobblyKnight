import * as THREE from 'three';
import { findWeapon, type HeroId, type WeaponId } from '../core/armoryItems';
import type { Input } from '../core/input';
import type { PlayerStats } from '../core/playerStats';
import { clampToArena } from '../physics/arenaBounds';
import type { FlailChain } from '../physics/flailChain';
import { WobblySpring } from '../physics/wobblySpring';
import { DASH_SPEED, DASH_SPIN_RATE, DashController } from './dashController';
import {
  FRENZY_GLOW_BASE,
  FRENZY_GLOW_PULSE,
  FRENZY_KNOCKBACK_MULTIPLIER,
  FRENZY_SPEED_MULTIPLIER,
  SKILL_BY_HERO,
  skillDurationSeconds,
  type SkillKind
} from './heroSkill';
import { animateKnight, type KnightPose } from './knightAnimator';
import { createKnightMesh, setKnightFlash, type KnightRig } from './knightMesh';
import { applyHeroVariant } from './knightVariants';
import { WeaponLoadout } from './weaponLoadout';

const MAX_SPEED = 7;
const ACCELERATION_RATE = 10;
const DECELERATION_RATE = 7;
const TURN_SPEED = 14;
const KNIGHT_RADIUS = 0.7;
const WALK_CYCLE_RATE = 2.2;
const KNOCK_DECAY = 5;
const TUMBLE_RATE = 9;
const TUMBLE_LIFT = 0.7;
const GLOW_PULSE_RATE = 14;

function shortestAngle(from: number, to: number): number {
  const difference = to - from;
  return Math.atan2(Math.sin(difference), Math.cos(difference));
}

export class Player {
  readonly rig: KnightRig;
  readonly weapons: WeaponLoadout;
  onStomp: ((center: THREE.Vector3) => void) | null = null;
  private readonly dash = new DashController();
  private wobble = new WobblySpring();
  private readonly velocity = new THREE.Vector3();
  private readonly previousVelocity = new THREE.Vector3();
  private readonly acceleration = new THREE.Vector3();
  private readonly moveDirection = new THREE.Vector3();
  private readonly desiredVelocity = new THREE.Vector3();
  private readonly knockVelocity = new THREE.Vector3();
  private readonly pose: KnightPose = { walkPhase: 0, speedRatio: 0, tilt: { pitch: 0, roll: 0 } };
  private skill: SkillKind = 'whirlwind';
  private yaw = 0;
  private clock = 0;
  private damageFlash = 0;
  private knockedOut = false;
  private hopPending = false;
  private tumble = 0;

  constructor(
    scene: THREE.Scene,
    private readonly input: Input,
    private readonly stats: PlayerStats
  ) {
    this.rig = createKnightMesh();
    scene.add(this.rig.root);
    this.rig.root.updateMatrixWorld(true);
    this.weapons = new WeaponLoadout(scene, this.rig, stats);
    this.weapons.rebuild();
  }

  get chains(): FlailChain[] {
    return this.weapons.chains;
  }

  get position(): THREE.Vector3 {
    return this.rig.root.position;
  }

  get isDashing(): boolean {
    return this.dash.isActive && this.skill === 'whirlwind';
  }

  get isShielded(): boolean {
    return this.dash.isActive && this.skill !== 'frenzy';
  }

  get isSkillActive(): boolean {
    return this.dash.isActive;
  }

  get dashCooldownRatio(): number {
    return this.dash.cooldownRatio;
  }

  applyLoadout(hero: HeroId, weapon: WeaponId): void {
    this.skill = SKILL_BY_HERO[hero];
    applyHeroVariant(this.rig, hero);
    this.stats.applyWeapon(findWeapon(weapon).effects);
    this.dash.reset();
    this.hopPending = false;
    this.weapons.setWeapon(weapon);
  }

  setKnockedOut(knockedOut: boolean): void {
    this.knockedOut = knockedOut;
  }

  setDamageFlash(level: number): void {
    this.damageFlash = level;
  }

  reset(): void {
    this.velocity.set(0, 0, 0);
    this.previousVelocity.set(0, 0, 0);
    this.acceleration.set(0, 0, 0);
    this.knockVelocity.set(0, 0, 0);
    this.wobble = new WobblySpring();
    this.dash.reset();
    this.hopPending = false;
    this.knockedOut = false;
    this.tumble = 0;
    this.yaw = 0;
    this.rig.root.position.set(0, 0, 0);
    this.rig.root.rotation.set(0, 0, 0);
    this.rig.root.updateMatrixWorld(true);
    this.weapons.rebuild();
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

  applyStats(): void {
    this.weapons.applyStats();
  }

  update(deltaSeconds: number): void {
    if (deltaSeconds <= 0) return;
    this.clock += deltaSeconds;
    this.input.getMoveDirection(this.moveDirection);
    if (this.knockedOut) this.moveDirection.set(0, 0, 0);
    this.dash.tick(deltaSeconds);
    const skillWanted = this.input.consumeDashRequest();
    if (skillWanted && !this.knockedOut) this.activateSkill();

    const skillActive = this.dash.isActive;
    const whirling = skillActive && this.skill === 'whirlwind';
    const frenzied = skillActive && this.skill === 'frenzy';
    if (whirling) this.updateDash(deltaSeconds);
    else this.updateMovement(deltaSeconds, frenzied ? FRENZY_SPEED_MULTIPLIER : 1);
    const yawRate = whirling ? 0 : this.updateFacing(deltaSeconds);

    if (this.hopPending && !skillActive) {
      this.hopPending = false;
      this.onStomp?.(this.rig.root.position);
    }
    this.stats.knockbackBuff = frenzied ? FRENZY_KNOCKBACK_MULTIPLIER : 1;
    this.applyGlow(frenzied);

    this.tumble += ((this.knockedOut ? 1 : 0) - this.tumble) * (1 - Math.exp(-TUMBLE_RATE * deltaSeconds));
    this.rig.root.rotation.y = this.yaw;
    this.rig.root.rotation.z = this.tumble * (Math.PI / 2);
    this.rig.root.position.y = (frenzied ? 0 : this.dash.height) + this.tumble * TUMBLE_LIFT;
    this.updatePose(deltaSeconds, yawRate);

    this.rig.root.updateMatrixWorld(true);
    this.weapons.update(deltaSeconds);
  }

  private applyGlow(frenzied: boolean): void {
    const frenzyGlow = frenzied ? FRENZY_GLOW_BASE + FRENZY_GLOW_PULSE * Math.sin(this.clock * GLOW_PULSE_RATE) : 0;
    setKnightFlash(Math.max(this.damageFlash, frenzyGlow));
  }

  private activateSkill(): void {
    const wanted = new THREE.Vector3();
    if (this.moveDirection.lengthSq() > 0) wanted.copy(this.moveDirection);
    else wanted.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const duration = skillDurationSeconds(this.skill);
    if (!this.dash.tryStart(wanted, this.stats.dashCooldownSeconds, duration)) return;
    if (this.skill === 'whirlwind') this.yaw = Math.atan2(this.dash.direction.x, this.dash.direction.z);
    if (this.skill === 'stomp') this.hopPending = true;
  }

  private updateDash(deltaSeconds: number): void {
    this.previousVelocity.copy(this.velocity);
    this.velocity.copy(this.dash.direction).multiplyScalar(DASH_SPEED);
    this.acceleration.set(0, 0, 0);
    this.yaw += DASH_SPIN_RATE * deltaSeconds;
    this.moveBody(deltaSeconds);
  }

  private updateMovement(deltaSeconds: number, speedMultiplier: number): void {
    const hasInput = this.moveDirection.lengthSq() > 0;
    const rate = hasInput ? ACCELERATION_RATE : DECELERATION_RATE;
    const blend = 1 - Math.exp(-rate * deltaSeconds);

    this.previousVelocity.copy(this.velocity);
    this.desiredVelocity.copy(this.moveDirection).multiplyScalar(MAX_SPEED * speedMultiplier);
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
    const maxTurn = TURN_SPEED * this.stats.spinMultiplier * deltaSeconds;
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
