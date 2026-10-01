import * as THREE from 'three';

export const BOSS_SCALE = 1.9;
export const CLEAVER_REST_ANGLE = 0.5;
export const CLEAVER_RAISED_ANGLE = -0.95;

export interface BossRig {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  cleaverPivot: THREE.Group;
  leftFoot: THREE.Mesh;
  rightFoot: THREE.Mesh;
  setWarning(level: number): void;
}

const BELLY_CENTER_Y = 1.15;
const BELLY_RADIUS = 0.74;
const BELLY_SCALE = new THREE.Vector3(1.1, 0.95, 1);

function standard(color: number, roughness = 0.8, metalness = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function part(geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function apronSurfaceZ(x: number, y: number): number {
  const lateral = x / BELLY_SCALE.x;
  const vertical = (y - BELLY_CENTER_Y) / BELLY_SCALE.y;
  const radius = BELLY_RADIUS + 0.04;
  return Math.sqrt(Math.max(radius * radius - lateral * lateral - vertical * vertical, 0.01)) * BELLY_SCALE.z;
}

function addBelly(body: THREE.Group, materials: Record<string, THREE.MeshStandardMaterial>): void {
  const belly = part(new THREE.SphereGeometry(BELLY_RADIUS, 20, 14), materials.shirt, 0, BELLY_CENTER_Y, 0);
  belly.scale.copy(BELLY_SCALE);

  const apronGeometry = new THREE.SphereGeometry(BELLY_RADIUS + 0.04, 20, 14, Math.PI / 2 - 0.85, 1.7, 0.3, 2.2);
  const apron = part(apronGeometry, materials.apron, 0, BELLY_CENTER_Y, 0);
  apron.scale.copy(BELLY_SCALE);
  body.add(belly, apron);

  const splatGeometry = new THREE.SphereGeometry(0.1, 8, 6);
  const splats: ReadonlyArray<readonly [number, number, number]> = [
    [0.28, 1.4, 0.16],
    [-0.32, 1.1, 0.2],
    [0.08, 0.9, 0.22],
    [-0.12, 1.45, 0.14],
    [0.4, 1.05, 0.18],
    [-0.02, 1.2, 0.3]
  ];
  splats.forEach(([x, y, size]) => {
    const splat = part(splatGeometry, materials.blood, x, y, apronSurfaceZ(x, y));
    splat.scale.set(size * 5, size * 5, 0.35);
    body.add(splat);
  });
}

function addUpperBody(body: THREE.Group, materials: Record<string, THREE.MeshStandardMaterial>): THREE.Group {
  const chest = part(new THREE.SphereGeometry(0.55, 14, 10), materials.shirt, 0, 1.72, 0);
  chest.scale.set(1.3, 0.8, 0.9);
  body.add(chest);

  const armGeometry = new THREE.CylinderGeometry(0.2, 0.17, 0.75, 8);
  const handGeometry = new THREE.SphereGeometry(0.2, 10, 8);
  [-1, 1].forEach((side) => {
    const arm = part(armGeometry, materials.skin, side * 0.82, 1.45, 0.08);
    arm.rotation.z = side * 0.25;
    body.add(arm, part(handGeometry, materials.skin, side * 0.98, 1.08, 0.2));
  });

  const cleaverPivot = new THREE.Group();
  cleaverPivot.position.set(-0.98, 1.12, 0.22);
  cleaverPivot.rotation.x = CLEAVER_REST_ANGLE;
  const handle = part(new THREE.CylinderGeometry(0.07, 0.07, 0.55, 8), materials.handle, 0, 0.18, 0);
  const blade = part(new THREE.BoxGeometry(0.08, 0.7, 0.46), materials.iron, 0, 0.75, 0.16);
  const edge = part(new THREE.BoxGeometry(0.04, 0.7, 0.06), materials.edge, 0, 0.75, 0.4);
  cleaverPivot.add(handle, blade, edge);
  body.add(cleaverPivot);
  return cleaverPivot;
}

function createHead(materials: Record<string, THREE.MeshStandardMaterial>): THREE.Group {
  const head = new THREE.Group();
  head.position.y = 2.15;
  const skull = part(new THREE.SphereGeometry(0.34, 14, 10), materials.skin, 0, 0, 0);
  skull.scale.set(1, 0.95, 1);
  const hatBand = part(new THREE.CylinderGeometry(0.35, 0.35, 0.22, 14), materials.hat, 0, 0.32, 0);
  const hatPuff = part(new THREE.SphereGeometry(0.42, 14, 10), materials.hat, 0, 0.66, 0);
  hatPuff.scale.set(1, 0.8, 1);
  const nose = part(new THREE.SphereGeometry(0.1, 8, 6), materials.skin, 0, -0.02, 0.34);
  const mustache = part(new THREE.BoxGeometry(0.4, 0.07, 0.08), materials.dark, 0, -0.14, 0.31);
  head.add(skull, hatBand, hatPuff, nose, mustache);

  const eyeGeometry = new THREE.SphereGeometry(0.045, 6, 4);
  const browGeometry = new THREE.BoxGeometry(0.18, 0.04, 0.05);
  [-1, 1].forEach((side) => {
    const brow = part(browGeometry, materials.dark, side * 0.13, 0.15, 0.3);
    brow.rotation.z = side * 0.4;
    head.add(part(eyeGeometry, materials.dark, side * 0.12, 0.07, 0.32), brow);
  });
  return head;
}

export function createBossMesh(): BossRig {
  const materials = {
    skin: standard(0xd28a6a),
    shirt: standard(0xb8ad94),
    apron: standard(0xeeeadf),
    blood: standard(0x8a0f14, 0.5),
    hat: standard(0xf4f4f4),
    dark: standard(0x241810),
    iron: standard(0x9aa3ad, 0.35, 0.8),
    edge: standard(0xe6edf3, 0.2, 0.9),
    handle: standard(0x5a3720),
    trousers: standard(0x3b3a52)
  };

  materials.apron.side = THREE.DoubleSide;

  const root = new THREE.Group();
  root.scale.setScalar(BOSS_SCALE);
  const body = new THREE.Group();
  root.add(body);

  const legGeometry = new THREE.CylinderGeometry(0.24, 0.22, 0.75, 8);
  const bootGeometry = new THREE.BoxGeometry(0.42, 0.24, 0.6);
  const leftFoot = part(bootGeometry, materials.dark, 0.34, 0.12, 0.08);
  const rightFoot = part(bootGeometry, materials.dark, -0.34, 0.12, 0.08);
  root.add(leftFoot, rightFoot);
  body.add(part(legGeometry, materials.trousers, 0.34, 0.55, 0), part(legGeometry, materials.trousers, -0.34, 0.55, 0));

  addBelly(body, materials);
  const cleaverPivot = addUpperBody(body, materials);
  const head = createHead(materials);
  body.add(head);

  const tintable = [materials.skin, materials.shirt, materials.apron, materials.hat];
  const setWarning = (level: number): void => {
    tintable.forEach((material) => material.emissive.setRGB(level, level * 0.08, level * 0.04));
  };

  return { root, body, head, cleaverPivot, leftFoot, rightFoot, setWarning };
}
