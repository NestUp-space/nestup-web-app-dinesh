/**
 * Plank List Generator
 * EXACT PORT from Apps Script "plank list.js"
 * 
 * Key features:
 * - Tiered wastage calculation based on material type and total quantity
 * - Thickness rule: thickness < 12mm = 0 EB, skip wastage
 * - Formula: Base EB = (width + height) * 2 / 1000 (meters)
 * - Final EB = Base * (1 + wastageRate)
 */

import {
  FormattedPlankData,
  PlankListItem,
  SHEET_CONSTANTS,
} from '@/types/visualiser';

// ============================================
// WASTAGE RULES - EXACT FROM APPS SCRIPT
// ============================================

/**
 * Calculate wastage rate based on material type and total quantity
 * EXACT PORT from Apps Script getWastageRate()
 * 
 * Rules:
 * - Inner: >500m = 10%, else 15%
 * - Color: <25m = 30%, 25-50m = 25%, 50-100m = 20%, >100m = 15%
 */
function getWastageRate(materialName: string, totalEb: number): number {
  const isInner = materialName && typeof materialName === 'string' && 
    materialName.toLowerCase().includes('inner');

  if (isInner) {
    // Rules for "Inner"
    if (totalEb > 500) {
      return 0.10; // 10%
    } else {
      return 0.15; // 15% (for quantities <= 500)
    }
  } else {
    // Rules for "Color"
    if (totalEb < 25) {
      return 0.30; // 30%
    } else if (totalEb <= 50) { // 25 to 50
      return 0.25; // 25%
    } else if (totalEb <= 100) { // 50.1 to 100
      return 0.20; // 20%
    } else { // More than 100
      return 0.15; // 15%
    }
  }
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Minimum thickness for edge binding
 * Planks with thickness < 12mm get 0 EB
 */
const MIN_THICKNESS_FOR_EB = 12;

// ============================================
// MAIN FUNCTION
// ============================================

export interface PlankListOptions {
  sortByMaterial?: boolean;
  calculateEdgeBinding?: boolean;
  groupByRoom?: boolean;
}

/**
 * Generate plank list from formatted data
 * EXACT PORT from Apps Script createPlankList()
 * 
 * Two-pass algorithm:
 * 1. Pass 1: Calculate total base EB for each material (only if thickness >= 12)
 * 2. Pass 2: Build output with tiered wastage applied to each plank
 */
export function generatePlankList(
  formattedData: FormattedPlankData[],
  options: PlankListOptions = {}
): {
  plankList: PlankListItem[];
  summary: PlankListSummary;
} {
  const { sortByMaterial = true, calculateEdgeBinding = true } = options;

  // ============================================
  // PASS 1: Calculate total base EB for each material
  // Only includes planks with thickness >= 12mm
  // ============================================
  const materialEbTotals: { [material: string]: number } = {};
  
  if (calculateEdgeBinding) {
    formattedData.forEach((item) => {
      // Skip if thickness < 12mm
      if (item.plankThickness < MIN_THICKNESS_FOR_EB) return;
      
      const width = item.plankLength;  // In formatted data, plankLength = width
      const height = item.plankWidth;  // plankWidth = height
      
      if (!isNaN(width) && !isNaN(height)) {
        // Calculate base EB (perimeter in meters)
        const baseEb = (width + height) * 2 / 1000;
        
        // Add to material total
        const material = item.plankMaterial || 'Unknown';
        materialEbTotals[material] = (materialEbTotals[material] || 0) + baseEb;
      }
    });
  }
  
  // ============================================
  // PASS 2: Build plank list with tiered wastage
  // ============================================
  let plankList: PlankListItem[] = formattedData.map((item) => {
    const width = item.plankLength;
    const height = item.plankWidth;
    const thickness = item.plankThickness;
    const material = item.plankMaterial || 'Unknown';
    
    // Calculate edge binding
    let edgeBinding = 0;
    
    if (calculateEdgeBinding) {
      // Thickness rule: < 12mm = 0 EB
      if (thickness < MIN_THICKNESS_FOR_EB) {
        edgeBinding = 0;
      } else if (!isNaN(width) && !isNaN(height)) {
        // 1. Calculate base EB for this plank
        const baseEb = (width + height) * 2 / 1000;
        
        // 2. Get total EB for this material
        const totalMaterialEb = materialEbTotals[material] || 0;
        
        // 3. Get wastage rate based on material type and total quantity
        const wastageRate = getWastageRate(material, totalMaterialEb);
        
        // 4. Apply wastage: Base * (1 + Rate)
        edgeBinding = baseEb * (1 + wastageRate);
      }
    }
    
    return {
      plankName: item.plankName,
      material,
      width,   // plankLength in formatted data
      height,  // plankWidth in formatted data
      thickness,
      plankId: item.plankId,
      grain: determineGrainDirection(item),
      edgeBinding: Math.round(edgeBinding * 1000) / 1000, // 3 decimal places
    };
  });

  // Sort by material if requested (to group them)
  if (sortByMaterial) {
    plankList = sortPlanksByMaterial(plankList);
  }

  // Calculate edge binding totals for summary
  const ebTotals: EdgeBindingTotals = calculateEdgeBinding
    ? calculateTotalEdgeBinding(plankList)
    : { inner: 0, color: 0, total: 0, details: [] };

  // Generate summary
  const summary = generateSummary(plankList, ebTotals);

  return { plankList, summary };
}

// ============================================
// SORTING
// ============================================

/**
 * Sort planks by material (thickness first, then type)
 */
function sortPlanksByMaterial(planks: PlankListItem[]): PlankListItem[] {
  return [...planks].sort((a, b) => {
    // First by thickness (descending)
    if (a.thickness !== b.thickness) {
      return b.thickness - a.thickness;
    }
    // Then by material name
    return a.material.localeCompare(b.material);
  });
}

// ============================================
// EDGE BINDING CALCULATIONS
// ============================================

interface EdgeBindingTotals {
  inner: number;
  color: number;
  total: number;
  details: EdgeBindingDetail[];
}

interface EdgeBindingDetail {
  material: string;
  thickness: number;
  innerLength: number;
  colorLength: number;
  totalLength: number;
  withWastage: number;
}

/**
 * Calculate total edge binding requirements
 * Uses pre-calculated EB values from plank list (already includes wastage)
 */
function calculateTotalEdgeBinding(planks: PlankListItem[]): EdgeBindingTotals {
  const ebByMaterial = new Map<string, EdgeBindingDetail>();

  planks.forEach((plank) => {
    // Skip planks with no EB
    if (plank.edgeBinding <= 0) return;
    
    const key = `${plank.material}_${plank.thickness}`;
    const existing = ebByMaterial.get(key) || {
      material: plank.material,
      thickness: plank.thickness,
      innerLength: 0,
      colorLength: 0,
      totalLength: 0,
      withWastage: 0,
    };

    // Determine if inner or color based on material name
    const isInner = plank.material.toLowerCase().includes('inner');
    
    // edgeBinding already includes wastage (in meters)
    if (isInner) {
      existing.innerLength += plank.edgeBinding;
    } else {
      existing.colorLength += plank.edgeBinding;
    }
    existing.totalLength += plank.edgeBinding;
    existing.withWastage += plank.edgeBinding;

    ebByMaterial.set(key, existing);
  });

  // Sum up totals
  let totalInner = 0;
  let totalColor = 0;
  const details: EdgeBindingDetail[] = [];

  ebByMaterial.forEach((detail) => {
    totalInner += detail.innerLength;
    totalColor += detail.colorLength;
    details.push(detail);
  });

  return {
    inner: Math.ceil(totalInner),  // Already in meters
    color: Math.ceil(totalColor),
    total: Math.ceil(totalInner + totalColor),
    details,
  };
}

// ============================================
// GRAIN DIRECTION
// ============================================

/**
 * Determine grain direction based on plank dimensions and material
 */
function determineGrainDirection(item: FormattedPlankData): 'Y' | 'N' | '' {
  // Check if material supports grain direction
  const material = item.plankMaterial.toLowerCase();
  const hasGrain =
    material.includes('plywood') ||
    material.includes('veneer') ||
    material.includes('wood');

  if (!hasGrain) return '';

  // Grain typically follows the longer dimension
  // For doors and panels, grain usually runs vertically
  if (item.plankLength >= item.plankWidth) {
    return 'Y'; // Grain along length
  }

  return 'N'; // Grain along width
}

// ============================================
// SUMMARY
// ============================================

interface PlankListSummary {
  totalPlanks: number;
  uniqueMaterials: number;
  materialBreakdown: MaterialBreakdown[];
  totalArea: number;
  edgeBinding: EdgeBindingTotals;
}

interface MaterialBreakdown {
  material: string;
  thickness: number;
  count: number;
  totalArea: number;
  estimatedSheets: number;
}

/**
 * Generate summary statistics
 */
function generateSummary(
  planks: PlankListItem[],
  ebTotals: EdgeBindingTotals
): PlankListSummary {
  const materialMap = new Map<string, MaterialBreakdown>();

  planks.forEach((plank) => {
    const key = `${plank.material}_${plank.thickness}`;
    const area = (plank.width * plank.height) / 1_000_000; // Convert to m²

    const existing = materialMap.get(key) || {
      material: plank.material,
      thickness: plank.thickness,
      count: 0,
      totalArea: 0,
      estimatedSheets: 0,
    };

    existing.count += 1;
    existing.totalArea += area;

    materialMap.set(key, existing);
  });

  // Calculate estimated sheets
  const sheetArea =
    (SHEET_CONSTANTS.SHEET_WIDTH * SHEET_CONSTANTS.SHEET_HEIGHT) / 1_000_000;

  materialMap.forEach((breakdown) => {
    // Assume 75% utilization for sheet estimation
    breakdown.estimatedSheets = Math.ceil(breakdown.totalArea / (sheetArea * 0.75));
  });

  const materialBreakdown = Array.from(materialMap.values()).sort(
    (a, b) => b.thickness - a.thickness || a.material.localeCompare(b.material)
  );

  return {
    totalPlanks: planks.length,
    uniqueMaterials: materialMap.size,
    materialBreakdown,
    totalArea: planks.reduce(
      (sum, p) => sum + (p.width * p.height) / 1_000_000,
      0
    ),
    edgeBinding: ebTotals,
  };
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Export plank list to CSV format
 */
export function plankListToCSV(plankList: PlankListItem[]): string {
  const headers = [
    'Plank Name',
    'Material',
    'Width (mm)',
    'Height (mm)',
    'Thickness (mm)',
    'Plank ID',
    'Grain',
    'Edge Binding',
  ];

  const rows = plankList.map((item) => [
    item.plankName,
    item.material,
    item.width,
    item.height,
    item.thickness,
    item.plankId,
    item.grain,
    item.edgeBinding,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Group planks by material and thickness for display
 */
export function groupPlanksByMaterial(
  plankList: PlankListItem[]
): Map<string, PlankListItem[]> {
  const groups = new Map<string, PlankListItem[]>();

  plankList.forEach((plank) => {
    const key = `${plank.material} ${plank.thickness}mm`;
    const existing = groups.get(key) || [];
    existing.push(plank);
    groups.set(key, existing);
  });

  return groups;
}
