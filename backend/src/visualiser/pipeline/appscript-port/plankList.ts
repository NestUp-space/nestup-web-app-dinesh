/**
 * Plank List Generator
 * 100% PORT from AppScript "plank list.js"
 *
 * Reads data from Formatted_Plank_Data, calculates Edge Binding (EB) with tiered wastage,
 * and creates Plank List, sorted by material.
 *
 * NEW RULE: Planks with thickness < 12mm get 0 EB and do not count towards wastage totals.
 *
 * ALTERATION FROM APPSCRIPT: Only I/O changed.
 *   - Input: formattedHeader (string[]) + formattedRows (2D array) — same as Formatted_Plank_Data sheet
 *   - Output: { header: string[], rows: (string|number)[][] }
 *   - No SpreadsheetApp
 */

// =================================================================
// =================== TYPES ===================
// =================================================================

export interface PlankListResult {
  header: string[];
  rows: (string | number)[][];
}

// =================================================================
// =================== WASTAGE HELPER (EXACT COPY) ===================
// =================================================================

function getWastageRate(materialName: string, totalEb: number): number {
  const isInner =
    materialName &&
    typeof materialName === 'string' &&
    materialName.toLowerCase().includes('inner');

  if (isInner) {
    if (totalEb > 500) {
      return 0.1; // 10%
    } else {
      return 0.15; // 15% (for quantities <= 500)
    }
  } else {
    if (totalEb < 25) {
      return 0.3; // 30%
    } else if (totalEb <= 50) {
      return 0.25; // 25%
    } else if (totalEb <= 100) {
      return 0.2; // 20%
    } else {
      return 0.15; // 15%
    }
  }
}

// =================================================================
// =================== MAIN FUNCTION ===================
// =================================================================

/**
 * 100% port of AppScript createPlankList().
 * Input: formattedHeader + formattedRows (same column layout as Formatted_Plank_Data sheet).
 * Output: { header, rows } with same columns as AppScript Plank List sheet.
 */
export function createPlankList(
  formattedHeader: string[],
  formattedRows: (string | number)[][]
): PlankListResult {
  const header = formattedHeader.map((h) => String(h).trim());

  const colIndices: Record<string, number> = {
    name: header.indexOf('plank_name'),
    id: header.indexOf('plank_id'),
    material: header.indexOf('plank_material'),
    width: header.indexOf('plank_width'),
    length: header.indexOf('plank_length'),
    thickness: header.indexOf('plank_thickness'),
  };

  for (const key in colIndices) {
    if (colIndices[key] === -1) {
      const colName = key === 'id' ? 'plank_id' : `plank_${key}`;
      throw new Error(`Required column "${colName}" not found in Formatted_Plank_Data.`);
    }
  }

  const newHeader = [
    'Plank Name',
    'Material',
    'Width (mm)',
    'Height (mm)',
    'Thickness (mm)',
    'Plank id',
    'Grain?',
    'Edge Binding (m)',
  ];

  // --- Pass 1: Calculate total base EB for each material (only if thickness >= 12) ---
  const materialEbTotals: Record<string, number> = {};

  for (let i = 0; i < formattedRows.length; i++) {
    const row = formattedRows[i];
    const material = row[colIndices.material];
    const width = row[colIndices.width];
    const length = row[colIndices.length];
    const thickness = row[colIndices.thickness];

    if (!material || !width || !length || thickness === '') continue;

    const numThickness = parseFloat(String(thickness));
    if (isNaN(numThickness) || numThickness < 12) {
      continue;
    }

    const numWidth = parseFloat(String(width));
    const numLength = parseFloat(String(length));

    if (!isNaN(numWidth) && !isNaN(numLength)) {
      const baseEb = ((numWidth + numLength) * 2) / 1000;
      const matKey = String(material);
      if (!materialEbTotals[matKey]) {
        materialEbTotals[matKey] = 0;
      }
      materialEbTotals[matKey] += baseEb;
    }
  }

  // --- Pass 2: Build output rows using tiered wastage ---
  const outputData: (string | number)[][] = [];

  for (let i = 0; i < formattedRows.length; i++) {
    const row = formattedRows[i];

    const plankName = row[colIndices.name];
    const plankId = row[colIndices.id];
    const material = row[colIndices.material];
    const width = row[colIndices.width];
    const length = row[colIndices.length];
    const thickness = row[colIndices.thickness];

    if (!plankName || !plankId || !material || !width || !length || thickness === '') {
      continue;
    }

    const numWidth = parseFloat(String(width));
    const numLength = parseFloat(String(length));
    const numThickness = parseFloat(String(thickness));
    let eb: string | number = '';

    if (isNaN(numThickness) || numThickness < 12) {
      eb = 0;
    } else if (!isNaN(numWidth) && !isNaN(numLength)) {
      const baseEb = ((numWidth + numLength) * 2) / 1000;
      const totalMaterialEb = materialEbTotals[String(material)] || 0;
      const wastageRate = getWastageRate(String(material), totalMaterialEb);
      eb = baseEb * (1 + wastageRate);
    }

    outputData.push([
      plankName,
      material,
      width,
      length, // plank_length is mapped to Height (mm)
      thickness,
      plankId,
      '', // Grain? column is left blank
      eb,
    ]);
  }

  // --- Sort data by Material ---
  const materialColIndex = 1; // "Material" is column index 1 in newHeader
  outputData.sort((a, b) => {
    if (String(a[materialColIndex]) < String(b[materialColIndex])) return -1;
    if (String(a[materialColIndex]) > String(b[materialColIndex])) return 1;
    return 0;
  });

  return { header: newHeader, rows: outputData };
}
