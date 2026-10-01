import * as THREE from 'three';
import type { GraphicsQuality } from '../core/settings';
import type { TavernLights } from './lights';
import { resizeRenderer, setMaxPixelRatio } from './renderer';

const HIGH_PIXEL_RATIO = 2;
const LOW_PIXEL_RATIO = 1;

export interface GraphicsTargets {
  renderer: THREE.WebGLRenderer;
  lights: TavernLights;
  scene: THREE.Scene;
}

function refreshMaterials(scene: THREE.Scene): void {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials: THREE.Material[] = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      material.needsUpdate = true;
    });
  });
}

export function applyGraphicsQuality(targets: GraphicsTargets, quality: GraphicsQuality): void {
  const high = quality === 'high';
  const { renderer, lights, scene } = targets;
  setMaxPixelRatio(high ? HIGH_PIXEL_RATIO : LOW_PIXEL_RATIO);
  renderer.shadowMap.enabled = high;
  lights.setShadowsEnabled(high);
  refreshMaterials(scene);
  resizeRenderer(renderer, window.innerWidth, window.innerHeight);
}
