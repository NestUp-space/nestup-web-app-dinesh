/**
 * Measurement Tool - Core logic for the Tape Measure tool
 * 
 * Features:
 * - Dual mode: Measure (distance) and Guide Create
 * - Hover measurement (edge length, face area)
 * - Smart snapping to inference points
 * - Guide line creation (parallel, perpendicular, axis-aligned)
 * 
 * Leverages existing utilities from snapSystem.ts and moveInference.ts
 */

import * as THREE from 'three';
import { 
  Position, 
  Box, 
  MeasurementResult, 
  MeasureGuideLine, 
  MeasureGuidePoint,
  HoverMeasurementInfo,
  BoxEdge,
} from '@/types/visualiser';
import { 
  getBoxCorners, 
  getBoxEdgeMidpoints,
} from './snapSystem';
import { 
  InferencePoint, 
  InferenceType,
  INFERENCE_COLORS,
} from './moveInference';

// ============================================
// CONSTANTS
// ============================================

export const MEASUREMENT_COLORS = {
  measureLine: '#00FF00',       // Green - active measurement line
  measureLineTemp: '#00FF00',   // Green with opacity for temp
  guideLineDefault: '#00FFFF',  // Cyan - guide lines
  guideLineX: '#EF4444',        // Red - X-axis guide
  guideLineY: '#22C55E',        // Green - Y-axis guide
  guideLineZ: '#3B82F6',        // Blue - Z-axis guide
  endpoint: '#FF0000',          // Red - measurement endpoints
  hoverTooltip: '#FFFF00',      // Yellow - hover tooltip background
};

export const MEASUREMENT_CONFIG = {
  SCREEN_THRESHOLD_PX: 15,      // Pixels for snap detection
  EDGE_HOVER_THRESHOLD: 20,     // Pixels for edge hover detection
  GUIDE_LINE_LENGTH: 20000,     // Infinite guide line extent
  MAX_HISTORY: 20,              // Maximum measurements to keep
  SNAP_THRESHOLD_MM: 50,        // World-space snap threshold
};

// ============================================
// COORDINATE CONVERSION
// ============================================

function dataToThree(p: Position): THREE.Vector3 {
  return new THREE.Vector3(p.x, p.z, p.y);
}

function threeToData(v: THREE.Vector3): Position {
  return { x: v.x, y: v.z, z: v.y };
}

function positionToVector3(p: Position): THREE.Vector3 {
  return new THREE.Vector3(p.x, p.y, p.z);
}

function vector3ToPosition(v: THREE.Vector3): Position {
  return { x: v.x, y: v.y, z: v.z };
}

// ============================================
// DISTANCE MEASUREMENT
// ============================================

/**
 * Calculate distance and deltas between two points
 */
export function measureDistance(
  point1: Position,
  point2: Position
): Omit<MeasurementResult, 'id' | 'timestamp'> {
  const v1 = positionToVector3(point1);
  const v2 = positionToVector3(point2);
  
  const distance = v1.distanceTo(v2);
  const deltaX = Math.abs(point2.x - point1.x);
  const deltaY = Math.abs(point2.y - point1.y);
  const deltaZ = Math.abs(point2.z - point1.z);
  
  return {
    distance,
    deltaX,
    deltaY,
    deltaZ,
    startPoint: point1,
    endPoint: point2,
  };
}

/**
 * Constrain target to a single axis from start (copy start, set result[axis] = target[axis])
 */
export function constrainToAxis(
  start: Position,
  target: Position,
  axis: 'x' | 'y' | 'z'
): Position {
  return { ...start, [axis]: target[axis] };
}

/**
 * Axis distance: if axis is null returns full 3D distance, else |end[axis] - start[axis]|
 */
export function getAxisDistance(
  start: Position,
  end: Position,
  axis: 'x' | 'y' | 'z' | null
): number {
  if (axis === null) {
    const v1 = positionToVector3(start);
    const v2 = positionToVector3(end);
    return v1.distanceTo(v2);
  }
  return Math.abs(end[axis] - start[axis]);
}

/**
 * Determine the dominant axis of a measurement
 */
