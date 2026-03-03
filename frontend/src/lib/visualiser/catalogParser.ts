/**
 * catalogParser.ts
 * Port of visualization.js catalog parsing logic
 * Reads Central_Catalogue from Google Sheets (live) or CSV (fallback)
 * 
 * Priority:
 * 1. Google Sheets API (if API key configured)
 * 2. Local CSV files (fallback)
 */

import { CatalogModel, PlywoodOption, LaminateOption } from '@/types/visualiser';
import {
  fetchAllCatalogData,
  isGoogleSheetsConfigured,
  getApiKey,
  convertDriveUrl as convertDriveUrlFromSheets,
} from './googleSheetsService';

// ============================================
// CONFIGURATION - EXACT COPY FROM APPS SCRIPT
// ============================================

export const DESIGNER_CONFIG = {
  catalogueColumns: {
    entityName: 0,      // Column A - Entity Name
    level: 1,           // Column B - level (1=box, 2=plank, 3=hole)
    material: 2,        // Column C - Material
    roomName: 3,        // Column D - Room_Name
    unitLocation: 4,    // Column E - Unit_Location
    boxModel: 5,        // Column F - Box_Model
    boxType: 6,         // Column G - Box_Type
    lenX: 7,            // Column H - LenX (plank width)
    lenY: 8,            // Column I - LenY (plank depth)
    lenZ: 9,            // Column J - LenZ (plank height)
    x: 10,              // Column K - X position
    y: 11,              // Column L - Y position
    z: 12,              // Column M - Z position
    boxWidth: 13,       // Column N - Box_width
    boxDepth: 14,       // Column O - Box_depth
    boxHeight: 15,      // Column P - Box_height
    skirting: 16,       // Column Q - Skriting
    skirtingWidth: 17,  // Column R - skriting_width
    carcusThickness: 18,// Column S - carcass_thickness
    doorThickness: 19,  // Column T - door_thickness
    backplankThickness: 20, // Column U - backplank_thickness
    vbMainPosition: 21,
    vbDoublePosition: 22,
    screwPosition: 23,
    profileDepth: 24,
    profileWidth: 25,
    profileDistance: 26,
    rotZ: 27,
    carcusPly: 28,
    doorPly: 29,
    backPly: 30,
  },

  plywoodColumns: {
    sno: 0,
    brand: 1,
    gradeType: 2,
    material: 3,
    thickness: 4,
    price: 5,
    remarks: 6,
  },

  laminateColumns: {
    sno: 0,        // Column A - S no
    brand: 1,      // Column B - Brand
    code: 2,       // Column C - Laminate code
    colour: 3,     // Column D - Colour
    thickness: 4,  // Column E - Laminate thickness
    price: 5,      // Column F - Laminate Price
    photoUrl: 6,   // Column G - Laminate Photo
    comments: 7,   // Column H - Comments
  },

  coreMaterials: {
    Plywood: '',
    'Block Board': 'BB',
    BB: 'BB',
    MDF: 'MDF',
    HDHMR: 'HDHMR',
  } as Record<string, string>,

  // Editable options for right panel
  editableOptions: [
    { key: 'boxWidth', header: 'box_width', label: 'Box Width', unit: 'mm', type: 'number' },
    { key: 'boxDepth', header: 'box_depth', label: 'Box Depth', unit: 'mm', type: 'number' },
    { key: 'boxHeight', header: 'box_height', label: 'Box Height', unit: 'mm', type: 'number' },
    { key: 'skirting', header: 'Skriting', label: 'Skirting Height', unit: 'mm', type: 'number' },
    { key: 'skirtingWidth', header: 'skriting_width', label: 'Skirting Width', unit: 'mm', type: 'number' },
    { key: 'carcusPly', header: 'carcus_ply', label: 'Carcass Plywood', type: 'material-dropdown', category: 'plywood', thicknessTarget: 'carcusThickness' },
    { key: 'doorPly', header: 'door_ply', label: 'Door Plywood', type: 'material-dropdown', category: 'plywood', thicknessTarget: 'doorThickness' },
    { key: 'backPly', header: 'back_ply', label: 'Back Panel Plywood', type: 'material-dropdown', category: 'plywood', thicknessTarget: 'backplankThickness' },
    { key: 'carcusThickness', header: 'carcus_thickness', label: 'Carcass Thickness', unit: 'mm', type: 'readonly', derivedFrom: 'carcusPly' },
    { key: 'doorThickness', header: 'door_thickness', label: 'Door Thickness', unit: 'mm', type: 'readonly', derivedFrom: 'doorPly' },
    { key: 'backplankThickness', header: 'backplank_thickness', label: 'Back Panel Thickness', unit: 'mm', type: 'readonly', derivedFrom: 'backPly' },
  ],
};

