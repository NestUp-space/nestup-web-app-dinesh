/**
 * CNC G-code Generator
 * EXACT PORT from Apps Script "gcode.js" version 9.1.0
 * 
 * Features:
 * - T1 Profile Cutting (rectangles & L-cuts)
 * - T2 Slot/Groove Tool
 * - T3 Screw Holes (through-cut)
 * - T4 VB Main
 * - T5 Hinge Holes
 * - T6 VB Double
 * - L-cut support with triplet coordinates
 * - Folder structure: Material -> Thickness
 * - ZIP download
 */

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { NestResult } from '@/types/visualiser';

// ============================================
// TYPES
// ============================================

interface Position {
  x: number;
  y: number;
}

interface LCutTriplet {
  start: Position;
  center: Position;
  end: Position;
  legacy?: boolean;
  x?: number;
  y?: number;
}

interface SlotFeature {
  type: string;
  x: number;
  y: number;
  length: number;
  width: number;
  depth: number;
}

interface PlankFeatures {
  screws: Position[];
  hinges: Position[];
  vb_main: Position[];
  vb_double: Position[];
  slots: SlotFeature[];
  l_cuts: LCutTriplet[];
  gola_profiles: LCutTriplet[];
}

interface GCodePlank {
  id: string;
  name: string;
  material: string;
  thickness: number;
  sheet: string;
  x: number;
  y: number;
  placedWidth: number;
  placedHeight: number;
  rotated: boolean;
  features: PlankFeatures;
}

interface GCodeResult {
  sheetName: string;
  fileName: string;
  materialFolder: string;
  thicknessFolder: string;
  content: string;
  plankCount: number;
}

// ============================================
// MACHINE CONSTANTS (From Apps Script)
// ============================================

const Z_SAFE = 26.0;  // Safe Z height for rapid moves
const MIN_COORDINATE_VALUE = 0.0;  // Non-negative coordinates
const Z_THROUGH_CUT_FINAL_HEIGHT = -0.01;  // Through-cut depth (just below spoil board)
const SPINDLE_SPEED = 18000;
const CUTTING_FEED_RATE = 12000;
const PLUNGE_FEED_RATE = 6000.0;
const BIT_RADIUS = 4;
const TOOL_DIAMETER_T1 = 8;
const TOOL_DIAMETER_T2 = 10;
const EDGE_THRESHOLD = BIT_RADIUS + 2.0;

