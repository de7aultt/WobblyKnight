import { ARENA_HALF, POST_OFFSET, POST_SIZE } from '../render/arenaLayout';
import type { PlanarPoint } from './types';

export interface BoundsContact {
  hitX: boolean;
  hitZ: boolean;
}

const POST_INNER_EDGE = POST_OFFSET - POST_SIZE / 2;

function clampAxis(value: number, limit: number): number {
  return Math.min(Math.max(value, -limit), limit);
}

export function clampToArena(point: PlanarPoint, radius: number): BoundsContact {
  const contact: BoundsContact = { hitX: false, hitZ: false };
  const wallLimit = ARENA_HALF - radius;

  const clampedX = clampAxis(point.x, wallLimit);
  const clampedZ = clampAxis(point.z, wallLimit);
  contact.hitX = clampedX !== point.x;
  contact.hitZ = clampedZ !== point.z;
  point.x = clampedX;
  point.z = clampedZ;

  const postLimit = POST_INNER_EDGE - radius;
  const penetrationX = Math.abs(point.x) - postLimit;
  const penetrationZ = Math.abs(point.z) - postLimit;
  if (penetrationX <= 0 || penetrationZ <= 0) return contact;

  if (penetrationX < penetrationZ) {
    point.x = Math.sign(point.x) * postLimit;
    contact.hitX = true;
  } else {
    point.z = Math.sign(point.z) * postLimit;
    contact.hitZ = true;
  }
  return contact;
}
