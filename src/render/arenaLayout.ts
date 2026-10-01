import * as THREE from 'three';

export const ARENA_SIZE = 24;
export const ARENA_HALF = ARENA_SIZE / 2;
export const WALL_THICKNESS = 1;
export const WALL_HEIGHT = 1.2;
export const POST_HEIGHT = 3.4;
export const POST_SIZE = 0.9;
export const POST_OFFSET = ARENA_HALF - POST_SIZE / 2;
export const TORCH_HEIGHT = POST_HEIGHT + 0.6;

export const TORCH_POSITIONS: readonly THREE.Vector3[] = [
  new THREE.Vector3(-POST_OFFSET, TORCH_HEIGHT, -POST_OFFSET),
  new THREE.Vector3(POST_OFFSET, TORCH_HEIGHT, -POST_OFFSET),
  new THREE.Vector3(POST_OFFSET, TORCH_HEIGHT, POST_OFFSET),
  new THREE.Vector3(-POST_OFFSET, TORCH_HEIGHT, POST_OFFSET)
];
