/**
 * Surface Detection
 * RANSAC-based plane detection for point clouds
 */

import type { PointCloudData, DetectedSurface, BoundingBox, Position3D } from "@/types/visualiser";

// ============================================
// Types
// ============================================

interface Plane {
  a: number;
  b: number;
  c: number;
  d: number;
  inlierIndices: number[];
  confidence: number;
}

interface DetectionOptions {
  maxIterations?: number;
  distanceThreshold?: number;
  minInlierRatio?: number;
  maxPlanes?: number;
}

// ============================================
// RANSAC Helpers
// ============================================

/**
 * Calculates plane equation from 3 points
 * Returns null if points are collinear
 */
function planeFrom3Points(
  p1: [number, number, number],
  p2: [number, number, number],
  p3: [number, number, number]
): { a: number; b: number; c: number; d: number } | null {
  // Calculate two vectors in the plane
  const v1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
  const v2 = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
  
  // Cross product for normal
  const a = v1[1] * v2[2] - v1[2] * v2[1];
  const b = v1[2] * v2[0] - v1[0] * v2[2];
  const c = v1[0] * v2[1] - v1[1] * v2[0];
  
  // Normalize
  const length = Math.sqrt(a * a + b * b + c * c);
  if (length < 0.0001) return null; // Points are collinear
  
  const na = a / length;
  const nb = b / length;
  const nc = c / length;
  
  // Calculate d (plane passes through p1)
  const d = -(na * p1[0] + nb * p1[1] + nc * p1[2]);
  
  return { a: na, b: nb, c: nc, d };
}

/**
 * Calculates distance from point to plane
 */
function pointToPlaneDistance(
  x: number,
  y: number,
  z: number,
  plane: { a: number; b: number; c: number; d: number }
): number {
  return Math.abs(plane.a * x + plane.b * y + plane.c * z + plane.d);
}

/**
 * Gets a random index from array
 */
function randomIndex(max: number): number {
  return Math.floor(Math.random() * max);
}

// ============================================
// RANSAC Implementation
// ============================================

/**
 * RANSAC plane fitting
 */
function ransacPlane(
  positions: Float32Array,
  pointCount: number,
  options: DetectionOptions
): Plane | null {
  const {
    maxIterations = 1000,
    distanceThreshold = 10, // mm
    minInlierRatio = 0.05,
  } = options;
  
  let bestPlane: Plane | null = null;
  let bestInlierCount = 0;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // Pick 3 random points
    const i1 = randomIndex(pointCount);
    let i2 = randomIndex(pointCount);
    let i3 = randomIndex(pointCount);
    
    // Ensure distinct points
    while (i2 === i1) i2 = randomIndex(pointCount);
    while (i3 === i1 || i3 === i2) i3 = randomIndex(pointCount);
    
    const p1: [number, number, number] = [
      positions[i1 * 3],
      positions[i1 * 3 + 1],
      positions[i1 * 3 + 2],
    ];
    const p2: [number, number, number] = [
      positions[i2 * 3],
      positions[i2 * 3 + 1],
      positions[i2 * 3 + 2],
    ];
    const p3: [number, number, number] = [
      positions[i3 * 3],
      positions[i3 * 3 + 1],
      positions[i3 * 3 + 2],
    ];
    
    // Calculate plane
    const plane = planeFrom3Points(p1, p2, p3);
    if (!plane) continue;
    
    // Count inliers
    const inlierIndices: number[] = [];
    for (let i = 0; i < pointCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      
      const dist = pointToPlaneDistance(x, y, z, plane);
      if (dist < distanceThreshold) {
        inlierIndices.push(i);
      }
    }
    
    if (inlierIndices.length > bestInlierCount) {
      bestInlierCount = inlierIndices.length;
      bestPlane = {
        ...plane,
        inlierIndices,
        confidence: inlierIndices.length / pointCount,
      };
    }
    
    // Early termination if we found a good plane
    if (bestInlierCount / pointCount > 0.5) break;
  }
  
  // Check minimum inlier ratio
  if (bestPlane && bestPlane.confidence < minInlierRatio) {
    return null;
  }
  
  return bestPlane;
}

// ============================================
// Surface Classification
// ============================================

/**
 * Classifies a plane as floor, ceiling, or wall
 */