export function getDominantAxis(
  point1: Position,
  point2: Position
): 'x' | 'y' | 'z' | '3d' {
  const deltaX = Math.abs(point2.x - point1.x);
  const deltaY = Math.abs(point2.y - point1.y);
  const deltaZ = Math.abs(point2.z - point1.z);
  
  const max = Math.max(deltaX, deltaY, deltaZ);
  const total = deltaX + deltaY + deltaZ;
  
  if (total < 0.001) return '3d';
  
  const ratio = max / total;
  if (ratio > 0.9) {
    if (max === deltaX) return 'x';
    if (max === deltaY) return 'y';
    return 'z';
  }
  
  return '3d';
}

// ============================================
// BOX EDGE EXTRACTION
// ============================================

/**
 * Get all 12 edges of a box
 */
export function getBoxEdges(box: Box): BoxEdge[] {
  const pos = box.position;
  const w = box.dimensions.lenX;
  const d = box.dimensions.lenY;
  const h = box.dimensions.lenZ;
  
  const corners = getBoxCorners(pos, w, d, h);
  
  const edgePairs: [number, number][] = [
    // Bottom face (z = 0)
    [0, 1], [1, 3], [3, 2], [2, 0],
    // Top face (z = h)
    [4, 5], [5, 7], [7, 6], [6, 4],
    // Vertical edges
    [0, 4], [1, 5], [3, 7], [2, 6],
  ];
  
  return edgePairs.map(([startIdx, endIdx], edgeIndex) => {
    const start = corners[startIdx];
    const end = corners[endIdx];
    
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    const direction: Position = length > 0 
      ? { x: dx / length, y: dy / length, z: dz / length }
      : { x: 0, y: 0, z: 0 };
    
    return {
      id: `${box.id}_edge_${edgeIndex}`,
      boxId: box.id,
      start,
      end,
      direction,
      length,
      edgeIndex,
    };
  });
}

/**
 * Get all edges from multiple boxes
 */
export function getAllBoxEdges(boxes: Box[]): BoxEdge[] {
  return boxes.flatMap(box => getBoxEdges(box));
}

// ============================================
// HOVER MEASUREMENT
// ============================================

/**
 * Project a point to screen coordinates
 */
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

/**
 * Calculate screen distance between two screen points
 */
