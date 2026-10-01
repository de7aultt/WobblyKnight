import * as THREE from 'three';

const DASH_SECONDS = 0.28;
const DASH_COOLDOWN_SECONDS = 3;
const DASH_JUMP_HEIGHT = 1;
const DASH_SPIN_ROTATIONS = 2;

export const DASH_SPEED = 20;
export const DASH_SPIN_RATE = (Math.PI * 2 * DASH_SPIN_ROTATIONS) / DASH_SECONDS;

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

  get height(): number {
    return this.isActive ? Math.sin(this.progress * Math.PI) * DASH_JUMP_HEIGHT : 0;
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
