/**
 * Cutlist Generator and Nesting Optimization Tool
 * 100% PORT from AppScript Cutlist.js V5.3.4
 *
 * ALTERATION FROM APPSCRIPT: Only I/O changed.
 *   - Input: formattedHeader/Rows + plankListHeader/Rows (in-memory arrays, same column layout as sheets)
 *   - Output: { header, rows } for Nest Result (same columns as AppScript Nest Result sheet)
 *   - No SpreadsheetApp
 */

// =================================================================
// =================== TYPES ===================
// =================================================================

interface PlankForNesting {
  id: string;
  name: string;
  width: number;
  height: number;
  thickness: number;
  material: string;
  grain: string;
  operations: Record<string, OperationData[]>;
  ebValue: number;
  l_cuts: LCutTriplet[];
  gola_profiles: LCutTriplet[];
  incut_cuts: IncutCut[];
}

interface OperationData {
  x: number;
  y: number;
  z: number;
  length?: number;
  width?: number;
  depth?: number;
}

interface LCutTriplet {
  start: { x: number; y: number };
  center: { x: number; y: number };
  end: { x: number; y: number };
}

interface IncutCut {
  point1: { x: number; y: number };
  point2: { x: number; y: number };
  point3?: { x: number; y: number };
  point4?: { x: number; y: number };
}

interface FreeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SheetState {
  sheetNum: number;
  freeRects: FreeRect[];
}

interface Orientation {
  w: number;
  h: number;
  rotated: boolean;
}

interface EvaluateResult {
  fitness: number;
  layout: (string | number)[][];
  sheetsUsed: number;
  unplacedCount: number;
  utilization: string;
  maxWasteArea: string;
}

export interface CutlistResult {
  header: string[];
  rows: (string | number)[][];
}

export interface NestingAlgorithmParams {
  algorithm: 'bfd' | 'ga' | 'sa' | 'pso' | 'tournament';
  gaPopSize?: number;
  gaGenerations?: number;
  gaMutationRate?: number;
  saIterations?: number;
  saTemp?: number;
  saCoolingRate?: number;
  psoParticles?: number;
  psoIterations?: number;
  psoInertia?: number;
  psoCognitive?: number;
  psoSocial?: number;
}

// =================================================================
// =================== DATA PREPARATION (port of _getPlanksFromSheet) ===================
// =================================================================

/**
 * Prepares plank data from Formatted_Plank_Data and Plank List arrays.
 * 100% port of _getPlanksFromSheet() — only reads from arrays instead of sheets.
 */