function screenDistance(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Detect if cursor is hovering over an edge and return measurement info
 */
export function detectHoverMeasurement(
  camera: THREE.Camera,
  size: { width: number; height: number },
  cursorPx: { x: number; y: number },
  boxes: Box[]
): HoverMeasurementInfo | null {
  const threshold = MEASUREMENT_CONFIG.EDGE_HOVER_THRESHOLD;
  let bestMatch: HoverMeasurementInfo | null = null;
  let bestDistance = Infinity;
  
  for (const box of boxes) {
    const edges = getBoxEdges(box);
    
    for (const edge of edges) {
      const startScreen = projectToScreen(edge.start, camera, size.width, size.height);
      const endScreen = projectToScreen(edge.end, camera, size.width, size.height);
      
      // Calculate distance from cursor to edge line segment
      const edgeVecX = endScreen.x - startScreen.x;
      const edgeVecY = endScreen.y - startScreen.y;
      const edgeLenSq = edgeVecX * edgeVecX + edgeVecY * edgeVecY;
      
      if (edgeLenSq < 1) continue;
      
      const cursorVecX = cursorPx.x - startScreen.x;
      const cursorVecY = cursorPx.y - startScreen.y;
      
      // Project cursor onto edge line
      const t = Math.max(0, Math.min(1, (cursorVecX * edgeVecX + cursorVecY * edgeVecY) / edgeLenSq));
      
      const projX = startScreen.x + t * edgeVecX;
      const projY = startScreen.y + t * edgeVecY;
      
      const dist = screenDistance({ x: projX, y: projY }, cursorPx);
      
      if (dist < threshold && dist < bestDistance) {
        bestDistance = dist;
        
        // Calculate midpoint for tooltip position
        const midpoint: Position = {
          x: (edge.start.x + edge.end.x) / 2,
          y: (edge.start.y + edge.end.y) / 2,
          z: (edge.start.z + edge.end.z) / 2,
        };
        
        bestMatch = {
          type: 'edge',
          position: midpoint,
          screenPosition: { x: projX, y: projY },
          length: Math.round(edge.length),
          boxId: box.id,
          edgeIndex: edge.edgeIndex,
        };
      }
    }
    
    // Also check faces for area measurement
    const faces = getBoxFaces(box);
    for (const face of faces) {
      const centerScreen = projectToScreen(face.center, camera, size.width, size.height);
      const dist = screenDistance(centerScreen, cursorPx);
      
      if (dist < threshold * 2 && dist < bestDistance) {
        // Only use face if cursor is clearly over it (not edge)
        if (bestMatch?.type !== 'edge' || dist < bestDistance * 0.5) {
          bestDistance = dist;
          bestMatch = {
            type: 'face',
            position: face.center,
            screenPosition: centerScreen,
            area: Math.round(face.area),
            boxId: box.id,
          };
        }
      }
    }
  }
  
  return bestMatch;
}

// ============================================
// BOX FACE EXTRACTION
// ============================================

interface BoxFace {
  center: Position;
  normal: Position;
  area: number;
  corners: Position[];
}

/**
 * Get all 6 faces of a box with their areas
 */
function getBoxFaces(box: Box): BoxFace[] {
  const pos = box.position;
  const w = box.dimensions.lenX;
  const d = box.dimensions.lenY;
  const h = box.dimensions.lenZ;
  
  return [
    // Front face (y = 0)
    {
      center: { x: pos.x + w/2, y: pos.y, z: pos.z + h/2 },
      normal: { x: 0, y: -1, z: 0 },
      area: w * h,
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
      area: w * h,
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
      area: d * h,
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
      area: d * h,
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
      area: w * d,
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
      area: w * d,
      corners: [
        { x: pos.x, y: pos.y, z: pos.z + h },
        { x: pos.x + w, y: pos.y, z: pos.z + h },
        { x: pos.x + w, y: pos.y + d, z: pos.z + h },
        { x: pos.x, y: pos.y + d, z: pos.z + h },
      ]
    },
  ];
}

// ============================================
// GUIDE INTERSECTION
// ============================================

export interface GuideIntersection {
  position: Position;
  guides: [string, string];
}

const INTERSECTION_TOLERANCE_MM = 1;

/**
 * Pairwise line-line closest point; if distance < tolerance, treat as intersection.
 */
export function calculateGuideIntersections(
  guides: MeasureGuideLine[]
): GuideIntersection[] {
  const out: GuideIntersection[] = [];
  for (let i = 0; i < guides.length; i++) {
    for (let j = i + 1; j < guides.length; j++) {
      const g1 = guides[i];
      const g2 = guides[j];
      const O1 = g1.origin;
      const D1 = g1.direction;
      const O2 = g2.origin;
      const D2 = g2.direction;
      const w0 = {
        x: O1.x - O2.x,
        y: O1.y - O2.y,
        z: O1.z - O2.z,
      };
      const a = D1.x * D1.x + D1.y * D1.y + D1.z * D1.z;
      const b = D1.x * D2.x + D1.y * D2.y + D1.z * D2.z;
      const c = D2.x * D2.x + D2.y * D2.y + D2.z * D2.z;
      const d = D1.x * w0.x + D1.y * w0.y + D1.z * w0.z;
      const e = D2.x * w0.x + D2.y * w0.y + D2.z * w0.z;
      const denom = a * c - b * b;
      if (Math.abs(denom) < 1e-9) continue;
      const sc = (b * e - c * d) / denom;
      const tc = (a * e - b * d) / denom;
      const P1: Position = {
        x: O1.x + sc * D1.x,
        y: O1.y + sc * D1.y,
        z: O1.z + sc * D1.z,
      };
      const P2: Position = {
        x: O2.x + tc * D2.x,
        y: O2.y + tc * D2.y,
        z: O2.z + tc * D2.z,
      };
      const dist = Math.sqrt(
        (P1.x - P2.x) ** 2 + (P1.y - P2.y) ** 2 + (P1.z - P2.z) ** 2
      );
      if (dist <= INTERSECTION_TOLERANCE_MM) {
        out.push({
          position: {
            x: (P1.x + P2.x) / 2,
            y: (P1.y + P2.y) / 2,
            z: (P1.z + P2.z) / 2,
          },
          guides: [g1.id, g2.id],
        });
      }
    }
  }
  return out;
}

// ============================================
// INFERENCE DETECTION FOR MEASUREMENT
// ============================================

export interface MeasurementInferencePoint extends InferencePoint {
  screenDistance: number;
}

/**
 * Detect snap/inference points near cursor for measurement tool
 * Returns points within screen threshold, sorted by priority.
 * If guides are provided, adds "Guide Intersection" points where guides cross.
 */
export function detectMeasurementInferences(
  camera: THREE.Camera,
  size: { width: number; height: number },
  cursorPx: { x: number; y: number },
  boxes: Box[],
  excludeBoxId?: string,
  guides?: MeasureGuideLine[]
): MeasurementInferencePoint[] {
  const result: MeasurementInferencePoint[] = [];
  const threshold = MEASUREMENT_CONFIG.SCREEN_THRESHOLD_PX;
  
  const addedPositions = new Set<string>();
  const posKey = (p: Position) => `${Math.round(p.x)},${Math.round(p.y)},${Math.round(p.z)}`;
  
  const addIfUnique = (point: MeasurementInferencePoint) => {
    const key = posKey(point.position);
    if (!addedPositions.has(key)) {
      addedPositions.add(key);
      result.push(point);
    }
  };
  
  const PRIORITY = {
    endpoint: 10,
    guideIntersection: 9,
    midpoint: 8,
    center: 5,
    onEdge: 4,
    grid: 1,
  };
  
  for (const box of boxes) {
    if (box.id === excludeBoxId) continue;
    
    const { lenX: w, lenY: d, lenZ: h } = box.dimensions;
    const pos = box.position;
    
    // Endpoints (corners)
    const corners = getBoxCorners(pos, w, d, h);
    corners.forEach((p) => {
      const screen = projectToScreen(p, camera, size.width, size.height);
      const dist = screenDistance(screen, cursorPx);
      if (dist <= threshold) {
        addIfUnique({
          position: p,
          type: 'endpoint',
          label: 'Endpoint',
          priority: PRIORITY.endpoint,
          screenDistance: dist,
        });
      }
    });
    
    // Midpoints
    const midpoints = getBoxEdgeMidpoints(pos, w, d, h);
    midpoints.forEach((p) => {
      const screen = projectToScreen(p, camera, size.width, size.height);
      const dist = screenDistance(screen, cursorPx);
      if (dist <= threshold) {
        addIfUnique({
          position: p,
          type: 'midpoint',
          label: 'Midpoint',
          priority: PRIORITY.midpoint,
          screenDistance: dist,
        });
      }
    });
    
    // Center
    const center: Position = {
      x: pos.x + w / 2,
      y: pos.y + d / 2,
      z: pos.z + h / 2,
    };
    const centerScreen = projectToScreen(center, camera, size.width, size.height);
    const centerDist = screenDistance(centerScreen, cursorPx);
    if (centerDist <= threshold) {
      addIfUnique({
        position: center,
        type: 'center',
        label: 'Center',
        priority: PRIORITY.center,
        screenDistance: centerDist,
      });
    }
  }
  
  if (guides && guides.length >= 2) {
    const intersections = calculateGuideIntersections(guides);
    for (const inter of intersections) {
      const screen = projectToScreen(inter.position, camera, size.width, size.height);
      const dist = screenDistance(screen, cursorPx);
      if (dist <= threshold) {
        addIfUnique({
          position: inter.position,
          type: 'center',
          label: 'Guide Intersection',
          priority: PRIORITY.guideIntersection,
          screenDistance: dist,
        });
      }
    }
  }
  
  // Sort by priority (highest first), then by screen distance
  result.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.screenDistance - b.screenDistance;
  });
  
  return result;
}

