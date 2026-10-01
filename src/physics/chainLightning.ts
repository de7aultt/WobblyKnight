import * as THREE from 'three';
import type { CombatTarget } from '../entities/combatTarget';
import type { ImpactSparks } from '../render/impactSparks';

const ARC_RADIUS = 4.5;
const ARC_DAMAGE = 1;
const ARC_KNOCKBACK = 5;
const ARC_LIFT = 6;
const ARC_SPARK_POINTS = 5;
const ARC_JITTER = 0.35;
const ARC_SPARK_INTENSITY = 0.6;

interface Candidate {
  target: CombatTarget;
  distance: number;
}

export class ChainLightning {
  private readonly candidates: Candidate[] = [];
  private readonly from = new THREE.Vector3();
  private readonly to = new THREE.Vector3();
  private readonly point = new THREE.Vector3();
  private readonly impulse = new THREE.Vector3();

  constructor(private readonly sparks: ImpactSparks) {}

  discharge(source: CombatTarget, targets: readonly CombatTarget[], maxTargets: number): void {
    this.candidates.length = 0;
    for (const target of targets) {
      if (target === source || !target.isHittable) continue;
      const distance = Math.hypot(target.position.x - source.position.x, target.position.z - source.position.z);
      if (distance <= ARC_RADIUS) this.candidates.push({ target, distance });
    }
    this.candidates.sort((first, second) => first.distance - second.distance);
    const count = Math.min(maxTargets, this.candidates.length);
    for (let index = 0; index < count; index++) this.zap(source, this.candidates[index].target);
  }

  private zap(source: CombatTarget, target: CombatTarget): void {
    this.from.copy(source.position);
    this.from.y += source.type.height * 0.5;
    this.to.copy(target.position);
    this.to.y += target.type.height * 0.5;
    this.drawArc();

    this.impulse.subVectors(this.to, this.from);
    this.impulse.y = 0;
    this.impulse.setLength(ARC_KNOCKBACK / target.type.mass);
    if (ARC_DAMAGE >= target.health) this.impulse.y = ARC_LIFT;
    target.receiveHit(ARC_DAMAGE, this.impulse);
  }

  private drawArc(): void {
    for (let step = 1; step <= ARC_SPARK_POINTS; step++) {
      const progress = step / ARC_SPARK_POINTS;
      this.point.lerpVectors(this.from, this.to, progress);
      this.point.x += (Math.random() - 0.5) * ARC_JITTER;
      this.point.y += (Math.random() - 0.5) * ARC_JITTER;
      this.point.z += (Math.random() - 0.5) * ARC_JITTER;
      this.sparks.burst(this.point, ARC_SPARK_INTENSITY);
    }
  }
}
