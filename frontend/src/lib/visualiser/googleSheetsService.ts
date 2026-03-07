/**
 * Google Sheets API Service
 * Fetches catalog data from Google Sheets using API Key authentication
 * 
 * Sheet IDs from Apps Script DESIGNER_CONFIG:
 * - Central Catalogue: 1A9W8gsjkalw8DHwmkRsh33UnOy5Y0seAUhyDrWNWeKA
 * - Material Catalog: 1BJnNmIwG8J07LJGhnWQJ-gJbENSGJ2ArRCxypJAGMto
 */

import { CatalogModel, PlywoodOption, LaminateOption } from '@/types/visualiser';
import { CatalogBoxWithPlanks } from './catalogParser';
import { validateCatalogData, type ValidationResult } from './catalogValidation';

// ============================================
// CONFIGURATION
// ============================================

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// Default sheet IDs (overridden by env)
const DEFAULT_SHEET_IDS = {
  catalogue: '1A9W8gsjkalw8DHwmkRsh33UnOy5Y0seAUhyDrWNWeKA',
  materialCatalog: '1BJnNmIwG8J07LJGhnWQJ-gJbENSGJ2ArRCxypJAGMto',
};

/** Sheet IDs from env (NEXT_PUBLIC_ or server-side). Used as single source of truth. */
export function getSheetIds(): { catalogue: string; materialCatalog: string } {
  const catalogue =
    process.env.NEXT_PUBLIC_CATALOGUE_SHEET_ID ||
    process.env.CATALOGUE_SHEET_ID ||
    DEFAULT_SHEET_IDS.catalogue;
  const materialCatalog =
    process.env.NEXT_PUBLIC_MATERIAL_CATALOG_SHEET_ID ||
    process.env.MATERIAL_CATALOG_SHEET_ID ||
    DEFAULT_SHEET_IDS.materialCatalog;
  return { catalogue, materialCatalog };
}

/** @deprecated Use getSheetIds() for env-based IDs */
export const SHEET_IDS = {
  get catalogue() {
    return getSheetIds().catalogue;
  },
  get materialCatalog() {
    return getSheetIds().materialCatalog;
  },
};

// Material catalog: only first two sheets per requirements. Primary names; fallbacks for legacy sheets.
export const MATERIAL_SHEET_NAMES = {
  laminate: 'Laminate Catalog',
  plywood: 'Plywood Catalog',
} as const;
const MATERIAL_SHEET_FALLBACKS = {
  laminate: ['Laminate Catalog', 'Laminate Library'],
  plywood: ['Plywood Catalog', 'Plywood Library'],
};

// Sheet ranges (cabinet = Sheet1; material = by sheet name)
export const SHEET_RANGES = {
  catalogue: 'Sheet1!A:AZ',
  plywood: `${MATERIAL_SHEET_NAMES.plywood}!A:Z`,
  laminate: `${MATERIAL_SHEET_NAMES.laminate}!A:Z`,
};

// Auto-refresh interval (5 minutes)
export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

// ============================================
// TYPES
// ============================================

export interface SheetData {
  range: string;
  majorDimension: string;
  values: string[][];
}

export interface SheetResponse {
  spreadsheetId: string;
  valueRanges?: SheetData[];
  values?: string[][];
}

export interface CatalogData {
  models: CatalogModel[];
  catalogBoxesWithPlanks: CatalogBoxWithPlanks[];
  plywoodOptions: PlywoodOption[];
  laminateOptions: LaminateOption[];
  fetchedAt: string;
}

