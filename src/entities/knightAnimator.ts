import type { TiltAngles } from '../physics/wobblySpring';
import { FOOT_BASE_HEIGHT, TORSO_PIVOT_HEIGHT, type KnightRig } from './knightMesh';

const STRIDE_LENGTH = 0.16;
const FOOT_LIFT = 0.1;
const BODY_BOB = 0.05;
const WADDLE_SWAY = 0.12;
const HEAD_LAG = 0.6;

export interface KnightPose {
  walkPhase: number;
  speedRatio: number;
  tilt: TiltAngles;
}

export function animateKnight(rig: KnightRig, pose: KnightPose): void {
  const stride = Math.sin(pose.walkPhase);
  const intensity = pose.speedRatio;

  rig.leftFoot.position.z = 0.05 + stride * STRIDE_LENGTH * intensity;
  rig.rightFoot.position.z = 0.05 - stride * STRIDE_LENGTH * intensity;
  rig.leftFoot.position.y = FOOT_BASE_HEIGHT + Math.max(0, stride) * FOOT_LIFT * intensity;
  rig.rightFoot.position.y = FOOT_BASE_HEIGHT + Math.max(0, -stride) * FOOT_LIFT * intensity;

  rig.torsoPivot.position.y = TORSO_PIVOT_HEIGHT + Math.abs(stride) * BODY_BOB * intensity;
  rig.torsoPivot.rotation.x = pose.tilt.pitch;
  rig.torsoPivot.rotation.z = pose.tilt.roll + stride * WADDLE_SWAY * intensity;

  rig.head.rotation.x = pose.tilt.pitch * HEAD_LAG;
  rig.head.rotation.z = pose.tilt.roll * HEAD_LAG - stride * WADDLE_SWAY * 0.5 * intensity;
}
