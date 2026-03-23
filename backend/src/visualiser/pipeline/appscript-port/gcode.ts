/**
 * CNC G-code Generator (GRBL-Based)
 * Full port from AppScript gcode.js v13.3.0
 * Input: cutlist { header, rows } (Nest Result 2D array)
 * Output: GCodeResult[] and buildGCodeZip for download
 */

import JSZip from 'jszip';

// ========================================
// CONSTANTS (from AppScript)
// ========================================

const Z_SAFE = 26.0;
const MIN_COORDINATE_VALUE = 0.0001;
const Z_THROUGH_CUT_FINAL_HEIGHT = -0.01;
const SPINDLE_SPEED = 18000;
const CUTTING_FEED_RATE = 12000;
const PLUNGE_FEED_RATE = 6000.0;
const BIT_RADIUS = 4;
const TOOL_DIAMETER_T1 = 8;
const TOOL_DIAMETER_T2 = 10;

const FIXED_DEPTHS: Record<string, number> = {
  T4: 16,
  T5: 14,
  T6: 11,
};

const EDGE_THRESHOLD = BIT_RADIUS + 2.0;

const EDGE_OFFSET_DIRECTION: Record<string, { x: number; y: number }> = {
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
  TOP: { x: 0, y: 1 },
  BOTTOM: { x: 0, y: -1 },
};

type EdgeName = 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';

// ========================================
// TYPES
// ========================================

export interface GCodeConfig {
  Z_SAFE?: number;
  SPINDLE_SPEED?: number;
  CUTTING_FEED_RATE?: number;
  PLUNGE_FEED_RATE?: number;
}

export interface GCodeResult {
  sheetName: string;
  fileName: string;
  materialFolder: string;
  thickness: number;
  content: string;
  plankCount: number;
}

interface Point {
  x: number;
  y: number;
}

interface SlotFeature {
  type: string;
  x: number;
  y: number;
  length: number;
  width: number;
  depth: number;
}

interface TripletFeature {
  start: Point;
  center: Point;
  end: Point;
}

interface IncutFeature {
  points: Point[];
  cutType: string;
  point1: Point;
  point2: Point;
}

interface PlankFeatures {
  screws: Point[];
  hinges: Point[];
  vb_main: Point[];
  vb_double: Point[];
  slots: SlotFeature[];
  l_cuts: TripletFeature[];
  gola_profiles: TripletFeature[];
  incut_cuts: IncutFeature[];
}

export interface GCodePlank {
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
  ebValue: number;
  originalWidth: number;
  originalHeight: number;
  roomName: string;
  boxModel: string;
  cutOrder: number | null;
  features: PlankFeatures;
}

let current_tool_ID: string | null = null;
let current_sheet_ID: string | null = null;

function resetGCodeState(sheetName: string): void {
  current_tool_ID = null;
  current_sheet_ID = sheetName;
}

function getFeatureTypeFromPrefix(prefix: string): keyof PlankFeatures {
  const m: Record<string, keyof PlankFeatures> = {
    'screw_': 'screws',
    'hing_': 'hinges',
    'vb_main_': 'vb_main',
    'vb_double_': 'vb_double',
  };
  return m[prefix] || 'screws';
}

function getFeatureType(operationName: string): keyof PlankFeatures {
  const m: Record<string, keyof PlankFeatures> = {
    'Screw Holes': 'screws',
    'Hinge Holes': 'hinges',
    'VB Main': 'vb_main',
    'VB Double': 'vb_double',
    'Slot/Profile Grooves (>=10mm)': 'slots',
  };
  return m[operationName] || 'screws';
}

function detectIncutCutType(points: Point[]): string {
  if (points.length === 2) return 'LINE';
  if (points.length === 4) {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const uniqueX = Array.from(new Set(xs.map((x) => Math.round(x * 10) / 10)));
    const uniqueY = Array.from(new Set(ys.map((y) => Math.round(y * 10) / 10)));
    if (uniqueX.length === 2 && uniqueY.length === 2) return 'RECT';
  }
  return 'LINE';
}

// ========================================
// EXTRACT FEATURES FROM ROW
// ========================================

