/**
 * Move Tool System - EXACT PORT from Apps Script
 * 
 * Handles box movement with:
 * - AABB collision detection
 * - Snap to grid, edges, and corners
 * - Axis locking (X, Y, Z)
 * - Floor and wall constraints
 */

import { Position } from '@/types/visualiser';

// ============================================
// CONFIGURATION (matching Apps Script)
// ============================================

export const MoveToolConfig = {
  // Snap thresholds
  SNAP_THRESHOLD: 100,        // Distance to trigger snap (mm)
  SNAP_HYSTERESIS_IN: 100,    // Distance to enter snap
  SNAP_HYSTERESIS_OUT: 140,   // Distance to exit snap (prevents flicker)
  SNAP_TOLERANCE: 2,          // Max correction allowed after snap (mm)
  
  // Collision
  CONTACT_EPSILON: 1,          // Touching tolerance (mm) - faces within 1mm are "touching", not intersecting
  
  // Floor and wall
  FLOOR_Z: 0,                 // Floor plane Z coordinate (in our data system)
  WALL_Y: 0,                  // Back wall Y coordinate (boxes snap back face here)
  
  // Grid
  GRID_SIZE: 50,              // Grid snap size (mm)
};

// ============================================
// VEC3 UTILITIES (matching Apps Script)
// ============================================

export const Vec3 = {
  create(x = 0, y = 0, z = 0): Position {
    return { x, y, z };
  },

  clone(v: Position): Position {
    return { x: v.x, y: v.y, z: v.z };
  },

  add(a: Position, b: Position): Position {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  },

  sub(a: Position, b: Position): Position {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  },

  scale(v: Position, s: number): Position {
    return { x: v.x * s, y: v.y * s, z: v.z * s };
  },

  length(v: Position): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  },

  distance(a: Position, b: Position): number {
    return Vec3.length(Vec3.sub(a, b));
  },
};

// ============================================
// AABB (Axis-Aligned Bounding Box)
// ============================================

export interface AABB {
  position: Position;  // Min corner
  dimensions: { w: number; d: number; h: number };
  min: Position;
  max: Position;
}

export const AABBUtils = {
  /**
   * Create AABB from position (min corner) and dimensions
   */
  create(position: Position, dimensions: { w: number; d: number; h: number }): AABB {
    return {
      position: Vec3.clone(position),
      dimensions: { w: dimensions.w, d: dimensions.d, h: dimensions.h },
      min: Vec3.clone(position),
      max: {
        x: position.x + dimensions.w,
        y: position.y + dimensions.d,
        z: position.z + dimensions.h,
      },
    };
  },

  /**
   * Create AABB at a new position
   */
  atPosition(aabb: AABB, newPosition: Position): AABB {
    return AABBUtils.create(newPosition, aabb.dimensions);
  },

  /**
   * Check if two AABBs overlap (touching is allowed, only true intersection).
   * Uses CONTACT_EPSILON so faces that are flush/touching are NOT considered overlapping.
   */
  overlaps(a: AABB, b: AABB): boolean {
    const eps = MoveToolConfig.CONTACT_EPSILON;
    const overlapX = a.min.x < b.max.x - eps && a.max.x > b.min.x + eps;
    const overlapY = a.min.y < b.max.y - eps && a.max.y > b.min.y + eps;
    const overlapZ = a.min.z < b.max.z - eps && a.max.z > b.min.z + eps;
    return overlapX && overlapY && overlapZ;
  },

  /**
   * Get center of AABB
   */
  center(aabb: AABB): Position {
    return {
      x: aabb.min.x + aabb.dimensions.w / 2,
      y: aabb.min.y + aabb.dimensions.d / 2,
      z: aabb.min.z + aabb.dimensions.h / 2,
    };
  },
};

// ============================================
// SNAP HELPERS
// ============================================

/**
 * Snap position to grid
 */
export function snapToGrid(position: Position, gridSize: number = MoveToolConfig.GRID_SIZE): Position {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
    z: Math.round(position.z / gridSize) * gridSize,
  };
}

/**
 * Snap to axis (lock movement to single axis)
 */
export function snapToAxis(
  position: Position,
  origin: Position,
  lockedAxis: 'x' | 'y' | 'z' | null
): Position {
  if (!lockedAxis) return position;

  const result = Vec3.clone(origin);
  result[lockedAxis] = position[lockedAxis];
  return result;
}

