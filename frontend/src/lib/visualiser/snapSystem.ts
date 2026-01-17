/**
 * Snap System
 * Handles snapping boxes to grid, edges, and other objects
 */

import type { 
  DesignerBox, 
  DesignerWall, 
  Position3D,
  SnapSettings,
  SnapPoint,
  SnapResult,
  SnapIndicator,
} from "@/types/visualiser";
import { getBoxBounds } from "./collisionDetection";

// ============================================
// Snap Point Generation
// ============================================

/**
 * Generates snap points for a wall
 */
export function getWallSnapPoints(wall: DesignerWall): SnapPoint[] {
  const points: SnapPoint[] = [];
  
  // Floor corners
  points.push(
    { type: 'endpoint', position: { x: 0, y: 0, z: 0 }, color: '#3B82F6' },
    { type: 'endpoint', position: { x: wall.width, y: 0, z: 0 }, color: '#3B82F6' },
    { type: 'endpoint', position: { x: 0, y: wall.depth, z: 0 }, color: '#3B82F6' },
    { type: 'endpoint', position: { x: wall.width, y: wall.depth, z: 0 }, color: '#3B82F6' },
  );
  
  // Wall midpoints
  points.push(
    { type: 'midpoint', position: { x: wall.width / 2, y: 0, z: 0 }, color: '#22C55E' },
    { type: 'midpoint', position: { x: 0, y: wall.depth / 2, z: 0 }, color: '#22C55E' },
    { type: 'midpoint', position: { x: wall.width, y: wall.depth / 2, z: 0 }, color: '#22C55E' },
    { type: 'midpoint', position: { x: wall.width / 2, y: wall.depth, z: 0 }, color: '#22C55E' },
  );
  
  return points;
}

/**
 * Generates snap points for a box (edges and centers)
 */
export function getBoxSnapPoints(box: DesignerBox): SnapPoint[] {
  const bounds = getBoxBounds(box);
  const points: SnapPoint[] = [];
  
  // Bottom corners
  points.push(
    { type: 'endpoint', position: { x: bounds.minX, y: bounds.minY, z: bounds.minZ }, color: '#3B82F6', sourceId: box.id },
    { type: 'endpoint', position: { x: bounds.maxX, y: bounds.minY, z: bounds.minZ }, color: '#3B82F6', sourceId: box.id },
    { type: 'endpoint', position: { x: bounds.minX, y: bounds.maxY, z: bounds.minZ }, color: '#3B82F6', sourceId: box.id },
    { type: 'endpoint', position: { x: bounds.maxX, y: bounds.maxY, z: bounds.minZ }, color: '#3B82F6', sourceId: box.id },
  );
  
  // Top corners
  points.push(
    { type: 'endpoint', position: { x: bounds.minX, y: bounds.minY, z: bounds.maxZ }, color: '#3B82F6', sourceId: box.id },
    { type: 'endpoint', position: { x: bounds.maxX, y: bounds.minY, z: bounds.maxZ }, color: '#3B82F6', sourceId: box.id },
    { type: 'endpoint', position: { x: bounds.minX, y: bounds.maxY, z: bounds.maxZ }, color: '#3B82F6', sourceId: box.id },
    { type: 'endpoint', position: { x: bounds.maxX, y: bounds.maxY, z: bounds.maxZ }, color: '#3B82F6', sourceId: box.id },
  );
  
  // Edge midpoints (bottom)
  points.push(
    { type: 'midpoint', position: { x: (bounds.minX + bounds.maxX) / 2, y: bounds.minY, z: bounds.minZ }, color: '#22C55E', sourceId: box.id },
    { type: 'midpoint', position: { x: bounds.minX, y: (bounds.minY + bounds.maxY) / 2, z: bounds.minZ }, color: '#22C55E', sourceId: box.id },
    { type: 'midpoint', position: { x: bounds.maxX, y: (bounds.minY + bounds.maxY) / 2, z: bounds.minZ }, color: '#22C55E', sourceId: box.id },
    { type: 'midpoint', position: { x: (bounds.minX + bounds.maxX) / 2, y: bounds.maxY, z: bounds.minZ }, color: '#22C55E', sourceId: box.id },
  );
  
  // Center
  points.push({
    type: 'center',
    position: {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
      z: (bounds.minZ + bounds.maxZ) / 2,
    },
    color: '#EAB308',
    sourceId: box.id,
  });
  
  // Edge lines (for edge-to-edge snapping)
  points.push(
    { type: 'edge', position: { x: bounds.minX, y: 0, z: 0 }, color: '#8B5CF6', sourceId: box.id },
    { type: 'edge', position: { x: bounds.maxX, y: 0, z: 0 }, color: '#8B5CF6', sourceId: box.id },
  );
  
  return points;
}

/**
 * Generates grid snap points
 */
export function getGridSnapPoints(
  gridSize: number,
  wallWidth: number,
  wallDepth: number
): SnapPoint[] {
  const points: SnapPoint[] = [];
  
  for (let x = 0; x <= wallWidth; x += gridSize) {
    for (let y = 0; y <= wallDepth; y += gridSize) {
      points.push({
        type: 'grid',
        position: { x, y, z: 0 },
        color: '#9CA3AF',
      });
    }
  }
  
  return points;
}

// ============================================
// Snapping Logic
// ============================================

/**
 * Finds the nearest snap point within snap distance
 */
export function findNearestSnapPoint(
  position: Position3D,
  snapPoints: SnapPoint[],
  snapDistance: number
): SnapPoint | null {
  let nearest: SnapPoint | null = null;
  let minDistance = snapDistance;
  
  for (const point of snapPoints) {
    const dx = position.x - point.position.x;
    const dy = position.y - point.position.y;
    const dz = position.z - point.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearest = point;
    }
  }
  
  return nearest;
}

