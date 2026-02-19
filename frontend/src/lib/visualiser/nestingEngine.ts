/**
 * Nesting Engine
 * EXACT PORT from Apps Script "Cutlist.js" v5.3.4
 * 
 * Algorithms:
 * - MaxRects: Bottom-left bin packing with Best Fit Decreasing heuristic (auto-run)
 * - Genetic Algorithm (GA): Population-based optimization
 * - Simulated Annealing (SA): Temperature-based probabilistic search
 * - Particle Swarm Optimization (PSO): Swarm intelligence optimization
 */

import { PlankListItem, SHEET_CONSTANTS } from '@/types/visualiser';

// ============================================
// CONSTANTS - EXACT FROM APPS SCRIPT
// ============================================

const SHEET_WIDTH = SHEET_CONSTANTS.SHEET_WIDTH;   // 1220mm
const SHEET_HEIGHT = SHEET_CONSTANTS.SHEET_HEIGHT; // 2440mm
const STANDARD_SPACING = 10;
const SMALL_PLANK_SPACING = 20;
const SMALL_PLANK_THRESHOLD = 150;
const MARGIN = 10;

// Bottom-Left scoring weights
const POSITION_WEIGHT = 2.0;
const FIT_WEIGHT = 1.0;
const BOTTOM_LEFT_BIAS = 0.5;

// ============================================
// TYPES
// ============================================

export interface NestingPlank {
  id: string;
  name: string;
  width: number;
  height: number;
  thickness: number;
  material: string;
  grain?: string;
  operations?: PlankOperations;
  ebValue?: number;
  roomName?: string;
}

export interface PlankOperations {
  [opType: string]: OperationData[];
}

export interface OperationData {
  x: number;
  y: number;
  z: number;
  length?: number;
  width?: number;
  depth?: number;
}

export interface FreeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Sheet {
  sheetNum: number;
  freeRects: FreeRect[];
}

export interface PlacedPlank {
  id: string;
  name: string;
  material: string;
  thickness: number;
  sheetNum: number;
  x: number;
  y: number;
  placedWidth: number;
  placedHeight: number;
  rotated: boolean;
  originalWidth: number;
  originalHeight: number;
  ebValue: number;
  operations: TransformedOperation[];
  color?: string;
  roomName?: string;
}

export interface TransformedOperation {
  x: number;
  y: number;
  z: number;
  type: string;
  isRectangular: boolean;
  description: string;
  width?: number;
  length?: number;
  diameter?: number;
}

export interface NestingResult {
  fitness: number;
  layout: PlacedPlank[];
  sheetsUsed: number;
  unplacedCount: number;
  utilization: number;
  maxWasteArea: number;
}

export interface NestResultByGroup {
  [materialThicknessKey: string]: {
    planks: NestingPlank[];
    result: NestingResult;
  };
}

// Algorithm parameters
export interface GAParams {
  populationSize: number;
  generations: number;
  mutationRate: number;
}

export interface SAParams {
  iterations: number;
  initialTemperature: number;
  coolingRate: number;
}

export interface PSOParams {
  particles: number;
  iterations: number;
  inertia: number;
  cognitive: number;
  social: number;
}

export type AlgorithmType = 'maxrects' | 'ga' | 'sa' | 'pso';

// ============================================
// MAIN ENTRY POINT
// ============================================

/**
 * Run nesting on plank list
 * Groups planks by material+thickness, then nests each group
 */