export function getPlanksFromData(
  formattedHeader: string[],
  formattedRows: (string | number)[][],
  plankListHeader: string[],
  plankListRows: (string | number)[][]
): { planksByGroup: Record<string, PlankForNesting[]> | null; dynamicOpHeader: string[] } {
  const formattedHeaders = formattedHeader.map((h) => String(h).trim());
  const plankIdColF = formattedHeaders.indexOf('plank_id');
  const ebIndex = formattedHeaders.indexOf('EB_Value');

  if (plankIdColF === -1) {
    throw new Error("'Formatted_Plank_Data' missing 'plank_id'.");
  }

  const plankDetailsMap = new Map<
    string,
    {
      operations: Record<string, OperationData[]>;
      ebValue: number;
      l_cuts: LCutTriplet[];
      gola_profiles: LCutTriplet[];
      incut_cuts: IncutCut[];
    }
  >();
  const maxOpCounts: Record<string, number> = {};
  const opTypes = new Set<string>();

  const lCutMaxIndex = { count: 0 };
  const golaProfileMaxIndex = { count: 0 };
  const incutMaxIndex = { count: 0 };

  formattedHeaders.forEach((h) => {
    const lCutMatch = h.match(/^L_cut_(\d+)_(start|center|end)_(X|Y)$/);
    if (lCutMatch) {
      const idx = parseInt(lCutMatch[1]);
      if (idx > lCutMaxIndex.count) lCutMaxIndex.count = idx;
      return;
    }

    const golaMatch = h.match(/^Gola_profile_(\d+)_(start|center|end)_(X|Y)$/);
    if (golaMatch) {
      const idx = parseInt(golaMatch[1]);
      if (idx > golaProfileMaxIndex.count) golaProfileMaxIndex.count = idx;
      return;
    }

    const incutMatch = h.match(/^Incut_cut_(\d+)_point(1|2|3|4)_(X|Y)$/);
    if (incutMatch) {
      const idx = parseInt(incutMatch[1]);
      if (idx > incutMaxIndex.count) incutMaxIndex.count = idx;
      return;
    }

    const match = h.match(
      /^([a-zA-Z]+(?:_[a-zA-Z]+)*?)_(\d+?)_(X|Y|Z|length|width|type|notes)$/
    );
    if (match) {
      opTypes.add(match[1]);
      const opType = match[1];
      const opNum = parseInt(match[2]);
      if (opNum > (maxOpCounts[opType] || 0)) maxOpCounts[opType] = opNum;
    }
  });

  for (let i = 0; i < formattedRows.length; i++) {
    const row = formattedRows[i];
    const plankId = String(row[plankIdColF]).trim();
    if (!plankId) continue;

    const existingDetails = plankDetailsMap.get(plankId) || {
      operations: {},
      ebValue: 0,
      l_cuts: [],
      gola_profiles: [],
      incut_cuts: [],
    };
    const operations: Record<string, OperationData[]> = {};

    opTypes.forEach((opType) => {
      operations[opType] = existingDetails.operations[opType] || [];
      const maxCount = maxOpCounts[opType] || 0;
      const isGrooveOp =
        opType.includes('slot') || opType.includes('groove') || opType.includes('profile');
      for (let opNum = 1; opNum <= maxCount; opNum++) {
        const xIndex = formattedHeaders.indexOf(`${opType}_${opNum}_X`);
        const yIndex = formattedHeaders.indexOf(`${opType}_${opNum}_Y`);
        const zIndex = formattedHeaders.indexOf(`${opType}_${opNum}_Z`);
        if (xIndex === -1 || yIndex === -1 || zIndex === -1) continue;
        if (!row[xIndex] && !row[yIndex] && !row[zIndex]) continue;

        const localX =
          parseFloat(String(row[xIndex] || 0).replace(/mm/g, '').trim()) || 0;
        const localY =
          parseFloat(String(row[yIndex] || 0).replace(/mm/g, '').trim()) || 0;
        const localZ =
          parseFloat(String(row[zIndex] || 0).replace(/mm/g, '').trim()) || 0;
        const operationData: OperationData = { x: localX, y: localY, z: localZ };

        if (isGrooveOp) {
          const lenIndex = formattedHeaders.indexOf(`${opType}_${opNum}_length`);
          const widthIndex = formattedHeaders.indexOf(`${opType}_${opNum}_width`);
          if (lenIndex === -1 || widthIndex === -1) continue;
          operationData.length = parseFloat(String(row[lenIndex] || 0).trim()) || 0;
          operationData.width = parseFloat(String(row[widthIndex] || 0).trim()) || 0;
          operationData.depth = localZ;
          if (
            localX === 0 &&
            localY === 0 &&
            localZ === 0 &&
            operationData.length === 0 &&
            operationData.width === 0
          )
            continue;
        }
        const opExists = operations[opType].some(
          (op) => op.x === localX && op.y === localY && op.z === localZ
        );
        if (!opExists) operations[opType].push(operationData);
      }
      if (operations[opType].length === 0) delete operations[opType];
    });

    // Extract L-cut triplets
    const l_cuts: LCutTriplet[] = existingDetails.l_cuts || [];
    for (let lIdx = 1; lIdx <= lCutMaxIndex.count; lIdx++) {
      const startXIdx = formattedHeaders.indexOf(`L_cut_${lIdx}_start_X`);
      const startYIdx = formattedHeaders.indexOf(`L_cut_${lIdx}_start_Y`);
      const centerXIdx = formattedHeaders.indexOf(`L_cut_${lIdx}_center_X`);
      const centerYIdx = formattedHeaders.indexOf(`L_cut_${lIdx}_center_Y`);
      const endXIdx = formattedHeaders.indexOf(`L_cut_${lIdx}_end_X`);
      const endYIdx = formattedHeaders.indexOf(`L_cut_${lIdx}_end_Y`);

      if (
        startXIdx === -1 || startYIdx === -1 || centerXIdx === -1 ||
        centerYIdx === -1 || endXIdx === -1 || endYIdx === -1
      ) continue;

      const startX = parseFloat(String(row[startXIdx] ?? '').replace(/mm/g, '').trim());
      const startY = parseFloat(String(row[startYIdx] ?? '').replace(/mm/g, '').trim());
      const centerX = parseFloat(String(row[centerXIdx] ?? '').replace(/mm/g, '').trim());
      const centerY = parseFloat(String(row[centerYIdx] ?? '').replace(/mm/g, '').trim());
      const endX = parseFloat(String(row[endXIdx] ?? '').replace(/mm/g, '').trim());
      const endY = parseFloat(String(row[endYIdx] ?? '').replace(/mm/g, '').trim());

      if (
        !isNaN(startX) && !isNaN(startY) && !isNaN(centerX) &&
        !isNaN(centerY) && !isNaN(endX) && !isNaN(endY) &&
        (startX !== 0 || startY !== 0 || centerX !== 0 || centerY !== 0 || endX !== 0 || endY !== 0)
      ) {
        const lcutExists = l_cuts.some(
          (lc) =>
            lc.start.x === startX && lc.start.y === startY &&
            lc.center.x === centerX && lc.center.y === centerY &&
            lc.end.x === endX && lc.end.y === endY
        );
        if (!lcutExists) {
          l_cuts.push({
            start: { x: startX, y: startY },
            center: { x: centerX, y: centerY },
            end: { x: endX, y: endY },
          });
        }
      }
    }

    // Extract Gola profile triplets
    const gola_profiles: LCutTriplet[] = existingDetails.gola_profiles || [];
    for (let gIdx = 1; gIdx <= golaProfileMaxIndex.count; gIdx++) {
      const startXIdx = formattedHeaders.indexOf(`Gola_profile_${gIdx}_start_X`);
      const startYIdx = formattedHeaders.indexOf(`Gola_profile_${gIdx}_start_Y`);
      const centerXIdx = formattedHeaders.indexOf(`Gola_profile_${gIdx}_center_X`);
      const centerYIdx = formattedHeaders.indexOf(`Gola_profile_${gIdx}_center_Y`);
      const endXIdx = formattedHeaders.indexOf(`Gola_profile_${gIdx}_end_X`);
      const endYIdx = formattedHeaders.indexOf(`Gola_profile_${gIdx}_end_Y`);

      if (
        startXIdx === -1 || startYIdx === -1 || centerXIdx === -1 ||
        centerYIdx === -1 || endXIdx === -1 || endYIdx === -1
      ) continue;

      const startX = parseFloat(String(row[startXIdx] ?? '').replace(/mm/g, '').trim());
      const startY = parseFloat(String(row[startYIdx] ?? '').replace(/mm/g, '').trim());
      const centerX = parseFloat(String(row[centerXIdx] ?? '').replace(/mm/g, '').trim());
      const centerY = parseFloat(String(row[centerYIdx] ?? '').replace(/mm/g, '').trim());
      const endX = parseFloat(String(row[endXIdx] ?? '').replace(/mm/g, '').trim());
      const endY = parseFloat(String(row[endYIdx] ?? '').replace(/mm/g, '').trim());

      if (
        !isNaN(startX) && !isNaN(startY) && !isNaN(centerX) &&
        !isNaN(centerY) && !isNaN(endX) && !isNaN(endY) &&
        (startX !== 0 || startY !== 0 || centerX !== 0 || centerY !== 0 || endX !== 0 || endY !== 0)
      ) {
        const golaExists = gola_profiles.some(
          (gp) =>
            gp.start.x === startX && gp.start.y === startY &&
            gp.center.x === centerX && gp.center.y === centerY &&
            gp.end.x === endX && gp.end.y === endY
        );
        if (!golaExists) {
          gola_profiles.push({
            start: { x: startX, y: startY },
            center: { x: centerX, y: centerY },
            end: { x: endX, y: endY },
          });
        }
      }
    }

    // Extract Incut cuts
    const incut_cuts: IncutCut[] = existingDetails.incut_cuts || [];
    for (let incIdx = 1; incIdx <= incutMaxIndex.count; incIdx++) {
      const p1XIdx = formattedHeaders.indexOf(`Incut_cut_${incIdx}_point1_X`);
      const p1YIdx = formattedHeaders.indexOf(`Incut_cut_${incIdx}_point1_Y`);
      const p2XIdx = formattedHeaders.indexOf(`Incut_cut_${incIdx}_point2_X`);
      const p2YIdx = formattedHeaders.indexOf(`Incut_cut_${incIdx}_point2_Y`);

      if (p1XIdx === -1 || p1YIdx === -1 || p2XIdx === -1 || p2YIdx === -1) continue;

      const p1X = parseFloat(String(row[p1XIdx] ?? '').replace(/mm/g, '').trim());
      const p1Y = parseFloat(String(row[p1YIdx] ?? '').replace(/mm/g, '').trim());
      const p2X = parseFloat(String(row[p2XIdx] ?? '').replace(/mm/g, '').trim());
      const p2Y = parseFloat(String(row[p2YIdx] ?? '').replace(/mm/g, '').trim());

      if (
        !isNaN(p1X) && !isNaN(p1Y) && !isNaN(p2X) && !isNaN(p2Y) &&
        (p1X !== 0 || p1Y !== 0 || p2X !== 0 || p2Y !== 0)
      ) {
        const incutObj: IncutCut = {
          point1: { x: p1X, y: p1Y },
          point2: { x: p2X, y: p2Y },
        };

        const p3XIdx = formattedHeaders.indexOf(`Incut_cut_${incIdx}_point3_X`);
        const p3YIdx = formattedHeaders.indexOf(`Incut_cut_${incIdx}_point3_Y`);
        const p4XIdx = formattedHeaders.indexOf(`Incut_cut_${incIdx}_point4_X`);
        const p4YIdx = formattedHeaders.indexOf(`Incut_cut_${incIdx}_point4_Y`);

        if (p3XIdx !== -1 && p3YIdx !== -1 && p4XIdx !== -1 && p4YIdx !== -1) {
          const p3X = parseFloat(String(row[p3XIdx] ?? '').replace(/mm/g, '').trim());
          const p3Y = parseFloat(String(row[p3YIdx] ?? '').replace(/mm/g, '').trim());
          const p4X = parseFloat(String(row[p4XIdx] ?? '').replace(/mm/g, '').trim());
          const p4Y = parseFloat(String(row[p4YIdx] ?? '').replace(/mm/g, '').trim());
          if (!isNaN(p3X) && !isNaN(p3Y) && !(p3X === 0 && p3Y === 0)) {
            incutObj.point3 = { x: p3X, y: p3Y };
          }
          if (!isNaN(p4X) && !isNaN(p4Y) && !(p4X === 0 && p4Y === 0)) {
            incutObj.point4 = { x: p4X, y: p4Y };
          }
        }

        const incutExists = incut_cuts.some(
          (ic) =>
            ic.point1.x === p1X && ic.point1.y === p1Y &&
            ic.point2.x === p2X && ic.point2.y === p2Y
        );
        if (!incutExists) {
          incut_cuts.push(incutObj);
        }
      }
    }

    const ebVal = ebIndex > -1 ? parseFloat(String(row[ebIndex])) || 0 : 0;
    plankDetailsMap.set(plankId, { operations, ebValue: ebVal, l_cuts, gola_profiles, incut_cuts });
  }

  // Build dynamic op header
  let dynamicOpHeader: string[] = [];
  const sortedOpTypes = Object.keys(maxOpCounts).sort();
  sortedOpTypes.forEach((opType) => {
    const maxCount = maxOpCounts[opType] || 0;
    const isGrooveOp =
      opType.includes('slot') || opType.includes('groove') || opType.includes('profile');
    for (let i = 1; i <= maxCount; i++) {
      dynamicOpHeader.push(`${opType}_${i}_X`, `${opType}_${i}_Y`, `${opType}_${i}_Z`);
      if (isGrooveOp)
        dynamicOpHeader.push(`${opType}_${i}_length`, `${opType}_${i}_width`);
    }
  });

  for (let i = 1; i <= lCutMaxIndex.count; i++) {
    dynamicOpHeader.push(
      `L_cut_${i}_start_X`, `L_cut_${i}_start_Y`,
      `L_cut_${i}_center_X`, `L_cut_${i}_center_Y`,
      `L_cut_${i}_end_X`, `L_cut_${i}_end_Y`
    );
  }

  for (let i = 1; i <= golaProfileMaxIndex.count; i++) {
    dynamicOpHeader.push(
      `Gola_profile_${i}_start_X`, `Gola_profile_${i}_start_Y`,
      `Gola_profile_${i}_center_X`, `Gola_profile_${i}_center_Y`,
      `Gola_profile_${i}_end_X`, `Gola_profile_${i}_end_Y`
    );
  }

  const hasPoint3Headers = formattedHeaders.some((h) => /^Incut_cut_\d+_point3_X$/.test(h));
  for (let i = 1; i <= incutMaxIndex.count; i++) {
    dynamicOpHeader.push(
      `Incut_cut_${i}_point1_X`, `Incut_cut_${i}_point1_Y`,
      `Incut_cut_${i}_point2_X`, `Incut_cut_${i}_point2_Y`
    );
    if (hasPoint3Headers) {
      dynamicOpHeader.push(
        `Incut_cut_${i}_point3_X`, `Incut_cut_${i}_point3_Y`,
        `Incut_cut_${i}_point4_X`, `Incut_cut_${i}_point4_Y`
      );
    }
  }

  // Read Plank List
  const plHeaders = plankListHeader.map((h) => String(h).trim());
  const idCol = plHeaders.indexOf('Plank id');
  const nameCol = plHeaders.indexOf('Plank Name');
  const materialCol = plHeaders.indexOf('Material');
  const widthCol = plHeaders.indexOf('Width (mm)');
  const heightCol = plHeaders.indexOf('Height (mm)');
  const thicknessCol = plHeaders.indexOf('Thickness (mm)');
  const grainCol = plHeaders.indexOf('Grain?');

  if ([idCol, nameCol, materialCol, widthCol, heightCol, thicknessCol].includes(-1)) {
    throw new Error("Missing columns in 'Plank List'.");
  }

  const grouped: Record<string, PlankForNesting[]> = {};
  for (let i = 0; i < plankListRows.length; i++) {
    const row = plankListRows[i];
    const id = row[idCol];
    const name = row[nameCol];
    if (!id || !name || !row[widthCol] || !row[heightCol] || !row[thicknessCol] || !row[materialCol])
      continue;

    const width = Number(row[widthCol]);
    const height = Number(row[heightCol]);
    const thickness = parseFloat(String(row[thicknessCol]));
    const originalMaterial = String(row[materialCol]).trim();
    const baseMaterial = originalMaterial
      .replace(/\(\s*\d+(\.\d+)?\s*mm\s*\)/gi, '')
      .replace(/\s*\([^)]+\)/g, '')
      .trim();
    const groupKey = `${baseMaterial}_${thickness}mm`;

    if (isNaN(width) || isNaN(height) || isNaN(thickness) || width <= 0 || height <= 0 || thickness <= 0)
      continue;
    if (!grouped[groupKey]) grouped[groupKey] = [];

    const grain = String(row[grainCol] || '').trim().toUpperCase();

    const uniqueIdForLookup = String(id).trim();
    const details = plankDetailsMap.get(uniqueIdForLookup) || {
      operations: {},
      ebValue: 0,
      l_cuts: [],
      gola_profiles: [],
      incut_cuts: [],
    };

    grouped[groupKey].push({
      id: String(id),
      name: String(name),
      width,
      height,
      thickness,
      material: originalMaterial,
      grain,
      operations: details.operations,
      ebValue: details.ebValue,
      l_cuts: details.l_cuts || [],
      gola_profiles: details.gola_profiles || [],
      incut_cuts: details.incut_cuts || [],
    });
  }

  if (Object.keys(grouped).length === 0) {
    return { planksByGroup: null, dynamicOpHeader };
  }
  return { planksByGroup: grouped, dynamicOpHeader };
}

