/**
 * Formatted Data Generator with L-Cut and Gola Profile Support
 * 100% PORT from AppScript FormattedData.js v9.0
 *
 * FEATURES:
 * 1. FACE ORIENTATION: Maps faces (XYZ -> XY).
 * 2. MIRRORING: Mirrors X coordinates for Right, Bottom, and Doors.
 * 3. EDGE BINDING:
 *    - Holes: Offset X and Y.
 *    - Slots: Offset X only (Y is NOT offset).
 *    - L-Cuts/Gola: Offset X and Y (same as holes).
 * 4. OVERSIZE CHECK: Warns if planks exceed sheet size.
 * 5. L-CUT TRIPLETS: Detects and processes L-cut points (start, center, end).
 * 6. GOLA PROFILE TRIPLETS: Detects and processes Gola profile points.
 *
 * ALTERATION FROM APPSCRIPT: Only I/O changed.
 *   - Input: rawValues (2D array, first row = headers) + ebSettings object
 *   - Output: { header: string[], rows: (string|number)[][], warnings: string[] }
 *   - No SpreadsheetApp, no PropertiesService, no HtmlService
 */

// =================================================================
// =================== TYPES ===================
// =================================================================

export interface EBSettings {
  [material: string]: string | number;
}

export interface FormattedDataResult {
  header: string[];
  rows: (string | number)[][];
  warnings: string[];
  dynamicOpHeader: string[];
}

interface RowData {
  entity_name: string;
  unit_location: string;
  material: string;
  LenX: number;
  LenY: number;
  LenZ: number;
  X: number;
  Y: number;
  Z: number;
  room_name: string;
}

interface BoxContext {
  box_name: string;
  orientation: string;
  room_name: string;
  box_type: string;
  box_model: string;
}

interface PlankContext {
  name: string;
  key: string;
  type: string;
  finalWidth: number;
  finalHeight: number;
}

interface TripletPoint {
  x: number;
  y: number;
  type: string;
  rawOrder: number;
}

interface IncutPoint {
  x: number;
  y: number;
}

interface Triplet {
  start: { x: number; y: number } | null;
  center: { x: number; y: number } | null;
  end: { x: number; y: number } | null;
}

interface HardwareColumn {
  originalName: string;
  material: string;
}

// =================================================================
// =================== VALIDATION & HELPERS ===================
// =================================================================

export function validateOversizedPlanks(rawValues: unknown[][]): { hasOversized: boolean; details: string[] } {
  const SHEET_A = 2421;
  const SHEET_B = 1200;
  if (rawValues.length < 2) return { hasOversized: false, details: [] };

  const header = rawValues[0].map(h => String(h).trim());
  const idx: Record<string, number> = {
    LenX: findColumnIndex(header, 'LenX'),
    LenY: findColumnIndex(header, 'LenY'),
    LenZ: findColumnIndex(header, 'LenZ'),
    entity_name: findColumnIndex(header, 'entity_name'),
    unit_location: findColumnIndex(header, 'Unit_location'),
    material: findColumnIndex(header, 'material'),
    Level: findColumnIndex(header, 'Level'),
  };

  const oversizedDetails: string[] = [];

  for (let r = 1; r < rawValues.length; r++) {
    const row = rawValues[r] as unknown[];
    const level = getRowLevel(row, idx);
    if (level === 0) continue;
    if (level !== 2) continue;

    const lx = parseFloatSafe(safeCell(row as unknown[], idx.LenX));
    const ly = parseFloatSafe(safeCell(row as unknown[], idx.LenY));
    const lz = parseFloatSafe(safeCell(row as unknown[], idx.LenZ));
    const dims = [lx, ly, lz].sort((a, b) => a - b);

    const middle = dims[1];
    const largest = dims[2];

    const fitsOrientation1 = largest <= SHEET_A && middle <= SHEET_B;
    const fitsOrientation2 = largest <= SHEET_B && middle <= SHEET_A;

    if (!(fitsOrientation1 || fitsOrientation2)) {
      const name = safeCell(row, idx.entity_name) || `(row ${r + 1})`;
      oversizedDetails.push(`${name} — sizes: ${dims[2]} x ${dims[1]} (row ${r + 1})`);
    }
  }

  return { hasOversized: oversizedDetails.length > 0, details: oversizedDetails };
}

