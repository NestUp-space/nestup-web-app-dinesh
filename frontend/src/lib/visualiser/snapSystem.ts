/**
 * Snap System - Detailed snap point collection and resolution
 * 
 * 5 Types of Snapping:
 * 1. Grid Snap - 50mm increments
 * 2. Edge-to-Edge Snap - Box edges align
 * 3. Corner Snap - Box corners align (highest priority)
 * 4. Wall Snap - Back to wall face (Y=0)
 * 5. Floor Snap - Bottom to floor (Z=0)
 */

import { Position, Box } from '@/types/visualiser';
import { Vec3, AABB, AABBUtils, MoveToolConfig } from './moveTool';

// ============================================
// SNAP TYPES & CONFIGURATION
// ============================================

export type SnapType = 'grid' | 'edge' | 'corner' | 'wall' | 'floor' | 'face';

export interface SnapPoint {
  position: Position;
  type: SnapType;
  sourceBoxId?: string;
  priority: number; // Higher = stronger snap
  label?: string;   // For visual indicators
  faceAxis?: 'x' | 'y' | 'z';  // For face snaps, which axis the face is on
  faceValue?: number;          // The coordinate value of the face
}

export interface SnapResult {
  snapped: boolean;
  position: Position;
  snapPoint: SnapPoint | null;
  activeSnaps: SnapPoint[];  // All active snap points for visualization
  distance: number;
  snappingCorner?: Position;  // Which corner of the moving box is snapping
  snappingCornerIndex?: number;  // Index of the snapping corner (0-7)
  distanceToThreshold?: number;  // Distance remaining to snap threshold (for visual feedback)
}

export const SnapConfig = {
  // Snap thresholds by type
  GRID_SNAP_THRESHOLD: 30,      // Always snaps within 30mm
  EDGE_SNAP_THRESHOLD: 100,     // 100mm for edge midpoints
  CORNER_SNAP_THRESHOLD: 100,   // 100mm for corners
  FACE_SNAP_THRESHOLD: 80,      // 80mm for face-to-face alignment
  WALL_SNAP_THRESHOLD: 50,      // 50mm from Y=0
  FLOOR_SNAP_THRESHOLD: 50,     // 50mm from Z=0
  
  // Grid size
  GRID_SIZE: 50,
  
  // Priorities (higher = wins)
  PRIORITY: {
    corner: 5,    // Highest - exact corner alignment
    face: 4,      // Face-to-face alignment (edges flush)
    edge: 3,      // Edge midpoint alignment
    wall: 2,
    floor: 2,
    grid: 1,      // Lowest - fallback
  },
};

// ============================================
// SNAP POINT COLLECTION
// ============================================

/**
 * Get all 8 corners of a box
 */
export function getBoxCorners(position: Position, width: number, depth: number, height: number): Position[] {
  return [
    { x: position.x, y: position.y, z: position.z },                    // 0: min corner
    { x: position.x + width, y: position.y, z: position.z },            // 1
    { x: position.x, y: position.y + depth, z: position.z },            // 2
    { x: position.x + width, y: position.y + depth, z: position.z },    // 3
    { x: position.x, y: position.y, z: position.z + height },           // 4
    { x: position.x + width, y: position.y, z: position.z + height },   // 5
    { x: position.x, y: position.y + depth, z: position.z + height },   // 6
    { x: position.x + width, y: position.y + depth, z: position.z + height }, // 7: max corner
  ];
}

/**
 * Get edge midpoints of a box (12 edges)
 */
export function getBoxEdgeMidpoints(position: Position, width: number, depth: number, height: number): Position[] {
  const w2 = width / 2;
  const d2 = depth / 2;
  const h2 = height / 2;
  
  return [
    // Bottom edges
    { x: position.x + w2, y: position.y, z: position.z },        // Front bottom
    { x: position.x + w2, y: position.y + depth, z: position.z }, // Back bottom
    { x: position.x, y: position.y + d2, z: position.z },        // Left bottom
    { x: position.x + width, y: position.y + d2, z: position.z }, // Right bottom
    
    // Top edges
    { x: position.x + w2, y: position.y, z: position.z + height },
    { x: position.x + w2, y: position.y + depth, z: position.z + height },
    { x: position.x, y: position.y + d2, z: position.z + height },
    { x: position.x + width, y: position.y + d2, z: position.z + height },
    
    // Vertical edges
    { x: position.x, y: position.y, z: position.z + h2 },
    { x: position.x + width, y: position.y, z: position.z + h2 },
    { x: position.x, y: position.y + depth, z: position.z + h2 },
    { x: position.x + width, y: position.y + depth, z: position.z + h2 },
  ];
}