// =================================================================
// =================== CORE NESTING ENGINE (port of evaluateLayout) ===================
// =================================================================

function evaluateLayout(
  planksOrder: PlankForNesting[],
  _materialThicknessGroupKey: string,
  dynamicOpHeader: string[]
): EvaluateResult {
  const SHEET_WIDTH = 1220;
  const SHEET_HEIGHT = 2440;
  const STANDARD_SPACING = 10;
  const SMALL_PLANK_SPACING = 20;
  const SMALL_PLANK_THRESHOLD = 150;
  const MARGIN = 10;
  const POSITION_WEIGHT = 2.0;
  const FIT_WEIGHT = 1.0;
  const BOTTOM_LEFT_BIAS = 0.5;

  const resultsLayout: (string | number)[][] = [];
  const sheets: SheetState[] = [];
  let totalUsedArea = 0;
  const unplacedPlanks: PlankForNesting[] = [];
  const opHeaderIndexMap = new Map(dynamicOpHeader.map((h, i) => [h, i]));

  for (const plank of planksOrder) {
    let globalBestFit: {
      score: number;
      sheetIndex: number;
      rectIndex: number;
      orientation: Orientation | null;
    } = { score: Infinity, sheetIndex: -1, rectIndex: -1, orientation: null };

    const grainValue = String(plank.grain || '').trim().toUpperCase();
    let grainLocked = false;
    if (
      grainValue === 'Y' || grainValue === 'YES' || grainValue === 'TRUE' || grainValue === '1'
    ) {
      grainLocked = true;
    }

    const options: Orientation[] = [{ w: plank.width, h: plank.height, rotated: false }];
    if (!grainLocked) {
      options.push({ w: plank.height, h: plank.width, rotated: true });
    }

    for (let i = 0; i < sheets.length; i++) {
      const sheet = sheets[i];
      for (let j = 0; j < sheet.freeRects.length; j++) {
        const rect = sheet.freeRects[j];
        for (const opt of options) {
          if (opt.w <= rect.width + 0.01 && opt.h <= rect.height + 0.01) {
            const normalizedX = rect.x / SHEET_WIDTH;
            const normalizedY = rect.y / SHEET_HEIGHT;
            const positionScore = (normalizedX + normalizedY) * POSITION_WEIGHT;
            const wastedW = rect.width - opt.w;
            const wastedH = rect.height - opt.h;
            const fitScore = (Math.min(wastedW, wastedH) / 100) * FIT_WEIGHT;
            const distanceFromOrigin = Math.sqrt(rect.x * rect.x + rect.y * rect.y);
            const cornerBonus =
              (distanceFromOrigin /
                Math.sqrt(SHEET_WIDTH * SHEET_WIDTH + SHEET_HEIGHT * SHEET_HEIGHT)) *
              BOTTOM_LEFT_BIAS;
            const score = positionScore + fitScore + cornerBonus;
            if (score < globalBestFit.score) {
              globalBestFit = { score, sheetIndex: i, rectIndex: j, orientation: opt };
            }
          }
        }
      }
    }

    let targetSheetIndex = globalBestFit.sheetIndex;
    if (targetSheetIndex === -1) {
      const newSheetNum = sheets.length + 1;
      const newSheet: SheetState = {
        sheetNum: newSheetNum,
        freeRects: [
          {
            x: MARGIN,
            y: MARGIN,
            width: SHEET_WIDTH - 2 * MARGIN,
            height: SHEET_HEIGHT - 2 * MARGIN,
          },
        ],
      };
      sheets.push(newSheet);
      targetSheetIndex = sheets.length - 1;
      for (const opt of options) {
        if (opt.w <= newSheet.freeRects[0].width && opt.h <= newSheet.freeRects[0].height) {
          globalBestFit = { score: 0, sheetIndex: targetSheetIndex, rectIndex: 0, orientation: opt };
          break;
        }
      }
      if (globalBestFit.sheetIndex === -1) {
        unplacedPlanks.push(plank);
        continue;
      }
    }

    const { rectIndex, orientation } = globalBestFit;
    if (!orientation) continue;
    const targetSheet = sheets[targetSheetIndex];
    const targetRect = targetSheet.freeRects[rectIndex];

    const placedRect = {
      x: _cleanNum(targetRect.x),
      y: _cleanNum(targetRect.y),
      width: _cleanNum(orientation.w),
      height: _cleanNum(orientation.h),
    };

    const operationValues: (string | number)[] = Array(dynamicOpHeader.length).fill('');
    const originalDims = { width: plank.width, height: plank.height };

    if (plank.operations) {
      for (const opType in plank.operations) {
        const isGrooveOp =
          opType.includes('slot') || opType.includes('groove') || opType.includes('profile');
        plank.operations[opType].forEach((operation, index) => {
          const opNum = index + 1;
          const localX = operation.x;
          const localY = operation.y;
          let absoluteX: number, absoluteY: number;

          if (!orientation.rotated) {
            absoluteX = placedRect.x + localX;
            absoluteY = placedRect.y + localY;
          } else {
            absoluteX = placedRect.x + localY;
            if (isGrooveOp && operation.width) {
              absoluteY = placedRect.y + (originalDims.width - localX - operation.width);
            } else {
              absoluteY = placedRect.y + (originalDims.width - localX);
            }
          }

          const xHeader = `${opType}_${opNum}_X`;
          const yHeader = `${opType}_${opNum}_Y`;
          const zHeader = `${opType}_${opNum}_Z`;

          if (opHeaderIndexMap.has(xHeader)) {
            operationValues[opHeaderIndexMap.get(xHeader)!] = absoluteX.toFixed(1);
            operationValues[opHeaderIndexMap.get(yHeader)!] = absoluteY.toFixed(1);
            operationValues[opHeaderIndexMap.get(zHeader)!] = operation.z.toFixed(1);
          }

          if (isGrooveOp) {
            const lenHeader = `${opType}_${opNum}_length`;
            const widthHeader = `${opType}_${opNum}_width`;
            if (opHeaderIndexMap.has(lenHeader)) {
              operationValues[opHeaderIndexMap.get(lenHeader)!] = (operation.length ?? 0).toFixed(1);
              operationValues[opHeaderIndexMap.get(widthHeader)!] = (operation.width ?? 0).toFixed(1);
            }
          }
        });
      }
    }

    // L-cut triplets (plank-local)
    if (plank.l_cuts && plank.l_cuts.length > 0) {
      plank.l_cuts.forEach((lcut, index) => {
        const lCutNum = index + 1;
        let localStartX: number, localStartY: number;
        let localCenterX: number, localCenterY: number;
        let localEndX: number, localEndY: number;

        if (!orientation.rotated) {
          localStartX = lcut.start.x; localStartY = lcut.start.y;
          localCenterX = lcut.center.x; localCenterY = lcut.center.y;
          localEndX = lcut.end.x; localEndY = lcut.end.y;
        } else {
          localStartX = lcut.start.y; localStartY = originalDims.width - lcut.start.x;
          localCenterX = lcut.center.y; localCenterY = originalDims.width - lcut.center.x;
          localEndX = lcut.end.y; localEndY = originalDims.width - lcut.end.x;
        }

        const setVal = (header: string, val: number) => {
          if (opHeaderIndexMap.has(header))
            operationValues[opHeaderIndexMap.get(header)!] = val.toFixed(1);
        };

        setVal(`L_cut_${lCutNum}_start_X`, localStartX);
        setVal(`L_cut_${lCutNum}_start_Y`, localStartY);
        setVal(`L_cut_${lCutNum}_center_X`, localCenterX);
        setVal(`L_cut_${lCutNum}_center_Y`, localCenterY);
        setVal(`L_cut_${lCutNum}_end_X`, localEndX);
        setVal(`L_cut_${lCutNum}_end_Y`, localEndY);
      });
    }

    // Incut cuts (plank-local)
    if (plank.incut_cuts && plank.incut_cuts.length > 0) {
      plank.incut_cuts.forEach((incut, index) => {
        const incutNum = index + 1;
        const rotatePoint = (pt: { x: number; y: number }) => {
          if (!orientation.rotated) return { x: pt.x, y: pt.y };
          return { x: pt.y, y: originalDims.width - pt.x };
        };
        const setVal = (header: string, val: number) => {
          if (opHeaderIndexMap.has(header))
            operationValues[opHeaderIndexMap.get(header)!] = val.toFixed(1);
        };
        const local1 = rotatePoint(incut.point1);
        const local2 = rotatePoint(incut.point2);
        setVal(`Incut_cut_${incutNum}_point1_X`, local1.x);
        setVal(`Incut_cut_${incutNum}_point1_Y`, local1.y);
        setVal(`Incut_cut_${incutNum}_point2_X`, local2.x);
        setVal(`Incut_cut_${incutNum}_point2_Y`, local2.y);
        if (incut.point3) {
          const local3 = rotatePoint(incut.point3);
          setVal(`Incut_cut_${incutNum}_point3_X`, local3.x);
          setVal(`Incut_cut_${incutNum}_point3_Y`, local3.y);
        }
        if (incut.point4) {
          const local4 = rotatePoint(incut.point4);
          setVal(`Incut_cut_${incutNum}_point4_X`, local4.x);
          setVal(`Incut_cut_${incutNum}_point4_Y`, local4.y);
        }
      });
    }

    // Gola profile triplets (plank-local)
    if (plank.gola_profiles && plank.gola_profiles.length > 0) {
      plank.gola_profiles.forEach((gola, index) => {
        const golaNum = index + 1;
        let localStartX: number, localStartY: number;
        let localCenterX: number, localCenterY: number;
        let localEndX: number, localEndY: number;

        if (!orientation.rotated) {
          localStartX = gola.start.x; localStartY = gola.start.y;
          localCenterX = gola.center.x; localCenterY = gola.center.y;
          localEndX = gola.end.x; localEndY = gola.end.y;
        } else {
          localStartX = gola.start.y; localStartY = originalDims.width - gola.start.x;
          localCenterX = gola.center.y; localCenterY = originalDims.width - gola.center.x;
          localEndX = gola.end.y; localEndY = originalDims.width - gola.end.x;
        }

        const setVal = (header: string, val: number) => {
          if (opHeaderIndexMap.has(header))
            operationValues[opHeaderIndexMap.get(header)!] = val.toFixed(1);
        };

        setVal(`Gola_profile_${golaNum}_start_X`, localStartX);
        setVal(`Gola_profile_${golaNum}_start_Y`, localStartY);
        setVal(`Gola_profile_${golaNum}_center_X`, localCenterX);
        setVal(`Gola_profile_${golaNum}_center_Y`, localCenterY);
        setVal(`Gola_profile_${golaNum}_end_X`, localEndX);
        setVal(`Gola_profile_${golaNum}_end_Y`, localEndY);
      });
    }

    const eb = plank.ebValue || 0;
    const origW = orientation.w + 2 * eb;
    const origH = orientation.h + 2 * eb;

    const baseInfo: (string | number)[] = [
      plank.id, plank.name, plank.material, plank.thickness,
      targetSheet.sheetNum,
      placedRect.x.toFixed(1), placedRect.y.toFixed(1),
      orientation.w.toFixed(1), orientation.h.toFixed(1),
      orientation.rotated ? 'Yes' : 'No',
      origW.toFixed(1), origH.toFixed(1), eb,
    ];

    resultsLayout.push(baseInfo.concat(operationValues));
    totalUsedArea += orientation.w * orientation.h;

    const currentSpacing =
      orientation.w < SMALL_PLANK_THRESHOLD || orientation.h < SMALL_PLANK_THRESHOLD
        ? SMALL_PLANK_SPACING
        : STANDARD_SPACING;

    const newFreeRects: FreeRect[] = [];
    for (const free of targetSheet.freeRects) {
      if (_rectsOverlap(free, placedRect)) {
        newFreeRects.push(..._splitFreeRect(free, placedRect, currentSpacing));
      } else {
        newFreeRects.push(free);
      }
    }
    targetSheet.freeRects = _pruneRects(newFreeRects);
    targetSheet.freeRects.sort((a, b) => a.x + a.y - (b.x + b.y));
  }

  const sheetsUsed = sheets.length;
  const sheetArea = (SHEET_WIDTH - 2 * MARGIN) * (SHEET_HEIGHT - 2 * MARGIN);
  const totalSheetArea = sheetsUsed * sheetArea;
  const utilization = totalSheetArea > 0 ? (totalUsedArea / totalSheetArea) * 100 : 0;

  let maxWasteArea = 0;
  sheets.forEach((sheet) => {
    sheet.freeRects.forEach((rect) => {
      const area = rect.width * rect.height;
      if (area > maxWasteArea) maxWasteArea = area;
    });
  });

  const wasteBonus = (maxWasteArea / sheetArea) * 10;
  const fitness =
    sheetsUsed * 1000 + (100 - utilization) + unplacedPlanks.length * 10000 - wasteBonus;

  return {
    fitness,
    layout: resultsLayout,
    sheetsUsed,
    unplacedCount: unplacedPlanks.length,
    utilization: utilization.toFixed(2),
    maxWasteArea: maxWasteArea.toFixed(0),
  };
}

