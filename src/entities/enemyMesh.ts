import * as THREE from 'three';
import { addEnemyDetails } from './enemyDetails';
import { cachedGeometry, part } from './enemyParts';
import type { EnemyType } from './enemyTypes';

export interface EnemyRig {
  root: THREE.Group;
  body: THREE.Group;
  leftFoot: THREE.Mesh;
  rightFoot: THREE.Mesh;
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

  addEnemyDetails(body, type);
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