// ============================================
// PLANK TEMPLATE INTERFACE
// ============================================

export interface PlankTemplate {
  entityName: string;
  level: number;
  material: string;
  lenX: number;
  lenY: number;
  lenZ: number;
  x: number;
  y: number;
  z: number;
  rowIndex: number;
  subComponents: SubComponentTemplate[];
}

export interface SubComponentTemplate {
  entityName: string;
  level: number;
  lenX: number;
  lenY: number;
  lenZ: number;
  x: number;
  y: number;
  z: number;
  rowIndex: number;
}

export interface CatalogBoxWithPlanks extends CatalogModel {
  planks: PlankTemplate[];
}

// ============================================
// UTILITY FUNCTIONS - EXACT FROM APPS SCRIPT
// ============================================

export function parseNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !insideQuotes) {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      if (char === '\r') i++;
    } else if (char === '\r' && !insideQuotes) {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

// ============================================
// CATALOGUE PARSING - EXACT FROM APPS SCRIPT
// ============================================

/**
 * Parse the Central_Catalogue CSV and extract all boxes with their planks
 * Replicates getCatalogBoxes() and getBoxFullData() from visualization.js
 */
export function parseCatalogueCsvWithPlanks(csvData: string[][]): CatalogBoxWithPlanks[] {
  const boxes: CatalogBoxWithPlanks[] = [];
  const c = DESIGNER_CONFIG.catalogueColumns;

  let currentBox: CatalogBoxWithPlanks | null = null;
  let currentPlank: PlankTemplate | null = null;

  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i];
    if (!row || row.length === 0) continue;

    const level = parseNumber(row[c.level]);

    if (level === 1) {
      // This is a box (level 1)
      // Save previous box if exists
      if (currentBox) {
        boxes.push(currentBox);
      }

      currentBox = {
        id: `catalog-${i}`, // Must match parseCatalogueCsv ID format
        entityName: row[c.entityName] || `Box ${boxes.length + 1}`,
        level: 1,
        boxModel: row[c.boxModel] || '',
        boxType: row[c.boxType] || '',
        lenX: parseNumber(row[c.boxWidth]),
        lenY: parseNumber(row[c.boxDepth]),
        lenZ: parseNumber(row[c.boxHeight]),
        boxWidth: parseNumber(row[c.boxWidth]),
        boxDepth: parseNumber(row[c.boxDepth]),
        boxHeight: parseNumber(row[c.boxHeight]),
        skirting: parseNumber(row[c.skirting]),
        skirtingWidth: parseNumber(row[c.skirtingWidth]),
        carcusThickness: parseNumber(row[c.carcusThickness]) || 18,
        doorThickness: parseNumber(row[c.doorThickness]) || 18,
        backplankThickness: parseNumber(row[c.backplankThickness]) || 10,
        planks: [],
        plankTemplates: [],
      };
      currentPlank = null;

    } else if (level === 2 && currentBox) {
      // This is a plank (level 2)
      currentPlank = {
        entityName: row[c.entityName] || `Plank ${currentBox.planks.length + 1}`,
        level: 2,
        material: row[c.material] || '',
        lenX: parseNumber(row[c.lenX]),
        lenY: parseNumber(row[c.lenY]),
        lenZ: parseNumber(row[c.lenZ]),
        x: parseNumber(row[c.x]),
        y: parseNumber(row[c.y]),
        z: parseNumber(row[c.z]),
        rowIndex: i + 1,
        subComponents: [],
      };
      currentBox.planks.push(currentPlank);

    } else if (level === 3 && currentPlank) {
      // This is a sub-component (level 3) - holes, grooves, etc.
      const subComponent: SubComponentTemplate = {
        entityName: row[c.entityName] || 'Component',
        level: 3,
        lenX: parseNumber(row[c.lenX]),
        lenY: parseNumber(row[c.lenY]),
        lenZ: parseNumber(row[c.lenZ]),
        x: parseNumber(row[c.x]),
        y: parseNumber(row[c.y]),
        z: parseNumber(row[c.z]),
        rowIndex: i + 1,
      };
      currentPlank.subComponents.push(subComponent);
    }
  }

  // Don't forget the last box
  if (currentBox) {
    boxes.push(currentBox);
  }

  // Comprehensive logging for Level 3 data
  let totalLevel3 = 0;
  boxes.forEach((box, boxIdx) => {
    let boxLevel3 = 0;
    box.planks.forEach((plank) => {
      if (plank.subComponents && plank.subComponents.length > 0) {
        boxLevel3 += plank.subComponents.length;
        console.log(`[CatalogParser] Box "${box.entityName}" > Plank "${plank.entityName}": ${plank.subComponents.length} subComponents`);
        plank.subComponents.forEach((sc, i) => {
          console.log(`    [${i}] ${sc.entityName} at (${sc.x}, ${sc.y}, ${sc.z})`);
        });
      }
    });
    if (boxLevel3 > 0) {
      console.log(`[CatalogParser] Box "${box.entityName}" has ${box.planks.length} planks with ${boxLevel3} total Level 3 components`);
    }
    totalLevel3 += boxLevel3;
  });

  console.log(`[CatalogParser] ====== CATALOG PARSING SUMMARY ======`);
  console.log(`[CatalogParser] Total boxes: ${boxes.length}`);
  console.log(`[CatalogParser] Total planks: ${boxes.reduce((sum, b) => sum + b.planks.length, 0)}`);
  console.log(`[CatalogParser] Total Level 3 subComponents: ${totalLevel3}`);
  console.log(`[CatalogParser] =====================================`);
  
  if (totalLevel3 === 0) {
    console.warn('[CatalogParser] ⚠️ WARNING: No Level 3 data found in catalog! Check CSV format.');
  }

  return boxes;
}