// =================================================================
// =================== MAIN CUTLIST FUNCTION ===================
// =================================================================

/**
 * 100% port of createCutlist().
 * Uses Best Fit Decreasing by default.
 */
export function createCutlist(
  formattedHeader: string[],
  formattedRows: (string | number)[][],
  plankListHeader: string[],
  plankListRows: (string | number)[][],
  algorithmParams?: NestingAlgorithmParams
): CutlistResult {
  const { planksByGroup, dynamicOpHeader } = getPlanksFromData(
    formattedHeader,
    formattedRows,
    plankListHeader,
    plankListRows
  );
  if (!planksByGroup) throw new Error('No valid plank data found.');

  const baseHeaders = [
    'Plank ID', 'Plank Name', 'Material', 'Thickness', 'Sheet',
    'X', 'Y', 'Placed Width', 'Placed Height', 'Rotated',
    'Original Width', 'Original Height', 'EB Value',
  ];

  const finalResults: (string | number)[][] = [
    baseHeaders.concat(dynamicOpHeader).concat('Cut Order'),
  ];
  let sheetCounter = 1;

  const algorithm = algorithmParams?.algorithm || 'bfd';

  for (const materialThicknessKey in planksByGroup) {
    const planks = planksByGroup[materialThicknessKey];
    planks.sort((a, b) => b.width * b.height - (a.width * a.height));

    let result: EvaluateResult;

    switch (algorithm) {
      case 'ga':
        result = _runGeneticAlgorithmForGroup(
          planks,
          algorithmParams?.gaPopSize ?? 20,
          algorithmParams?.gaGenerations ?? 50,
          algorithmParams?.gaMutationRate ?? 2,
          materialThicknessKey,
          dynamicOpHeader
        ).details;
        break;
      case 'sa':
        result = _runSimulatedAnnealingForGroup(
          planks,
          algorithmParams?.saIterations ?? 1000,
          algorithmParams?.saTemp ?? 100,
          algorithmParams?.saCoolingRate ?? 0.995,
          materialThicknessKey,
          dynamicOpHeader
        ).details;
        break;
      case 'pso':
        result = _runPsoForGroup(
          planks,
          {
            particles: algorithmParams?.psoParticles ?? 20,
            iterations: algorithmParams?.psoIterations ?? 50,
            inertia: algorithmParams?.psoInertia ?? 0.7,
            cognitive: algorithmParams?.psoCognitive ?? 1.5,
            social: algorithmParams?.psoSocial ?? 1.5,
          },
          materialThicknessKey,
          dynamicOpHeader
        ).details!;
        break;
      default:
        result = evaluateLayout(planks, materialThicknessKey, dynamicOpHeader);
    }

    result.layout.forEach((row) => {
      row[4] = (row[4] as number) + sheetCounter - 1;
      finalResults.push([...row, '']);
    });

    sheetCounter += result.sheetsUsed;
  }

  _fillCutOrderColumn(finalResults);

  return { header: finalResults[0] as string[], rows: finalResults.slice(1) };
}