/**
 * Snaps a position to the grid
 */
export function snapToGrid(
  position: Position3D,
  gridSize: number
): Position3D {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
    z: Math.round(position.z / gridSize) * gridSize,
  };
}

/**
 * Snaps to floor (Z=0)
 */
export function snapToFloor(position: Position3D, skirtingHeight: number = 0): Position3D {
  return {
    ...position,
    z: skirtingHeight,
  };
}

/**
 * Snaps to wall surface (Y=0)
 */
export function snapToWallSurface(position: Position3D): Position3D {
  return {
    ...position,
    y: 0,
  };
}

/**
 * Snaps box edge to another box's edge
 */
export function snapToBoxEdge(
  position: Position3D,
  boxWidth: number,
  existingBoxes: DesignerBox[],
  snapDistance: number
): { position: Position3D; snappedTo: string | null } {
  let snappedPosition = { ...position };
  let snappedTo: string | null = null;
  
  for (const box of existingBoxes) {
    const bounds = getBoxBounds(box);
    
    // Left edge to right edge
    const leftToRight = Math.abs(position.x - bounds.maxX);
    if (leftToRight < snapDistance) {
      snappedPosition.x = bounds.maxX;
      snappedTo = box.id;
    }
    
    // Right edge to left edge
    const rightToLeft = Math.abs(position.x + boxWidth - bounds.minX);
    if (rightToLeft < snapDistance) {
      snappedPosition.x = bounds.minX - boxWidth;
      snappedTo = box.id;
    }
  }
  
  return { position: snappedPosition, snappedTo };
}

// ============================================
// Main Snap Function
// ============================================

/**
 * Applies all enabled snap rules to a position
 */
export function applySnapping(
  position: Position3D,
  boxWidth: number,
  boxDepth: number,
  boxHeight: number,
  skirtingHeight: number,
  settings: SnapSettings,
  wall: DesignerWall,
  existingBoxes: DesignerBox[],
  excludeBoxId?: string
): SnapResult {
  if (!settings.enabled) {
    return { snapped: false, position };
  }
  
  let snappedPosition = { ...position };
  const indicators: SnapIndicator[] = [];
  let snapType: SnapPoint['type'] | undefined;
  
  // Filter out the box being moved
  const otherBoxes = existingBoxes.filter(b => b.id !== excludeBoxId);
  
  // 1. Floor snap (always snap Z to skirting height for base units)
  if (settings.floorSnap) {
    snappedPosition = snapToFloor(snappedPosition, skirtingHeight);
    if (Math.abs(position.z - snappedPosition.z) > 0.1) {
      indicators.push({
        start: { x: snappedPosition.x, y: snappedPosition.y, z: 0 },
        end: { x: snappedPosition.x + boxWidth, y: snappedPosition.y, z: 0 },
        color: '#22C55E',
        label: 'Floor',
      });
    }
  }
  
  // 2. Wall snap (snap Y to 0 for wall-mounted units)
  if (settings.wallSnap && Math.abs(snappedPosition.y) < settings.snapDistance) {
    snappedPosition = snapToWallSurface(snappedPosition);
    snapType = 'face';
  }
  
  // 3. Box edge snap
  if (settings.boxEdgeSnap) {
    const { position: edgeSnapped, snappedTo } = snapToBoxEdge(
      snappedPosition,
      boxWidth,
      otherBoxes,
      settings.snapDistance
    );
    
    if (snappedTo) {
      snappedPosition = edgeSnapped;
      snapType = 'edge';
      
      // Add indicator line
      indicators.push({
        start: { x: snappedPosition.x, y: snappedPosition.y, z: snappedPosition.z },
        end: { x: snappedPosition.x, y: snappedPosition.y, z: snappedPosition.z + boxHeight },
        color: '#3B82F6',
      });
    }
  }
  
  // 4. Grid snap
  if (settings.gridSnap) {
    const gridSnapped = snapToGrid(snappedPosition, settings.gridSize);
    
    // Only apply if close to grid line
    if (Math.abs(snappedPosition.x - gridSnapped.x) < settings.snapDistance) {
      snappedPosition.x = gridSnapped.x;
      snapType = 'grid';
    }
    if (Math.abs(snappedPosition.y - gridSnapped.y) < settings.snapDistance) {
      snappedPosition.y = gridSnapped.y;
      snapType = 'grid';
    }
  }
  
  // 5. Corner snap (wall corners)
  if (settings.cornerSnap) {
    // Left wall corner
    if (Math.abs(snappedPosition.x) < settings.snapDistance) {
      snappedPosition.x = 0;
      snapType = 'endpoint';
    }
    // Right wall corner
    if (Math.abs(snappedPosition.x + boxWidth - wall.width) < settings.snapDistance) {
      snappedPosition.x = wall.width - boxWidth;
      snapType = 'endpoint';
    }
  }
  
  // Clamp to wall bounds
  snappedPosition.x = Math.max(0, Math.min(wall.width - boxWidth, snappedPosition.x));
  snappedPosition.y = Math.max(0, Math.min(wall.depth - boxDepth, snappedPosition.y));
  
  const snapped = 
    Math.abs(position.x - snappedPosition.x) > 0.1 ||
    Math.abs(position.y - snappedPosition.y) > 0.1 ||
    Math.abs(position.z - snappedPosition.z) > 0.1;
  
  return {
    snapped,
    position: snappedPosition,
    snapType,
    snapIndicators: indicators.length > 0 ? indicators : undefined,
  };
}

export default {
  getWallSnapPoints,
  getBoxSnapPoints,
  getGridSnapPoints,
  findNearestSnapPoint,
  snapToGrid,
  snapToFloor,
  snapToWallSurface,
  snapToBoxEdge,
  applySnapping,
};
