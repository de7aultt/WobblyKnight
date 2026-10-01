import * as THREE from 'three';
import { WEAPON_REST_ANGLE, type BossRig } from './bossRig';
import { addEyes, addLegs, part, standard, type MaterialSet } from './bossParts';

export const KING_SCALE = 1.5;

const CROWN_SPIKES = 5;

function createCrown(materials: MaterialSet): THREE.Group {
  const crown = new THREE.Group();
  crown.position.y = 0.36;
  crown.add(part(new THREE.CylinderGeometry(0.3, 0.32, 0.18, 14), materials.gold, 0, 0, 0));
  const spikeGeometry = new THREE.ConeGeometry(0.07, 0.24, 6);
  const jewelGeometry = new THREE.SphereGeometry(0.05, 6, 4);
  for (let index = 0; index < CROWN_SPIKES; index++) {
    const angle = (index / CROWN_SPIKES) * Math.PI * 2;
    const x = Math.cos(angle) * 0.27;
    const z = Math.sin(angle) * 0.27;
    crown.add(part(spikeGeometry, materials.gold, x, 0.2, z), part(jewelGeometry, materials.ruby, x, 0.36, z));
  }
  return crown;
}

function createHead(materials: MaterialSet): THREE.Group {
  const head = new THREE.Group();
  head.position.y = 2.05;
  const skull = part(new THREE.SphereGeometry(0.36, 14, 10), materials.skin, 0, 0, 0);
  skull.scale.set(1.1, 0.95, 1);
  const nose = part(new THREE.ConeGeometry(0.09, 0.28, 6), materials.skin, 0, -0.04, 0.4);
  nose.rotation.x = Math.PI / 2;
  const earGeometry = new THREE.ConeGeometry(0.1, 0.55, 6);
  const grin = part(new THREE.BoxGeometry(0.34, 0.06, 0.06), materials.dark, 0, -0.17, 0.33);
  head.add(skull, nose, grin, createCrown(materials));
  [-1, 1].forEach((side) => {
    const ear = part(earGeometry, materials.skin, side * 0.5, 0.05, 0);
    ear.rotation.z = -side * 1.35;
    head.add(ear);
  });
  addEyes(head, materials.eye, 0.15, 0.07, 0.33);
  return head;
}

function createScepter(materials: MaterialSet): THREE.Group {
  const pivot = new THREE.Group();
  pivot.position.set(-0.78, 1.1, 0.22);
  pivot.rotation.x = WEAPON_REST_ANGLE;
  pivot.add(
    part(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8), materials.gold, 0, 0.35, 0),
    part(new THREE.SphereGeometry(0.17, 12, 10), materials.ruby, 0, 0.98, 0),
    part(new THREE.TorusGeometry(0.17, 0.035, 6, 14), materials.gold, 0, 0.98, 0)
  );
  return pivot;
}

function addTorso(body: THREE.Group, materials: MaterialSet): void {
  const robe = part(new THREE.CylinderGeometry(0.5, 0.88, 1.35, 14), materials.robe, 0, 0.98, 0);
  const trim = part(new THREE.TorusGeometry(0.86, 0.06, 6, 20), materials.gold, 0, 0.36, 0);
  trim.rotation.x = Math.PI / 2;
  const belt = part(new THREE.CylinderGeometry(0.62, 0.64, 0.14, 14), materials.gold, 0, 0.92, 0);
  const mantle = part(new THREE.SphereGeometry(0.6, 14, 10), materials.robe, 0, 1.62, 0);
  mantle.scale.set(1.25, 0.5, 0.9);
  const collar = part(new THREE.TorusGeometry(0.5, 0.07, 6, 16), materials.fur, 0, 1.72, 0);
  collar.rotation.x = Math.PI / 2;
  body.add(robe, trim, belt, mantle, collar);

  const armGeometry = new THREE.CylinderGeometry(0.17, 0.2, 0.7, 8);
  const handGeometry = new THREE.SphereGeometry(0.16, 8, 6);
  [-1, 1].forEach((side) => {
    const arm = part(armGeometry, materials.robe, side * 0.72, 1.4, 0.08);
    arm.rotation.z = side * 0.3;
    body.add(arm, part(handGeometry, materials.skin, side * 0.82, 1.05, 0.2));
  });
}

export function createKingMesh(): BossRig {
  const materials: MaterialSet = {
    skin: standard(0x6fbf4a),
    robe: standard(0x1f6b3a, 0.7),
    gold: standard(0xf2c230, 0.3, 0.85),
    ruby: standard(0xc4162a, 0.25, 0.3),
    fur: standard(0xf1ead8, 0.95),
    dark: standard(0x1d140e),
    eye: standard(0xffe14a, 0.4),
    boots: standard(0x3a2414)
  };

  const root = new THREE.Group();
  root.scale.setScalar(KING_SCALE);
  const body = new THREE.Group();
  root.add(body);
  const { leftFoot, rightFoot } = addLegs(root, body, materials.robe, materials.boots, 0.28);
  addTorso(body, materials);
  const weaponPivot = createScepter(materials);
  const weaponOrbit = new THREE.Group();
  weaponOrbit.add(weaponPivot);
  body.add(weaponOrbit);
  const head = createHead(materials);
  body.add(head);

  const tintable = [materials.skin, materials.robe, materials.fur];
  const setWarning = (level: number): void => {
    tintable.forEach((material) => material.emissive.setRGB(level * 0.9, level * 0.55, level * 0.05));
  };

  return {
    root,
    body,
    head,
    weaponOrbit,
    weaponPivot,
    leftFoot,
    rightFoot,
    baseScale: KING_SCALE,
    setWarning,
    setDanger: () => {}
  };
}