function extractFeatures(row: (string | number)[], headers: string[]): PlankFeatures {
  const features: PlankFeatures = {
    screws: [],
    hinges: [],
    vb_main: [],
    vb_double: [],
    slots: [],
    l_cuts: [],
    gola_profiles: [],
    incut_cuts: [],
  };

  const pointPrefixes = ['screw_', 'hing_', 'vb_main_', 'vb_double_'];
  const groovePrefixes = [
    { prefix: 'slot_', type: 'slot' },
    { prefix: 'profile_', type: 'profile' },
    { prefix: 'groove_', type: 'slot' },
  ];

  let maxLCutIndex = 0;
  let maxGolaProfileIndex = 0;
  let maxIncutIndex = 0;
  headers.forEach((h) => {
    const lMatch = h.match(/^L_cut_(\d+)_start_X$/);
    if (lMatch) maxLCutIndex = Math.max(maxLCutIndex, parseInt(lMatch[1]));
    const gMatch = h.match(/^Gola_profile_(\d+)_start_X$/);
    if (gMatch) maxGolaProfileIndex = Math.max(maxGolaProfileIndex, parseInt(gMatch[1]));
    const iMatch = h.match(/^Incut_cut_(\d+)_point1_X$/);
    if (iMatch) maxIncutIndex = Math.max(maxIncutIndex, parseInt(iMatch[1]));
  });

  headers.forEach((header, index) => {
    const value = row[index];
    if (value === null || value === '') return;

    pointPrefixes.forEach((prefix) => {
      if (header.startsWith(prefix) && header.endsWith('_X')) {
        const yHeader = header.replace('_X', '_Y');
        const yIndex = headers.indexOf(yHeader);
        if (yIndex === -1) return;
        const xVal = parseFloat(String(value));
        const yVal = parseFloat(String(row[yIndex]));
        if (!Number.isNaN(xVal) && !Number.isNaN(yVal)) {
          const key = getFeatureTypeFromPrefix(prefix);
          (features[key] as Point[]).push({ x: xVal, y: yVal });
        }
      }
    });

    groovePrefixes.forEach((grooveDef) => {
      const prefix = grooveDef.prefix;
      if (!header.startsWith(prefix) || !header.endsWith('_X')) return;
      const parts = header.split('_');
      const featureNumber = parts.length > 1 ? parts[1] : '';
      const yHeader = `${prefix}${featureNumber}_Y`;
      const lengthHeader = `${prefix}${featureNumber}_length`;
      const widthHeader = `${prefix}${featureNumber}_width`;
      const depthHeader = `${prefix}${featureNumber}_Z`;
      const yIdx = headers.indexOf(yHeader);
      const lenIdx = headers.indexOf(lengthHeader);
      const wIdx = headers.indexOf(widthHeader);
      const dIdx = headers.indexOf(depthHeader);
      if (yIdx === -1 || lenIdx === -1 || wIdx === -1 || dIdx === -1) return;
      const xVal = parseFloat(String(value));
      const yVal = parseFloat(String(row[yIdx]));
      const lengthVal = parseFloat(String(row[lenIdx]));
      const widthVal = parseFloat(String(row[wIdx]));
      const depthVal = parseFloat(String(row[dIdx]));
      if (
        !Number.isNaN(xVal) &&
        !Number.isNaN(yVal) &&
        !Number.isNaN(lengthVal) &&
        !Number.isNaN(widthVal) &&
        !Number.isNaN(depthVal) &&
        widthVal > 0
      ) {
        features.slots.push({
          type: grooveDef.type,
          x: xVal,
          y: yVal,
          length: lengthVal,
          width: widthVal,
          depth: depthVal,
        });
      }
    });
  });

  for (let i = 1; i <= maxLCutIndex; i++) {
    const sx = headers.indexOf(`L_cut_${i}_start_X`);
    const sy = headers.indexOf(`L_cut_${i}_start_Y`);
    const cx = headers.indexOf(`L_cut_${i}_center_X`);
    const cy = headers.indexOf(`L_cut_${i}_center_Y`);
    const ex = headers.indexOf(`L_cut_${i}_end_X`);
    const ey = headers.indexOf(`L_cut_${i}_end_Y`);
    if (sx === -1 || sy === -1 || cx === -1 || cy === -1 || ex === -1 || ey === -1) continue;
    const startX = parseFloat(String(row[sx]));
    const startY = parseFloat(String(row[sy]));
    const centerX = parseFloat(String(row[cx]));
    const centerY = parseFloat(String(row[cy]));
    const endX = parseFloat(String(row[ex]));
    const endY = parseFloat(String(row[ey]));
    if (
      Number.isNaN(startX) ||
      Number.isNaN(startY) ||
      Number.isNaN(centerX) ||
      Number.isNaN(centerY) ||
      Number.isNaN(endX) ||
      Number.isNaN(endY)
    )
      continue;
    if (startX === 0 && startY === 0 && centerX === 0 && centerY === 0 && endX === 0 && endY === 0) continue;
    features.l_cuts.push({
      start: { x: startX, y: startY },
      center: { x: centerX, y: centerY },
      end: { x: endX, y: endY },
    });
  }

  for (let i = 1; i <= maxGolaProfileIndex; i++) {
    const sx = headers.indexOf(`Gola_profile_${i}_start_X`);
    const sy = headers.indexOf(`Gola_profile_${i}_start_Y`);
    const cx = headers.indexOf(`Gola_profile_${i}_center_X`);
    const cy = headers.indexOf(`Gola_profile_${i}_center_Y`);
    const ex = headers.indexOf(`Gola_profile_${i}_end_X`);
    const ey = headers.indexOf(`Gola_profile_${i}_end_Y`);
    if (sx === -1 || sy === -1 || cx === -1 || cy === -1 || ex === -1 || ey === -1) continue;
    const startX = parseFloat(String(row[sx]));
    const startY = parseFloat(String(row[sy]));
    const centerX = parseFloat(String(row[cx]));
    const centerY = parseFloat(String(row[cy]));
    const endX = parseFloat(String(row[ex]));
    const endY = parseFloat(String(row[ey]));
    if (
      Number.isNaN(startX) ||
      Number.isNaN(startY) ||
      Number.isNaN(centerX) ||
      Number.isNaN(centerY) ||
      Number.isNaN(endX) ||
      Number.isNaN(endY)
    )
      continue;
    if (startX === 0 && startY === 0 && centerX === 0 && centerY === 0 && endX === 0 && endY === 0) continue;
    features.gola_profiles.push({
      start: { x: startX, y: startY },
      center: { x: centerX, y: centerY },
      end: { x: endX, y: endY },
    });
  }

  for (let i = 1; i <= maxIncutIndex; i++) {
    const p1x = headers.indexOf(`Incut_cut_${i}_point1_X`);
    const p1y = headers.indexOf(`Incut_cut_${i}_point1_Y`);
    const p2x = headers.indexOf(`Incut_cut_${i}_point2_X`);
    const p2y = headers.indexOf(`Incut_cut_${i}_point2_Y`);
    const p3x = headers.indexOf(`Incut_cut_${i}_point3_X`);
    const p3y = headers.indexOf(`Incut_cut_${i}_point3_Y`);
    const p4x = headers.indexOf(`Incut_cut_${i}_point4_X`);
    const p4y = headers.indexOf(`Incut_cut_${i}_point4_Y`);
    if (p1x === -1 || p1y === -1 || p2x === -1 || p2y === -1) continue;
    const p1X = parseFloat(String(row[p1x]));
    const p1Y = parseFloat(String(row[p1y]));
    const p2X = parseFloat(String(row[p2x]));
    const p2Y = parseFloat(String(row[p2y]));
    if (Number.isNaN(p1X) || Number.isNaN(p1Y) || Number.isNaN(p2X) || Number.isNaN(p2Y)) continue;
    if (p1X === 0 && p1Y === 0 && p2X === 0 && p2Y === 0) continue;
    const points: Point[] = [{ x: p1X, y: p1Y }, { x: p2X, y: p2Y }];
    if (p3x !== -1 && p3y !== -1) {
      const p3X = parseFloat(String(row[p3x]));
      const p3Y = parseFloat(String(row[p3y]));
      if (!Number.isNaN(p3X) && !Number.isNaN(p3Y) && !(p3X === 0 && p3Y === 0))
        points.push({ x: p3X, y: p3Y });
    }
    if (p4x !== -1 && p4y !== -1) {
      const p4X = parseFloat(String(row[p4x]));
      const p4Y = parseFloat(String(row[p4y]));
      if (!Number.isNaN(p4X) && !Number.isNaN(p4Y) && !(p4X === 0 && p4Y === 0))
        points.push({ x: p4X, y: p4Y });
    }
    features.incut_cuts.push({
      points,
      cutType: detectIncutCutType(points),
      point1: points[0],
      point2: points[points.length - 1],
    });
  }

  return features;
}

