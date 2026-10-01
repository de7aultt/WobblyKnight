import type { BrainInput, EnemyBrain, EnemySteer } from './enemyBrain';
import type { EnemyType } from './enemyTypes';

type GhoulState = 'APPROACH' | 'PAUSE' | 'LEAP';

const ZIGZAG_RATE = 7;
const ZIGZAG_AMPLITUDE = 0.9;
const LEAP_TRIGGER_DISTANCE = 4.5;
const PAUSE_SECONDS = 0.3;
const LEAP_SECONDS = 0.45;
const LEAP_SPEED = 13;
const LEAP_HEIGHT = 1.3;
const LEAP_COOLDOWN_SECONDS = 1.4;

export class GhoulBrain implements EnemyBrain {
  private state: GhoulState = 'APPROACH';
  private timer = 0;
  private cooldown = LEAP_COOLDOWN_SECONDS;
  private zigzagPhase = Math.random() * Math.PI * 2;
  private leapX = 0;
  private leapZ = 0;

  constructor(private readonly type: EnemyType) {}

  steer(input: BrainInput, out: EnemySteer): void {
    const deltaX = input.target.x - input.position.x;
    const deltaZ = input.target.z - input.position.z;
    const distance = Math.hypot(deltaX, deltaZ);
    const directionX = distance > 1e-3 ? deltaX / distance : 0;
    const directionZ = distance > 1e-3 ? deltaZ / distance : 0;
    out.faceX = deltaX;
    out.faceZ = deltaZ;
    out.lift = 0;
    out.moveX = 0;
    out.moveZ = 0;
    out.moving = false;

    if (this.state === 'APPROACH') this.approach(input, out, directionX, directionZ, distance);
    else if (this.state === 'PAUSE') this.pause(input, directionX, directionZ);
    else this.leap(input, out);
  }

  private approach(input: BrainInput, out: EnemySteer, directionX: number, directionZ: number, distance: number): void {
    this.cooldown -= input.deltaSeconds;
    this.zigzagPhase += ZIGZAG_RATE * input.deltaSeconds;
    const lateral = Math.sin(this.zigzagPhase) * ZIGZAG_AMPLITUDE;
    out.moving = true;
    out.moveX = (directionX - directionZ * lateral) * this.type.speed;
    out.moveZ = (directionZ + directionX * lateral) * this.type.speed;
    if (this.cooldown > 0 || distance > LEAP_TRIGGER_DISTANCE) return;
    this.state = 'PAUSE';
    this.timer = PAUSE_SECONDS;
  }

  private pause(input: BrainInput, directionX: number, directionZ: number): void {
    this.timer -= input.deltaSeconds;
    if (this.timer > 0) return;
    this.leapX = directionX;
    this.leapZ = directionZ;
    this.state = 'LEAP';
    this.timer = LEAP_SECONDS;
  }

  private leap(input: BrainInput, out: EnemySteer): void {
    this.timer -= input.deltaSeconds;
    const progress = 1 - Math.max(this.timer, 0) / LEAP_SECONDS;
    out.moving = true;
    out.moveX = this.leapX * LEAP_SPEED;
    out.moveZ = this.leapZ * LEAP_SPEED;
    out.faceX = this.leapX;
    out.faceZ = this.leapZ;
    out.lift = LEAP_HEIGHT * 4 * progress * (1 - progress);
    if (this.timer > 0) return;
    this.state = 'APPROACH';
    this.cooldown = LEAP_COOLDOWN_SECONDS;
  }
}
