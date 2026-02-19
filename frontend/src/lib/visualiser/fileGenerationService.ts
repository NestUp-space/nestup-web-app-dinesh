/**
 * File Generation Service
 * Orchestrates the generation of all output files from ALL walls
 * 
 * CRITICAL: This service processes ALL walls, not just the selected/active wall
 * 
 * Output files:
 * 1. Formatted Data - Level detection, EB settings, coordinate transforms
 * 2. Plank List - Wastage tiers, thickness rules, EB calculation
 * 3. Cutlist - Bottom-left nesting, rotation, operation coordinates
 * 4. Material Summary - Grouping, utilization, EB totals
 * 5. Material Estimate - Plywood, laminate, EB, hardware summaries
 */

import { Wall, Box, Plank, FormattedPlankData, PlankListItem } from '@/types/visualiser';
import { formatDesignData } from './dataFormatter';
import { generatePlankList } from './plankListGenerator';

// ============================================
// TYPES
// ============================================

export interface FileGenerationSettings {
  edgeBindingSettings: { [material: string]: number };
  clientDetails: {
    customerName: string;
    firmName: string;
    transportAmount: number;
  };
}

export interface FileGenerationResult {
  formattedData: FormattedPlankData[];
  plankList: PlankListItem[];
  materialSummary: MaterialSummaryItem[];
  materialEstimate: MaterialEstimate;
  warnings: string[];
  errors: string[];
}

export interface MaterialSummaryItem {
  material: string;
  thickness: number;
  count: number;
  totalArea: number; // sq mm
  sheetsUsed: number;
  avgAreaPerSheet: number;
  utilizationPercent: number;
  edgeBindingTotal: number; // meters
}

export interface MaterialEstimate {
  plywood: PlywoodEstimate[];
  laminate: LaminateEstimate[];
  edgeBanding: EdgeBandingEstimate[];
  hardware: HardwareEstimate;
}

export interface PlywoodEstimate {
  type: string;
  thickness: number;
  sheets: number;
  price: number;
}

export interface LaminateEstimate {
  code: string;
  brand: string;
  sheets: number;
  price: number;
  innerOuter: 'inner' | 'outer' | 'both';
}

export interface EdgeBandingEstimate {
  size: string;
  color: string;
  meters: number;
  rolls: number;
  price: number;
}

export interface HardwareEstimate {
  fevicolProbond: number;
  fevicolD3: number;
  screws: number;
  hinges: number;
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

/**
 * Generate all files from ALL walls
 * This is the main entry point for file generation
 */
export async function generateAllFiles(
  walls: Wall[],
  settings: FileGenerationSettings
): Promise<FileGenerationResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  console.log(`[FileGeneration] Processing ${walls.length} walls...`);
  
  // Step 1: Collect ALL planks from ALL walls with wall/box context
  const allPlanksWithContext = collectAllPlanks(walls);
  console.log(`[FileGeneration] Collected ${allPlanksWithContext.length} planks from all walls`);
  
  // Step 2: Format data with edge binding settings
  const { data: formattedData, warnings: formatWarnings, errors: formatErrors } = 
    formatDesignData(walls, {
      validateSize: true,
      includeOperations: true,
      transformOperationCoordinates: true,
    });
  
  warnings.push(...formatWarnings);
  errors.push(...formatErrors);
  
  // Apply edge binding settings from dialog
  const formattedWithEB = applyEdgeBindingSettings(formattedData, settings.edgeBindingSettings);
  
  // Step 3: Generate plank list
  const { plankList, summary: plankListSummary } = generatePlankList(formattedWithEB, {
    sortByMaterial: true,
    calculateEdgeBinding: true,
  });
  
  // Step 4: Generate material summary
  const materialSummary = generateMaterialSummary(plankList);
  
  // Step 5: Generate material estimate
  const materialEstimate = generateMaterialEstimate(
    materialSummary,
    plankList,
    settings.clientDetails
  );
  
  return {
    formattedData: formattedWithEB,
    plankList,
    materialSummary,
    materialEstimate,
    warnings,
    errors,
  };
}

// ============================================
// PLANK COLLECTION (ALL WALLS)
// ============================================

interface PlankWithContext {
  plank: Plank;
  wallId: string;
  wallName: string;
  boxId: string;
  boxName: string;
  boxModel: string;
}

