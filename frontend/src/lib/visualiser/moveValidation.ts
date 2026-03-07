/**
 * Move validation – check if a target position is valid for placing a box
 * (floor, wall, collision)
 */

import { Position } from '@/types/visualiser';
import { AABB, AABBUtils } from './moveTool';

export interface ValidatePositionConstraints {
  floor?: boolean;
  wall?: boolean;
  collision?: boolean;
}

export interface ValidatePositionResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Validate a target position for the moving box.
 * Returns { isValid, reason? }.
 */
export function validatePosition(
  targetPosition: Position,
  movingBox: { position: Position; dimensions: { lenX: number; lenY: number; lenZ: number } },
  otherBoxes: { id: string; aabb: AABB }[],
  constraints: ValidatePositionConstraints = { floor: true, wall: true, collision: true }
): ValidatePositionResult {
  const { lenX, lenY, lenZ } = movingBox.dimensions;

  if (constraints.floor && targetPosition.z < 0) {
    return { isValid: false, reason: 'Below floor' };
  }

  if (constraints.wall && targetPosition.y < 0) {
    return { isValid: false, reason: 'Behind wall' };
  }

  if (constraints.collision && otherBoxes.length > 0) {
    const movingAABB = AABBUtils.create(targetPosition, { w: lenX, d: lenY, h: lenZ });
    for (const other of otherBoxes) {
      if (AABBUtils.overlaps(movingAABB, other.aabb)) {
        return { isValid: false, reason: 'Collision with cabinet' };
      }
    }
  }

  return { isValid: true };
}
