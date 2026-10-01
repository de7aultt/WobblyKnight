import * as THREE from 'three';

const geometryCache = new Map<string, THREE.BufferGeometry>();
const materialCache = new Map<number, THREE.MeshStandardMaterial>();
const glowCache = new Map<number, THREE.MeshStandardMaterial>();

export function cachedGeometry(key: string, create: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let geometry = geometryCache.get(key);
  if (!geometry) {
    geometry = create();
    geometryCache.set(key, geometry);
  }
  return geometry;
}

export function cachedMaterial(color: number): THREE.MeshStandardMaterial {
  let material = materialCache.get(color);
  if (!material) {
    material = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    materialCache.set(color, material);
  }
  return material;
}

function cachedGlow(color: number): THREE.MeshStandardMaterial {
  let material = glowCache.get(color);
  if (!material) {
    material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.4, roughness: 0.4 });
    glowCache.set(color, material);
  }
  return material;
}

export function part(geometry: THREE.BufferGeometry, color: number, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, cachedMaterial(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function addEyes(
  body: THREE.Group,
  eyeColor: number,
  headY: number,
  spread: number,
  forward: number,
  glowing = false
): void {
  const eye = cachedGeometry('eye', () => new THREE.SphereGeometry(0.045, 6, 4));
  [-1, 1].forEach((side) => {
    const mesh = part(eye, eyeColor, side * spread, headY + 0.05, forward);
    if (glowing) mesh.material = cachedGlow(eyeColor);
    body.add(mesh);
  });
}