/**
 * Collect planks from ALL walls with context information
 */
function collectAllPlanks(walls: Wall[]): PlankWithContext[] {
  const planks: PlankWithContext[] = [];
  
  walls.forEach((wall) => {
    wall.boxes.forEach((box) => {
      box.planks.forEach((plank) => {
        planks.push({
          plank,
          wallId: wall.id,
          wallName: wall.entityName,
          boxId: box.id,
          boxName: box.entityName,
          boxModel: box.boxModel || box.entityName,
        });
      });
    });
  });
  
  return planks;
}

// ============================================
// EDGE BINDING APPLICATION
// ============================================

/**
 * Apply edge binding settings from dialog to formatted data
 */
function applyEdgeBindingSettings(
  data: FormattedPlankData[],
  ebSettings: { [material: string]: number }
): FormattedPlankData[] {
  return data.map((item) => {
    // Find matching material in settings
    const material = item.plankMaterial || 'Unknown';
    const ebThickness = findMatchingEBSetting(material, ebSettings);
    
    if (ebThickness !== undefined && ebThickness !== item.ebValue) {
      return {
        ...item,
        ebValue: ebThickness,
        ebApplied: true,
      };
    }
    
    return item;
  });
}

/**
 * Find matching EB setting for a material
 */
function findMatchingEBSetting(
  material: string,
  settings: { [key: string]: number }
): number | undefined {
  // Exact match
  if (material in settings) {
    return settings[material];
  }
  
  // Partial match (case-insensitive)
  const materialLower = material.toLowerCase();
  for (const [key, value] of Object.entries(settings)) {
    if (materialLower.includes(key.toLowerCase()) || key.toLowerCase().includes(materialLower)) {
      return value;
    }
  }
  
  // Default based on inner/outer
  if (materialLower.includes('inner')) {
    return 1.0; // 1mm for inner
  }
  return 2.0; // 2mm for color/outer
}

// ============================================
// MATERIAL SUMMARY GENERATION
// ============================================

/**
 * Generate material summary grouped by material_thickness
 * EXACT PORT from Apps Script createMaterialSummarySheet()
 * 
 * Groups by: ${baseMaterial}_${thickness}mm
 * Calculates: plank count, total area, sheets used, avg area/sheet, utilization %, total edge (m)
 */
function generateMaterialSummary(plankList: PlankListItem[]): MaterialSummaryItem[] {
  const SHEET_AREA = 1220 * 2440; // mm²
  
  interface GroupStat {
    baseMaterial: string;
    thickness: number;
    plankCount: number;
    totalArea: number;
    sheetSet: Set<number>;
    roomSet: Set<string>;
    edgeBindingTotal: number;
  }
  
  const groupStatMap = new Map<string, GroupStat>();
  
  // Group planks by material_thickness
  plankList.forEach((plank) => {
    // Clean material name (remove thickness notation in parentheses)
    let baseMaterial = plank.material
      .replace(/\(\s*\d+(\.\d+)?\s*mm\s*\)/gi, '')
      .replace(/\s*\([^)]+\)/g, '')
      .trim();
    
    const cleanKey = `${baseMaterial}_${plank.thickness}mm`;
    
    // Extract room name from material (if in parentheses)
    const roomRegex = /\(([^)]+)\)/;
    const roomMatch = plank.material.match(roomRegex);
    const roomName = roomMatch?.[1]?.trim() || 'N/A';
    
    if (!groupStatMap.has(cleanKey)) {
      groupStatMap.set(cleanKey, {
        baseMaterial,
        thickness: plank.thickness,
        plankCount: 0,
        totalArea: 0,
        sheetSet: new Set(),
        roomSet: new Set(),
        edgeBindingTotal: 0,
      });
    }
    
    const group = groupStatMap.get(cleanKey)!;
    group.plankCount++;
    group.totalArea += plank.width * plank.height;
    group.sheetSet.add(plank.sheetNumber || 1);
    group.roomSet.add(roomName);
    
    // Sum edge binding (already in meters from plank list generator)
    group.edgeBindingTotal += plank.edgeBinding || 0;
  });
  
  // Convert to summary array
  const summary: MaterialSummaryItem[] = [];
  
  groupStatMap.forEach((group, key) => {
    const sheetsUsed = group.sheetSet.size || 
      Math.ceil(group.totalArea / SHEET_AREA); // Fallback if no sheet assignment
    
    const avgAreaPerSheet = sheetsUsed > 0 ? group.totalArea / sheetsUsed : 0;
    const utilizationPercent = sheetsUsed > 0 
      ? (group.totalArea / (sheetsUsed * SHEET_AREA)) * 100 
      : 0;
    
    summary.push({
      material: group.baseMaterial,
      thickness: group.thickness,
      count: group.plankCount,
      totalArea: Math.round(group.totalArea),
      sheetsUsed,
      avgAreaPerSheet: Math.round(avgAreaPerSheet),
      utilizationPercent: parseFloat(utilizationPercent.toFixed(1)),
      edgeBindingTotal: parseFloat(group.edgeBindingTotal.toFixed(2)),
    });
  });
  
  // Sort by material name then thickness (Apps Script sorts by key which is material_thickness)
  return summary.sort((a, b) => {
    const keyA = `${a.material}_${a.thickness}mm`;
    const keyB = `${b.material}_${b.thickness}mm`;
    return keyA.localeCompare(keyB);
  });
}

