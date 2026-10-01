import type { PlanarPoint } from './types';

export interface SpringSettings {
  stiffness: number;
  damping: number;
}

export interface WobbleSettings extends SpringSettings {
  accelerationGain: number;
  turnGain: number;
  maxTilt: number;
}

export interface TiltAngles {
  pitch: number;
  roll: number;
}

export const DEFAULT_WOBBLE_SETTINGS: WobbleSettings = {
  stiffness: 70,
  damping: 5.5,
  accelerationGain: 0.012,
  turnGain: 0.02,
  maxTilt: 0.55
};

const MAX_SUBSTEP_SECONDS = 1 / 120;

class DampedSpring {
  value = 0;
  velocity = 0;

  constructor(private readonly settings: SpringSettings) {}

  step(target: number, deltaSeconds: number): void {
    const springForce = -this.settings.stiffness * (this.value - target);
    const dampingForce = -this.settings.damping * this.velocity;
    this.velocity += (springForce + dampingForce) * deltaSeconds;
    this.value += this.velocity * deltaSeconds;
  }
}

function clampMagnitude(value: number, limit: number): number {
  return Math.min(Math.max(value, -limit), limit);
}

export class WobblySpring {
  private readonly pitchSpring: DampedSpring;
  private readonly rollSpring: DampedSpring;
  private readonly tilt: TiltAngles = { pitch: 0, roll: 0 };

  constructor(private readonly settings: WobbleSettings = DEFAULT_WOBBLE_SETTINGS) {
    this.pitchSpring = new DampedSpring(settings);
    this.rollSpring = new DampedSpring(settings);
  }

  update(deltaSeconds: number, acceleration: PlanarPoint, yaw: number, yawRate: number): TiltAngles {
    const sinYaw = Math.sin(yaw);
    const cosYaw = Math.cos(yaw);
    const forwardAcceleration = acceleration.x * sinYaw + acceleration.z * cosYaw;
    const rightAcceleration = -acceleration.x * cosYaw + acceleration.z * sinYaw;

    const { accelerationGain, turnGain, maxTilt } = this.settings;
    const targetPitch = clampMagnitude(-forwardAcceleration * accelerationGain, maxTilt);
    const targetRoll = clampMagnitude(-rightAcceleration * accelerationGain + yawRate * turnGain, maxTilt);

    const substeps = Math.max(1, Math.ceil(deltaSeconds / MAX_SUBSTEP_SECONDS));
    const substepSeconds = deltaSeconds / substeps;
    for (let index = 0; index < substeps; index++) {
      this.pitchSpring.step(targetPitch, substepSeconds);
      this.rollSpring.step(targetRoll, substepSeconds);
    }

    this.tilt.pitch = clampMagnitude(this.pitchSpring.value, maxTilt * 1.5);
    this.tilt.roll = clampMagnitude(this.rollSpring.value, maxTilt * 1.5);
    return this.tilt;
  }
}