export interface CatalogFetchResult {
  data: CatalogData | null;
  validation: ValidationResult;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Fetch data from a single Google Sheet range
 */
export async function fetchSheetData(
  sheetId: string, 
  range: string, 
  apiKey: string
): Promise<string[][] | null> {
  try {
    const url = `${SHEETS_API_BASE}/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('[GoogleSheets] API Error:', error);
      return null;
    }
    
    const data: SheetResponse = await response.json();
    return data.values || null;
  } catch (error) {
    console.error('[GoogleSheets] Fetch error:', error);
    return null;
  }
}

/**
 * Fetch multiple ranges from a Google Sheet in a single request
 */
export async function fetchMultipleRanges(
  sheetId: string,
  ranges: string[],
  apiKey: string
): Promise<Map<string, string[][]>> {
  const result = new Map<string, string[][]>();
  
  try {
    const rangeParams = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
    const url = `${SHEETS_API_BASE}/${sheetId}/values:batchGet?${rangeParams}&key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('[GoogleSheets] Batch API Error:', error);
      return result;
    }
    
    const data: SheetResponse = await response.json();
    
    if (data.valueRanges) {
      data.valueRanges.forEach((rangeData) => {
        if (rangeData.values) {
          // Extract sheet name from range
          const sheetName = rangeData.range.split('!')[0].replace(/'/g, '');
          result.set(sheetName, rangeData.values);
        }
      });
    }
    
    return result;
  } catch (error) {
    console.error('[GoogleSheets] Batch fetch error:', error);
    return result;
  }
}

// ============================================
// DATA PARSING FUNCTIONS
// ============================================

/**
 * Find column index by header name (case-insensitive)
 */
function findColumnIndex(headers: string[], name: string): number {
  const normalized = name.toLowerCase().replace(/[\s_]/g, '');
  return headers.findIndex(h => 
    (h || '').toLowerCase().replace(/[\s_]/g, '') === normalized
  );
}

/**
 * Parse Central Catalogue data into models and boxes with planks
 */
export function parseCatalogueData(rows: string[][]): {
  models: CatalogModel[];
  boxesWithPlanks: CatalogBoxWithPlanks[];
} {
  if (!rows || rows.length < 2) {
    return { models: [], boxesWithPlanks: [] };
  }

  const headers = rows[0].map(h => String(h || '').trim());
  
  // Column indices based on DESIGNER_CONFIG
  const cols = {
    entityName: findColumnIndex(headers, 'entity_name'),
    level: findColumnIndex(headers, 'level'),
    material: findColumnIndex(headers, 'material'),
    roomName: findColumnIndex(headers, 'room_name'),
    unitLocation: findColumnIndex(headers, 'unit_location'),
    boxModel: findColumnIndex(headers, 'box_model'),
    boxType: findColumnIndex(headers, 'box_type'),
    lenX: findColumnIndex(headers, 'lenX'),
    lenY: findColumnIndex(headers, 'lenY'),
    lenZ: findColumnIndex(headers, 'lenZ'),
    x: findColumnIndex(headers, 'X'),
    y: findColumnIndex(headers, 'Y'),
    z: findColumnIndex(headers, 'Z'),
    boxWidth: findColumnIndex(headers, 'box_width'),
    boxDepth: findColumnIndex(headers, 'box_depth'),
    boxHeight: findColumnIndex(headers, 'box_height'),
    skirting: findColumnIndex(headers, 'skirting'),
    carcusThickness: findColumnIndex(headers, 'carcus_thickness'),
    doorThickness: findColumnIndex(headers, 'door_thickness'),
    backplankThickness: findColumnIndex(headers, 'backplank_thickness'),
  };

  const models: CatalogModel[] = [];
  const boxesWithPlanks: CatalogBoxWithPlanks[] = [];
  
  let currentBox: CatalogBoxWithPlanks | null = null;
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const entityName = (row[cols.entityName] || '').trim();
    const level = parseInt(row[cols.level] || '0', 10);
    
    if (!entityName) continue;
    
    if (level === 1 || level === 0) {
      // This is a box row
      if (currentBox) {
        boxesWithPlanks.push(currentBox);
      }
      
      const boxWidth = parseFloat(row[cols.boxWidth] || row[cols.lenX] || '600') || 600;
      const boxDepth = parseFloat(row[cols.boxDepth] || row[cols.lenY] || '550') || 550;
      const boxHeight = parseFloat(row[cols.boxHeight] || row[cols.lenZ] || '720') || 720;
      
      currentBox = {
        id: `catalog_box_${i}`,
        entityName,
        level: 1,
        lenX: boxWidth,
        lenY: boxDepth,
        lenZ: boxHeight,
        boxModel: (row[cols.boxModel] || entityName).trim(),
        boxType: (row[cols.boxType] || 'Base Unit').trim(),
        boxWidth,
        boxDepth,
        boxHeight,
        skirting: parseFloat(row[cols.skirting] || '100') || 100,
        skirtingWidth: 50,
        carcusThickness: parseFloat(row[cols.carcusThickness] || '18') || 18,
        doorThickness: parseFloat(row[cols.doorThickness] || '18') || 18,
        backplankThickness: parseFloat(row[cols.backplankThickness] || '10') || 10,
        planks: [],
      };
      
      // Also add to models list
      models.push({
        id: `model_${i}`,
        entityName,
        level: 1,
        boxModel: currentBox.boxModel,
        boxType: currentBox.boxType,
        material: (row[cols.material] || 'Plywood').trim(),
        roomName: (row[cols.roomName] || '').trim(),
        unitLocation: (row[cols.unitLocation] || '').trim(),
        lenX: boxWidth,
        lenY: boxDepth,
        lenZ: boxHeight,
        boxWidth,
        boxDepth,
        boxHeight,
        skirting: currentBox.skirting,
        skirtingWidth: currentBox.skirtingWidth,
        carcusThickness: currentBox.carcusThickness,
        doorThickness: currentBox.doorThickness,
        backplankThickness: currentBox.backplankThickness,
      });
      
    } else if (level === 2 && currentBox) {
      // This is a plank row
      currentBox.planks.push({
        entityName,
        level: 2,
        material: (row[cols.material] || 'Plywood').trim(),
        lenX: parseFloat(row[cols.lenX] || '0') || 0,
        lenY: parseFloat(row[cols.lenY] || '0') || 0,
        lenZ: parseFloat(row[cols.lenZ] || '0') || 0,
        x: parseFloat(row[cols.x] || '0') || 0,
        y: parseFloat(row[cols.y] || '0') || 0,
        z: parseFloat(row[cols.z] || '0') || 0,
        rowIndex: i,
        subComponents: [],
      });
    }
  }
  