// ============================================
// MATERIAL ESTIMATE GENERATION
// ============================================

/**
 * Generate detailed material estimate
 * EXACT PORT from Apps Script generateMaterialEstimate()
 * 
 * Key rules:
 * - Plywood: type from material name, thickness = original - 2mm, skip if <=3mm
 * - Laminate: @ = inner (one side), & = two colors (both exterior), BSL = both sides same
 * - Edge Banding: size from getEbSize(), skip OS laminates, skip <=3mm
 * - Hardware: Probond = acrylicSides * 0.8, D3 = (totalSheets * 1.6) - Probond
 */
function generateMaterialEstimate(
  summary: MaterialSummaryItem[],
  plankList: PlankListItem[],
  clientDetails: FileGenerationSettings['clientDetails']
): MaterialEstimate {
  const plywoodByKey: Record<string, { type: string; thickness: number; sheets: number }> = {};
  const laminateByKey: Record<string, { code: string; brand: string; exterior: number; inner: number }> = {};
  const edgeBandingByKey: Record<string, { size: string; color: string; meters: number; isInner: boolean }> = {};
  
  let totalSheets = 0;
  let totalAcrylicSides = 0;
  let totalInnerSheets = 0;
  
  // Process each material group from summary
  for (const item of summary) {
    const { material, thickness, sheetsUsed, edgeBindingTotal } = item;
    
    // Calculate original thickness (before EB subtraction)
    const originalThickness = thickness + 2;
    const finalThickness = thickness;
    
    // Skip very thin materials (<=3mm) - laminate only, no plywood, no EB
    const isThinOnly = originalThickness <= 3;
    
    // Material properties detection
    const materialLower = material.toLowerCase();
    const isOSLaminate = materialLower.includes('(os') || /\bos\b/.test(materialLower);
    const isInner = materialLower.includes('inner');
    const hasBSL = materialLower.includes('bsl');
    const isWoodenInner = isInner && (materialLower.includes('wood') || materialLower.includes('timber') || materialLower.includes('veneer'));
    const hasAtSign = material.includes('@');
    const hasAmpersand = material.includes('&');
    const colorCode = extractColorCode(material);
    
    // ==== PLYWOOD SUMMARY (skip <=3mm) ====
    if (sheetsUsed > 0 && !isThinOnly) {
      totalSheets += sheetsUsed;
      
      const plywoodType = extractPlywoodType(material);
      const plywoodKey = `${plywoodType} - ${finalThickness}mm`;
      
      if (!plywoodByKey[plywoodKey]) {
        plywoodByKey[plywoodKey] = { type: plywoodType, thickness: finalThickness, sheets: 0 };
      }
      plywoodByKey[plywoodKey].sheets += sheetsUsed;
      
      // Check for acrylic (for Probond calculation)
      if (materialLower.includes('acr')) {
        totalAcrylicSides += sheetsUsed;
      }
    }
    
    // ==== LAMINATE SUMMARY ====
    if (hasAtSign) {
      // @ = inner laminate (one side)
      const parts = colorCode.split('@');
      const firstColor = parts[0].trim();
      
      if (!laminateByKey['Inner Laminates']) {
        laminateByKey['Inner Laminates'] = { code: 'Inner', brand: 'NA', exterior: 0, inner: 0 };
      }
      laminateByKey['Inner Laminates'].inner += sheetsUsed;
      totalInnerSheets += sheetsUsed;
      
      // EB for first color
      if (!isOSLaminate && !isThinOnly) {
        const ebSize = getEbSize(originalThickness, false);
        const ebKey = `${firstColor}__${originalThickness}mm__outer`;
        if (!edgeBandingByKey[ebKey]) {
          edgeBandingByKey[ebKey] = { size: ebSize, color: firstColor, meters: 0, isInner: false };
        }
        edgeBandingByKey[ebKey].meters += edgeBindingTotal;
      }
    } else if (hasAmpersand) {
      // & = two colors (both exterior)
      const parts = colorCode.split('&');
      if (parts.length === 2) {
        const firstColor = parts[0].trim();
        const secondColor = parts[1].trim();
        
        // First color
        if (!laminateByKey[firstColor]) {
          laminateByKey[firstColor] = { code: firstColor, brand: 'NA', exterior: 0, inner: 0 };
        }
        laminateByKey[firstColor].exterior += sheetsUsed;
        
        // Second color
        if (!laminateByKey[secondColor]) {
          laminateByKey[secondColor] = { code: secondColor, brand: 'NA', exterior: 0, inner: 0 };
        }
        laminateByKey[secondColor].exterior += sheetsUsed;
        
        // EB for first color
        if (!isOSLaminate && !isThinOnly) {
          const ebSize = getEbSize(originalThickness, false);
          const ebKey = `${firstColor}__${originalThickness}mm__outer`;
          if (!edgeBandingByKey[ebKey]) {
            edgeBandingByKey[ebKey] = { size: ebSize, color: firstColor, meters: 0, isInner: false };
          }
          edgeBandingByKey[ebKey].meters += edgeBindingTotal;
        }
      }
    } else if (isInner) {
      // Inner laminate (both sides)
      const innerKey = isWoodenInner ? 'Wooden Inner Laminates' : 'Inner Laminates';
      
      if (!laminateByKey[innerKey]) {
        laminateByKey[innerKey] = { code: 'Inner', brand: 'NA', exterior: 0, inner: 0 };
      }
      
      if (sheetsUsed > 0) {
        const innerSheets = sheetsUsed * 2;
        laminateByKey[innerKey].inner += innerSheets;
        totalInnerSheets += innerSheets;
      }
      
      // Inner EB
      if (!isOSLaminate && !isThinOnly) {
        const ebSize = getEbSize(finalThickness || originalThickness, true);
        const ebKey = `${innerKey}__${ebSize}__inner`;
        if (!edgeBandingByKey[ebKey]) {
          edgeBandingByKey[ebKey] = { size: ebSize, color: innerKey, meters: 0, isInner: true };
        }
        edgeBandingByKey[ebKey].meters += edgeBindingTotal;
      }
    } else if (hasBSL) {
      // BSL = both sides same laminate
      if (!laminateByKey[colorCode]) {
        laminateByKey[colorCode] = { code: colorCode, brand: 'NA', exterior: 0, inner: 0 };
      }
      
      if (sheetsUsed > 0) {
        laminateByKey[colorCode].exterior += sheetsUsed * 2;
      }
      
      // Outer EB
      if (!isOSLaminate && !isThinOnly) {
        const ebSize = getEbSize(finalThickness || originalThickness, false);
        const ebKey = `${colorCode}__${originalThickness}mm__outer`;
        if (!edgeBandingByKey[ebKey]) {
          edgeBandingByKey[ebKey] = { size: ebSize, color: colorCode, meters: 0, isInner: false };
        }
        edgeBandingByKey[ebKey].meters += edgeBindingTotal;
      }
    } else {
      // Normal: exterior + inner
      if (!laminateByKey[colorCode]) {
        laminateByKey[colorCode] = { code: colorCode, brand: 'NA', exterior: 0, inner: 0 };
      }
      
      if (sheetsUsed > 0) {
        laminateByKey[colorCode].exterior += sheetsUsed;
        
        // Add to inner
        if (!laminateByKey['Inner Laminates']) {
          laminateByKey['Inner Laminates'] = { code: 'Inner', brand: 'NA', exterior: 0, inner: 0 };
        }
        laminateByKey['Inner Laminates'].inner += sheetsUsed;
        totalInnerSheets += sheetsUsed;
      }
      
      // Outer EB
      if (!isOSLaminate && !isThinOnly) {
        const ebSize = getEbSize(finalThickness || originalThickness, false);
        const ebKey = `${colorCode}__${originalThickness}mm__outer`;
        if (!edgeBandingByKey[ebKey]) {
          edgeBandingByKey[ebKey] = { size: ebSize, color: colorCode, meters: 0, isInner: false };
        }
        edgeBandingByKey[ebKey].meters += edgeBindingTotal;
      }
    }
  }
  
  // ==== CONVERT TO ARRAYS ====
  const plywood: PlywoodEstimate[] = Object.entries(plywoodByKey)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => ({
      type: val.type,
      thickness: val.thickness,
      sheets: val.sheets,
      price: estimatePlywoodPrice('', val.thickness, val.sheets),
    }));
  
  const laminate: LaminateEstimate[] = Object.entries(laminateByKey)
    .sort(([a], [b]) => {
      // Sort: exterior first, then inner
      const isInnerA = a.toLowerCase().includes('inner');
      const isInnerB = b.toLowerCase().includes('inner');
      if (!isInnerA && isInnerB) return -1;
      if (isInnerA && !isInnerB) return 1;
      return a.localeCompare(b);
    })
    .map(([key, val]) => ({
      code: val.code,
      brand: val.brand,
      sheets: val.exterior + val.inner,
      price: 0, // Price from catalog
      innerOuter: val.inner > 0 && val.exterior === 0 ? 'inner' as const : 
                 val.exterior > 0 && val.inner === 0 ? 'outer' as const : 'both' as const,
    }));
  
  const edgeBanding: EdgeBandingEstimate[] = Object.entries(edgeBandingByKey)
    .filter(([_, val]) => val.meters > 0)
    .map(([key, val]) => ({
      size: val.size,
      color: val.color,
      meters: Math.ceil(val.meters),
      rolls: Math.ceil(val.meters / 100),
      price: Math.ceil(val.meters / 100) * (val.isInner ? 150 : 250),
    }));
  
  // ==== HARDWARE (EXACT PORT) ====
  const probond = Math.round(totalAcrylicSides * 0.8);
  const grossFevicol = totalSheets * 1.6;
  const netFevicol = grossFevicol - probond;
  const d3 = Math.round(netFevicol);
  
  const hardware: HardwareEstimate = {
    fevicolProbond: probond,
    fevicolD3: d3 > 0 ? d3 : 0,
    screws: plankList.length * 8,
    hinges: Math.floor(plankList.filter(p => 
      p.plankName.toLowerCase().includes('door')
    ).length * 2),
  };
  
  return {
    plywood,
    laminate,
    edgeBanding,
    hardware,
  };
}