function isValidPlank(plank: GCodePlank): boolean {
  return (
    !!plank.sheet &&
    plank.thickness > 0 &&
    !Number.isNaN(plank.x) &&
    !Number.isNaN(plank.y) &&
    !Number.isNaN(plank.placedWidth) &&
    !Number.isNaN(plank.placedHeight) &&
    plank.placedWidth > 0 &&
    plank.placedHeight > 0
  );
}

// ========================================
// GET NEST DATA FROM CUTLIST 2D
// ========================================

const COLUMN_MAPPINGS: Record<string, string> = {
  plankId: 'Plank ID',
  plankName: 'Plank Name',
  material: 'Material',
  thickness: 'Thickness',
  sheet: 'Sheet',
  x: 'X',
  y: 'Y',
  placedWidth: 'Placed Width',
  placedHeight: 'Placed Height',
  rotated: 'Rotated',
  ebValue: 'EB Value',
  originalWidth: 'Original Width',
  originalHeight: 'Original Height',
  roomName: 'Room Name',
  boxModel: 'Box Model',
  cutOrder: 'Cut Order',
};

export function getNestDataFromRows(header: string[], rows: (string | number)[][]): GCodePlank[] {
  const headers = header.map((h) => String(h).trim());
  const col: Record<string, number> = {};
  Object.keys(COLUMN_MAPPINGS).forEach((key) => {
    col[key] = headers.indexOf(COLUMN_MAPPINGS[key]);
  });
  const required = ['plankId', 'plankName', 'material', 'thickness', 'sheet', 'x', 'y', 'placedWidth', 'placedHeight', 'rotated'];
  const missing = required.filter((k) => col[k] === -1);
  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.map((k) => COLUMN_MAPPINGS[k]).join(', ')}`);
  }

  const planks: GCodePlank[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const plankX = parseFloat(String(row[col.x])) || 0;
      const plankY = parseFloat(String(row[col.y])) || 0;
      const plank: GCodePlank = {
        id: String(row[col.plankId] ?? '').trim() || `PLANK_${i + 1}`,
        name: String(row[col.plankName] ?? 'N/A'),
        material: String(row[col.material] ?? 'N/A'),
        thickness: parseFloat(String(row[col.thickness])) || 0,
        sheet: String(row[col.sheet] ?? '').trim(),
        x: plankX,
        y: plankY,
        placedWidth: parseFloat(String(row[col.placedWidth])) || 0,
        placedHeight: parseFloat(String(row[col.placedHeight])) || 0,
        rotated:
          String(row[col.rotated] ?? '').toLowerCase() === 'yes' ||
          String(row[col.rotated] ?? '').toLowerCase() === 'si',
        ebValue:
          col.ebValue >= 0 && row[col.ebValue] !== '' && row[col.ebValue] != null
            ? parseFloat(String(row[col.ebValue])) || 1
            : 1,
        roomName: col.roomName >= 0 && row[col.roomName] != null ? String(row[col.roomName] ?? '').trim() : '',
        boxModel: col.boxModel >= 0 && row[col.boxModel] != null ? String(row[col.boxModel] ?? '').trim() : '',
        originalWidth:
          col.originalWidth >= 0 && row[col.originalWidth] !== '' && row[col.originalWidth] != null
            ? parseFloat(String(row[col.originalWidth])) || 0
            : 0,
        originalHeight:
          col.originalHeight >= 0 && row[col.originalHeight] !== '' && row[col.originalHeight] != null
            ? parseFloat(String(row[col.originalHeight])) || 0
            : 0,
        cutOrder:
          col.cutOrder >= 0 && row[col.cutOrder] !== '' && row[col.cutOrder] != null
            ? parseInt(String(row[col.cutOrder]), 10) || null
            : null,
        features: extractFeatures(row as (string | number)[], headers),
      };

      if (plank.features.l_cuts.length > 0) {
        plank.features.l_cuts = plank.features.l_cuts.map((f) => ({
          start: { x: f.start.x + plankX, y: f.start.y + plankY },
          center: { x: f.center.x + plankX, y: f.center.y + plankY },
          end: { x: f.end.x + plankX, y: f.end.y + plankY },
        }));
      }
      if (plank.features.gola_profiles.length > 0) {
        plank.features.gola_profiles = plank.features.gola_profiles.map((f) => ({
          start: { x: f.start.x + plankX, y: f.start.y + plankY },
          center: { x: f.center.x + plankX, y: f.center.y + plankY },
          end: { x: f.end.x + plankX, y: f.end.y + plankY },
        }));
      }
      if (plank.features.incut_cuts.length > 0) {
        const TOL = 2;
        const inPlankBounds = (p: Point) =>
          p.x >= plankX - TOL &&
          p.x <= plankX + plank.placedWidth + TOL &&
          p.y >= plankY - TOL &&
          p.y <= plankY + plank.placedHeight + TOL;
        plank.features.incut_cuts = plank.features.incut_cuts.map((f) => {
          const pts = f.points && f.points.length ? f.points : [f.point1, f.point2];
          const alreadyAbsolute = pts.every((p) => inPlankBounds(p));
          const normalize = (p: Point) =>
            alreadyAbsolute ? { x: p.x, y: p.y } : { x: p.x + plankX, y: p.y + plankY };
          const sheetPts = pts.map(normalize);
          return {
            points: sheetPts,
            cutType: f.cutType || 'LINE',
            point1: sheetPts[0],
            point2: sheetPts[sheetPts.length - 1],
          };
        });
      }

      if (isValidPlank(plank)) planks.push(plank);
    } catch {
      // skip invalid row
    }
  }
  return planks;
}

// ========================================
// GROUP BY SHEET (Material_ThicknessMM_Sheet_N)
// ========================================

function groupBySheet(nestData: GCodePlank[]): Record<string, { materialFolder: string; planks: GCodePlank[] }> {
  const grouped: Record<
    string,
    { folderName: string; sheets: Record<string, GCodePlank[]> }
  > = {};

  nestData.forEach((plank) => {
    const cleanMaterial = plank.material.trim().replace(/\s*\(.*?\)/, '').trim();
    const folderName = cleanMaterial.replace(/\s+/g, '_');
    const thicknessKey = `${Math.round(plank.thickness)}MM`;
    const uniqueGroupKey = `${folderName}_${thicknessKey}`;

    if (!grouped[uniqueGroupKey]) {
      grouped[uniqueGroupKey] = { folderName, sheets: {} };
    }
    const sheetKey = String(plank.sheet);
    if (!grouped[uniqueGroupKey].sheets[sheetKey]) {
      grouped[uniqueGroupKey].sheets[sheetKey] = [];
    }
    grouped[uniqueGroupKey].sheets[sheetKey].push(plank);
  });

  const finalSheets: Record<string, { materialFolder: string; planks: GCodePlank[] }> = {};
  Object.keys(grouped)
    .sort()
    .forEach((groupKey) => {
      const groupData = grouped[groupKey];
      let sheetIndex = 1;
      const originalSheetNames = Object.keys(groupData.sheets).sort(
        (a, b) => parseInt(a, 10) - parseInt(b, 10)
      );
      originalSheetNames.forEach((origName) => {
        const newSheetName = `${groupKey}_Sheet_${sheetIndex}`;
        finalSheets[newSheetName] = {
          materialFolder: groupData.folderName,
          planks: groupData.sheets[origName],
        };
        sheetIndex++;
      });
    });
  return finalSheets;
}

// ========================================
// SORT PLANKS FOR T1
// ========================================

function sortPlanksForT1(planks: GCodePlank[]): GCodePlank[] {
  // Always use cut order when available (any plank count)
  const anyHaveCutOrder = planks.some((p) => p.cutOrder != null && !Number.isNaN(p.cutOrder));
  if (anyHaveCutOrder) {
    return [...planks].sort((a, b) => {
      const oa = a.cutOrder ?? 99999;
      const ob = b.cutOrder ?? 99999;
      if (oa !== ob) return oa - ob;
      return a.y - b.y || a.x - b.x;
    });
  }
  // Fallback: area-based sort (smaller first) with position tiebreak
  return [...planks].sort((a, b) => {
    const areaA = a.placedWidth * a.placedHeight;
    const areaB = b.placedWidth * b.placedHeight;
    if (Math.abs(areaA - areaB) > 1) return areaA - areaB;
    return a.y - b.y || a.x - b.x;
  });
}

// ========================================
// TOOL START & PROCESS TOOL (T3-T6)
// ========================================

function outputToolStart(toolNumber: string, planks: GCodePlank[]): string[] {
  const gcode: string[] = [];
  if (planks.length > 0 && current_tool_ID !== toolNumber) {
    gcode.push(`T${toolNumber.slice(1)}`);
    gcode.push(`G43 H${toolNumber.slice(1)}`);
    gcode.push(`M03 S${SPINDLE_SPEED}`);
    current_tool_ID = toolNumber;
  }
  return gcode;
}

function processTool(
  toolNumber: string,
  operationName: string,
  planks: GCodePlank[],
  depthCalculator: (plank: GCodePlank) => number
): string[] {
  const gcode: string[] = [];
  let hasOperations = false;
  const featureType = getFeatureType(operationName);

  planks.forEach((plank) => {
    const features = plank.features[featureType] as Point[] | undefined;
    if (features && features.length > 0) {
      if (!hasOperations) {
        gcode.push(...outputToolStart(toolNumber, planks));
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
  if (hasOperations) gcode.push('M05');
  return gcode;
}

// ========================================
// T2 SLOT (Serpentine) — width >= 10mm
// ========================================

function getLateralPaths(slotWidth: number, toolDiameter: number): { numPasses: number; offsets: number[] } {
  const D = toolDiameter;
  const W = slotWidth;
  const offsets: number[] = [];
  if (W <= D + 0.01) {
    offsets.push(0);
  } else if (W <= 20) {
    const O = (W - D) / 2;
    offsets.push(-O, O);
  } else if (W <= 30) {
    const O = (W - D) / 2;
    offsets.push(-O, 0, O);
  } else {
    const O = (30 - D) / 2;
    offsets.push(-O, 0, O);
  }
  return { numPasses: offsets.length, offsets };
}

function generateSlotGCode(
  plank: GCodePlank,
  slot: SlotFeature,
  Z_APPROACH: number,
  toolDiameter: number
): string[] {
  const gcode: string[] = [];
  const W = slot.width;
  const Length = slot.length;
  const plankThickness = plank.thickness;
  let Xs_center: number, Ys_center: number, Xe_center: number, Ye_center: number;
  if (plank.rotated) {
    Xs_center = slot.x;
    Ys_center = slot.y + W / 2;
    Xe_center = Xs_center + Length;
    Ye_center = Ys_center;
  } else {
    Xs_center = slot.x + W / 2;
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
      const next = paths[index + 1];
      if (isEvenPass) {
        gcode.push(`G01 X${next.Xe.toFixed(4)} Y${next.Ye.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
      } else {
        gcode.push(`G01 X${next.Xs.toFixed(4)} Y${next.Ys.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
      }
    }
  });
  gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);
  return gcode;
}

function processSlotTool(
  toolNumber: string,
  _operationName: string,
  planks: GCodePlank[],
  toolDiameter: number
): string[] {
  const gcode: string[] = [];
  let hasOperations = false;
  planks.forEach((plank) => {
    const wideGrooves =
      plank.features.slots?.filter((slot) => slot.width >= TOOL_DIAMETER_T2) ?? [];
    if (wideGrooves.length > 0) {
      if (!hasOperations) {
        gcode.push(...outputToolStart(toolNumber, planks));
        hasOperations = true;
      }
      const Z_APPROACH = plank.thickness;
      wideGrooves.forEach((slot) => {
        gcode.push(...generateSlotGCode(plank, slot, Z_APPROACH, toolDiameter));
      });
    }
  });
  if (hasOperations) gcode.push('M05');
  return gcode;
}

// ========================================
// PROFILE PASS DEPTHS
// ========================================

function getProfilePassDepths(thickness: number): number[] {
  const passFinalDepth = Z_THROUGH_CUT_FINAL_HEIGHT;
  if (thickness > 12) {
    const pass1Depth = thickness / 2;
    return [pass1Depth, passFinalDepth];
  }
  return [passFinalDepth];
}

// ========================================
// EDGE HELPERS (for L-cut/Gola/Incut)
// ========================================

function getEdgeForPoint(point: Point, plank: GCodePlank): EdgeName[] {
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

function getSortPosition(point: Point, edge: EdgeName, _plank: GCodePlank): number {
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

function getOutwardNormalForEdge(edge: EdgeName): Point {
  switch (edge) {
    case 'RIGHT':
      return { x: 1, y: 0 };
    case 'LEFT':
      return { x: -1, y: 0 };
    case 'TOP':
      return { x: 0, y: 1 };
    case 'BOTTOM':
      return { x: 0, y: -1 };
    default:
      return { x: 0, y: 0 };
  }
}

function getCenterOffsetDirection(entryEdge: EdgeName, exitEdge: EdgeName): { xDir: number; yDir: number } {
  let xDir = 0;
  let yDir = 0;
  [entryEdge, exitEdge].forEach((edge) => {
    if (edge === 'LEFT') xDir = -1;
    if (edge === 'RIGHT') xDir = 1;
    if (edge === 'TOP') yDir = 1;
    if (edge === 'BOTTOM') yDir = -1;
  });
  if (xDir === 0) xDir = entryEdge === 'TOP' || entryEdge === 'BOTTOM' ? (exitEdge === 'RIGHT' ? 1 : -1) : -1;
  if (yDir === 0) yDir = entryEdge === 'LEFT' || entryEdge === 'RIGHT' ? (exitEdge === 'TOP' ? 1 : -1) : -1;
  return { xDir, yDir };
}

function getCompensatedEntry(
  entryPoint: Point,
  entryEdge: EdgeName,
  offsetDir: { xDir: number; yDir: number },
  plank: GCodePlank,
  R: number
): Point {
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

function getCompensatedCenter(
  centerPoint: Point,
  offsetDir: { xDir: number; yDir: number },
  R: number
): Point {
  return {
    x: Math.max(centerPoint.x + offsetDir.xDir * R, MIN_COORDINATE_VALUE),
    y: Math.max(centerPoint.y + offsetDir.yDir * R, MIN_COORDINATE_VALUE),
  };
}

function getCompensatedExit(
  exitPoint: Point,
  exitEdge: EdgeName,
  offsetDir: { xDir: number; yDir: number },
  plank: GCodePlank,
  R: number
): Point {
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

function getPointOnEdgeForIncut(point: Point, edge: EdgeName, plank: GCodePlank): Point {
  const x = Math.max(point.x, MIN_COORDINATE_VALUE);
  const y = Math.max(point.y, MIN_COORDINATE_VALUE);
  switch (edge) {
    case 'TOP':
      return { x, y: Math.max(plank.y + plank.placedHeight + BIT_RADIUS, MIN_COORDINATE_VALUE) };
    case 'BOTTOM':
      return { x, y: Math.max(plank.y - BIT_RADIUS, MIN_COORDINATE_VALUE) };
    case 'LEFT':
      return { x: Math.max(plank.x - BIT_RADIUS, MIN_COORDINATE_VALUE), y };
    case 'RIGHT':
      return { x: Math.max(plank.x + plank.placedWidth + BIT_RADIUS, MIN_COORDINATE_VALUE), y };
    default:
      return { x, y };
  }
}

function orderIncutPointsForPerimeter(
  points: Point[],
  entryPoint: Point,
  exitPoint: Point
): Point[] {
  const tol = 0.5;
  const match = (a: Point, b: Point) => Math.abs(a.x - b.x) <= tol && Math.abs(a.y - b.y) <= tol;
  const interior = points.filter((p) => !match(p, entryPoint) && !match(p, exitPoint));
  if (interior.length !== 2) return points;
  const nextToEntry =
    interior.find(
      (p) => Math.abs(p.x - entryPoint.x) <= tol || Math.abs(p.y - entryPoint.y) <= tol
    ) ?? interior[0];
  const other = interior[0] === nextToEntry ? interior[1] : interior[0];
  return [entryPoint, nextToEntry, other, exitPoint];
}

function getUShapeCompensatedPoints(
  orderedPoints: Point[],
  entryPoint: Point,
  exitPoint: Point,
  primaryEdge: EdgeName,
  R: number
): Point[] {
  const tol = 0.5;
  const match = (a: Point, b: Point) => Math.abs(a.x - b.x) <= tol && Math.abs(a.y - b.y) <= tol;
  const allY = orderedPoints.map((p) => p.y);
  const allX = orderedPoints.map((p) => p.x);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const isVerticalEdge = primaryEdge === 'LEFT' || primaryEdge === 'RIGHT';

  return orderedPoints.map((p) => {
    let dx = 0;
    let dy = 0;
    if (isVerticalEdge) {
      const onEdge = match(p, entryPoint) || match(p, exitPoint);
      dx = onEdge ? (primaryEdge === 'LEFT' ? R : -R) : primaryEdge === 'LEFT' ? -R : R;
      if (Math.abs(p.y - minY) < tol) dy = R;
      else if (Math.abs(p.y - maxY) < tol) dy = -R;
    } else {
      const onEdge = match(p, entryPoint) || match(p, exitPoint);
      dy = onEdge ? (primaryEdge === 'TOP' ? -R : R) : primaryEdge === 'TOP' ? R : -R;
      if (Math.abs(p.x - minX) < tol) dx = R;
      else if (Math.abs(p.x - maxX) < tol) dx = -R;
    }
    return {
      x: Math.max(p.x + dx, MIN_COORDINATE_VALUE),
      y: Math.max(p.y + dy, MIN_COORDINATE_VALUE),
    };
  });
}

// ========================================
// BUILD EDGE FEATURE GROUPS (simplified: L-cuts + Gola only; incuts skipped for brevity in first pass)
// ========================================

interface ProcessedTriplet {
  triplet: TripletFeature & { type?: string };
  entryPoint: Point;
  center: Point;
  exitPoint: Point;
  entryEdge: EdgeName;
  exitEdge: EdgeName;
  offsetDir: { xDir: number; yDir: number };
  type: string;
  sortPosition: number;
}

interface EdgeGroups {
  LEFT: ProcessedTriplet[];
  TOP: ProcessedTriplet[];
  RIGHT: ProcessedTriplet[];
  BOTTOM: ProcessedTriplet[];
}

function buildEdgeFeatureGroups(plank: GCodePlank): EdgeGroups {
  const edgeGroups: EdgeGroups = {
    LEFT: [],
    TOP: [],
    RIGHT: [],
    BOTTOM: [],
  };

  const allFeatures: (TripletFeature & { type: string })[] = [
    ...(plank.features.l_cuts?.map((f) => ({ ...f, type: 'l_cut' })) ?? []),
    ...(plank.features.gola_profiles?.map((f) => ({ ...f, type: 'gola' })) ?? []),
  ];

  const R = BIT_RADIUS;
  const plankLeft = plank.x;
  const plankRight = plank.x + plank.placedWidth;
  const plankBottom = plank.y;
  const plankTop = plank.y + plank.placedHeight;

  allFeatures.forEach((feature) => {
    const startEdges = getEdgeForPoint(feature.start, plank);
    const endEdges = getEdgeForPoint(feature.end, plank);
    if (startEdges.length === 0 && endEdges.length === 0) return;

    const edgeOrder: EdgeName[] = ['LEFT', 'TOP', 'RIGHT', 'BOTTOM'];
    let entryPoint: Point;
    let exitPoint: Point;
    let entryEdge: EdgeName;
    let exitEdge: EdgeName;

    if (startEdges.length > 0 && endEdges.length > 0) {
      let startEdgeIndex = 999;
      let endEdgeIndex = 999;
      let startEdgeName: EdgeName = 'LEFT';
      let endEdgeName: EdgeName = 'LEFT';
      for (let i = 0; i < edgeOrder.length; i++) {
        if (startEdges.includes(edgeOrder[i]) && i < startEdgeIndex) {
          startEdgeIndex = i;
          startEdgeName = edgeOrder[i];
        }
        if (endEdges.includes(edgeOrder[i]) && i < endEdgeIndex) {
          endEdgeIndex = i;
          endEdgeName = edgeOrder[i];
        }
      }
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
      } else if (startEdgeIndex <= endEdgeIndex) {
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
    edgeGroups[entryEdge].push({
      triplet: feature,
      entryPoint,
      center: feature.center,
      exitPoint,
      entryEdge,
      exitEdge,
      offsetDir,
      type: feature.type,
      sortPosition: getSortPosition(entryPoint, entryEdge, plank),
    });
  });

  edgeGroups.LEFT.sort((a, b) => a.sortPosition - b.sortPosition);
  edgeGroups.TOP.sort((a, b) => a.sortPosition - b.sortPosition);
  edgeGroups.RIGHT.sort((a, b) => b.sortPosition - a.sortPosition);
  edgeGroups.BOTTOM.sort((a, b) => b.sortPosition - a.sortPosition);
  return edgeGroups;
}

// ========================================
// T1 RECTANGLE
// ========================================

function generateT1_Rectangle(plank: GCodePlank): string[] {
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

  gcode.push(`G00 X${P1.x.toFixed(4)} Y${P1.y.toFixed(4)} Z${Z_SAFE.toFixed(4)}`);
  gcode.push(`G00 Z${Z_APPROACH.toFixed(4)}`);
  passes.forEach((depth) => {
    gcode.push(`G01 Z${depth.toFixed(4)} F${PLUNGE_FEED_RATE.toFixed(4)}`);
    gcode.push(`G01 X${P4.x.toFixed(4)} Y${P4.y.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
    gcode.push(`G01 X${P3.x.toFixed(4)} Y${P3.y.toFixed(4)}`);
    gcode.push(`G01 X${P2.x.toFixed(4)} Y${P2.y.toFixed(4)}`);
    gcode.push(`G01 X${P1.x.toFixed(4)} Y${P1.y.toFixed(4)}`);
  });
  gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);
  return gcode;
}

