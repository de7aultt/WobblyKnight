import * as THREE from 'three';
import { EventBus, type GameEvents } from './core/events';
import { Input } from './core/input';
import { GameLoop } from './core/loop';
import type { PerkId } from './core/perks';
import { PlayerStats } from './core/playerStats';
import { Progression } from './core/progression';
import { AleMugField } from './entities/aleMug';
import { Player } from './entities/player';
import { Spawner } from './entities/spawner';
import { Combat } from './physics/combat';
import { createArena } from './render/arena';
import { createCamera, createCameraFollow, resizeCamera } from './render/camera';
import { ImpactSparks } from './render/impactSparks';
import { createLights } from './render/lights';
import { createRenderer, resizeRenderer } from './render/renderer';
import { mountHud } from './ui/hud';
import { mountStartOverlay } from './ui/startOverlay';
import { mountUpgradeModal } from './ui/upgradeModal';

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
  const combat = new Combat(sparks, stats);
  const aleMugs = new AleMugField(scene);
  const spawner = new Spawner(scene, events);
  const loop = new GameLoop();

  function handlePerkChosen(perkId: PerkId): void {
    stats.apply(perkId);
    player.applyStats();
    input.setEnabled(true);
    events.emit('PERK_ACQUIRED', { perkId, level: stats.levelOf(perkId) });
  }

  events.on('GAME_START', () => {
    input.setEnabled(true);
    spawner.activate(player.position);
  });
  events.on('LEVEL_UP', () => input.setEnabled(false));
  events.on('ENEMY_DEFEATED', ({ x, z }) => aleMugs.spawn(x, z));
  events.on('RESIZE', ({ width, height }) => {
    resizeRenderer(renderer, width, height);
    resizeCamera(camera, width, height);
  });
  window.addEventListener('resize', () => {
    events.emit('RESIZE', { width: window.innerWidth, height: window.innerHeight });
  });

  mountHud(uiRoot, events, progression.snapshot());
  mountUpgradeModal({ root: uiRoot, events, loop, stats, onPerkChosen: handlePerkChosen });
  mountStartOverlay(uiRoot, events);

  loop.onTick((delta, elapsed) => {
    events.emit('TICK', { delta, elapsed });
    player.update(delta);
    events.emit('DASH_COOLDOWN', { ratio: player.dashCooldownRatio });
    spawner.update(delta, player.position);
    combat.update(delta, player.chains, spawner.enemies, player.position, player.isDashing);
    aleMugs.update(delta, player.position, stats.magnetMultiplier, () => progression.collectMug());
    sparks.update(delta);
    cameraFollow.update(player.position, delta);
    lights.update(elapsed);
  });
  loop.onFrame(() => renderer.render(scene, camera));
  loop.start();
}

bootstrap();