/**
 * Face snap point - represents a face of the box for edge-to-edge alignment
 */
export interface FaceSnapInfo {
  axis: 'x' | 'y' | 'z';  // Which axis this face is perpendicular to
  value: number;          // The coordinate value of this face
  label: string;          // Human-readable label
}

/**
 * Get face snap points for a box (6 faces)
 * These allow other boxes to align their edges flush with this box's edges
 */
export function getBoxFaces(position: Position, width: number, depth: number, height: number): FaceSnapInfo[] {
  return [
    // X-axis faces (left/right)
    { axis: 'x', value: position.x, label: 'Left face' },                    // Left face
    { axis: 'x', value: position.x + width, label: 'Right face' },           // Right face
    
    // Y-axis faces (front/back)
    { axis: 'y', value: position.y, label: 'Front face' },                   // Front face
    { axis: 'y', value: position.y + depth, label: 'Back face' },            // Back face
    
    // Z-axis faces (bottom/top)
    { axis: 'z', value: position.z, label: 'Bottom face' },                  // Bottom face
    { axis: 'z', value: position.z + height, label: 'Top face' },            // Top face
  ];
}

/**
 * Collect all snap points from existing boxes
 */
export function collectSnapPoints(
  boxes: Box[],
  excludeBoxId?: string
): SnapPoint[] {
  const points: SnapPoint[] = [];
  
  for (const box of boxes) {
    if (box.id === excludeBoxId) continue;
    
    const { lenX: w, lenY: d, lenZ: h } = box.dimensions;
    const pos = box.position;
    
    // Add corners (priority 5)
    const corners = getBoxCorners(pos, w, d, h);
    corners.forEach((corner, i) => {
      points.push({
        position: corner,
        type: 'corner',
        sourceBoxId: box.id,
        priority: SnapConfig.PRIORITY.corner,
        label: `Corner ${i + 1}`,
      });
    });
    
    // Add face snap points for edge-to-edge alignment (priority 4)
    const faces = getBoxFaces(pos, w, d, h);
    faces.forEach((face) => {
      // Create a representative position for the face (center of face)
      const faceCenter: Position = {
        x: face.axis === 'x' ? face.value : pos.x + w / 2,
        y: face.axis === 'y' ? face.value : pos.y + d / 2,
        z: face.axis === 'z' ? face.value : pos.z + h / 2,
      };
      
      points.push({
        position: faceCenter,
        type: 'face',
        sourceBoxId: box.id,
        priority: SnapConfig.PRIORITY.face,
        label: face.label,
        faceAxis: face.axis,
        faceValue: face.value,
      });
    });
    
    // Add edge midpoints (priority 3)
    const edges = getBoxEdgeMidpoints(pos, w, d, h);
    edges.forEach((edge, i) => {
      points.push({
        position: edge,
        type: 'edge',
        sourceBoxId: box.id,
        priority: SnapConfig.PRIORITY.edge,
        label: `Edge ${i + 1}`,
      });
    });
  }
  
  // Add wall plane snap point (priority 2)
  points.push({
    position: { x: 0, y: 0, z: 0 },
    type: 'wall',
    priority: SnapConfig.PRIORITY.wall,
    label: 'Wall',
  });
  
  // Add floor plane snap point (priority 2)
  points.push({
    position: { x: 0, y: 0, z: 0 },
    type: 'floor',
    priority: SnapConfig.PRIORITY.floor,
    label: 'Floor',
  });
  
  return points;
}

/**
 * Generate grid snap points in the vicinity of a position
 */
export function generateGridPoints(
  aroundPosition: Position,
  gridSize: number = SnapConfig.GRID_SIZE,
  range: number = 500
): SnapPoint[] {
  const points: SnapPoint[] = [];
  
  const startX = Math.floor((aroundPosition.x - range) / gridSize) * gridSize;
  const endX = Math.ceil((aroundPosition.x + range) / gridSize) * gridSize;
  const startY = Math.floor((aroundPosition.y - range) / gridSize) * gridSize;
  const endY = Math.ceil((aroundPosition.y + range) / gridSize) * gridSize;
  
  for (let x = startX; x <= endX; x += gridSize) {
    for (let y = startY; y <= endY; y += gridSize) {
      points.push({
        position: { x, y, z: 0 },
        type: 'grid',
        priority: SnapConfig.PRIORITY.grid,
      });
    }
  }
  
  return points;
}

