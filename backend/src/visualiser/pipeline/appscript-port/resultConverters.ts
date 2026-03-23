/**
 * Converts pipeline 2D array outputs to store/display formats.
 * Bridges PipelineResult { header, rows } to typed arrays and Record<string, unknown>[] for tables.
 */

import type {
  FormattedPlankData,
  PlankListItem,
  NestResult,
  NestHole,
  MaterialSummary,
  PlankOperations,
  HoleOperation,
  GrooveOperation,
  LCutOperation,
} from '../../types/visualiser.types';
import type { FormattedDataResult } from './formattedData';
import type { PlankListResult } from './plankList';
import type { CutlistResult } from './cutlist';
import type { MaterialSummaryResult } from './materialSummary';

/** Generic: turn 2D (header + rows) into array of objects for DataTableView */
export function rows2DToObjects(
  header: string[],
  rows: unknown[][]
): Record<string, unknown>[] {
  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    header.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });
}

/** Parse Level 3 operation columns from pipeline 2D header into structured PlankOperations */
function parseOperationsFromRow(
  header: string[],
  row: (string | number)[]
): PlankOperations {
  const num = (i: number) => (i >= 0 && row[i] !== '' && row[i] != null ? Number(row[i]) || 0 : NaN);
  const ops: PlankOperations = {};

  const hinges: HoleOperation[] = [];
  const screws: HoleOperation[] = [];
  const holes: HoleOperation[] = [];
  const vbMain: HoleOperation[] = [];
  const vbDouble: HoleOperation[] = [];
  const grooves: GrooveOperation[] = [];
  const slots: GrooveOperation[] = [];
  const profiles: GrooveOperation[] = [];
  const lCuts: LCutOperation[] = [];

  for (let i = 1; i <= 50; i++) {
    const hx = header.indexOf(`hing_${i}_X`);
    if (hx === -1) break;
    const hy = header.indexOf(`hing_${i}_Y`);
    const hz = header.indexOf(`hing_${i}_Z`);
    const x = num(hx), y = num(hy), z = num(hz);
    if (!isNaN(x) && !isNaN(y)) hinges.push({ x, y, z: isNaN(z) ? 0 : z });
  }

  for (let i = 1; i <= 50; i++) {
    const sx = header.indexOf(`screw_${i}_X`);
    if (sx === -1) break;
    const sy = header.indexOf(`screw_${i}_Y`);
    const sz = header.indexOf(`screw_${i}_Z`);
    const x = num(sx), y = num(sy), z = num(sz);
    if (!isNaN(x) && !isNaN(y)) screws.push({ x, y, z: isNaN(z) ? 0 : z });
  }

  for (let i = 1; i <= 50; i++) {
    const vx = header.indexOf(`vb_main_${i}_X`);
    if (vx === -1) break;
    const vy = header.indexOf(`vb_main_${i}_Y`);
    const vz = header.indexOf(`vb_main_${i}_Z`);
    const x = num(vx), y = num(vy), z = num(vz);
    if (!isNaN(x) && !isNaN(y)) vbMain.push({ x, y, z: isNaN(z) ? 0 : z });
  }

  for (let i = 1; i <= 50; i++) {
    const vx = header.indexOf(`vb_double_${i}_X`);
    if (vx === -1) break;
    const vy = header.indexOf(`vb_double_${i}_Y`);
    const vz = header.indexOf(`vb_double_${i}_Z`);
    const x = num(vx), y = num(vy), z = num(vz);
    if (!isNaN(x) && !isNaN(y)) vbDouble.push({ x, y, z: isNaN(z) ? 0 : z });
  }

  for (let i = 1; i <= 50; i++) {
    const hx = header.indexOf(`hole_${i}_X`);
    if (hx === -1) break;
    const hy = header.indexOf(`hole_${i}_Y`);
    const hz = header.indexOf(`hole_${i}_Z`);
    const x = num(hx), y = num(hy), z = num(hz);
    if (!isNaN(x) && !isNaN(y)) holes.push({ x, y, z: isNaN(z) ? 0 : z });
  }

  for (let i = 1; i <= 50; i++) {
    const gx = header.indexOf(`groove_${i}_X`);
    if (gx === -1) break;
    const gy = header.indexOf(`groove_${i}_Y`);
    const gz = header.indexOf(`groove_${i}_Z`);
    const gl = header.indexOf(`groove_${i}_length`);
    const gw = header.indexOf(`groove_${i}_width`);
    const x = num(gx), y = num(gy), z = num(gz);
    if (!isNaN(x) && !isNaN(y)) grooves.push({ x, y, z: isNaN(z) ? 0 : z, length: isNaN(num(gl)) ? 0 : num(gl), width: isNaN(num(gw)) ? 0 : num(gw), depth: 0 });
  }

  for (let i = 1; i <= 50; i++) {
    const sx = header.indexOf(`slot_${i}_X`);
    if (sx === -1) break;
    const sy = header.indexOf(`slot_${i}_Y`);
    const sz = header.indexOf(`slot_${i}_Z`);
    const sl = header.indexOf(`slot_${i}_length`);
    const sw = header.indexOf(`slot_${i}_width`);
    const x = num(sx), y = num(sy), z = num(sz);
    if (!isNaN(x) && !isNaN(y)) slots.push({ x, y, z: isNaN(z) ? 0 : z, length: isNaN(num(sl)) ? 0 : num(sl), width: isNaN(num(sw)) ? 0 : num(sw), depth: 0, type: 'slot' });
  }

  for (let i = 1; i <= 50; i++) {
    const px = header.indexOf(`profile_${i}_X`);
    if (px === -1) break;
    const py = header.indexOf(`profile_${i}_Y`);
    const pz = header.indexOf(`profile_${i}_Z`);
    const pl = header.indexOf(`profile_${i}_length`);
    const pw = header.indexOf(`profile_${i}_width`);
    const x = num(px), y = num(py), z = num(pz);
    if (!isNaN(x) && !isNaN(y)) profiles.push({ x, y, z: isNaN(z) ? 0 : z, length: isNaN(num(pl)) ? 0 : num(pl), width: isNaN(num(pw)) ? 0 : num(pw), depth: 0, type: 'profile' });
  }

  for (let i = 1; i <= 50; i++) {
    const lsx = header.indexOf(`L_cut_${i}_start_X`);
    if (lsx === -1) break;
    const lsy = header.indexOf(`L_cut_${i}_start_Y`);
    const lcx = header.indexOf(`L_cut_${i}_center_X`);
    const lcy = header.indexOf(`L_cut_${i}_center_Y`);
    const lex = header.indexOf(`L_cut_${i}_end_X`);
    const ley = header.indexOf(`L_cut_${i}_end_Y`);
    const sx = num(lsx), sy = num(lsy), cx = num(lcx), cy = num(lcy), ex = num(lex), ey = num(ley);
    if (!isNaN(sx) && !isNaN(sy) && !isNaN(cx) && !isNaN(cy) && !isNaN(ex) && !isNaN(ey)) {
      if (sx === 0 && sy === 0 && cx === 0 && cy === 0 && ex === 0 && ey === 0) continue;
      lCuts.push({ start: { x: sx, y: sy, z: 0 }, center: { x: cx, y: cy, z: 0 }, end: { x: ex, y: ey, z: 0 } });
    }
  }

  if (hinges.length) ops.hinges = hinges;
  if (screws.length) ops.screws = screws;
  if (holes.length) ops.holes = holes;
  if (vbMain.length) ops.vb_main = vbMain;
  if (vbDouble.length) ops.vb_double = vbDouble;
  if (grooves.length) ops.grooves = grooves;
  if (slots.length) ops.slots = slots;
  if (profiles.length) ops.profiles = profiles;
  if (lCuts.length) ops.l_cuts = lCuts;

  return ops;
}

