import * as THREE from 'three';

export const PUDDLE_RADIUS = 1.5;
export const PUDDLE_SECONDS = 3;
export const PUDDLE_BURN_INTERVAL_SECONDS = 0.6;
const FLAME_COUNT = 5;
const SHRINK_SECONDS = 0.5;
const KNIGHT_REACH = 0.35;

const discGeometry = new THREE.CircleGeometry(PUDDLE_RADIUS, 28);
const discMaterial = new THREE.MeshBasicMaterial({
  color: 0xff6a12,
  transparent: true,
  opacity: 0.78,
  depthWrite: false
});
const flameGeometry = new THREE.ConeGeometry(0.28, 0.9, 6);
const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xffc233, transparent: true, opacity: 0.85 });

export class FirePuddle {
  readonly mesh = new THREE.Group();
  readonly x: number;
  readonly z: number;
  private readonly flames: THREE.Mesh[] = [];
  private remaining = PUDDLE_SECONDS;
  private age = 0;
  private burnCooldown = 0;

  constructor(x: number, z: number) {
    this.x = x;
    this.z = z;
    this.mesh.position.set(x, 0.05, z);
    const disc = new THREE.Mesh(discGeometry, discMaterial);
    disc.rotation.x = -Math.PI / 2;
    this.mesh.add(disc);
    for (let index = 0; index < FLAME_COUNT; index++) {
      const angle = (index / FLAME_COUNT) * Math.PI * 2;
      const flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.position.set(Math.cos(angle) * PUDDLE_RADIUS * 0.55, 0.4, Math.sin(angle) * PUDDLE_RADIUS * 0.55);
      this.flames.push(flame);
      this.mesh.add(flame);
    }
  }

  get isAlive(): boolean {
    return this.remaining > 0;
  }

  update(deltaSeconds: number): void {
    this.age += deltaSeconds;
    this.remaining -= deltaSeconds;
    this.burnCooldown = Math.max(0, this.burnCooldown - deltaSeconds);
    this.flames.forEach((flame, index) => {
      flame.scale.y = 0.7 + 0.5 * Math.sin(this.age * 14 + index * 1.7);
    });
    this.mesh.scale.setScalar(Math.min(Math.max(this.remaining, 0) / SHRINK_SECONDS, 1));
  }

  tryBurn(knightX: number, knightZ: number): boolean {
    if (this.burnCooldown > 0 || this.remaining <= 0) return false;
    if (Math.hypot(knightX - this.x, knightZ - this.z) > PUDDLE_RADIUS + KNIGHT_REACH) return false;
    this.burnCooldown = PUDDLE_BURN_INTERVAL_SECONDS;
    return true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
  }
}