export function runNesting(
  planks: PlankListItem[],
  algorithm: AlgorithmType = 'maxrects',
  params?: GAParams | SAParams | PSOParams,
  onProgress?: (message: string, percent: number) => void
): {
  results: NestResultByGroup;
  allPlacedPlanks: PlacedPlank[];
  totalSheets: number;
  totalUtilization: number;
} {
  // Group planks by material and thickness
  const grouped = groupPlanksByMaterialThickness(planks);
  const results: NestResultByGroup = {};
  const allPlacedPlanks: PlacedPlank[] = [];
  let sheetCounter = 1;
  let totalArea = 0;
  let usedArea = 0;

  const groupKeys = Object.keys(grouped);
  
  groupKeys.forEach((key, index) => {
    const groupPlanks = grouped[key];
    
    if (onProgress) {
      onProgress(`Nesting ${key}...`, ((index + 1) / groupKeys.length) * 100);
    }

    // Convert to nesting planks
    const nestingPlanks: NestingPlank[] = groupPlanks.map(p => ({
      id: p.plankId,
      name: p.plankName,
      width: p.width,
      height: p.height,
      thickness: p.thickness,
      material: p.material,
      grain: p.grain,
      ebValue: p.edgeBinding || 0,
    }));

    // Sort by area (Best Fit Decreasing)
    nestingPlanks.sort((a, b) => (b.width * b.height) - (a.width * a.height));

    // Run selected algorithm
    let result: NestingResult;
    
    switch (algorithm) {
      case 'ga':
        result = runGeneticAlgorithm(nestingPlanks, key, params as GAParams);
        break;
      case 'sa':
        result = runSimulatedAnnealing(nestingPlanks, key, params as SAParams);
        break;
      case 'pso':
        result = runPSO(nestingPlanks, key, params as PSOParams);
        break;
      default:
        result = evaluateLayout(nestingPlanks, key);
    }

    // Adjust sheet numbers
    result.layout.forEach(plank => {
      plank.sheetNum = plank.sheetNum + sheetCounter - 1;
      allPlacedPlanks.push(plank);
    });

    sheetCounter += result.sheetsUsed;

    results[key] = {
      planks: nestingPlanks,
      result,
    };

    // Track utilization
    const sheetArea = (SHEET_WIDTH - 2 * MARGIN) * (SHEET_HEIGHT - 2 * MARGIN);
    totalArea += result.sheetsUsed * sheetArea;
    usedArea += result.layout.reduce((sum, p) => sum + p.placedWidth * p.placedHeight, 0);
  });

  const totalUtilization = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;

  return {
    results,
    allPlacedPlanks,
    totalSheets: sheetCounter - 1,
    totalUtilization,
  };
}

/**
 * Group planks by material and thickness
 */
function groupPlanksByMaterialThickness(
  planks: PlankListItem[]
): { [key: string]: PlankListItem[] } {
  const grouped: { [key: string]: PlankListItem[] } = {};

  planks.forEach(plank => {
    // Clean material name (remove room info in parentheses)
    let baseMaterial = plank.material
      .replace(/\(\s*\d+(\.\d+)?\s*mm\s*\)/gi, '')
      .replace(/\s*\([^)]+\)/g, '')
      .trim();

    const key = `${baseMaterial}_${plank.thickness}mm`;

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(plank);
  });

  return grouped;
}

// ============================================
// CORE NESTING ENGINE (MaxRects)
// ============================================

/**
 * Evaluate layout using MaxRects algorithm
 * EXACT PORT from Apps Script evaluateLayout()
 */
