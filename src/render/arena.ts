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

const PLANK_COUNT = 24;
const PLANK_GAP = 0.04;
const FLOOR_THICKNESS = 0.4;
const WOOD_BASE_HUE = 0.07;

function createFloor(): THREE.Group {
  const floor = new THREE.Group();
  const plankWidth = ARENA_SIZE / PLANK_COUNT;
  const geometry = new THREE.BoxGeometry(plankWidth - PLANK_GAP, FLOOR_THICKNESS, ARENA_SIZE);

  for (let index = 0; index < PLANK_COUNT; index++) {
    const color = new THREE.Color().setHSL(
      WOOD_BASE_HUE + Math.random() * 0.02,
      0.45 + Math.random() * 0.1,
      0.22 + Math.random() * 0.1
    );
    const plank = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
    plank.position.set(-ARENA_HALF + plankWidth * (index + 0.5), -FLOOR_THICKNESS / 2, 0);
    plank.receiveShadow = true;
    floor.add(plank);
  }

  return floor;
}

function createWalls(): THREE.Group {
  const walls = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x6b6670, roughness: 0.95 });
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

function createTorchFlame(): THREE.Mesh {
  return new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 8), new THREE.MeshBasicMaterial({ color: 0xffb347 }));
}

function createPosts(): THREE.Group {
  const posts = new THREE.Group();
  const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2e1a, roughness: 0.8 });
  const capMaterial = new THREE.MeshStandardMaterial({ color: 0x3b3a40, roughness: 0.9 });
  const postGeometry = new THREE.BoxGeometry(POST_SIZE, POST_HEIGHT, POST_SIZE);
  const capGeometry = new THREE.BoxGeometry(POST_SIZE * 1.3, 0.25, POST_SIZE * 1.3);

  TORCH_POSITIONS.forEach((torchPosition) => {
    const postX = Math.sign(torchPosition.x) * POST_OFFSET;
    const postZ = Math.sign(torchPosition.z) * POST_OFFSET;

    const post = new THREE.Mesh(postGeometry, woodMaterial);
    post.position.set(postX, POST_HEIGHT / 2, postZ);
    post.castShadow = true;
    post.receiveShadow = true;

    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.set(postX, POST_HEIGHT + 0.125, postZ);
    cap.castShadow = true;

    const flame = createTorchFlame();
    flame.position.copy(torchPosition);

    posts.add(post, cap, flame);
  });

  return posts;
}

export function createArena(scene: THREE.Scene): void {
  scene.add(createFloor(), createWalls(), createPosts());
}