/**
 * Parse simple catalog models (without full plank data)
 * For the catalog panel listing
 */
export function parseCatalogueCsv(csvData: string[][]): CatalogModel[] {
  const c = DESIGNER_CONFIG.catalogueColumns;
  const models: CatalogModel[] = [];

  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i];
    if (!row || row.length === 0) continue;

    const level = parseNumber(row[c.level]);

    if (level === 1) {
      models.push({
        id: `catalog-${i}`,
        entityName: row[c.entityName] || `Box ${models.length + 1}`,
        level: 1,
        boxModel: row[c.boxModel] || '',
        boxType: row[c.boxType] || '',
        lenX: parseNumber(row[c.boxWidth]),
        lenY: parseNumber(row[c.boxDepth]),
        lenZ: parseNumber(row[c.boxHeight]),
        boxWidth: parseNumber(row[c.boxWidth]),
        boxDepth: parseNumber(row[c.boxDepth]),
        boxHeight: parseNumber(row[c.boxHeight]),
        skirting: parseNumber(row[c.skirting]),
        skirtingWidth: parseNumber(row[c.skirtingWidth]),
        carcusThickness: parseNumber(row[c.carcusThickness]) || 18,
        doorThickness: parseNumber(row[c.doorThickness]) || 18,
        backplankThickness: parseNumber(row[c.backplankThickness]) || 10,
      });
    }
  }

  return models;
}

// ============================================
// PLYWOOD LIBRARY PARSING
// ============================================

export function parsePlywoodLibraryCsv(csvData: string[][]): PlywoodOption[] {
  const c = DESIGNER_CONFIG.plywoodColumns;
  const options: PlywoodOption[] = [];

  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i];
    if (!row || row.length === 0) continue;

    const sno = row[c.sno];
    if (!sno) continue;

    const brand = row[c.brand] || '';
    const gradeType = row[c.gradeType] || '';
    const material = row[c.material] || '';
    const thickness = parseNumber(row[c.thickness]);
    const price = parseNumber(row[c.price]);

    // Create display name (matches Apps Script format)
    const displayName = `${brand} ${gradeType} ${material} ${thickness}mm`.trim();

    options.push({
      id: `ply-${i}`,
      sno: String(sno),
      brand,
      gradeType,
      material,
      thickness,
      price,
      displayName,
      remarks: row[c.remarks] || '',
    });
  }

  return options;
}

// ============================================
// LAMINATE LIBRARY PARSING
// ============================================

