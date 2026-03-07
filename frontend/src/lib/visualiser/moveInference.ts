/**
 * Move inference – detect snap points (endpoint, midpoint, center, onEdge, onFace, intersection, grid, origin)
 * for cursor-based snapping with screen-space distance threshold.
 *
 * Colors from SketchUp Ruby API documentation (exact hex values):
 * - endpoint: #00FF00 (green) — vertex at end of edge
 * - midpoint: #00FFFF (cyan) — center of edge
 * - onEdge: #FF0000 (red) — point along edge
 * - onFace: #0000CC (dark blue) — point on surface
 * - intersection: #FF0000 (red) — where edges cross
 * - origin: #FFFF00 (yellow) — model origin
 * - center: #00FF00 (green) — center of arc/circle/box
 * - inGroup: #FF00FF (magenta) — overrides all others inside groups
 * - grid: #9CA3AF (gray) — grid snap (Nestup-specific)
 */

import * as THREE from 'three';
import { Position, Box } from '@/types/visualiser';
import { getBoxCorners, getBoxEdgeMidpoints, generateGridPoints } from './snapSystem';

export type InferenceType =
  | 'endpoint'
  | 'midpoint'
  | 'center'
  | 'onEdge'
  | 'onFace'
  | 'intersection'
  | 'origin'
  | 'inGroup'
  | 'fromPoint'
  | 'grid';

export interface InferencePoint {
  position: Position;
  type: InferenceType;
  label: string;
  priority: number;
}

// SketchUp-exact inference colors from the Ruby API / SketchUp documentation
export const INFERENCE_COLORS: Record<InferenceType, string> = {
  endpoint:     '#00FF00',  // Green
  midpoint:     '#00FFFF',  // Cyan
  center:       '#00FF00',  // Green (center of arc/circle/box)
  onEdge:       '#FF0000',  // Red
  onFace:       '#0000CC',  // Dark Blue
  intersection: '#FF0000',  // Red
  origin:       '#FFFF00',  // Yellow
  inGroup:      '#FF00FF',  // Magenta (overrides all others inside groups)
  fromPoint:    '#FF00FF',  // Magenta ("From Point" axis-through-point inference)
  grid:         '#9CA3AF',  // Gray (Nestup-specific)
};

// SketchUp-exact indicator shapes: 'circle' | 'square' | 'diamond' | 'x'
export const INFERENCE_SHAPES: Record<InferenceType, 'circle' | 'square' | 'diamond' | 'x'> = {
  endpoint:     'circle',
  midpoint:     'circle',
  center:       'circle',
  onEdge:       'square',
  onFace:       'diamond',
  intersection: 'x',
  origin:       'circle',
  inGroup:      'circle',
  fromPoint:    'circle',
  grid:         'circle',
};

// Indicator size in pixels (SketchUp default from View.draw_points)
export const INDICATOR_SIZE = 6;

// Snap detection radius in screen pixels (SketchUp uses ~7-10)
export const SNAP_RADIUS_PX = 10;

// SketchUp-style priority order (higher = more important, matching spec Section 3)
const PRIORITY = {
  endpoint: 10,
  midpoint: 8,
  intersection: 7,
  center: 6,
  onEdge: 5,
  onFace: 4,
  origin: 3,
  fromPoint: 4,
  inGroup: 2,
  grid: 1,
};

const SCREEN_THRESHOLD_PX = SNAP_RADIUS_PX;
const EDGE_SNAP_THRESHOLD = 0.05;

function dataToThree(p: Position): THREE.Vector3 {
  return new THREE.Vector3(p.x, p.z, p.y);
}

function threeToData(v: THREE.Vector3): Position {
  return { x: v.x, y: v.z, z: v.y };
}

function projectToScreen(
  position: Position,
  camera: THREE.Camera,
  width: number,
  height: number
): { x: number; y: number } {
  const v = dataToThree(position);
  v.project(camera);
  const x = ((v.x + 1) / 2) * width;
  const y = (1 - (v.y + 1) / 2) * height;
  return { x, y };
}

function screenDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Get all 12 edges of a box as pairs of positions
 */