// ============================================
// PERPENDICULAR OFFSET (for parallel guide from edge)
// ============================================

/**
 * Signed perpendicular distance from a point to an edge line.
 * Used for parallel guide preview and creation at cursor or typed offset.
 */
export function calculatePerpendicularOffset(edge: BoxEdge, point: Position): number {
  const dir = edge.direction;
  const toPoint = {
    x: point.x - edge.start.x,
    y: point.y - edge.start.y,
    z: point.z - edge.start.z,
  };
  const t = toPoint.x * dir.x + toPoint.y * dir.y + toPoint.z * dir.z;
  const projection: Position = {
    x: edge.start.x + t * dir.x,
    y: edge.start.y + t * dir.y,
    z: edge.start.z + t * dir.z,
  };
  const perp = {
    x: point.x - projection.x,
    y: point.y - projection.y,
    z: point.z - projection.z,
  };
  const up = { x: 0, y: 0, z: 1 };
  let perpDirX = dir.y * up.z - dir.z * up.y;
  let perpDirY = dir.z * up.x - dir.x * up.z;
  let perpDirZ = dir.x * up.y - dir.y * up.x;
  const perpLen = Math.sqrt(perpDirX * perpDirX + perpDirY * perpDirY + perpDirZ * perpDirZ);
  if (perpLen < 0.001) {
    perpDirX = 1; perpDirY = 0; perpDirZ = 0;
  } else {
    perpDirX /= perpLen; perpDirY /= perpLen; perpDirZ /= perpLen;
  }
  const signed = perp.x * perpDirX + perp.y * perpDirY + perp.z * perpDirZ;
  return signed;
}