export function evaluateLayout(
  planksOrder: NestingPlank[],
  materialThicknessKey: string
): NestingResult {
  const resultsLayout: PlacedPlank[] = [];
  const sheets: Sheet[] = [];
  let totalUsedArea = 0;
  const unplacedPlanks: NestingPlank[] = [];

  for (const plank of planksOrder) {
    let globalBestFit = {
      score: Infinity,
      sheetIndex: -1,
      rectIndex: -1,
      orientation: null as { w: number; h: number; rotated: boolean } | null,
    };

    // Rotation options (skip if grain direction specified)
    const options = [{ w: plank.width, h: plank.height, rotated: false }];
    if (plank.grain !== 'Y' && plank.grain !== 'YES') {
      options.push({ w: plank.height, h: plank.width, rotated: true });
    }

    // Find best fit across all sheets
    for (let i = 0; i < sheets.length; i++) {
      const sheet = sheets[i];
      for (let j = 0; j < sheet.freeRects.length; j++) {
        const rect = sheet.freeRects[j];
        for (const opt of options) {
          if (opt.w <= rect.width + 0.01 && opt.h <= rect.height + 0.01) {
            // Bottom-Left Scoring
            const normalizedX = rect.x / SHEET_WIDTH;
            const normalizedY = rect.y / SHEET_HEIGHT;
            const positionScore = (normalizedX + normalizedY) * POSITION_WEIGHT;

            const wastedW = rect.width - opt.w;
            const wastedH = rect.height - opt.h;
            const fitScore = (Math.min(wastedW, wastedH) / 100) * FIT_WEIGHT;

            const distanceFromOrigin = Math.sqrt(rect.x * rect.x + rect.y * rect.y);
            const cornerBonus = (distanceFromOrigin / Math.sqrt(SHEET_WIDTH * SHEET_WIDTH + SHEET_HEIGHT * SHEET_HEIGHT)) * BOTTOM_LEFT_BIAS;

            const score = positionScore + fitScore + cornerBonus;

            if (score < globalBestFit.score) {
              globalBestFit = { score, sheetIndex: i, rectIndex: j, orientation: opt };
            }
          }
        }
      }
    }

    // Create new sheet if no fit found
    let targetSheetIndex = globalBestFit.sheetIndex;
    if (targetSheetIndex === -1) {
      const newSheetNum = sheets.length + 1;
      const newSheet: Sheet = {
        sheetNum: newSheetNum,
        freeRects: [{
          x: MARGIN,
          y: MARGIN,
          width: SHEET_WIDTH - 2 * MARGIN,
          height: SHEET_HEIGHT - 2 * MARGIN,
        }],
      };
      sheets.push(newSheet);
      targetSheetIndex = sheets.length - 1;

      // Find best fit on new sheet
      const newSheetRect = newSheet.freeRects[0];
      let bestNewSheetScore = Infinity;
      for (const opt of options) {
        if (opt.w <= newSheetRect.width && opt.h <= newSheetRect.height) {
          const score = 0;
          if (score < bestNewSheetScore) {
            globalBestFit = { score, sheetIndex: targetSheetIndex, rectIndex: 0, orientation: opt };
            bestNewSheetScore = score;
          }
        }
      }

      if (globalBestFit.sheetIndex === -1) {
        unplacedPlanks.push(plank);
        continue;
      }
    }

    const { rectIndex, orientation } = globalBestFit;
    if (!orientation) {
      unplacedPlanks.push(plank);
      continue;
    }

    const targetSheet = sheets[targetSheetIndex];
    const targetRect = targetSheet.freeRects[rectIndex];

    const placedRect = {
      x: cleanNum(targetRect.x),
      y: cleanNum(targetRect.y),
      width: cleanNum(orientation.w),
      height: cleanNum(orientation.h),
    };

    // Process operations
    const operations = transformOperations(
      plank.operations || {},
      placedRect.x,
      placedRect.y,
      placedRect.width,
      placedRect.height,
      orientation.rotated
    );

    // Calculate original dimensions
    const eb = plank.ebValue || 0;
    const origW = orientation.w + (2 * eb);
    const origH = orientation.h + (2 * eb);

    // Create placed plank
    const placed: PlacedPlank = {
      id: plank.id,
      name: plank.name,
      material: plank.material,
      thickness: plank.thickness,
      sheetNum: targetSheet.sheetNum,
      x: placedRect.x,
      y: placedRect.y,
      placedWidth: orientation.w,
      placedHeight: orientation.h,
      rotated: orientation.rotated,
      originalWidth: origW,
      originalHeight: origH,
      ebValue: eb,
      operations,
    };

    resultsLayout.push(placed);
    totalUsedArea += orientation.w * orientation.h;

    // Determine spacing
    const currentSpacing = (orientation.w < SMALL_PLANK_THRESHOLD || orientation.h < SMALL_PLANK_THRESHOLD)
      ? SMALL_PLANK_SPACING
      : STANDARD_SPACING;

    // Split free rectangles
    const newFreeRects: FreeRect[] = [];
    for (const free of targetSheet.freeRects) {
      if (rectsOverlap(free, placedRect)) {
        newFreeRects.push(...splitFreeRect(free, placedRect, currentSpacing));
      } else {
        newFreeRects.push(free);
      }
    }
    targetSheet.freeRects = pruneRects(newFreeRects);

    // Sort free rects by bottom-left priority
    targetSheet.freeRects.sort((a, b) => (a.x + a.y) - (b.x + b.y));
  }

  // Calculate metrics
  const sheetsUsed = sheets.length;
  const sheetArea = (SHEET_WIDTH - 2 * MARGIN) * (SHEET_HEIGHT - 2 * MARGIN);
  const totalSheetArea = sheetsUsed * sheetArea;
  const utilization = totalSheetArea > 0 ? (totalUsedArea / totalSheetArea) * 100 : 0;

  // Calculate largest contiguous waste
  let maxWasteArea = 0;
  sheets.forEach(sheet => {
    sheet.freeRects.forEach(rect => {
      const area = rect.width * rect.height;
      if (area > maxWasteArea) maxWasteArea = area;
    });
  });

  // Fitness calculation
  const wasteBonus = maxWasteArea / sheetArea * 10;
  const fitness = (sheetsUsed * 1000) + (100 - utilization) + (unplacedPlanks.length * 10000) - wasteBonus;

  return {
    fitness,
    layout: resultsLayout,
    sheetsUsed,
    unplacedCount: unplacedPlanks.length,
    utilization: Math.round(utilization * 100) / 100,
    maxWasteArea: Math.round(maxWasteArea),
  };
}