/** FormattedData: pipeline output uses snake_case headers; map to camelCase and parse Level 3 operations for store/FormattedDataTable */
export function pipelineFormattedToStore(
  result: FormattedDataResult
): FormattedPlankData[] {
  const { header, rows } = result;
  const getIdx = (name: string) => header.indexOf(name);
  const idx = {
    room_name: getIdx('room_name'),
    box_type: getIdx('box_type'),
    box_model: getIdx('box_model'),
    box_orientation: getIdx('box_orientation'),
    box_name: getIdx('box_name'),
    plank_name: getIdx('plank_name'),
    plank_id: getIdx('plank_id'),
    plank_length: getIdx('plank_length'),
    plank_width: getIdx('plank_width'),
    plank_thickness: getIdx('plank_thickness'),
    plank_material: getIdx('plank_material'),
    EB_Value: getIdx('EB_Value'),
  };

  return rows
    .filter((row) => {
      const pid = idx.plank_id >= 0 ? String(row[idx.plank_id] ?? '').trim() : '';
      return pid !== '';
    })
    .map((row) => {
      const str = (i: number) => (i >= 0 ? String(row[i] ?? '') : '');
      const num = (i: number) => (i >= 0 ? Number(row[i]) || 0 : 0);
      const ori = str(idx.box_orientation) as 'NS' | 'EW' | 'N/A';
      const operations = parseOperationsFromRow(header, row);
      return {
        roomName: str(idx.room_name),
        boxType: str(idx.box_type),
        boxModel: str(idx.box_model),
        boxOrientation: ori === 'NS' || ori === 'EW' ? ori : 'N/A',
        boxName: str(idx.box_name),
        plankName: str(idx.plank_name),
        plankId: str(idx.plank_id),
        plankLength: num(idx.plank_length),
        plankWidth: num(idx.plank_width),
        plankThickness: num(idx.plank_thickness),
        plankMaterial: str(idx.plank_material),
        ebValue: num(idx.EB_Value),
        operations,
      } as FormattedPlankData;
    });
}

