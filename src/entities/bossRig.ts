import type * as THREE from 'three';

export const WEAPON_REST_ANGLE = 0.5;
export const WEAPON_RAISED_ANGLE = -0.95;

export interface BossRig {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  weaponOrbit: THREE.Group;
  weaponPivot: THREE.Group;
  leftFoot: THREE.Mesh;
  rightFoot: THREE.Mesh;
  baseScale: number;
  setWarning(level: number): void;
  setDanger(progress: number): void;
}