function getBoxEdges(pos: Position, w: number, d: number, h: number): [Position, Position][] {
  const corners = getBoxCorners(pos, w, d, h);
  
  // Bottom face edges (z = 0)
  // Top face edges (z = h)
  // Vertical edges connecting bottom to top
  // Corner layout (data coords):
  // 0:(x,y,z)  1:(x+w,y,z)  2:(x,y+d,z)  3:(x+w,y+d,z)
  // 4:(x,y,z+h) 5:(x+w,y,z+h) 6:(x,y+d,z+h) 7:(x+w,y+d,z+h)
  return [
    // Bottom face (z = 0)
    [corners[0], corners[1]], // left-front to right-front
    [corners[1], corners[3]], // right-front to right-back
    [corners[3], corners[2]], // right-back to left-back
    [corners[2], corners[0]], // left-back to left-front
    // Top face (z = h)
    [corners[4], corners[5]], // left-front to right-front
    [corners[5], corners[7]], // right-front to right-back
    [corners[7], corners[6]], // right-back to left-back
    [corners[6], corners[4]], // left-back to left-front
    // Vertical edges
    [corners[0], corners[4]],
    [corners[1], corners[5]],
    [corners[2], corners[6]],
    [corners[3], corners[7]],
  ];
}

/**
 * Get all 6 faces of a box as [center, normal] pairs
 */
function getBoxFaces(pos: Position, w: number, d: number, h: number): { center: Position; normal: Position; corners: Position[] }[] {
  return [
    // Front face (y = 0)
    {
      center: { x: pos.x + w/2, y: pos.y, z: pos.z + h/2 },
      normal: { x: 0, y: -1, z: 0 },
      corners: [
        { x: pos.x, y: pos.y, z: pos.z },
        { x: pos.x + w, y: pos.y, z: pos.z },
        { x: pos.x + w, y: pos.y, z: pos.z + h },
        { x: pos.x, y: pos.y, z: pos.z + h },
      ]
    },
    // Back face (y = d)
    {
      center: { x: pos.x + w/2, y: pos.y + d, z: pos.z + h/2 },
      normal: { x: 0, y: 1, z: 0 },
      corners: [
        { x: pos.x + w, y: pos.y + d, z: pos.z },
        { x: pos.x, y: pos.y + d, z: pos.z },
        { x: pos.x, y: pos.y + d, z: pos.z + h },
        { x: pos.x + w, y: pos.y + d, z: pos.z + h },
      ]
    },
    // Left face (x = 0)
    {
      center: { x: pos.x, y: pos.y + d/2, z: pos.z + h/2 },
      normal: { x: -1, y: 0, z: 0 },
      corners: [
        { x: pos.x, y: pos.y + d, z: pos.z },
        { x: pos.x, y: pos.y, z: pos.z },
        { x: pos.x, y: pos.y, z: pos.z + h },
        { x: pos.x, y: pos.y + d, z: pos.z + h },
      ]
    },
    // Right face (x = w)
    {
      center: { x: pos.x + w, y: pos.y + d/2, z: pos.z + h/2 },
      normal: { x: 1, y: 0, z: 0 },
      corners: [
        { x: pos.x + w, y: pos.y, z: pos.z },
        { x: pos.x + w, y: pos.y + d, z: pos.z },
        { x: pos.x + w, y: pos.y + d, z: pos.z + h },
        { x: pos.x + w, y: pos.y, z: pos.z + h },
      ]
    },
    // Bottom face (z = 0)
    {
      center: { x: pos.x + w/2, y: pos.y + d/2, z: pos.z },
      normal: { x: 0, y: 0, z: -1 },
      corners: [
        { x: pos.x, y: pos.y, z: pos.z },
        { x: pos.x + w, y: pos.y, z: pos.z },
        { x: pos.x + w, y: pos.y + d, z: pos.z },
        { x: pos.x, y: pos.y + d, z: pos.z },
      ]
    },
    // Top face (z = h)
    {
      center: { x: pos.x + w/2, y: pos.y + d/2, z: pos.z + h },
      normal: { x: 0, y: 0, z: 1 },
      corners: [
        { x: pos.x, y: pos.y, z: pos.z + h },
        { x: pos.x + w, y: pos.y, z: pos.z + h },
        { x: pos.x + w, y: pos.y + d, z: pos.z + h },
        { x: pos.x, y: pos.y + d, z: pos.z + h },
      ]
    },
  ];
}

/**
 * Project a point onto a line segment and check if it's on the segment.
 * Returns the projected point and parameter t (0-1 if on segment).
 */