export function parseLaminateLibraryCsv(csvData: string[][]): LaminateOption[] {
  if (!csvData || csvData.length < 2) {
    console.warn('[CatalogParser] No laminate data to parse');
    return [];
  }

  // Dynamic column detection from header row
  const headers = csvData[0].map(h => (h || '').toLowerCase().replace(/[:\s_]/g, ''));
  
  const findCol = (names: string[]): number => {
    for (const name of names) {
      const idx = headers.findIndex(h => h.includes(name.toLowerCase().replace(/[:\s_]/g, '')));
      if (idx >= 0) return idx;
    }
    return -1;
  };
  
  // Find column indices dynamically
  const cols = {
    sno: findCol(['sno', 's.no', 'slno', 'serial']) >= 0 ? findCol(['sno', 's.no', 'slno', 'serial']) : 0,
    brand: findCol(['brand']) >= 0 ? findCol(['brand']) : 1,
    code: findCol(['laminatecode', 'code', 'colourcode']) >= 0 ? findCol(['laminatecode', 'code', 'colourcode']) : 2,
    colour: findCol(['colour', 'color', 'name']) >= 0 ? findCol(['colour', 'color', 'name']) : 3,
    thickness: findCol(['thickness', 'laminatethickness']) >= 0 ? findCol(['thickness', 'laminatethickness']) : 4,
    price: findCol(['price', 'laminateprice']) >= 0 ? findCol(['price', 'laminateprice']) : 5,
    photoUrl: findCol(['photo', 'photourl', 'laminatephoto', 'image']) >= 0 ? findCol(['photo', 'photourl', 'laminatephoto', 'image']) : 6,
    comments: findCol(['comment', 'comments', 'remarks']) >= 0 ? findCol(['comment', 'comments', 'remarks']) : 7,
  };
  
  console.log('[CatalogParser] Laminate column mapping:', cols);
  
  const options: LaminateOption[] = [];

  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i];
    if (!row || row.length === 0) continue;

    const sno = row[cols.sno];
    // Include ALL laminates - use row index if sno is missing
    const actualSno = sno || String(i);

    const brand = (row[cols.brand] || '').trim();
    const code = (row[cols.code] || '').trim();
    const colour = (row[cols.colour] || '').trim();
    const thickness = parseNumber(row[cols.thickness]) || 2; // Default thickness 2mm
    
    // Handle potential data entry errors where URL might be in price column
    let priceValue = (row[cols.price] || '').trim();
    let photoUrl = (row[cols.photoUrl] || '').trim();
    
    // Check if price column contains a Google Drive URL (data entry error)
    if (priceValue && priceValue.includes('drive.google.com')) {
      // URL was placed in price column by mistake, use it as photo
      if (!photoUrl) {
        photoUrl = priceValue;
      }
      priceValue = '0';
    }
    
    const price = parseNumber(priceValue);

    // Convert Google Drive URL to thumbnail URL for display
    if (photoUrl && photoUrl.includes('drive.google.com')) {
      photoUrl = localConvertDriveUrl(photoUrl);
    }

    // Skip only if BOTH brand and code are empty (completely invalid row)
    if (!brand && !code && !colour) continue;

    const displayName = code && colour 
      ? `${code} - ${colour}`.trim()
      : code || colour || `${brand} Laminate`;

    options.push({
      id: `lam-${i}`,
      sno: actualSno,
      brand,
      code,
      colour,
      thickness,
      price,
      photoUrl,
      displayName,
      comments: (row[cols.comments] || '').trim(),
    });
  }

  console.log(`[CatalogParser] Parsed ${options.length} laminates from CSV (from ${csvData.length - 1} data rows)`);
  return options;
}

/**
 * Convert Google Drive sharing URL to direct thumbnail URL
 * Handles multiple URL formats from Google Drive
 * 
 * @param url - Google Drive URL (sharing, file, or open format)
 * @returns Direct thumbnail URL for image display
 */
