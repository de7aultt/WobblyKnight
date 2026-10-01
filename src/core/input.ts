import * as THREE from 'three';

const AIM_IDLE_TIMEOUT_MS = 1500;

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
  private readonly pointerNdc = new THREE.Vector2();
  private readonly raycaster = new THREE.Raycaster();
  private readonly groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly cameraForward = new THREE.Vector3();
  private hasPointer = false;
  private lastPointerActivity = Number.NEGATIVE_INFINITY;
  private enabled = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: THREE.Camera
  ) {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerdown', this.handlePointerMove);
    document.addEventListener('pointerleave', this.handlePointerLeave);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.pressedKeys.clear();
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

  getAimTarget(out: THREE.Vector3): THREE.Vector3 | null {
    if (!this.enabled || !this.hasPointer) return null;
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    return this.raycaster.ray.intersectPlane(this.groundPlane, out);
  }

  isAimIdle(): boolean {
    return performance.now() - this.lastPointerActivity > AIM_IDLE_TIMEOUT_MS;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerdown', this.handlePointerMove);
    document.removeEventListener('pointerleave', this.handlePointerLeave);
    this.pressedKeys.clear();
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
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

  private handlePointerMove = (event: PointerEvent): void => {
    const bounds = this.canvas.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return;
    this.pointerNdc.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1
    );
    this.hasPointer = true;
    this.lastPointerActivity = performance.now();
  };

  private handlePointerLeave = (): void => {
    this.hasPointer = false;
  };
}