function projectPointOntoEdge(
  point: Position, 
  edgeStart: Position, 
  edgeEnd: Position
): { point: Position; t: number; distance: number } {
  const px = point.x - edgeStart.x;
  const py = point.y - edgeStart.y;
  const pz = point.z - edgeStart.z;
  
  const ex = edgeEnd.x - edgeStart.x;
  const ey = edgeEnd.y - edgeStart.y;
  const ez = edgeEnd.z - edgeStart.z;
  
  const edgeLengthSq = ex*ex + ey*ey + ez*ez;
  if (edgeLengthSq < 0.001) {
    return { point: edgeStart, t: 0, distance: Math.sqrt(px*px + py*py + pz*pz) };
  }
  
  const t = Math.max(0, Math.min(1, (px*ex + py*ey + pz*ez) / edgeLengthSq));
  
  const projectedPoint = {
    x: edgeStart.x + t * ex,
    y: edgeStart.y + t * ey,
    z: edgeStart.z + t * ez,
  };
  
  const dx = point.x - projectedPoint.x;
  const dy = point.y - projectedPoint.y;
  const dz = point.z - projectedPoint.z;
  
  return {
    point: projectedPoint,
    t,
    distance: Math.sqrt(dx*dx + dy*dy + dz*dz),
  };
}

/**
 * Check if a point is inside a rectangular face (using 2D projection)
 */
function isPointInFace(point: Position, faceCorners: Position[]): boolean {
  if (faceCorners.length !== 4) return false;
  
  // Use cross product method to check if point is inside quad
  const isInsideTriangle = (p: Position, a: Position, b: Position, c: Position): boolean => {
    const v0 = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
    const v1 = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    const v2 = { x: p.x - a.x, y: p.y - a.y, z: p.z - a.z };
    
    const dot00 = v0.x*v0.x + v0.y*v0.y + v0.z*v0.z;
    const dot01 = v0.x*v1.x + v0.y*v1.y + v0.z*v1.z;
    const dot02 = v0.x*v2.x + v0.y*v2.y + v0.z*v2.z;
    const dot11 = v1.x*v1.x + v1.y*v1.y + v1.z*v1.z;
    const dot12 = v1.x*v2.x + v1.y*v2.y + v1.z*v2.z;
    
    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
    
    return (u >= -0.01) && (v >= -0.01) && (u + v <= 1.01);
  };
  
  // Check both triangles of the quad
  return isInsideTriangle(point, faceCorners[0], faceCorners[1], faceCorners[2]) ||
         isInsideTriangle(point, faceCorners[0], faceCorners[2], faceCorners[3]);
}

/**
 * Detect inference points near the cursor in screen space.
 * Returns points within SCREEN_THRESHOLD_PX, sorted by priority (highest first).
 * 
 * Includes: endpoint, midpoint, center, onEdge, onFace, intersection, grid
 */
const FROM_POINT_ALIGN_TOLERANCE = 2;

