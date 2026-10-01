import type * as THREE from 'three';
import type { Enemy } from '../entities/enemy';

export const CONTACT_WINDUP_SECONDS = 0.7;

const CONTACT_REACH = 1.3;

function isTouching(enemy: Enemy, knightPosition: THREE.Vector3): boolean {
  if (enemy.state !== 'CHASING') return false;
  const deltaX = knightPosition.x - enemy.position.x;
  const deltaZ = knightPosition.z - enemy.position.z;
  return Math.hypot(deltaX, deltaZ) < enemy.type.radius + CONTACT_REACH;
}

export class ContactTracker {
  private readonly timers = new Map<Enemy, number>();
  private readonly seen = new Set<Enemy>();

  update(
    deltaSeconds: number,
    enemies: readonly Enemy[],
    knightPosition: THREE.Vector3,
    blocked: boolean
  ): Enemy | null {
    if (blocked) {
      this.timers.clear();
      return null;
    }

    this.seen.clear();
    let attacker: Enemy | null = null;
    for (const enemy of enemies) {
      if (!isTouching(enemy, knightPosition)) continue;
      this.seen.add(enemy);
      const elapsed = (this.timers.get(enemy) ?? 0) + deltaSeconds;
      this.timers.set(enemy, elapsed);
      if (!attacker && elapsed >= CONTACT_WINDUP_SECONDS) attacker = enemy;
    }

    for (const tracked of this.timers.keys()) {
      if (!this.seen.has(tracked)) this.timers.delete(tracked);
    }
    return attacker;
  }

  reset(): void {
    this.timers.clear();
  }
}