export function localConvertDriveUrl(url: string): string {
  if (!url) return '';
  
  // Already converted - return as-is
  if (url.includes('/thumbnail?') || url.includes('uc?export=view')) {
    return url;
  }

  // Extract file ID from various Google Drive URL formats
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,           // https://drive.google.com/file/d/FILE_ID/view
    /[?&]id=([a-zA-Z0-9_-]+)/,               // https://drive.google.com/open?id=FILE_ID
    /\/d\/([a-zA-Z0-9_-]+)/,                 // https://drive.google.com/d/FILE_ID
    /googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/, // lh3.googleusercontent.com format
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Use thumbnail API with good quality size
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
    }
  }

  // Fallback: Try to extract any file ID-like string (25+ chars)
  const fileIdMatch = url.match(/[-\w]{25,}/);
  if (fileIdMatch) {
    return `https://drive.google.com/thumbnail?id=${fileIdMatch[0]}&sz=w400`;
  }

  return url;
}

// ============================================
// LOAD FROM GOOGLE SHEETS OR CSV (FALLBACK)
// ============================================

/**
 * Load catalog data - tries Google Sheets first, then falls back to CSV
 */
export async function loadCatalogFromSampleData(): Promise<{
  models: CatalogModel[];
  catalogBoxesWithPlanks: CatalogBoxWithPlanks[];
  plywoodOptions: PlywoodOption[];
  laminateOptions: LaminateOption[];
  source: 'google-sheets' | 'csv';
}> {
  // Try Google Sheets first if configured
  if (!isGoogleSheetsConfigured()) {
    console.log('[CatalogParser] Google Sheets not configured (set NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY in .env.local and restart dev server). Using CSV.');
  } else {
    const apiKey = getApiKey();
    if (apiKey) {
      console.log('[CatalogParser] Attempting to load from Google Sheets (NEXT_PUBLIC_CATALOGUE_SHEET_ID used if set)...');
      const sheetsData = await fetchAllCatalogData(apiKey);
      
      if (sheetsData && sheetsData.models.length > 0) {
        console.log(`[CatalogParser] Loaded from Google Sheets: ${sheetsData.models.length} models`);
        return {
          models: sheetsData.models,
          catalogBoxesWithPlanks: sheetsData.catalogBoxesWithPlanks,
          plywoodOptions: sheetsData.plywoodOptions,
          laminateOptions: sheetsData.laminateOptions,
          source: 'google-sheets',
        };
      }
      console.warn('[CatalogParser] Google Sheets returned no data or fetch failed. Check: sheet shared as "Anyone with the link can view", API key valid, sheet tab named Sheet1. Falling back to CSV.');
    }
  }

  // Fallback to CSV files
  console.log('[CatalogParser] Loading from local CSV files (81 boxes from sample data)...');
  return loadCatalogFromCsv();
}

/**
 * Load catalog data from local CSV files only
 */
export async function loadCatalogFromCsv(): Promise<{
  models: CatalogModel[];
  catalogBoxesWithPlanks: CatalogBoxWithPlanks[];
  plywoodOptions: PlywoodOption[];
  laminateOptions: LaminateOption[];
  source: 'csv';
}> {
  const results = {
    models: [] as CatalogModel[],
    catalogBoxesWithPlanks: [] as CatalogBoxWithPlanks[],
    plywoodOptions: [] as PlywoodOption[],
    laminateOptions: [] as LaminateOption[],
    source: 'csv' as const,
  };

  try {
    // Load Central Catalogue
    const catalogResponse = await fetch('/sample_data/Central Catalogue - Sheet1.csv');
    if (catalogResponse.ok) {
      const catalogText = await catalogResponse.text();
      const catalogData = parseCSV(catalogText);
      
      // Debug: Show first few rows of parsed CSV
      console.log(`[CatalogParser] CSV parsed: ${catalogData.length} rows`);
      console.log(`[CatalogParser] First 3 rows:`, catalogData.slice(0, 3));
      
      // Count levels in raw CSV
      let level1 = 0, level2 = 0, level3 = 0;
      const c = DESIGNER_CONFIG.catalogueColumns;
      for (let i = 1; i < catalogData.length; i++) {
        const row = catalogData[i];
        if (!row || row.length === 0) continue;
        const level = parseNumber(row[c.level]);
        if (level === 1) level1++;
        else if (level === 2) level2++;
        else if (level === 3) level3++;
      }
      console.log(`[CatalogParser] CSV Level counts - L1 (boxes): ${level1}, L2 (planks): ${level2}, L3 (operations): ${level3}`);
      
      results.models = parseCatalogueCsv(catalogData);
      results.catalogBoxesWithPlanks = parseCatalogueCsvWithPlanks(catalogData);
      console.log(`[CatalogParser] Loaded ${results.models.length} models, ${results.catalogBoxesWithPlanks.length} boxes with planks from CSV`);
    } else {
      console.error(`[CatalogParser] Failed to load catalog CSV: ${catalogResponse.status}`);
    }

    // Load Plywood Library
    const plywoodResponse = await fetch('/sample_data/_Central Material Catlouge - Plywood Library.csv');
    if (plywoodResponse.ok) {
      const plywoodText = await plywoodResponse.text();
      const plywoodData = parseCSV(plywoodText);
      results.plywoodOptions = parsePlywoodLibraryCsv(plywoodData);
      console.log(`[CatalogParser] Loaded ${results.plywoodOptions.length} plywood options from CSV`);
    }

    // Load Laminate Library - try multiple file paths
    const laminatePaths = [
      '/sample_data/_Central Material Catlouge - Laminate Library.csv',
      '/sample_data/Laminate Library.csv',
    ];
    
    for (const path of laminatePaths) {
      try {
        const laminateResponse = await fetch(path);
        if (laminateResponse.ok) {
          const laminateText = await laminateResponse.text();
          const laminateData = parseCSV(laminateText);
          results.laminateOptions = parseLaminateLibraryCsv(laminateData);
          console.log(`[CatalogParser] Loaded ${results.laminateOptions.length} laminate options from CSV: ${path}`);
          break; // Stop after first successful load
        }
      } catch (e) {
        console.debug(`[CatalogParser] Could not load laminate from ${path}`);
      }
    }
    
    if (results.laminateOptions.length === 0) {
      console.warn('[CatalogParser] No laminate CSV found in any expected location');
    }
  } catch (error) {
    console.error('[CatalogParser] Error loading catalog data from CSV:', error);
  }

  return results;
}