// ============================================
// SNAP RESOLUTION
// ============================================

// Track which corner snapped for proper position calculation
interface SnapMatch {
  snapPoint: SnapPoint;
  movingCornerIndex: number;
  movingCorner: Position;
  distance: number;
}

/**
 * Find the best snap for a box moving to a target position
 * Now properly tracks which corner of the moving box snaps to which snap point
 */
export function findBestSnap(
  boxPosition: Position,
  boxDimensions: { w: number; d: number; h: number },
  targetPosition: Position,
  snapPoints: SnapPoint[],
  enabledTypes: SnapType[] = ['grid', 'edge', 'corner', 'face', 'wall', 'floor']
): SnapResult {
  // Get the corners of the moving box at target position
  const movingCorners = getBoxCorners(targetPosition, boxDimensions.w, boxDimensions.d, boxDimensions.h);
  
  let bestMatch: SnapMatch | null = null;
  let bestEffectiveDistance = Infinity;
  const activeSnaps: SnapPoint[] = [];
  
  // Get the faces of the moving box for face-to-face snapping
  const movingFaces = getBoxFaces(targetPosition, boxDimensions.w, boxDimensions.d, boxDimensions.h);
  
  // Check each enabled snap type
  for (const point of snapPoints) {
    if (!enabledTypes.includes(point.type)) continue;
    
    const threshold = getThresholdForType(point.type);
    
    // For corner/edge snaps, check all corners of moving box and find the nearest
    if (point.type === 'corner' || point.type === 'edge') {
      for (let i = 0; i < movingCorners.length; i++) {
        const corner = movingCorners[i];
        const distance = Vec3.distance(corner, point.position);
        
        if (distance < threshold) {
          // Track as active for visualization
          if (!activeSnaps.includes(point)) {
            activeSnaps.push(point);
          }
          
          // Effective distance considers priority
          const effectiveDistance = distance / point.priority;
          
          if (effectiveDistance < bestEffectiveDistance) {
            bestEffectiveDistance = effectiveDistance;
            bestMatch = {
              snapPoint: point,
              movingCornerIndex: i,
              movingCorner: corner,
              distance,
            };
          }
        }
      }
    }
    
    // Face-to-face snap: align edges of boxes flush
    if (point.type === 'face' && point.faceAxis && point.faceValue !== undefined) {
      // Check if any face of the moving box aligns with this face
      for (const movingFace of movingFaces) {
        // Only compare faces on the same axis
        if (movingFace.axis !== point.faceAxis) continue;
        
        // Calculate distance between face values
        const faceDistance = Math.abs(movingFace.value - point.faceValue);
        
        if (faceDistance < threshold) {
          if (!activeSnaps.includes(point)) {
            activeSnaps.push(point);
          }
          
          const effectiveDistance = faceDistance / point.priority;
          
          if (effectiveDistance < bestEffectiveDistance) {
            bestEffectiveDistance = effectiveDistance;
            bestMatch = {
              snapPoint: { 
                ...point, 
                // Store which moving face value we're aligning
                label: `${movingFace.label} → ${point.label}`,
              },
              movingCornerIndex: -1, // Special: face snap, not corner
              movingCorner: { x: 0, y: 0, z: 0 }, // Not used for face snaps
              distance: faceDistance,
            };
          }
        }
      }
    }
    
    // Wall snap: check if back face (Y = boxPosition) is near Y=0
    if (point.type === 'wall') {
      const distToWall = Math.abs(targetPosition.y);
      if (distToWall < threshold) {
        activeSnaps.push(point);
        const effectiveDistance = distToWall / point.priority;
        if (effectiveDistance < bestEffectiveDistance) {
          bestEffectiveDistance = effectiveDistance;
          bestMatch = {
            snapPoint: point,
            movingCornerIndex: 0,
            movingCorner: movingCorners[0],
            distance: distToWall,
          };
        }
      }
    }
    
    // Floor snap: check if bottom (Z = boxPosition.z) is near Z=0
    if (point.type === 'floor') {
      const distToFloor = Math.abs(targetPosition.z);
      if (distToFloor < threshold) {
        activeSnaps.push(point);
        const effectiveDistance = distToFloor / point.priority;
        if (effectiveDistance < bestEffectiveDistance) {
          bestEffectiveDistance = effectiveDistance;
          bestMatch = {
            snapPoint: point,
            movingCornerIndex: 0,
            movingCorner: movingCorners[0],
            distance: distToFloor,
          };
        }
      }
    }
  }
  
  // Grid snap as fallback
  if (!bestMatch && enabledTypes.includes('grid')) {
    const snappedPos = {
      x: Math.round(targetPosition.x / SnapConfig.GRID_SIZE) * SnapConfig.GRID_SIZE,
      y: Math.round(targetPosition.y / SnapConfig.GRID_SIZE) * SnapConfig.GRID_SIZE,
      z: Math.round(targetPosition.z / SnapConfig.GRID_SIZE) * SnapConfig.GRID_SIZE,
    };
    
    const distToGrid = Vec3.distance(targetPosition, snappedPos);
    if (distToGrid < SnapConfig.GRID_SNAP_THRESHOLD) {
      return {
        snapped: true,
        position: snappedPos,
        snapPoint: {
          position: snappedPos,
          type: 'grid',
          priority: SnapConfig.PRIORITY.grid,
        },
        activeSnaps,
        distance: distToGrid,
      };
    }
  }
  
  if (bestMatch) {
    // Calculate snapped position based on which corner snaps to which point
    const snappedPosition = calculateSnappedPosition(
      targetPosition,
      boxDimensions,
      bestMatch.snapPoint,
      bestMatch.movingCorner,
      bestMatch.movingCornerIndex
    );
    
    // Calculate the actual snapping corner position after snap
    const threshold = getThresholdForType(bestMatch.snapPoint.type);
    const snappingCornerOffset = bestMatch.movingCornerIndex >= 0 
      ? getCornerOffset(bestMatch.movingCornerIndex, boxDimensions.w, boxDimensions.d, boxDimensions.h)
      : { x: 0, y: 0, z: 0 };
    const snappingCorner = {
      x: snappedPosition.x + snappingCornerOffset.x,
      y: snappedPosition.y + snappingCornerOffset.y,
      z: snappedPosition.z + snappingCornerOffset.z,
    };
    
    return {
      snapped: true,
      position: snappedPosition,
      snapPoint: bestMatch.snapPoint,
      activeSnaps,
      distance: bestMatch.distance,
      snappingCorner,
      snappingCornerIndex: bestMatch.movingCornerIndex,
      distanceToThreshold: threshold - bestMatch.distance,
    };
  }
  
  // Check if we're close to any snap point (for "magnetic pull" feedback)
  let closestDistance = Infinity;
  let closestThreshold = 0;
  for (const point of snapPoints) {
    if (!enabledTypes.includes(point.type)) continue;
    const threshold = getThresholdForType(point.type);
    
    // For corner/edge snaps, find closest corner
    if (point.type === 'corner' || point.type === 'edge') {
      for (const corner of movingCorners) {
        const dist = Vec3.distance(corner, point.position);
        if (dist < closestDistance) {
          closestDistance = dist;
          closestThreshold = threshold;
        }
      }
    }
  }
  
  return {
    snapped: false,
    position: targetPosition,
    snapPoint: null,
    activeSnaps,
    distance: Infinity,
    distanceToThreshold: closestThreshold > 0 ? closestThreshold - closestDistance : undefined,
  };
}