// ============================================
// GENETIC ALGORITHM
// ============================================

interface Individual {
  chromosome: NestingPlank[];
  fitness: number;
  details?: NestingResult;
}

/**
 * Run Genetic Algorithm
 * EXACT PORT from Apps Script _runGeneticAlgorithmForGroup()
 */
export function runGeneticAlgorithm(
  planks: NestingPlank[],
  materialThicknessKey: string,
  params: GAParams = { populationSize: 20, generations: 50, mutationRate: 2 }
): NestingResult {
  const { populationSize, generations, mutationRate } = params;

  // Initialize population
  let population: Individual[] = [];
  for (let i = 0; i < populationSize; i++) {
    population.push({
      chromosome: shuffleArray([...planks]),
      fitness: Infinity,
    });
  }

  let bestSolution: Individual | null = null;

  // Evolution loop
  for (let gen = 0; gen < generations; gen++) {
    // Evaluate fitness
    for (const individual of population) {
      if (individual.fitness === Infinity) {
        const result = evaluateLayout(individual.chromosome, materialThicknessKey);
        individual.fitness = result.fitness;
        individual.details = result;
      }
    }

    // Sort by fitness
    population.sort((a, b) => a.fitness - b.fitness);

    // Update best
    if (!bestSolution || population[0].fitness < bestSolution.fitness) {
      bestSolution = JSON.parse(JSON.stringify(population[0]));
    }

    // Selection and reproduction
    const eliteCount = Math.max(2, Math.floor(populationSize * 0.1));
    const newPopulation = population.slice(0, eliteCount);

    while (newPopulation.length < populationSize) {
      const parent1 = population[Math.floor(Math.random() * (populationSize / 2))];
      const parent2 = population[Math.floor(Math.random() * (populationSize / 2))];
      let childChromosome = orderedCrossover(parent1.chromosome, parent2.chromosome);
      
      if (Math.random() < (mutationRate / 100)) {
        childChromosome = mutate(childChromosome);
      }
      
      newPopulation.push({ chromosome: childChromosome, fitness: Infinity });
    }

    population = newPopulation;
  }

  return bestSolution!.details!;
}

// ============================================
// SIMULATED ANNEALING
// ============================================

/**
 * Run Simulated Annealing
 * EXACT PORT from Apps Script _runSimulatedAnnealingForGroup()
 */
