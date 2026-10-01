import * as THREE from 'three';
import type { ImpactSparks } from '../render/impactSparks';
import type { Enemy } from './enemy';

const DROP_SPACING = 0.9;
const LIFETIME_SECONDS = 2.5;
const MAX_CALTROPS = 36;
const HIT_RADIUS = 0.6;
const HIT_DAMAGE = 1;
const GROUND_HEIGHT_LIMIT = 0.3;
const BLINK_SECONDS = 0.6;
const LETHAL_LIFT = 6;

const spikeGeometry = new THREE.ConeGeometry(0.09, 0.3, 5);
const spikeMaterial = new THREE.MeshStandardMaterial({
  color: 0xffb347,
  emissive: 0xff7a1a,
  emissiveIntensity: 1.2,
  roughness: 0.4
});
const SPIKE_OFFSETS: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 0.12],
  [0.11, 0, -0.07],
  [-0.11, 0, -0.07]
];

class Caltrop {
  readonly mesh = new THREE.Group();
  remaining = LIFETIME_SECONDS;

  constructor(x: number, z: number) {
    this.mesh.position.set(x, 0.12, z);
    SPIKE_OFFSETS.forEach(([offsetX, offsetY, offsetZ]) => {
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      spike.position.set(offsetX, offsetY, offsetZ);
      spike.rotation.set((Math.random() - 0.5) * 0.8, 0, (Math.random() - 0.5) * 0.8);
      this.mesh.add(spike);
    });
  }
}

export class SpikeTrail {
  private readonly caltrops: Caltrop[] = [];
  private readonly impulse = new THREE.Vector3();
  private readonly hitPoint = new THREE.Vector3();
  private lastX = 0;
  private lastZ = 0;
  private travelled = 0;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly sparks: ImpactSparks
  ) {}

  update(
    deltaSeconds: number,
    knightPosition: THREE.Vector3,
    enemies: readonly Enemy[],
    dropping: boolean
  ): void {
    this.travelled += Math.hypot(knightPosition.x - this.lastX, knightPosition.z - this.lastZ);
    this.lastX = knightPosition.x;
    this.lastZ = knightPosition.z;
    if (dropping && knightPosition.y < GROUND_HEIGHT_LIMIT && this.travelled >= DROP_SPACING) this.drop(knightPosition);
    if (!dropping || this.travelled >= DROP_SPACING) this.travelled = 0;

    for (let index = this.caltrops.length - 1; index >= 0; index--) {
      const caltrop = this.caltrops[index];
      caltrop.remaining -= deltaSeconds;
      caltrop.mesh.visible = caltrop.remaining > BLINK_SECONDS || Math.sin(caltrop.remaining * 40) > 0;
      if (caltrop.remaining <= 0 || this.hitEnemy(caltrop, enemies)) this.remove(index);
    }
  }

  clear(): void {
    this.caltrops.forEach((caltrop) => caltrop.mesh.removeFromParent());
    this.caltrops.length = 0;
    this.travelled = 0;
  }

  private drop(knightPosition: THREE.Vector3): void {
    if (this.caltrops.length >= MAX_CALTROPS) this.remove(0);
    const caltrop = new Caltrop(knightPosition.x, knightPosition.z);
    this.scene.add(caltrop.mesh);
    this.caltrops.push(caltrop);
  }

  private remove(index: number): void {
    this.caltrops[index].mesh.removeFromParent();
    this.caltrops.splice(index, 1);
  }

  private hitEnemy(caltrop: Caltrop, enemies: readonly Enemy[]): boolean {
    for (const enemy of enemies) {
      if (!enemy.isHittable || enemy.position.y > GROUND_HEIGHT_LIMIT) continue;
      const reach = HIT_RADIUS + enemy.type.radius * 0.5;
      const distance = Math.hypot(enemy.position.x - caltrop.mesh.position.x, enemy.position.z - caltrop.mesh.position.z);
      if (distance > reach) continue;
      this.impulse.set(0, HIT_DAMAGE >= enemy.health ? LETHAL_LIFT : 0, 0);
      this.hitPoint.copy(caltrop.mesh.position);
      this.sparks.burst(this.hitPoint, 0.7);
      enemy.receiveHit(HIT_DAMAGE, this.impulse);
      return true;
    }
    return false;
  }
}
