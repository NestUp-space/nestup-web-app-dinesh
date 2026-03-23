/**
 * Pressing List Generator
 * 100% PORT from AppScript pressing_list.js
 *
 * ALTERATION FROM APPSCRIPT: Only I/O changed.
 *   - Input: materialSummaryHeader/Rows + customerDetails (key-value map)
 *   - Output: { headerBlock, tableHeader, rows, totalQuantity, footerNote }
 *   - No SpreadsheetApp
 */

export interface PressingListResult {
  headerBlock: {
    title: string;
    customerName: string;
    siteAddress: string;
    totalQuantity: number;
  };
  tableHeader: string[];
  rows: (string | number | boolean)[][];
  footerNote: string;
}

export interface CustomerDetails {
  [key: string]: string;
}

// =================================================================
// =================== HELPERS (EXACT COPY) ===================
// =================================================================

function parseMaterialAndThickness(cellValue: string | number): {
  material: string;
  thickness: string;
} {
  if (!cellValue) return { material: '', thickness: '' };
  const s = String(cellValue).trim();
  const match = s.match(/(\d+(?:\.\d+)?)\s*mm/i);
  const thickness = match ? match[1].trim() : '';
  const material = s
    .replace(/\(.*?\)|\[.*?\]|\{.*?\}/g, '')
    .replace(/\d+(?:\.\d+)?\s*mm/gi, '')
    .replace(/[-\/,:]+$/g, '')
    .trim();
  return { material, thickness };
}

function reduceThickness(thicknessText: string): string {
  if (!thicknessText) return '';
  const match = String(thicknessText).match(/(\d+(\.\d+)?)/);
  if (!match) return thicknessText;
  const value = parseFloat(match[1]) - 2;
  if (isNaN(value) || value <= 0) return thicknessText;
  return value + 'mm';
}

function thicknessToNumber(thicknessText: string): number | string {
  if (!thicknessText) return '';
  const match = String(thicknessText).match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : thicknessText;
}

function formatColorCode(materialPart: string, thicknessMm: string): string {
  const mat = (materialPart || '').trim().replace(/\s+/g, ' ');
  const num = thicknessMm
    ? parseFloat(String(thicknessMm).replace(/[^\d.]/g, '')) || 0
    : 0;
  return num ? mat + '-' + num.toFixed(1) : mat;
}

function determinePlyType(materialText: string): string {
  if (!materialText) return 'Plywood';
  const t = materialText.toString().toUpperCase();
  if (t.includes('HDHMR')) return 'HDHMR';
  if (t.includes('BB')) return 'Blockboard';
  if (t.includes('BWP')) return 'BWP plywood';
  if (t.includes('MR')) return 'MR';
  return 'Plywood';
}

function isDimensionCount(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  const s = String(val).trim();
  return /\d+\s*[xX]\s*\d+/.test(s);
}

// =================================================================
// =================== MAIN FUNCTION ===================
// =================================================================

/**
 * 100% port of AppScript generatePressingList().
 * Input: materialSummaryHeader/Rows + customerDetails map.
 * Output: PressingListResult with same structure as AppScript Pressing List sheet.
 */
export function generatePressingList(
  materialSummaryHeader: string[],
  materialSummaryRows: (string | number)[][],
  customerDetails?: CustomerDetails
): PressingListResult {
  const headers = materialSummaryHeader.map((h) => String(h || ''));

  let matThColIndex = headers.findIndex((h) => {
    const hh = h.toLowerCase();
    return (
      (hh.includes('material') && hh.includes('thick')) || hh.includes('material&thickness')
    );
  });
  if (matThColIndex === -1) matThColIndex = 0;

  let sheetsUsedColIndex = headers.findIndex((h) => {
    const hh = h.toLowerCase();
    return /sheets?\s*used/.test(hh) || /sheet\s*qty/.test(hh);
  });
  if (sheetsUsedColIndex === -1)
    sheetsUsedColIndex = Math.max(2, headers.length - 1);

  const customerName =
    customerDetails?.['customer name'] ||
    customerDetails?.['firm name'] ||
    '';
  const siteAddress =
    customerDetails?.['site address'] ||
    customerDetails?.['location'] ||
    '';

  const tableHeader = [
    'Color',
    'Material',
    'Thickness',
    'Count',
    'Pressing Completed',
    'Comments',
  ];

  const pressingRows: (string | number | boolean)[][] = [];

  for (let i = 0; i < materialSummaryRows.length; i++) {
    const row = materialSummaryRows[i];
    const combined = row[matThColIndex];
    const parsed = parseMaterialAndThickness(combined);
    const sheetQty = row[sheetsUsedColIndex];
    const countVal =
      sheetQty !== null && sheetQty !== undefined && sheetQty !== '' ? sheetQty : '';
    if (!parsed.material) continue;

    const originalThickness = parsed.thickness;
    const adjustedThickness = reduceThickness(originalThickness);
    const thicknessNum = thicknessToNumber(adjustedThickness);
    const colorCode = formatColorCode(parsed.material, originalThickness);
    const plyType = determinePlyType(parsed.material);

    pressingRows.push([colorCode, plyType, thicknessNum, countVal, false, '']);
  }

  let totalQuantity = 0;
  for (const r of pressingRows) {
    const c = r[3];
    if (c !== null && c !== undefined && c !== '') {
      if (isDimensionCount(c)) {
        totalQuantity += 1;
      } else {
        const n = parseFloat(String(c).replace(/[^\d.]/g, ''));
        if (!isNaN(n)) totalQuantity += n;
      }
    }
  }

  return {
    headerBlock: {
      title: 'Pressing Checklist',
      customerName,
      siteAddress: siteAddress || 'NA',
      totalQuantity,
    },
    tableHeader,
    rows: pressingRows,
    footerNote:
      'Note: - Please check the Cutting List wherever there are CUT PIECES',
  };
}
