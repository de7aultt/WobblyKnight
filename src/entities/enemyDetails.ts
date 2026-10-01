import * as THREE from 'three';
import { addEyes, cachedGeometry, part } from './enemyParts';
import type { EnemyKind, EnemyType } from './enemyTypes';

type DetailBuilder = (body: THREE.Group, type: EnemyType) => void;

function addGoblinDetails(body: THREE.Group, type: EnemyType): void {
  const headY = 1.2;
  const ear = cachedGeometry('goblinEar', () => new THREE.ConeGeometry(0.1, 0.38, 5));
  const leftEar = part(ear, type.skinColor, 0.3, headY, 0);
  leftEar.rotation.z = -1.35;
  const rightEar = part(ear, type.skinColor, -0.3, headY, 0);
  rightEar.rotation.z = 1.35;
  const nose = part(cachedGeometry('goblinNose', () => new THREE.ConeGeometry(0.06, 0.2, 5)), type.skinColor, 0, headY - 0.02, 0.32);
  nose.rotation.x = Math.PI / 2;
  const cap = part(cachedGeometry('goblinCap', () => new THREE.ConeGeometry(0.24, 0.45, 6)), type.accentColor, 0, headY + 0.36, -0.04);
  cap.rotation.x = -0.35;
  body.add(leftEar, rightEar, nose, cap);
  addEyes(body, 0xffe14a, headY, 0.12, 0.25);
}

function addBrigandDetails(body: THREE.Group, type: EnemyType): void {
  const headY = 1.22;
  const cap = part(cachedGeometry('brigandCap', () => new THREE.CylinderGeometry(0.29, 0.31, 0.16, 10)), type.accentColor, 0, headY + 0.24, 0);
  const brim = part(cachedGeometry('brigandBrim', () => new THREE.CylinderGeometry(0.36, 0.36, 0.04, 10)), type.accentColor, 0, headY + 0.15, 0);
  const beard = part(cachedGeometry('brigandBeard', () => new THREE.SphereGeometry(0.2, 8, 6)), 0x3a2a1e, 0, headY - 0.18, 0.12);
  beard.scale.set(1.1, 0.9, 0.8);
  const bottle = part(cachedGeometry('brigandBottle', () => new THREE.CylinderGeometry(0.06, 0.08, 0.34, 8)), 0x2f7a3e, 0.52, 0.42, 0.18);
  bottle.rotation.z = -0.4;
  body.add(cap, brim, beard, bottle);
  addEyes(body, 0x111111, headY, 0.11, 0.26);
}

function addBomberDetails(body: THREE.Group, type: EnemyType): void {
  const headY = 1.2;
  const band = part(cachedGeometry('bomberBand', () => new THREE.CylinderGeometry(0.28, 0.28, 0.12, 10)), type.accentColor, 0, headY + 0.14, 0);
  const knot = part(cachedGeometry('bomberKnot', () => new THREE.ConeGeometry(0.08, 0.3, 5)), type.accentColor, 0, headY + 0.12, -0.3);
  knot.rotation.x = -2;
  const bottle = part(cachedGeometry('bomberBottle', () => new THREE.CylinderGeometry(0.07, 0.1, 0.4, 8)), 0x3f8f3a, 0.46, 0.85, 0.28);
  bottle.rotation.x = -0.5;
  const fuse = part(cachedGeometry('bomberFuse', () => new THREE.SphereGeometry(0.05, 6, 4)), 0xff9a2e, 0.46, 1.08, 0.38);
  body.add(band, knot, bottle, fuse);
  addEyes(body, 0x111111, headY, 0.11, 0.25);
}

function addGuardDetails(body: THREE.Group, type: EnemyType): void {
  const headY = 1.22;
  const dome = part(
    cachedGeometry('guardDome', () => new THREE.SphereGeometry(0.31, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)),
    type.accentColor,
    0,
    headY + 0.08,
    0
  );
  const brim = part(cachedGeometry('guardBrim', () => new THREE.CylinderGeometry(0.44, 0.44, 0.04, 12)), type.accentColor, 0, headY + 0.1, 0);
  const board = part(cachedGeometry('guardShield', () => new THREE.BoxGeometry(0.95, 1.15, 0.12)), 0x7a4e2a, 0, 0.7, 0.55);
  const rim = part(cachedGeometry('guardShieldRim', () => new THREE.BoxGeometry(1.03, 0.1, 0.16)), 0x3b3f46, 0, 1.28, 0.55);
  const boss = part(cachedGeometry('guardShieldBoss', () => new THREE.SphereGeometry(0.17, 8, 6)), 0x9aa3ad, 0, 0.7, 0.63);
  body.add(dome, brim, board, rim, boss);
  addEyes(body, 0x111111, headY, 0.11, 0.25);
}

function addGhoulDetails(body: THREE.Group, type: EnemyType): void {
  const headY = 1.2;
  const ear = cachedGeometry('ghoulEar', () => new THREE.ConeGeometry(0.08, 0.42, 5));
  const leftEar = part(ear, type.skinColor, 0.28, headY + 0.08, 0);
  leftEar.rotation.z = -1.1;
  const rightEar = part(ear, type.skinColor, -0.28, headY + 0.08, 0);
  rightEar.rotation.z = 1.1;
  const fang = cachedGeometry('ghoulFang', () => new THREE.ConeGeometry(0.03, 0.12, 4));
  const spike = cachedGeometry('ghoulSpike', () => new THREE.ConeGeometry(0.07, 0.3, 5));
  body.add(leftEar, rightEar);
  [-1, 1].forEach((side) => {
    const tooth = part(fang, 0xf2efe6, side * 0.07, headY - 0.14, 0.24);
    tooth.rotation.x = Math.PI;
    body.add(tooth);
  });
  [0.45, 0.7, 0.95].forEach((height) => {
    const back = part(spike, type.accentColor, 0, height, -0.3);
    back.rotation.x = -1.2;
    body.add(back);
  });
  addEyes(body, 0xd96bff, headY, 0.11, 0.25, true);
}

const DETAIL_BUILDERS: Readonly<Record<EnemyKind, DetailBuilder>> = {
  goblin: addGoblinDetails,
  brigand: addBrigandDetails,
  bomber: addBomberDetails,
  shieldGuard: addGuardDetails,
  ghoul: addGhoulDetails
};

export function addEnemyDetails(body: THREE.Group, type: EnemyType): void {
  DETAIL_BUILDERS[type.kind](body, type);
}