/**
 * Extract clean color code from material string
 * EXACT PORT from Apps Script getCleanColorCode()
 */
function extractColorCode(material: string): string {
  if (!material) return 'NA';
  
  let str = material.trim();
  
  // Remove material type words
  const removeWords = ['bwp', 'bb', 'hdhmr', 'mdf', 'hdf', 'ply', 'bsl', 'inner', 'veneer', 'wood', 'timber'];
  removeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    str = str.replace(regex, '');
  });
  
  // Remove parenthesized content and thickness
  str = str.replace(/\(.*?\)/g, '');
  str = str.replace(/\(\s*\d+\s*mm\s*\)/gi, '');
  str = str.replace(/\b\d+mm\b/gi, '');
  str = str.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  
  return str || 'NA';
}

/**
 * Extract plywood type (BWP, BB, HDHMR, MDF, HDF)
 * EXACT PORT from Apps Script generateMaterialEstimate()
 */
function extractPlywoodType(material: string): string {
  const lower = material.toLowerCase();
  if (lower.includes('bwp')) return 'BWP';
  if (lower.includes('bb') || lower.includes('block board')) return 'Blockboard';
  if (lower.includes('hdhmr')) return 'HDHMR';
  if (lower.includes('mdf')) return 'MDF';
  if (lower.includes('hdf')) return 'HDF';
  return 'Plywood';
}

