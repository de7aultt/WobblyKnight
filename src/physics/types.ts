import * as THREE from 'three';

export interface Particle {
  position: THREE.Vector3;
  previousPosition: THREE.Vector3;
  acceleration: THREE.Vector3;
  mass: number;
  radius: number;
  pinned: boolean;
}

export interface PlanarPoint {
  x: number;
  z: number;
}

export function createParticle(position: THREE.Vector3, mass: number, radius: number, pinned = false): Particle {
  return {
    position: position.clone(),
    previousPosition: position.clone(),
    acceleration: new THREE.Vector3(),
    mass,
    radius,
    pinned
  };
}

export function inverseMassOf(particle: Particle): number {
  return particle.pinned || particle.mass <= 0 ? 0 : 1 / particle.mass;
}