// ========================================
// T1 INTEGRATED (L-cuts + Gola; no incuts in this port for brevity)
// ========================================

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
  const edgeGroupsOriginal = buildEdgeFeatureGroups(plank);

  gcode.push(`G00 X${P1.x.toFixed(4)} Y${P1.y.toFixed(4)} Z${Z_SAFE.toFixed(4)}`);
  gcode.push(`G00 Z${Z_APPROACH.toFixed(4)}`);

  const edgeSequence: { key: EdgeName; endCorner: Point; nextKey: EdgeName }[] = [
    { key: 'LEFT', endCorner: P4, nextKey: 'TOP' },
    { key: 'TOP', endCorner: P3, nextKey: 'RIGHT' },
    { key: 'RIGHT', endCorner: P2, nextKey: 'BOTTOM' },
    { key: 'BOTTOM', endCorner: P1, nextKey: 'LEFT' },
  ];

  passes.forEach((depth) => {
    gcode.push(`G01 Z${depth.toFixed(4)} F${PLUNGE_FEED_RATE.toFixed(4)}`);
    const currentPassGroups: EdgeGroups = {
      LEFT: [...edgeGroupsOriginal.LEFT],
      TOP: [...edgeGroupsOriginal.TOP],
      RIGHT: [...edgeGroupsOriginal.RIGHT],
      BOTTOM: [...edgeGroupsOriginal.BOTTOM],
    };

    edgeSequence.forEach((edge) => {
      const features = currentPassGroups[edge.key];
      let skipCorner = false;
      while (features.length > 0) {
        const feature = features.shift()!;
        const compEntry = getCompensatedEntry(
          feature.entryPoint,
          feature.entryEdge,
          feature.offsetDir,
          plank,
          R
        );
        const compCenter = getCompensatedCenter(feature.center, feature.offsetDir, R);
        const compExit = getCompensatedExit(
          feature.exitPoint,
          feature.exitEdge,
          feature.offsetDir,
          plank,
          R
        );
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
    });
  });
  gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);
  return gcode;
}