  // Don't forget the last box
  if (currentBox) {
    boxesWithPlanks.push(currentBox);
  }
  
  console.log(`[GoogleSheets] Parsed ${models.length} models, ${boxesWithPlanks.length} boxes with planks`);
  return { models, boxesWithPlanks };
}

/**
 * Parse Plywood Library data
 */
export function parsePlywoodLibrary(rows: string[][]): PlywoodOption[] {
  if (!rows || rows.length < 2) return [];
  
  const headers = rows[0].map(h => String(h || '').trim());
  const cols = {
    sno: findColumnIndex(headers, 'sno') ?? findColumnIndex(headers, 's.no') ?? 0,
    brand: findColumnIndex(headers, 'brand') ?? 1,
    gradeType: findColumnIndex(headers, 'gradetype') ?? findColumnIndex(headers, 'grade_type') ?? findColumnIndex(headers, 'type') ?? 2,
    material: findColumnIndex(headers, 'material') ?? 3,
    thickness: findColumnIndex(headers, 'thickness') ?? 4,
    price: findColumnIndex(headers, 'price') ?? 5,
    remarks: findColumnIndex(headers, 'remarks') ?? 6,
  };
  
  const options: PlywoodOption[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const brand = (row[cols.brand] || '').trim();
    if (!brand) continue;
    
    const gradeType = (row[cols.gradeType] || 'MR').trim();
    const material = (row[cols.material] || 'Plywood').trim();
    const thickness = parseFloat(row[cols.thickness] || '18') || 18;
    
    options.push({
      id: `ply_${i}`,
      sno: String(row[cols.sno] || i),
      brand,
      gradeType,
      material,
      thickness,
      price: parseFloat(row[cols.price] || '0') || 0,
      remarks: (row[cols.remarks] || '').trim(),
      displayName: `${brand} ${gradeType} ${material} ${thickness}mm`.trim(),
    });
  }
  
  console.log(`[GoogleSheets] Parsed ${options.length} plywood options`);
  return options;
}

/**
 * Parse Laminate Library data.
 * Photo column: sheet header "Laminate Photo" (or "Photo", "Image", etc.) holds image URLs.
 */
export function parseLaminateLibrary(rows: string[][]): LaminateOption[] {
  if (!rows || rows.length < 2) return [];

  const headers = rows[0].map(h => String(h || '').trim());
  const photoUrlCol = ['laminate photo', 'laminate_photo', 'photourl', 'photo_url', 'photo', 'image']
    .map(name => findColumnIndex(headers, name))
    .find(i => i >= 0) ?? 6;

  const priceCol = ['price', 'laminate price', 'laminate_price', 'rate']
    .map(name => findColumnIndex(headers, name))
    .find(i => i >= 0) ?? 7;

  const cols = {
    sno: findColumnIndex(headers, 'sno') ?? findColumnIndex(headers, 's.no') ?? 0,
    brand: findColumnIndex(headers, 'brand') ?? 1,
    code: findColumnIndex(headers, 'code') ?? findColumnIndex(headers, 'colour_code') ?? 2,
    colour: findColumnIndex(headers, 'colour') ?? findColumnIndex(headers, 'colour_name') ?? findColumnIndex(headers, 'name') ?? 3,
    thickness: findColumnIndex(headers, 'thickness') ?? 4,
    photoUrl: photoUrlCol,
    price: priceCol,
    comments: findColumnIndex(headers, 'comments') ?? findColumnIndex(headers, 'remarks') ?? 7,
  };

  function parsePrice(value: string | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    const cleaned = String(value).replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  const options: LaminateOption[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const brand = (row[cols.brand] || '').trim();
    const code = (row[cols.code] || '').trim();
    if (!brand && !code) continue;

    const colour = (row[cols.colour] || code).trim();

    options.push({
      id: `lam_${i}`,
      sno: String(row[cols.sno] || i),
      brand,
      code,
      colour,
      thickness: parseFloat(row[cols.thickness] || '0.8') || 0.8,
      photoUrl: (row[cols.photoUrl] || '').trim(),
      price: parsePrice(row[cols.price]),
      comments: (row[cols.comments] || '').trim(),
      displayName: `${brand} ${code} ${colour}`.trim(),
    });
  }
  
  console.log(`[GoogleSheets] Parsed ${options.length} laminate options`);
  return options;
}

/**
 * Convert Google Drive sharing URL to thumbnail URL for reliable img display
 */
export function convertDriveUrl(driveUrl: string): string {
  if (!driveUrl) return '';
  if (driveUrl.includes('/thumbnail?') || driveUrl.includes('uc?export=view')) return driveUrl;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = driveUrl.match(pattern);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
    }
  }
  const fileIdMatch = driveUrl.match(/[-\w]{25,}/);
  if (fileIdMatch) {
    return `https://drive.google.com/thumbnail?id=${fileIdMatch[0]}&sz=w400`;
  }
  return driveUrl;
}

