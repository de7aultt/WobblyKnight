import * as THREE from 'three';
import { EventBus, type GameEvents } from './core/events';
import { Input } from './core/input';
import { GameLoop } from './core/loop';
import type { PerkId } from './core/perks';
import { PlayerStats } from './core/playerStats';
import { Progression } from './core/progression';
import { SoundFx } from './core/soundFx';
import { wireSoundEvents } from './core/soundEvents';
import { AleMugField } from './entities/aleMug';
import { Player } from './entities/player';
import { Spawner } from './entities/spawner';
import { Combat } from './physics/combat';
import { createArena } from './render/arena';
import { createCamera, createCameraFollow, resizeCamera } from './render/camera';
import { ImpactSparks } from './render/impactSparks';
import { createLights } from './render/lights';
import { createRenderer, resizeRenderer } from './render/renderer';
import { mountBossHud } from './ui/bossHud';
import { mountHud } from './ui/hud';
import { mountStartOverlay } from './ui/startOverlay';
import { mountUpgradeModal } from './ui/upgradeModal';

const BOSS_KNOCKBACK_SPEED = 24;
const BOSS_MUG_COUNT = 18;
const BOSS_EXPLOSION_BURSTS = 6;

function requireElement<Element extends HTMLElement>(id: string): Element {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element: #${id}`);
  return element as Element;
}

function bootstrap(): void {
  const events = new EventBus<GameEvents>();
  const canvas = requireElement<HTMLCanvasElement>('canvas-layer');
  const uiRoot = requireElement<HTMLDivElement>('ui-root');

  const renderer = createRenderer(canvas);
  const camera = createCamera(window.innerWidth / window.innerHeight);
  const cameraFollow = createCameraFollow(camera);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x110d18);

  const lights = createLights(scene);
  createArena(scene);

  const stats = new PlayerStats();
  const progression = new Progression(events);
  const input = new Input(camera);
  const player = new Player(scene, input, stats);

  const sparks = new ImpactSparks(scene);
  const combat = new Combat(sparks, stats, (heavy) => events.emit('ENEMY_HIT', { heavy }));
  const aleMugs = new AleMugField(scene);
  const spawner = new Spawner(scene, events);
  const loop = new GameLoop();
  const bossPush = new THREE.Vector3();
  const explosionPoint = new THREE.Vector3();
  let wasDashing = false;

  function handlePerkChosen(perkId: PerkId): void {
    stats.apply(perkId);
    player.applyStats();
    input.setEnabled(true);
    events.emit('PERK_ACQUIRED', { perkId, level: stats.levelOf(perkId) });
  }

  function explodeBoss(x: number, z: number): void {
    aleMugs.spawnBurst(x, z, BOSS_MUG_COUNT);
    for (let index = 0; index < BOSS_EXPLOSION_BURSTS; index++) {
      explosionPoint.set(x + (Math.random() - 0.5) * 3, 1 + Math.random() * 3, z + (Math.random() - 0.5) * 3);
      sparks.burst(explosionPoint, 1.5);
    }
  }

  wireSoundEvents(events, new SoundFx());
  events.on('GAME_START', () => {
    input.setEnabled(true);
    spawner.activate(player.position);
  });
  events.on('LEVEL_UP', () => input.setEnabled(false));
  events.on('ENEMY_DEFEATED', ({ x, z }) => aleMugs.spawn(x, z));
  events.on('BOSS_SLAM', ({ dirX, dirZ }) => player.knockback(dirX, dirZ, BOSS_KNOCKBACK_SPEED));
  events.on('BOSS_DEFEATED', ({ x, z }) => explodeBoss(x, z));
  events.on('RESIZE', ({ width, height }) => {
    resizeRenderer(renderer, width, height);
    resizeCamera(camera, width, height);
  });
  window.addEventListener('resize', () => {
    events.emit('RESIZE', { width: window.innerWidth, height: window.innerHeight });
  });

  mountHud(uiRoot, events, progression.snapshot());
  mountBossHud(uiRoot, events);
  mountUpgradeModal({ root: uiRoot, events, loop, stats, onPerkChosen: handlePerkChosen });
  mountStartOverlay(uiRoot, events);

  loop.onTick((delta, elapsed) => {
    events.emit('TICK', { delta, elapsed });
    player.update(delta);
    if (player.isDashing && !wasDashing) events.emit('DASH_STARTED');
    wasDashing = player.isDashing;
    events.emit('DASH_COOLDOWN', { ratio: player.dashCooldownRatio });
    events.emit('FLAIL_SPEED', { speed: player.flailSpeed });

    spawner.update(delta, player.position, player.isDashing);
    if (spawner.boss?.computeKnightPush(player.position, bossPush)) player.nudge(bossPush.x, bossPush.z);
    combat.update(delta, player.chains, spawner.targets, player.position, player.isDashing);
    aleMugs.update(delta, player.position, stats.magnetMultiplier, () => {
      progression.collectMug();
      events.emit('MUG_COLLECTED');
    });
    sparks.update(delta);
    cameraFollow.update(player.position, delta);
    lights.update(elapsed);
  });
  loop.onFrame(() => renderer.render(scene, camera));
  loop.start();
}

bootstrap();