function applyEdgeBindingWithSettings(
  plankName: string,
  plankMaterial: string,
  initialLength: number,
  initialWidth: number,
  plankThickness: number,
  ebSettings: EBSettings | null
): { newLength: number; newWidth: number; offset: number } {
  const name = String(plankName || '').toLowerCase();
  const material = String(plankMaterial || '').trim();

  const escapeHtml = (unsafe: string) => {
    const s = String(unsafe || '');
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const settings = ebSettings || {};

  const materialKey = escapeHtml(material);
  let offset = 0;

  if (plankThickness < 14) return { newLength: initialLength, newWidth: initialWidth, offset: 0 };

  if (/\bback\b|back plank|back_panel|back panel/.test(name)) {
    return { newLength: initialLength, newWidth: initialWidth, offset: 0 };
  }

  if (settings.hasOwnProperty(materialKey)) {
    offset = parseFloat(String(settings[materialKey]));
    if (isNaN(offset) || offset < 0) offset = 0;
  } else {
    offset = 2;
  }

  const newLength = initialLength - 2 * offset;
  const newWidth = initialWidth - 2 * offset;

  return { newLength, newWidth, offset };
}

export function findColumnIndex(headerRow: unknown[], targetName: string): number {
  if (!Array.isArray(headerRow) || headerRow.length === 0) return -1;
  const normalizedTarget = String(targetName).toLowerCase().replace(/[\s_]/g, '');
  for (let i = 0; i < headerRow.length; i++) {
    const normalizedHeader = String(headerRow[i] || '')
      .toLowerCase()
      .replace(/[\s_]/g, '');
    if (normalizedHeader === normalizedTarget) return i;
  }
  return -1;
}

function getLevelFromColumn(row: unknown[], levelIdx: number): number | null {
  if (levelIdx === -1 || levelIdx === null || levelIdx === undefined) return null;
  const levelVal = String(row[levelIdx] ?? '').trim();
  const levelNum = parseFloat(levelVal);
  return isNaN(levelNum) ? null : levelNum;
}

function detectLevelFallback(obj: { entity_name: string; unit_location: string }): number {
  const unitLocation = (obj.unit_location || '').toLowerCase();
  const entName = (obj.entity_name || '').toLowerCase();
  if (/north|south|east|west/.test(unitLocation)) return 1;
  if (/hole|groove|vb|screw|hinge|profile|slot|l_cutting|lcutting|l_cut_start|l_cut_center|l_cut_centre|l_cut_end|lcut_start|lcut_center|lcut_centre|lcut_end|gola_profile_start|gola_profile_center|gola_profile_centre|gola_profile_end|gola_start|gola_center|gola_centre|gola_end|incut_hole|incut_cut|inclined_cut|inplank_hole|internal_cut|internal.?cut/.test(entName))
    return 3;
  const isFurnitureWithWall = /wall\s*(mount|mounted|cabinet|unit|shelf|hung|panel|hanging|storage|rack)/i.test(entName);
  if (!isFurnitureWithWall && /\bwall\b/i.test(entName)) return 0;
  return 2;
}

function getRowLevel(row: unknown[], idx: Record<string, number>): number {
  const levelFromColumn = getLevelFromColumn(row, idx.Level);
  if (levelFromColumn !== null) return levelFromColumn;
  const rowObj = {
    entity_name: safeCell(row, idx.entity_name),
    unit_location: safeCell(row, idx.unit_location),
  };
  return detectLevelFallback(rowObj);
}

function detectOperationType(entName: string): string {
  const nameStr = (entName || '').toLowerCase();
  if (/vb_?main|vbmin|vb min|vbm|main_?vb/.test(nameStr)) return 'vb_main';
  if (/vb_?double|vbd|double_?vb/.test(nameStr)) return 'vb_double';
  if (/hinge|hing/.test(nameStr)) return 'hing';
  if (/screw|bolt|pta/.test(nameStr)) return 'screw';
  if (/gola_profile_start|golaprofile_start|gola_start/.test(nameStr)) return 'gola_profile_start';
  if (/gola_profile_center|golaprofile_center|gola_center/.test(nameStr)) return 'gola_profile_center';
  if (/gola_profile_end|golaprofile_end|gola_end/.test(nameStr)) return 'gola_profile_end';
  if (/profile/.test(nameStr)) return 'profile';
  if (/slot/.test(nameStr)) return 'slot';
  if (/groove/.test(nameStr)) return 'groove';
  if (/l_cut_start|lcut_start/.test(nameStr)) return 'l_cut_start';
  if (/l_cut_center|l_cut_centre|lcut_center|lcut_centre/.test(nameStr)) return 'l_cut_center';
  if (/l_cut_end|lcut_end/.test(nameStr)) return 'l_cut_end';
  if (/l_cutting|lcutting|l_groove/.test(nameStr)) return 'l_cutting_legacy';
  if (/inplank_hole|inplank_cut|incut_hole|incut_cut|inclined_cut|internal.?cut|internal_cut/.test(nameStr)) return 'incut_hole';
  if (/hole|drilled|bore/.test(nameStr)) return 'hole';
  return 'hole';
}

function isLCutType(opType: string): boolean {
  return ['l_cut_start', 'l_cut_center', 'l_cut_end'].includes(opType);
}

function isGolaType(opType: string): boolean {
  return ['gola_profile_start', 'gola_profile_center', 'gola_profile_end'].includes(opType);
}

function findMaxOperationCounts(
  rawValues: unknown[][],
  idx: Record<string, number>
): Record<string, number | boolean> {
  const plankOpCounter: Record<string, Record<string, number>> = {};
  const plankLCutTripletCounter: Record<string, { starts: number; centers: number; ends: number }> = {};
  const plankGolaProfileCounter: Record<string, { starts: number; centers: number; ends: number }> = {};
  const plankIncutCounter: Record<string, number> = {};
  let currentBox: { box_name: string } | null = null;
  let currentPlank: { key: string } | null = null;

  for (let r = 1; r < rawValues.length; r++) {
    const row = rawValues[r] as unknown[];
    const rowData = parseRowData(row, idx);
    const level = getRowLevel(row, idx);

    if (level === 0) continue;

    if (level === 1) {
      currentBox = { box_name: rowData.entity_name };
      currentPlank = null;
    } else if (level === 2) {
      currentPlank = { key: makePlankKey(currentBox, rowData.entity_name) };
    } else if (level === 3 && currentPlank) {
      const opType = detectOperationType(rowData.entity_name);
      if (opType === 'other') continue;
      const plankKey = currentPlank.key;

      if (isLCutType(opType)) {
        if (!plankLCutTripletCounter[plankKey]) {
          plankLCutTripletCounter[plankKey] = { starts: 0, centers: 0, ends: 0 };
        }
        if (opType === 'l_cut_start') plankLCutTripletCounter[plankKey].starts++;
        else if (opType === 'l_cut_center') plankLCutTripletCounter[plankKey].centers++;
        else if (opType === 'l_cut_end') plankLCutTripletCounter[plankKey].ends++;
      } else if (isGolaType(opType)) {
        if (!plankGolaProfileCounter[plankKey]) {
          plankGolaProfileCounter[plankKey] = { starts: 0, centers: 0, ends: 0 };
        }
        if (opType === 'gola_profile_start') plankGolaProfileCounter[plankKey].starts++;
        else if (opType === 'gola_profile_center') plankGolaProfileCounter[plankKey].centers++;
        else if (opType === 'gola_profile_end') plankGolaProfileCounter[plankKey].ends++;
      } else if (opType === 'incut_hole') {
        plankIncutCounter[plankKey] = (plankIncutCounter[plankKey] || 0) + 1;
      } else if (opType === 'l_cutting_legacy') {
        if (!plankOpCounter[plankKey]) plankOpCounter[plankKey] = {};
        plankOpCounter[plankKey]['l_cutting_legacy'] = (plankOpCounter[plankKey]['l_cutting_legacy'] || 0) + 1;
      } else {
        if (!plankOpCounter[plankKey]) plankOpCounter[plankKey] = {};
        plankOpCounter[plankKey][opType] = (plankOpCounter[plankKey][opType] || 0) + 1;
      }
    }
  }

  const maxCounts: Record<string, number | boolean> = {};
  for (const plankKey in plankOpCounter) {
    for (const opType in plankOpCounter[plankKey]) {
      const count = plankOpCounter[plankKey][opType];
      if (!maxCounts[opType] || count > (maxCounts[opType] as number)) {
        maxCounts[opType] = count;
      }
    }
  }

  let maxLCutTriplets = 0;
  for (const plankKey in plankLCutTripletCounter) {
    const d = plankLCutTripletCounter[plankKey];
    const completeTriplets = Math.min(d.starts, d.centers, d.ends);
    if (completeTriplets > maxLCutTriplets) maxLCutTriplets = completeTriplets;
  }
  maxCounts['l_cut_triplet'] = maxLCutTriplets;

  let maxGolaProfileTriplets = 0;
  for (const plankKey in plankGolaProfileCounter) {
    const d = plankGolaProfileCounter[plankKey];
    const completeTriplets = Math.min(d.starts, d.centers, d.ends);
    if (completeTriplets > maxGolaProfileTriplets) maxGolaProfileTriplets = completeTriplets;
  }
  maxCounts['gola_triplet'] = maxGolaProfileTriplets;

  let maxIncutCuts = 0;
  let hasAnyFourPointCuts = false;
  for (const plankKey in plankIncutCounter) {
    const count = plankIncutCounter[plankKey];
    let n: number;
    if (count >= 4 && count % 4 === 0) {
      n = count / 4;
      hasAnyFourPointCuts = true;
    } else {
      n = Math.floor(count / 2);
    }
    if (n > maxIncutCuts) maxIncutCuts = n;
  }
  maxCounts['incut_rect'] = maxIncutCuts;
  maxCounts['has_inplank'] = hasAnyFourPointCuts;

  return maxCounts;
}

function getPlankType(plankName: string): string {
  const name = (plankName || '').toLowerCase();
  if (/left|right|vertical|maindummy|middle/.test(name)) return 'vertical';
  if (/door|back|skirting|drawfacia|drawfront|drawback|drawdummy|draw|dummy|tandemback/.test(name))
    return 'face';
  if (/top|bottom|shelf|tandembottom/.test(name)) return 'horizontal';
  return 'auto';
}

function resolvePlankType(rowData: RowData, boxOrientation: string, plankName: string): string {
  const nameType = getPlankType(plankName);
  if (nameType !== 'auto') return nameType;
  const { LenX, LenY, LenZ } = rowData;
  if (!(LenX > 0) || !(LenY > 0) || !(LenZ > 0)) return 'horizontal';
  if (boxOrientation === 'EW' || boxOrientation === 'NS') {
    const dims = [LenX, LenY, LenZ];
    const minDim = Math.min(...dims);
    if (minDim === LenZ) return 'horizontal';
    if (minDim === LenX) return 'vertical';
    if (minDim === LenY) return 'face';
  }
  return 'horizontal';
}

function calculateTransformedDimensions(
  rowData: RowData,
  orientation: string,
  plankType: string
): { length: number; width: number; thickness: number } {
  const { LenX, LenY, LenZ } = rowData;
  if (orientation === 'EW' || orientation === 'NS') {
    if (plankType === 'horizontal') return { length: LenX, width: LenY, thickness: LenZ };
    if (plankType === 'vertical') return { length: LenZ, width: LenY, thickness: LenX };
    if (plankType === 'face') return { length: LenZ, width: LenX, thickness: LenY };
  }
  const dims = [LenX, LenY, LenZ].sort((a, b) => a - b);
  return { thickness: dims[0], width: dims[1], length: dims[2] };
}

// =================================================================
// =================== TRANSFORM COORDINATES ===================
// =================================================================

function transformCoordinates(
  rowData: RowData,
  _currentBox: BoxContext,
  plankName: string,
  plankType: string,
  opType: string,
  plankThickness: number,
  plankOffset: number,
  finalPlankWidth: number
): {
  transformedX: number;
  transformedY: number;
  finalZ: number;
  startX: number | null;
  startY: number | null;
  startZ: number | null;
} {
  const { X: rawX, Y: rawY, Z: rawZ, LenX, LenY, LenZ } = rowData;

  let rawFaceX: number, rawFaceY: number, rawFaceDimL: number, rawFaceDimW: number;
  let startZ: number;

  if (plankType === 'horizontal') {
    rawFaceX = rawY;
    rawFaceY = rawX;
    rawFaceDimL = LenX;
    rawFaceDimW = LenY;
    startZ = LenZ;
  } else if (plankType === 'vertical') {
    rawFaceX = rawY;
    rawFaceY = rawZ;
    rawFaceDimL = LenZ;
    rawFaceDimW = LenY;
    startZ = LenX;
  } else {
    rawFaceX = rawX;
    rawFaceY = rawZ;
    rawFaceDimL = LenX;
    rawFaceDimW = LenZ;
    startZ = LenY;
  }

  let offset = Number(plankOffset);
  if (isNaN(offset) || offset < 0) offset = 0;

  if (offset > 0) {
    rawFaceX -= offset;
    rawFaceY -= offset;
  }

  let transformedX: number, transformedY: number, finalZ: number;
  let startX: number | null = null,
    startY: number | null = null,
    startZ_out: number | null = null;

  const grooveTokens = ['groove', 'slot', 'profile', 'l_groove'];

  if (grooveTokens.includes(opType)) {
    startX = rawFaceX;
    startY = rawFaceY + offset;
    startZ_out = startZ;
    transformedX = rawFaceDimL;
    transformedY = rawFaceDimW;
    finalZ = startZ_out;
  } else {
    transformedX = rawFaceX;
    transformedY = rawFaceY;
    switch (opType) {
      case 'hing':
        finalZ = 14;
        break;
      case 'vb_main':
        finalZ = 16;
        break;
      case 'vb_double':
        finalZ = 11;
        break;
      default:
        finalZ = plankThickness || 0;
        break;
    }
  }

  const pName = (plankName || '').toLowerCase();
  const shouldMirror =
    pName.includes('right') || pName.includes('bottom') || pName.includes('door');

  if (shouldMirror) {
    if (startX !== null) {
      startX = finalPlankWidth - startX;
    } else {
      transformedX = finalPlankWidth - transformedX;
    }
  }

  return { transformedX, transformedY, finalZ, startX, startY, startZ: startZ_out };
}

function transformTripletPoint(
  rowData: RowData,
  plankType: string,
  plankOffset: number,
  finalPlankWidth: number,
  shouldMirror: boolean,
  finalPlankHeight: number
): { x: number; y: number } {
  const { X: rawX, Y: rawY, Z: rawZ } = rowData;

  let rawFaceX: number, rawFaceY: number;

  if (plankType === 'horizontal') {
    rawFaceX = rawY;
    rawFaceY = rawX;
  } else if (plankType === 'vertical') {
    rawFaceX = rawY;
    rawFaceY = rawZ;
  } else {
    rawFaceX = rawX;
    rawFaceY = rawZ;
  }

  let offset = Number(plankOffset);
  if (isNaN(offset) || offset < 0) offset = 0;

  if (offset > 0) {
    const rawWidth = finalPlankWidth + 2 * offset;
    const rawHeight =
      finalPlankHeight !== undefined && finalPlankHeight > 0 ? finalPlankHeight + 2 * offset : 0;

    const SNAP_TOL = offset + 1.5;

    if (rawFaceX <= SNAP_TOL) {
      rawFaceX = 0;
    } else if (rawWidth > 0 && rawFaceX >= rawWidth - SNAP_TOL) {
      rawFaceX = finalPlankWidth;
    } else {
      if (rawWidth > 0 && rawFaceX >= rawWidth / 2) {
        rawFaceX = rawFaceX - 2 * offset;
      } else {
        rawFaceX -= offset;
      }
    }

    if (rawFaceY <= SNAP_TOL) {
      rawFaceY = 0;
    } else if (rawHeight > 0 && rawFaceY >= rawHeight - SNAP_TOL) {
      rawFaceY = finalPlankHeight;
    } else {
      if (rawHeight > 0 && rawFaceY >= rawHeight / 2) {
        rawFaceY = rawFaceY - 2 * offset;
      } else {
        rawFaceY -= offset;
      }
    }
  }

  if (finalPlankWidth > 0 && rawFaceX > finalPlankWidth) {
    rawFaceX = finalPlankWidth;
  }
  if (rawFaceX < 0) {
    rawFaceX = 0;
  }
  if (finalPlankHeight !== undefined && finalPlankHeight > 0 && rawFaceY > finalPlankHeight) {
    rawFaceY = finalPlankHeight;
  }
  if (rawFaceY < 0) {
    rawFaceY = 0;
  }

  if (shouldMirror) {
    rawFaceX = finalPlankWidth - rawFaceX;
  }

  return { x: rawFaceX, y: rawFaceY };
}

// =================================================================
// =================== PARSING & FORMATTING ===================
// =================================================================

function parseRowData(row: unknown[], idx: Record<string, number>): RowData {
  return {
    entity_name: safeCell(row, idx.entity_name),
    unit_location: safeCell(row, idx.unit_location),
    material: safeCell(row, idx.material),
    LenX: parseFloatSafe(safeCell(row, idx.LenX)),
    LenY: parseFloatSafe(safeCell(row, idx.LenY)),
    LenZ: parseFloatSafe(safeCell(row, idx.LenZ)),
    X: parseFloatSafe(safeCell(row, idx.X)),
    Y: parseFloatSafe(safeCell(row, idx.Y)),
    Z: parseFloatSafe(safeCell(row, idx.Z)),
    room_name: safeCell(row, idx.room_name),
  };
}

function getBoxOrientation(unitLocation: string): string {
  const lower = (unitLocation || '').toLowerCase();
  if (lower.includes('north') || lower.includes('south')) return 'NS';
  if (lower.includes('east') || lower.includes('west')) return 'EW';
  return 'N/A';
}

function extractHardwareColumns(headers: string[]): HardwareColumn[] {
  const hardwareColumns: HardwareColumn[] = [];
  headers.forEach((header) => {
    const h = String(header || '').trim();
    if (h.includes('_q')) {
      const mat =
        h
          .split('_q')
          .filter((p) => p.trim())
          .pop() || `hw_${hardwareColumns.length + 1}`;
      hardwareColumns.push({
        originalName: h,
        material: mat.replace(/[^a-zA-Z0-9_]/g, '_'),
      });
    }
  });
  return hardwareColumns;
}

function makePlankKey(boxObj: { box_name: string } | null, plankName: string): string {
  const boxPart = boxObj && boxObj.box_name ? boxObj.box_name : '(no_box)';
  return `${boxPart}||${plankName}`;
}

function safeCell(row: unknown[], i: number): string {
  return i === -1 ? '' : String(row[i] ?? '');
}

function parseFloatSafe(v: string): number {
  const n = parseFloat(String(v).replace(/[^0-9eE.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function formatCoordinate(value: number): string | number {
  if (typeof value !== 'number' || isNaN(value)) return '';
  return Math.round(value * 10) / 10;
}

// =================================================================
// =================== MAIN PROCESSOR ===================
// =================================================================

/**
 * 100% port of AppScript formatSketchUpData().
 * Input: rawValues (2D array, first row = headers) + ebSettings.
 * Output: { header, rows, warnings, dynamicOpHeader }
 */
export function formatSketchUpData(
  rawValues: unknown[][],
  ebSettings: EBSettings | null
): FormattedDataResult {
  const warnings: string[] = [];

  if (rawValues.length < 2) throw new Error('Raw data is empty.');

  const header = rawValues[0].map((h) => String(h).trim());
  const idx: Record<string, number> = {
    entity_name: findColumnIndex(header, 'entity_name'),
    unit_location: findColumnIndex(header, 'Unit_location'),
    material: findColumnIndex(header, 'material'),
    LenX: findColumnIndex(header, 'LenX'),
    LenY: findColumnIndex(header, 'LenY'),
    LenZ: findColumnIndex(header, 'LenZ'),
    X: findColumnIndex(header, 'X'),
    Y: findColumnIndex(header, 'Y'),
    Z: findColumnIndex(header, 'Z'),
    room_name: findColumnIndex(header, 'Room_name'),
    box_type: findColumnIndex(header, 'Box_Type'),
    box_model: findColumnIndex(header, 'Box_Model'),
    Level: findColumnIndex(header, 'Level'),
  };
  const requiredCols = [
    'entity_name',
    'unit_location',
    'material',
    'LenX',
    'LenY',
    'LenZ',
    'X',
    'Y',
    'Z',
  ];
  const missing = requiredCols.filter((col) => idx[col] === -1);
  if (missing.length > 0) throw new Error('Missing required columns: ' + missing.join(', ') + '.');

  const maxOpCounts = findMaxOperationCounts(rawValues, idx);

  const hardwareColumns = extractHardwareColumns(header);
  const hardwareHeader = hardwareColumns.map((hc) => hc.material);
  const baseHeader = [
    'room_name',
    'box_type',
    'box_model',
    'box_orientation',
    'box_name',
    'plank_name',
    'plank_id',
    'plank_length',
    'plank_width',
    'plank_thickness',
    'plank_material',
    'EB_Value',
  ];

  const operationTypes = ['hing', 'screw', 'vb_main', 'vb_double', 'profile', 'slot', 'groove', 'hole'];
  const dynamicOpHeader: string[] = [];

  operationTypes.forEach((opType) => {
    const maxCount = (maxOpCounts[opType] as number) || 0;
    for (let i = 1; i <= maxCount; i++) {
      const baseName = `${opType}_${i}`;
      if (['profile', 'slot', 'groove'].includes(opType)) {
        dynamicOpHeader.push(
          `${baseName}_X`,
          `${baseName}_Y`,
          `${baseName}_Z`,
          `${baseName}_length`,
          `${baseName}_width`
        );
      } else {
        dynamicOpHeader.push(`${baseName}_X`, `${baseName}_Y`, `${baseName}_Z`);
      }
    }
  });

  const maxLCutTriplets = (maxOpCounts['l_cut_triplet'] as number) || 0;
  for (let i = 1; i <= maxLCutTriplets; i++) {
    dynamicOpHeader.push(
      `L_cut_${i}_start_X`,
      `L_cut_${i}_start_Y`,
      `L_cut_${i}_center_X`,
      `L_cut_${i}_center_Y`,
      `L_cut_${i}_end_X`,
      `L_cut_${i}_end_Y`
    );
  }

  const maxGolaTriplets = (maxOpCounts['gola_triplet'] as number) || 0;
  for (let i = 1; i <= maxGolaTriplets; i++) {
    dynamicOpHeader.push(
      `Gola_profile_${i}_start_X`,
      `Gola_profile_${i}_start_Y`,
      `Gola_profile_${i}_center_X`,
      `Gola_profile_${i}_center_Y`,
      `Gola_profile_${i}_end_X`,
      `Gola_profile_${i}_end_Y`
    );
  }

  const maxIncutCuts = (maxOpCounts['incut_rect'] as number) || 0;
  const hasInplankHoles = !!maxOpCounts['has_inplank'];
  for (let i = 1; i <= maxIncutCuts; i++) {
    dynamicOpHeader.push(
      `Incut_cut_${i}_point1_X`,
      `Incut_cut_${i}_point1_Y`,
      `Incut_cut_${i}_point2_X`,
      `Incut_cut_${i}_point2_Y`
    );
    if (hasInplankHoles) {
      dynamicOpHeader.push(
        `Incut_cut_${i}_point3_X`,
        `Incut_cut_${i}_point3_Y`,
        `Incut_cut_${i}_point4_X`,
        `Incut_cut_${i}_point4_Y`
      );
    }
  }

  const maxLegacyLCut = (maxOpCounts['l_cutting_legacy'] as number) || 0;
  for (let i = 1; i <= maxLegacyLCut; i++) {
    dynamicOpHeader.push(`l_cutting_${i}_X`, `l_cutting_${i}_Y`, `l_cutting_${i}_Z`);
  }

  const outHeader = baseHeader.concat(dynamicOpHeader, hardwareHeader, ['notes']);
  const outHeaderMap: Record<string, number> = {};
  outHeader.forEach((h, i) => {
    outHeaderMap[h] = i;
  });

  const outputRows: (string | number)[][] = [];

  let currentBox: BoxContext | null = null;
  let currentPlank: PlankContext | null = null;
  const plankRowMap: Record<string, number> = {};
  const plankOpsCounters: Record<string, Record<string, number>> = {};
  const plankThicknessMap: Record<string, number> = {};
  const plankOffsetMap: Record<string, number> = {};
  const plankLCutPoints: Record<string, TripletPoint[]> = {};
  const plankGolaPoints: Record<string, TripletPoint[]> = {};
  const plankIncutPoints: Record<string, IncutPoint[]> = {};
  let plankIdCounter = 1;

  for (let r = 1; r < rawValues.length; r++) {
    const row = rawValues[r] as unknown[];
    const rowData = parseRowData(row, idx);
    const level = getRowLevel(row, idx);

    if (level === 0) continue;

    if (level === 1) {
      currentBox = {
        box_name: rowData.entity_name || `Box_${r + 1}`,
        orientation: getBoxOrientation(rowData.unit_location),
        room_name: rowData.room_name || '',
        box_type: safeCell(row, idx.box_type),
        box_model: safeCell(row, idx.box_model),
      };
      currentPlank = null;
      continue;
    }

    if (level === 2) {
      if (!currentBox) continue;
      const plank_name = rowData.entity_name || `Component_${r + 1}`;
      const plankType = resolvePlankType(rowData, currentBox.orientation, plank_name);
      const dims = calculateTransformedDimensions(rowData, currentBox.orientation, plankType);

      const plankKey = makePlankKey(currentBox, plank_name);
      plankThicknessMap[plankKey] = dims.thickness;

      const materialRaw = rowData.material || '';
      const edgeBinding = applyEdgeBindingWithSettings(
        plank_name,
        materialRaw,
        dims.length,
        dims.width,
        dims.thickness,
        ebSettings
      );

      plankOffsetMap[plankKey] = edgeBinding.offset;

      const currentPlankId = String(plankIdCounter);
      plankIdCounter++;

      const finalMaterial = materialRaw
        ? `${materialRaw} (${currentBox.room_name})`
        : currentBox.room_name;

      const outRow: (string | number)[] = Array(outHeader.length).fill('');
      const baseRowData: (string | number)[] = [
        currentBox.room_name,
        currentBox.box_type,
        currentBox.box_model,
        currentBox.orientation,
        currentBox.box_name,
        plank_name,
        currentPlankId,
        edgeBinding.newLength,
        edgeBinding.newWidth,
        dims.thickness,
        finalMaterial,
        edgeBinding.offset,
      ];
      outRow.splice(0, baseRowData.length, ...baseRowData);

      hardwareColumns.forEach((hc) => {
        const hardwareColIdx = findColumnIndex(header, hc.originalName);
        if (hardwareColIdx !== -1) {
          const colIndex = outHeaderMap[hc.material];
          if (colIndex !== undefined) outRow[colIndex] = safeCell(row, hardwareColIdx) || '0';
        }
      });

      const rowIndex = outputRows.length;
      outputRows.push(outRow);
      plankRowMap[plankKey] = rowIndex;

      plankLCutPoints[plankKey] = [];
      plankGolaPoints[plankKey] = [];
      plankIncutPoints[plankKey] = [];

      currentPlank = {
        name: plank_name,
        key: plankKey,
        type: plankType,
        finalWidth: edgeBinding.newWidth,
        finalHeight: edgeBinding.newLength,
      };
      continue;
    }

    if (level === 3) {
      if (!currentPlank || !currentBox) continue;

      const opType = detectOperationType(rowData.entity_name);
      if (opType === 'other') continue;

      const plankKey = currentPlank.key;
      const plankOffset = plankOffsetMap[plankKey] || 0;

      const pName = (currentPlank.name || '').toLowerCase();
      const shouldMirror =
        pName.includes('right') || pName.includes('bottom') || pName.includes('door');

      if (isLCutType(opType)) {
        const transformedPoint = transformTripletPoint(
          rowData,
          currentPlank.type,
          plankOffset,
          currentPlank.finalWidth,
          shouldMirror,
          currentPlank.finalHeight
        );
        plankLCutPoints[plankKey].push({
          x: transformedPoint.x,
          y: transformedPoint.y,
          type: opType,
          rawOrder: plankLCutPoints[plankKey].length,
        });
        continue;
      }

      if (isGolaType(opType)) {
        const transformedPoint = transformTripletPoint(
          rowData,
          currentPlank.type,
          plankOffset,
          currentPlank.finalWidth,
          shouldMirror,
          currentPlank.finalHeight
        );
        plankGolaPoints[plankKey].push({
          x: transformedPoint.x,
          y: transformedPoint.y,
          type: opType,
          rawOrder: plankGolaPoints[plankKey].length,
        });
        continue;
      }

      if (opType === 'incut_hole') {
        const transformedPoint = transformTripletPoint(
          rowData,
          currentPlank.type,
          plankOffset,
          currentPlank.finalWidth,
          shouldMirror,
          currentPlank.finalHeight
        );
        plankIncutPoints[plankKey].push({ x: transformedPoint.x, y: transformedPoint.y });
        continue;
      }

      if (opType === 'l_cutting_legacy') {
        if (!plankOpsCounters[plankKey]) plankOpsCounters[plankKey] = {};
        const opCounter = (plankOpsCounters[plankKey]['l_cutting'] || 0) + 1;
        plankOpsCounters[plankKey]['l_cutting'] = opCounter;

        const {
          transformedX, transformedY, finalZ,
        } = transformCoordinates(
          rowData, currentBox, currentPlank.name, currentPlank.type, opType,
          plankThicknessMap[plankKey], plankOffset, currentPlank.finalWidth
        );

        const plankRowIndex = plankRowMap[plankKey];
        if (plankRowIndex === undefined) continue;

        const baseColName = `l_cutting_${opCounter}`;
        const colX = outHeaderMap[`${baseColName}_X`];
        const colY = outHeaderMap[`${baseColName}_Y`];
        const colZ = outHeaderMap[`${baseColName}_Z`];

        if (colX !== undefined) outputRows[plankRowIndex][colX] = formatCoordinate(transformedX);
        if (colY !== undefined) outputRows[plankRowIndex][colY] = formatCoordinate(transformedY);
        if (colZ !== undefined) outputRows[plankRowIndex][colZ] = formatCoordinate(finalZ);
        continue;
      }

      if (!plankOpsCounters[plankKey]) plankOpsCounters[plankKey] = {};
      const opCounter = (plankOpsCounters[plankKey][opType] || 0) + 1;
      plankOpsCounters[plankKey][opType] = opCounter;

      const {
        transformedX,
        transformedY,
        finalZ,
        startX,
        startY,
        startZ,
      } = transformCoordinates(
        rowData,
        currentBox,
        currentPlank.name,
        currentPlank.type,
        opType,
        plankThicknessMap[plankKey],
        plankOffset,
        currentPlank.finalWidth
      );

      const plankRowIndex = plankRowMap[plankKey];
      if (plankRowIndex === undefined) continue;

      const baseColName = `${opType}_${opCounter}`;

      if (['profile', 'slot', 'groove'].includes(opType)) {
        const colX = outHeaderMap[`${baseColName}_X`];
        const colY = outHeaderMap[`${baseColName}_Y`];
        const colZ = outHeaderMap[`${baseColName}_Z`];
        const colL = outHeaderMap[`${baseColName}_length`];
        const colW = outHeaderMap[`${baseColName}_width`];

        if (colX !== undefined) outputRows[plankRowIndex][colX] = formatCoordinate(startX!);
        if (colY !== undefined) outputRows[plankRowIndex][colY] = formatCoordinate(startY!);
        if (colZ !== undefined) outputRows[plankRowIndex][colZ] = formatCoordinate(startZ!);
        if (colL !== undefined) outputRows[plankRowIndex][colL] = formatCoordinate(transformedX);
        if (colW !== undefined) outputRows[plankRowIndex][colW] = formatCoordinate(transformedY);
      } else {
        const colX = outHeaderMap[`${baseColName}_X`];
        const colY = outHeaderMap[`${baseColName}_Y`];
        const colZ = outHeaderMap[`${baseColName}_Z`];

        if (colX !== undefined) outputRows[plankRowIndex][colX] = formatCoordinate(transformedX);
        if (colY !== undefined) outputRows[plankRowIndex][colY] = formatCoordinate(transformedY);
        if (colZ !== undefined) outputRows[plankRowIndex][colZ] = formatCoordinate(finalZ);
      }
    }
  }

  // =========================================================
  // ======= PROCESS L-CUT AND GOLA TRIPLETS ===============
  // =========================================================

  for (const plankKey in plankLCutPoints) {
    const points = plankLCutPoints[plankKey];
    if (points.length === 0) continue;

    const plankRowIndex = plankRowMap[plankKey];
    if (plankRowIndex === undefined) continue;

    const triplets = groupPointsIntoTriplets(points);

    triplets.forEach((triplet, index) => {
      const tripletNum = index + 1;

      const startXCol = outHeaderMap[`L_cut_${tripletNum}_start_X`];
      const startYCol = outHeaderMap[`L_cut_${tripletNum}_start_Y`];
      const centerXCol = outHeaderMap[`L_cut_${tripletNum}_center_X`];
      const centerYCol = outHeaderMap[`L_cut_${tripletNum}_center_Y`];
      const endXCol = outHeaderMap[`L_cut_${tripletNum}_end_X`];
      const endYCol = outHeaderMap[`L_cut_${tripletNum}_end_Y`];

      if (startXCol !== undefined && triplet.start) {
        outputRows[plankRowIndex][startXCol] = formatCoordinate(triplet.start.x);
        outputRows[plankRowIndex][startYCol] = formatCoordinate(triplet.start.y);
      }
      if (centerXCol !== undefined && triplet.center) {
        outputRows[plankRowIndex][centerXCol] = formatCoordinate(triplet.center.x);
        outputRows[plankRowIndex][centerYCol] = formatCoordinate(triplet.center.y);
      }
      if (endXCol !== undefined && triplet.end) {
        outputRows[plankRowIndex][endXCol] = formatCoordinate(triplet.end.x);
        outputRows[plankRowIndex][endYCol] = formatCoordinate(triplet.end.y);
      }
    });
  }

  for (const plankKey in plankGolaPoints) {
    const points = plankGolaPoints[plankKey];
    if (points.length === 0) continue;

    const plankRowIndex = plankRowMap[plankKey];
    if (plankRowIndex === undefined) continue;

    const triplets = groupPointsIntoTriplets(points);

    triplets.forEach((triplet, index) => {
      const tripletNum = index + 1;

      const startXCol = outHeaderMap[`Gola_profile_${tripletNum}_start_X`];
      const startYCol = outHeaderMap[`Gola_profile_${tripletNum}_start_Y`];
      const centerXCol = outHeaderMap[`Gola_profile_${tripletNum}_center_X`];
      const centerYCol = outHeaderMap[`Gola_profile_${tripletNum}_center_Y`];
      const endXCol = outHeaderMap[`Gola_profile_${tripletNum}_end_X`];
      const endYCol = outHeaderMap[`Gola_profile_${tripletNum}_end_Y`];

      if (startXCol !== undefined && triplet.start) {
        outputRows[plankRowIndex][startXCol] = formatCoordinate(triplet.start.x);
        outputRows[plankRowIndex][startYCol] = formatCoordinate(triplet.start.y);
      }
      if (centerXCol !== undefined && triplet.center) {
        outputRows[plankRowIndex][centerXCol] = formatCoordinate(triplet.center.x);
        outputRows[plankRowIndex][centerYCol] = formatCoordinate(triplet.center.y);
      }
      if (endXCol !== undefined && triplet.end) {
        outputRows[plankRowIndex][endXCol] = formatCoordinate(triplet.end.x);
        outputRows[plankRowIndex][endYCol] = formatCoordinate(triplet.end.y);
      }
    });
  }

  for (const plankKey in plankIncutPoints) {
    const points = plankIncutPoints[plankKey];
    if (points.length < 2) continue;

    const plankRowIndex = plankRowMap[plankKey];
    if (plankRowIndex === undefined) continue;

    const isFourPointMode = points.length >= 4 && points.length % 4 === 0;
    let cutNum = 0;

    if (isFourPointMode) {
      for (let i = 0; i + 3 < points.length; i += 4) {
        const raw = [points[i], points[i + 1], points[i + 2], points[i + 3]];
        const minX = Math.min(...raw.map(p => p.x));
        const maxX = Math.max(...raw.map(p => p.x));
        const minY = Math.min(...raw.map(p => p.y));
        const maxY = Math.max(...raw.map(p => p.y));
        const pts = [
          { x: minX, y: minY },
          { x: maxX, y: minY },
          { x: maxX, y: maxY },
          { x: minX, y: maxY },
        ];

        cutNum++;
        for (let pi = 0; pi < 4; pi++) {
          const colX = outHeaderMap[`Incut_cut_${cutNum}_point${pi + 1}_X`];
          const colY = outHeaderMap[`Incut_cut_${cutNum}_point${pi + 1}_Y`];
          if (colX !== undefined) outputRows[plankRowIndex][colX] = formatCoordinate(pts[pi].x);
          if (colY !== undefined) outputRows[plankRowIndex][colY] = formatCoordinate(pts[pi].y);
        }
      }
    } else {
      for (let i = 0; i + 1 < points.length; i += 2) {
        const p1 = points[i];
        const p2 = points[i + 1];

        cutNum++;
        const colP1X = outHeaderMap[`Incut_cut_${cutNum}_point1_X`];
        const colP1Y = outHeaderMap[`Incut_cut_${cutNum}_point1_Y`];
        const colP2X = outHeaderMap[`Incut_cut_${cutNum}_point2_X`];
        const colP2Y = outHeaderMap[`Incut_cut_${cutNum}_point2_Y`];
        if (colP1X !== undefined) outputRows[plankRowIndex][colP1X] = formatCoordinate(p1.x);
        if (colP1Y !== undefined) outputRows[plankRowIndex][colP1Y] = formatCoordinate(p1.y);
        if (colP2X !== undefined) outputRows[plankRowIndex][colP2X] = formatCoordinate(p2.x);
        if (colP2Y !== undefined) outputRows[plankRowIndex][colP2Y] = formatCoordinate(p2.y);
      }
    }
  }

  return { header: outHeader, rows: outputRows, warnings, dynamicOpHeader };
}

// =================================================================
// =================== TRIPLET GROUPING ===================
// =================================================================

function groupPointsIntoTriplets(points: TripletPoint[]): Triplet[] {
  const triplets: Triplet[] = [];

  const hasExplicitTypes = points.some(
    (p) => p.type.includes('_start') || p.type.includes('_center') || p.type.includes('_end')
  );

  if (hasExplicitTypes) {
    const starts = points.filter((p) => p.type.includes('_start'));
    const centers = points.filter((p) => p.type.includes('_center'));
    const ends = points.filter((p) => p.type.includes('_end'));

    const maxTriplets = Math.max(starts.length, centers.length, ends.length);

    for (let i = 0; i < maxTriplets; i++) {
      triplets.push({
        start: starts[i] ? { x: starts[i].x, y: starts[i].y } : null,
        center: centers[i] ? { x: centers[i].x, y: centers[i].y } : null,
        end: ends[i] ? { x: ends[i].x, y: ends[i].y } : null,
      });
    }
  } else {
    points.sort((a, b) => a.rawOrder - b.rawOrder);

    for (let i = 0; i < points.length; i += 3) {
      const triplet: Triplet = {
        start: points[i] ? { x: points[i].x, y: points[i].y } : null,
        center: points[i + 1] ? { x: points[i + 1].x, y: points[i + 1].y } : null,
        end: points[i + 2] ? { x: points[i + 2].x, y: points[i + 2].y } : null,
      };
      triplets.push(triplet);
    }
  }

  return triplets;
}

/**
 * Extract unique materials from raw data (for EB dialog).
 * Port of the material extraction in showEdgeBindingDialog().
 */
export function extractMaterialsFromRawData(rawValues: unknown[][]): string[] {
  if (rawValues.length < 2) return [];

  const header = rawValues[0].map((h) => String(h).trim());
  const matIdx = findColumnIndex(header, 'material');
  if (matIdx === -1) return [];
  const levelIdx = findColumnIndex(header, 'Level');

  const materialSet = new Set<string>();
  for (let i = 1; i < rawValues.length; i++) {
    if (levelIdx !== -1) {
      const levelVal = getLevelFromColumn(rawValues[i] as unknown[], levelIdx);
      if (levelVal === 0) continue;
    }
    const mat = String((rawValues[i] as unknown[])[matIdx] || '').trim();
    if (mat) materialSet.add(mat);
  }
  return Array.from(materialSet).sort();
}
