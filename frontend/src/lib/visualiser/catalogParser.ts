/**
 * Catalog Parser
 * Parses CSV catalog files into BoxTemplates and PlankTemplates
 * 
 * Expected CSV format:
 * - Level 0 = Wall/Section (ignored for templates)
 * - Level 1 = Box (cabinet unit)
 * - Level 2 = Plank (panel)
 * - Level 3 = Sub-component (hole, hardware)
 */

import type { 
  Catalog, 
  BoxTemplate, 
  PlankTemplate, 
  CatalogColumnConfig,
  PlankRole,
} from '@/types/visualiser';
import { detectPlankRole } from './formulaEngine';

// ============================================
// Types
// ============================================

interface ParsedRow {
  level: number;
  entityName: string;
  boxModel?: string;
  boxType?: string;
  lenX: string;
  lenY: string;
  lenZ: string;
  posX: string;
  posY: string;
  posZ: string;
  boxWidth?: string;
  boxDepth?: string;
  boxHeight?: string;
  skirtingHeight?: string;
  material?: string;
  grainDirection?: string;
  rowIndex: number;
}

interface ParseResult {
  success: boolean;
  catalog?: Catalog;
  boxTemplates?: BoxTemplate[];
  errors?: string[];
  warnings?: string[];
}

// ============================================
// CSV Parsing Utilities
// ============================================

/**
 * Parses CSV text into rows and columns
 */
function parseCSVText(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentCell += '"';
          i++;
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
        if (char === '\r') i++;
      } else if (char !== '\r') {
        currentCell += char;
      }
    }
  }
  
  // Add last row if not empty
  currentRow.push(currentCell.trim());
  if (currentRow.some(cell => cell !== '')) {
    rows.push(currentRow);
  }
  
  return rows;
}

/**
 * Finds column index by checking multiple possible names
 */
function findColumnIndex(headers: string[], names: string[]): number {
  const normalized = headers.map(h => 
    h.toLowerCase().trim().replace(/[\s_-]+/g, '')
  );
  
  for (const name of names) {
    const searchName = name.toLowerCase().replace(/[\s_-]+/g, '');
    const index = normalized.findIndex(h => 
      h === searchName || h.includes(searchName)
    );
    if (index !== -1) return index;
  }
  
  return -1;
}

/**
 * Auto-detects column positions from headers
 */
function detectColumnConfig(headers: string[]): CatalogColumnConfig {
  return {
    entityName: findColumnIndex(headers, ['entityname', 'entity', 'name', 'partname', 'plankname']),
    level: findColumnIndex(headers, ['level', 'lvl', 'hierarchy']),
    boxModel: findColumnIndex(headers, ['boxmodel', 'model', 'modelcode', 'cabinetmodel']),
    boxType: findColumnIndex(headers, ['boxtype', 'type', 'cabinettype', 'unittype']),
    lenX: findColumnIndex(headers, ['lenx', 'length', 'width', 'w', 'dimx']),
    lenY: findColumnIndex(headers, ['leny', 'depth', 'd', 'dimy']),
    lenZ: findColumnIndex(headers, ['lenz', 'height', 'h', 'dimz', 'thickness']),
    posX: findColumnIndex(headers, ['posx', 'x', 'positionx', 'locationx']),
    posY: findColumnIndex(headers, ['posy', 'y', 'positiony', 'locationy']),
    posZ: findColumnIndex(headers, ['posz', 'z', 'positionz', 'locationz']),
    boxWidth: findColumnIndex(headers, ['boxwidth', 'box_width', 'cabinetwidth']),
    boxDepth: findColumnIndex(headers, ['boxdepth', 'box_depth', 'cabinetdepth']),
    boxHeight: findColumnIndex(headers, ['boxheight', 'box_height', 'cabinetheight']),
    skirtingHeight: findColumnIndex(headers, ['skirting', 'skirtingheight', 'skirting_height', 'plinth']),
    material: findColumnIndex(headers, ['material', 'mat', 'materialname']),
    grainDirection: findColumnIndex(headers, ['grain', 'graindirection', 'direction']),
  };
}

/**
 * Gets value from row by column index
 */
function getValue(row: string[], index: number, defaultValue: string = ''): string {
  if (index < 0 || index >= row.length) return defaultValue;
  return row[index]?.trim() || defaultValue;
}

/**
 * Parses row into structured data
 */
