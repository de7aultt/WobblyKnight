import * as THREE from 'three';
import type { GameEventBus } from '../core/events';
import { applyCrowdSeparation } from '../physics/crowdSeparation';
import { ARENA_HALF } from '../render/arenaLayout';
import { Boss } from './boss';
import type { CombatTarget } from './combatTarget';
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
const BOSS_TRIGGER_SECONDS = 90;
const BOSS_TRIGGER_LEVEL = 5;
const BOSS_TRIGGER_DEFEATS = 50;
const BOSS_SPAWN_DISTANCE = 8;

export class Spawner {
  readonly enemies: Enemy[] = [];
  readonly targets: CombatTarget[] = [];
  boss: Boss | null = null;
  private active = false;
  private bossTriggered = false;
  private elapsed = 0;
  private spawnTimer = 0;
  private defeatedCount = 0;
  private reachedLevel = 1;
  private readonly spawnPoint = new THREE.Vector2();
  private readonly clearedEnemies = new Set<Enemy>();

  constructor(
    private readonly scene: THREE.Scene,
    private readonly events: GameEventBus
  ) {
    events.on('LEVEL_UP', ({ level }) => {
      this.reachedLevel = level;
    });
  }

  activate(playerPosition: THREE.Vector3): void {
    this.active = true;
    for (let index = 0; index < INITIAL_GOBLINS; index++) this.spawn('goblin', playerPosition);
  }

  reset(): void {
    this.enemies.forEach((enemy) => enemy.dispose());
    this.enemies.length = 0;
    this.targets.length = 0;
    this.clearedEnemies.clear();
    this.boss?.dispose();
    this.boss = null;
    this.active = false;
    this.bossTriggered = false;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.defeatedCount = 0;
    this.reachedLevel = 1;
  }

  shockwave(center: THREE.Vector3, radius: number, force: number, staggerSeconds: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.isCollidable) continue;
      const deltaX = enemy.position.x - center.x;
      const deltaZ = enemy.position.z - center.z;
      const distance = Math.hypot(deltaX, deltaZ);
      if (distance > radius) continue;
      const directionX = distance > 1e-4 ? deltaX / distance : 1;
      const directionZ = distance > 1e-4 ? deltaZ / distance : 0;
      enemy.shove(directionX, directionZ, force * (1 - (distance / radius) * 0.5));
      enemy.stagger(staggerSeconds);
    }
  }

  update(deltaSeconds: number, playerPosition: THREE.Vector3, knightInvulnerable: boolean): void {
    if (this.active) {
      if (this.shouldTriggerBoss()) this.startBossEvent(playerPosition);
      if (!this.boss) this.runSpawnTimer(deltaSeconds, playerPosition);
    }

    this.updateEnemies(deltaSeconds, playerPosition);
    this.updateBoss(deltaSeconds, playerPosition, knightInvulnerable);
    this.rebuildTargets();
  }

  private shouldTriggerBoss(): boolean {
    if (this.bossTriggered) return false;
    return (
      this.elapsed >= BOSS_TRIGGER_SECONDS ||
      this.reachedLevel >= BOSS_TRIGGER_LEVEL ||
      this.defeatedCount >= BOSS_TRIGGER_DEFEATS
    );
  }

  private startBossEvent(playerPosition: THREE.Vector3): void {
    this.bossTriggered = true;
    this.enemies.forEach((enemy) => {
      this.clearedEnemies.add(enemy);
      enemy.state = 'DEAD';
    });

    let directionX = -playerPosition.x;
    let directionZ = -playerPosition.z;
    let length = Math.hypot(directionX, directionZ);
    if (length < 1) {
      directionX = 1;
      directionZ = 1;
      length = Math.SQRT2;
    }
    this.boss = new Boss(
      this.events,
      (directionX / length) * BOSS_SPAWN_DISTANCE,
      (directionZ / length) * BOSS_SPAWN_DISTANCE
    );
    this.scene.add(this.boss.rig.root);
  }

  private updateEnemies(deltaSeconds: number, playerPosition: THREE.Vector3): void {
    applyCrowdSeparation(this.enemies, playerPosition, PLAYER_SEPARATION_RADIUS);
    for (let index = this.enemies.length - 1; index >= 0; index--) {
      const enemy = this.enemies[index];
      enemy.update(deltaSeconds, playerPosition);
      if (enemy.state !== 'DEAD') continue;
      this.defeatedCount += 1;
      const smashed = !this.clearedEnemies.delete(enemy);
      this.events.emit('ENEMY_DEFEATED', { x: enemy.position.x, z: enemy.position.z, smashed });
      enemy.dispose();
      this.enemies.splice(index, 1);
    }
  }

  private updateBoss(deltaSeconds: number, playerPosition: THREE.Vector3, knightInvulnerable: boolean): void {
    if (!this.boss) return;
    this.boss.update(deltaSeconds, playerPosition, knightInvulnerable);
    if (this.boss.state !== 'DEFEATED') return;
    this.boss.dispose();
    this.boss = null;
    this.spawnTimer = SLOWEST_INTERVAL_SECONDS;
  }

  private rebuildTargets(): void {
    this.targets.length = 0;
    this.enemies.forEach((enemy) => this.targets.push(enemy));
    if (this.boss) this.targets.push(this.boss);
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