/**
 * Get snap threshold for a given type
 */
function getThresholdForType(type: SnapType): number {
  switch (type) {
    case 'corner': return SnapConfig.CORNER_SNAP_THRESHOLD;
    case 'face': return SnapConfig.FACE_SNAP_THRESHOLD;
    case 'edge': return SnapConfig.EDGE_SNAP_THRESHOLD;
    case 'wall': return SnapConfig.WALL_SNAP_THRESHOLD;
    case 'floor': return SnapConfig.FLOOR_SNAP_THRESHOLD;
    case 'grid': return SnapConfig.GRID_SNAP_THRESHOLD;
    default: return 100;
  }
}

/**
 * Get the offset of a corner from the box min corner (position)
 * Corner indices match getBoxCorners order:
 * 0: min corner (0,0,0)
 * 1: (w,0,0)
 * 2: (0,d,0)
 * 3: (w,d,0)
 * 4: (0,0,h)
 * 5: (w,0,h)
 * 6: (0,d,h)
 * 7: max corner (w,d,h)
 */
function getCornerOffset(cornerIndex: number, w: number, d: number, h: number): Position {
  const offsets: Position[] = [
    { x: 0, y: 0, z: 0 },       // 0: min corner
    { x: w, y: 0, z: 0 },       // 1
    { x: 0, y: d, z: 0 },       // 2
    { x: w, y: d, z: 0 },       // 3
    { x: 0, y: 0, z: h },       // 4
    { x: w, y: 0, z: h },       // 5
    { x: 0, y: d, z: h },       // 6
    { x: w, y: d, z: h },       // 7: max corner
  ];
  return offsets[cornerIndex] || { x: 0, y: 0, z: 0 };
}

