import * as THREE from 'three';

let maxPixelRatio = 2;

export function setMaxPixelRatio(ratio: number): void {
  maxPixelRatio = ratio;
}

export function createRenderer(canvas: HTMLCanvasElement, antialias: boolean): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x110d18);
  resizeRenderer(renderer, window.innerWidth, window.innerHeight);
  return renderer;
}

export function resizeRenderer(renderer: THREE.WebGLRenderer, width: number, height: number): void {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
  renderer.setSize(width, height, false);
}
