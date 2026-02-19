/**
 * SFT (Square Feet) Calculator
 * EXACT PORT from Apps Script "SFT_calculation.js" v3.4
 * 
 * Key features:
 * - Filters for Level 1 (boxes) only
 * - Uses lenX and lenZ for calculation (width and height of box front face)
 * - Converts mm to feet using standard conversion factor
 * - Returns detailed results with totals
 */

import { Wall, Box } from '@/types/visualiser';

// ============================================
// CONFIGURATION - EXACT FROM APPS SCRIPT
// ============================================

const CONFIG = {
  MM_TO_FEET_FACTOR: 0.00328084, // 1mm = 0.00328084 feet
} as const;

// ============================================
// TYPES
// ============================================

export interface SFTResult {
  boxModel: string;
  boxType: string;
  orientation: 'NS' | 'EW' | 'N/A';
  lengthMM: number;   // lenX in mm
  widthMM: number;    // lenZ in mm (height of box)
  squareFeet: number;
  wallName: string;
  roomName: string;
  originalRow?: number;
}

export interface SFTCalculationResult {
  results: SFTResult[];
  totalSquareFeet: number;
  boxCount: number;
  skippedCount: number;
  errors: string[];
}

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

/**
 * Calculate SFT for all Level 1 boxes from walls
 * EXACT PORT from Apps Script calculateBoxSFT()
 * 
 * SFT = (lenX * MM_TO_FEET) * (lenZ * MM_TO_FEET)
 * Only processes Level 1 (boxes), not planks or operations
 */
export function calculateSFT(walls: Wall[]): SFTCalculationResult {
  const results: SFTResult[] = [];
  const errors: string[] = [];
  let skippedCount = 0;

  // Process all boxes from all walls (Level 1)
  walls.forEach((wall) => {
    wall.boxes.forEach((box, boxIndex) => {
      // Get orientation from unit_location
      const orientation = getBoxOrientation(box.unitLocation || wall.unitLocation);

      // Extract dimensions
      const lenX = box.dimensions.lenX;
      const lenZ = box.dimensions.lenZ;

      // Validate dimensions
      if (lenX <= 0 || lenZ <= 0) {
        skippedCount++;
        errors.push(`Skipped box "${box.entityName}" due to invalid dimensions (lenX: ${lenX}, lenZ: ${lenZ})`);
        return;
      }

      // Calculate SFT
      const sft = (lenX * CONFIG.MM_TO_FEET_FACTOR) * (lenZ * CONFIG.MM_TO_FEET_FACTOR);

      results.push({
        boxModel: box.boxModel || box.entityName || 'N/A',
        boxType: box.boxType || 'N/A',
        orientation,
        lengthMM: lenX,
        widthMM: lenZ,
        squareFeet: Math.round(sft * 100) / 100, // 2 decimal places
        wallName: wall.entityName,
        roomName: box.roomName || wall.roomName || 'N/A',
        originalRow: boxIndex + 1,
      });
    });
  });

  // Calculate total
  const totalSquareFeet = results.reduce((sum, result) => sum + result.squareFeet, 0);

  return {
    results,
    totalSquareFeet: Math.round(totalSquareFeet * 100) / 100,
    boxCount: results.length,
    skippedCount,
    errors,
  };
}

// ============================================
// HELPER FUNCTIONS - EXACT FROM APPS SCRIPT
// ============================================

/**
 * Determine orientation from unit_location string
 * EXACT PORT from Apps Script getBoxOrientation()
 */
function getBoxOrientation(unitLocation: string): 'NS' | 'EW' | 'N/A' {
  const lowerCaseLocation = (unitLocation || '').toLowerCase();
  
  if (lowerCaseLocation.includes('north') || lowerCaseLocation.includes('south')) {
    return 'NS';
  }
  if (lowerCaseLocation.includes('east') || lowerCaseLocation.includes('west')) {
    return 'EW';
  }
  
  return 'N/A';
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Convert SFT results to CSV format
 */
export function sftResultsToCSV(results: SFTResult[], totalSFT: number): string {
  const headers = [
    'Box Model',
    'Box Type',
    'Orientation',
    'Length (mm)',
    'Width (mm)',
    'Square Feet',
    'Wall Name',
    'Room Name',
  ];

  const rows = results.map((result) => [
    result.boxModel,
    result.boxType,
    result.orientation,
    result.lengthMM,
    result.widthMM,
    result.squareFeet.toFixed(2),
    result.wallName,
    result.roomName,
  ]);

  // Add total row
  const totalRow = ['', '', '', '', 'Total Square Feet:', totalSFT.toFixed(2), '', ''];

  return [
    headers.join(','),
    ...rows.map((r) => r.join(',')),
    '', // Empty row before total
    totalRow.join(','),
  ].join('\n');
}

/**
 * Get SFT breakdown by room
 */
export function getSFTByRoom(results: SFTResult[]): Map<string, { boxes: number; totalSFT: number }> {
  const roomMap = new Map<string, { boxes: number; totalSFT: number }>();

  results.forEach((result) => {
    const room = result.roomName || 'Unspecified';
    const existing = roomMap.get(room) || { boxes: 0, totalSFT: 0 };
    
    roomMap.set(room, {
      boxes: existing.boxes + 1,
      totalSFT: existing.totalSFT + result.squareFeet,
    });
  });

  return roomMap;
}

/**
 * Get SFT breakdown by box type
 */
export function getSFTByBoxType(results: SFTResult[]): Map<string, { boxes: number; totalSFT: number }> {
  const typeMap = new Map<string, { boxes: number; totalSFT: number }>();

  results.forEach((result) => {
    const type = result.boxType || 'Other';
    const existing = typeMap.get(type) || { boxes: 0, totalSFT: 0 };
    
    typeMap.set(type, {
      boxes: existing.boxes + 1,
      totalSFT: existing.totalSFT + result.squareFeet,
    });
  });

  return typeMap;
}

/**
 * Format SFT result as table data for display
 */
export function formatSFTForTable(result: SFTCalculationResult): {
  headers: string[];
  rows: (string | number)[][];
  summary: { label: string; value: string }[];
} {
  const headers = [
    'Box Model',
    'Box Type',
    'Orientation',
    'Length (mm)',
    'Width (mm)',
    'Square Feet',
    'Room',
  ];

  const rows = result.results.map((r) => [
    r.boxModel,
    r.boxType,
    r.orientation,
    r.lengthMM,
    r.widthMM,
    r.squareFeet.toFixed(2),
    r.roomName,
  ]);

  const summary = [
    { label: 'Total Boxes', value: String(result.boxCount) },
    { label: 'Total Square Feet', value: result.totalSquareFeet.toFixed(2) },
    { label: 'Skipped', value: String(result.skippedCount) },
  ];

  return { headers, rows, summary };
}