/** Plank list: pipeline header is ['Plank Name', 'Material', 'Width (mm)', 'Height (mm)', 'Thickness (mm)', 'Plank id', 'Grain?', 'Edge Binding (m)'] */
export function pipelinePlankListToStore(result: PlankListResult): PlankListItem[] {
  const { header, rows } = result;
  const getIdx = (name: string) => header.indexOf(name);
  const idx = {
    name: getIdx('Plank Name'),
    material: getIdx('Material'),
    width: getIdx('Width (mm)'),
    height: getIdx('Height (mm)'),
    thickness: getIdx('Thickness (mm)'),
    id: getIdx('Plank id'),
    grain: getIdx('Grain?'),
    eb: getIdx('Edge Binding (m)'),
  };

  return rows.map((row) => {
    const num = (i: number) => (i >= 0 ? Number(row[i]) || 0 : 0);
    const str = (i: number) => (i >= 0 ? String(row[i] ?? '') : '');
    const grainVal = str(idx.grain).toUpperCase();
    return {
      plankName: str(idx.name),
      material: str(idx.material),
      width: num(idx.width),
      height: num(idx.height),
      thickness: num(idx.thickness),
      plankId: str(idx.id),
      grain: (grainVal === 'Y' || grainVal === 'N' ? grainVal : '') as 'Y' | 'N' | '',
      edgeBinding: num(idx.eb),
    };
  });
}

interface LCutTripletDisplay {
  start: { x: number; y: number };
  center: { x: number; y: number };
  end: { x: number; y: number };
}

/**
 * Extract NestHole[] from a cutlist row — exact port of App Script Cutlist.js lines 1333-1388.
 *
 * Coordinate spaces in the CSV row:
 *   - Hole/groove/slot/profile operations: **sheet-absolute** (placedRect.x + localX).
 *   - L-cut triplets and Gola profile triplets: **plank-local** (already rotated, NOT offset).
 *
 * We convert everything to **plank-relative** for display by subtracting plankX/plankY
 * from the sheet-absolute operations. L-cut and Gola start-points are already plank-local.
 *
 * Groove dimensions: In the formatted data, `_length` = extent along the plank's 2D Y-axis
 * and `_width` = extent along the plank's 2D X-axis. The App Script swaps these for the
 * visualizer: non-rotated → swap, rotated → keep as-is.
 */
