import * as THREE from 'three';
import type { GameEventBus } from '../core/events';
import type { Health } from '../core/health';
import type { Input } from '../core/input';
import type { MetaProgression } from '../core/metaProgression';
import type { PlayerStats } from '../core/playerStats';
import type { Progression } from '../core/progression';
import type { RunStats } from '../core/runStats';
import type { AleMugField } from '../entities/aleMug';
import type { Player } from '../entities/player';
import type { Spawner } from '../entities/spawner';
import type { ImpactSparks } from '../render/impactSparks';

const SHOCKWAVE_RADIUS = 9;
const SHOCKWAVE_FORCE = 40;
const SHOCKWAVE_STAGGER_SECONDS = 0.8;
const SHOCKWAVE_SPARK_COUNT = 10;
const SHOCKWAVE_SPARK_RING = 2.2;

export interface RunLifecycleDeps {
  events: GameEventBus;
  input: Input;
  player: Player;
  health: Health;
  stats: PlayerStats;
  progression: Progression;
  meta: MetaProgression;
  spawner: Spawner;
  aleMugs: AleMugField;
  runStats: RunStats;
  sparks: ImpactSparks;
}

export interface RunLifecycle {
  start(): void;
  knockOut(): void;
  revive(): void;
  restart(): void;
  returnToTavern(): void;
}

export function createRunLifecycle(deps: RunLifecycleDeps): RunLifecycle {
  const { events, input, player, health, stats, progression, meta, spawner, aleMugs, runStats, sparks } = deps;
  const sparkPoint = new THREE.Vector3();

  function start(): void {
    const effective = meta.getEffectiveStats();
    stats.applyMeta(effective);
    health.setMax(effective.maxHearts);
    player.applyStats();
    input.setEnabled(true);
    runStats.start();
    spawner.activate(player.position);
  }

  function knockOut(): void {
    input.setEnabled(false);
    player.setKnockedOut(true);
    runStats.stop();
  }

  function revive(): void {
    health.healFull();
    player.setKnockedOut(false);
    input.setEnabled(true);
    runStats.start();
    spawner.shockwave(player.position, SHOCKWAVE_RADIUS, SHOCKWAVE_FORCE, SHOCKWAVE_STAGGER_SECONDS);
    for (let index = 0; index < SHOCKWAVE_SPARK_COUNT; index++) {
      const angle = (index / SHOCKWAVE_SPARK_COUNT) * Math.PI * 2;
      sparkPoint.set(
        player.position.x + Math.cos(angle) * SHOCKWAVE_SPARK_RING,
        1,
        player.position.z + Math.sin(angle) * SHOCKWAVE_SPARK_RING
      );
      sparks.burst(sparkPoint, 1);
    }
    events.emit('KNIGHT_REVIVED');
  }

  function resetRun(): void {
    spawner.reset();
    aleMugs.clear();
    stats.reset();
    progression.reset();
    health.reset();
    player.reset();
    runStats.reset();
    events.emit('RUN_RESET');
  }

  function restart(): void {
    resetRun();
    start();
  }

  function returnToTavern(): void {
    resetRun();
    input.setEnabled(false);
  }

  return { start, knockOut, revive, restart, returnToTavern };
}
