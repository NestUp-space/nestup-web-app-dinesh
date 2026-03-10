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

/** Hole/point position; z and diameter are optional (generator uses only x, y) */
interface Position {
  x: number;
  y: number;
  z?: number;
  diameter?: number;
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
  features: PlankFeatures;
}

/** Config type for G-code generator (used by GCodeGenerator UI) */
export interface GCodeConfig {
  [key: string]: unknown;
}

export interface GCodeResult {
  sheetName: string;
  fileName: string;
  materialFolder: string;
  thicknessFolder: string;
  content: string;
  plankCount: number;
}

/** Result shape for project-level G-code generation (used by GCodeGenerator UI) */
export interface ProjectGCodeResult {
  files: GCodeResult[];
  totalFiles: number;
  totalPlanks: number;
  byMaterial: Record<string, unknown>;
}

/** Default machine config (compatible with GCodeConfig) */
export const DEFAULT_CONFIG: GCodeConfig = {};

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
const TOOL_DIAMETER_T2 = 10;

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
    l_cuts: [],
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
 * Process slot tool (T2)
 */
function processSlotTool(planks: GCodePlank[]): string[] {
  const gcode: string[] = [];
  let hasOperations = false;

  planks.forEach((plank) => {
    if (plank.features.slots && plank.features.slots.length > 0) {
      if (!hasOperations) {
        gcode.push(...outputToolStart('T2'));
        hasOperations = true;
      }

      const Z_APPROACH = plank.thickness;

      plank.features.slots.forEach((slot) => {
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
        const { offsets } = getLateralPaths(slot.width, TOOL_DIAMETER_T2);

        offsets.forEach((offset) => {
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

          const Xs = Math.max(Xs_path, MIN_COORDINATE_VALUE);
          const Ys = Math.max(Ys_path, MIN_COORDINATE_VALUE);
          const Xe = Math.max(Xe_path, MIN_COORDINATE_VALUE);
          const Ye = Math.max(Ye_path, MIN_COORDINATE_VALUE);

          gcode.push(`G00 X${Xs.toFixed(4)} Y${Ys.toFixed(4)} Z${Z_SAFE.toFixed(4)}`);
          gcode.push(`G00 Z${Z_APPROACH.toFixed(4)}`);
          gcode.push(`G01 Z${finalCutZ.toFixed(4)} F${PLUNGE_FEED_RATE.toFixed(4)}`);
          gcode.push(`G01 X${Xe.toFixed(4)} Y${Ye.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
          gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);
        });
      });
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

/**
 * Generate T1 L-cut profile (with triplet coordinates)
 */
function generateT1_LCut(plank: GCodePlank): string[] {
  const gcode: string[] = [];

  if (!plank.features.l_cuts || plank.features.l_cuts.length === 0) {
    return generateT1_Rectangle(plank);
  }

  const l_cut = plank.features.l_cuts[0];
  const passes = getProfilePassDepths(plank.thickness);
  const Z_APPROACH = plank.thickness;
  const R = BIT_RADIUS;

  // Handle legacy format
  if (l_cut.legacy) {
    console.warn(`Using legacy L-cut for plank "${plank.name}"; please re-export using triplet format.`);
    return generateT1_Rectangle(plank); // Fallback to rectangle
  }

  const { start, center, end } = l_cut;
  const plankX = plank.x;
  const plankY = plank.y;
  const plankW = plank.placedWidth;
  const plankH = plank.placedHeight;

  // Define corners
  const corners = [
    { x: plankX, y: plankY },
    { x: plankX + plankW, y: plankY },
    { x: plankX + plankW, y: plankY + plankH },
    { x: plankX, y: plankY + plankH },
  ];

  // Find which corner the L-cut removes
  let cutCornerIdx = 0;
  let minDist = Infinity;
  corners.forEach((corner, idx) => {
    const dist = Math.sqrt(Math.pow(center.x - corner.x, 2) + Math.pow(center.y - corner.y, 2));
    if (dist < minDist) {
      minDist = dist;
      cutCornerIdx = idx;
    }
  });

  // Calculate offset vectors
  const v1 = { x: center.x - start.x, y: center.y - start.y };
  const v2 = { x: end.x - center.x, y: end.y - center.y };
  const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y) || 1;
  const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y) || 1;
  const n1 = { x: v1.x / len1, y: v1.y / len1 };
  const n2 = { x: v2.x / len2, y: v2.y / len2 };

  const cross = n1.x * n2.y - n1.y * n2.x;
  const outwardSign = cross >= 0 ? 1 : -1;

  const perp1 = { x: -n1.y * outwardSign, y: n1.x * outwardSign };
  const perp2 = { x: -n2.y * outwardSign, y: n2.x * outwardSign };

  const startOffset = {
    x: Math.max(start.x + perp1.x * R, MIN_COORDINATE_VALUE),
    y: Math.max(start.y + perp1.y * R, MIN_COORDINATE_VALUE),
  };

  const bisector = { x: perp1.x + perp2.x, y: perp1.y + perp2.y };
  const bisectorLen = Math.sqrt(bisector.x * bisector.x + bisector.y * bisector.y) || 1;
  const centerOffset = {
    x: Math.max(center.x + (bisector.x / bisectorLen) * R * 1.414, MIN_COORDINATE_VALUE),
    y: Math.max(center.y + (bisector.y / bisectorLen) * R * 1.414, MIN_COORDINATE_VALUE),
  };

  const endOffset = {
    x: Math.max(end.x + perp2.x * R, MIN_COORDINATE_VALUE),
    y: Math.max(end.y + perp2.y * R, MIN_COORDINATE_VALUE),
  };

  // Get remaining corners with offsets
  const cx = plankX + plankW / 2;
  const cy = plankY + plankH / 2;
  const cornerOffsets = corners
    .map((corner, idx) => {
      if (idx === cutCornerIdx) return null;
      const dirX = corner.x < cx ? -1 : 1;
      const dirY = corner.y < cy ? -1 : 1;
      return {
        x: Math.max(corner.x + dirX * R, MIN_COORDINATE_VALUE),
        y: Math.max(corner.y + dirY * R, MIN_COORDINATE_VALUE),
        originalIdx: idx,
      };
    })
    .filter((c) => c !== null) as { x: number; y: number; originalIdx: number }[];

  // Generate G-code
  gcode.push(`G00 X${startOffset.x.toFixed(4)} Y${startOffset.y.toFixed(4)} Z${Z_SAFE.toFixed(4)}`);
  gcode.push(`G00 Z${Z_APPROACH.toFixed(4)}`);

  passes.forEach((depth) => {
    gcode.push(`G01 Z${depth.toFixed(4)} F${PLUNGE_FEED_RATE.toFixed(4)}`);
    gcode.push(`G01 X${centerOffset.x.toFixed(4)} Y${centerOffset.y.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
    gcode.push(`G01 X${endOffset.x.toFixed(4)} Y${endOffset.y.toFixed(4)}`);

    cornerOffsets.forEach((corner) => {
      gcode.push(`G01 X${corner.x.toFixed(4)} Y${corner.y.toFixed(4)}`);
    });

    gcode.push(`G01 X${startOffset.x.toFixed(4)} Y${startOffset.y.toFixed(4)}`);
  });

  gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);
  return gcode;
}

/**
 * Process T1 - Profile cutting tool
 */
function processToolT1(planks: GCodePlank[]): string[] {
  const gcode: string[] = [];

  if (planks.length === 0) return gcode;

  // Sort by area (smallest first)
  const sortedPlanks = [...planks].sort((a, b) => {
    const areaA = a.placedWidth * a.placedHeight;
    const areaB = b.placedWidth * b.placedHeight;
    return areaA - areaB;
  });

  gcode.push(...outputToolStart('T1'));

  sortedPlanks.forEach((plank) => {
    const hasLCut = plank.features.l_cuts && plank.features.l_cuts.length > 0;
    if (hasLCut) {
      gcode.push(...generateT1_LCut(plank));
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
 * Generate G-code files from planks grouped by sheet (for UI / project-level use)
 */
export function generateGCodeForProject(
  planksBySheet: Record<string, GCodePlank[]>,
  _options?: { config?: unknown }
): { files: GCodeResult[] } {
  const planks = Object.values(planksBySheet).flat();
  const groups = groupByMaterialAndThickness(planks);
  const results: GCodeResult[] = [];

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

  return { files: results };
}

/**
 * Build a ZIP blob from a project G-code result (for download without saving to disk)
 */
export async function generateGCodeZip(
  projectResult: ProjectGCodeResult,
  projectName: string = 'CNC_Project'
): Promise<Blob> {
  const gcodeResults = projectResult.files;
  if (gcodeResults.length === 0) {
    return new Blob([], { type: 'application/zip' });
  }

  const zip = new JSZip();
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const mainFolderName = `${projectName.replace(/[/\\?%*:|"<>]/g, '_')}_G_CODES_${timestamp}`;
  const mainFolder = zip.folder(mainFolderName)!;

  const materialFolders = new Map<string, JSZip>();
  const thicknessFolders = new Map<string, JSZip>();

  gcodeResults.forEach((result) => {
    const matKey = result.materialFolder;
    const thickKey = `${matKey}_${result.thicknessFolder}`;

    if (!materialFolders.has(matKey)) {
      materialFolders.set(matKey, mainFolder.folder(matKey)!);
    }
    if (!thicknessFolders.has(thickKey)) {
      const matFolder = materialFolders.get(matKey)!;
      thicknessFolders.set(thickKey, matFolder.folder(result.thicknessFolder)!);
    }
    const thickFolder = thicknessFolders.get(thickKey)!;
    thickFolder.file(result.fileName, result.content);
  });

  const flatFolder = mainFolder.folder('ALL_NC_FILES_FLAT')!;
  gcodeResults.forEach((result) => {
    flatFolder.file(result.fileName, result.content);
  });

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

  return zip.generateAsync({ type: 'blob' });
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
