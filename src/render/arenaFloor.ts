import * as THREE from 'three';
import { ARENA_HALF, ARENA_SIZE } from './arenaLayout';
import type { ArenaTheme } from './arenaThemes';

const PLANK_COUNT = 24;
const PLANK_GAP = 0.04;
const TILES_PER_SIDE = 12;
const TILE_GAP = 0.06;
const FLOOR_THICKNESS = 0.4;
const RUNNER_WIDTH = 4;
const RUNNER_EDGE_WIDTH = 0.22;
const RUNNER_HEIGHT = 0.05;

function randomizedColor(theme: ArenaTheme, bias = 0): THREE.Color {
  const { hue, saturation, lightness, variance } = theme.floorColor;
  return new THREE.Color().setHSL(
    hue + Math.random() * 0.02,
    saturation + Math.random() * 0.08,
    lightness + bias + (Math.random() - 0.5) * 2 * variance
  );
}

function createPlanks(theme: ArenaTheme): THREE.Group {
  const floor = new THREE.Group();
  const plankWidth = ARENA_SIZE / PLANK_COUNT;
  const geometry = new THREE.BoxGeometry(plankWidth - PLANK_GAP, FLOOR_THICKNESS, ARENA_SIZE);

  for (let index = 0; index < PLANK_COUNT; index++) {
    const material = new THREE.MeshStandardMaterial({ color: randomizedColor(theme), roughness: theme.roughness });
    const plank = new THREE.Mesh(geometry, material);
    plank.position.set(-ARENA_HALF + plankWidth * (index + 0.5), -FLOOR_THICKNESS / 2, 0);
    plank.receiveShadow = true;
    floor.add(plank);
  }
  return floor;
}

function createTiles(theme: ArenaTheme): THREE.Group {
  const floor = new THREE.Group();
  const tileSize = ARENA_SIZE / TILES_PER_SIDE;
  const geometry = new THREE.BoxGeometry(tileSize - TILE_GAP, FLOOR_THICKNESS, tileSize - TILE_GAP);
  const material = new THREE.MeshStandardMaterial({ roughness: theme.roughness });
  const tiles = new THREE.InstancedMesh(geometry, material, TILES_PER_SIDE * TILES_PER_SIDE);
  const matrix = new THREE.Matrix4();

  for (let row = 0; row < TILES_PER_SIDE; row++) {
    for (let column = 0; column < TILES_PER_SIDE; column++) {
      const index = row * TILES_PER_SIDE + column;
      const checker = (row + column) % 2 === 0 ? 0.025 : -0.025;
      matrix.setPosition(
        -ARENA_HALF + tileSize * (column + 0.5),
        -FLOOR_THICKNESS / 2,
        -ARENA_HALF + tileSize * (row + 0.5)
      );
      tiles.setMatrixAt(index, matrix);
      tiles.setColorAt(index, randomizedColor(theme, checker));
    }
  }
  tiles.receiveShadow = true;
  floor.add(tiles);
  return floor;
}

function createRunner(): THREE.Group {
  const runner = new THREE.Group();
  const carpetMaterial = new THREE.MeshStandardMaterial({ color: 0x9c1427, roughness: 0.9 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xd9a82e, roughness: 0.4, metalness: 0.6 });

  const carpet = new THREE.Mesh(new THREE.BoxGeometry(RUNNER_WIDTH, RUNNER_HEIGHT, ARENA_SIZE), carpetMaterial);
  carpet.position.y = RUNNER_HEIGHT / 2;
  carpet.receiveShadow = true;
  runner.add(carpet);

  const trimGeometry = new THREE.BoxGeometry(RUNNER_EDGE_WIDTH, RUNNER_HEIGHT * 1.4, ARENA_SIZE);
  [-1, 1].forEach((side) => {
    const trim = new THREE.Mesh(trimGeometry, trimMaterial);
    trim.position.set(side * (RUNNER_WIDTH / 2 + RUNNER_EDGE_WIDTH / 2), (RUNNER_HEIGHT * 1.4) / 2, 0);
    trim.receiveShadow = true;
    runner.add(trim);
  });
  return runner;
}

export function createFloor(theme: ArenaTheme): THREE.Group {
  const floor = theme.floorStyle === 'planks' ? createPlanks(theme) : createTiles(theme);
  if (theme.hasRunner) floor.add(createRunner());
  return floor;
}
