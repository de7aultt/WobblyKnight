import * as THREE from 'three';

const VIEW_HEIGHT = 30;
const CAMERA_DISTANCE = 32;
const CAMERA_ELEVATION = 28;

function applyFrustum(camera: THREE.OrthographicCamera, aspect: number): void {
  const halfHeight = VIEW_HEIGHT / 2;
  camera.left = -halfHeight * aspect;
  camera.right = halfHeight * aspect;
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
  camera.updateProjectionMatrix();
}

export function createCamera(aspect: number): THREE.OrthographicCamera {
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  camera.position.set(CAMERA_DISTANCE, CAMERA_ELEVATION, CAMERA_DISTANCE);
  camera.lookAt(0, 0, 0);
  applyFrustum(camera, aspect);
  return camera;
}

export function resizeCamera(camera: THREE.OrthographicCamera, width: number, height: number): void {
  applyFrustum(camera, width / height);
}

const FOLLOW_INFLUENCE = 0.3;
const FOLLOW_SHARPNESS = 3;

export interface CameraFollow {
  update(target: THREE.Vector3, deltaSeconds: number): void;
}

export function createCameraFollow(camera: THREE.Camera): CameraFollow {
  const offset = new THREE.Vector3(CAMERA_DISTANCE, CAMERA_ELEVATION, CAMERA_DISTANCE);
  const focus = new THREE.Vector3();
  const desiredFocus = new THREE.Vector3();

  return {
    update(target: THREE.Vector3, deltaSeconds: number): void {
      desiredFocus.set(target.x * FOLLOW_INFLUENCE, 0, target.z * FOLLOW_INFLUENCE);
      focus.lerp(desiredFocus, 1 - Math.exp(-FOLLOW_SHARPNESS * deltaSeconds));
      camera.position.copy(focus).add(offset);
      camera.lookAt(focus);
    }
  };
}