// =================================================================
// =================== CUT ORDER ===================
// =================================================================

const CUT_ORDER_PLANK_THRESHOLD = 12;
const COL_SHEET = 4;
const COL_X = 5;
const COL_Y = 6;

function _fillCutOrderColumn(finalResults: (string | number)[][]) {
  if (!finalResults || finalResults.length < 2) return;
  const header = finalResults[0];
  const cutOrderCol = header.length - 1;
  if (header[cutOrderCol] !== 'Cut Order') return;

  const dataRows = finalResults.slice(1);
  const bySheet: Record<string, { row: (string | number)[]; originalIndex: number }[]> = {};
  dataRows.forEach((row, idx) => {
    const sheet = String(row[COL_SHEET]);
    if (!bySheet[sheet]) bySheet[sheet] = [];
    bySheet[sheet].push({ row, originalIndex: idx });
  });

  Object.keys(bySheet).forEach((sheetKey) => {
    const group = bySheet[sheetKey];
    if (group.length <= CUT_ORDER_PLANK_THRESHOLD) return;
    group.sort((a, b) => {
      const yA = parseFloat(String(a.row[COL_Y])) || 0;
      const yB = parseFloat(String(b.row[COL_Y])) || 0;
      if (yA !== yB) return yA - yB;
      const xA = parseFloat(String(a.row[COL_X])) || 0;
      const xB = parseFloat(String(b.row[COL_X])) || 0;
      return xA - xB;
    });
    group.forEach((item, i) => {
      item.row[cutOrderCol] = i + 1;
    });
  });
}