// ============================================
// MAIN FETCH FUNCTION
// ============================================

/**
 * Fetch all catalog data from Google Sheets.
 * Uses only cabinet sheet + first two material sheets (Laminate Catalog, Plywood Catalog).
 * Validates raw data before parsing; when validation fails, data is null and errors are in validation.
 * @param apiKey - Google Sheets API key
 * @param sheetIds - Optional override for sheet IDs (from getSheetIds() or server env)
 */
export async function fetchAllCatalogData(
  apiKey: string,
  sheetIds?: { catalogue: string; materialCatalog: string }
): Promise<CatalogFetchResult> {
  const invalidResult: CatalogFetchResult = {
    data: null,
    validation: { valid: false, errors: ['No API key provided.'] },
  };

  if (!apiKey) {
    console.error('[GoogleSheets] No API key provided');
    return invalidResult;
  }

  const ids = sheetIds ?? getSheetIds();

  try {
    console.log('[GoogleSheets] Fetching catalog data...');

    const fetchMaterialSheet = async (names: readonly string[]) => {
      for (const name of names) {
        const data = await fetchSheetData(ids.materialCatalog, `${name}!A:Z`, apiKey);
        if (data && data.length > 0) return data;
      }
      return null;
    };
    const [catalogueData, laminateData, plywoodData] = await Promise.all([
      fetchSheetData(ids.catalogue, SHEET_RANGES.catalogue, apiKey),
      fetchMaterialSheet(MATERIAL_SHEET_FALLBACKS.laminate),
      fetchMaterialSheet(MATERIAL_SHEET_FALLBACKS.plywood),
    ]);

    const validation = validateCatalogData(catalogueData, laminateData, plywoodData);
    if (!validation.valid) {
      console.warn('[GoogleSheets] Catalog validation failed:', validation.errors);
      return { data: null, validation };
    }

    const { models, boxesWithPlanks } = catalogueData
      ? parseCatalogueData(catalogueData)
      : { models: [], boxesWithPlanks: [] };

    const plywoodOptions = plywoodData ? parsePlywoodLibrary(plywoodData) : [];
    const laminateOptions = laminateData ? parseLaminateLibrary(laminateData) : [];

    const laminatesWithImages = laminateOptions.map((lam) => ({
      ...lam,
      photoUrl: convertDriveUrl(lam.photoUrl || ''),
    }));

    const result: CatalogData = {
      models,
      catalogBoxesWithPlanks: boxesWithPlanks,
      plywoodOptions,
      laminateOptions: laminatesWithImages,
      fetchedAt: new Date().toISOString(),
    };

    console.log(
      `[GoogleSheets] Fetched: ${models.length} models, ${boxesWithPlanks.length} boxes, ${plywoodOptions.length} plywood, ${laminatesWithImages.length} laminates`
    );

    return { data: result, validation };
  } catch (error) {
    console.error('[GoogleSheets] Error fetching catalog data:', error);
    return {
      data: null,
      validation: {
        valid: false,
        errors: ['Unable to load catalog. Check sheet sharing and API key.'],
      },
    };
  }
}

/**
 * Check if API key is configured
 */
export function isGoogleSheetsConfigured(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY;
  return !!apiKey && apiKey.length > 10;
}

/**
 * Get the API key from environment
 */
export function getApiKey(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY || null;
}
