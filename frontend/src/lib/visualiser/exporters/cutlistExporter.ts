/**
 * Cutlist Exporter
 * Generates cut list CSV and other export formats
 */

import type { 
  DesignerWall, 
  DesignerBox, 
  DesignerPlank,
  CutlistExportRow,
} from "@/types/visualiser";

// ============================================
// Types
// ============================================

export interface ExportResult {
  success: boolean;
  data?: string;
  filename?: string;
  error?: string;
}

export interface ExportOptions {
  includeWallName?: boolean;
  includeMaterials?: boolean;
  includeArea?: boolean;
  includePositions?: boolean;
}

// ============================================
// CSV Generation
// ============================================

/**
 * Escapes a value for CSV
 */
function escapeCSV(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates CSV content from rows
 */
function generateCSV(headers: string[], rows: (string | number)[][]): string {
  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map(row => row.map(escapeCSV).join(','));
  return [headerLine, ...dataLines].join('\n');
}

// ============================================
// Cut List Generation
// ============================================

/**
 * Converts mm² to square feet
 */
function mmToSqft(mm2: number): number {
  return mm2 / 92903.04; // 1 sqft = 92903.04 mm²
}

/**
 * Generates cut list data from walls
 */
export function generateCutlistData(
  walls: DesignerWall[],
  options: ExportOptions = {}
): CutlistExportRow[] {
  const rows: CutlistExportRow[] = [];
  
  for (const wall of walls) {
    for (const box of wall.boxes) {
      for (const plank of box.planks) {
        // Calculate area in square feet
        const areaMm2 = plank.dimensions.lenX * plank.dimensions.lenZ;
        const areaSqft = mmToSqft(areaMm2);
        
        rows.push({
          wallName: wall.name,
          boxName: box.name,
          boxModel: box.boxModel,
          plankName: plank.name,
          plankRole: plank.plankRole || '',
          lenX: Math.round(plank.dimensions.lenX * 100) / 100,
          lenY: Math.round(plank.dimensions.lenY * 100) / 100,
          lenZ: Math.round(plank.dimensions.lenZ * 100) / 100,
          materialString: plank.materialString,
          coreType: plank.coreMaterial,
          outerLaminateCode: plank.outerLaminateCode,
          innerLaminateCode: plank.innerLaminateCode,
          areaSqft: Math.round(areaSqft * 100) / 100,
        });
      }
    }
  }
  
  return rows;
}

/**
 * Exports cut list as CSV
 */
export function exportCutlistCSV(
  walls: DesignerWall[],
  options: ExportOptions = {}
): ExportResult {
  try {
    const data = generateCutlistData(walls, options);
    
    if (data.length === 0) {
      return { success: false, error: 'No planks to export' };
    }
    
    // Build headers based on options
    const headers = ['Wall', 'Box', 'Box Model', 'Plank', 'Role', 'LenX (mm)', 'LenY (mm)', 'LenZ (mm)'];
    
    if (options.includeMaterials !== false) {
      headers.push('Material', 'Core', 'Outer Laminate', 'Inner Laminate');
    }
    
    if (options.includeArea !== false) {
      headers.push('Area (sqft)');
    }
    
    // Build rows
    const rows = data.map(row => {
      const values: (string | number)[] = [
        row.wallName,
        row.boxName,
        row.boxModel || '',
        row.plankName,
        row.plankRole,
        row.lenX,
        row.lenY,
        row.lenZ,
      ];
      
      if (options.includeMaterials !== false) {
        values.push(
          row.materialString || '',
          row.coreType || '',
          row.outerLaminateCode || '',
          row.innerLaminateCode || ''
        );
      }
      
      if (options.includeArea !== false) {
        values.push(row.areaSqft);
      }
      
      return values;
    });
    
    const csv = generateCSV(headers, rows);
    const filename = `cutlist_${new Date().toISOString().split('T')[0]}.csv`;
    
    return { success: true, data: csv, filename };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

// ============================================
// Material Summary Export
// ============================================

interface MaterialSummary {
  material: string;
  plankCount: number;
  totalAreaSqft: number;
  estimatedSheets: number;
}

/**
 * Generates material summary
 */
export function generateMaterialSummary(walls: DesignerWall[]): MaterialSummary[] {
  const materialMap = new Map<string, { count: number; area: number }>();
  
  for (const wall of walls) {
    for (const box of wall.boxes) {
      for (const plank of box.planks) {
        const key = plank.materialString || 'Unassigned';
        const existing = materialMap.get(key) || { count: 0, area: 0 };
        
        const areaMm2 = plank.dimensions.lenX * plank.dimensions.lenZ;
        const areaSqft = mmToSqft(areaMm2);
        
        materialMap.set(key, {
          count: existing.count + 1,
          area: existing.area + areaSqft,
        });
      }
    }
  }
  
  // Convert to array and calculate sheets (8x4 = 32 sqft per sheet)
  const SHEET_SIZE_SQFT = 32;
  
  return Array.from(materialMap.entries()).map(([material, data]) => ({
    material,
    plankCount: data.count,
    totalAreaSqft: Math.round(data.area * 100) / 100,
    estimatedSheets: Math.ceil(data.area / SHEET_SIZE_SQFT),
  }));
}

/**
 * Exports material summary as CSV
 */
export function exportMaterialSummaryCSV(walls: DesignerWall[]): ExportResult {
  try {
    const summary = generateMaterialSummary(walls);
    
    if (summary.length === 0) {
      return { success: false, error: 'No materials to summarize' };
    }
    
    const headers = ['Material', 'Plank Count', 'Total Area (sqft)', 'Estimated Sheets'];
    const rows = summary.map(s => [s.material, s.plankCount, s.totalAreaSqft, s.estimatedSheets]);
    
    const csv = generateCSV(headers, rows);
    const filename = `material_summary_${new Date().toISOString().split('T')[0]}.csv`;
    
    return { success: true, data: csv, filename };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

// ============================================
// Project JSON Export
// ============================================

/**
 * Exports full project as JSON
 */
export function exportProjectJSON(
  walls: DesignerWall[],
  projectName: string = 'Cabinet Project'
): ExportResult {
  try {
    const projectData = {
      name: projectName,
      exportedAt: new Date().toISOString(),
      version: '1.0',
      walls: walls.map(wall => ({
        id: wall.id,
        name: wall.name,
        roomName: wall.roomName,
        dimensions: {
          width: wall.width,
          height: wall.height,
          depth: wall.depth,
        },
        color: wall.color,
        boxes: wall.boxes.map(box => ({
          id: box.id,
          name: box.name,
          boxModel: box.boxModel,
          boxType: box.boxType,
          position: box.position,
          rotation: box.rotationZ,
          dimensions: box.dimensions,
          materials: {
            carcassPly: box.carcassPly,
            doorPly: box.doorPly,
            backPly: box.backPly,
          },
          thicknesses: {
            carcass: box.carcassThickness,
            door: box.doorThickness,
            back: box.backplankThickness,
          },
          planks: box.planks.map(plank => ({
            id: plank.id,
            name: plank.name,
            role: plank.plankRole,
            position: plank.position,
            dimensions: plank.dimensions,
            material: plank.materialString,
            outerLaminate: plank.outerLaminateCode,
            innerLaminate: plank.innerLaminateCode,
            color: plank.color,
          })),
        })),
      })),
      summary: {
        totalWalls: walls.length,
        totalBoxes: walls.reduce((sum, w) => sum + w.boxes.length, 0),
        totalPlanks: walls.reduce((sum, w) => 
          sum + w.boxes.reduce((s, b) => s + b.planks.length, 0), 0
        ),
      },
    };
    
    const json = JSON.stringify(projectData, null, 2);
    const filename = `${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    
    return { success: true, data: json, filename };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

// ============================================
// Download Helper
// ============================================

/**
 * Triggers file download in browser
 */
export function downloadFile(data: string, filename: string, mimeType: string = 'text/csv'): void {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export default {
  generateCutlistData,
  exportCutlistCSV,
  generateMaterialSummary,
  exportMaterialSummaryCSV,
  exportProjectJSON,
  downloadFile,
};
