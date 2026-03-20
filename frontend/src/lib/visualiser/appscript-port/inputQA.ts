/**
 * Input QA Sheet Generator
 * 100% PORT from AppScript generateInputQASheet.js
 *
 * ALTERATION FROM APPSCRIPT: Only I/O changed.
 *   - Input: customerDetails (key-value map) + materialEstimateData (structured from materialEstimate.ts)
 *   - Output: { headerData, sections[] } — structured data matching the sheet layout
 *   - No SpreadsheetApp, no Google Drive
 */

export interface InputQASection {
  title: string;
  tableHeaders: string[];
  rows: (string | number | boolean)[][];
}

export interface InputQAResult {
  sheetName: string;
  headerData: {
    customerName: string;
    contact: string;
    address: string;
    date: string;
  };
  sections: InputQASection[];
}

export interface MaterialEstimateForQA {
  plywoods: (string | number)[][];
  laminates: (string | number)[][];
  edgeBandings: (string | number)[][];
}

// =================================================================
// =================== HELPERS (EXACT COPY) ===================
// =================================================================

function parsePlywoodDescription(rawDesc: string): [string, string] {
  if (rawDesc.includes(' - ')) {
    const parts = rawDesc.split(' - ');
    const thickness = parts.pop()!.trim();
    const description = parts.join(' - ').trim();
    return [description, thickness];
  }
  return [rawDesc, ''];
}

function parseQuantity(rawQty: string): string {
  const match = rawQty.match(/^(\d+)/);
  return match ? match[1] : rawQty;
}

// =================================================================
// =================== MATERIAL DATA EXTRACTION ===================
// =================================================================

/**
 * Extracts material data from the Material Estimate output arrays.
 * Port of getMaterialData() — reads from in-memory arrays instead of sheet.
 * The materialEstimate output has plywood, laminate, edgeBanding, hardware tables.
 */
export function extractMaterialDataForQA(materialEstimate: {
  plywood: { header: string[]; rows: (string | number)[][] };
  laminate: { header: string[]; rows: (string | number)[][] };
  edgeBanding: { header: string[]; rows: (string | number)[][] };
}): MaterialEstimateForQA {
  const plywoods: (string | number)[][] = [];
  for (const row of materialEstimate.plywood.rows) {
    const rawDesc = String(row[0] || '');
    const rawQty = String(row[1] || '');
    const [desc, thickness] = parsePlywoodDescription(rawDesc);
    const count = parseQuantity(rawQty);
    plywoods.push([desc, thickness, count]);
  }

  const laminates: (string | number)[][] = [];
  for (const row of materialEstimate.laminate.rows) {
    laminates.push([row[0], row[1], row[2]]);
  }

  const edgeBandings: (string | number)[][] = [];
  for (const row of materialEstimate.edgeBanding.rows) {
    edgeBandings.push([row[0], row[1], row[2], row[3]]);
  }

  return { plywoods, laminates, edgeBandings };
}

// =================================================================
// =================== MAIN FUNCTION ===================
// =================================================================

/**
 * 100% port of AppScript generateInputQASheet().
 * Input: customerDetails map + materialEstimate data.
 * Output: InputQAResult with structured sections.
 */
export function generateInputQA(
  customerDetails: Record<string, string>,
  materialData: MaterialEstimateForQA
): InputQAResult {
  const customerName =
    customerDetails['Customer Name'] || customerDetails['customer name'] || 'New Project';
  const contact =
    customerDetails['Contact Number'] || customerDetails['contact number'] || '';
  const address =
    customerDetails['Location'] || customerDetails['location'] || '';

  const sheetName = `Input QA - ${customerName}`;
  const date = new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' });

  const sections: InputQASection[] = [];

  // Section A: Plywoods
  const plyHeaders = ['Description', 'Thickness', 'Count', 'Input QA', 'Comments'];
  const plyRows: (string | number | boolean)[][] = materialData.plywoods.map((row) => [
    ...row,
    false,
    '',
  ]);
  sections.push({ title: 'A. Plywoods', tableHeaders: plyHeaders, rows: plyRows });

  // Section B: Laminates
  const lamHeaders = ['Description', 'Brand / Colour / code', 'Count', 'Input QA', 'Comments'];
  const lamRows: (string | number | boolean)[][] = materialData.laminates.map((row) => [
    ...row,
    false,
    '',
  ]);
  sections.push({ title: 'B. Laminates', tableHeaders: lamHeaders, rows: lamRows });

  // Section C: Edge Banding
  const ebHeaders = [
    'Description',
    'Brand / Colour / Code',
    'Thickness x width',
    'Quantity',
    'Input QA',
    'Comments',
  ];
  const ebRows: (string | number | boolean)[][] = materialData.edgeBandings.map((row) => [
    ...row,
    false,
    '',
  ]);
  sections.push({ title: 'C. Edge Banding', tableHeaders: ebHeaders, rows: ebRows });

  // Section D: Hardware (empty template)
  const hwHeaders = ['Description', 'Brand / Code', 'Count', 'Input QA', 'Comments'];
  sections.push({ title: 'D. Hardware', tableHeaders: hwHeaders, rows: [] });

  return {
    sheetName,
    headerData: { customerName, contact, address, date },
    sections,
  };
}
