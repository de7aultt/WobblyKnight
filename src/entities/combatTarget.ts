import type * as THREE from 'three';

export interface CombatTargetType {
  readonly mass: number;
  readonly radius: number;
  readonly height: number;
}

export interface CombatTarget {
  readonly position: THREE.Vector3;
  readonly type: CombatTargetType;
  readonly health: number;
  readonly isCollidable: boolean;
  readonly isHittable: boolean;
  overlapsSphere(center: THREE.Vector3, radius: number): boolean;
  shove(directionX: number, directionZ: number, strength: number): void;
  stagger(seconds: number): void;
  blockHit?(origin: THREE.Vector3, speed: number): boolean;
  receiveHit(damage: number, impulse: THREE.Vector3): void;
}