export function detectInferences(
  camera: THREE.Camera,
  size: { width: number; height: number },
  cursorPx: { x: number; y: number },
  selectedBox: Box | null,
  otherBoxes: Box[],
  aroundPosition: Position | null,
  excludeBoxId?: string,
  basePoint?: Position | null,
  /** When true, all returned points get type 'inGroup' (magenta override per spec Section 1) */
  insideGroup = false,
  /** "From Point" reference; when ghost is aligned on an axis through this point, add fromPoint inference */
  fromPoint?: Position | null,
): InferencePoint[] {
  const result: InferencePoint[] = [];
  const boxes = selectedBox ? [selectedBox, ...otherBoxes] : otherBoxes;

  // Track positions we've already added (to avoid duplicates)
  const addedPositions = new Set<string>();
  const posKey = (p: Position) => `${Math.round(p.x)},${Math.round(p.y)},${Math.round(p.z)}`;
  
  const addIfUnique = (point: InferencePoint) => {
    const key = posKey(point.position);
    if (!addedPositions.has(key)) {
      addedPositions.add(key);
      result.push(point);
    }
  };

  for (const box of boxes) {
    if (box.id === excludeBoxId) continue;
    const { lenX: w, lenY: d, lenZ: h } = box.dimensions;
    const pos = box.position;

    // === ENDPOINTS (corners) - highest priority ===
    const corners = getBoxCorners(pos, w, d, h);
    corners.forEach((p, i) => {
      const screen = projectToScreen(p, camera, size.width, size.height);
      if (screenDistance(screen, cursorPx) <= SCREEN_THRESHOLD_PX) {
        addIfUnique({
          position: p,
          type: 'endpoint',
          label: 'Endpoint',
          priority: PRIORITY.endpoint,
        });
      }
    });

    // === MIDPOINTS (edge midpoints) ===
    const midpoints = getBoxEdgeMidpoints(pos, w, d, h);
    midpoints.forEach((p) => {
      const screen = projectToScreen(p, camera, size.width, size.height);
      if (screenDistance(screen, cursorPx) <= SCREEN_THRESHOLD_PX) {
        addIfUnique({
          position: p,
          type: 'midpoint',
          label: 'Midpoint',
          priority: PRIORITY.midpoint,
        });
      }
    });

    // === ON EDGE (arbitrary point along edge) ===
    const edges = getBoxEdges(pos, w, d, h);
    for (const [edgeStart, edgeEnd] of edges) {
      // Create a ray from cursor position
      // For now, use screen-space projection to find closest point on edge
      const startScreen = projectToScreen(edgeStart, camera, size.width, size.height);
      const endScreen = projectToScreen(edgeEnd, camera, size.width, size.height);
      
      // Project cursor onto screen-space edge
      const edgeVecX = endScreen.x - startScreen.x;
      const edgeVecY = endScreen.y - startScreen.y;
      const edgeLenSq = edgeVecX * edgeVecX + edgeVecY * edgeVecY;
      
      if (edgeLenSq > 1) {
        const cursorVecX = cursorPx.x - startScreen.x;
        const cursorVecY = cursorPx.y - startScreen.y;
        const t = Math.max(0, Math.min(1, (cursorVecX * edgeVecX + cursorVecY * edgeVecY) / edgeLenSq));
        
        // Skip if too close to endpoints or midpoint (covered by those types)
        if (t > EDGE_SNAP_THRESHOLD && t < (0.5 - EDGE_SNAP_THRESHOLD) || 
            t > (0.5 + EDGE_SNAP_THRESHOLD) && t < (1 - EDGE_SNAP_THRESHOLD)) {
          const projScreenX = startScreen.x + t * edgeVecX;
          const projScreenY = startScreen.y + t * edgeVecY;
          const dist = screenDistance({ x: projScreenX, y: projScreenY }, cursorPx);
          
          if (dist <= SCREEN_THRESHOLD_PX) {
            // Interpolate 3D position
            const edgePoint: Position = {
              x: edgeStart.x + t * (edgeEnd.x - edgeStart.x),
              y: edgeStart.y + t * (edgeEnd.y - edgeStart.y),
              z: edgeStart.z + t * (edgeEnd.z - edgeStart.z),
            };
            addIfUnique({
              position: edgePoint,
              type: 'onEdge',
              label: 'On Edge',
              priority: PRIORITY.onEdge,
            });
          }
        }
      }
    }

    // === ON FACE (arbitrary point on face surface) ===
    const faces = getBoxFaces(pos, w, d, h);
    for (const face of faces) {
      const centerScreen = projectToScreen(face.center, camera, size.width, size.height);
      const dist = screenDistance(centerScreen, cursorPx);
      
      // Check if cursor is over this face (approximate using screen distance)
      if (dist <= SCREEN_THRESHOLD_PX * 3) {
        // Use raycasting to find exact point on face plane
        const raycaster = new THREE.Raycaster();
        const normalizedCursor = new THREE.Vector2(
          (cursorPx.x / size.width) * 2 - 1,
          -(cursorPx.y / size.height) * 2 + 1
        );
        raycaster.setFromCamera(normalizedCursor, camera);
        
        // Create plane from face
        const planeNormal = new THREE.Vector3(face.normal.x, face.normal.z, face.normal.y);
        const planePoint = dataToThree(face.center);
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, planePoint);
        
        const intersectPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(plane, intersectPoint)) {
          const dataPoint = threeToData(intersectPoint);
          
          // Check if point is within face bounds
          if (isPointInFace(dataPoint, face.corners)) {
            const pointScreen = projectToScreen(dataPoint, camera, size.width, size.height);
            if (screenDistance(pointScreen, cursorPx) <= SCREEN_THRESHOLD_PX) {
              addIfUnique({
                position: dataPoint,
                type: 'onFace',
                label: 'On Face',
                priority: PRIORITY.onFace,
              });
            }
          }
        }
      }
    }

    // === CENTER (box center) ===
    const center: Position = {
      x: pos.x + w / 2,
      y: pos.y + d / 2,
      z: pos.z + h / 2,
    };
    const centerScreen = projectToScreen(center, camera, size.width, size.height);
    if (screenDistance(centerScreen, cursorPx) <= SCREEN_THRESHOLD_PX) {
      addIfUnique({
        position: center,
        type: 'center',
        label: 'Center',
        priority: PRIORITY.center,
      });
    }

    // === INTERSECTION (where edges cross axis lines through base point) ===
    if (basePoint) {
      for (const [edgeStart, edgeEnd] of edges) {
        // Check X axis intersection (line through basePoint parallel to X)
        // Check Y axis intersection
        // Check Z axis intersection
        for (const axis of ['x', 'y', 'z'] as const) {
          // Create axis line endpoints extending far from base point
          const axisLine: [Position, Position] = [
            { ...basePoint },
            { ...basePoint },
          ];
          axisLine[0][axis] = basePoint[axis] - 5000;
          axisLine[1][axis] = basePoint[axis] + 5000;
          
          // Find intersection of edge with axis line (approximate using closest approach)
          const proj1 = projectPointOntoEdge(axisLine[0], edgeStart, edgeEnd);
          const proj2 = projectPointOntoEdge(axisLine[1], edgeStart, edgeEnd);
          
          // If both projections land on the edge and are close to axis line
          if (proj1.t > 0.01 && proj1.t < 0.99 && proj1.distance < 5) {
            const screen = projectToScreen(proj1.point, camera, size.width, size.height);
            if (screenDistance(screen, cursorPx) <= SCREEN_THRESHOLD_PX) {
              addIfUnique({
                position: proj1.point,
                type: 'intersection',
                label: `Intersection (${axis.toUpperCase()} Axis)`,
                priority: PRIORITY.intersection,
              });
            }
          }
        }
      }
    }
  }

  // === ORIGIN (model origin 0,0,0) ===
  const originScreen = projectToScreen({ x: 0, y: 0, z: 0 }, camera, size.width, size.height);
  if (screenDistance(originScreen, cursorPx) <= SCREEN_THRESHOLD_PX) {
    addIfUnique({
      position: { x: 0, y: 0, z: 0 },
      type: 'origin',
      label: 'Origin',
      priority: PRIORITY.origin,
    });
  }

  // === GRID points around cursor/ghost ===
  if (aroundPosition) {
    const gridPoints = generateGridPoints(aroundPosition, 50, 300);
    for (const gp of gridPoints) {
      const screen = projectToScreen(gp.position, camera, size.width, size.height);
      if (screenDistance(screen, cursorPx) <= SCREEN_THRESHOLD_PX) {
        addIfUnique({
          position: gp.position,
          type: 'grid',
          label: 'Grid',
          priority: PRIORITY.grid,
        });
      }
    }
  }

  // "From Point" inference: when Shift sets a reference point and ghost is aligned on an axis through it
  if (fromPoint && aroundPosition) {
    const tol = FROM_POINT_ALIGN_TOLERANCE;
    const matchX = Math.abs(aroundPosition.x - fromPoint.x) <= tol;
    const matchY = Math.abs(aroundPosition.y - fromPoint.y) <= tol;
    const matchZ = Math.abs(aroundPosition.z - fromPoint.z) <= tol;
    let axis: 'x' | 'y' | 'z' | null = null;
    if (matchX && matchY) axis = 'z';
    else if (matchX && matchZ) axis = 'y';
    else if (matchY && matchZ) axis = 'x';
    if (axis) {
      const screen = projectToScreen(fromPoint, camera, size.width, size.height);
      if (screenDistance(screen, cursorPx) <= SCREEN_THRESHOLD_PX) {
        addIfUnique({
          position: fromPoint,
          type: 'fromPoint',
          label: `From Point (${axis.toUpperCase()}-axis)`,
          priority: PRIORITY.fromPoint,
        });
      }
    }
  }

  // Spec Section 1: inside a group/component, ALL indicators turn magenta
  if (insideGroup) {
    for (const pt of result) {
      pt.type = 'inGroup';
    }
  }

  // Sort by priority (highest first)
  result.sort((a, b) => b.priority - a.priority);
  return result;
}
