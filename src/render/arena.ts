import * as THREE from 'three';
import type { ArenaId } from '../core/armoryItems';
import { createWalls, createPosts } from './arenaFrame';
import { createFloor } from './arenaFloor';
import { ARENA_THEMES } from './arenaThemes';
import type { TavernLights } from './lights';

export interface Arena {
  applyTheme(id: ArenaId): void;
}

function disposeGroup(group: THREE.Object3D): void {
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials: THREE.Material[] = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => material.dispose());
    if (object instanceof THREE.InstancedMesh) object.dispose();
  });
}

export function createArena(scene: THREE.Scene, lights: TavernLights): Arena {
  const root = new THREE.Group();
  scene.add(root);
  let current: THREE.Group | null = null;

  function applyTheme(id: ArenaId): void {
    const theme = ARENA_THEMES[id];
    if (current) {
      root.remove(current);
      disposeGroup(current);
    }
    current = new THREE.Group();
    current.add(createFloor(theme), createWalls(theme), createPosts(theme));
    root.add(current);
    lights.setTheme(theme.torchColor, theme.ambientColor);
  }

  applyTheme('tavern_pit');
  return { applyTheme };
}