// ============================================
// GUIDE LINE CREATION
// ============================================

/**
 * Create a parallel guide line from a reference edge
 */
export function createParallelGuide(
  referenceEdge: BoxEdge,
  offset: number
): Omit<MeasureGuideLine, 'id'> {
  const dir = referenceEdge.direction;
  
  // Calculate perpendicular direction (cross product with up vector)
  const up = { x: 0, y: 0, z: 1 };
  let perpX = dir.y * up.z - dir.z * up.y;
  let perpY = dir.z * up.x - dir.x * up.z;
  let perpZ = dir.x * up.y - dir.y * up.x;
  
  const perpLen = Math.sqrt(perpX * perpX + perpY * perpY + perpZ * perpZ);
  if (perpLen > 0.001) {
    perpX /= perpLen;
    perpY /= perpLen;
    perpZ /= perpLen;
  } else {
    // Edge is vertical, use X direction as perpendicular
    perpX = 1;
    perpY = 0;
    perpZ = 0;
  }
  
  // Calculate origin with offset
  const origin: Position = {
    x: referenceEdge.start.x + perpX * offset,
    y: referenceEdge.start.y + perpY * offset,
    z: referenceEdge.start.z + perpZ * offset,
  };
  
  return {
    origin,
    direction: dir,
    type: 'parallel',
    offset,
    referenceEdgeId: referenceEdge.id,
    visible: true,
    color: MEASUREMENT_COLORS.guideLineDefault,
  };
}

/**
 * Create an axis-aligned guide line through a point
 */
export function createAxisGuide(
  point: Position,
  axis: 'x' | 'y' | 'z'
): Omit<MeasureGuideLine, 'id'> {
  const direction: Position = {
    x: axis === 'x' ? 1 : 0,
    y: axis === 'y' ? 1 : 0,
    z: axis === 'z' ? 1 : 0,
  };
  
  const color = axis === 'x' 
    ? MEASUREMENT_COLORS.guideLineX 
    : axis === 'y' 
      ? MEASUREMENT_COLORS.guideLineY 
      : MEASUREMENT_COLORS.guideLineZ;
  
  return {
    origin: point,
    direction,
    type: axis === 'x' ? 'axis_x' : axis === 'y' ? 'axis_y' : 'axis_z',
    offset: 0,
    visible: true,
    color,
  };
}

/**
 * Create a point-to-point guide line
 */
export function createPointToPointGuide(
  point1: Position,
  point2: Position
): Omit<MeasureGuideLine, 'id'> {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const dz = point2.z - point1.z;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  const direction: Position = len > 0
    ? { x: dx / len, y: dy / len, z: dz / len }
    : { x: 1, y: 0, z: 0 };
  
  return {
    origin: point1,
    direction,
    type: 'point_to_point',
    offset: len,
    visible: true,
    color: MEASUREMENT_COLORS.guideLineDefault,
  };
}

// ============================================
// GUIDE POINT CREATION
// ============================================

/**
 * Create a guide point
 */
