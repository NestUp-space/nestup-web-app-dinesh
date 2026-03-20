/**
 * Editable Cutlist — Apply move/rotate/flip/cutOrder and recalc op coords
 * Port of AppScript Cutlist.js saveEditedCutlist, _recalculateOperationCoords*,
 * and _syncPlankLocalFeaturesFromLayouts.
 *
 * Input: cutlist { header, rows } + modifications array.
 * Output: new { header, rows } with edits applied.
 */

export interface CutlistData {
  header: string[];
  rows: (string | number)[][];
}

export type CutlistModification =
  | { type: 'move'; plankId: string; fromSheet?: number; toSheet: number; newX: number; newY: number }
  | { type: 'rotate'; plankId: string; angle?: number }
  | { type: 'flip'; plankId: string; direction: 'horizontal' | 'vertical' }
  | { type: 'cutOrder'; plankId: string; cutOrder: number };

/** Plank-like shape from editor layouts for syncing L_cut / Gola / Incut back into rows */
export interface LayoutPlank {
  id: string;
  l_cuts?: Array<{ start?: { x: number; y: number }; center?: { x: number; y: number }; end?: { x: number; y: number } }>;
  gola_profiles?: Array<{ start?: { x: number; y: number }; center?: { x: number; y: number }; end?: { x: number; y: number } }>;
  incut_cuts?: Array<{
    point1?: { x: number; y: number };
    point2?: { x: number; y: number };
    point3?: { x: number; y: number };
    point4?: { x: number; y: number };
  }>;
}

export interface ApplyCutlistModificationsOptions {
  /** Optional: map sheetNum -> plank[] to sync L_cut_*, Gola_profile_*, Incut_cut_* into rows */
  layouts?: Record<string, LayoutPlank[]>;
}

function isPlankLocalColumn(header: string): boolean {
  return /^L_cut_\d+_/.test(header) || /^Gola_profile_\d+_/.test(header) || /^Incut_cut_\d+_/.test(header);
}

function getCols(headers: string[]) {
  return {
    id: headers.indexOf('Plank ID'),
    name: headers.indexOf('Plank Name'),
    material: headers.indexOf('Material'),
    thickness: headers.indexOf('Thickness'),
    sheet: headers.indexOf('Sheet'),
    x: headers.indexOf('X'),
    y: headers.indexOf('Y'),
    width: headers.indexOf('Placed Width'),
    height: headers.indexOf('Placed Height'),
    rotated: headers.indexOf('Rotated'),
    origWidth: headers.indexOf('Original Width'),
    origHeight: headers.indexOf('Original Height'),
    ebValue: headers.indexOf('EB Value'),
    cutOrder: headers.indexOf('Cut Order'),
  };
}

function findRowIndex(rows: (string | number)[][], idCol: number, plankId: string): number {
  const sid = String(plankId).trim();
  for (let r = 0; r < rows.length; r++) {
    if (String(rows[r][idCol] ?? '').trim() === sid) return r;
  }
  return -1;
}

