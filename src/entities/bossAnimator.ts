import { CLEAVER_RAISED_ANGLE, CLEAVER_REST_ANGLE, type BossRig } from './bossMesh';

export interface BossPose {
  walkPhase: number;
  walkIntensity: number;
  lean: number;
  raise: number;
  warning: number;
  dizzy: number;
  elapsed: number;
}

const FOOT_BASE_Z = 0.08;
const FOOT_BASE_Y = 0.12;
const STRIDE_LENGTH = 0.28;
const FOOT_LIFT = 0.18;
const THUMP_HEIGHT = 0.1;
const WADDLE_ROLL = 0.07;
const DIZZY_BODY_ROLL = 0.22;
const DIZZY_HEAD_ROLL = 0.3;

export function createBossPose(): BossPose {
  return { walkPhase: 0, walkIntensity: 0, lean: 0, raise: 0, warning: 0, dizzy: 0, elapsed: 0 };
}

export function animateBoss(rig: BossRig, pose: BossPose): void {
  const stride = Math.sin(pose.walkPhase);
  const intensity = pose.walkIntensity;

  rig.leftFoot.position.z = FOOT_BASE_Z + stride * STRIDE_LENGTH * intensity;
  rig.rightFoot.position.z = FOOT_BASE_Z - stride * STRIDE_LENGTH * intensity;
  rig.leftFoot.position.y = FOOT_BASE_Y + Math.max(0, stride) * FOOT_LIFT * intensity;
  rig.rightFoot.position.y = FOOT_BASE_Y + Math.max(0, -stride) * FOOT_LIFT * intensity;

  rig.body.position.y = Math.abs(stride) * THUMP_HEIGHT * intensity;
  rig.body.rotation.x = pose.lean;
  rig.body.rotation.z = stride * WADDLE_ROLL * intensity + Math.sin(pose.elapsed * 7) * DIZZY_BODY_ROLL * pose.dizzy;
  rig.head.rotation.z = Math.sin(pose.elapsed * 9 + 1) * DIZZY_HEAD_ROLL * pose.dizzy;

  rig.cleaverPivot.rotation.x = CLEAVER_REST_ANGLE + (CLEAVER_RAISED_ANGLE - CLEAVER_REST_ANGLE) * pose.raise;
  rig.setWarning(pose.warning);
}
