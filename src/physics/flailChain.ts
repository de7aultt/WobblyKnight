import * as THREE from 'three';
import { clampToArena } from './arenaBounds';
import { createParticle, inverseMassOf, type Particle } from './types';

export interface FlailChainSettings {
  linkCount: number;
  linkLength: number;
  linkMass: number;
  linkRadius: number;
  ballLinkLength: number;
  ballMass: number;
  ballRadius: number;
  gravity: number;
  airDrag: number;
  groundFriction: number;
  iterations: number;
}

export const DEFAULT_FLAIL_SETTINGS: FlailChainSettings = {
  linkCount: 3,
  linkLength: 0.45,
  linkMass: 0.6,
  linkRadius: 0.08,
  ballLinkLength: 0.55,
  ballMass: 2,
  ballRadius: 0.4,
  gravity: 18,
  airDrag: 0.006,
  groundFriction: 0.04,
  iterations: 5
};

const FIXED_STEP_SECONDS = 1 / 120;
const MAX_STEPS_PER_FRAME = 12;

export class FlailChain {
  readonly nodes: Particle[] = [];
  private readonly restLengths: number[] = [];
  private readonly anchorFrom = new THREE.Vector3();
  private readonly anchorTo = new THREE.Vector3();
  private readonly tipVelocity = new THREE.Vector3();
  private readonly scratch = new THREE.Vector3();
  private accumulator = 0;

  constructor(anchorPosition: THREE.Vector3, private readonly settings: FlailChainSettings = DEFAULT_FLAIL_SETTINGS) {
    const { linkCount, linkLength, linkMass, linkRadius, ballLinkLength, ballMass, ballRadius } = settings;
    this.nodes.push(createParticle(anchorPosition, 0, linkRadius, true));
    for (let index = 0; index < linkCount; index++) {
      this.nodes.push(createParticle(anchorPosition, linkMass, linkRadius));
      this.restLengths.push(linkLength);
    }
    this.nodes.push(createParticle(anchorPosition, ballMass, ballRadius));
    this.restLengths.push(ballLinkLength);
    this.reset(anchorPosition);
  }

  get anchor(): Particle {
    return this.nodes[0];
  }

  get tip(): Particle {
    return this.nodes[this.nodes.length - 1];
  }

  get tipPosition(): THREE.Vector3 {
    return this.tip.position;
  }

  get tipRadius(): number {
    return this.tip.radius;
  }

  get tipSpeed(): number {
    return this.tipVelocity.length();
  }

  getTipVelocity(out: THREE.Vector3): THREE.Vector3 {
    return out.copy(this.tipVelocity);
  }

  reset(anchorPosition: THREE.Vector3): void {
    let offset = 0;
    this.nodes.forEach((node, index) => {
      offset += index === 0 ? 0 : this.restLengths[index - 1];
      node.position.set(anchorPosition.x, Math.max(anchorPosition.y - offset, node.radius), anchorPosition.z - offset * 0.5);
      node.previousPosition.copy(node.position);
    });
    this.anchorFrom.copy(anchorPosition);
    this.anchorTo.copy(anchorPosition);
    this.tipVelocity.set(0, 0, 0);
    this.accumulator = 0;
  }

  step(deltaSeconds: number, anchorPosition: THREE.Vector3): void {
    this.anchorFrom.copy(this.anchorTo);
    this.anchorTo.copy(anchorPosition);
    this.accumulator += deltaSeconds;

    let steps = Math.floor(this.accumulator / FIXED_STEP_SECONDS);
    this.accumulator -= steps * FIXED_STEP_SECONDS;
    if (steps > MAX_STEPS_PER_FRAME) {
      steps = MAX_STEPS_PER_FRAME;
      this.accumulator = 0;
    }

    if (steps === 0) {
      this.placeAnchor(this.anchorTo);
      this.solveConstraints();
      return;
    }

    for (let stepIndex = 1; stepIndex <= steps; stepIndex++) {
      this.placeAnchor(this.scratch.lerpVectors(this.anchorFrom, this.anchorTo, stepIndex / steps));
      this.integrate(FIXED_STEP_SECONDS);
      this.solveConstraints();
      this.applyEnvironment();
    }

    this.tipVelocity.subVectors(this.tip.position, this.tip.previousPosition).divideScalar(FIXED_STEP_SECONDS);
  }

  private placeAnchor(position: THREE.Vector3): void {
    this.anchor.previousPosition.copy(this.anchor.position);
    this.anchor.position.copy(position);
  }

  private integrate(stepSeconds: number): void {
    const dragFactor = 1 - this.settings.airDrag;
    const stepSquared = stepSeconds * stepSeconds;
    for (let index = 1; index < this.nodes.length; index++) {
      const node = this.nodes[index];
      node.acceleration.set(0, -this.settings.gravity, 0);
      const velocity = this.scratch.subVectors(node.position, node.previousPosition).multiplyScalar(dragFactor);
      node.previousPosition.copy(node.position);
      node.position.add(velocity).addScaledVector(node.acceleration, stepSquared);
    }
  }

  private solveConstraints(): void {
    const delta = new THREE.Vector3();
    for (let iteration = 0; iteration < this.settings.iterations; iteration++) {
      for (let index = 0; index < this.restLengths.length; index++) {
        const start = this.nodes[index];
        const end = this.nodes[index + 1];
        delta.subVectors(end.position, start.position);
        const distance = delta.length();
        if (distance < 1e-6) continue;
        const startWeight = inverseMassOf(start);
        const endWeight = inverseMassOf(end);
        const totalWeight = startWeight + endWeight;
        if (totalWeight === 0) continue;
        const correction = (distance - this.restLengths[index]) / (distance * totalWeight);
        start.position.addScaledVector(delta, startWeight * correction);
        end.position.addScaledVector(delta, -endWeight * correction);
      }
    }
  }

  private applyEnvironment(): void {
    const friction = this.settings.groundFriction;
    for (let index = 1; index < this.nodes.length; index++) {
      const node = this.nodes[index];
      if (node.position.y < node.radius) {
        node.position.y = node.radius;
        node.previousPosition.y = node.position.y;
        node.previousPosition.x += (node.position.x - node.previousPosition.x) * friction;
        node.previousPosition.z += (node.position.z - node.previousPosition.z) * friction;
      }
      const contact = clampToArena(node.position, node.radius);
      if (contact.hitX) node.previousPosition.x = node.position.x;
      if (contact.hitZ) node.previousPosition.z = node.position.z;
    }
  }
}
