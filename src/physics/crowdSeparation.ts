import type * as THREE from 'three';
import type { Enemy } from '../entities/enemy';

const SEPARATION_STRENGTH = 8;
const PADDING = 1.1;

export function applyCrowdSeparation(
  enemies: readonly Enemy[],
  playerPosition: THREE.Vector3,
  playerRadius: number
): void {
  for (const enemy of enemies) enemy.separation.set(0, 0, 0);

  for (let first = 0; first < enemies.length; first++) {
    const a = enemies[first];
    if (!a.isCollidable) continue;

    for (let second = first + 1; second < enemies.length; second++) {
      const b = enemies[second];
      if (!b.isCollidable) continue;
      push(a, b, (a.type.radius + b.type.radius) * PADDING);
    }

    const deltaX = a.position.x - playerPosition.x;
    const deltaZ = a.position.z - playerPosition.z;
    pushAway(a, deltaX, deltaZ, (a.type.radius + playerRadius) * PADDING, 1);
  }
}

function push(a: Enemy, b: Enemy, minimumDistance: number): void {
  const deltaX = a.position.x - b.position.x;
  const deltaZ = a.position.z - b.position.z;
  const distance = Math.hypot(deltaX, deltaZ);
  if (distance >= minimumDistance) return;
  const totalMass = a.type.mass + b.type.mass;
  pushAway(a, deltaX, deltaZ, minimumDistance, b.type.mass / totalMass);
  pushAway(b, -deltaX, -deltaZ, minimumDistance, a.type.mass / totalMass);
}

function pushAway(enemy: Enemy, deltaX: number, deltaZ: number, minimumDistance: number, share: number): void {
  const distance = Math.hypot(deltaX, deltaZ);
  if (distance >= minimumDistance) return;
  const overlap = minimumDistance - distance;
  const directionX = distance > 1e-4 ? deltaX / distance : Math.random() - 0.5;
  const directionZ = distance > 1e-4 ? deltaZ / distance : Math.random() - 0.5;
  enemy.separation.x += directionX * overlap * SEPARATION_STRENGTH * share;
  enemy.separation.z += directionZ * overlap * SEPARATION_STRENGTH * share;
}