function parseRow(row: string[], config: CatalogColumnConfig, rowIndex: number): ParsedRow | null {
  const levelStr = getValue(row, config.level);
  const level = parseFloat(levelStr);
  
  // Skip rows without valid level
  if (isNaN(level)) return null;
  
  return {
    level,
    entityName: getValue(row, config.entityName, `Item_${rowIndex}`),
    boxModel: getValue(row, config.boxModel),
    boxType: getValue(row, config.boxType),
    lenX: getValue(row, config.lenX),
    lenY: getValue(row, config.lenY),
    lenZ: getValue(row, config.lenZ),
    posX: getValue(row, config.posX, '0'),
    posY: getValue(row, config.posY, '0'),
    posZ: getValue(row, config.posZ, '0'),
    boxWidth: getValue(row, config.boxWidth),
    boxDepth: getValue(row, config.boxDepth),
    boxHeight: getValue(row, config.boxHeight),
    skirtingHeight: getValue(row, config.skirtingHeight, '100'),
    material: getValue(row, config.material),
    grainDirection: getValue(row, config.grainDirection, 'N'),
    rowIndex,
  };
}

/**
 * Converts a value to a formula if it starts with = or contains variables
 */
function toFormula(value: string): string {
  if (!value) return '0';
  
  // Already a formula
  if (value.startsWith('=')) return value;
  
  // Check if it's a pure number
  const num = parseFloat(value);
  if (!isNaN(num)) return String(num);
  
  // Contains variable references - make it a formula
  const hasVariables = /[a-zA-Z_]/.test(value);
  if (hasVariables) {
    return `=${value}`;
  }
  
  return value;
}

// ============================================
// Main Parser
// ============================================

/**
 * Parses a CSV file into a catalog with box templates
 */