/**
 * Force refresh from Google Sheets (bypasses cache)
 */
export async function refreshCatalogFromGoogleSheets(): Promise<{
  models: CatalogModel[];
  catalogBoxesWithPlanks: CatalogBoxWithPlanks[];
  plywoodOptions: PlywoodOption[];
  laminateOptions: LaminateOption[];
} | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('[CatalogParser] No API key configured for Google Sheets');
    return null;
  }
  
  console.log('[CatalogParser] Refreshing catalog from Google Sheets...');
  const sheetsData = await fetchAllCatalogData(apiKey);
  
  if (sheetsData) {
    console.log(`[CatalogParser] Refreshed: ${sheetsData.models.length} models from Google Sheets`);
    return {
      models: sheetsData.models,
      catalogBoxesWithPlanks: sheetsData.catalogBoxesWithPlanks,
      plywoodOptions: sheetsData.plywoodOptions,
      laminateOptions: sheetsData.laminateOptions,
    };
  }
  
  return null;
}

// Re-export for convenience
export { isGoogleSheetsConfigured, getApiKey } from './googleSheetsService';
export { convertDriveUrl } from './googleSheetsService';

// ============================================
// OPERATION TYPE DETECTION (from Apps Script formatting code.js)
// ============================================

/**
 * Operation patterns for detecting Level 3 component types
 * Exactly matches the patterns from formatting code.js detectOperationType()
 */
const OPERATION_PATTERNS: Record<string, RegExp> = {
  vb_main: /vb main|vb_main|vbm|main_vb/i,
  vb_double: /vb double|vb_double|vbd|double_vb/i,
  hinges: /hinge|hing/i,
  screws: /screw|bolt|pta/i,
  // Gola profile triplet subtypes - MUST be checked BEFORE generic profile pattern
  gola_profile_start: /gola_profile_start|golaprofile_start|gola_start/i,
  gola_profile_center: /gola_profile_center|golaprofile_center|gola_center/i,
  gola_profile_end: /gola_profile_end|golaprofile_end|gola_end/i,
  // Generic profile/slot/groove (after Gola check)
  profiles: /profile/i,
  slots: /slot/i,
  grooves: /groove/i,
  // L-cut triplet subtypes (new architecture)
  // Support both American (center) and British (centre) spellings
  l_cut_start: /l_cut_start|lcut_start/i,
  l_cut_center: /l_cut_center|l_cut_centre|lcut_center|lcut_centre/i,
  l_cut_end: /l_cut_end|lcut_end/i,
  // Legacy L-cut fallback
  l_cutting_legacy: /l_cutting|lcutting|l_groove/i,
  // Hole (generic)
  holes: /hole|drilled|bore/i,
};

