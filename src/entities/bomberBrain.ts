import * as THREE from 'three';
import type { BrainInput, EnemyBrain, EnemySteer } from './enemyBrain';
import type { EnemyType } from './enemyTypes';
import type { BombLauncher } from './bombField';

const PREFERRED_DISTANCE = 7;
const DISTANCE_BAND = 1.2;
const THROW_RANGE = 11;
const WINDUP_SECONDS = 0.5;
const FIRST_THROW_MIN_SECONDS = 1;
const FIRST_THROW_MAX_SECONDS = 2.4;
const THROW_COOLDOWN_SECONDS = 2.6;
const THROW_COOLDOWN_JITTER = 1;
const RELEASE_HEIGHT = 1.6;

export class BomberBrain implements EnemyBrain {
  private readonly releasePoint = new THREE.Vector3();
  private cooldown = FIRST_THROW_MIN_SECONDS + Math.random() * (FIRST_THROW_MAX_SECONDS - FIRST_THROW_MIN_SECONDS);
  private windup = 0;

  constructor(
    private readonly type: EnemyType,
    private readonly bombs: BombLauncher
  ) {}

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

    if (this.windup > 0) {
      this.windup -= input.deltaSeconds;
      if (this.windup <= 0) this.throwBomb(input);
      return;
    }

    this.cooldown -= input.deltaSeconds;
    if (this.cooldown <= 0 && distance <= THROW_RANGE) this.windup = WINDUP_SECONDS;

    const direction = distance > PREFERRED_DISTANCE + DISTANCE_BAND ? 1 : distance < PREFERRED_DISTANCE - DISTANCE_BAND ? -1 : 0;
    out.moving = direction !== 0;
    out.moveX = directionX * direction * this.type.speed;
    out.moveZ = directionZ * direction * this.type.speed;
  }

  private throwBomb(input: BrainInput): void {
    this.releasePoint.set(input.position.x, RELEASE_HEIGHT, input.position.z);
    this.bombs.launch(this.releasePoint, input.target.x, input.target.z);
    this.cooldown = THROW_COOLDOWN_SECONDS + Math.random() * THROW_COOLDOWN_JITTER;
  }
}
