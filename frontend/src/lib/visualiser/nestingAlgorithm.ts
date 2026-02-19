/**
 * Nesting Algorithm
 * EXACT PORT from Apps Script "Cutlist.js" V5.3.4
 * 
 * Key features:
 * - Bottom-left scoring: Lower X+Y = better position
 * - Fit scoring: Smaller waste = better fit  
 * - Corner bonus: Closer to origin = better
 * - Rotation allowed unless grain = 'Y' or 'YES'
 * - Exclusion zone: plank + spacing on all sides
 */

import {
  PlankListItem,
  NestResult,
  SheetLayout,
  FreeRect,
  SHEET_CONSTANTS,
} from '@/types/visualiser';

// ============================================
// CONFIGURATION - EXACT FROM APPS SCRIPT
// ============================================

const SHEET_WIDTH = 1220;  // mm
const SHEET_HEIGHT = 2440; // mm
const STANDARD_SPACING = 10;
const SMALL_PLANK_SPACING = 20;
const SMALL_PLANK_THRESHOLD = 150;
const MARGIN = 10;

// Scoring weights for Bottom-Left optimization
const POSITION_WEIGHT = 2.0;    // How much to favor bottom-left positions
const FIT_WEIGHT = 1.0;         // How much to favor tight fits
const BOTTOM_LEFT_BIAS = 0.5;   // Extra bias towards origin

// Working area
const WORK_WIDTH = SHEET_WIDTH - MARGIN * 2;
const WORK_HEIGHT = SHEET_HEIGHT - MARGIN * 2;

// ============================================
// MAXRECTS BIN PACKING
// ============================================

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PlacedRect extends Rect {
  id: string;
  name: string;
  rotated: boolean;
  originalWidth: number;
  originalHeight: number;
}

class MaxRectsBin {
  width: number;
  height: number;
  freeRects: Rect[];
  usedRects: PlacedRect[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    // Initial free rect with margin
    this.freeRects = [{ x: MARGIN, y: MARGIN, width: width - 2 * MARGIN, height: height - 2 * MARGIN }];
    this.usedRects = [];
  }

  /**
   * Find the best position using Bottom-Left scoring
   * EXACT PORT from Apps Script evaluateLayout()
   * 
   * Scoring (lower is better):
   * - Position score: (normalizedX + normalizedY) * POSITION_WEIGHT
   * - Fit score: min(wastedW, wastedH) / 100 * FIT_WEIGHT
   * - Corner bonus: distanceFromOrigin * BOTTOM_LEFT_BIAS
   */
  findPositionBottomLeft(
    width: number, 
    height: number, 
    allowRotation: boolean
  ): {
    rect: Rect | null;
    rotated: boolean;
    score: number;
    rectIndex: number;
  } {
    let bestRect: Rect | null = null;
    let bestRotated = false;
    let bestScore = Infinity;
    let bestRectIndex = -1;

    const options = [{ w: width, h: height, rotated: false }];
    if (allowRotation) {
      options.push({ w: height, h: width, rotated: true });
    }

    for (let j = 0; j < this.freeRects.length; j++) {
      const rect = this.freeRects[j];
      
      for (const opt of options) {
        if (opt.w <= rect.width + 0.01 && opt.h <= rect.height + 0.01) {
          // ========== BOTTOM-LEFT SCORING (from Apps Script) ==========
          
          // Position score: favor bottom-left (lower X and Y values)
          const normalizedX = rect.x / SHEET_WIDTH;
          const normalizedY = rect.y / SHEET_HEIGHT;
          const positionScore = (normalizedX + normalizedY) * POSITION_WEIGHT;
          
          // Fit score: how well the plank fits the free rectangle
          const wastedW = rect.width - opt.w;
          const wastedH = rect.height - opt.h;
          const fitScore = (Math.min(wastedW, wastedH) / 100) * FIT_WEIGHT;
          
          // Bottom-left corner bonus
          const distanceFromOrigin = Math.sqrt(rect.x * rect.x + rect.y * rect.y);
          const maxDistance = Math.sqrt(SHEET_WIDTH * SHEET_WIDTH + SHEET_HEIGHT * SHEET_HEIGHT);
          const cornerBonus = (distanceFromOrigin / maxDistance) * BOTTOM_LEFT_BIAS;
          
          const score = positionScore + fitScore + cornerBonus;
          
          if (score < bestScore) {
            bestRect = { x: rect.x, y: rect.y, width: opt.w, height: opt.h };
            bestRotated = opt.rotated;
            bestScore = score;
            bestRectIndex = j;
          }
        }
      }
    }

    return { rect: bestRect, rotated: bestRotated, score: bestScore, rectIndex: bestRectIndex };
  }
  