export async function parseCatalogCSV(
  file: File,
  catalogName?: string
): Promise<ParseResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Read file
    const text = await file.text();
    const rows = parseCSVText(text);
    
    if (rows.length < 2) {
      return { 
        success: false, 
        errors: ['CSV file is empty or has no data rows'] 
      };
    }
    
    // Get headers and detect columns
    const headers = rows[0];
    const config = detectColumnConfig(headers);
    
    // Validate required columns
    if (config.entityName === -1) {
      errors.push('Could not find entity name column');
    }
    if (config.level === -1) {
      errors.push('Could not find level column');
    }
    
    if (errors.length > 0) {
      return { success: false, errors };
    }
    
    // Parse rows
    const boxTemplates: BoxTemplate[] = [];
    let currentBox: BoxTemplate | null = null;
    let plankSortOrder = 0;
    
    for (let i = 1; i < rows.length; i++) {
      const parsed = parseRow(rows[i], config, i);
      if (!parsed) continue;
      
      if (parsed.level === 1) {
        // New box template
        if (currentBox) {
          boxTemplates.push(currentBox);
        }
        
        plankSortOrder = 0;
        currentBox = {
          id: `template-${Date.now()}-${boxTemplates.length}`,
          catalogId: '',
          entityName: parsed.entityName,
          boxModel: parsed.boxModel,
          boxType: parsed.boxType,
          defaultWidth: parseFloat(parsed.boxWidth || '600') || 600,
          defaultDepth: parseFloat(parsed.boxDepth || '550') || 550,
          defaultHeight: parseFloat(parsed.boxHeight || '800') || 800,
          defaultSkirtingHeight: parseFloat(parsed.skirtingHeight || '100') || 100,
          plankTemplates: [],
        };
        
      } else if (parsed.level === 2 && currentBox) {
        // Plank template
        const plankTemplate: PlankTemplate = {
          id: `plank-template-${Date.now()}-${plankSortOrder}`,
          entityName: parsed.entityName,
          plankRole: detectPlankRole(parsed.entityName),
          sortOrder: plankSortOrder++,
          lenXFormula: toFormula(parsed.lenX),
          lenYFormula: toFormula(parsed.lenY),
          lenZFormula: toFormula(parsed.lenZ),
          posXFormula: toFormula(parsed.posX),
          posYFormula: toFormula(parsed.posY),
          posZFormula: toFormula(parsed.posZ),
          defaultMaterial: parsed.material,
        };
        
        currentBox.plankTemplates.push(plankTemplate);
        
      } else if (parsed.level === 3 && currentBox && currentBox.plankTemplates.length > 0) {
        // Sub-component - attach to last plank
        const lastPlank = currentBox.plankTemplates[currentBox.plankTemplates.length - 1];
        if (!lastPlank.subComponents) {
          lastPlank.subComponents = [];
        }
        
        lastPlank.subComponents.push({
          id: `sub-${Date.now()}-${lastPlank.subComponents.length}`,
          entityName: parsed.entityName,
          type: 'hole', // Default, could be detected from name
          posXFormula: toFormula(parsed.posX),
          posYFormula: toFormula(parsed.posY),
          posZFormula: toFormula(parsed.posZ),
        });
      }
    }
    
    // Add last box
    if (currentBox) {
      boxTemplates.push(currentBox);
    }
    
    // Validate results
    if (boxTemplates.length === 0) {
      return {
        success: false,
        errors: ['No box templates found in CSV'],
      };
    }
    
    // Count planks for warning
    const totalPlanks = boxTemplates.reduce(
      (sum, box) => sum + box.plankTemplates.length, 
      0
    );
    
    if (totalPlanks === 0) {
      warnings.push('No plank templates found - boxes may be empty');
    }
    
    // Create catalog
    const catalog: Catalog = {
      id: `catalog-${Date.now()}`,
      name: catalogName || file.name.replace(/\.[^.]+$/, ''),
      description: `Imported from ${file.name}`,
      version: '1.0',
      isDefault: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      columnConfig: config,
      boxTemplates: boxTemplates.map(bt => ({ ...bt, catalogId: `catalog-${Date.now()}` })),
    };
    
    return {
      success: true,
      catalog,
      boxTemplates,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
    
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Creates a demo catalog with standard cabinet templates
 */
export function createDemoCatalog(): Catalog {
  const baseUnitTemplate: BoxTemplate = {
    id: 'demo-base-unit-600',
    catalogId: 'demo-catalog',
    entityName: 'Base Unit 600',
    boxModel: 'BU-600',
    boxType: 'base_unit',
    defaultWidth: 600,
    defaultDepth: 550,
    defaultHeight: 800,
    defaultSkirtingHeight: 100,
    plankTemplates: [
      {
        id: 'bu600-left',
        entityName: 'Left Side',
        plankRole: 'left',
        sortOrder: 0,
        lenXFormula: '=carcassThickness',
        lenYFormula: '=boxDepth - backplankThickness',
        lenZFormula: '=boxHeight - skirtingHeight',
        posXFormula: '=0',
        posYFormula: '=0',
        posZFormula: '=skirtingHeight',
        defaultColor: '#E8E8E8',
      },
      {
        id: 'bu600-right',
        entityName: 'Right Side',
        plankRole: 'right',
        sortOrder: 1,
        lenXFormula: '=carcassThickness',
        lenYFormula: '=boxDepth - backplankThickness',
        lenZFormula: '=boxHeight - skirtingHeight',
        posXFormula: '=boxWidth - carcassThickness',
        posYFormula: '=0',
        posZFormula: '=skirtingHeight',
        defaultColor: '#E8E8E8',
      },
      {
        id: 'bu600-bottom',
        entityName: 'Bottom',
        plankRole: 'bottom',
        sortOrder: 2,
        lenXFormula: '=boxWidth - 2*carcassThickness',
        lenYFormula: '=boxDepth - backplankThickness',
        lenZFormula: '=carcassThickness',
        posXFormula: '=carcassThickness',
        posYFormula: '=0',
        posZFormula: '=skirtingHeight',
        defaultColor: '#D8D8D8',
      },
      {
        id: 'bu600-back',
        entityName: 'Back Panel',
        plankRole: 'back',
        sortOrder: 3,
        lenXFormula: '=boxWidth - 2*carcassThickness + 12',
        lenYFormula: '=backplankThickness',
        lenZFormula: '=boxHeight - skirtingHeight - carcassThickness - 6',
        posXFormula: '=carcassThickness - 6',
        posYFormula: '=boxDepth - backplankThickness',
        posZFormula: '=skirtingHeight + carcassThickness',
        defaultColor: '#C0C0C0',
      },
      {
        id: 'bu600-shelf',
        entityName: 'Shelf',
        plankRole: 'shelf',
        sortOrder: 4,
        lenXFormula: '=boxWidth - 2*carcassThickness - 6',
        lenYFormula: '=boxDepth - backplankThickness - 20',
        lenZFormula: '=carcassThickness',
        posXFormula: '=carcassThickness + 3',
        posYFormula: '=10',
        posZFormula: '=skirtingHeight + (boxHeight - skirtingHeight) * 0.5',
        defaultColor: '#D8D8D8',
      },
      {
        id: 'bu600-door',
        entityName: 'Door',
        plankRole: 'door',
        sortOrder: 5,
        lenXFormula: '=boxWidth - 3',
        lenYFormula: '=doorThickness',
        lenZFormula: '=boxHeight - skirtingHeight - 3',
        posXFormula: '=1.5',
        posYFormula: '=-doorThickness',
        posZFormula: '=skirtingHeight + 1.5',
        defaultColor: '#F5F5DC',
      },
    ],
  };

  const wallUnitTemplate: BoxTemplate = {
    id: 'demo-wall-unit-600',
    catalogId: 'demo-catalog',
    entityName: 'Wall Unit 600',
    boxModel: 'WU-600',
    boxType: 'wall_unit',
    defaultWidth: 600,
    defaultDepth: 350,
    defaultHeight: 700,
    defaultSkirtingHeight: 0,
    plankTemplates: [
      {
        id: 'wu600-left',
        entityName: 'Left Side',
        plankRole: 'left',
        sortOrder: 0,
        lenXFormula: '=carcassThickness',
        lenYFormula: '=boxDepth - backplankThickness',
        lenZFormula: '=boxHeight',
        posXFormula: '=0',
        posYFormula: '=0',
        posZFormula: '=0',
        defaultColor: '#C4A77D',
      },
      {
        id: 'wu600-right',
        entityName: 'Right Side',
        plankRole: 'right',
        sortOrder: 1,
        lenXFormula: '=carcassThickness',
        lenYFormula: '=boxDepth - backplankThickness',
        lenZFormula: '=boxHeight',
        posXFormula: '=boxWidth - carcassThickness',
        posYFormula: '=0',
        posZFormula: '=0',
        defaultColor: '#C4A77D',
      },
      {
        id: 'wu600-top',
        entityName: 'Top',
        plankRole: 'top',
        sortOrder: 2,
        lenXFormula: '=boxWidth - 2*carcassThickness',
        lenYFormula: '=boxDepth - backplankThickness',
        lenZFormula: '=carcassThickness',
        posXFormula: '=carcassThickness',
        posYFormula: '=0',
        posZFormula: '=boxHeight - carcassThickness',
        defaultColor: '#B89A6D',
      },
      {
        id: 'wu600-bottom',
        entityName: 'Bottom',
        plankRole: 'bottom',
        sortOrder: 3,
        lenXFormula: '=boxWidth - 2*carcassThickness',
        lenYFormula: '=boxDepth - backplankThickness',
        lenZFormula: '=carcassThickness',
        posXFormula: '=carcassThickness',
        posYFormula: '=0',
        posZFormula: '=0',
        defaultColor: '#B89A6D',
      },
      {
        id: 'wu600-back',
        entityName: 'Back Panel',
        plankRole: 'back',
        sortOrder: 4,
        lenXFormula: '=boxWidth - 2*carcassThickness + 12',
        lenYFormula: '=backplankThickness',
        lenZFormula: '=boxHeight - 2*carcassThickness + 12',
        posXFormula: '=carcassThickness - 6',
        posYFormula: '=boxDepth - backplankThickness',
        posZFormula: '=carcassThickness - 6',
        defaultColor: '#A08060',
      },
    ],
  };

  const tallUnitTemplate: BoxTemplate = {
    id: 'demo-tall-unit-600',
    catalogId: 'demo-catalog',
    entityName: 'Tall Unit 600',
    boxModel: 'TU-600',
    boxType: 'tall_unit',
    defaultWidth: 600,
    defaultDepth: 550,
    defaultHeight: 2100,
    defaultSkirtingHeight: 100,
    plankTemplates: [
      {
        id: 'tu600-left',
        entityName: 'Left Side',
        plankRole: 'left',
        sortOrder: 0,
        lenXFormula: '=carcassThickness',
        lenYFormula: '=boxDepth - backplankThickness',
        lenZFormula: '=boxHeight - skirtingHeight',
        posXFormula: '=0',
        posYFormula: '=0',
        posZFormula: '=skirtingHeight',
        defaultColor: '#8B7355',
      },
      {
        id: 'tu600-right',
        entityName: 'Right Side',
        plankRole: 'right',
        sortOrder: 1,
        lenXFormula: '=carcassThickness',
        lenYFormula: '=boxDepth - backplankThickness',
        lenZFormula: '=boxHeight - skirtingHeight',
        posXFormula: '=boxWidth - carcassThickness',
        posYFormula: '=0',
        posZFormula: '=skirtingHeight',
        defaultColor: '#8B7355',
      },
      {
        id: 'tu600-top',
        entityName: 'Top',
        plankRole: 'top',
        sortOrder: 2,
        lenXFormula: '=boxWidth - 2*carcassThickness',
        lenYFormula: '=boxDepth - backplankThickness',
        lenZFormula: '=carcassThickness',
        posXFormula: '=carcassThickness',
        posYFormula: '=0',
        posZFormula: '=boxHeight - carcassThickness',
        defaultColor: '#7A6245',
      },
      {
        id: 'tu600-bottom',
        entityName: 'Bottom',
        plankRole: 'bottom',
        sortOrder: 3,
        lenXFormula: '=boxWidth - 2*carcassThickness',
        lenYFormula: '=boxDepth - backplankThickness',
        lenZFormula: '=carcassThickness',
        posXFormula: '=carcassThickness',
        posYFormula: '=0',
        posZFormula: '=skirtingHeight',
        defaultColor: '#7A6245',
      },
    ],
  };

  return {
    id: 'demo-catalog',
    name: 'Standard Cabinet Catalog',
    description: 'Demo catalog with standard kitchen cabinet units',
    version: '1.0',
    isDefault: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    boxTemplates: [baseUnitTemplate, wallUnitTemplate, tallUnitTemplate],
  };
}

export default {
  parseCatalogCSV,
  createDemoCatalog,
};