/**
 * Detect operation type from entity name
 * Matches AppScript's detectOperationType()
 */
export function detectOperationType(entityName: string): string {
  const name = (entityName || '').toLowerCase();
  
  // Check patterns in order (Gola before profile, L-cut triplets before legacy)
  if (OPERATION_PATTERNS.vb_main.test(name)) return 'vb_main';
  if (OPERATION_PATTERNS.vb_double.test(name)) return 'vb_double';
  if (OPERATION_PATTERNS.hinges.test(name)) return 'hinges';
  if (OPERATION_PATTERNS.screws.test(name)) return 'screws';
  
  // Gola profile triplet subtypes (before generic profile)
  if (OPERATION_PATTERNS.gola_profile_start.test(name)) return 'gola_profile_start';
  if (OPERATION_PATTERNS.gola_profile_center.test(name)) return 'gola_profile_center';
  if (OPERATION_PATTERNS.gola_profile_end.test(name)) return 'gola_profile_end';
  
  // Generic groove types
  if (OPERATION_PATTERNS.profiles.test(name)) return 'profiles';
  if (OPERATION_PATTERNS.slots.test(name)) return 'slots';
  if (OPERATION_PATTERNS.grooves.test(name)) return 'grooves';
  
  // L-cut triplet subtypes
  if (OPERATION_PATTERNS.l_cut_start.test(name)) return 'l_cut_start';
  if (OPERATION_PATTERNS.l_cut_center.test(name)) return 'l_cut_center';
  if (OPERATION_PATTERNS.l_cut_end.test(name)) return 'l_cut_end';
  if (OPERATION_PATTERNS.l_cutting_legacy.test(name)) return 'l_cutting_legacy';
  
  // Hole as default for Level 3 items
  if (OPERATION_PATTERNS.holes.test(name)) return 'holes';
  
  return 'holes'; // Default to hole if nothing else matches
}

/**
 * Transform SubComponentTemplate[] to PlankOperations
 * This function takes Level 3 catalog data and converts it to the operations structure
 * used by the designer store and downstream processing.
 * 
 * @param subComponents Array of Level 3 sub-component templates from catalog
 * @returns PlankOperations object with categorized operations
 */