// =================================================================
// =================== ALGORITHMS ===================
// =================================================================

function _runGeneticAlgorithmForGroup(
  planks: PlankForNesting[], popSize: number, generations: number,
  mutationRate: number, materialThicknessKey: string, dynamicOpHeader: string[]
) {
  let population = Array.from({ length: popSize }, () => ({
    chromosome: _shuffleArray([...planks]),
    fitness: Infinity,
    details: null as EvaluateResult | null,
  }));
  let bestSolution: { fitness: number; details: EvaluateResult | null } = { fitness: Infinity, details: null };

  for (let gen = 0; gen < generations; gen++) {
    for (const individual of population) {
      if (individual.fitness === Infinity) {
        const result = evaluateLayout(individual.chromosome, materialThicknessKey, dynamicOpHeader);
        individual.fitness = result.fitness;
        individual.details = result;
      }
    }
    population.sort((a, b) => a.fitness - b.fitness);
    if (population[0].fitness < bestSolution.fitness) {
      bestSolution = { fitness: population[0].fitness, details: population[0].details };
    }
    const eliteCount = Math.max(2, Math.floor(popSize * 0.1));
    const newPopulation = population.slice(0, eliteCount);
    while (newPopulation.length < popSize) {
      const parent1 = population[Math.floor(Math.random() * (popSize / 2))];
      const parent2 = population[Math.floor(Math.random() * (popSize / 2))];
      let childChromosome = _orderedCrossover(parent1.chromosome, parent2.chromosome);
      if (Math.random() < mutationRate / 100) childChromosome = _mutate(childChromosome);
      newPopulation.push({ chromosome: childChromosome, fitness: Infinity, details: null });
    }
    population = newPopulation;
  }
  return bestSolution;
}

