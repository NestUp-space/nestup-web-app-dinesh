/**
 * Material Summary Generator
 * 100% PORT from AppScript Cutlist.js (createMaterialSummarySheet + helpers)
 *
 * ALTERATION FROM APPSCRIPT: Only I/O changed.
 *   - Input: nestResultHeader/Rows + plankListHeader/Rows (in-memory arrays)
 *   - Output: { header, rows } matching AppScript "Material Summary" sheet
 *   - No SpreadsheetApp
 */

export interface MaterialSummaryResult {
  header: string[];
  rows: (string | number)[][];
}

// =================================================================
// =================== EB TOTALS FROM PLANK LIST ===================
// =================================================================

function getEbTotalsFromPlankList(
  plankListHeader: string[],
  plankListRows: (string | number)[][]
): Record<string, number> {
  const ebTotalsMap: Record<string, number> = {};
  const headers = plankListHeader.map((h) => String(h).trim());
  const matCol = headers.indexOf('Material');
  const thickCol = headers.indexOf('Thickness (mm)');
  const ebCol = headers.indexOf('Edge Binding (m)');
  if (matCol === -1 || thickCol === -1 || ebCol === -1)
    throw new Error("Missing columns in 'Plank List'.");

  for (let i = 0; i < plankListRows.length; i++) {
    const row = plankListRows[i];
    const originalMaterial = row[matCol];
    const thickness = row[thickCol];
    const ebValue = row[ebCol];
    if (!originalMaterial || thickness === '') continue;
    const baseMaterial = String(originalMaterial)
      .replace(/\(\s*\d+(\.\d+)?\s*mm\s*\)/gi, '')
      .replace(/\s*\([^)]+\)/g, '')
      .trim();
    const cleanKey = `${baseMaterial}_${thickness}mm`;
    const ebValueNum = parseFloat(String(ebValue));
    if (!isNaN(ebValueNum)) {
      if (!ebTotalsMap[cleanKey]) ebTotalsMap[cleanKey] = 0;
      ebTotalsMap[cleanKey] += ebValueNum;
    }
  }
  return ebTotalsMap;
}

// =================================================================
// =================== REPORT DATA FROM NEST RESULT ===================
// =================================================================

interface GroupStat {
  baseMaterial: string;
  thickness: string | number;
  plankCount: number;
  totalArea: number;
  sheetCount: number;
  roomNames: string;
}

function generateReportData(nestResultHeader: string[], nestResultRows: (string | number)[][]): {
  groupStats: Record<string, GroupStat>;
} {
  const headers = nestResultHeader.map((h) => String(h).trim());
  const sheetCol = headers.indexOf('Sheet');
  const materialCol = headers.indexOf('Material');
  const thicknessCol = headers.indexOf('Thickness');
  const widthCol = headers.indexOf('Placed Width');
  const heightCol = headers.indexOf('Placed Height');
  if ([sheetCol, materialCol, thicknessCol, widthCol, heightCol].includes(-1))
    throw new Error("Missing columns in 'Nest Result'.");
  const roomRegex = /\(([^)]+)\)/;

  const groupStatMap = new Map<
    string,
    {
      baseMaterial: string;
      thickness: string | number;
      plankCount: number;
      totalArea: number;
      sheetSet: Set<string | number>;
      roomSet: Set<string>;
    }
  >();

  nestResultRows.forEach((row) => {
    const sheetNum = row[sheetCol];
    const originalMaterial = row[materialCol];
    const thickness = row[thicknessCol];
    const width = Number(row[widthCol]);
    const height = Number(row[heightCol]);
    const area = width * height;
    let baseMaterial = String(originalMaterial).replace(/\(\s*\d+(\.\d+)?\s*mm\s*\)/gi, '');
    let roomName = 'N/A';
    const roomMatch = baseMaterial.match(roomRegex);
    if (roomMatch && roomMatch[1]) roomName = roomMatch[1].trim();
    baseMaterial = baseMaterial.replace(/\s*\([^)]+\)/g, '').trim();
    const cleanKey = `${baseMaterial}_${thickness}mm`;

    if (!groupStatMap.has(cleanKey))
      groupStatMap.set(cleanKey, {
        baseMaterial,
        thickness,
        plankCount: 0,
        totalArea: 0,
        sheetSet: new Set(),
        roomSet: new Set(),
      });
    const groupStat = groupStatMap.get(cleanKey)!;
    groupStat.plankCount++;
    groupStat.totalArea += area;
    groupStat.sheetSet.add(sheetNum);
    groupStat.roomSet.add(roomName);
  });

  const finalGroupStats: Record<string, GroupStat> = {};
  groupStatMap.forEach((value, key) => {
    finalGroupStats[key] = {
      baseMaterial: value.baseMaterial,
      thickness: value.thickness,
      plankCount: value.plankCount,
      totalArea: value.totalArea,
      sheetCount: value.sheetSet.size,
      roomNames: Array.from(value.roomSet).sort().join(', '),
    };
  });

  return { groupStats: finalGroupStats };
}

// =================================================================
// =================== MAIN FUNCTION ===================
// =================================================================

/**
 * 100% port of AppScript createMaterialSummarySheet().
 * Input: nestResultHeader/Rows + plankListHeader/Rows
 * Output: { header, rows } — same columns as "Material Summary" sheet
 */
export function createMaterialSummary(
  nestResultHeader: string[],
  nestResultRows: (string | number)[][],
  plankListHeader: string[],
  plankListRows: (string | number)[][]
): MaterialSummaryResult {
  if (nestResultRows.length === 0) throw new Error("'Nest Result' is empty.");

  const ebTotalsMap = getEbTotalsFromPlankList(plankListHeader, plankListRows);
  const reportData = generateReportData(nestResultHeader, nestResultRows);
  const groupStats = reportData.groupStats;
  if (!groupStats || Object.keys(groupStats).length === 0)
    throw new Error('No material data found.');

  const header = [
    'Material & Thickness',
    'Room Name(s)',
    'Plank Count',
    'Total Area (mm²)',
    'Sheets Used',
    'Avg. Area per Sheet (mm²)',
    'Utilization %',
    'Total Edge (m)',
  ];

  const SHEET_AREA = 1220 * 2440;
  const sortedGroupKeys = Object.keys(groupStats).sort();
  const rows: (string | number)[][] = [];

  for (const groupKey of sortedGroupKeys) {
    const group = groupStats[groupKey];
    const avgPerSheet = group.sheetCount > 0 ? group.totalArea / group.sheetCount : 0;
    const utilization =
      group.sheetCount > 0 ? (group.totalArea / (group.sheetCount * SHEET_AREA)) * 100 : 0;
    const totalEb = ebTotalsMap[groupKey] || 0;
    rows.push([
      `${group.baseMaterial} (${group.thickness}mm)`,
      group.roomNames,
      group.plankCount,
      Math.round(group.totalArea),
      group.sheetCount,
      Math.round(avgPerSheet),
      parseFloat(utilization.toFixed(1)),
      parseFloat(totalEb.toFixed(2)),
    ]);
  }

  return { header, rows };
}
