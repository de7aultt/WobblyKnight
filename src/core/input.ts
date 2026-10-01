import * as THREE from 'three';

const MOVE_KEY_BINDINGS: Readonly<Record<string, readonly [number, number]>> = {
  KeyW: [0, 1],
  ArrowUp: [0, 1],
  KeyS: [0, -1],
  ArrowDown: [0, -1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0]
};

export class Input {
  private readonly pressedKeys = new Set<string>();
  private readonly cameraForward = new THREE.Vector3();
  private enabled = false;
  private dashRequested = false;

  constructor(private readonly camera: THREE.Camera) {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.pressedKeys.clear();
      this.dashRequested = false;
    }
  }

  consumeDashRequest(): boolean {
    const requested = this.dashRequested;
    this.dashRequested = false;
    return requested;
  }

  getMoveDirection(out: THREE.Vector3): THREE.Vector3 {
    out.set(0, 0, 0);
    if (!this.enabled) return out;

    let screenX = 0;
    let screenY = 0;
    this.pressedKeys.forEach((code) => {
      const binding = MOVE_KEY_BINDINGS[code];
      if (!binding) return;
      screenX += binding[0];
      screenY += binding[1];
    });
    if (screenX === 0 && screenY === 0) return out;

    this.camera.getWorldDirection(this.cameraForward);
    this.cameraForward.y = 0;
    this.cameraForward.normalize();
    const forwardX = this.cameraForward.x;
    const forwardZ = this.cameraForward.z;

    out.set(forwardX * screenY - forwardZ * screenX, 0, forwardZ * screenY + forwardX * screenX);
    return out.normalize();
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.pressedKeys.clear();
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'Space') {
      if (!this.enabled) return;
      event.preventDefault();
      if (!event.repeat) this.dashRequested = true;
      return;
    }
    if (!(event.code in MOVE_KEY_BINDINGS)) return;
    if (this.enabled) event.preventDefault();
    this.pressedKeys.add(event.code);
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code);
  };

  private handleBlur = (): void => {
    this.pressedKeys.clear();
  };
}