function _runSimulatedAnnealingForGroup(
  planks: PlankForNesting[], iterations: number, temp: number,
  coolingRate: number, materialThicknessKey: string, dynamicOpHeader: string[]
) {
  let currentSolution = {
    chromosome: _shuffleArray([...planks]),
    fitness: 0,
    details: null as EvaluateResult | null,
  };
  currentSolution.details = evaluateLayout(currentSolution.chromosome, materialThicknessKey, dynamicOpHeader);
  currentSolution.fitness = currentSolution.details.fitness;
  let bestSolution = { ...currentSolution };
  let temperature = temp;
  for (let i = 0; i < iterations; i++) {
    const neighborChromosome = _mutate(currentSolution.chromosome);
    const neighborDetails = evaluateLayout(neighborChromosome, materialThicknessKey, dynamicOpHeader);
    const neighborFitness = neighborDetails.fitness;
    const delta = neighborFitness - currentSolution.fitness;
    if (delta < 0 || Math.random() < Math.exp(-delta / temperature)) {
      currentSolution = { chromosome: neighborChromosome, fitness: neighborFitness, details: neighborDetails };
    }
    if (currentSolution.fitness < bestSolution.fitness) {
      bestSolution = { ...currentSolution };
    }
    temperature *= coolingRate;
  }
  return bestSolution;
}