// ========================================
// INTERNAL RECT CUTS
// ========================================

function generateInternalRectCuts(plank: GCodePlank): string[] {
  const gcode: string[] = [];
  if (!plank.features.incut_cuts?.length) return gcode;
  const R = BIT_RADIUS;
  const plankLeft = plank.x;
  const plankRight = plank.x + plank.placedWidth;
  const plankBottom = plank.y;
  const plankTop = plank.y + plank.placedHeight;

  const internalRects = plank.features.incut_cuts.filter((cut) => {
    if (!cut.points || cut.points.length !== 4) return false;
    return cut.points.every(
      (p) =>
        p.x - plankLeft > EDGE_THRESHOLD &&
        plankRight - p.x > EDGE_THRESHOLD &&
        p.y - plankBottom > EDGE_THRESHOLD &&
        plankTop - p.y > EDGE_THRESHOLD
    );
  });
  if (internalRects.length === 0) return gcode;

  const passes = getProfilePassDepths(plank.thickness);
  const Z_APPROACH = plank.thickness;
  internalRects.forEach((rect) => {
    const pts = rect.points;
    const minX = Math.min(...pts.map((p) => p.x));
    const maxX = Math.max(...pts.map((p) => p.x));
    const minY = Math.min(...pts.map((p) => p.y));
    const maxY = Math.max(...pts.map((p) => p.y));
    const P1 = { x: minX + R, y: minY + R };
    const P2 = { x: minX + R, y: maxY - R };
    const P3 = { x: maxX - R, y: maxY - R };
    const P4 = { x: maxX - R, y: minY + R };
    gcode.push(`G00 X${P1.x.toFixed(4)} Y${P1.y.toFixed(4)} Z${Z_SAFE.toFixed(4)}`);
    gcode.push(`G00 Z${Z_APPROACH.toFixed(4)}`);
    passes.forEach((depth) => {
      gcode.push(`G01 Z${depth.toFixed(4)} F${PLUNGE_FEED_RATE.toFixed(4)}`);
      gcode.push(`G01 X${P2.x.toFixed(4)} Y${P2.y.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
      gcode.push(`G01 X${P3.x.toFixed(4)} Y${P3.y.toFixed(4)}`);
      gcode.push(`G01 X${P4.x.toFixed(4)} Y${P4.y.toFixed(4)}`);
      gcode.push(`G01 X${P1.x.toFixed(4)} Y${P1.y.toFixed(4)}`);
    });
    gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);
  });
  return gcode;
}

// ========================================
// PROCESS T1 (narrow grooves + internal rects + perimeter)
// ========================================

function processToolT1(planks: GCodePlank[]): string[] {
  const gcode: string[] = [];
  const toolNumber = 'T1';
  if (planks.length === 0) return gcode;
  gcode.push(...outputToolStart(toolNumber, planks));

  planks.forEach((plank) => {
    const narrowGrooves = plank.features.slots?.filter((slot) => slot.width < TOOL_DIAMETER_T2) ?? [];
    if (narrowGrooves.length > 0) {
      const Z_APPROACH = plank.thickness;
      narrowGrooves.forEach((slot) => {
        gcode.push(...generateSlotGCode(plank, slot, Z_APPROACH, TOOL_DIAMETER_T1));
      });
    }
  });

  planks.forEach((plank) => {
    const internal = generateInternalRectCuts(plank);
    if (internal.length > 0) gcode.push(...internal);
  });

  planks.forEach((plank) => {
    const hasLCut = (plank.features.l_cuts?.length ?? 0) > 0;
    const hasGola = (plank.features.gola_profiles?.length ?? 0) > 0;
    const hasIncut = (plank.features.incut_cuts?.length ?? 0) > 0;
    if (hasLCut || hasGola || hasIncut) {
      gcode.push(...generateT1_Integrated(plank));
    } else {
      gcode.push(...generateT1_Rectangle(plank));
    }
  });
  gcode.push('M05');
  return gcode;
}

// ========================================
// GENERATE G-CODE FOR SHEET
// ========================================

function removeComments(gcodeArray: string[]): string[] {
  return gcodeArray.filter(
    (line) => !line.trim().startsWith('(') || !line.trim().endsWith(')')
  );
}

function generateGCodeForSheet(
  planks: GCodePlank[],
  sheetName: string
): string {
  const gcode: string[] = [];
  resetGCodeState(sheetName);
  gcode.push('G300');
  gcode.push(...processTool('T3', 'Screw Holes', planks, () => Z_THROUGH_CUT_FINAL_HEIGHT));
  gcode.push(...processTool('T5', 'Hinge Holes', planks, (p) => p.thickness - FIXED_DEPTHS.T5));
  gcode.push(...processTool('T4', 'VB Main', planks, (p) => p.thickness - FIXED_DEPTHS.T4));
  gcode.push(...processTool('T6', 'VB Double', planks, (p) => p.thickness - FIXED_DEPTHS.T6));
  gcode.push(...processSlotTool('T2', 'Slot/Profile Grooves (>=10mm)', planks, TOOL_DIAMETER_T2));
  const sortedPlanksForT1 = sortPlanksForT1(planks);
  gcode.push(...processToolT1(sortedPlanksForT1));
  gcode.push('G301');
  gcode.push('M30');
  return removeComments(gcode).join('\n');
}

function generateGCodeForSheets(
  sheetsMap: Record<string, { materialFolder: string; planks: GCodePlank[] }>
): GCodeResult[] {
  const results: GCodeResult[] = [];
  Object.keys(sheetsMap)
    .sort()
    .forEach((uniqueSheetName) => {
      try {
        const sheetData = sheetsMap[uniqueSheetName];
        const gcode = generateGCodeForSheet(sheetData.planks, uniqueSheetName);
        const fileName = `${uniqueSheetName}.nc`;
        const thicknessVal =
          sheetData.planks.length > 0 ? Math.round(sheetData.planks[0].thickness) : 0;
        results.push({
          sheetName: uniqueSheetName,
          fileName,
          materialFolder: sheetData.materialFolder,
          thickness: thicknessVal,
          content: gcode,
          plankCount: sheetData.planks.length,
        });
      } catch {
        // skip failed sheet
      }
    });
  return results;
}

// ========================================
// PUBLIC API
// ========================================

/**
 * Generate G-code files from cutlist (Nest Result) header and rows.
 * Returns array of results; use buildGCodeZip to create downloadable ZIP.
 */
export function generateGCodeFiles(
  cutlistHeader: string[],
  cutlistRows: (string | number)[][],
  _config?: GCodeConfig
): GCodeResult[] {
  const planks = getNestDataFromRows(cutlistHeader, cutlistRows);
  if (planks.length === 0) return [];
  const sheetsMap = groupBySheet(planks);
  if (Object.keys(sheetsMap).length === 0) return [];
  return generateGCodeForSheets(sheetsMap);
}

/**
 * Build a ZIP blob containing G-code NC files.
 * Structure: ProjectName/MaterialFolder/ThicknessMM/SheetName.nc
 */
export async function buildGCodeZip(
  gcodeResults: GCodeResult[],
  projectName: string
): Promise<Blob> {
  const zip = new JSZip();
  const safeName = (projectName || 'G_CODES').trim().replace(/[/\\?%*:|"<>]/g, '_');
  const projectFolder = zip.folder(safeName);
  if (!projectFolder) return zip.generateAsync({ type: 'blob' });

  const matFolders: Record<string, JSZip> = {};
  const thickFolders: Record<string, JSZip> = {};
  for (const result of gcodeResults) {
    const matName = result.materialFolder;
    const thickName = `${result.thickness}MM`;
    let matFolder = matFolders[matName];
    if (!matFolder) {
      matFolder = projectFolder.folder(matName) ?? projectFolder;
      matFolders[matName] = matFolder;
    }
    const thickKey = `${matName}/${thickName}`;
    let thickFolder = thickFolders[thickKey];
    if (!thickFolder) {
      thickFolder = matFolder.folder(thickName) ?? matFolder;
      thickFolders[thickKey] = thickFolder;
    }
    thickFolder.file(result.fileName, result.content);
  }

  return zip.generateAsync({ type: 'blob' });
}

/**
 * Trigger download of G-code ZIP (call after buildGCodeZip).
 */
export function downloadGCodeZip(blob: Blob, projectName: string): void {
  const name = (projectName || 'G_CODES').trim().replace(/[/\\?%*:|"<>]/g, '_');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name}_G_CODES.zip`;
  link.click();
  URL.revokeObjectURL(url);
}
