import * as THREE from 'three';
import type { GameEventBus } from '../core/events';
import type { BossBehavior, BossContext } from './bossBehavior';
import { randomBetween, type BossBody } from './bossBody';
import { TELEGRAPH_TURN_RATE } from './bossConfig';
import type { BottleLauncher } from './bottleField';
import {
  KING_BOTTLE_RELEASE_HEIGHT,
  KING_BOTTLE_SPREAD,
  KING_EXTRA_BOTTLE_CHANCE,
  KING_GLOAT_DAMAGE_MULTIPLIER,
  KING_GLOAT_SECONDS,
  KING_MIN_BOTTLES,
  KING_SPEED,
  KING_STALK_MAX_SECONDS,
  KING_STALK_MIN_SECONDS,
  KING_WINDUP_SECONDS
} from './kingConfig';

type KingState = 'STALKING' | 'WINDUP' | 'GLOATING';

export class KingBehavior implements BossBehavior {
  private readonly body: BossBody;
  private readonly events: GameEventBus;
  private readonly bottles: BottleLauncher;
  private readonly releasePoint = new THREE.Vector3();
  private state: KingState = 'STALKING';
  private timer = randomBetween(KING_STALK_MIN_SECONDS, KING_STALK_MAX_SECONDS);

  constructor(context: BossContext) {
    this.body = context.body;
    this.events = context.events;
    this.bottles = context.bottles;
  }

  get damageMultiplier(): number {
    return this.state === 'GLOATING' ? KING_GLOAT_DAMAGE_MULTIPLIER : 1;
  }

  update(deltaSeconds: number, knightPosition: THREE.Vector3): void {
    if (this.state === 'STALKING') this.updateStalking(deltaSeconds, knightPosition);
    else if (this.state === 'WINDUP') this.updateWindup(deltaSeconds, knightPosition);
    else this.updateGloating(deltaSeconds);
  }

  private updateStalking(deltaSeconds: number, knightPosition: THREE.Vector3): void {
    this.body.walkToward(knightPosition, KING_SPEED, deltaSeconds);
    this.timer -= deltaSeconds;
    if (this.timer > 0) return;
    this.state = 'WINDUP';
    this.timer = KING_WINDUP_SECONDS;
    this.events.emit('BOSS_TELEGRAPH');
  }

  private updateWindup(deltaSeconds: number, knightPosition: THREE.Vector3): void {
    this.body.facePlayer(knightPosition, TELEGRAPH_TURN_RATE, deltaSeconds);
    this.body.applyKnock(deltaSeconds);
    const progress = 1 - this.timer / KING_WINDUP_SECONDS;
    const flash = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(this.body.pose.elapsed * 20));
    this.body.setPose(0, -0.12 * progress, Math.min(progress * 1.6, 1), flash, 0);
    this.timer -= deltaSeconds;
    if (this.timer > 0) return;
    this.throwBottles(knightPosition);
    this.state = 'GLOATING';
    this.timer = KING_GLOAT_SECONDS;
  }

  private updateGloating(deltaSeconds: number): void {
    this.body.applyKnock(deltaSeconds);
    this.body.setPose(0.15, -0.22, -0.3, 0, 0.7);
    this.timer -= deltaSeconds;
    if (this.timer > 0) return;
    this.state = 'STALKING';
    this.timer = randomBetween(KING_STALK_MIN_SECONDS, KING_STALK_MAX_SECONDS);
  }

  private throwBottles(knightPosition: THREE.Vector3): void {
    const count = KING_MIN_BOTTLES + (Math.random() < KING_EXTRA_BOTTLE_CHANCE ? 1 : 0);
    this.releasePoint.set(this.body.position.x, KING_BOTTLE_RELEASE_HEIGHT, this.body.position.z);
    for (let index = 0; index < count; index++) {
      const offsetX = index === 0 ? 0 : (Math.random() * 2 - 1) * KING_BOTTLE_SPREAD;
      const offsetZ = index === 0 ? 0 : (Math.random() * 2 - 1) * KING_BOTTLE_SPREAD;
      this.bottles.launch(this.releasePoint, knightPosition.x + offsetX, knightPosition.z + offsetZ);
    }
  }
}
