import * as THREE from 'three';
import type { GameEventBus } from '../core/events';
import { applyCrowdSeparation } from '../physics/crowdSeparation';
import { ARENA_HALF } from '../render/arenaLayout';
import { Enemy } from './enemy';
import type { EnemyKind } from './enemyTypes';

const MAX_ACTIVE_ENEMIES = 36;
const INITIAL_GOBLINS = 4;
const SLOWEST_INTERVAL_SECONDS = 1.1;
const FASTEST_INTERVAL_SECONDS = 0.35;
const RAMP_SECONDS = 120;
const BRIGAND_RAMP_SECONDS = 60;
const MAX_BRIGAND_CHANCE = 0.4;
const SPAWN_WALL_INSET = 1.4;
const SPAWN_CORNER_MARGIN = 3.5;
const MIN_PLAYER_DISTANCE = 8;
const PLACEMENT_ATTEMPTS = 8;
const PLAYER_SEPARATION_RADIUS = 0.8;

export class Spawner {
  readonly enemies: Enemy[] = [];
  private active = false;
  private elapsed = 0;
  private spawnTimer = 0;
  private readonly spawnPoint = new THREE.Vector2();

  constructor(
    private readonly scene: THREE.Scene,
    private readonly events: GameEventBus
  ) {}

  activate(playerPosition: THREE.Vector3): void {
    this.active = true;
    for (let index = 0; index < INITIAL_GOBLINS; index++) this.spawn('goblin', playerPosition);
  }

  update(deltaSeconds: number, playerPosition: THREE.Vector3): void {
    if (this.active) this.runSpawnTimer(deltaSeconds, playerPosition);

    applyCrowdSeparation(this.enemies, playerPosition, PLAYER_SEPARATION_RADIUS);
    for (let index = this.enemies.length - 1; index >= 0; index--) {
      const enemy = this.enemies[index];
      enemy.update(deltaSeconds, playerPosition);
      if (enemy.state !== 'DEAD') continue;
      this.events.emit('ENEMY_DEFEATED', { x: enemy.position.x, z: enemy.position.z });
      enemy.dispose();
      this.enemies.splice(index, 1);
    }
  }

  private runSpawnTimer(deltaSeconds: number, playerPosition: THREE.Vector3): void {
    this.elapsed += deltaSeconds;
    this.spawnTimer -= deltaSeconds;
    if (this.spawnTimer > 0) return;
    if (this.enemies.length >= MAX_ACTIVE_ENEMIES) {
      this.spawnTimer = 0;
      return;
    }
    this.spawn(this.pickKind(), playerPosition);
    const progress = Math.min(this.elapsed / RAMP_SECONDS, 1);
    this.spawnTimer = SLOWEST_INTERVAL_SECONDS + (FASTEST_INTERVAL_SECONDS - SLOWEST_INTERVAL_SECONDS) * progress;
  }

  private pickKind(): EnemyKind {
    const brigandChance = Math.min(this.elapsed / BRIGAND_RAMP_SECONDS, 1) * MAX_BRIGAND_CHANCE;
    return Math.random() < brigandChance ? 'brigand' : 'goblin';
  }

  private spawn(kind: EnemyKind, playerPosition: THREE.Vector3): void {
    this.pickSpawnPoint(playerPosition);
    const enemy = new Enemy(kind, this.spawnPoint.x, this.spawnPoint.y);
    this.scene.add(enemy.rig.root);
    this.enemies.push(enemy);
  }

  private pickSpawnPoint(playerPosition: THREE.Vector3): void {
    const edge = ARENA_HALF - SPAWN_WALL_INSET;
    const span = edge - SPAWN_CORNER_MARGIN;
    for (let attempt = 0; attempt < PLACEMENT_ATTEMPTS; attempt++) {
      const along = (Math.random() * 2 - 1) * span;
      const side = Math.floor(Math.random() * 4);
      const x = side < 2 ? along : (side === 2 ? -edge : edge);
      const z = side < 2 ? (side === 0 ? -edge : edge) : along;
      this.spawnPoint.set(x, z);
      if (Math.hypot(x - playerPosition.x, z - playerPosition.z) >= MIN_PLAYER_DISTANCE) return;
    }
  }
}
