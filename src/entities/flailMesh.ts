import * as THREE from 'three';
import type { FlailChain } from '../physics/flailChain';

export interface FlailVisual {
  handle: THREE.Group;
  handleTip: THREE.Object3D;
  chainRoot: THREE.Group;
  sync(chain: FlailChain, deltaSeconds: number): void;
}

const BEADS_PER_SEGMENT = 3;
const HANDLE_LENGTH = 0.55;
const HANDLE_FORWARD_TILT = 1.0;
const BALL_CORE_RADIUS = 0.3;

const SPIKE_DIRECTIONS: readonly THREE.Vector3[] = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
  [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1]
].map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize());

const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x5a3720, roughness: 0.8 });
const ironMaterial = new THREE.MeshStandardMaterial({ color: 0x4c525a, metalness: 0.8, roughness: 0.4 });
const spikeMaterial = new THREE.MeshStandardMaterial({ color: 0xb8c0c8, metalness: 0.9, roughness: 0.25 });

function shadowed<MeshType extends THREE.Mesh>(mesh: MeshType): MeshType {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createHandle(): { handle: THREE.Group; handleTip: THREE.Object3D } {
  const handle = new THREE.Group();
  handle.rotation.x = HANDLE_FORWARD_TILT;
  const grip = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, HANDLE_LENGTH, 8), woodMaterial));
  grip.position.y = HANDLE_LENGTH / 2;
  const cap = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), ironMaterial));
  cap.position.y = HANDLE_LENGTH;
  const handleTip = new THREE.Object3D();
  handleTip.position.y = HANDLE_LENGTH + 0.05;
  handle.add(grip, cap, handleTip);
  return { handle, handleTip };
}

function createMorningStar(): THREE.Group {
  const ball = new THREE.Group();
  ball.add(shadowed(new THREE.Mesh(new THREE.IcosahedronGeometry(BALL_CORE_RADIUS, 0), ironMaterial)));
  const spikeGeometry = new THREE.ConeGeometry(0.07, 0.24, 5);
  const up = new THREE.Vector3(0, 1, 0);
  SPIKE_DIRECTIONS.forEach((direction) => {
    const spike = shadowed(new THREE.Mesh(spikeGeometry, spikeMaterial));
    spike.quaternion.setFromUnitVectors(up, direction);
    spike.position.copy(direction).multiplyScalar(BALL_CORE_RADIUS + 0.08);
    ball.add(spike);
  });
  return ball;
}

export function createFlailMesh(segmentCount: number): FlailVisual {
  const { handle, handleTip } = createHandle();
  const chainRoot = new THREE.Group();

  const beadGeometry = new THREE.SphereGeometry(0.05, 6, 4);
  const jointGeometry = new THREE.TorusGeometry(0.07, 0.025, 6, 10);
  const beads: THREE.Mesh[] = [];
  for (let index = 0; index < segmentCount * BEADS_PER_SEGMENT; index++) {
    beads.push(shadowed(new THREE.Mesh(beadGeometry, ironMaterial)));
  }
  const joints: THREE.Mesh[] = [];
  for (let index = 0; index < segmentCount - 1; index++) {
    joints.push(shadowed(new THREE.Mesh(jointGeometry, ironMaterial)));
  }
  const ball = createMorningStar();
  chainRoot.add(...beads, ...joints, ball);

  const spinAxis = new THREE.Vector3();
  const spinRotation = new THREE.Quaternion();
  const velocity = new THREE.Vector3();
  const worldUp = new THREE.Vector3(0, 1, 0);

  function sync(chain: FlailChain, deltaSeconds: number): void {
    const nodes = chain.nodes;
    for (let segment = 0; segment < nodes.length - 1; segment++) {
      const start = nodes[segment].position;
      const end = nodes[segment + 1].position;
      for (let bead = 0; bead < BEADS_PER_SEGMENT; bead++) {
        const t = (bead + 1) / (BEADS_PER_SEGMENT + 1);
        beads[segment * BEADS_PER_SEGMENT + bead].position.lerpVectors(start, end, t);
      }
    }
    joints.forEach((joint, index) => {
      const node = nodes[index + 1].position;
      joint.position.copy(node);
      joint.lookAt(nodes[index + 2].position);
    });

    ball.position.copy(chain.tip.position);
    chain.getTipVelocity(velocity);
    velocity.y = 0;
    const planarSpeed = velocity.length();
    if (planarSpeed < 1e-3) return;
    spinAxis.crossVectors(worldUp, velocity).normalize();
    spinRotation.setFromAxisAngle(spinAxis, (planarSpeed * deltaSeconds) / BALL_CORE_RADIUS);
    ball.quaternion.premultiply(spinRotation);
  }

  return { handle, handleTip, chainRoot, sync };
}
