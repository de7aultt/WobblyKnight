import * as THREE from 'three';

export interface KnightRig {
  root: THREE.Group;
  torsoPivot: THREE.Group;
  head: THREE.Group;
  leftFoot: THREE.Mesh;
  rightFoot: THREE.Mesh;
  handSocket: THREE.Object3D;
  leftHandSocket: THREE.Object3D;
}

export const KNIGHT_SCALE = 1.6;
export const TORSO_PIVOT_HEIGHT = 0.3;
export const FOOT_SIDE_OFFSET = 0.18;
export const FOOT_BASE_HEIGHT = 0.1;

const palette = {
  iron: 0xa3acb6,
  darkIron: 0x5a616b,
  visor: 0x0b0b10,
  gold: 0xe3b23c,
  tunic: 0xb3202a,
  leather: 0x3b2a1d
};

function material(color: number, metalness = 0.1, roughness = 0.7): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

const materials = {
  iron: material(palette.iron, 0.75, 0.35),
  darkIron: material(palette.darkIron, 0.6, 0.5),
  visor: material(palette.visor, 0.2, 0.9),
  gold: material(palette.gold, 0.8, 0.3),
  tunic: material(palette.tunic, 0, 0.85),
  leather: material(palette.leather, 0, 0.9)
};

export function setKnightFlash(level: number): void {
  Object.values(materials).forEach((material) => material.emissive.setRGB(level * 0.85, level * 0.05, level * 0.05));
}

function part(geometry: THREE.BufferGeometry, partMaterial: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, partMaterial);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createBoot(side: number): THREE.Mesh {
  return part(new THREE.BoxGeometry(0.26, 0.2, 0.4), materials.leather, side * FOOT_SIDE_OFFSET, FOOT_BASE_HEIGHT, 0.05);
}

function createTorso(torsoPivot: THREE.Group): void {
  torsoPivot.add(
    part(new THREE.CylinderGeometry(0.36, 0.42, 0.62, 10), materials.iron, 0, 0.31, 0),
    part(new THREE.CylinderGeometry(0.44, 0.48, 0.38, 10), materials.tunic, 0, 0.18, 0),
    part(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 10), materials.gold, 0, 0.4, 0)
  );

  [-1, 1].forEach((side) => {
    const pauldron = part(new THREE.SphereGeometry(0.21, 10, 8), materials.darkIron, side * 0.42, 0.58, 0);
    pauldron.scale.set(1, 0.7, 1);
    const arm = part(new THREE.CylinderGeometry(0.09, 0.08, 0.4, 8), materials.iron, side * 0.47, 0.36, 0.04);
    const fist = part(new THREE.SphereGeometry(0.1, 8, 6), materials.darkIron, side * 0.47, 0.16, 0.1);
    torsoPivot.add(pauldron, arm, fist);
  });
}

function createHead(): THREE.Group {
  const head = new THREE.Group();
  head.position.y = 0.66;
  head.add(
    part(new THREE.CylinderGeometry(0.3, 0.32, 0.46, 12), materials.iron, 0, 0.23, 0),
    part(new THREE.CylinderGeometry(0.31, 0.3, 0.05, 12), materials.darkIron, 0, 0.47, 0),
    part(new THREE.BoxGeometry(0.42, 0.06, 0.06), materials.visor, 0, 0.28, 0.3),
    part(new THREE.BoxGeometry(0.06, 0.18, 0.06), materials.visor, 0, 0.17, 0.3),
    part(new THREE.BoxGeometry(0.07, 0.2, 0.5), materials.gold, 0, 0.58, -0.02),
    part(new THREE.SphereGeometry(0.06, 8, 6), materials.gold, 0, 0.7, 0.18)
  );
  return head;
}

export function createKnightMesh(): KnightRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.scale.setScalar(KNIGHT_SCALE);
  root.add(body);

  const leftFoot = createBoot(1);
  const rightFoot = createBoot(-1);
  body.add(leftFoot, rightFoot);

  const torsoPivot = new THREE.Group();
  torsoPivot.position.y = TORSO_PIVOT_HEIGHT;
  body.add(torsoPivot);
  createTorso(torsoPivot);

  const head = createHead();
  torsoPivot.add(head);

  const handSocket = new THREE.Object3D();
  handSocket.position.set(-0.47, 0.16, 0.14);
  torsoPivot.add(handSocket);

  const leftHandSocket = new THREE.Object3D();
  leftHandSocket.position.set(0.47, 0.16, 0.14);
  torsoPivot.add(leftHandSocket);

  return { root, torsoPivot, head, leftFoot, rightFoot, handSocket, leftHandSocket };
}
