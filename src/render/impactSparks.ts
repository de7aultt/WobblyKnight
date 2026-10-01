import * as THREE from 'three';

const PARTICLE_COUNT = 96;
const SHARDS_PER_BURST = 8;
const LIFETIME_SECONDS = 0.35;
const SPARK_GRAVITY = 14;
const FLASH_SIZE = 4;

interface SparkParticle {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  velocity: THREE.Vector3;
  size: number;
  life: number;
}

export class ImpactSparks {
  private readonly particles: SparkParticle[] = [];
  private cursor = 0;

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.IcosahedronGeometry(0.1, 0);
    for (let index = 0; index < PARTICLE_COUNT; index++) {
      const material = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      scene.add(mesh);
      this.particles.push({ mesh, material, velocity: new THREE.Vector3(), size: 1, life: 0 });
    }
  }

  burst(position: THREE.Vector3, intensity: number): void {
    const strength = Math.min(Math.max(intensity, 0.3), 1.5);
    this.emit(position, 0xffffff, FLASH_SIZE * strength, 0, 0, 0);
    for (let index = 0; index < SHARDS_PER_BURST; index++) {
      const angle = (index / SHARDS_PER_BURST) * Math.PI * 2 + Math.random();
      const speed = (4 + Math.random() * 5) * strength;
      this.emit(position, 0xffd27a, 0.6 + Math.random() * 0.8, Math.cos(angle) * speed, 2 + Math.random() * 4, Math.sin(angle) * speed);
    }
  }

  update(deltaSeconds: number): void {
    this.particles.forEach((particle) => {
      if (particle.life <= 0) return;
      particle.life -= deltaSeconds;
      if (particle.life <= 0) {
        particle.mesh.visible = false;
        return;
      }
      const remaining = particle.life / LIFETIME_SECONDS;
      particle.velocity.y -= SPARK_GRAVITY * deltaSeconds;
      particle.mesh.position.addScaledVector(particle.velocity, deltaSeconds);
      particle.mesh.scale.setScalar(particle.size * remaining);
      particle.material.opacity = remaining;
    });
  }

  private emit(position: THREE.Vector3, color: number, size: number, velocityX: number, velocityY: number, velocityZ: number): void {
    const particle = this.particles[this.cursor];
    this.cursor = (this.cursor + 1) % PARTICLE_COUNT;
    particle.life = LIFETIME_SECONDS;
    particle.size = size;
    particle.velocity.set(velocityX, velocityY, velocityZ);
    particle.material.color.setHex(color);
    particle.material.opacity = 1;
    particle.mesh.position.copy(position);
    particle.mesh.scale.setScalar(size);
    particle.mesh.visible = true;
  }
}
