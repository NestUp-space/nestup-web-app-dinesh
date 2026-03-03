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

// ============================================
// CONFIGURATION
// ============================================

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// Sheet IDs (defaults; overridden by env when set)
export const SHEET_IDS = {
  catalogue: '1A9W8gsjkalw8DHwmkRsh33UnOy5Y0seAUhyDrWNWeKA',
  materialCatalog: '1BJnNmIwG8J07LJGhnWQJ-gJbENSGJ2ArRCxypJAGMto',
};

/** Effective catalogue sheet ID: env override or default */
export function getCatalogueSheetId(): string {
  return process.env.NEXT_PUBLIC_CATALOGUE_SHEET_ID || SHEET_IDS.catalogue;
}

/** Effective material catalog sheet ID: env override or default */
export function getMaterialCatalogSheetId(): string {
  return process.env.NEXT_PUBLIC_MATERIAL_CATALOG_SHEET_ID || SHEET_IDS.materialCatalog;
}

// Sheet ranges
export const SHEET_RANGES = {
  catalogue: 'Sheet1!A:AZ',
  plywood: 'Plywood Library!A:Z',
  laminate: 'Laminate Library!A:Z',
  edgeband: 'Edgeband Library!A:Z',
  hardware: 'Hardware Library!A:Z',
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
      const error = await response.json().catch(() => ({}));
      console.error('[GoogleSheets] API Error:', response.status, response.statusText, error);
      if (response.status === 403) {
        console.error('[GoogleSheets] Tip: Share the sheet as "Anyone with the link can view" and ensure Google Sheets API is enabled.');
      }
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
 * Normalize header for matching (case-insensitive, strip spaces, underscores, slashes)
 */
function normalizeHeader(h: string): string {
  return (h || '').toLowerCase().replace(/[\s_/]/g, '');
}

/**
 * Find column index by header name (case-insensitive, spaces/underscores/slashes ignored)
 */
function findColumnIndex(headers: string[], name: string): number {
  const normalized = normalizeHeader(name);
  return headers.findIndex(h => normalizeHeader(h) === normalized);
}

/**
 * Find column index by trying multiple header names (first match wins)
 */
function findColumnIndexAny(headers: string[], names: string[]): number {
  for (const name of names) {
    const idx = findColumnIndex(headers, name);
    if (idx >= 0) return idx;
  }
  return -1;
}

/**
 * Parse Central Catalogue data into models and boxes with planks.
 * If the first row doesn't look like headers (no "level" or "entity name"), treat row 2 as headers (Formula-based sheets often have a title row).
 */
export function parseCatalogueData(rows: string[][]): {
  models: CatalogModel[];
  boxesWithPlanks: CatalogBoxWithPlanks[];
} {
  if (!rows || rows.length < 2) {
    return { models: [], boxesWithPlanks: [] };
  }

  const firstRow = rows[0].map(h => String(h || '').trim()).join(' ').toLowerCase();
  const hasHeaderInFirstRow = /level|entity\s*name|entityname/.test(firstRow);
  const headerRowIndex = hasHeaderInFirstRow ? 0 : 1;
  const dataStartIndex = headerRowIndex + 1;
  if (rows.length <= dataStartIndex) {
    return { models: [], boxesWithPlanks: [] };
  }

  const headers = rows[headerRowIndex].map(h => String(h || '').trim());

  const cols = {
    entityName: findColumnIndexAny(headers, ['entity name', 'entity_name']),
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
    carcusThickness: findColumnIndexAny(headers, ['carcass_thickness', 'carcus_thickness']),
    doorThickness: findColumnIndex(headers, 'door_thickness'),
    backplankThickness: findColumnIndex(headers, 'backplank_thickness'),
  };

  const models: CatalogModel[] = [];
  const boxesWithPlanks: CatalogBoxWithPlanks[] = [];
  let currentBox: CatalogBoxWithPlanks | null = null;

  for (let i = dataStartIndex; i < rows.length; i++) {
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
  const pick = (idx: number, d: number) => (idx >= 0 ? idx : d);
  const cols = {
    sno: pick(findColumnIndexAny(headers, ['sno', 's.no']), 0),
    brand: pick(findColumnIndex(headers, 'brand'), 1),
    gradeType: pick(findColumnIndexAny(headers, ['grade/type', 'gradetype', 'grade_type', 'type']), 2),
    material: pick(findColumnIndex(headers, 'material'), 3),
    thickness: pick(findColumnIndex(headers, 'thickness'), 4),
    price: pick(findColumnIndexAny(headers, ['price (per sqm)', 'price (per sft)', 'price (per sq ft)', 'price']), 5),
    remarks: pick(findColumnIndex(headers, 'remarks'), 6),
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
 * Parse Laminate Library data
 */
export function parseLaminateLibrary(rows: string[][]): LaminateOption[] {
  if (!rows || rows.length < 2) return [];

  const headers = rows[0].map(h => String(h || '').trim());
  const pick = (idx: number, d: number) => (idx >= 0 ? idx : d);
  const cols = {
    sno: pick(findColumnIndexAny(headers, ['s no', 's no:', 'sno', 's.no']), 0),
    brand: pick(findColumnIndex(headers, 'brand'), 1),
    code: pick(findColumnIndexAny(headers, ['laminate code', 'code', 'colour_code']), 2),
    colour: pick(findColumnIndexAny(headers, ['colour', 'colour_name', 'name']), 3),
    thickness: pick(findColumnIndexAny(headers, ['laminate thickness', 'thickness']), 4),
    photoUrl: pick(findColumnIndexAny(headers, ['laminate photo', 'photourl', 'photo_url', 'photo', 'image']), 5),
    price: pick(findColumnIndexAny(headers, ['laminate price', 'price (per sqm)', 'price (per sft)', 'price']), 6),
    comments: pick(findColumnIndexAny(headers, ['comments', 'remarks']), 7),
  };

  const options: LaminateOption[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const brand = (row[cols.brand] || '').trim();
    const code = (row[cols.code] || '').trim();
    if (!brand && !code) continue;

    const colour = (row[cols.colour] || code).trim();
    let photoUrl = (row[cols.photoUrl] || '').trim();
    let priceValue = (row[cols.price] || '').trim();

    // Sheet often has Drive URL in Price column when Photo is empty (data entry pattern)
    if (!photoUrl && priceValue.includes('drive.google.com')) {
      photoUrl = priceValue;
      priceValue = '0';
    }
    const price = parseFloat(priceValue) || 0;

    options.push({
      id: `lam_${i}`,
      sno: String(row[cols.sno] || i),
      brand,
      code,
      colour,
      thickness: parseFloat(row[cols.thickness] || '0.8') || 0.8,
      photoUrl,
      price,
      comments: (row[cols.comments] || '').trim(),
      displayName: `${brand} ${code} ${colour}`.trim(),
    });
  }
  
  console.log(`[GoogleSheets] Parsed ${options.length} laminate options`);
  return options;
}

/**
 * Convert Google Drive sharing URL to thumbnail URL for reliable display in <img>
 */
export function convertDriveUrl(driveUrl: string): string {
  if (!driveUrl) return '';
  if (driveUrl.includes('/thumbnail?')) return driveUrl;
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
 * Fetch all catalog data from Google Sheets
 */
export async function fetchAllCatalogData(apiKey: string): Promise<CatalogData | null> {
  if (!apiKey) {
    console.error('[GoogleSheets] No API key provided');
    return null;
  }
  
  try {
    const catalogueSheetId = getCatalogueSheetId();
    const materialSheetId = getMaterialCatalogSheetId();
    console.log('[GoogleSheets] Fetching catalog data...', { catalogueSheetId: catalogueSheetId.slice(0, 20) + '...', materialSheetId: materialSheetId.slice(0, 20) + '...' });
    // Fetch catalogue and ALL material catalogs in parallel
    const [catalogueData, plywoodData, laminateData, edgebandData, hardwareData] = await Promise.all([
      fetchSheetData(catalogueSheetId, SHEET_RANGES.catalogue, apiKey),
      fetchSheetData(materialSheetId, SHEET_RANGES.plywood, apiKey),
      fetchSheetData(materialSheetId, SHEET_RANGES.laminate, apiKey),
      fetchSheetData(materialSheetId, SHEET_RANGES.edgeband, apiKey).catch(() => null),
      fetchSheetData(materialSheetId, SHEET_RANGES.hardware, apiKey).catch(() => null),
    ]);
    
    // Parse the data
    const { models, boxesWithPlanks } = catalogueData 
      ? parseCatalogueData(catalogueData) 
      : { models: [], boxesWithPlanks: [] };
    
    const plywoodOptions = plywoodData ? parsePlywoodLibrary(plywoodData) : [];
    const laminateOptions = laminateData ? parseLaminateLibrary(laminateData) : [];
    
    // Log edgeband and hardware for future use
    if (edgebandData) {
      console.log(`[GoogleSheets] Edgeband data: ${edgebandData.length - 1} rows`);
    }
    if (hardwareData) {
      console.log(`[GoogleSheets] Hardware data: ${hardwareData.length - 1} rows`);
    }
    
    // Convert laminate photo URLs
    const laminatesWithImages = laminateOptions.map(lam => ({
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
    
    console.log(`[GoogleSheets] Fetched: ${models.length} models, ${boxesWithPlanks.length} boxes, ${plywoodOptions.length} plywood, ${laminatesWithImages.length} laminates`);
    
    return result;
  } catch (error) {
    console.error('[GoogleSheets] Error fetching catalog data:', error);
    return null;
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
