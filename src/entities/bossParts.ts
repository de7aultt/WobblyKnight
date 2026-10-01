import * as THREE from 'three';

export type MaterialSet = Record<string, THREE.MeshStandardMaterial>;

export function standard(color: number, roughness = 0.8, metalness = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

export function part(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function addLegs(
  root: THREE.Group,
  body: THREE.Group,
  trousers: THREE.Material,
  boots: THREE.Material,
  spread: number
): { leftFoot: THREE.Mesh; rightFoot: THREE.Mesh } {
  const legGeometry = new THREE.CylinderGeometry(0.24, 0.22, 0.75, 8);
  const bootGeometry = new THREE.BoxGeometry(0.42, 0.24, 0.6);
  const leftFoot = part(bootGeometry, boots, spread, 0.12, 0.08);
  const rightFoot = part(bootGeometry, boots, -spread, 0.12, 0.08);
  root.add(leftFoot, rightFoot);
  body.add(part(legGeometry, trousers, spread, 0.55, 0), part(legGeometry, trousers, -spread, 0.55, 0));
  return { leftFoot, rightFoot };
}

export function addEyes(head: THREE.Group, material: THREE.Material, spread: number, y: number, z: number): void {
  const eyeGeometry = new THREE.SphereGeometry(0.045, 6, 4);
  [-1, 1].forEach((side) => head.add(part(eyeGeometry, material, side * spread, y, z)));
}

export function createDangerDisc(radius: number): { setProgress(progress: number): void; meshes: THREE.Mesh[] } {
  const fillMaterial = new THREE.MeshBasicMaterial({
    color: 0xff2a1a,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const edgeMaterial = new THREE.MeshBasicMaterial({
    color: 0xff5a3a,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const fill = new THREE.Mesh(new THREE.CircleGeometry(radius, 40), fillMaterial);
  const edge = new THREE.Mesh(new THREE.RingGeometry(radius * 0.95, radius, 48), edgeMaterial);
  const meshes = [fill, edge];
  meshes.forEach((mesh) => {
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.05;
    mesh.visible = false;
  });
  return {
    meshes,
    setProgress(progress: number): void {
      meshes.forEach((mesh) => {
        mesh.visible = progress > 0;
      });
      fill.scale.setScalar(Math.max(progress, 0.001));
    }
  };
}