// Tool depths (distance DOWN from top of material)
const FIXED_DEPTHS = {
  T4: 16,  // VB Main
  T5: 14,  // Hinge Hole
  T6: 11,  // VB Double
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert NestResult to GCodePlank format
 */
function convertToGCodePlank(nestResult: NestResult): GCodePlank {
  const features: PlankFeatures = {
    screws: [],
    hinges: [],
    vb_main: [],
    vb_double: [],
    slots: [],
    l_cuts: nestResult.l_cuts ?? [],
    gola_profiles: nestResult.gola_profiles ?? [],
  };

  // Extract features from NestResult holes
  if (nestResult.holes) {
    nestResult.holes.forEach((hole) => {
      const type = (hole.type || '').toLowerCase();
      
      if (type.includes('screw')) {
        features.screws.push({ x: hole.x, y: hole.y });
      } else if (type.includes('hinge') || type.includes('hing')) {
        features.hinges.push({ x: hole.x, y: hole.y });
      } else if (type.includes('vb_main')) {
        features.vb_main.push({ x: hole.x, y: hole.y });
      } else if (type.includes('vb_double')) {
        features.vb_double.push({ x: hole.x, y: hole.y });
      } else if (type.includes('slot') || type.includes('groove') || type.includes('profile')) {
        if (hole.isRectangular) {
          features.slots.push({
            type: type,
            x: hole.x,
            y: hole.y,
            length: hole.length || 0,
            width: hole.width || 0,
            depth: (hole as { depth?: number }).depth || 10, // Default depth
          });
        }
      } else if (type.includes('l_cut') || type.includes('l-cut')) {
        // L-cuts are handled separately
      }
    });
  }

  return {
    id: nestResult.id,
    name: nestResult.name,
    material: nestResult.material,
    thickness: nestResult.thickness,
    sheet: String(nestResult.sheetNum),
    x: nestResult.x,
    y: nestResult.y,
    placedWidth: nestResult.width,
    placedHeight: nestResult.height,
    rotated: nestResult.rotated,
    features,
  };
}

/**
 * Group planks by material and thickness
 */
function groupByMaterialAndThickness(planks: GCodePlank[]): Map<string, {
  materialFolder: string;
  thicknessFolder: string;
  sheets: Map<string, GCodePlank[]>;
}> {
  const groups = new Map<string, {
    materialFolder: string;
    thicknessFolder: string;
    sheets: Map<string, GCodePlank[]>;
  }>();

  planks.forEach((plank) => {
    // Clean material name (remove room info in parentheses)
    const cleanMaterial = plank.material.trim().replace(/\s*\(.*?\)/, '').trim();
    const folderName = cleanMaterial.replace(/\s+/g, '_');
    const thicknessKey = `${Math.round(plank.thickness)}MM`;
    const groupKey = `${folderName}_${thicknessKey}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        materialFolder: folderName,
        thicknessFolder: thicknessKey,
        sheets: new Map(),
      });
    }

    const group = groups.get(groupKey)!;
    if (!group.sheets.has(plank.sheet)) {
      group.sheets.set(plank.sheet, []);
    }
    group.sheets.get(plank.sheet)!.push(plank);
  });

  return groups;
}

/**
 * Calculate lateral passes for slot tool
 */
function getLateralPaths(slotWidth: number, toolDiameter: number): { numPasses: number; offsets: number[] } {
  const D = toolDiameter;
  const W = slotWidth;
  const offsets: number[] = [];

  if (W <= D + 0.01) {
    offsets.push(0);
  } else if (W <= 20.0) {
    const O = (W - D) / 2.0;
    offsets.push(-O, O);
  } else if (W <= 30.0) {
    const O = (W - D) / 2.0;
    offsets.push(-O, 0, O);
  } else {
    const O = (30.0 - D) / 2.0;
    offsets.push(-O, 0, O);
  }

  return { numPasses: offsets.length, offsets };
}

/**
 * Get profile pass depths based on thickness
 */
function getProfilePassDepths(thickness: number): number[] {
  const passFinalDepth = Z_THROUGH_CUT_FINAL_HEIGHT;
  if (thickness > 12) {
    const pass1Depth = thickness / 2.0;
    return [pass1Depth, passFinalDepth];
  } else {
    return [passFinalDepth];
  }
}

/**
 * Calculate profile coordinates for rectangles
 */
function calculateProfileCoordinates(x: number, y: number, width: number, height: number, bitRadius: number) {
  return {
    p1: { x: x - bitRadius, y: y - bitRadius },
    p2: { x: x + width + bitRadius, y: y - bitRadius },
    p3: { x: x + width + bitRadius, y: y + height + bitRadius },
    p4: { x: x - bitRadius, y: y + height + bitRadius },
  };
}

// ============================================
// G-CODE GENERATION FUNCTIONS
// ============================================

/**
 * Generate tool start sequence
 */
function outputToolStart(toolNumber: string): string[] {
  const toolNum = toolNumber.slice(1);
  return [
    `T${toolNum}`,
    `G43 H${toolNum}`,
    `M03 S${SPINDLE_SPEED}`,
    `G00 Z${Z_SAFE.toFixed(4)}`,
  ];
}

/**
 * Process hole tools (T3-T6)
 */
function processTool(
  toolNumber: string,
  featureType: keyof PlankFeatures,
  planks: GCodePlank[],
  depthCalculator: (plank: GCodePlank) => number
): string[] {
  const gcode: string[] = [];
  let hasOperations = false;

  planks.forEach((plank) => {
    const features = plank.features[featureType] as Position[];
    if (features && features.length > 0) {
      if (!hasOperations) {
        gcode.push(...outputToolStart(toolNumber));
        hasOperations = true;
      }

      const Z_APPROACH = plank.thickness;

      features.forEach((feature) => {
        const finalX = Math.max(feature.x, MIN_COORDINATE_VALUE);
        const finalY = Math.max(feature.y, MIN_COORDINATE_VALUE);
        const finalDepth = depthCalculator(plank);

        gcode.push(`G00 X${finalX.toFixed(4)} Y${finalY.toFixed(4)} Z${Z_SAFE.toFixed(4)}`);
        gcode.push(`G00 Z${Z_APPROACH.toFixed(4)}`);
        gcode.push(`G01 Z${finalDepth.toFixed(4)} F${PLUNGE_FEED_RATE.toFixed(4)}`);
        gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);
      });
    }
  });

  if (hasOperations) {
    gcode.push('M05');
  }

  return gcode;
}

/**
 * Generate G-code for a single slot/groove using serpentine pattern (one plunge, then back-and-forth).
 * T2 and T1 narrow grooves use this. toolDiameter is TOOL_DIAMETER_T2 or TOOL_DIAMETER_T1.
 */
function generateSlotGCode(plank: GCodePlank, slot: SlotFeature, Z_APPROACH: number, toolDiameter: number): string[] {
  const gcode: string[] = [];
  const W = slot.width;
  const Length = slot.length;
  const plankThickness = plank.thickness;

  let Xs_center: number, Ys_center: number, Xe_center: number, Ye_center: number;

  if (plank.rotated) {
    Xs_center = slot.x;
    Ys_center = slot.y + W / 2.0;
    Xe_center = Xs_center + Length;
    Ye_center = Ys_center;
  } else {
    Xs_center = slot.x + W / 2.0;
    Ys_center = slot.y;
    Xe_center = Xs_center;
    Ye_center = Ys_center + Length;
  }

  const finalCutZ = Math.max(plankThickness - slot.depth, Z_THROUGH_CUT_FINAL_HEIGHT);
  const { offsets } = getLateralPaths(slot.width, toolDiameter);

  const paths = offsets.map((offset) => {
    let Xs_path: number, Ys_path: number, Xe_path: number, Ye_path: number;
    if (plank.rotated) {
      Xs_path = Xs_center;
      Ys_path = Ys_center + offset;
      Xe_path = Xe_center;
      Ye_path = Ye_center + offset;
    } else {
      Xs_path = Xs_center + offset;
      Ys_path = Ys_center;
      Xe_path = Xe_center + offset;
      Ye_path = Ye_center;
    }
    return {
      Xs: Math.max(Xs_path, MIN_COORDINATE_VALUE),
      Ys: Math.max(Ys_path, MIN_COORDINATE_VALUE),
      Xe: Math.max(Xe_path, MIN_COORDINATE_VALUE),
      Ye: Math.max(Ye_path, MIN_COORDINATE_VALUE),
    };
  });

  if (paths.length === 0) return gcode;

  gcode.push(`G00 X${paths[0].Xs.toFixed(4)} Y${paths[0].Ys.toFixed(4)} Z${Z_SAFE.toFixed(4)}`);
  gcode.push(`G00 Z${Z_APPROACH.toFixed(4)}`);
  gcode.push(`G01 Z${finalCutZ.toFixed(4)} F${PLUNGE_FEED_RATE.toFixed(4)}`);

  paths.forEach((path, index) => {
    const isEvenPass = index % 2 === 0;
    if (isEvenPass) {
      gcode.push(`G01 X${path.Xe.toFixed(4)} Y${path.Ye.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
    } else {
      gcode.push(`G01 X${path.Xs.toFixed(4)} Y${path.Ys.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
    }
    if (index < paths.length - 1) {
      const nextPath = paths[index + 1];
      if (isEvenPass) {
        gcode.push(`G01 X${nextPath.Xe.toFixed(4)} Y${nextPath.Ye.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
      } else {
        gcode.push(`G01 X${nextPath.Xs.toFixed(4)} Y${nextPath.Ys.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
      }
    }
  });

  gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);
  return gcode;
}

/**
 * Process slot tool (T2) - only slots with width >= 10mm; serpentine single path per slot
 */
function processSlotTool(planks: GCodePlank[]): string[] {
  const gcode: string[] = [];
  let hasOperations = false;

  planks.forEach((plank) => {
    if (plank.features.slots && plank.features.slots.length > 0) {
      const wideSlots = plank.features.slots.filter((slot) => slot.width >= TOOL_DIAMETER_T2);
      if (wideSlots.length > 0) {
        if (!hasOperations) {
          gcode.push(...outputToolStart('T2'));
          hasOperations = true;
        }
        const Z_APPROACH = plank.thickness;
        wideSlots.forEach((slot) => {
          gcode.push(...generateSlotGCode(plank, slot, Z_APPROACH, TOOL_DIAMETER_T2));
        });
      }
    }
  });

  if (hasOperations) {
    gcode.push('M05');
  }

  return gcode;
}

/**
 * Generate T1 rectangular profile
 */
function generateT1_Rectangle(plank: GCodePlank): string[] {
  const gcode: string[] = [];
  const coords = calculateProfileCoordinates(plank.x, plank.y, plank.placedWidth, plank.placedHeight, BIT_RADIUS);
  const passes = getProfilePassDepths(plank.thickness);
  const Z_APPROACH = plank.thickness;

  const p1X = Math.max(coords.p1.x, MIN_COORDINATE_VALUE);
  const p1Y = Math.max(coords.p1.y, MIN_COORDINATE_VALUE);
  const p2X = Math.max(coords.p2.x, MIN_COORDINATE_VALUE);
  const p2Y = Math.max(coords.p2.y, MIN_COORDINATE_VALUE);
  const p3X = Math.max(coords.p3.x, MIN_COORDINATE_VALUE);
  const p3Y = Math.max(coords.p3.y, MIN_COORDINATE_VALUE);
  const p4X = Math.max(coords.p4.x, MIN_COORDINATE_VALUE);
  const p4Y = Math.max(coords.p4.y, MIN_COORDINATE_VALUE);

  gcode.push(`G00 X${p1X.toFixed(4)} Y${p1Y.toFixed(4)} Z${Z_SAFE.toFixed(4)}`);
  gcode.push(`G00 Z${Z_APPROACH.toFixed(4)}`);

  passes.forEach((depth) => {
    gcode.push(`G01 Z${depth.toFixed(4)} F${PLUNGE_FEED_RATE.toFixed(4)}`);
    gcode.push(`G01 X${p4X.toFixed(4)} Y${p4Y.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
    gcode.push(`G01 X${p3X.toFixed(4)} Y${p3Y.toFixed(4)}`);
    gcode.push(`G01 X${p2X.toFixed(4)} Y${p2Y.toFixed(4)}`);
    gcode.push(`G01 X${p1X.toFixed(4)} Y${p1Y.toFixed(4)}`);
  });

  gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);
  return gcode;
}

// ============================================
// T1 V13 INTEGRATED: Edge detection and axis-aligned offset
// ============================================

type EdgeName = 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';

function getEdgeForPoint(point: Position, plank: GCodePlank): EdgeName[] {
  const plankLeft = plank.x;
  const plankRight = plank.x + plank.placedWidth;
  const plankBottom = plank.y;
  const plankTop = plank.y + plank.placedHeight;
  const distLeft = Math.abs(point.x - plankLeft);
  const distRight = Math.abs(point.x - plankRight);
  const distBottom = Math.abs(point.y - plankBottom);
  const distTop = Math.abs(point.y - plankTop);
  const candidates: { edge: EdgeName; dist: number }[] = [];
  if (distLeft <= EDGE_THRESHOLD) candidates.push({ edge: 'LEFT', dist: distLeft });
  if (distRight <= EDGE_THRESHOLD) candidates.push({ edge: 'RIGHT', dist: distRight });
  if (distBottom <= EDGE_THRESHOLD) candidates.push({ edge: 'BOTTOM', dist: distBottom });
  if (distTop <= EDGE_THRESHOLD) candidates.push({ edge: 'TOP', dist: distTop });
  candidates.sort((a, b) => a.dist - b.dist);
  return candidates.map((c) => c.edge);
}

function getSortPosition(point: Position, edge: EdgeName, _plank: GCodePlank): number {
  switch (edge) {
    case 'LEFT':
    case 'RIGHT':
      return point.y;
    case 'TOP':
    case 'BOTTOM':
      return point.x;
    default:
      return 0;
  }
}

const EDGE_OFFSET_DIRECTION: Record<EdgeName, { x: number; y: number }> = {
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
  TOP: { x: 0, y: 1 },
  BOTTOM: { x: 0, y: -1 },
};

function getCenterOffsetDirection(entryEdge: EdgeName, exitEdge: EdgeName): { xDir: number; yDir: number } {
  let xDir = 0;
  let yDir = 0;
  for (const edge of [entryEdge, exitEdge]) {
    if (edge === 'LEFT') xDir = -1;
    if (edge === 'RIGHT') xDir = 1;
    if (edge === 'TOP') yDir = 1;
    if (edge === 'BOTTOM') yDir = -1;
  }
  if (xDir === 0) xDir = exitEdge === 'RIGHT' ? 1 : -1;
  if (yDir === 0) yDir = exitEdge === 'TOP' ? 1 : -1;
  return { xDir, yDir };
}

function getCompensatedEntry(
  entryPoint: Position,
  entryEdge: EdgeName,
  offsetDir: { xDir: number; yDir: number },
  plank: GCodePlank,
  R: number
): Position {
  let x: number, y: number;
  if (entryEdge === 'LEFT') {
    x = plank.x - R;
    y = entryPoint.y + offsetDir.yDir * R;
  } else if (entryEdge === 'RIGHT') {
    x = plank.x + plank.placedWidth + R;
    y = entryPoint.y + offsetDir.yDir * R;
  } else if (entryEdge === 'TOP') {
    x = entryPoint.x + offsetDir.xDir * R;
    y = plank.y + plank.placedHeight + R;
  } else if (entryEdge === 'BOTTOM') {
    x = entryPoint.x + offsetDir.xDir * R;
    y = plank.y - R;
  } else {
    x = entryPoint.x + offsetDir.xDir * R;
    y = entryPoint.y + offsetDir.yDir * R;
  }
  return { x: Math.max(x, MIN_COORDINATE_VALUE), y: Math.max(y, MIN_COORDINATE_VALUE) };
}

function getCompensatedCenter(centerPoint: Position, offsetDir: { xDir: number; yDir: number }, R: number): Position {
  return {
    x: Math.max(centerPoint.x + offsetDir.xDir * R, MIN_COORDINATE_VALUE),
    y: Math.max(centerPoint.y + offsetDir.yDir * R, MIN_COORDINATE_VALUE),
  };
}

function getCompensatedExit(
  exitPoint: Position,
  exitEdge: EdgeName,
  offsetDir: { xDir: number; yDir: number },
  plank: GCodePlank,
  R: number
): Position {
  let x: number, y: number;
  if (exitEdge === 'LEFT') {
    x = plank.x - R;
    y = exitPoint.y + offsetDir.yDir * R;
  } else if (exitEdge === 'RIGHT') {
    x = plank.x + plank.placedWidth + R;
    y = exitPoint.y + offsetDir.yDir * R;
  } else if (exitEdge === 'TOP') {
    x = exitPoint.x + offsetDir.xDir * R;
    y = plank.y + plank.placedHeight + R;
  } else if (exitEdge === 'BOTTOM') {
    x = exitPoint.x + offsetDir.xDir * R;
    y = plank.y - R;
  } else {
    x = exitPoint.x + offsetDir.xDir * R;
    y = exitPoint.y + offsetDir.yDir * R;
  }
  return { x: Math.max(x, MIN_COORDINATE_VALUE), y: Math.max(y, MIN_COORDINATE_VALUE) };
}

interface ProcessedFeature {
  triplet: LCutTriplet;
  entryPoint: Position;
  center: Position;
  exitPoint: Position;
  entryEdge: EdgeName;
  exitEdge: EdgeName;
  offsetDir: { xDir: number; yDir: number };
  sortPosition: number;
}

function buildEdgeFeatureGroups(plank: GCodePlank): Record<EdgeName, ProcessedFeature[]> {
  const edgeGroups: Record<EdgeName, ProcessedFeature[]> = {
    LEFT: [],
    TOP: [],
    RIGHT: [],
    BOTTOM: [],
  };
  const allFeatures: Array<LCutTriplet & { type: string }> = [
    ...(plank.features.l_cuts?.map((f) => ({ ...f, type: 'l_cut' })) ?? []),
    ...(plank.features.gola_profiles?.map((f) => ({ ...f, type: 'gola' })) ?? []),
  ];
  const plankLeft = plank.x;
  const plankRight = plank.x + plank.placedWidth;
  const plankBottom = plank.y;
  const plankTop = plank.y + plank.placedHeight;

  for (const feature of allFeatures) {
    const startEdges = getEdgeForPoint(feature.start, plank);
    const endEdges = getEdgeForPoint(feature.end, plank);
    if (startEdges.length === 0 && endEdges.length === 0) continue;

    let entryPoint: Position, exitPoint: Position, entryEdge: EdgeName, exitEdge: EdgeName;
    const edgeOrder: EdgeName[] = ['LEFT', 'TOP', 'RIGHT', 'BOTTOM'];

    if (startEdges.length > 0 && endEdges.length > 0) {
      const hasLeft = startEdges.includes('LEFT') || endEdges.includes('LEFT');
      const hasBottom = startEdges.includes('BOTTOM') || endEdges.includes('BOTTOM');
      if (hasLeft && hasBottom) {
        if (startEdges.includes('BOTTOM')) {
          entryPoint = feature.start;
          exitPoint = feature.end;
          entryEdge = 'BOTTOM';
          exitEdge = 'LEFT';
        } else {
          entryPoint = feature.end;
          exitPoint = feature.start;
          entryEdge = 'BOTTOM';
          exitEdge = 'LEFT';
        }
      } else {
        let startIdx = 999;
        let endIdx = 999;
        let startEdgeName: EdgeName = 'LEFT';
        let endEdgeName: EdgeName = 'LEFT';
        for (let i = 0; i < edgeOrder.length; i++) {
          if (startEdges.includes(edgeOrder[i]) && i < startIdx) {
            startIdx = i;
            startEdgeName = edgeOrder[i];
          }
          if (endEdges.includes(edgeOrder[i]) && i < endIdx) {
            endIdx = i;
            endEdgeName = edgeOrder[i];
          }
        }
        if (startIdx <= endIdx) {
          entryPoint = feature.start;
          exitPoint = feature.end;
          entryEdge = startEdgeName;
          exitEdge = endEdgeName;
        } else {
          entryPoint = feature.end;
          exitPoint = feature.start;
          entryEdge = endEdgeName;
          exitEdge = startEdgeName;
        }
      }
    } else if (startEdges.length > 0) {
      entryPoint = feature.start;
      exitPoint = feature.end;
      entryEdge = startEdges[0];
      exitEdge = startEdges[0];
    } else {
      entryPoint = feature.end;
      exitPoint = feature.start;
      entryEdge = endEdges[0];
      exitEdge = endEdges[0];
    }

    const offsetDir = getCenterOffsetDirection(entryEdge, exitEdge);
    const processed: ProcessedFeature = {
      triplet: feature,
      entryPoint,
      center: feature.center,
      exitPoint,
      entryEdge,
      exitEdge,
      offsetDir,
      sortPosition: getSortPosition(entryPoint, entryEdge, plank),
    };
    edgeGroups[entryEdge].push(processed);
  }

  edgeGroups.LEFT.sort((a, b) => a.sortPosition - b.sortPosition);
  edgeGroups.TOP.sort((a, b) => a.sortPosition - b.sortPosition);
  edgeGroups.RIGHT.sort((a, b) => b.sortPosition - a.sortPosition);
  edgeGroups.BOTTOM.sort((a, b) => b.sortPosition - a.sortPosition);
  return edgeGroups;
}

/**
 * V13 Integrated T1: perimeter with L-cuts/Gola integrated (axis-aligned offset, 3 points per feature)
 */
function generateT1_Integrated(plank: GCodePlank): string[] {
  const gcode: string[] = [];
  const R = BIT_RADIUS;
  const width = plank.placedWidth;
  const height = plank.placedHeight;

  const P1 = { x: Math.max(plank.x - R, MIN_COORDINATE_VALUE), y: Math.max(plank.y - R, MIN_COORDINATE_VALUE) };
  const P2 = { x: Math.max(plank.x + width + R, MIN_COORDINATE_VALUE), y: Math.max(plank.y - R, MIN_COORDINATE_VALUE) };
  const P3 = { x: Math.max(plank.x + width + R, MIN_COORDINATE_VALUE), y: Math.max(plank.y + height + R, MIN_COORDINATE_VALUE) };
  const P4 = { x: Math.max(plank.x - R, MIN_COORDINATE_VALUE), y: Math.max(plank.y + height + R, MIN_COORDINATE_VALUE) };

  const passes = getProfilePassDepths(plank.thickness);
  const Z_APPROACH = plank.thickness;
  const edgeGroups = buildEdgeFeatureGroups(plank);

  gcode.push(`G00 X${P1.x.toFixed(4)} Y${P1.y.toFixed(4)} Z${Z_SAFE.toFixed(4)}`);
  gcode.push(`G00 Z${Z_APPROACH.toFixed(4)}`);

  const edgeSequence: { key: EdgeName; endCorner: Position; nextKey: EdgeName }[] = [
    { key: 'LEFT', endCorner: P4, nextKey: 'TOP' },
    { key: 'TOP', endCorner: P3, nextKey: 'RIGHT' },
    { key: 'RIGHT', endCorner: P2, nextKey: 'BOTTOM' },
    { key: 'BOTTOM', endCorner: P1, nextKey: 'LEFT' },
  ];

  passes.forEach((depth) => {
    gcode.push(`G01 Z${depth.toFixed(4)} F${PLUNGE_FEED_RATE.toFixed(4)}`);
    const currentPassGroups: Record<EdgeName, ProcessedFeature[]> = {
      LEFT: [...edgeGroups.LEFT],
      TOP: [...edgeGroups.TOP],
      RIGHT: [...edgeGroups.RIGHT],
      BOTTOM: [...edgeGroups.BOTTOM],
    };

    for (let i = 0; i < edgeSequence.length; i++) {
      const edge = edgeSequence[i];
      const features = currentPassGroups[edge.key];
      let skipCorner = false;

      while (features.length > 0) {
        const feature = features.shift()!;
        const compEntry = getCompensatedEntry(feature.entryPoint, feature.entryEdge, feature.offsetDir, plank, R);
        const compCenter = getCompensatedCenter(feature.center, feature.offsetDir, R);
        const compExit = getCompensatedExit(feature.exitPoint, feature.exitEdge, feature.offsetDir, plank, R);

        gcode.push(`G01 X${compEntry.x.toFixed(4)} Y${compEntry.y.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
        gcode.push(`G01 X${compCenter.x.toFixed(4)} Y${compCenter.y.toFixed(4)}`);
        gcode.push(`G01 X${compExit.x.toFixed(4)} Y${compExit.y.toFixed(4)}`);

        if (feature.exitEdge === edge.nextKey) {
          skipCorner = true;
          break;
        }
      }

      if (!skipCorner) {
        gcode.push(`G01 X${edge.endCorner.x.toFixed(4)} Y${edge.endCorner.y.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
      }
    }
  });

  gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);
  return gcode;
}

/**
 * Process T1 - Narrow grooves (width < 10mm) then perimeter (V13 integrated or rectangle)
 */
function processToolT1(planks: GCodePlank[]): string[] {
  const gcode: string[] = [];
  if (planks.length === 0) return gcode;

  const sortedPlanks = [...planks].sort((a, b) => {
    const areaA = a.placedWidth * a.placedHeight;
    const areaB = b.placedWidth * b.placedHeight;
    return areaA - areaB;
  });

  gcode.push(...outputToolStart('T1'));

  // First: narrow grooves (width < 10mm) with T1
  sortedPlanks.forEach((plank) => {
    if (plank.features.slots?.length) {
      const narrowSlots = plank.features.slots.filter((slot) => slot.width < TOOL_DIAMETER_T2);
      if (narrowSlots.length > 0) {
        const Z_APPROACH = plank.thickness;
        narrowSlots.forEach((slot) => {
          gcode.push(...generateSlotGCode(plank, slot, Z_APPROACH, TOOL_DIAMETER_T1));
        });
      }
    }
  });

  // Second: perimeter (integrated if L-cuts/Gola, else rectangle)
  sortedPlanks.forEach((plank) => {
    const hasLCut = plank.features.l_cuts && plank.features.l_cuts.length > 0;
    const hasGola = plank.features.gola_profiles && plank.features.gola_profiles.length > 0;
    if (hasLCut || hasGola) {
      gcode.push(...generateT1_Integrated(plank));
    } else {
      gcode.push(...generateT1_Rectangle(plank));
    }
  });

  gcode.push('M05');
  return gcode;
}

/**
 * Generate G-code for a single sheet
 */
function generateGCodeForSheet(planks: GCodePlank[], sheetName: string): string {
  const gcode: string[] = [];

  // Header
  gcode.push('G300');

  // Process tools in order
  // T3: Screw Holes (through-cut)
  gcode.push(...processTool('T3', 'screws', planks, () => Z_THROUGH_CUT_FINAL_HEIGHT));

  // T5: Hinge Holes
  gcode.push(...processTool('T5', 'hinges', planks, (p) => p.thickness - FIXED_DEPTHS.T5));

  // T4: VB Main
  gcode.push(...processTool('T4', 'vb_main', planks, (p) => p.thickness - FIXED_DEPTHS.T4));

  // T6: VB Double
  gcode.push(...processTool('T6', 'vb_double', planks, (p) => p.thickness - FIXED_DEPTHS.T6));

  // T2: Slots/Grooves
  gcode.push(...processSlotTool(planks));

  // T1: Profile Cutting (smallest first)
  gcode.push(...processToolT1(planks));

  // Footer
  gcode.push('G301');
  gcode.push('M30');

  // Remove comments (lines that are just "(...)")
  const filteredGcode = gcode.filter((line) => {
    const trimmed = line.trim();
    return !(trimmed.startsWith('(') && trimmed.endsWith(')'));
  });

  return filteredGcode.join('\n');
}

// ============================================
// MAIN EXPORT FUNCTIONS
// ============================================

/**
 * Generate G-code files from nest results
 */
export function generateGCode(
  nestResults: NestResult[],
  projectName: string = 'Project'
): GCodeResult[] {
  // Convert NestResult to GCodePlank
  const planks = nestResults.map(convertToGCodePlank);

  // Group by material and thickness
  const groups = groupByMaterialAndThickness(planks);

  const results: GCodeResult[] = [];

  // Generate G-code for each group
  groups.forEach((group, groupKey) => {
    let sheetIndex = 1;
    const sortedSheets = Array.from(group.sheets.keys()).sort();

    sortedSheets.forEach((sheetName) => {
      const sheetPlanks = group.sheets.get(sheetName)!;
      const uniqueSheetName = `${groupKey}_Sheet_${sheetIndex}`;
      const fileName = `${uniqueSheetName}.nc`;

      const content = generateGCodeForSheet(sheetPlanks, uniqueSheetName);

      results.push({
        sheetName: uniqueSheetName,
        fileName,
        materialFolder: group.materialFolder,
        thicknessFolder: group.thicknessFolder,
        content,
        plankCount: sheetPlanks.length,
      });

      sheetIndex++;
    });
  });

  return results;
}

/**
 * Generate and download G-code as ZIP file
 */
export async function downloadGCodeZip(
  nestResults: NestResult[],
  projectName: string = 'CNC_Project'
): Promise<void> {
  const gcodeResults = generateGCode(nestResults, projectName);

  if (gcodeResults.length === 0) {
    console.warn('No G-code files generated');
    return;
  }

  const zip = new JSZip();
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const mainFolderName = `${projectName.replace(/[/\\?%*:|"<>]/g, '_')}_G_CODES_${timestamp}`;
  const mainFolder = zip.folder(mainFolderName)!;

  // Create folder structure: Material -> Thickness -> Files
  const materialFolders = new Map<string, JSZip>();
  const thicknessFolders = new Map<string, JSZip>();

  gcodeResults.forEach((result) => {
    const matKey = result.materialFolder;
    const thickKey = `${matKey}_${result.thicknessFolder}`;

    // Create material folder
    if (!materialFolders.has(matKey)) {
      materialFolders.set(matKey, mainFolder.folder(matKey)!);
    }

    // Create thickness folder
    if (!thicknessFolders.has(thickKey)) {
      const matFolder = materialFolders.get(matKey)!;
      thicknessFolders.set(thickKey, matFolder.folder(result.thicknessFolder)!);
    }

    // Add NC file
    const thickFolder = thicknessFolders.get(thickKey)!;
    thickFolder.file(result.fileName, result.content);
  });

  // Add flat folder with all files
  const flatFolder = mainFolder.folder('ALL_NC_FILES_FLAT')!;
  gcodeResults.forEach((result) => {
    flatFolder.file(result.fileName, result.content);
  });

  // Add summary
  const summary = [
    'CNC G-CODE GENERATION SUMMARY',
    '=========================================',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    'FILES GENERATED:',
    ...gcodeResults.map((r) => `- ${r.fileName} (Sheet: ${r.sheetName}, Planks: ${r.plankCount})`),
    '',
    `Total Files: ${gcodeResults.length}`,
  ].join('\n');

  mainFolder.file('GENERATION_SUMMARY.txt', summary);

  // Generate and download ZIP
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${mainFolderName}.zip`);
}

/**
 * Get G-code content as string (for preview)
 */
export function getGCodePreview(nestResults: NestResult[]): string {
  const gcodeResults = generateGCode(nestResults);
  
  if (gcodeResults.length === 0) {
    return '// No G-code generated';
  }

  return gcodeResults.map((result) => {
    return `// === ${result.fileName} ===\n${result.content}`;
  }).join('\n\n');
}

export default generateGCode;