export function runSimulatedAnnealing(
  planks: NestingPlank[],
  materialThicknessKey: string,
  params: SAParams = { iterations: 1000, initialTemperature: 100, coolingRate: 0.995 }
): NestingResult {
  const { iterations, initialTemperature, coolingRate } = params;

  // Initialize
  let currentSolution: Individual = {
    chromosome: shuffleArray([...planks]),
    fitness: Infinity,
  };
  currentSolution.details = evaluateLayout(currentSolution.chromosome, materialThicknessKey);
  currentSolution.fitness = currentSolution.details.fitness;

  let bestSolution = JSON.parse(JSON.stringify(currentSolution));
  let temperature = initialTemperature;

  // Annealing loop
  for (let i = 0; i < iterations; i++) {
    const neighborSolution: Individual = {
      chromosome: mutate(currentSolution.chromosome),
      fitness: Infinity,
    };
    neighborSolution.details = evaluateLayout(neighborSolution.chromosome, materialThicknessKey);
    neighborSolution.fitness = neighborSolution.details.fitness;

    const delta = neighborSolution.fitness - currentSolution.fitness;

    // Accept if better, or probabilistically if worse
    if (delta < 0 || Math.random() < Math.exp(-delta / temperature)) {
      currentSolution = neighborSolution;
    }

    // Update best
    if (currentSolution.fitness < bestSolution.fitness) {
      bestSolution = JSON.parse(JSON.stringify(currentSolution));
    }

    // Cool down
    temperature *= coolingRate;
  }

  return bestSolution.details!;
}

// ============================================
// PARTICLE SWARM OPTIMIZATION
// ============================================

interface Particle {
  chromosome: NestingPlank[];
  velocity: number[];
  personalBest: {
    chromosome: NestingPlank[];
    fitness: number;
    details: NestingResult | null;
  };
}

/**
 * Run Particle Swarm Optimization
 * EXACT PORT from Apps Script _runPsoForGroup()
 */