/**
 * Get edge binding size based on thickness
 * EXACT PORT from Apps Script getEbSize()
 */
function getEbSize(thickness: number, isInner: boolean = false): string {
  if (isInner) {
    const t = thickness || 18;
    if (t >= 16 && t <= 17) return "22mm*0.8mm";
    if (t >= 18 && t <= 20) return "25mm*0.8mm";
    if (t >= 23 && t <= 27) return "30mm*0.8mm";
    return "22mm*0.8mm"; // default
  }
  
  if (!thickness && thickness !== 0) return "22mm*2.0mm";
  const t = thickness;
  if (isNaN(t)) return "22mm*2.0mm";
  
  if (t >= 16 && t <= 17) return "22mm*2.0mm";
  if (t >= 18 && t <= 20) return "25mm*2.0mm";
  if (t >= 23 && t <= 27) return "30mm*2.0mm";
  if (t > 27) return "45mm*2.0mm";
  return "22mm*2.0mm"; // default
}

/**
 * Estimate plywood price (placeholder - should use catalog prices)
 */
function estimatePlywoodPrice(material: string, thickness: number, sheets: number): number {
  // Base price per sheet by thickness
  const basePrices: { [key: number]: number } = {
    6: 800,
    8: 1000,
    12: 1400,
    18: 2000,
    25: 2800,
  };
  
  const basePrice = basePrices[thickness] || 2000;
  return basePrice * sheets;
}