  /**
   * Legacy BSSF method for compatibility
   */
  findPositionBSSF(width: number, height: number): {
    rect: Rect | null;
    rotated: boolean;
    bestShortSideFit: number;
    bestLongSideFit: number;
  } {
    const result = this.findPositionBottomLeft(width, height, true);
    return {
      rect: result.rect,
      rotated: result.rotated,
      bestShortSideFit: result.score,
      bestLongSideFit: result.score,
    };
  }

  /**
   * Place a rectangle in the bin using bottom-left scoring
   * @param allowRotation - Set to false if grain direction prevents rotation
   */
  placeRect(
    id: string, 
    name: string, 
    width: number, 
    height: number,
    allowRotation: boolean = true
  ): PlacedRect | null {
    const { rect, rotated } = this.findPositionBottomLeft(width, height, allowRotation);

    if (!rect) return null;

    const placedRect: PlacedRect = {
      ...rect,
      id,
      name,
      rotated,
      originalWidth: width,
      originalHeight: height,
    };

    this.usedRects.push(placedRect);
    
    // Use appropriate spacing based on plank size
    const currentSpacing = (rect.width < SMALL_PLANK_THRESHOLD || rect.height < SMALL_PLANK_THRESHOLD)
      ? SMALL_PLANK_SPACING
      : STANDARD_SPACING;
    
    this.splitFreeRectsAfterPlace(rect, currentSpacing);

    return placedRect;
  }

  /**
   * Split free rectangles after placing a new rect
   * EXACT PORT from Apps Script _splitFreeRect()
   * Uses exclusion zone: plank + spacing on all sides
   */
  private splitFreeRectsAfterPlace(placedRect: Rect, spacing: number = STANDARD_SPACING): void {
    const newFreeRects: Rect[] = [];

    for (let i = this.freeRects.length - 1; i >= 0; i--) {
      const freeRect = this.freeRects[i];

      if (!this.intersects(freeRect, placedRect)) {
        newFreeRects.push(freeRect);
        continue;
      }

      // Remove the intersecting free rect (will be replaced by split pieces)
      // Don't add it to newFreeRects

      // Define EXCLUSION ZONE - the area where nothing can be placed
      // Includes plank PLUS spacing on ALL sides
      const exclusionLeft = this.cleanNum(placedRect.x - spacing);
      const exclusionTop = this.cleanNum(placedRect.y - spacing);
      const exclusionRight = this.cleanNum(placedRect.x + placedRect.width + spacing);
      const exclusionBottom = this.cleanNum(placedRect.y + placedRect.height + spacing);
      
      const freeRight = this.cleanNum(freeRect.x + freeRect.width);
      const freeBottom = this.cleanNum(freeRect.y + freeRect.height);

      // 1. Top piece (Above the exclusion zone)
      if (exclusionTop > freeRect.y) {
        newFreeRects.push({
          x: freeRect.x,
          y: freeRect.y,
          width: freeRect.width,
          height: this.cleanNum(exclusionTop - freeRect.y),
        });
      }

      // 2. Bottom piece (Below the exclusion zone)
      if (exclusionBottom < freeBottom) {
        newFreeRects.push({
          x: freeRect.x,
          y: exclusionBottom,
          width: freeRect.width,
          height: this.cleanNum(freeBottom - exclusionBottom),
        });
      }

      // 3. Left piece (Left of the exclusion zone)
      if (exclusionLeft > freeRect.x) {
        newFreeRects.push({
          x: freeRect.x,
          y: freeRect.y,
          width: this.cleanNum(exclusionLeft - freeRect.x),
          height: freeRect.height,
        });
      }

      // 4. Right piece (Right of the exclusion zone)
      if (exclusionRight < freeRight) {
        newFreeRects.push({
          x: exclusionRight,
          y: freeRect.y,
          width: this.cleanNum(freeRight - exclusionRight),
          height: freeRect.height,
        });
      }
    }

    // Filter out tiny rects and prune contained ones
    this.freeRects = this.pruneRects(
      newFreeRects.filter(r => r.width > 0.1 && r.height > 0.1)
    );
    
    // Sort free rects by bottom-left priority for next iteration
    this.freeRects.sort((a, b) => (a.x + a.y) - (b.x + b.y));
  }
  
