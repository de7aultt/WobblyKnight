export const SHIELD_BREAK_SPEED = 14;
export const SHIELD_RECOIL_SPEED = 3;

const SHIELD_ARC_COSINE = 0.45;

export function isShieldFacing(yaw: number, deltaX: number, deltaZ: number): boolean {
  const length = Math.hypot(deltaX, deltaZ);
  if (length < 1e-4) return true;
  return (Math.sin(yaw) * deltaX + Math.cos(yaw) * deltaZ) / length > SHIELD_ARC_COSINE;
}