/**
 * Extract laminate estimate from planks
 */
function extractLaminateEstimate(plankList: PlankListItem[]): LaminateEstimate[] {
  // This would parse laminate codes from plank materials
  // For now, return empty array - should be populated from actual laminate selections
  return [];
}

/**
 * Calculate edge banding estimate
 */
function calculateEdgeBandingEstimate(summary: MaterialSummaryItem[]): EdgeBandingEstimate[] {
  const estimates: EdgeBandingEstimate[] = [];
  
  // Group by material type (inner vs color)
  let innerTotal = 0;
  let colorTotal = 0;
  
  summary.forEach((item) => {
    const isInner = item.material.toLowerCase().includes('inner');
    if (isInner) {
      innerTotal += item.edgeBindingTotal;
    } else {
      colorTotal += item.edgeBindingTotal;
    }
  });
  
  // Inner edge banding (0.8mm)
  if (innerTotal > 0) {
    estimates.push({
      size: '0.8mm',
      color: 'Plain/White',
      meters: Math.ceil(innerTotal),
      rolls: Math.ceil(innerTotal / 100), // 100m per roll
      price: Math.ceil(innerTotal / 100) * 150, // ₹150 per roll
    });
  }
  
  // Color edge banding (2mm)
  if (colorTotal > 0) {
    estimates.push({
      size: '2mm',
      color: 'Match Laminate',
      meters: Math.ceil(colorTotal),
      rolls: Math.ceil(colorTotal / 50), // 50m per roll for color
      price: Math.ceil(colorTotal / 50) * 350, // ₹350 per roll
    });
  }
  
  return estimates;
}

// ============================================
// PROGRESS TRACKING
// ============================================

export interface GenerationProgress {
  step: string;
  progress: number; // 0-100
  message: string;
}

export type ProgressCallback = (progress: GenerationProgress) => void;

/**
 * Generate files with progress callback
 */
export async function generateAllFilesWithProgress(
  walls: Wall[],
  settings: FileGenerationSettings,
  onProgress: ProgressCallback
): Promise<FileGenerationResult> {
  onProgress({ step: 'start', progress: 0, message: 'Starting file generation...' });
  
  // Collect planks
  onProgress({ step: 'collect', progress: 10, message: `Collecting planks from ${walls.length} walls...` });
  await sleep(100); // Small delay for UI update
  
  // Format data
  onProgress({ step: 'format', progress: 30, message: 'Formatting plank data...' });
  await sleep(100);
  
  // Generate plank list
  onProgress({ step: 'plankList', progress: 50, message: 'Generating plank list...' });
  await sleep(100);
  
  // Generate material summary
  onProgress({ step: 'summary', progress: 70, message: 'Calculating material summary...' });
  await sleep(100);
  
  // Generate material estimate
  onProgress({ step: 'estimate', progress: 90, message: 'Creating material estimate...' });
  await sleep(100);
  
  // Actual generation
  const result = await generateAllFiles(walls, settings);
  
  onProgress({ step: 'complete', progress: 100, message: 'Generation complete!' });
  
  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
