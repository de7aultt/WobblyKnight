import * as THREE from 'three';
import {
  ARENA_HALF,
  ARENA_SIZE,
  POST_HEIGHT,
  POST_OFFSET,
  POST_SIZE,
  TORCH_POSITIONS,
  WALL_HEIGHT,
  WALL_THICKNESS
} from './arenaLayout';
import type { ArenaTheme } from './arenaThemes';

export function createWalls(theme: ArenaTheme): THREE.Group {
  const walls = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: theme.wallColor, roughness: 0.95 });
  const outerSize = ARENA_SIZE + WALL_THICKNESS * 2;
  const offset = ARENA_HALF + WALL_THICKNESS / 2;
  const horizontal = new THREE.BoxGeometry(outerSize, WALL_HEIGHT, WALL_THICKNESS);
  const vertical = new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, ARENA_SIZE);

  const placements: Array<[THREE.BoxGeometry, number, number]> = [
    [horizontal, 0, -offset],
    [horizontal, 0, offset],
    [vertical, -offset, 0],
    [vertical, offset, 0]
  ];

  placements.forEach(([geometry, x, z]) => {
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(x, WALL_HEIGHT / 2, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    walls.add(wall);
  });

  return walls;
}

export function createPosts(theme: ArenaTheme): THREE.Group {
  const posts = new THREE.Group();
  const postMaterial = new THREE.MeshStandardMaterial({ color: theme.postColor, roughness: 0.8 });
  const capMaterial = new THREE.MeshStandardMaterial({ color: theme.capColor, roughness: 0.6, metalness: 0.3 });
  const flameMaterial = new THREE.MeshBasicMaterial({ color: theme.flameColor });
  const postGeometry = new THREE.BoxGeometry(POST_SIZE, POST_HEIGHT, POST_SIZE);
  const capGeometry = new THREE.BoxGeometry(POST_SIZE * 1.3, 0.25, POST_SIZE * 1.3);
  const flameGeometry = new THREE.ConeGeometry(0.28, 0.7, 8);

  TORCH_POSITIONS.forEach((torchPosition) => {
    const postX = Math.sign(torchPosition.x) * POST_OFFSET;
    const postZ = Math.sign(torchPosition.z) * POST_OFFSET;

    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(postX, POST_HEIGHT / 2, postZ);
    post.castShadow = true;
    post.receiveShadow = true;

    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.set(postX, POST_HEIGHT + 0.125, postZ);
    cap.castShadow = true;

    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.copy(torchPosition);

    posts.add(post, cap, flame);
  });

  return posts;
}