function extractNestHolesFromRow(
  header: string[],
  row: (string | number)[],
  plankX: number,
  plankY: number,
  isRotated: boolean,
): NestHole[] {
  const holes: NestHole[] = [];
  const num = (i: number) => (i >= 0 && row[i] !== '' && row[i] != null ? Number(row[i]) || 0 : NaN);

  // Circular hole prefixes with type-specific diameters (App Script Cutlist.js line 1383)
  const holePrefixes: { prefix: string; type: string; diameter: number }[] = [
    { prefix: 'screw_', type: 'screw', diameter: 4 },
    { prefix: 'hing_', type: 'hinge', diameter: 4 },
    { prefix: 'vb_main_', type: 'vb', diameter: 20 },
    { prefix: 'vb_double_', type: 'dowel', diameter: 5 },
  ];

  for (const { prefix, type, diameter } of holePrefixes) {
    for (let i = 1; i <= 50; i++) {
      const xIdx = header.indexOf(`${prefix}${i}_X`);
      if (xIdx === -1) break;
      const yIdx = header.indexOf(`${prefix}${i}_Y`);
      const x = num(xIdx), y = num(yIdx);
      if (isNaN(x) || isNaN(y)) continue;
      if (x === 0 && y === 0) continue;
      holes.push({
        x: x - plankX,
        y: y - plankY,
        type,
        isRectangular: false,
        description: `${type} hole`,
        diameter,
      });
    }
  }

  // Groove/slot/profile: rectangular operations with length & width
  const groovePrefixes = ['slot_', 'groove_', 'profile_'];
  for (const prefix of groovePrefixes) {
    for (let i = 1; i <= 50; i++) {
      const xIdx = header.indexOf(`${prefix}${i}_X`);
      if (xIdx === -1) break;
      const yIdx = header.indexOf(`${prefix}${i}_Y`);
      const lIdx = header.indexOf(`${prefix}${i}_length`);
      const wIdx = header.indexOf(`${prefix}${i}_width`);
      const x = num(xIdx), y = num(yIdx);
      const rawLength = isNaN(num(lIdx)) ? 0 : num(lIdx);
      const rawWidth = isNaN(num(wIdx)) ? 0 : num(wIdx);
      if (isNaN(x) || isNaN(y)) continue;
      if (rawLength === 0 && rawWidth === 0) continue;

      // App Script dimension swap (Cutlist.js lines 1373-1381):
      // In formatted data: _length = Y-axis extent, _width = X-axis extent.
      // Visualizer expects: hole.length → CSS width, hole.width → CSS height.
      // Non-rotated: CSS width = rawWidth (X-axis), CSS height = rawLength (Y-axis)
      // Rotated:     CSS width = rawLength (Y→X after rot), CSS height = rawWidth (X→Y after rot)
      const visualLength = isRotated ? rawLength : rawWidth;   // → CSS width
      const visualWidth = isRotated ? rawWidth : rawLength;    // → CSS height
      const typeName = prefix.replace(/_$/, '');

      holes.push({
        x: x - plankX,
        y: y - plankY,
        type: typeName,
        isRectangular: true,
        description: `${typeName} ${visualLength}x${visualWidth}mm`,
        length: visualLength,
        width: visualWidth,
      });
    }
  }

  // L-cut start points are already plank-local in the CSV — no offset needed
  for (let i = 1; i <= 50; i++) {
    const sxIdx = header.indexOf(`L_cut_${i}_start_X`);
    if (sxIdx === -1) break;
    const syIdx = header.indexOf(`L_cut_${i}_start_Y`);
    const sx = num(sxIdx), sy = num(syIdx);
    if (!isNaN(sx) && !isNaN(sy) && (sx !== 0 || sy !== 0)) {
      holes.push({ x: sx, y: sy, type: 'l_cut', isRectangular: false, description: 'L-cut' });
    }
  }

  // Gola profile start points are already plank-local — no offset needed
  for (let i = 1; i <= 50; i++) {
    const sxIdx = header.indexOf(`Gola_profile_${i}_start_X`);
    if (sxIdx === -1) break;
    const syIdx = header.indexOf(`Gola_profile_${i}_start_Y`);
    const sx = num(sxIdx), sy = num(syIdx);
    if (!isNaN(sx) && !isNaN(sy) && (sx !== 0 || sy !== 0)) {
      holes.push({ x: sx, y: sy, type: 'profile', isRectangular: false, description: 'Gola profile' });
    }
  }

  return holes;
}

