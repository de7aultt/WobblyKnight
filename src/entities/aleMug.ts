import * as THREE from 'three';

const MAX_ACTIVE_MUGS = 120;
const BASE_HEIGHT = 0.4;
const BOB_AMPLITUDE = 0.1;
const BOB_RATE = 3;
const SPIN_RATE = 1.6;
const POP_SECONDS = 0.25;

const gold = new THREE.MeshStandardMaterial({ color: 0xe3a62b, metalness: 0.8, roughness: 0.3 });
const foam = new THREE.MeshStandardMaterial({ color: 0xfff6e0, roughness: 0.9 });
const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.17, 0.4, 10);
const foamGeometry = new THREE.CylinderGeometry(0.21, 0.21, 0.08, 10);
const bubbleGeometry = new THREE.SphereGeometry(0.07, 6, 4);
const handleGeometry = new THREE.TorusGeometry(0.1, 0.035, 6, 10);

function shadowed(mesh: THREE.Mesh, x: number, y: number, z: number): THREE.Mesh {
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createMugMesh(): THREE.Group {
  const mug = new THREE.Group();
  mug.add(
    shadowed(new THREE.Mesh(bodyGeometry, gold), 0, 0, 0),
    shadowed(new THREE.Mesh(foamGeometry, foam), 0, 0.23, 0),
    shadowed(new THREE.Mesh(bubbleGeometry, foam), 0.07, 0.3, 0.04),
    shadowed(new THREE.Mesh(bubbleGeometry, foam), -0.08, 0.29, -0.03),
    shadowed(new THREE.Mesh(handleGeometry, gold), 0.27, 0, 0)
  );
  return mug;
}

export class AleMug {
  active = true;
  readonly mesh = createMugMesh();
  private age = Math.random() * Math.PI * 2;
  private lifetime = 0;

  constructor(x: number, z: number) {
    this.mesh.position.set(x, BASE_HEIGHT, z);
    this.mesh.scale.setScalar(0.01);
  }

  get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  update(deltaSeconds: number): void {
    this.age += deltaSeconds;
    this.lifetime += deltaSeconds;
    const pop = Math.min(this.lifetime / POP_SECONDS, 1);
    this.mesh.scale.setScalar(1 + Math.sin(pop * Math.PI) * 0.35 * pop);
    this.mesh.scale.multiplyScalar(pop);
    this.mesh.position.y = BASE_HEIGHT + Math.sin(this.age * BOB_RATE) * BOB_AMPLITUDE;
    this.mesh.rotation.y += SPIN_RATE * deltaSeconds;
  }

  dispose(): void {
    this.active = false;
    this.mesh.removeFromParent();
  }
}

export class AleMugField {
  readonly mugs: AleMug[] = [];

  constructor(private readonly scene: THREE.Scene) {}

  spawn(x: number, z: number): AleMug {
    if (this.mugs.length >= MAX_ACTIVE_MUGS) this.mugs.shift()?.dispose();
    const mug = new AleMug(x, z);
    this.scene.add(mug.mesh);
    this.mugs.push(mug);
    return mug;
  }

  collect(mug: AleMug): void {
    mug.dispose();
  }

  update(deltaSeconds: number): void {
    for (let index = this.mugs.length - 1; index >= 0; index--) {
      const mug = this.mugs[index];
      if (!mug.active) {
        this.mugs.splice(index, 1);
        continue;
      }
      mug.update(deltaSeconds);
    }
  }
}