export function runPSO(
  planks: NestingPlank[],
  materialThicknessKey: string,
  params: PSOParams = { particles: 20, iterations: 50, inertia: 0.7, cognitive: 1.5, social: 1.5 }
): NestingResult {
  const { particles: numParticles, iterations, inertia, cognitive, social } = params;

  // Initialize particles
  const particles: Particle[] = [];
  let globalBest = {
    fitness: Infinity,
    chromosome: [] as NestingPlank[],
    details: null as NestingResult | null,
  };

  for (let i = 0; i < numParticles; i++) {
    const chromosome = shuffleArray([...planks]);
    const details = evaluateLayout(chromosome, materialThicknessKey);
    const particle: Particle = {
      chromosome,
      velocity: Array(planks.length).fill(0).map(() => Math.random()),
      personalBest: {
        chromosome: [...chromosome],
        fitness: details.fitness,
        details,
      },
    };
    particles.push(particle);

    if (particle.personalBest.fitness < globalBest.fitness) {
      globalBest = JSON.parse(JSON.stringify(particle.personalBest));
    }
  }

  // PSO iterations
  for (let iter = 0; iter < iterations; iter++) {
    for (const particle of particles) {
      for (let i = 0; i < particle.chromosome.length; i++) {
        // Update velocity
        particle.velocity[i] = inertia * particle.velocity[i];

        // Cognitive component
        if (Math.random() < cognitive / 10) {
          const pBestItem = particle.personalBest.chromosome[i];
          const currentIndex = particle.chromosome.findIndex(p => p.id === pBestItem.id);
          if (currentIndex !== -1 && currentIndex !== i) {
            [particle.chromosome[i], particle.chromosome[currentIndex]] =
              [particle.chromosome[currentIndex], particle.chromosome[i]];
          }
        }

        // Social component
        if (Math.random() < social / 10) {
          const gBestItem = globalBest.chromosome[i];
          const currentIndex = particle.chromosome.findIndex(p => p.id === gBestItem.id);
          if (currentIndex !== -1 && currentIndex !== i) {
            [particle.chromosome[i], particle.chromosome[currentIndex]] =
              [particle.chromosome[currentIndex], particle.chromosome[i]];
          }
        }
      }

      // Evaluate new position
      const details = evaluateLayout(particle.chromosome, materialThicknessKey);
      const fitness = details.fitness;

      // Update personal best
      if (fitness < particle.personalBest.fitness) {
        particle.personalBest = {
          chromosome: [...particle.chromosome],
          fitness,
          details,
        };
      }

      // Update global best
      if (fitness < globalBest.fitness) {
        globalBest = {
          chromosome: [...particle.chromosome],
          fitness,
          details,
        };
      }
    }
  }

  return globalBest.details!;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function cleanNum(num: number): number {
  return Math.round(num * 100) / 100;
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function orderedCrossover(parent1: NestingPlank[], parent2: NestingPlank[]): NestingPlank[] {
  const size = parent1.length;
  const start = Math.floor(Math.random() * size);
  const end = Math.floor(Math.random() * (size - start)) + start;

  const segment = parent1.slice(start, end + 1);
  const segmentIds = new Set(segment.map(p => p.id));
  const filler = parent2.filter(p => !segmentIds.has(p.id));

  const child: NestingPlank[] = [];
  let fillerIndex = 0;

  for (let i = 0; i < size; i++) {
    if (i >= start && i <= end) {
      child.push(segment[i - start]);
    } else {
      child.push(filler[fillerIndex++]);
    }
  }

  return child;
}

function mutate(chromosome: NestingPlank[]): NestingPlank[] {
  const result = [...chromosome];
  const i = Math.floor(Math.random() * result.length);
  let j = Math.floor(Math.random() * result.length);
  if (i === j) j = (i + 1) % result.length;
  [result[i], result[j]] = [result[j], result[i]];
  return result;
}

function rectsOverlap(r1: FreeRect, r2: { x: number; y: number; width: number; height: number }): boolean {
  const epsilon = 0.01;
  return (
    r1.x < r2.x + r2.width - epsilon &&
    r1.x + r1.width > r2.x + epsilon &&
    r1.y < r2.y + r2.height - epsilon &&
    r1.y + r1.height > r2.y + epsilon
  );
}

function splitFreeRect(
  freeRect: FreeRect,
  placedRect: { x: number; y: number; width: number; height: number },
  spacing: number
): FreeRect[] {
  const newRects: FreeRect[] = [];

  // Define exclusion zone
  const exclusionLeft = cleanNum(placedRect.x - spacing);
  const exclusionTop = cleanNum(placedRect.y - spacing);
  const exclusionRight = cleanNum(placedRect.x + placedRect.width + spacing);
  const exclusionBottom = cleanNum(placedRect.y + placedRect.height + spacing);

  const freeRight = cleanNum(freeRect.x + freeRect.width);
  const freeBottom = cleanNum(freeRect.y + freeRect.height);

  // Top piece
  if (exclusionTop > freeRect.y) {
    newRects.push({
      x: freeRect.x,
      y: freeRect.y,
      width: freeRect.width,
      height: cleanNum(exclusionTop - freeRect.y),
    });
  }

  // Bottom piece
  if (exclusionBottom < freeBottom) {
    newRects.push({
      x: freeRect.x,
      y: exclusionBottom,
      width: freeRect.width,
      height: cleanNum(freeBottom - exclusionBottom),
    });
  }

  // Left piece
  if (exclusionLeft > freeRect.x) {
    newRects.push({
      x: freeRect.x,
      y: freeRect.y,
      width: cleanNum(exclusionLeft - freeRect.x),
      height: freeRect.height,
    });
  }

  // Right piece
  if (exclusionRight < freeRight) {
    newRects.push({
      x: exclusionRight,
      y: freeRect.y,
      width: cleanNum(freeRight - exclusionRight),
      height: freeRect.height,
    });
  }

  return newRects.filter(r => r.width > 0.1 && r.height > 0.1);
}

function pruneRects(rects: FreeRect[]): FreeRect[] {
  const pruned: FreeRect[] = [];

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

    if (!isContained) {
      pruned.push(rects[i]);
    }
  }

  return pruned;
}

/**
 * Transform operations from local to absolute coordinates
 */
function transformOperations(
  operations: PlankOperations,
  plankX: number,
  plankY: number,
  plankWidth: number,
  plankHeight: number,
  isRotated: boolean
): TransformedOperation[] {
  const transformed: TransformedOperation[] = [];

  for (const opType in operations) {
    const isGroove = opType.includes('slot') || opType.includes('groove') || opType.includes('profile');

    operations[opType].forEach((op, index) => {
      let absX: number, absY: number;

      if (!isRotated) {
        absX = plankX + op.x;
        absY = plankY + op.y;
      } else {
        absX = plankX + op.y;
        absY = plankY + (plankHeight - op.x);
      }

      const transformedOp: TransformedOperation = {
        x: absX,
        y: absY,
        z: op.z,
        type: opType,
        isRectangular: isGroove,
        description: `${opType} ${index + 1}`,
      };

      if (isGroove) {
        if (isRotated) {
          transformedOp.width = op.width || 0;
          transformedOp.length = op.length || 0;
        } else {
          transformedOp.width = op.length || 0;
          transformedOp.length = op.width || 0;
        }
      } else {
        transformedOp.diameter = opType.includes('vb') ? 20 : (opType.includes('dowel') ? 5 : 4);
      }

      transformed.push(transformedOp);
    });
  }

  return transformed;
}

// ============================================
// MATERIAL SUMMARY GENERATION
// ============================================

export interface MaterialSummary {
  materialThickness: string;
  baseMaterial: string;
  thickness: number;
  roomNames: string;
  plankCount: number;
  totalArea: number;
  sheetsUsed: number;
  avgAreaPerSheet: number;
  utilization: number;
  totalEdge: number;
}

/**
 * Generate material summary from nesting results
 */
export function generateMaterialSummary(
  nestingResult: NestResultByGroup,
  edgeBindingTotals: { [key: string]: number }
): MaterialSummary[] {
  const SHEET_AREA = SHEET_WIDTH * SHEET_HEIGHT;
  const summaries: MaterialSummary[] = [];

  for (const groupKey in nestingResult) {
    const { planks, result } = nestingResult[groupKey];

    // Extract material and thickness from key
    const match = groupKey.match(/^(.+)_(\d+(?:\.\d+)?)mm$/);
    const baseMaterial = match ? match[1] : groupKey;
    const thickness = match ? parseFloat(match[2]) : 0;

    // Get room names
    const roomSet = new Set<string>();
    result.layout.forEach(plank => {
      const roomMatch = plank.material.match(/\(([^)]+)\)/);
      if (roomMatch) {
        roomSet.add(roomMatch[1].trim());
      }
    });

    // Calculate metrics
    const totalArea = result.layout.reduce(
      (sum, p) => sum + p.placedWidth * p.placedHeight,
      0
    );
    const avgAreaPerSheet = result.sheetsUsed > 0 ? totalArea / result.sheetsUsed : 0;
    const utilization = result.sheetsUsed > 0
      ? (totalArea / (result.sheetsUsed * SHEET_AREA)) * 100
      : 0;

    summaries.push({
      materialThickness: `${baseMaterial} (${thickness}mm)`,
      baseMaterial,
      thickness,
      roomNames: Array.from(roomSet).sort().join(', ') || 'N/A',
      plankCount: result.layout.length,
      totalArea: Math.round(totalArea),
      sheetsUsed: result.sheetsUsed,
      avgAreaPerSheet: Math.round(avgAreaPerSheet),
      utilization: Math.round(utilization * 10) / 10,
      totalEdge: edgeBindingTotals[groupKey] || 0,
    });
  }

  return summaries.sort((a, b) => a.materialThickness.localeCompare(b.materialThickness));
}

// ============================================
// EXPORTS
// ============================================

export {
  SHEET_WIDTH,
  SHEET_HEIGHT,
  MARGIN,
  STANDARD_SPACING,
};
