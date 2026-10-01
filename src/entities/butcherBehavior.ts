import * as THREE from 'three';
import type { GameEventBus } from '../core/events';
import { clampToArena } from '../physics/arenaBounds';
import type { BossBehavior, BossContext } from './bossBehavior';
import { randomBetween, type BossBody } from './bossBody';
import { TELEGRAPH_TURN_RATE } from './bossConfig';
import { computeSlamDirection, slamReach } from './bossContact';
import {
  CHARGE_MAX_SECONDS,
  CHARGE_SPEED,
  SLAM_DAMAGE,
  SLAM_KNOCKBACK,
  STALK_MAX_SECONDS,
  STALK_MIN_SECONDS,
  STALK_SPEED,
  STUN_DAMAGE_MULTIPLIER,
  STUN_SECONDS,
  TELEGRAPH_SECONDS
} from './butcherConfig';

type ButcherState = 'STALKING' | 'TELEGRAPH' | 'CHARGE' | 'STUNNED';

export class ButcherBehavior implements BossBehavior {
  private readonly body: BossBody;
  private readonly events: GameEventBus;
  private readonly chargeDirection = new THREE.Vector3(0, 0, 1);
  private state: ButcherState = 'STALKING';
  private timer = randomBetween(STALK_MIN_SECONDS, STALK_MAX_SECONDS);
  private chargeElapsed = 0;
  private lockedYaw = 0;
  private struckKnight = false;

  constructor(context: BossContext) {
    this.body = context.body;
    this.events = context.events;
  }

  get damageMultiplier(): number {
    return this.state === 'STUNNED' ? STUN_DAMAGE_MULTIPLIER : 1;
  }

  update(deltaSeconds: number, knightPosition: THREE.Vector3, knightInvulnerable: boolean): void {
    if (this.state === 'STALKING') this.updateStalking(deltaSeconds, knightPosition);
    else if (this.state === 'TELEGRAPH') this.updateTelegraph(deltaSeconds);
    else if (this.state === 'CHARGE') this.updateCharge(deltaSeconds, knightPosition, knightInvulnerable);
    else this.updateStunned(deltaSeconds);
  }

  private returnToStalking(): void {
    this.state = 'STALKING';
    this.timer = randomBetween(STALK_MIN_SECONDS, STALK_MAX_SECONDS);
  }

  private updateStalking(deltaSeconds: number, knightPosition: THREE.Vector3): void {
    this.body.walkToward(knightPosition, STALK_SPEED, deltaSeconds);
    this.timer -= deltaSeconds;
    if (this.timer > 0) return;
    this.state = 'TELEGRAPH';
    this.timer = TELEGRAPH_SECONDS;
    this.chargeDirection.set(this.body.aim.dirX, 0, this.body.aim.dirZ);
    this.lockedYaw = Math.atan2(this.chargeDirection.x, this.chargeDirection.z);
    this.events.emit('BOSS_TELEGRAPH');
  }

  private updateTelegraph(deltaSeconds: number): void {
    this.body.faceYaw(this.lockedYaw, TELEGRAPH_TURN_RATE, deltaSeconds);
    this.body.applyKnock(deltaSeconds);
    const progress = 1 - this.timer / TELEGRAPH_SECONDS;
    const raise = Math.min(progress * 2.4, 1);
    const flash = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(this.body.pose.elapsed * 22));
    this.body.setPose(0, -0.18 * raise, raise, flash, 0);
    this.timer -= deltaSeconds;
    if (this.timer > 0) return;
    this.state = 'CHARGE';
    this.chargeElapsed = 0;
    this.struckKnight = false;
  }

  private updateCharge(deltaSeconds: number, knightPosition: THREE.Vector3, knightInvulnerable: boolean): void {
    this.body.position.addScaledVector(this.chargeDirection, CHARGE_SPEED * deltaSeconds);
    const contact = clampToArena(this.body.position, this.body.radius);
    this.body.pose.walkPhase += deltaSeconds * 14;
    this.body.setPose(1, 0.38, 0, 0.7, 0);
    this.checkKnightSlam(knightPosition, knightInvulnerable);

    if (contact.hitX || contact.hitZ) {
      this.state = 'STUNNED';
      this.timer = STUN_SECONDS;
      this.events.emit('BOSS_STUNNED');
      return;
    }
    this.chargeElapsed += deltaSeconds;
    if (this.chargeElapsed > CHARGE_MAX_SECONDS) this.returnToStalking();
  }

  private checkKnightSlam(knightPosition: THREE.Vector3, knightInvulnerable: boolean): void {
    if (this.struckKnight || knightInvulnerable) return;
    const deltaX = knightPosition.x - this.body.position.x;
    const deltaZ = knightPosition.z - this.body.position.z;
    const distance = Math.hypot(deltaX, deltaZ);
    if (distance > slamReach(this.body.radius)) return;
    this.struckKnight = true;
    const direction = computeSlamDirection(this.chargeDirection, deltaX, deltaZ, distance);
    this.events.emit('BOSS_SLAM', { ...direction, damage: SLAM_DAMAGE, knockback: SLAM_KNOCKBACK });
  }

  private updateStunned(deltaSeconds: number): void {
    this.body.applyKnock(deltaSeconds);
    this.body.setPose(0.2, 0.2, 0, 0, 1);
    this.timer -= deltaSeconds;
    if (this.timer <= 0) this.returnToStalking();
  }
}
