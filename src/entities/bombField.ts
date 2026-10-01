import * as THREE from 'three';
import type { GameEventBus } from '../core/events';
import { BLAST_RADIUS, BomberBomb } from './bomberBomb';

const BLAST_DAMAGE = 1;
const BLAST_KNOCKBACK = 12;
const KNIGHT_REACH = 0.4;

export interface BombLauncher {
  launch(origin: THREE.Vector3, targetX: number, targetZ: number): void;
}

export class BombField implements BombLauncher {
  private readonly bombs: BomberBomb[] = [];

  constructor(
    private readonly scene: THREE.Scene,
    private readonly events: GameEventBus
  ) {}

  launch(origin: THREE.Vector3, targetX: number, targetZ: number): void {
    const bomb = new BomberBomb(origin, targetX, targetZ);
    this.scene.add(bomb.mesh, bomb.shadow);
    this.bombs.push(bomb);
  }

  update(deltaSeconds: number, knightPosition: THREE.Vector3, knightInvulnerable: boolean): void {
    for (let index = this.bombs.length - 1; index >= 0; index--) {
      const bomb = this.bombs[index];
      if (!bomb.update(deltaSeconds)) continue;
      bomb.dispose();
      this.bombs.splice(index, 1);
      this.events.emit('BOMB_EXPLODED', { x: bomb.targetX, z: bomb.targetZ });
      if (!knightInvulnerable) this.blastKnight(bomb, knightPosition);
    }
  }

  clear(): void {
    this.bombs.forEach((bomb) => bomb.dispose());
    this.bombs.length = 0;
  }

  private blastKnight(bomb: BomberBomb, knightPosition: THREE.Vector3): void {
    const deltaX = knightPosition.x - bomb.targetX;
    const deltaZ = knightPosition.z - bomb.targetZ;
    const distance = Math.hypot(deltaX, deltaZ);
    if (distance > BLAST_RADIUS + KNIGHT_REACH) return;
    const length = distance > 1e-4 ? distance : 1;
    this.events.emit('HAZARD_HIT', {
      dirX: distance > 1e-4 ? deltaX / length : 1,
      dirZ: distance > 1e-4 ? deltaZ / length : 0,
      damage: BLAST_DAMAGE,
      knockback: BLAST_KNOCKBACK
    });
  }
}
