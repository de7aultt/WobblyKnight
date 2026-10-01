import * as THREE from 'three';
import { WHIRL_REACH } from './executionerConfig';
import { WEAPON_REST_ANGLE, type BossRig } from './bossRig';
import { addEyes, addLegs, createDangerDisc, part, standard, type MaterialSet } from './bossParts';

export const EXECUTIONER_SCALE = 2;

function createHood(materials: MaterialSet): THREE.Group {
  const head = new THREE.Group();
  head.position.y = 2.2;
  const hood = part(new THREE.SphereGeometry(0.4, 14, 10), materials.hood, 0, 0, 0);
  hood.scale.set(1, 1.05, 1);
  const peak = part(new THREE.ConeGeometry(0.3, 0.5, 10), materials.hood, 0, 0.45, -0.04);
  const mask = part(new THREE.BoxGeometry(0.46, 0.12, 0.06), materials.mask, 0, 0.03, 0.36);
  head.add(hood, peak, mask);
  addEyes(head, materials.ember, 0.12, 0.03, 0.4);
  return head;
}

function createAxe(materials: MaterialSet): THREE.Group {
  const pivot = new THREE.Group();
  pivot.position.set(0, 1.15, 0.3);
  pivot.rotation.x = WEAPON_REST_ANGLE;
  pivot.add(part(new THREE.CylinderGeometry(0.07, 0.08, 2.3, 8), materials.wood, 0, 0.65, 0));
  const bladeGeometry = new THREE.BoxGeometry(0.1, 0.85, 0.7);
  const edgeGeometry = new THREE.BoxGeometry(0.05, 0.85, 0.08);
  [-1, 1].forEach((side) => {
    pivot.add(
      part(bladeGeometry, materials.iron, 0, 1.4, side * 0.45),
      part(edgeGeometry, materials.edge, 0, 1.4, side * 0.82)
    );
  });
  pivot.add(part(new THREE.SphereGeometry(0.1, 8, 6), materials.iron, 0, 1.82, 0));
  return pivot;
}

function addTorso(body: THREE.Group, materials: MaterialSet): void {
  const chest = part(new THREE.SphereGeometry(0.62, 16, 12), materials.skin, 0, 1.55, 0);
  chest.scale.set(1.35, 0.95, 0.85);
  const belly = part(new THREE.SphereGeometry(0.55, 14, 10), materials.skin, 0, 1.05, 0.02);
  const belt = part(new THREE.CylinderGeometry(0.58, 0.58, 0.16, 14), materials.leather, 0, 0.82, 0);
  const strap = part(new THREE.BoxGeometry(0.16, 1.2, 0.08), materials.leather, 0.1, 1.35, 0.5);
  strap.rotation.z = 0.5;
  body.add(chest, belly, belt, strap);

  const armGeometry = new THREE.CylinderGeometry(0.25, 0.2, 0.8, 8);
  const handGeometry = new THREE.SphereGeometry(0.2, 8, 6);
  [-1, 1].forEach((side) => {
    const arm = part(armGeometry, materials.skin, side * 0.88, 1.42, 0.12);
    arm.rotation.z = side * 0.2;
    arm.rotation.x = -0.5;
    body.add(arm, part(handGeometry, materials.hood, side * 0.5, 1.12, 0.38));
  });
}

export function createExecutionerMesh(): BossRig {
  const materials: MaterialSet = {
    skin: standard(0x6a4d44),
    hood: standard(0x121214, 0.9),
    mask: standard(0x050506),
    ember: standard(0xff3b22, 0.3),
    leather: standard(0x2d1b12),
    wood: standard(0x4b2f1c),
    iron: standard(0x707884, 0.4, 0.85),
    edge: standard(0xdfe6ee, 0.2, 0.9),
    trousers: standard(0x1d1d24),
    boots: standard(0x0e0e10)
  };
  materials.ember.emissive.setRGB(0.9, 0.12, 0.05);

  const root = new THREE.Group();
  root.scale.setScalar(EXECUTIONER_SCALE);
  const body = new THREE.Group();
  root.add(body);
  const { leftFoot, rightFoot } = addLegs(root, body, materials.trousers, materials.boots, 0.36);
  addTorso(body, materials);
  const weaponPivot = createAxe(materials);
  const weaponOrbit = new THREE.Group();
  weaponOrbit.add(weaponPivot);
  body.add(weaponOrbit);
  const head = createHood(materials);
  body.add(head);

  const danger = createDangerDisc(WHIRL_REACH / EXECUTIONER_SCALE);
  root.add(...danger.meshes);

  const tintable = [materials.skin, materials.iron];
  const setWarning = (level: number): void => {
    tintable.forEach((material) => material.emissive.setRGB(level, level * 0.1, level * 0.05));
  };

  return {
    root,
    body,
    head,
    weaponOrbit,
    weaponPivot,
    leftFoot,
    rightFoot,
    baseScale: EXECUTIONER_SCALE,
    setWarning,
    setDanger: danger.setProgress
  };
}