function num(val: unknown): number {
  if (val === '' || val == null) return 0;
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function recalculateOperationCoords(
  rows: (string | number)[][],
  rowIndex: number,
  headers: string[],
  oldX: number,
  oldY: number,
  newX: number,
  newY: number
): void {
  const deltaX = newX - oldX;
  const deltaY = newY - oldY;
  const row = rows[rowIndex];

  headers.forEach((header, colIndex) => {
    if (isPlankLocalColumn(header)) return;
    const val = row[colIndex];
    if (val === '' || val == null) return;
    if (header.match(/_X$/) && (header.match(/_\d+_/) || header.match(/_start_X$/) || header.match(/_center_X$/) || header.match(/_end_X$/))) {
      const n = num(val);
      if (n !== 0) row[colIndex] = (n + deltaX).toFixed(1);
    }
    if (header.match(/_Y$/) && (header.match(/_\d+_/) || header.match(/_start_Y$/) || header.match(/_center_Y$/) || header.match(/_end_Y$/))) {
      const n = num(val);
      if (n !== 0) row[colIndex] = (n + deltaY).toFixed(1);
    }
  });
}

function recalculateOperationCoordsRotated(
  rows: (string | number)[][],
  rowIndex: number,
  headers: string[],
  angle: number,
  plankWidth: number,
  plankHeight: number
): void {
  const row = rows[rowIndex];
  const xCol = headers.indexOf('X');
  const yCol = headers.indexOf('Y');
  const plankX = xCol >= 0 ? num(row[xCol]) : 0;
  const plankY = yCol >= 0 ? num(row[yCol]) : 0;

  // Pre-read feature lengths BEFORE swapping, so the offset is from the pre-rotation extent
  const featureLengthMap = new Map<string, number>();
  headers.forEach((header) => {
    const match = header.match(/^(.+_\d+)_X$/);
    if (!match) return;
    const baseKey = match[1];
    const lenIdx = headers.indexOf(baseKey + '_length');
    const wIdx = headers.indexOf(baseKey + '_width');
    if (lenIdx !== -1 && wIdx !== -1) {
      featureLengthMap.set(baseKey, num(row[lenIdx]));
      featureLengthMap.set(baseKey + '_W', num(row[wIdx]));
    }
  });

  headers.forEach((header, colIndex) => {
    const xMatch = header.match(/^(.+_\d+)_X$/) || header.match(/^(.+)_(start|center|end)_X$/);
    if (!xMatch) return;
    const yHeader = header.replace(/_X$/, '_Y');
    const yColIndex = headers.indexOf(yHeader);
    if (yColIndex === -1) return;

    const valX = num(row[colIndex]);
    const valY = num(row[yColIndex]);
    if (row[colIndex] === '' || row[yColIndex] === '') return;

    const isLocal = isPlankLocalColumn(header);
    const relX = isLocal ? valX : valX - plankX;
    const relY = isLocal ? valY : valY - plankY;
    if (relX === 0 && relY === 0 && !isLocal) return;

    // For rectangular features, subtract the X-extent (length) when computing new Y
    // This matches App Script: newY = oldWidth - oldX - featureW
    const baseKey = (xMatch[1] || '').replace(/_(start|center|end)$/, '');
    const featLen = featureLengthMap.get(baseKey) || 0;
    const featW = featureLengthMap.get(baseKey + '_W') || 0;

    let newRelX: number;
    let newRelY: number;
    if (angle === 90 || angle === -270) {
      newRelX = relY;
      newRelY = plankWidth - relX - (featW > 0 ? featW : 0);
    } else if (angle === 180 || angle === -180) {
      newRelX = plankWidth - relX - (featW > 0 ? featW : 0);
      newRelY = plankHeight - relY - (featLen > 0 ? featLen : 0);
    } else if (angle === 270 || angle === -90) {
      newRelX = plankHeight - relY - (featLen > 0 ? featLen : 0);
      newRelY = relX;
    } else {
      newRelX = relY;
      newRelY = plankWidth - relX - (featW > 0 ? featW : 0);
    }

    if (isLocal) {
      row[colIndex] = newRelX.toFixed(1);
      row[yColIndex] = newRelY.toFixed(1);
    } else {
      row[colIndex] = (plankX + newRelX).toFixed(1);
      row[yColIndex] = (plankY + newRelY).toFixed(1);
    }
  });

}

function recalculateOperationCoordsFlipped(
  rows: (string | number)[][],
  rowIndex: number,
  headers: string[],
  direction: 'horizontal' | 'vertical',
  plankWidth: number,
  plankHeight: number
): void {
  const row = rows[rowIndex];
  const xCol = headers.indexOf('X');
  const yCol = headers.indexOf('Y');
  const plankX = xCol >= 0 ? num(row[xCol]) : 0;
  const plankY = yCol >= 0 ? num(row[yCol]) : 0;

  // Pre-read feature dimensions for rectangular operations
  const featureDimMap = new Map<string, { len: number; w: number }>();
  headers.forEach((header) => {
    const match = header.match(/^(.+_\d+)_X$/);
    if (!match) return;
    const baseKey = match[1];
    const lenIdx = headers.indexOf(baseKey + '_length');
    const wIdx = headers.indexOf(baseKey + '_width');
    if (lenIdx !== -1 && wIdx !== -1) {
      featureDimMap.set(baseKey, { len: num(row[lenIdx]), w: num(row[wIdx]) });
    }
  });

  headers.forEach((header, colIndex) => {
    const xMatch = header.match(/^(.+)_X$/);
    if (!xMatch || (!header.match(/_\d+_/) && !header.match(/_start_X$/) && !header.match(/_center_X$/) && !header.match(/_end_X$/))) return;
    const yHeader = header.replace('_X', '_Y');
    const yColIndex = headers.indexOf(yHeader);
    if (yColIndex === -1) return;

    const valX = num(row[colIndex]);
    const valY = num(row[yColIndex]);
    if (row[colIndex] === '' || row[yColIndex] === '') return;

    const isLocal = isPlankLocalColumn(header);
    const relX = isLocal ? valX : valX - plankX;
    const relY = isLocal ? valY : valY - plankY;

    // Look up feature dimensions for rectangular operations
    const baseKey = (xMatch[1] || '').replace(/_(start|center|end)$/, '');
    const dims = featureDimMap.get(baseKey);
    const featLen = dims?.len || 0;
    const featW = dims?.w || 0;

    let newRelX = relX;
    let newRelY = relY;
    if (direction === 'horizontal') {
      newRelX = plankWidth - relX - (featW > 0 ? featW : 0);
    } else if (direction === 'vertical') {
      newRelY = plankHeight - relY - (featLen > 0 ? featLen : 0);
    }

    if (isLocal) {
      row[colIndex] = newRelX.toFixed(1);
      row[yColIndex] = newRelY.toFixed(1);
    } else {
      row[colIndex] = (plankX + newRelX).toFixed(1);
      row[yColIndex] = (plankY + newRelY).toFixed(1);
    }
  });

  // Reverse L-cut and Gola profile triplet point order (start ↔ end)
  // Matches App Script's mirrorPathWithReversal: after mirroring, old end becomes new start
  reverseTripletStartEnd(row, headers, 'L_cut_');
  reverseTripletStartEnd(row, headers, 'Gola_profile_');
}

/**
 * Swap start ↔ end column values for triplet-based features (L-cuts, Gola profiles).
 * Center stays in place. Matches App Script's mirrorPathWithReversal path-direction reversal.
 */
function reverseTripletStartEnd(row: (string | number)[], headers: string[], prefix: string): void {
  for (let i = 1; i <= 50; i++) {
    const sxIdx = headers.indexOf(`${prefix}${i}_start_X`);
    if (sxIdx === -1) break;
    const syIdx = headers.indexOf(`${prefix}${i}_start_Y`);
    const exIdx = headers.indexOf(`${prefix}${i}_end_X`);
    const eyIdx = headers.indexOf(`${prefix}${i}_end_Y`);
    if (syIdx === -1 || exIdx === -1 || eyIdx === -1) break;

    // Both start and end must have values to swap
    if (row[sxIdx] === '' && row[exIdx] === '') continue;

    const tmpSx = row[sxIdx];
    const tmpSy = row[syIdx];
    row[sxIdx] = row[exIdx];
    row[syIdx] = row[eyIdx];
    row[exIdx] = tmpSx;
    row[eyIdx] = tmpSy;
  }
}

function syncPlankLocalFeaturesFromLayouts(
  data: { header: string[]; rows: (string | number)[][] },
  cols: ReturnType<typeof getCols>,
  layouts: Record<string, LayoutPlank[]>
): void {
  const { header, rows } = data;
  const plankById: Record<string, LayoutPlank> = {};
  let maxLCut = 0;
  let maxGola = 0;
  let maxIncut = 0;
  Object.keys(layouts).forEach((sheetNum) => {
    const planks = layouts[sheetNum];
    if (Array.isArray(planks)) {
      planks.forEach((p) => {
        if (p && p.id != null) {
          plankById[String(p.id).trim()] = p;
          if (p.l_cuts && p.l_cuts.length > maxLCut) maxLCut = p.l_cuts.length;
          if (p.gola_profiles && p.gola_profiles.length > maxGola) maxGola = p.gola_profiles.length;
          if (p.incut_cuts && p.incut_cuts.length > maxIncut) maxIncut = p.incut_cuts.length;
        }
      });
    }
  });

  const needCols: string[] = [];
  for (let i = 1; i <= maxLCut; i++) {
    needCols.push(
      `L_cut_${i}_start_X`, `L_cut_${i}_start_Y`,
      `L_cut_${i}_center_X`, `L_cut_${i}_center_Y`,
      `L_cut_${i}_end_X`, `L_cut_${i}_end_Y`
    );
  }
  for (let i = 1; i <= maxGola; i++) {
    needCols.push(
      `Gola_profile_${i}_start_X`, `Gola_profile_${i}_start_Y`,
      `Gola_profile_${i}_center_X`, `Gola_profile_${i}_center_Y`,
      `Gola_profile_${i}_end_X`, `Gola_profile_${i}_end_Y`
    );
  }
  let hasInplankPoints = false;
  Object.keys(plankById).forEach((pid) => {
    const p = plankById[pid];
    if (p?.incut_cuts) p.incut_cuts.forEach((ic) => {
      if (ic.point3 || ic.point4) hasInplankPoints = true;
    });
  });
  for (let i = 1; i <= maxIncut; i++) {
    needCols.push(
      `Incut_cut_${i}_point1_X`, `Incut_cut_${i}_point1_Y`,
      `Incut_cut_${i}_point2_X`, `Incut_cut_${i}_point2_Y`
    );
    if (hasInplankPoints) {
      needCols.push(
        `Incut_cut_${i}_point3_X`, `Incut_cut_${i}_point3_Y`,
        `Incut_cut_${i}_point4_X`, `Incut_cut_${i}_point4_Y`
      );
    }
  }
  needCols.forEach((c) => {
    if (header.indexOf(c) === -1) {
      header.push(c);
      data.rows.forEach((row) => row.push(''));
    }
  });

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const plankId = row[cols.id] != null ? String(row[cols.id]).trim() : '';
    if (!plankId) continue;
    const plank = plankById[plankId];
    if (!plank) continue;

    let idx = 1;
    if (plank.l_cuts && plank.l_cuts.length > 0) {
      plank.l_cuts.forEach((lc) => {
        const startXCol = header.indexOf(`L_cut_${idx}_start_X`);
        const startYCol = header.indexOf(`L_cut_${idx}_start_Y`);
        const centerXCol = header.indexOf(`L_cut_${idx}_center_X`);
        const centerYCol = header.indexOf(`L_cut_${idx}_center_Y`);
        const endXCol = header.indexOf(`L_cut_${idx}_end_X`);
        const endYCol = header.indexOf(`L_cut_${idx}_end_Y`);
        if (startXCol !== -1 && startYCol !== -1 && centerXCol !== -1 && centerYCol !== -1 && endXCol !== -1 && endYCol !== -1) {
          row[startXCol] = lc.start && lc.start.x != null ? Number(lc.start.x).toFixed(1) : '';
          row[startYCol] = lc.start && lc.start.y != null ? Number(lc.start.y).toFixed(1) : '';
          row[centerXCol] = lc.center && lc.center.x != null ? Number(lc.center.x).toFixed(1) : '';
          row[centerYCol] = lc.center && lc.center.y != null ? Number(lc.center.y).toFixed(1) : '';
          row[endXCol] = lc.end && lc.end.x != null ? Number(lc.end.x).toFixed(1) : '';
          row[endYCol] = lc.end && lc.end.y != null ? Number(lc.end.y).toFixed(1) : '';
        }
        idx++;
      });
    }
    while (true) {
      const startXCol = header.indexOf(`L_cut_${idx}_start_X`);
      if (startXCol === -1) break;
      const startYCol = header.indexOf(`L_cut_${idx}_start_Y`);
      const centerXCol = header.indexOf(`L_cut_${idx}_center_X`);
      const centerYCol = header.indexOf(`L_cut_${idx}_center_Y`);
      const endXCol = header.indexOf(`L_cut_${idx}_end_X`);
      const endYCol = header.indexOf(`L_cut_${idx}_end_Y`);
      if (startYCol === -1 || centerXCol === -1 || centerYCol === -1 || endXCol === -1 || endYCol === -1) break;
      row[startXCol] = row[startYCol] = row[centerXCol] = row[centerYCol] = row[endXCol] = row[endYCol] = '';
      idx++;
    }

    idx = 1;
    if (plank.gola_profiles && plank.gola_profiles.length > 0) {
      plank.gola_profiles.forEach((gp) => {
        const startXCol = header.indexOf(`Gola_profile_${idx}_start_X`);
        const startYCol = header.indexOf(`Gola_profile_${idx}_start_Y`);
        const centerXCol = header.indexOf(`Gola_profile_${idx}_center_X`);
        const centerYCol = header.indexOf(`Gola_profile_${idx}_center_Y`);
        const endXCol = header.indexOf(`Gola_profile_${idx}_end_X`);
        const endYCol = header.indexOf(`Gola_profile_${idx}_end_Y`);
        if (startXCol !== -1 && startYCol !== -1 && centerXCol !== -1 && centerYCol !== -1 && endXCol !== -1 && endYCol !== -1) {
          row[startXCol] = gp.start && gp.start.x != null ? Number(gp.start.x).toFixed(1) : '';
          row[startYCol] = gp.start && gp.start.y != null ? Number(gp.start.y).toFixed(1) : '';
          row[centerXCol] = gp.center && gp.center.x != null ? Number(gp.center.x).toFixed(1) : '';
          row[centerYCol] = gp.center && gp.center.y != null ? Number(gp.center.y).toFixed(1) : '';
          row[endXCol] = gp.end && gp.end.x != null ? Number(gp.end.x).toFixed(1) : '';
          row[endYCol] = gp.end && gp.end.y != null ? Number(gp.end.y).toFixed(1) : '';
        }
        idx++;
      });
    }
    while (true) {
      const startXCol = header.indexOf(`Gola_profile_${idx}_start_X`);
      if (startXCol === -1) break;
      const startYCol = header.indexOf(`Gola_profile_${idx}_start_Y`);
      const centerXCol = header.indexOf(`Gola_profile_${idx}_center_X`);
      const centerYCol = header.indexOf(`Gola_profile_${idx}_center_Y`);
      const endXCol = header.indexOf(`Gola_profile_${idx}_end_X`);
      const endYCol = header.indexOf(`Gola_profile_${idx}_end_Y`);
      if (startYCol === -1 || centerXCol === -1 || centerYCol === -1 || endXCol === -1 || endYCol === -1) break;
      row[startXCol] = row[startYCol] = row[centerXCol] = row[centerYCol] = row[endXCol] = row[endYCol] = '';
      idx++;
    }

    idx = 1;
    if (plank.incut_cuts && plank.incut_cuts.length > 0) {
      plank.incut_cuts.forEach((ic) => {
        const p1XCol = header.indexOf(`Incut_cut_${idx}_point1_X`);
        const p1YCol = header.indexOf(`Incut_cut_${idx}_point1_Y`);
        const p2XCol = header.indexOf(`Incut_cut_${idx}_point2_X`);
        const p2YCol = header.indexOf(`Incut_cut_${idx}_point2_Y`);
        if (p1XCol !== -1 && p1YCol !== -1 && p2XCol !== -1 && p2YCol !== -1) {
          row[p1XCol] = ic.point1 && ic.point1.x != null ? Number(ic.point1.x).toFixed(1) : '';
          row[p1YCol] = ic.point1 && ic.point1.y != null ? Number(ic.point1.y).toFixed(1) : '';
          row[p2XCol] = ic.point2 && ic.point2.x != null ? Number(ic.point2.x).toFixed(1) : '';
          row[p2YCol] = ic.point2 && ic.point2.y != null ? Number(ic.point2.y).toFixed(1) : '';
        }
        const p3XCol = header.indexOf(`Incut_cut_${idx}_point3_X`);
        const p3YCol = header.indexOf(`Incut_cut_${idx}_point3_Y`);
        const p4XCol = header.indexOf(`Incut_cut_${idx}_point4_X`);
        const p4YCol = header.indexOf(`Incut_cut_${idx}_point4_Y`);
        if (p3XCol !== -1 && p3YCol !== -1) {
          row[p3XCol] = ic.point3 && ic.point3.x != null ? Number(ic.point3.x).toFixed(1) : '';
          row[p3YCol] = ic.point3 && ic.point3.y != null ? Number(ic.point3.y).toFixed(1) : '';
        }
        if (p4XCol !== -1 && p4YCol !== -1) {
          row[p4XCol] = ic.point4 && ic.point4.x != null ? Number(ic.point4.x).toFixed(1) : '';
          row[p4YCol] = ic.point4 && ic.point4.y != null ? Number(ic.point4.y).toFixed(1) : '';
        }
        idx++;
      });
    }
    while (true) {
      const p1XCol = header.indexOf(`Incut_cut_${idx}_point1_X`);
      if (p1XCol === -1) break;
      const p1YCol = header.indexOf(`Incut_cut_${idx}_point1_Y`);
      const p2XCol = header.indexOf(`Incut_cut_${idx}_point2_X`);
      const p2YCol = header.indexOf(`Incut_cut_${idx}_point2_Y`);
      if (p1YCol === -1 || p2XCol === -1 || p2YCol === -1) break;
      row[p1XCol] = row[p1YCol] = row[p2XCol] = row[p2YCol] = '';
      const p3XCol = header.indexOf(`Incut_cut_${idx}_point3_X`);
      const p3YCol = header.indexOf(`Incut_cut_${idx}_point3_Y`);
      const p4XCol = header.indexOf(`Incut_cut_${idx}_point4_X`);
      const p4YCol = header.indexOf(`Incut_cut_${idx}_point4_Y`);
      if (p3XCol !== -1) row[p3XCol] = '';
      if (p3YCol !== -1) row[p3YCol] = '';
      if (p4XCol !== -1) row[p4XCol] = '';
      if (p4YCol !== -1) row[p4YCol] = '';
      idx++;
    }
  }
}

