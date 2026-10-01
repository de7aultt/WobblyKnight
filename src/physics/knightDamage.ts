import type * as THREE from 'three';
import type { Enemy } from '../entities/enemy';

const CONTACT_REACH = 1.3;

export function findContactEnemy(enemies: readonly Enemy[], knightPosition: THREE.Vector3): Enemy | null {
  for (const enemy of enemies) {
    if (enemy.state !== 'CHASING') continue;
    const deltaX = knightPosition.x - enemy.position.x;
    const deltaZ = knightPosition.z - enemy.position.z;
    if (Math.hypot(deltaX, deltaZ) < enemy.type.radius + CONTACT_REACH) return enemy;
  }
  return null;
}