export function createGuidePoint(
  position: Position,
  type: MeasureGuidePoint['type'] = 'custom',
  label?: string
): Omit<MeasureGuidePoint, 'id'> {
  return {
    position,
    type,
    label,
  };
}

// ============================================
// NEAREST EDGE DETECTION
// ============================================

/**
 * Find the nearest edge to a cursor position
 */
export function findNearestEdge(
  camera: THREE.Camera,
  size: { width: number; height: number },
  cursorPx: { x: number; y: number },
  boxes: Box[]
): BoxEdge | null {
  let bestEdge: BoxEdge | null = null;
  let bestDistance = Infinity;
  const threshold = MEASUREMENT_CONFIG.EDGE_HOVER_THRESHOLD;
  
  for (const box of boxes) {
    const edges = getBoxEdges(box);
    
    for (const edge of edges) {
      const startScreen = projectToScreen(edge.start, camera, size.width, size.height);
      const endScreen = projectToScreen(edge.end, camera, size.width, size.height);
      
      const edgeVecX = endScreen.x - startScreen.x;
      const edgeVecY = endScreen.y - startScreen.y;
      const edgeLenSq = edgeVecX * edgeVecX + edgeVecY * edgeVecY;
      
      if (edgeLenSq < 1) continue;
      
      const cursorVecX = cursorPx.x - startScreen.x;
      const cursorVecY = cursorPx.y - startScreen.y;
      
      const t = Math.max(0, Math.min(1, (cursorVecX * edgeVecX + cursorVecY * edgeVecY) / edgeLenSq));
      
      const projX = startScreen.x + t * edgeVecX;
      const projY = startScreen.y + t * edgeVecY;
      
      const dist = screenDistance({ x: projX, y: projY }, cursorPx);
      
      if (dist < threshold && dist < bestDistance) {
        bestDistance = dist;
        bestEdge = edge;
      }
    }
  }
  
  return bestEdge;
}

// ============================================
// UTILITY: FLOOR PLANE INTERSECTION
// ============================================

/**
 * Get 3D position from screen coordinates by intersecting with floor plane
 */
export function getFloorPosition(
  raycaster: THREE.Raycaster,
  floorHeight: number = 0
): Position | null {
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -floorHeight);
  const intersect = new THREE.Vector3();
  
  if (raycaster.ray.intersectPlane(plane, intersect)) {
    return threeToData(intersect);
  }
  
  return null;
}

/**
 * Get 3D position from screen coordinates by intersecting with a plane at given height
 */
export function getPositionAtHeight(
  raycaster: THREE.Raycaster,
  height: number
): Position | null {
  // In Three.js, Y is up. Create horizontal plane at the given height (converted from data Z)
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -height);
  const intersect = new THREE.Vector3();
  
  if (raycaster.ray.intersectPlane(plane, intersect)) {
    return threeToData(intersect);
  }
  
  return null;
}

// ============================================
// CHAIN MEASUREMENT
// ============================================

export interface ChainMeasurement {
  points: Position[];
  segments: { start: Position; end: Position; distance: number }[];
  totalDistance: number;
}

/**
 * Create a chain measurement from multiple points
 */
export function createChainMeasurement(points: Position[]): ChainMeasurement {
  const segments: ChainMeasurement['segments'] = [];
  let totalDistance = 0;
  
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    const v1 = positionToVector3(start);
    const v2 = positionToVector3(end);
    const distance = v1.distanceTo(v2);
    
    segments.push({ start, end, distance });
    totalDistance += distance;
  }
  
  return {
    points,
    segments,
    totalDistance,
  };
}

// ============================================
// ANGLE MEASUREMENT
// ============================================

/**
 * Measure angle between three points (vertex is the middle point)
 */
export function measureAngle(
  point1: Position,
  vertex: Position,
  point2: Position
): number {
  const v1 = positionToVector3(point1).sub(positionToVector3(vertex)).normalize();
  const v2 = positionToVector3(point2).sub(positionToVector3(vertex)).normalize();
  
  const angle = v1.angleTo(v2);
  return THREE.MathUtils.radToDeg(angle);
}

// ============================================
// EXPORTS
// ============================================

export { INFERENCE_COLORS };
