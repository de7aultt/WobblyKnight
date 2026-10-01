import * as THREE from 'three';

export const DASH_SPEED = 20;
const DASH_SECONDS = 0.28;
const DASH_COOLDOWN_SECONDS = 3;

export class DashController {
  readonly direction = new THREE.Vector3();
  private remaining = 0;
  private cooldown = 0;

  get isActive(): boolean {
    return this.remaining > 0;
  }

  get progress(): number {
    return this.isActive ? 1 - this.remaining / DASH_SECONDS : 0;
  }

  tick(deltaSeconds: number): void {
    this.cooldown = Math.max(0, this.cooldown - deltaSeconds);
    this.remaining = Math.max(0, this.remaining - deltaSeconds);
  }

  tryStart(wantedDirection: THREE.Vector3): boolean {
    if (this.cooldown > 0 || this.remaining > 0 || wantedDirection.lengthSq() === 0) return false;
    this.direction.copy(wantedDirection).normalize();
    this.remaining = DASH_SECONDS;
    this.cooldown = DASH_COOLDOWN_SECONDS;
    return true;
  }
}