export function transformSubComponentsToOperations(
  subComponents: SubComponentTemplate[]
): import('@/types/visualiser').PlankOperations {
  const operations: import('@/types/visualiser').PlankOperations = {
    screws: [],
    hinges: [],
    vb_main: [],
    vb_double: [],
    slots: [],
    grooves: [],
    profiles: [],
    l_cuts: [],
  };
  
  if (!subComponents || subComponents.length === 0) {
    console.log('[Transform] No subComponents provided');
    return operations;
  }
  
  console.log(`[Transform] Processing ${subComponents.length} subComponents...`);
  
  // Collectors for L-cut and Gola profile triplets
  const lCutCollector: { starts: Array<{x: number; y: number}>; centers: Array<{x: number; y: number}>; ends: Array<{x: number; y: number}> } = {
    starts: [],
    centers: [],
    ends: [],
  };
  
  const golaCollector: { starts: Array<{x: number; y: number}>; centers: Array<{x: number; y: number}>; ends: Array<{x: number; y: number}> } = {
    starts: [],
    centers: [],
    ends: [],
  };
  
  for (const sub of subComponents) {
    const opType = detectOperationType(sub.entityName);
    console.log(`[Transform] SubComponent "${sub.entityName}" -> detected type: "${opType}" at (${sub.x}, ${sub.y}, ${sub.z})`);
    
    switch (opType) {
      case 'screws':
        operations.screws!.push({
          x: sub.x,
          y: sub.y,
          z: sub.z,
          diameter: sub.lenX, // Diameter is typically in lenX for holes
        });
        break;
        
      case 'hinges':
        operations.hinges!.push({
          x: sub.x,
          y: sub.y,
          z: sub.z,
          diameter: sub.lenX,
        });
        break;
        
      case 'vb_main':
        operations.vb_main!.push({
          x: sub.x,
          y: sub.y,
          z: sub.z,
          diameter: sub.lenX,
        });
        break;
        
      case 'vb_double':
        operations.vb_double!.push({
          x: sub.x,
          y: sub.y,
          z: sub.z,
          diameter: sub.lenX,
        });
        break;
        
      case 'slots':
        operations.slots!.push({
          x: sub.x,
          y: sub.y,
          z: sub.z,
          length: sub.lenX,
          width: sub.lenY,
          depth: sub.lenZ,
          type: 'slot',
        });
        break;
        
      case 'grooves':
        operations.grooves!.push({
          x: sub.x,
          y: sub.y,
          z: sub.z,
          length: sub.lenX,
          width: sub.lenY,
          depth: sub.lenZ,
          type: 'groove',
        });
        break;
        
      case 'profiles':
        operations.profiles!.push({
          x: sub.x,
          y: sub.y,
          z: sub.z,
          length: sub.lenX,
          width: sub.lenY,
          depth: sub.lenZ,
          type: 'profile',
        });
        break;
        
      case 'l_cut_start':
        lCutCollector.starts.push({ x: sub.x, y: sub.y });
        break;
        
      case 'l_cut_center':
        lCutCollector.centers.push({ x: sub.x, y: sub.y });
        break;
        
      case 'l_cut_end':
        lCutCollector.ends.push({ x: sub.x, y: sub.y });
        break;
        
      case 'l_cutting_legacy':
        // Legacy L-cut: treat as single point L-cut (old format)
        operations.l_cuts!.push({
          start: { x: sub.x, y: sub.y, z: sub.z },
          center: { x: sub.x, y: sub.y, z: sub.z },
          end: { x: sub.x + sub.lenX, y: sub.y + sub.lenY, z: sub.z },
          legacy: true,
          x: sub.x,
          y: sub.y,
        });
        break;
        
      case 'gola_profile_start':
        golaCollector.starts.push({ x: sub.x, y: sub.y });
        break;
        
      case 'gola_profile_center':
        golaCollector.centers.push({ x: sub.x, y: sub.y });
        break;
        
      case 'gola_profile_end':
        golaCollector.ends.push({ x: sub.x, y: sub.y });
        break;
        
      case 'holes':
      default:
        // Generic hole - add to screws array (could also create a separate holes array)
        operations.screws!.push({
          x: sub.x,
          y: sub.y,
          z: sub.z,
          diameter: sub.lenX,
        });
        break;
    }
  }
  
  // Assemble L-cut triplets
  const numLCutTriplets = Math.min(
    lCutCollector.starts.length,
    lCutCollector.centers.length,
    lCutCollector.ends.length
  );
  
  for (let i = 0; i < numLCutTriplets; i++) {
    operations.l_cuts!.push({
      start: { x: lCutCollector.starts[i].x, y: lCutCollector.starts[i].y, z: 0 },
      center: { x: lCutCollector.centers[i].x, y: lCutCollector.centers[i].y, z: 0 },
      end: { x: lCutCollector.ends[i].x, y: lCutCollector.ends[i].y, z: 0 },
    });
  }
  
  // Assemble Gola profile triplets (also stored as l_cuts with special handling)
  const numGolaTriplets = Math.min(
    golaCollector.starts.length,
    golaCollector.centers.length,
    golaCollector.ends.length
  );
  
  for (let i = 0; i < numGolaTriplets; i++) {
    // Store Gola profiles in profiles array as groove operations
    operations.profiles!.push({
      x: golaCollector.starts[i].x,
      y: golaCollector.starts[i].y,
      z: 0,
      length: Math.abs(golaCollector.ends[i].x - golaCollector.starts[i].x),
      width: Math.abs(golaCollector.ends[i].y - golaCollector.starts[i].y),
      depth: 10, // Default gola profile depth
      type: 'profile',
    });
  }
  
  return operations;
}

// ============================================
// MATERIAL COLOR MAPPING (from Apps Script)
// ============================================

export function getMaterialColor(entityName: string, material?: string): string {
  const name = entityName.toLowerCase();
  
  // Plank types
  if (name.includes('left') || name.includes('right')) return '#D4A574';  // Side panels - wood color
  if (name.includes('top')) return '#C9B896';
  if (name.includes('bottom')) return '#C9B896';
  if (name.includes('back')) return '#A08060';  // Back panel - darker
  if (name.includes('shelf')) return '#DEB887';
  if (name.includes('door')) return '#8B7355';  // Door - darker wood
  if (name.includes('skirting') || name.includes('skriting')) return '#C9A066';
  
  // Default wood color
  return '#D4A574';
}
