/**
 * Collision Detection System
 * AABB collision detection for cabinet boxes
 */

import type { 
  DesignerBox, 
  DesignerWall, 
  BoundingBox, 
  CollisionResult,
  Position3D 
} from "@/types/visualiser";

// ============================================
// Bounding Box Utilities
// ============================================

/**
 * Gets the axis-aligned bounding box for a box, accounting for rotation
 */
export function getBoxBounds(box: DesignerBox): BoundingBox {
  const width = box.dimensions.boxWidth || box.dimensions.lenX || 600;
  const depth = box.dimensions.boxDepth || box.dimensions.lenY || 550;
  const height = box.dimensions.boxHeight || box.dimensions.lenZ || 800;
  const rotation = box.rotationZ || 0;
  
  // For 90/270 degree rotations, swap width and depth
  const rotatedWidth = rotation % 180 === 0 ? width : depth;
  const rotatedDepth = rotation % 180 === 0 ? depth : width;
  
  return {
    minX: box.position.x,
    maxX: box.position.x + rotatedWidth,
    minY: box.position.y,
    maxY: box.position.y + rotatedDepth,
    minZ: box.position.z,
    maxZ: box.position.z + height,
  };
}

/**
 * Creates a bounding box from position and dimensions
 */
export function createBounds(
  position: Position3D,
  width: number,
  depth: number,
  height: number,
  rotation: number = 0
): BoundingBox {
  const rotatedWidth = rotation % 180 === 0 ? width : depth;
  const rotatedDepth = rotation % 180 === 0 ? depth : width;
  
  return {
    minX: position.x,
    maxX: position.x + rotatedWidth,
    minY: position.y,
    maxY: position.y + rotatedDepth,
    minZ: position.z,
    maxZ: position.z + height,
  };
}

/**
 * Checks if two bounding boxes overlap
 */
export function checkAABBCollision(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.minX < b.maxX &&
    a.maxX > b.minX &&
    a.minY < b.maxY &&
    a.maxY > b.minY &&
    a.minZ < b.maxZ &&
    a.maxZ > b.minZ
  );
}

/**
 * Calculates overlap volume between two bounding boxes
 */
export function calculateOverlap(a: BoundingBox, b: BoundingBox): number {
  const overlapX = Math.max(0, Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX));
  const overlapY = Math.max(0, Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY));
  const overlapZ = Math.max(0, Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ));
  
  return overlapX * overlapY * overlapZ;
}

// ============================================
// Collision Detection
// ============================================

/**
 * Validates placement of a box against other boxes on the same wall
 */
export function validateBoxPlacement(
  newBox: BoundingBox,
  existingBoxes: DesignerBox[],
  excludeBoxId?: string
): CollisionResult {
  const collidingBoxIds: string[] = [];
  
  for (const box of existingBoxes) {
    // Skip the box itself (for move operations)
    if (excludeBoxId && box.id === excludeBoxId) continue;
    
    const existingBounds = getBoxBounds(box);
    
    if (checkAABBCollision(newBox, existingBounds)) {
      collidingBoxIds.push(box.id);
    }
  }
  
  return {
    hasCollision: collidingBoxIds.length > 0,
    collidingBoxIds,
    outOfBounds: {
      left: false,
      right: false,
      top: false,
      bottom: false,
      front: false,
      back: false,
    },
  };
}

/**
 * Checks if a box fits within wall bounds
 */
export function checkWallBounds(
  boxBounds: BoundingBox,
  wall: DesignerWall
): CollisionResult["outOfBounds"] {
  return {
    left: boxBounds.minX < 0,
    right: boxBounds.maxX > wall.width,
    top: boxBounds.maxZ > wall.height,
    bottom: boxBounds.minZ < 0,
    front: boxBounds.minY < 0,
    back: boxBounds.maxY > wall.depth,
  };
}

/**
 * Full collision check including wall bounds
 */
export function checkCollisions(
  position: Position3D,
  width: number,
  depth: number,
  height: number,
  rotation: number,
  existingBoxes: DesignerBox[],
  wall: DesignerWall,
  excludeBoxId?: string
): CollisionResult {
  const newBounds = createBounds(position, width, depth, height, rotation);
  
  // Check box-box collisions
  const boxCollision = validateBoxPlacement(newBounds, existingBoxes, excludeBoxId);
  
  // Check wall bounds
  const outOfBounds = checkWallBounds(newBounds, wall);
  
  return {
    ...boxCollision,
    outOfBounds,
  };
}

// ============================================
// Collision Resolution
// ============================================

/**
 * Finds the nearest valid position for a box (push out of collision)
 */
export function resolveCollision(
  position: Position3D,
  width: number,
  depth: number,
  height: number,
  collidingBox: DesignerBox
): Position3D {
  const newBounds = createBounds(position, width, depth, height);
  const existingBounds = getBoxBounds(collidingBox);
  
  // Calculate push direction (find shortest push)
  const pushLeft = existingBounds.minX - newBounds.maxX;
  const pushRight = existingBounds.maxX - newBounds.minX;
  const pushFront = existingBounds.minY - newBounds.maxY;
  const pushBack = existingBounds.maxY - newBounds.minY;
  
  // Find minimum push
  const pushes = [
    { axis: 'x', value: pushLeft },
    { axis: 'x', value: pushRight },
    { axis: 'y', value: pushFront },
    { axis: 'y', value: pushBack },
  ];
  
  // Sort by absolute value
  pushes.sort((a, b) => Math.abs(a.value) - Math.abs(b.value));
  
  const minPush = pushes[0];
  
  return {
    x: position.x + (minPush.axis === 'x' ? minPush.value : 0),
    y: position.y + (minPush.axis === 'y' ? minPush.value : 0),
    z: position.z,
  };
}

/**
 * Clamps a position to wall bounds
 */
export function clampToWallBounds(
  position: Position3D,
  width: number,
  depth: number,
  height: number,
  wall: DesignerWall
): Position3D {
  return {
    x: Math.max(0, Math.min(wall.width - width, position.x)),
    y: Math.max(0, Math.min(wall.depth - depth, position.y)),
    z: Math.max(0, Math.min(wall.height - height, position.z)),
  };
}

export default {
  getBoxBounds,
  createBounds,
  checkAABBCollision,
  calculateOverlap,
  validateBoxPlacement,
  checkWallBounds,
  checkCollisions,
  resolveCollision,
  clampToWallBounds,
};
