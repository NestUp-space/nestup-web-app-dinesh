/**
 * Catalog validation layer.
 * Validates raw sheet data before parsing. Ensures required columns exist
 * and basic structure is valid. No fallback to static data when invalid.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

function findCol(headers: string[], name: string): number {
  const n = name.toLowerCase().replace(/[\s_]/g, '');
  return headers.findIndex((h) => (h || '').toLowerCase().replace(/[\s_]/g, '') === n);
}

function parseNum(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return NaN;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  return parseFloat(cleaned);
}

/**
 * Validate Central Cabinet Catalog sheet (header + required columns + level structure).
 */
export function validateCabinetSheet(rows: string[][] | null): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rows || rows.length < 2) {
    return { valid: false, errors: ['Cabinet sheet must have a header row and at least one data row.'] };
  }

  const headers = rows[0].map((h) => String(h || '').trim());
  const required = ['entity_name', 'level'];
  for (const name of required) {
    if (findCol(headers, name) < 0) {
      errors.push(`Cabinet sheet missing required column: ${name}.`);
    }
  }

  const entityNameCol = findCol(headers, 'entity_name');
  const levelCol = findCol(headers, 'level');
  const boxWidthCol = findCol(headers, 'box_width');
  const lenXCol = findCol(headers, 'lenX');

  if (levelCol < 0 || entityNameCol < 0) {
    return { valid: false, errors };
  }

  let level1Count = 0;
  let level2WithoutBox = 0;
  const seenBoxIds = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const level = parseInt(row[levelCol] || '0', 10);

    if (level === 1 || level === 0) {
      level1Count++;
      const boxId = `catalog-${i}`;
      if (seenBoxIds.has(boxId)) {
        warnings.push(`Duplicate box row index at row ${i + 1}.`);
      }
      seenBoxIds.add(boxId);
      if (boxWidthCol >= 0 || lenXCol >= 0) {
        const w = parseNum(row[boxWidthCol] ?? row[lenXCol]);
        if (isNaN(w) || w <= 0) {
          warnings.push(`Row ${i + 1}: box dimensions should be positive numbers.`);
        }
      }
    } else if (level === 2) {
      if (level1Count === 0) {
        level2WithoutBox++;
      }
    }
  }

  if (level1Count === 0) {
    errors.push('Cabinet sheet has no level 1 (box) rows.');
  }
  if (level2WithoutBox > 0) {
    warnings.push('Some level 2 (plank) rows appear before any level 1 (box) row.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate Laminate Catalog sheet (first material sheet).
 */
export function validateLaminateSheet(rows: string[][] | null): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rows || rows.length < 2) {
    return { valid: true, errors: [], warnings: ['Laminate sheet is empty or has no data rows.'] };
  }

  const headers = rows[0].map((h) => String(h || '').trim());
  const brandCol = findCol(headers, 'brand');
  const codeCol = findCol(headers, 'code');
  const colourCol = findCol(headers, 'colour');

  if (brandCol < 0 && codeCol < 0 && findCol(headers, 'colour_name') < 0 && colourCol < 0) {
    errors.push('Laminate sheet should have at least one of: brand, code, colour/colour_name.');
  }

  const thicknessCol = findCol(headers, 'thickness');
  if (thicknessCol >= 0) {
    for (let i = 1; i < Math.min(rows.length, 6); i++) {
      const v = parseNum(rows[i]?.[thicknessCol]);
      if (rows[i] && rows[i].length > 0 && !isNaN(v) && v <= 0) {
        warnings.push(`Laminate row ${i + 1}: thickness should be a positive number.`);
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate Plywood Catalog sheet (second material sheet).
 */
export function validatePlywoodSheet(rows: string[][] | null): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rows || rows.length < 2) {
    return { valid: true, errors: [], warnings: ['Plywood sheet is empty or has no data rows.'] };
  }

  const headers = rows[0].map((h) => String(h || '').trim());
  const brandCol = findCol(headers, 'brand');
  if (brandCol < 0) {
    errors.push('Plywood sheet missing required column: brand.');
  }

  const thicknessCol = findCol(headers, 'thickness');
  if (thicknessCol >= 0) {
    for (let i = 1; i < Math.min(rows.length, 6); i++) {
      const v = parseNum(rows[i]?.[thicknessCol]);
      if (rows[i] && rows[i].length > 0 && !isNaN(v) && v <= 0) {
        warnings.push(`Plywood row ${i + 1}: thickness should be a positive number (mm).`);
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate full catalog (cabinet + laminate + plywood). Cabinet is required; material sheets may be empty.
 */
export function validateCatalogData(
  cabinetRows: string[][] | null,
  laminateRows: string[][] | null,
  plywoodRows: string[][] | null
): ValidationResult {
  const cabinet = validateCabinetSheet(cabinetRows);
  const laminate = validateLaminateSheet(laminateRows);
  const plywood = validatePlywoodSheet(plywoodRows);

  const errors: string[] = [];
  cabinet.errors.forEach((e) => errors.push('[Cabinet] ' + e));
  laminate.errors.forEach((e) => errors.push('[Laminate] ' + e));
  plywood.errors.forEach((e) => errors.push('[Plywood] ' + e));

  const warnings = [
    ...(cabinet.warnings || []),
    ...(laminate.warnings || []),
    ...(plywood.warnings || []),
  ];

  return {
    valid: cabinet.valid && laminate.valid && plywood.valid,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