/** Extract full L-cut triplets (plank-local coordinates) for cutlist SVG rendering */
function extractLCutTripletsFromRow(header: string[], row: (string | number)[]): LCutTripletDisplay[] {
  const triplets: LCutTripletDisplay[] = [];
  const num = (i: number) => (i >= 0 && row[i] !== '' && row[i] != null ? Number(row[i]) || 0 : NaN);

  for (let i = 1; i <= 50; i++) {
    const sxIdx = header.indexOf(`L_cut_${i}_start_X`);
    if (sxIdx === -1) break;
    const syIdx = header.indexOf(`L_cut_${i}_start_Y`);
    const cxIdx = header.indexOf(`L_cut_${i}_center_X`);
    const cyIdx = header.indexOf(`L_cut_${i}_center_Y`);
    const exIdx = header.indexOf(`L_cut_${i}_end_X`);
    const eyIdx = header.indexOf(`L_cut_${i}_end_Y`);
    const sx = num(sxIdx), sy = num(syIdx);
    const cx = num(cxIdx), cy = num(cyIdx);
    const ex = num(exIdx), ey = num(eyIdx);
    if (!isNaN(sx) && !isNaN(sy) && !isNaN(cx) && !isNaN(cy) && !isNaN(ex) && !isNaN(ey)) {
      if (sx === 0 && sy === 0 && cx === 0 && cy === 0 && ex === 0 && ey === 0) continue;
      triplets.push({ start: { x: sx, y: sy }, center: { x: cx, y: cy }, end: { x: ex, y: ey } });
    }
  }

  return triplets;
}

/**
 * Rotating color palette — exact port of App Script Cutlist.js line 1554.
 * Each unique material+thickness combination gets a distinct color.
 */
const MATERIAL_THICKNESS_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#2AB7CA',
  '#F08A5D', '#B22727', '#54A0FF', '#5F27CD', '#FF9F43',
];

function getCleanMaterialForColor(material: string): string {
  return String(material || '')
    .replace(/\(\s*\d+(\.\d+)?\s*mm\s*\)/gi, '')
    .replace(/\s*\([^)]+\)/g, '')
    .trim();
}