function _runPsoForGroup(
  planks: PlankForNesting[],
  params: { particles: number; iterations: number; inertia: number; cognitive: number; social: number },
  materialThicknessKey: string,
  dynamicOpHeader: string[]
) {
  const particles: {
    chromosome: PlankForNesting[];
    velocity: number[];
    personalBest: { chromosome: PlankForNesting[]; fitness: number; details: EvaluateResult | null };
  }[] = [];
  let globalBest: { chromosome: PlankForNesting[]; fitness: number; details: EvaluateResult | null } = {
    fitness: Infinity, chromosome: [], details: null,
  };

  for (let i = 0; i < params.particles; i++) {
    const chromosome = _shuffleArray([...planks]);
    const details = evaluateLayout(chromosome, materialThicknessKey, dynamicOpHeader);
    const particle = {
      chromosome,
      velocity: Array(planks.length).fill(0).map(() => Math.random()),
      personalBest: { chromosome: [...chromosome], fitness: details.fitness, details },
    };
    particles.push(particle);
    if (particle.personalBest.fitness < globalBest.fitness) {
      globalBest = { ...particle.personalBest };
    }
  }

  for (let iter = 0; iter < params.iterations; iter++) {
    for (const particle of particles) {
      for (let i = 0; i < particle.chromosome.length; i++) {
        particle.velocity[i] = params.inertia * particle.velocity[i];
        if (Math.random() < params.cognitive) {
          const pBestItem = particle.personalBest.chromosome[i];
          const currentIndex = particle.chromosome.findIndex((p) => p.id === pBestItem.id);
          if (currentIndex !== -1 && currentIndex !== i) {
            [particle.chromosome[i], particle.chromosome[currentIndex]] = [particle.chromosome[currentIndex], particle.chromosome[i]];
          }
        }
        if (Math.random() < params.social) {
          const gBestItem = globalBest.chromosome[i];
          const currentIndex = particle.chromosome.findIndex((p) => p.id === gBestItem.id);
          if (currentIndex !== -1 && currentIndex !== i) {
            [particle.chromosome[i], particle.chromosome[currentIndex]] = [particle.chromosome[currentIndex], particle.chromosome[i]];
          }
        }
      }
      const details = evaluateLayout(particle.chromosome, materialThicknessKey, dynamicOpHeader);
      const fitness = details.fitness;
      if (fitness < particle.personalBest.fitness) {
        particle.personalBest = { chromosome: [...particle.chromosome], fitness, details };
      }
      if (fitness < globalBest.fitness) {
        globalBest = { chromosome: [...particle.chromosome], fitness, details };
      }
    }
  }

  return globalBest;
}

// =================================================================
// =================== HELPER FUNCTIONS ===================
// =================================================================

function _shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function _cleanNum(num: number): number {
  return Math.round(num * 100) / 100;
}

function _orderedCrossover(parent1: PlankForNesting[], parent2: PlankForNesting[]): PlankForNesting[] {
  const size = parent1.length;
  const start = Math.floor(Math.random() * size);
  const end = Math.floor(Math.random() * (size - start)) + start;
  const segment = parent1.slice(start, end + 1);
  const segmentIds = new Set(segment.map((p) => p.id));
  const filler = parent2.filter((p) => !segmentIds.has(p.id));
  const child: PlankForNesting[] = [];
  let fillerIndex = 0;
  for (let i = 0; i < size; i++) {
    if (i >= start && i <= end) child.push(segment[i - start]);
    else child.push(filler[fillerIndex++]);
  }
  return child;
}

function _mutate(chromosome: PlankForNesting[]): PlankForNesting[] {
  const newChromosome = [...chromosome];
  const i = Math.floor(Math.random() * newChromosome.length);
  let j = Math.floor(Math.random() * newChromosome.length);
  if (i === j) j = (i + 1) % newChromosome.length;
  [newChromosome[i], newChromosome[j]] = [newChromosome[j], newChromosome[i]];
  return newChromosome;
}

function _rectsOverlap(r1: FreeRect, r2: { x: number; y: number; width: number; height: number }): boolean {
  const epsilon = 0.01;
  return (
    r1.x < r2.x + r2.width - epsilon &&
    r1.x + r1.width > r2.x + epsilon &&
    r1.y < r2.y + r2.height - epsilon &&
    r1.y + r1.height > r2.y + epsilon
  );
}

function _splitFreeRect(
  freeRect: FreeRect,
  placedRect: { x: number; y: number; width: number; height: number },
  spacing: number
): FreeRect[] {
  const newRects: FreeRect[] = [];

  const exclusionLeft = _cleanNum(placedRect.x - spacing);
  const exclusionTop = _cleanNum(placedRect.y - spacing);
  const exclusionRight = _cleanNum(placedRect.x + placedRect.width + spacing);
  const exclusionBottom = _cleanNum(placedRect.y + placedRect.height + spacing);

  const freeRight = _cleanNum(freeRect.x + freeRect.width);
  const freeBottom = _cleanNum(freeRect.y + freeRect.height);

  if (exclusionTop > freeRect.y) {
    newRects.push({
      x: freeRect.x, y: freeRect.y,
      width: freeRect.width, height: _cleanNum(exclusionTop - freeRect.y),
    });
  }

  if (exclusionBottom < freeBottom) {
    newRects.push({
      x: freeRect.x, y: exclusionBottom,
      width: freeRect.width, height: _cleanNum(freeBottom - exclusionBottom),
    });
  }

  if (exclusionLeft > freeRect.x) {
    newRects.push({
      x: freeRect.x, y: freeRect.y,
      width: _cleanNum(exclusionLeft - freeRect.x), height: freeRect.height,
    });
  }

  if (exclusionRight < freeRight) {
    newRects.push({
      x: exclusionRight, y: freeRect.y,
      width: _cleanNum(freeRight - exclusionRight), height: freeRect.height,
    });
  }

  return newRects.filter((r) => r.width > 0.1 && r.height > 0.1);
}

function _pruneRects(rects: FreeRect[]): FreeRect[] {
  const pruned: FreeRect[] = [];
  for (let i = 0; i < rects.length; i++) {
    let isContained = false;
    for (let j = 0; j < rects.length; j++) {
      if (i === j) continue;
      if (
        rects[j].x <= rects[i].x &&
        rects[j].y <= rects[i].y &&
        rects[j].x + rects[j].width >= rects[i].x + rects[i].width &&
        rects[j].y + rects[j].height >= rects[i].y + rects[i].height
      ) {
        isContained = true;
        break;
      }
    }
    if (!isContained) pruned.push(rects[i]);
  }
  return pruned;
}
