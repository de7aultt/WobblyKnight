import * as THREE from 'three';
import { AdService } from './core/ads';
import { EventBus, type GameEvents } from './core/events';
import { Health } from './core/health';
import { bindLocaleEvents } from './i18n';
import { HighScores } from './core/highScores';
import { Input } from './core/input';
import { MetaProgression } from './core/metaProgression';
import { GameLoop } from './core/loop';
import type { PerkId } from './core/perks';
import { PlayerStats } from './core/playerStats';
import { Progression } from './core/progression';
import { RunStats } from './core/runStats';
import { SettingsStore } from './core/settings';
import { wireSoundEvents } from './core/soundEvents';
import { SoundFx } from './core/soundFx';
import { AleMugField } from './entities/aleMug';
import { Player } from './entities/player';
import { Spawner } from './entities/spawner';
import { createRunLifecycle } from './game/runLifecycle';
import { Combat } from './physics/combat';
import { CONTACT_WINDUP_SECONDS, ContactTracker } from './physics/knightDamage';
import { createArena } from './render/arena';
import { createCamera, createCameraFollow, resizeCamera } from './render/camera';
import { applyGraphicsQuality } from './render/graphicsQuality';
import { ImpactSparks } from './render/impactSparks';
import { createLights } from './render/lights';
import { createRenderer, resizeRenderer } from './render/renderer';
import { showMockAdOverlay } from './ui/adOverlay';
import { mountBossHud } from './ui/bossHud';
import { mountGameOverController } from './ui/gameOverController';
import { mountHud } from './ui/hud';
import { mountLobby } from './ui/lobbyView';
import { mountUpgradeModal } from './ui/upgradeModal';

const BOSS_KNOCKBACK_SPEED = 24;
const BOSS_DAMAGE = 2;
const BOSS_MUG_COUNT = 18;
const BOSS_EXPLOSION_BURSTS = 6;
const CONTACT_DAMAGE = 1;
const CONTACT_KNOCKBACK_SPEED = 9;
const DAMAGE_FLASH_RATE = 14;

function requireElement<Element extends HTMLElement>(id: string): Element {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element: #${id}`);
  return element as Element;
}