function classifyPlane(
  plane: { a: number; b: number; c: number; d: number },
  avgZ: number,
  boundsZ: [number, number]
): 'FLOOR' | 'CEILING' | 'WALL' | 'UNKNOWN' {
  // Normal vector
  const normal = { x: plane.a, y: plane.b, z: plane.c };
  
  // Horizontal plane = floor or ceiling (normal points up/down)
  const isHorizontal = Math.abs(normal.z) > 0.9;
  
  // Vertical plane = wall (normal is horizontal)
  const isVertical = Math.abs(normal.z) < 0.1;
  
  if (isHorizontal) {
    // Floor is typically near the minimum Z
    const distFromBottom = avgZ - boundsZ[0];
    const totalHeight = boundsZ[1] - boundsZ[0];
    
    if (distFromBottom < totalHeight * 0.2) {
      return 'FLOOR';
    } else if (distFromBottom > totalHeight * 0.8) {
      return 'CEILING';
    }
  }
  
  if (isVertical) {
    return 'WALL';
  }
  
  return 'UNKNOWN';
}

/**
 * Calculates bounds from inlier points
 */
function calculateSurfaceBounds(
  positions: Float32Array,
  inlierIndices: number[]
): BoundingBox {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  
  for (const idx of inlierIndices) {
    const x = positions[idx * 3];
    const y = positions[idx * 3 + 1];
    const z = positions[idx * 3 + 2];
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }
  
  return { minX, maxX, minY, maxY, minZ, maxZ };
}

/**
 * Calculates width and height of a surface
 */
function calculateSurfaceDimensions(
  bounds: BoundingBox,
  surfaceType: DetectedSurface['surfaceType']
): { width: number; height: number } {
  if (surfaceType === 'FLOOR' || surfaceType === 'CEILING') {
    // Horizontal surface: width and depth
    return {
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
    };
  } else {
    // Vertical surface: width and height
    const dx = bounds.maxX - bounds.minX;
    const dy = bounds.maxY - bounds.minY;
    const dz = bounds.maxZ - bounds.minZ;
    
    // Width is the larger horizontal dimension
    return {
      width: Math.max(dx, dy),
      height: dz,
    };
  }
}

// ============================================
// Main Detection Function
// ============================================

/**
 * Detects surfaces (floor, ceiling, walls) in a point cloud
 */
export function detectSurfaces(
  data: PointCloudData,
  options: DetectionOptions = {}
): DetectedSurface[] {
  const { maxPlanes = 10 } = options;
  const surfaces: DetectedSurface[] = [];
  
  // Copy positions for modification
  let remainingPositions = new Float32Array(data.positions);
  let remainingCount = data.pointCount;
  const originalIndices = Array.from({ length: data.pointCount }, (_, i) => i);
  
  const boundsZ: [number, number] = [data.bounds.minZ, data.bounds.maxZ];
  
  for (let planeIdx = 0; planeIdx < maxPlanes; planeIdx++) {
    if (remainingCount < 100) break; // Too few points
    
    // Find plane
    const plane = ransacPlane(remainingPositions, remainingCount, options);
    if (!plane) break;
    
    // Calculate average Z of inliers
    let avgZ = 0;
    for (const idx of plane.inlierIndices) {
      avgZ += remainingPositions[idx * 3 + 2];
    }
    avgZ /= plane.inlierIndices.length;
    
    // Classify surface
    const surfaceType = classifyPlane(plane, avgZ, boundsZ);
    
    // Calculate bounds
    const bounds = calculateSurfaceBounds(remainingPositions, plane.inlierIndices);
    const { width, height } = calculateSurfaceDimensions(bounds, surfaceType);
    
    // Create surface
    const surface: DetectedSurface = {
      id: `surface-${Date.now()}-${planeIdx}`,
      surfaceType,
      confidence: plane.confidence,
      planeA: plane.a,
      planeB: plane.b,
      planeC: plane.c,
      planeD: plane.d,
      bounds,
      width,
      height,
      isConfirmed: false,
    };
    
    surfaces.push(surface);
    
    // Remove inliers from remaining points
    const keepIndices = new Set(
      Array.from({ length: remainingCount }, (_, i) => i)
        .filter(i => !plane.inlierIndices.includes(i))
    );
    
    const newPositions = new Float32Array(keepIndices.size * 3);
    let newIdx = 0;
    keepIndices.forEach(idx => {
      newPositions[newIdx * 3] = remainingPositions[idx * 3];
      newPositions[newIdx * 3 + 1] = remainingPositions[idx * 3 + 1];
      newPositions[newIdx * 3 + 2] = remainingPositions[idx * 3 + 2];
      newIdx++;
    });
    
    remainingPositions = newPositions;
    remainingCount = keepIndices.size;
  }
  
  // Sort by confidence
  surfaces.sort((a, b) => b.confidence - a.confidence);
  
  // Filter to keep only walls
  const walls = surfaces.filter(s => s.surfaceType === 'WALL');
  
  return walls;
}

export default {
  detectSurfaces,
};
