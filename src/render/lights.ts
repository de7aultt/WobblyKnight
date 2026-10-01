import * as THREE from 'three';
import { ARENA_HALF, TORCH_POSITIONS } from './arenaLayout';

const TORCH_BASE_INTENSITY = 90;
const TORCH_FLICKER_AMPLITUDE = 14;
const TORCH_JITTER = 0.08;
const TORCH_COLOR = 0xff8a3d;

export interface TavernLights {
  update(elapsed: number): void;
  setShadowsEnabled(enabled: boolean): void;
}

function createKeyLight(): THREE.DirectionalLight {
  const keyLight = new THREE.DirectionalLight(0xffd9a8, 1.6);
  keyLight.position.set(14, 26, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.bias = -0.0005;
  const bounds = ARENA_HALF + 6;
  keyLight.shadow.camera.left = -bounds;
  keyLight.shadow.camera.right = bounds;
  keyLight.shadow.camera.top = bounds;
  keyLight.shadow.camera.bottom = -bounds;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 70;
  return keyLight;
}

function createTorchLights(): THREE.PointLight[] {
  return TORCH_POSITIONS.map((position) => {
    const torch = new THREE.PointLight(TORCH_COLOR, TORCH_BASE_INTENSITY, 26, 1.6);
    torch.position.copy(position);
    return torch;
  });
}

export function createLights(scene: THREE.Scene): TavernLights {
  scene.add(new THREE.AmbientLight(0x5a4a66, 0.9));
  const keyLight = createKeyLight();
  scene.add(keyLight);

  const torches = createTorchLights();
  torches.forEach((torch) => scene.add(torch));

  return {
    setShadowsEnabled(enabled: boolean): void {
      keyLight.castShadow = enabled;
    },
    update(elapsed: number): void {
      torches.forEach((torch, index) => {
        const phase = elapsed * (7 + index * 1.3) + index * 2.1;
        const wave = Math.sin(phase) * 0.6 + Math.sin(phase * 2.7 + index) * 0.4;
        torch.intensity = TORCH_BASE_INTENSITY + wave * TORCH_FLICKER_AMPLITUDE;
        const origin = TORCH_POSITIONS[index];
        torch.position.set(
          origin.x + Math.sin(phase * 1.9) * TORCH_JITTER,
          origin.y + Math.cos(phase * 2.3) * TORCH_JITTER,
          origin.z + Math.sin(phase * 1.4 + 1) * TORCH_JITTER
        );
      });
    }
  };
}