/**
 * Calculate the snapped box position based on snap point
 * Now correctly positions the box so the snapping corner aligns with the snap point
 */
function calculateSnappedPosition(
  targetPosition: Position,
  boxDimensions: { w: number; d: number; h: number },
  snapPoint: SnapPoint,
  movingCorner: Position,
  cornerIndex: number
): Position {
  const result = Vec3.clone(targetPosition);
  const { w, d, h } = boxDimensions;
  
  switch (snapPoint.type) {
    case 'corner':
    case 'edge':
      // Calculate the offset from box position to the snapping corner
      const cornerOffset = getCornerOffset(cornerIndex, w, d, h);
      
      // New position places the snapping corner at the snap point
      // box.position + cornerOffset = snapPoint.position
      // Therefore: box.position = snapPoint.position - cornerOffset
      return {
        x: snapPoint.position.x - cornerOffset.x,
        y: snapPoint.position.y - cornerOffset.y,
        z: snapPoint.position.z - cornerOffset.z,
      };
      
    case 'face':
      // Face snap: align the nearest face of the moving box to the target face
      if (snapPoint.faceAxis && snapPoint.faceValue !== undefined) {
        // Get the faces of the moving box at target position
        const movingFaces = getBoxFaces(targetPosition, w, d, h);
        
        // Find the closest face on the same axis
        let closestDistance = Infinity;
        let faceOffset = 0;
        
        for (const movingFace of movingFaces) {
          if (movingFace.axis !== snapPoint.faceAxis) continue;
          const dist = Math.abs(movingFace.value - snapPoint.faceValue);
          if (dist < closestDistance) {
            closestDistance = dist;
            // Calculate offset needed to align faces
            faceOffset = snapPoint.faceValue - movingFace.value;
          }
        }
        
        // Apply the offset to align faces
        const snappedResult = Vec3.clone(targetPosition);
        snappedResult[snapPoint.faceAxis] += faceOffset;
        return snappedResult;
      }
      return result;
      
    case 'wall':
      // Back face at Y=0, so box position Y = 0 (front edge at Y=0)
      result.y = 0;
      return result;
      
    case 'floor':
      // Bottom at Z=0
      result.z = 0;
      return result;
      
    case 'grid':
      return snapPoint.position;
      
    default:
      return result;
  }
}

// ============================================
// AXIS LOCKING
// ============================================

export type LockedAxis = 'x' | 'y' | 'z' | null;

/**
 * Apply axis lock to movement
 */
export function applyAxisLock(
  currentPosition: Position,
  startPosition: Position,
  lockedAxis: LockedAxis
): Position {
  if (!lockedAxis) return currentPosition;
  
  // Keep only movement along locked axis
  const result = Vec3.clone(startPosition);
  result[lockedAxis] = currentPosition[lockedAxis];
  return result;
}

/**
 * Auto-detect dominant axis from movement
 * Uses 1.5x ratio instead of 2x for better responsiveness
 */
export function detectDominantAxis(
  currentPosition: Position,
  startPosition: Position,
  threshold: number = 30 // Lower threshold for faster response
): LockedAxis {
  const delta = Vec3.sub(currentPosition, startPosition);
  const absX = Math.abs(delta.x);
  const absY = Math.abs(delta.y);
  const absZ = Math.abs(delta.z);
  
  const max = Math.max(absX, absY, absZ);
  if (max < threshold) return null;
  
  // Use 1.5x ratio for more responsive axis detection (was 2x)
  const ratio = 1.5;
  if (absX === max && absX > absY * ratio && absX > absZ * ratio) return 'x';
  if (absY === max && absY > absX * ratio && absY > absZ * ratio) return 'y';
  if (absZ === max && absZ > absX * ratio && absZ > absY * ratio) return 'z';
  
  return null;
}