// ============================================
// COLLISION SOLVER
// ============================================

export interface CollisionResult {
  collides: boolean;
  allowedPosition: Position;
  collidingWith: string[];
}

/**
 * Resolve collisions - find maximum allowed movement
 */
export function resolveCollision(
  movingAABB: AABB,
  targetPosition: Position,
  otherBoxes: { id: string; aabb: AABB }[]
): CollisionResult {
  const testAABB = AABBUtils.atPosition(movingAABB, targetPosition);
  const collidingWith: string[] = [];

  for (const other of otherBoxes) {
    if (AABBUtils.overlaps(testAABB, other.aabb)) {
      collidingWith.push(other.id);
    }
  }

  if (collidingWith.length === 0) {
    return {
      collides: false,
      allowedPosition: targetPosition,
      collidingWith: [],
    };
  }

  // Find maximum allowed position by resolving axis by axis
  let allowedPosition = Vec3.clone(movingAABB.position);
  const delta = Vec3.sub(targetPosition, movingAABB.position);
  
  // Try to resolve each axis independently
  for (const axis of ['x', 'y', 'z'] as const) {
    if (Math.abs(delta[axis]) < 0.01) continue;

    const testPos = Vec3.clone(allowedPosition);
    testPos[axis] = targetPosition[axis];
    const testBox = AABBUtils.atPosition(movingAABB, testPos);

    let blocked = false;
    for (const other of otherBoxes) {
      if (AABBUtils.overlaps(testBox, other.aabb)) {
        blocked = true;
        break;
      }
    }

    if (!blocked) {
      allowedPosition[axis] = targetPosition[axis];
    }
  }

  return {
    collides: true,
    allowedPosition,
    collidingWith,
  };
}

// ============================================
// FLOOR & WALL CONSTRAINTS
// ============================================

/**
 * Apply floor constraint (Z >= 0)
 */
export function constrainToFloor(position: Position): Position {
  return {
    ...position,
    z: Math.max(MoveToolConfig.FLOOR_Z, position.z),
  };
}

/**
 * Apply wall constraint (Y >= 0 for back of box against wall)
 */
export function constrainToWall(position: Position, boxDepth: number): Position {
  // Box position is min corner, back face is at min Y
  // To keep back against wall (Y=0), position.y should be >= boxDepth
  // so that front face extends forward (positive Y direction)
  return {
    ...position,
    y: Math.max(MoveToolConfig.WALL_Y, position.y),
  };
}

// ============================================
// COORDINATE CONVERSION
// ============================================

/**
 * Convert from data coordinates to Three.js coordinates.
 *
 * Data:     X = right,  Y = front (toward viewer),  Z = up
 * Three.js: X = right,  Y = up,                     Z = toward camera
 *
 * Both data-Y and Three.js-Z point toward the viewer, so the mapping is
 * POSITIVE (no sign flip needed). A box at data {x:100, y:200, z:300}
 * appears at Three.js {x:100, y:300, z:200}.
 */
export function dataToThree(pos: Position): Position {
  return {
    x: pos.x,
    y: pos.z,   // data Z-up  -> Three.js Y-up
    z: pos.y,   // data Y-front -> Three.js Z-front (same direction, no sign flip)
  };
}

/**
 * Convert from Three.js coordinates to data coordinates.
 */
export function threeToData(pos: Position): Position {
  return {
    x: pos.x,
    y: pos.z,   // Three.js Z-front -> data Y-front
    z: pos.y,   // Three.js Y-up    -> data Z-up
  };
}

// ============================================
// ROTATION
// ============================================

/**
 * Rotate position around Z axis (vertical)
 */
export function rotateAroundZ(pos: Position, center: Position, angleDeg: number): Position {
  const angleRad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  const dx = pos.x - center.x;
  const dy = pos.y - center.y;
  
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
    z: pos.z,
  };
}

/**
 * Calculate box center from position and dimensions
 */
export function getBoxCenter(position: Position, dimensions: { w: number; d: number; h: number }): Position {
  return {
    x: position.x + dimensions.w / 2,
    y: position.y + dimensions.d / 2,
    z: position.z + dimensions.h / 2,
  };
}
