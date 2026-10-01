import * as THREE from 'three';
import { clampToArena } from '../physics/arenaBounds';

const LAUNCH_START_HEIGHT = 1.5;
const LAUNCH_GRAVITY = 24;
const MUG_RADIUS = 0.3;
const BURST_MIN_SPEED = 3;
const BURST_SPEED_RANGE = 5;
const BURST_MIN_LIFT = 9;
const BURST_LIFT_RANGE = 5;

export const BASE_MAGNET_RADIUS = 3.2;
export const COLLECT_RADIUS = 1.2;

const MAX_ACTIVE_MUGS = 120;
const BASE_HEIGHT = 0.4;
const BOB_AMPLITUDE = 0.1;
const BOB_RATE = 3;
const SPIN_RATE = 1.6;
const POP_SECONDS = 0.25;
const BASE_PULL_SPEED = 6;
const PULL_SPEED_RANGE = 12;
const PULL_SMOOTHING = 8;

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
  private pullSpeed = 0;
  private airVelocity: THREE.Vector3 | null = null;

  constructor(x: number, z: number) {
    this.mesh.position.set(x, BASE_HEIGHT, z);
    this.mesh.scale.setScalar(0.01);
  }

  get isAirborne(): boolean {
    return this.airVelocity !== null;
  }

  launch(velocityX: number, velocityY: number, velocityZ: number): void {
    this.airVelocity = new THREE.Vector3(velocityX, velocityY, velocityZ);
    this.mesh.position.y = LAUNCH_START_HEIGHT;
  }

  get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  pullToward(deltaX: number, deltaZ: number, distance: number, radius: number, pullMultiplier: number, deltaSeconds: number): void {
    const closeness = 1 - Math.min(distance / radius, 1);
    const desiredSpeed = (BASE_PULL_SPEED + closeness * PULL_SPEED_RANGE) * pullMultiplier;
    this.pullSpeed += (desiredSpeed - this.pullSpeed) * (1 - Math.exp(-PULL_SMOOTHING * deltaSeconds));
    const step = Math.min(this.pullSpeed * deltaSeconds, distance);
    this.mesh.position.x += (deltaX / distance) * step;
    this.mesh.position.z += (deltaZ / distance) * step;
  }

  releasePull(): void {
    this.pullSpeed = 0;
  }

  update(deltaSeconds: number): void {
    this.age += deltaSeconds;
    this.lifetime += deltaSeconds;
    const pop = Math.min(this.lifetime / POP_SECONDS, 1);
    this.mesh.scale.setScalar((1 + Math.sin(pop * Math.PI) * 0.35 * pop) * pop);
    this.mesh.rotation.y += SPIN_RATE * deltaSeconds;
    if (this.airVelocity) {
      this.flyThroughAir(this.airVelocity, deltaSeconds);
      return;
    }
    this.mesh.position.y = BASE_HEIGHT + Math.sin(this.age * BOB_RATE) * BOB_AMPLITUDE;
  }

  private flyThroughAir(velocity: THREE.Vector3, deltaSeconds: number): void {
    velocity.y -= LAUNCH_GRAVITY * deltaSeconds;
    this.mesh.position.addScaledVector(velocity, deltaSeconds);
    clampToArena(this.mesh.position, MUG_RADIUS);
    if (this.mesh.position.y > BASE_HEIGHT || velocity.y > 0) return;
    this.mesh.position.y = BASE_HEIGHT;
    this.airVelocity = null;
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

  spawnBurst(x: number, z: number, count: number): void {
    for (let index = 0; index < count; index++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = BURST_MIN_SPEED + Math.random() * BURST_SPEED_RANGE;
      const mug = this.spawn(x, z);
      mug.launch(Math.cos(angle) * speed, BURST_MIN_LIFT + Math.random() * BURST_LIFT_RANGE, Math.sin(angle) * speed);
    }
  }

  update(deltaSeconds: number, knightPosition: THREE.Vector3, magnetMultiplier: number, onCollect: () => void): void {
    const radius = BASE_MAGNET_RADIUS * magnetMultiplier;
    for (let index = this.mugs.length - 1; index >= 0; index--) {
      const mug = this.mugs[index];
      const deltaX = knightPosition.x - mug.position.x;
      const deltaZ = knightPosition.z - mug.position.z;
      const distance = Math.hypot(deltaX, deltaZ);

      if (mug.isAirborne) {
        mug.update(deltaSeconds);
        continue;
      }
      if (distance <= COLLECT_RADIUS) {
        mug.dispose();
        this.mugs.splice(index, 1);
        onCollect();
        continue;
      }
      if (distance <= radius) mug.pullToward(deltaX, deltaZ, distance, radius, magnetMultiplier, deltaSeconds);
      else mug.releasePull();
      mug.update(deltaSeconds);
    }
  }
}
