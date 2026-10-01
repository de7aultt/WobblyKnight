import * as THREE from 'three';
import type { EnemyType } from './enemyTypes';

export interface EnemyRig {
  root: THREE.Group;
  body: THREE.Group;
  leftFoot: THREE.Mesh;
  rightFoot: THREE.Mesh;
}

const geometryCache = new Map<string, THREE.BufferGeometry>();
const materialCache = new Map<number, THREE.MeshStandardMaterial>();

function cachedGeometry(key: string, create: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let geometry = geometryCache.get(key);
  if (!geometry) {
    geometry = create();
    geometryCache.set(key, geometry);
  }
  return geometry;
}

function cachedMaterial(color: number): THREE.MeshStandardMaterial {
  let material = materialCache.get(color);
  if (!material) {
    material = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    materialCache.set(color, material);
  }
  return material;
}

function part(geometry: THREE.BufferGeometry, color: number, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, cachedMaterial(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addEyes(body: THREE.Group, eyeColor: number, headY: number, spread: number, forward: number): void {
  const eye = cachedGeometry('eye', () => new THREE.SphereGeometry(0.045, 6, 4));
  body.add(part(eye, eyeColor, spread, headY + 0.05, forward), part(eye, eyeColor, -spread, headY + 0.05, forward));
}

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

function createBody(type: EnemyType): THREE.Group {
  const body = new THREE.Group();
  const girth = type.girth;
  const kind = type.kind;
  const torso = part(
    cachedGeometry(`${kind}Torso`, () => new THREE.CylinderGeometry(0.27 * girth, 0.31 * girth, 0.62, 9)),
    type.tunicColor,
    0,
    0.55,
    0
  );
  const belt = part(
    cachedGeometry(`${kind}Belt`, () => new THREE.CylinderGeometry(0.32 * girth, 0.32 * girth, 0.07, 9)),
    0x2a1a10,
    0,
    0.42,
    0
  );
  const head = part(cachedGeometry(`${kind}Head`, () => new THREE.SphereGeometry(0.26, 10, 8)), type.skinColor, 0, 1.2, 0);
  head.scale.setScalar(kind === 'goblin' ? 1.12 : 1);
  body.add(torso, belt, head);

  const arm = cachedGeometry(`${kind}Arm`, () => new THREE.CylinderGeometry(0.07 * girth, 0.06 * girth, 0.5, 7));
  [-1, 1].forEach((side) => {
    const limb = part(arm, type.skinColor, side * 0.36 * girth, 0.5, 0.05);
    limb.rotation.z = side * 0.18;
    body.add(limb);
  });

  if (kind === 'goblin') addGoblinDetails(body, type);
  else addBrigandDetails(body, type);
  return body;
}

export function createEnemyMesh(type: EnemyType): EnemyRig {
  const root = new THREE.Group();
  root.scale.setScalar(type.scale);

  const body = createBody(type);
  const bootGeometry = cachedGeometry('enemyBoot', () => new THREE.BoxGeometry(0.24, 0.2, 0.36));
  const leftFoot = part(bootGeometry, 0x2a1a10, 0.16, 0.1, 0.04);
  const rightFoot = part(bootGeometry, 0x2a1a10, -0.16, 0.1, 0.04);

  root.add(body, leftFoot, rightFoot);
  return { root, body, leftFoot, rightFoot };
}
