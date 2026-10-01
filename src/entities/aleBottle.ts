import * as THREE from 'three';
import { PUDDLE_RADIUS } from './firePuddle';

const FLIGHT_SECONDS = 0.9;
const ARC_HEIGHT = 5;
const SPIN_RATE = 12;
const LANDING_HEIGHT = 0.3;
const INDICATOR_HEIGHT = 0.06;

const bottleGeometry = new THREE.CylinderGeometry(0.16, 0.22, 0.6, 8);
const bottleMaterial = new THREE.MeshStandardMaterial({ color: 0x3f8f3a, roughness: 0.3, metalness: 0.2 });
const indicatorGeometry = new THREE.RingGeometry(PUDDLE_RADIUS * 0.82, PUDDLE_RADIUS, 32);
const indicatorMaterial = new THREE.MeshBasicMaterial({
  color: 0xffa322,
  transparent: true,
  opacity: 0.85,
  depthWrite: false,
  side: THREE.DoubleSide
});

export class AleBottle {
  readonly mesh = new THREE.Mesh(bottleGeometry, bottleMaterial);
  readonly indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
  private readonly startX: number;
  private readonly startY: number;
  private readonly startZ: number;
  private elapsed = 0;

  constructor(origin: THREE.Vector3, readonly targetX: number, readonly targetZ: number) {
    this.startX = origin.x;
    this.startY = origin.y;
    this.startZ = origin.z;
    this.mesh.castShadow = true;
    this.mesh.position.copy(origin);
    this.indicator.rotation.x = -Math.PI / 2;
    this.indicator.position.set(targetX, INDICATOR_HEIGHT, targetZ);
  }

  update(deltaSeconds: number): boolean {
    this.elapsed += deltaSeconds;
    const progress = Math.min(this.elapsed / FLIGHT_SECONDS, 1);
    this.mesh.position.set(
      this.startX + (this.targetX - this.startX) * progress,
      this.startY + (LANDING_HEIGHT - this.startY) * progress + ARC_HEIGHT * 4 * progress * (1 - progress),
      this.startZ + (this.targetZ - this.startZ) * progress
    );
    this.mesh.rotation.x += SPIN_RATE * deltaSeconds;
    this.indicator.scale.setScalar(0.35 + 0.65 * progress);
    return progress >= 1;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.indicator.removeFromParent();
  }
}
