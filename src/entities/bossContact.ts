import type * as THREE from 'three';
import { KNIGHT_CONTACT_RADIUS } from './bossConfig';
import { SLAM_CHARGE_BIAS } from './butcherConfig';

export function slamReach(bossRadius: number): number {
  return bossRadius + KNIGHT_CONTACT_RADIUS + 0.2;
}

export function computeKnightPush(
  bossPosition: THREE.Vector3,
  bossRadius: number,
  knightPosition: THREE.Vector3,
  out: THREE.Vector3
): boolean {
  const deltaX = knightPosition.x - bossPosition.x;
  const deltaZ = knightPosition.z - bossPosition.z;
  const distance = Math.hypot(deltaX, deltaZ);
  const minimumDistance = bossRadius + KNIGHT_CONTACT_RADIUS;
  if (distance >= minimumDistance) return false;
  const directionX = distance > 1e-4 ? deltaX / distance : 1;
  const directionZ = distance > 1e-4 ? deltaZ / distance : 0;
  out.set(directionX * (minimumDistance - distance), 0, directionZ * (minimumDistance - distance));
  return true;
}

export function computeSlamDirection(
  chargeDirection: THREE.Vector3,
  deltaX: number,
  deltaZ: number,
  distance: number
): { dirX: number; dirZ: number } {
  const radialX = distance > 1e-4 ? deltaX / distance : chargeDirection.x;
  const radialZ = distance > 1e-4 ? deltaZ / distance : chargeDirection.z;
  const dirX = chargeDirection.x * SLAM_CHARGE_BIAS + radialX * (1 - SLAM_CHARGE_BIAS);
  const dirZ = chargeDirection.z * SLAM_CHARGE_BIAS + radialZ * (1 - SLAM_CHARGE_BIAS);
  const length = Math.hypot(dirX, dirZ) || 1;
  return { dirX: dirX / length, dirZ: dirZ / length };
}
