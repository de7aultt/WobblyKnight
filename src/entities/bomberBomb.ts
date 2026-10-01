import * as THREE from 'three';

export const BLAST_RADIUS = 1.6;
const FLIGHT_SECONDS = 1.4;
const ARC_HEIGHT = 4.5;
const SPIN_RATE = 10;
const LANDING_HEIGHT = 0.3;
const SHADOW_HEIGHT = 0.06;

const bombGeometry = new THREE.CylinderGeometry(0.14, 0.2, 0.55, 8);
const bombMaterial = new THREE.MeshStandardMaterial({
  color: 0x3d6fd1,
  emissive: 0xff7a1a,
  emissiveIntensity: 0.5,
  roughness: 0.4
});
const shadowGeometry = new THREE.CircleGeometry(BLAST_RADIUS, 28);
const shadowMaterial = new THREE.MeshBasicMaterial({
  color: 0xff3a1a,
  transparent: true,
  opacity: 0.4,
  depthWrite: false
});

export class BomberBomb {
  readonly mesh = new THREE.Mesh(bombGeometry, bombMaterial);
  readonly shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
  private readonly startX: number;
  private readonly startY: number;
  private readonly startZ: number;
  private elapsed = 0;

  constructor(origin: THREE.Vector3, readonly targetX: number, readonly targetZ: number) {
    this.startX = origin.x;
    this.startY = origin.y;
    this.startZ = origin.z;
    this.mesh.position.copy(origin);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.set(targetX, SHADOW_HEIGHT, targetZ);
    this.shadow.scale.setScalar(0.2);
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
    this.shadow.scale.setScalar(0.2 + 0.8 * progress);
    return progress >= 1;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.shadow.removeFromParent();
  }
}