/**
 * Applies move/rotate/flip/cutOrder modifications to cutlist data and returns new { header, rows }.
 * Optionally syncs L_cut/Gola/Incut from layouts (editor payload) into rows.
 */
export function applyCutlistModifications(
  cutlistData: CutlistData,
  modifications: CutlistModification[],
  options?: ApplyCutlistModificationsOptions
): CutlistData {
  const header = cutlistData.header.map((h) => String(h).trim());
  const rows = cutlistData.rows.map((row) => row.slice());

  const cols = getCols(header);
  if (cols.id === -1 || cols.x === -1 || cols.y === -1 || cols.sheet === -1) {
    throw new Error('Missing required columns in cutlist (Plank ID, X, Y, Sheet)');
  }

  const hasCutOrderMods = modifications.some((m) => m.type === 'cutOrder');
  if (hasCutOrderMods && cols.cutOrder === -1) {
    header.push('Cut Order');
    rows.forEach((r) => r.push(''));
    cols.cutOrder = header.length - 1;
  }

  const data = { header, rows };

  for (const mod of modifications) {
    const rowIndex = findRowIndex(rows, cols.id, mod.plankId);
    if (rowIndex === -1) continue;

    const row = rows[rowIndex];
    const oldX = num(row[cols.x]);
    const oldY = num(row[cols.y]);
    const oldWidth = num(row[cols.width]);
    const oldHeight = num(row[cols.height]);

    if (mod.type === 'move') {
      row[cols.sheet] = mod.toSheet;
      row[cols.x] = Number(mod.newX).toFixed(1);
      row[cols.y] = Number(mod.newY).toFixed(1);
      recalculateOperationCoords(rows, rowIndex, header, oldX, oldY, mod.newX, mod.newY);
    }

    if (mod.type === 'rotate') {
      const wasRotated = String(row[cols.rotated] ?? '').toLowerCase() === 'yes';
      row[cols.rotated] = wasRotated ? 'No' : 'Yes';
      row[cols.width] = Number(oldHeight).toFixed(1);
      row[cols.height] = Number(oldWidth).toFixed(1);
      if (cols.origWidth !== -1 && cols.origHeight !== -1) {
        const origW = num(row[cols.origWidth]);
        const origH = num(row[cols.origHeight]);
        row[cols.origWidth] = Number(origH).toFixed(1);
        row[cols.origHeight] = Number(origW).toFixed(1);
      }
      recalculateOperationCoordsRotated(rows, rowIndex, header, mod.angle ?? 90, oldWidth, oldHeight);
    }

    if (mod.type === 'flip') {
      recalculateOperationCoordsFlipped(rows, rowIndex, header, mod.direction, oldWidth, oldHeight);
    }

    if (mod.type === 'cutOrder' && cols.cutOrder >= 0 && mod.cutOrder != null) {
      row[cols.cutOrder] = parseInt(String(mod.cutOrder), 10) || '';
    }
  }

  if (options?.layouts && Object.keys(options.layouts).length > 0) {
    syncPlankLocalFeaturesFromLayouts(data, cols, options.layouts);
  }

  return { header, rows: data.rows };
}
