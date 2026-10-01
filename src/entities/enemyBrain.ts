import type * as THREE from 'three';
import { BomberBrain } from './bomberBrain';
import type { BombLauncher } from './bombField';
import { GhoulBrain } from './ghoulBrain';
import type { EnemyType } from './enemyTypes';

export interface EnemySteer {
  moveX: number;
  moveZ: number;
  faceX: number;
  faceZ: number;
  lift: number;
  moving: boolean;
}

export interface BrainInput {
  deltaSeconds: number;
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export interface EnemyBrain {
  steer(input: BrainInput, out: EnemySteer): void;
}

export interface EnemyContext {
  bombs: BombLauncher;
}

const KNIGHT_CONTACT_DISTANCE = 1.1;

export function createSteer(): EnemySteer {
  return { moveX: 0, moveZ: 0, faceX: 0, faceZ: 0, lift: 0, moving: false };
}

class ChaseBrain implements EnemyBrain {
  constructor(private readonly type: EnemyType) {}

  steer(input: BrainInput, out: EnemySteer): void {
    const deltaX = input.target.x - input.position.x;
    const deltaZ = input.target.z - input.position.z;
    const distance = Math.hypot(deltaX, deltaZ);
    const hasTarget = distance > 1e-3;
    const arrived = distance < this.type.radius + KNIGHT_CONTACT_DISTANCE;
    out.moving = hasTarget && !arrived;
    out.faceX = hasTarget ? deltaX : 0;
    out.faceZ = hasTarget ? deltaZ : 0;
    out.moveX = out.moving ? (deltaX / distance) * this.type.speed : 0;
    out.moveZ = out.moving ? (deltaZ / distance) * this.type.speed : 0;
    out.lift = 0;
  }
}

export function createBrain(type: EnemyType, context: EnemyContext): EnemyBrain {
  if (type.kind === 'bomber') return new BomberBrain(type, context.bombs);
  if (type.kind === 'ghoul') return new GhoulBrain(type);
  return new ChaseBrain(type);
}