  private cleanNum(num: number): number {
    return Math.round(num * 100) / 100;
  }
  
  private pruneRects(rects: Rect[]): Rect[] {
    const pruned: Rect[] = [];
    for (let i = 0; i < rects.length; i++) {
      let isContained = false;
      for (let j = 0; j < rects.length; j++) {
        if (i === j) continue;
        if (
          rects[j].x <= rects[i].x &&
          rects[j].y <= rects[i].y &&
          rects[j].x + rects[j].width >= rects[i].x + rects[i].width &&
          rects[j].y + rects[j].height >= rects[i].y + rects[i].height
        ) {
          isContained = true;
          break;
        }
      }
      if (!isContained) pruned.push(rects[i]);
    }
    return pruned;
  }

  /**
   * Remove redundant free rectangles
   */
  private pruneFreeRects(): void {
    for (let i = 0; i < this.freeRects.length; i++) {
      for (let j = i + 1; j < this.freeRects.length; j++) {
        if (this.isContainedIn(this.freeRects[i], this.freeRects[j])) {
          this.freeRects.splice(i, 1);
          i--;
          break;
        }
        if (this.isContainedIn(this.freeRects[j], this.freeRects[i])) {
          this.freeRects.splice(j, 1);
          j--;
        }
      }
    }
  }

  /**
   * Check if two rectangles intersect
   */
  private intersects(a: Rect, b: Rect): boolean {
    return !(
      a.x >= b.x + b.width ||
      a.x + a.width <= b.x ||
      a.y >= b.y + b.height ||
      a.y + a.height <= b.y
    );
  }

  /**
   * Check if rectangle 'a' is contained within rectangle 'b'
   */
  private isContainedIn(a: Rect, b: Rect): boolean {
    return (
      a.x >= b.x &&
      a.y >= b.y &&
      a.x + a.width <= b.x + b.width &&
      a.y + a.height <= b.y + b.height
    );
  }

  /**
   * Calculate utilization percentage
   */
  getUtilization(): number {
    const usedArea = this.usedRects.reduce(
      (sum, rect) => sum + rect.width * rect.height,
      0
    );
    return (usedArea / (this.width * this.height)) * 100;
  }
}

// ============================================
// MAIN NESTING FUNCTION
// ============================================

export interface NestingOptions {
  sortByArea?: boolean;  // Sort by area (largest first) for Best Fit Decreasing
}

/**
 * Run nesting algorithm on plank list
 * Groups by material/thickness and nests each group
 * EXACT PORT from Apps Script createCutlist()
 */
