import * as THREE from 'three';
import type { GameEventBus } from '../core/events';
import type { BossBehavior, BossContext } from './bossBehavior';
import { randomBetween, type BossBody } from './bossBody';
import { TELEGRAPH_TURN_RATE } from './bossConfig';
import {
  EXECUTIONER_SPEED,
  EXECUTIONER_STALK_MAX_SECONDS,
  EXECUTIONER_STALK_MIN_SECONDS,
  EXHAUST_DAMAGE_MULTIPLIER,
  EXHAUST_SECONDS,
  WHIRL_ARM_ANGLE,
  WHIRL_DAMAGE,
  WHIRL_DRIFT_SPEED,
  WHIRL_HIT_INTERVAL_SECONDS,
  WHIRL_KNOCKBACK,
  WHIRL_REACH,
  WHIRL_SECONDS,
  WHIRL_SPIN_RATE,
  WHIRL_TELEGRAPH_SECONDS
} from './executionerConfig';
import { WEAPON_RAISED_ANGLE, WEAPON_REST_ANGLE } from './bossRig';

type ExecutionerState = 'STALKING' | 'TELEGRAPH' | 'WHIRLWIND' | 'EXHAUSTED';

const HORIZONTAL_RAISE = (WHIRL_ARM_ANGLE - WEAPON_REST_ANGLE) / (WEAPON_RAISED_ANGLE - WEAPON_REST_ANGLE);

export class ExecutionerBehavior implements BossBehavior {
  private readonly body: BossBody;
  private readonly events: GameEventBus;
  private state: ExecutionerState = 'STALKING';
  private timer = randomBetween(EXECUTIONER_STALK_MIN_SECONDS, EXECUTIONER_STALK_MAX_SECONDS);
  private hitTimer = 0;

  constructor(context: BossContext) {
    this.body = context.body;
    this.events = context.events;
  }

  get damageMultiplier(): number {
    return this.state === 'EXHAUSTED' ? EXHAUST_DAMAGE_MULTIPLIER : 1;
  }

  update(deltaSeconds: number, knightPosition: THREE.Vector3, knightInvulnerable: boolean): void {
    if (this.state === 'STALKING') this.updateStalking(deltaSeconds, knightPosition);
    else if (this.state === 'TELEGRAPH') this.updateTelegraph(deltaSeconds, knightPosition);
    else if (this.state === 'WHIRLWIND') this.updateWhirlwind(deltaSeconds, knightPosition, knightInvulnerable);
    else this.updateExhausted(deltaSeconds);
  }

  private updateStalking(deltaSeconds: number, knightPosition: THREE.Vector3): void {
    this.body.walkToward(knightPosition, EXECUTIONER_SPEED, deltaSeconds);
    this.timer -= deltaSeconds;
    if (this.timer > 0) return;
    this.state = 'TELEGRAPH';
    this.timer = WHIRL_TELEGRAPH_SECONDS;
    this.events.emit('BOSS_TELEGRAPH');
  }

  private updateTelegraph(deltaSeconds: number, knightPosition: THREE.Vector3): void {
    this.body.facePlayer(knightPosition, TELEGRAPH_TURN_RATE, deltaSeconds);
    this.body.applyKnock(deltaSeconds);
    const progress = 1 - Math.max(this.timer, 0) / WHIRL_TELEGRAPH_SECONDS;
    const flash = 0.3 + 0.6 * (0.5 + 0.5 * Math.sin(this.body.pose.elapsed * 24));
    this.body.setPose(0, -0.1 * progress, progress * HORIZONTAL_RAISE, flash, 0);
    this.body.rig.setDanger(progress);
    this.timer -= deltaSeconds;
    if (this.timer > 0) return;
    this.state = 'WHIRLWIND';
    this.timer = WHIRL_SECONDS;
    this.hitTimer = 0;
  }

  private updateWhirlwind(deltaSeconds: number, knightPosition: THREE.Vector3, knightInvulnerable: boolean): void {
    const aim = this.body.trackKnight(knightPosition);
    this.body.position.x += aim.dirX * WHIRL_DRIFT_SPEED * deltaSeconds;
    this.body.position.z += aim.dirZ * WHIRL_DRIFT_SPEED * deltaSeconds;
    this.body.applyKnock(deltaSeconds);
    this.body.pose.orbit += WHIRL_SPIN_RATE * deltaSeconds;
    this.body.pose.walkPhase += deltaSeconds * 6;
    this.body.setPose(0.5, 0.18, HORIZONTAL_RAISE, 0.5, 0);
    this.hitTimer = Math.max(0, this.hitTimer - deltaSeconds);
    this.checkAxeHit(knightPosition, knightInvulnerable);
    this.timer -= deltaSeconds;
    if (this.timer > 0) return;
    this.body.rig.setDanger(0);
    this.body.pose.orbit = 0;
    this.state = 'EXHAUSTED';
    this.timer = EXHAUST_SECONDS;
    this.events.emit('BOSS_STUNNED');
  }

  private checkAxeHit(knightPosition: THREE.Vector3, knightInvulnerable: boolean): void {
    if (knightInvulnerable || this.hitTimer > 0) return;
    const deltaX = knightPosition.x - this.body.position.x;
    const deltaZ = knightPosition.z - this.body.position.z;
    const distance = Math.hypot(deltaX, deltaZ);
    if (distance > WHIRL_REACH) return;
    this.hitTimer = WHIRL_HIT_INTERVAL_SECONDS;
    const length = distance > 1e-4 ? distance : 1;
    this.events.emit('BOSS_SLAM', {
      dirX: distance > 1e-4 ? deltaX / length : 1,
      dirZ: distance > 1e-4 ? deltaZ / length : 0,
      damage: WHIRL_DAMAGE,
      knockback: WHIRL_KNOCKBACK
    });
  }

  private updateExhausted(deltaSeconds: number): void {
    this.body.applyKnock(deltaSeconds);
    this.body.setPose(0.1, 0.28, 0, 0, 1);
    this.timer -= deltaSeconds;
    if (this.timer > 0) return;
    this.state = 'STALKING';
    this.timer = randomBetween(EXECUTIONER_STALK_MIN_SECONDS, EXECUTIONER_STALK_MAX_SECONDS);
  }
}