/** Cutlist/Nest result: header includes 'Plank ID', 'Plank Name', 'Material', 'Thickness', 'Sheet', 'X', 'Y', 'Placed Width', 'Placed Height', 'Rotated', 'Original Width', 'Original Height', 'EB Value' plus operation columns */
export function pipelineNestToStore(result: CutlistResult): NestResult[] {
  const { header, rows } = result;
  const getIdx = (name: string) => header.indexOf(name);
  const idx = {
    id: getIdx('Plank ID'),
    name: getIdx('Plank Name'),
    material: getIdx('Material'),
    thickness: getIdx('Thickness'),
    sheet: getIdx('Sheet'),
    x: getIdx('X'),
    y: getIdx('Y'),
    width: getIdx('Placed Width'),
    height: getIdx('Placed Height'),
    rotated: getIdx('Rotated'),
    origW: getIdx('Original Width'),
    origH: getIdx('Original Height'),
    eb: getIdx('EB Value'),
  };

  // Build per-material-thickness color map (App Script Cutlist.js line 1553-1562)
  const materialThicknessColors: Record<string, string> = {};
  let colorIndex = 0;
  for (const row of rows) {
    const mat = getCleanMaterialForColor(idx.material >= 0 ? String(row[idx.material] ?? '') : '');
    const thick = idx.thickness >= 0 ? (Number(row[idx.thickness]) || 0) : 0;
    const key = `${mat}_${thick}mm`;
    if (!materialThicknessColors[key]) {
      materialThicknessColors[key] = MATERIAL_THICKNESS_COLORS[colorIndex % MATERIAL_THICKNESS_COLORS.length];
      colorIndex++;
    }
  }

  return rows.map((row) => {
    const num = (j: number) => (j >= 0 ? Number(row[j]) || 0 : 0);
    const str = (j: number) => (j >= 0 ? String(row[j] ?? '') : '');
    const rot = row[idx.rotated];
    const rotated = String(rot).toLowerCase() === 'true' || String(rot) === 'Yes';
    const plankX = num(idx.x);
    const plankY = num(idx.y);
    const material = str(idx.material);
    const thickness = num(idx.thickness);

    // Assign color per material+thickness group
    const cleanMat = getCleanMaterialForColor(material);
    const colorKey = `${cleanMat}_${thickness}mm`;
    const color = materialThicknessColors[colorKey] || MATERIAL_THICKNESS_COLORS[0];

    // Convert sheet-absolute operation coords to plank-relative for display
    const holes = extractNestHolesFromRow(header, row, plankX, plankY, rotated);

    // Extract full L-cut triplets (already plank-local in the CSV)
    const l_cuts = extractLCutTripletsFromRow(header, row);

    return {
      id: str(idx.id),
      name: str(idx.name),
      material,
      thickness,
      sheetNum: num(idx.sheet),
      x: plankX,
      y: plankY,
      width: num(idx.width),
      height: num(idx.height),
      rotated,
      color,
      originalWidth: num(idx.origW),
      originalHeight: num(idx.origH),
      ebValue: num(idx.eb),
      holes,
      l_cuts,
    } as NestResult & { l_cuts: LCutTripletDisplay[] };
  });
}

/** Material summary: header is ['Material & Thickness', 'Room Name(s)', 'Plank Count', 'Total Area (mm²)', 'Sheets Used', 'Avg. Area per Sheet (mm²)', 'Utilization %', 'Total Edge (m)'] */
export function pipelineMaterialSummaryToStore(
  result: MaterialSummaryResult
): MaterialSummary[] {
  const { header, rows } = result;
  const getIdx = (name: string) => header.indexOf(name);
  const idx = {
    matThick: getIdx('Material & Thickness'),
    roomNames: getIdx('Room Name(s)'),
    plankCount: getIdx('Plank Count'),
    totalArea: getIdx('Total Area (mm²)'),
    sheetsUsed: getIdx('Sheets Used'),
    avgArea: getIdx('Avg. Area per Sheet (mm²)'),
    utilization: getIdx('Utilization %'),
    totalEdge: getIdx('Total Edge (m)'),
  };

  return rows.map((row) => {
    const num = (j: number) => (j >= 0 ? Number(row[j]) || 0 : 0);
    const str = (j: number) => (j >= 0 ? String(row[j] ?? '') : '');
    const matThick = str(idx.matThick);
    const match = matThick.match(/^(.+?)\s*\((\d+(?:\.\d+)?)\s*mm\)$/);
    const baseMaterial = match ? match[1].trim() : matThick;
    const thickness = match ? parseFloat(match[2]) : 0;
    return {
      materialThickness: matThick,
      baseMaterial,
      thickness,
      roomNames: str(idx.roomNames),
      plankCount: num(idx.plankCount),
      totalArea: num(idx.totalArea),
      sheetsUsed: num(idx.sheetsUsed),
      avgAreaPerSheet: num(idx.avgArea),
      utilization: num(idx.utilization),
      totalEdge: num(idx.totalEdge),
    };
  });
}