function bootstrap(): void {
  const events = new EventBus<GameEvents>();
  const canvas = requireElement<HTMLCanvasElement>('canvas-layer');
  const uiRoot = requireElement<HTMLDivElement>('ui-root');

  const settings = new SettingsStore(events);
  const renderer = createRenderer(canvas, settings.snapshot().quality === 'high');
  const camera = createCamera(window.innerWidth / window.innerHeight);
  const cameraFollow = createCameraFollow(camera);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x110d18);

  const lights = createLights(scene);
  createArena(scene);

  const stats = new PlayerStats();
  const progression = new Progression(events);
  const health = new Health(events);
  const runStats = new RunStats();
  const highScores = new HighScores();
  const meta = new MetaProgression();
  const ads = new AdService((durationMs, slot) => showMockAdOverlay(uiRoot, durationMs, slot));
  const input = new Input(camera);
  const player = new Player(scene, input, stats);

  const sparks = new ImpactSparks(scene);
  const combat = new Combat(sparks, stats, (heavy) => events.emit('ENEMY_HIT', { heavy }));
  const aleMugs = new AleMugField(scene);
  const spawner = new Spawner(scene, events);
  const loop = new GameLoop();
  const lifecycle = createRunLifecycle({
    events,
    ads,
    input,
    player,
    health,
    stats,
    progression,
    meta,
    spawner,
    aleMugs,
    runStats,
    sparks
  });
  const contacts = new ContactTracker();
  const bossPush = new THREE.Vector3();
  const explosionPoint = new THREE.Vector3();
  let wasDashing = false;

  function handlePerkChosen(perkId: PerkId): void {
    stats.apply(perkId);
    player.applyStats();
    if (!health.isKnockedOut) input.setEnabled(true);
    events.emit('PERK_ACQUIRED', { perkId, level: stats.levelOf(perkId) });
  }

  function explodeBoss(x: number, z: number): void {
    runStats.addEnemy();
    aleMugs.spawnBurst(x, z, BOSS_MUG_COUNT);
    for (let index = 0; index < BOSS_EXPLOSION_BURSTS; index++) {
      explosionPoint.set(x + (Math.random() - 0.5) * 3, 1 + Math.random() * 3, z + (Math.random() - 0.5) * 3);
      sparks.burst(explosionPoint, 1.5);
    }
  }

  function applyContactDamage(deltaSeconds: number): void {
    const blocked = player.isDashing || health.isProtected;
    const attacker = contacts.update(
      deltaSeconds,
      spawner.enemies,
      player.position,
      blocked,
      CONTACT_WINDUP_SECONDS * stats.contactWindupMultiplier
    );
    if (!attacker || !health.takeDamage(CONTACT_DAMAGE)) return;
    contacts.reset();
    const deltaX = player.position.x - attacker.position.x;
    const deltaZ = player.position.z - attacker.position.z;
    const length = Math.hypot(deltaX, deltaZ) || 1;
    player.knockback(deltaX / length, deltaZ / length, CONTACT_KNOCKBACK_SPEED);
  }

  bindLocaleEvents(events);
  void ads.initialize();
  loop.onPauseChange((paused) => {
    if (paused) ads.gameplayStop();
    else if (lifecycle.isRunning) ads.gameplayStart();
  });
  wireSoundEvents(events, new SoundFx());
  events.on('KNOCKED_OUT', lifecycle.knockOut);
  events.on('LEVEL_UP', () => input.setEnabled(false));
  events.on('ENEMY_DEFEATED', ({ x, z, smashed }) => {
    aleMugs.spawn(x, z);
    if (smashed) runStats.addEnemy();
  });
  events.on('BOSS_SLAM', ({ dirX, dirZ }) => {
    if (health.takeDamage(BOSS_DAMAGE)) player.knockback(dirX, dirZ, BOSS_KNOCKBACK_SPEED);
  });
  events.on('BOSS_DEFEATED', ({ x, z }) => explodeBoss(x, z));
  events.on('SETTINGS_CHANGED', ({ quality }) => applyGraphicsQuality({ renderer, lights, scene }, quality));
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
  const lobby = mountLobby({ root: uiRoot, events, meta, highScores, settings, onEnterBrawl: lifecycle.start });
  mountGameOverController({
    root: uiRoot,
    events,
    loop,
    runStats,
    highScores,
    meta,
    ads,
    onRevive: lifecycle.revive,
    onRestart: lifecycle.restart,
    onReturnToTavern: () => {
      lifecycle.returnToTavern();
      lobby.show();
  settings.announce();
    }
  });
  lobby.show();

  loop.onTick((delta, elapsed) => {
    events.emit('TICK', { delta, elapsed });
    runStats.tick(delta);
    health.update(delta);
    player.update(delta);
    if (player.isDashing && !wasDashing) events.emit('DASH_STARTED');
    wasDashing = player.isDashing;
    events.emit('DASH_COOLDOWN', { ratio: player.dashCooldownRatio });
    player.setDamageFlash(health.isInvulnerable && !health.isKnockedOut ? Math.floor(elapsed * DAMAGE_FLASH_RATE) % 2 : 0);

    spawner.update(delta, player.position, player.isDashing || health.isProtected);
    applyContactDamage(delta);
    if (spawner.boss?.computeKnightPush(player.position, bossPush)) player.nudge(bossPush.x, bossPush.z);
    combat.update(delta, player.chains, spawner.targets, player.position, player.isDashing);
    aleMugs.update(delta, player.position, stats.magnetRadiusMultiplier, stats.magnetMultiplier, () => {
      progression.collectMug();
      runStats.addMug();
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