export function runNesting(
  plankList: PlankListItem[],
  options: NestingOptions = {}
): {
  results: NestResult[];
  sheetLayouts: SheetLayout[];
  summary: NestingSummary;
} {
  const { sortByArea = true } = options;

  // Group planks by material and thickness
  const groups = groupByMaterialThickness(plankList);
  
  const allResults: NestResult[] = [];
  const allLayouts: SheetLayout[] = [];
  
  let globalSheetNum = 0;

  groups.forEach((planks, key) => {
    const { results, layouts } = nestGroup(
      planks,
      key,
      globalSheetNum,
      { sortByArea }
    );
    
    allResults.push(...results);
    allLayouts.push(...layouts);
    globalSheetNum += layouts.length;
  });

  const summary = generateNestingSummary(allLayouts, plankList);

  return { results: allResults, sheetLayouts: allLayouts, summary };
}

/**
 * Nest a group of planks with the same material/thickness
 * EXACT PORT from Apps Script evaluateLayout()
 */
function nestGroup(
  planks: PlankListItem[],
  materialKey: string,
  startSheetNum: number,
  options: NestingOptions
): {
  results: NestResult[];
  layouts: SheetLayout[];
} {
  const { sortByArea = true } = options;

  // Best Fit Decreasing heuristic - sort by area largest first
  const sortedPlanks = sortByArea
    ? [...planks].sort((a, b) => (b.width * b.height) - (a.width * a.height))
    : planks;

  const results: NestResult[] = [];
  const layouts: SheetLayout[] = [];
  
  let currentBin: MaxRectsBin | null = null;
  let currentSheetNum = startSheetNum;
  const unplacedPlanks: PlankListItem[] = [];

  for (const plank of sortedPlanks) {
    const plankWidth = plank.width;
    const plankHeight = plank.height;

    // Check if plank fits in sheet at all
    if (plankWidth > WORK_WIDTH && plankHeight > WORK_WIDTH) {
      console.warn(`Plank ${plank.plankId} is too large to fit on sheet`);
      unplacedPlanks.push(plank);
      continue;
    }

    // Rotation allowed unless grain = 'Y' or 'YES'
    const grain = plank.grain?.toUpperCase() || '';
    const allowRotation = grain !== 'Y' && grain !== 'YES';

    // Try to place in current bin
    let placed: PlacedRect | null = null;
    
    if (currentBin) {
      placed = currentBin.placeRect(
        plank.plankId,
        plank.plankName,
        plankWidth,
        plankHeight,
        allowRotation
      );
    }

    // If not placed, start new sheet
    if (!placed) {
      // Save current bin if it has placements
      if (currentBin && currentBin.usedRects.length > 0) {
        layouts.push(createSheetLayout(currentBin, currentSheetNum, materialKey));
        currentSheetNum++;
      }

      // Create new bin
      currentBin = new MaxRectsBin(SHEET_WIDTH, SHEET_HEIGHT);
      placed = currentBin.placeRect(
        plank.plankId,
        plank.plankName,
        plankWidth,
        plankHeight,
        allowRotation
      );
    }

    if (placed) {
      results.push(createNestResult(placed, plank, currentSheetNum, materialKey));
    } else {
      unplacedPlanks.push(plank);
    }
  }

  // Save last bin
  if (currentBin && currentBin.usedRects.length > 0) {
    layouts.push(createSheetLayout(currentBin, currentSheetNum, materialKey));
  }

  return { results, layouts };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function groupByMaterialThickness(planks: PlankListItem[]): Map<string, PlankListItem[]> {
  const groups = new Map<string, PlankListItem[]>();

  planks.forEach((plank) => {
    const key = `${plank.material}_${plank.thickness}mm`;
    const existing = groups.get(key) || [];
    existing.push(plank);
    groups.set(key, existing);
  });

  return groups;
}

function createNestResult(
  placed: PlacedRect,
  plank: PlankListItem,
  sheetNum: number,
  materialKey: string
): NestResult {
  // Calculate original sizes (cut size + 2*EB) for labels
  const eb = plank.edgeBinding || 0;
  const origW = placed.width + (2 * eb);
  const origH = placed.height + (2 * eb);
  
  return {
    id: plank.plankId,
    name: plank.plankName,
    material: plank.material,
    thickness: plank.thickness,
    sheetNum,
    x: placed.x,  // Already includes MARGIN from bin
    y: placed.y,
    width: placed.width,
    height: placed.height,
    rotated: placed.rotated,
    color: getMaterialColor(plank.material),
    originalWidth: origW,
    originalHeight: origH,
    ebValue: eb,
    holes: [], // Holes would come from operations data
  };
}

function createSheetLayout(
  bin: MaxRectsBin,
  sheetNum: number,
  materialKey: string
): SheetLayout {
  return {
    sheetNum,
    materialThickness: materialKey,
    planks: bin.usedRects.map((rect) => ({
      id: rect.id,
      name: rect.name,
      material: materialKey.split('_')[0],
      thickness: parseInt(materialKey.split('_')[1]) || 18,
      sheetNum,
      x: rect.x,  // Already includes MARGIN from bin
      y: rect.y,
      width: rect.width,
      height: rect.height,
      rotated: rect.rotated,
      color: getMaterialColor(materialKey),
      originalWidth: rect.originalWidth,
      originalHeight: rect.originalHeight,
      ebValue: 0,
      holes: [],
    })),
    utilization: bin.getUtilization(),
    freeRects: bin.freeRects.map((rect) => ({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    })),
  };
}

function getMaterialColor(material: string): string {
  const materialLower = material.toLowerCase();
  
  if (materialLower.includes('18')) return '#D4A574';
  if (materialLower.includes('12')) return '#C9A066';
  if (materialLower.includes('6')) return '#A08060';
  if (materialLower.includes('mdf')) return '#E8DCC8';
  if (materialLower.includes('hdhmr')) return '#D6C8B8';
  
  return '#D4A574';
}

// ============================================
// SUMMARY
// ============================================

interface NestingSummary {
  totalSheets: number;
  totalPlanks: number;
  averageUtilization: number;
  materialBreakdown: {
    material: string;
    sheets: number;
    utilization: number;
  }[];
  warnings: string[];
}

function generateNestingSummary(
  layouts: SheetLayout[],
  originalPlanks: PlankListItem[]
): NestingSummary {
  const materialMap = new Map<string, { sheets: number; totalUtil: number }>();

  layouts.forEach((layout) => {
    const key = layout.materialThickness;
    const existing = materialMap.get(key) || { sheets: 0, totalUtil: 0 };
    existing.sheets += 1;
    existing.totalUtil += layout.utilization;
    materialMap.set(key, existing);
  });

  const materialBreakdown = Array.from(materialMap.entries()).map(([material, data]) => ({
    material,
    sheets: data.sheets,
    utilization: data.totalUtil / data.sheets,
  }));

  const totalUtil = layouts.reduce((sum, l) => sum + l.utilization, 0);

  return {
    totalSheets: layouts.length,
    totalPlanks: layouts.reduce((sum, l) => sum + l.planks.length, 0),
    averageUtilization: layouts.length > 0 ? totalUtil / layouts.length : 0,
    materialBreakdown,
    warnings: [],
  };
}

// ============================================
// EXPORT
// ============================================

/**
 * Export nest results to CSV
 */
export function nestResultsToCSV(results: NestResult[]): string {
  const headers = [
    'Plank ID',
    'Plank Name',
    'Material',
    'Thickness',
    'Sheet #',
    'X',
    'Y',
    'Width',
    'Height',
    'Rotated',
  ];

  const rows = results.map((r) => [
    r.id,
    r.name,
    r.material,
    r.thickness,
    r.sheetNum,
    r.x,
    r.y,
    r.width,
    r.height,
    r.rotated ? 'Yes' : 'No',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
