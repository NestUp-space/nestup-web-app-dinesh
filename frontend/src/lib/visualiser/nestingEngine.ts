/**
 * Cutlist Nesting Engine
 * Implements MaxRects bin packing with optimization algorithms (GA, SA, PSO)
 * Ported from Cutlist.js
 */

import type {
  PlankInput,
  FreeRect,
  NestingResult,
  GAParams,
  SAParams,
  PSOParams,
} from "@/types/visualiser";

// ============================================
// Constants
// ============================================

const SHEET_WIDTH = 1220;
const SHEET_HEIGHT = 2440;
const STANDARD_SPACING = 10;
const SMALL_PLANK_SPACING = 20;
const SMALL_PLANK_THRESHOLD = 150;
const MARGIN = 10;

// Scoring weights for Bottom-Left optimization
const POSITION_WEIGHT = 2.0;
const FIT_WEIGHT = 1.0;
const BOTTOM_LEFT_BIAS = 0.5;

// ============================================
// Utility Functions
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

function rectsOverlap(r1: FreeRect, r2: FreeRect): boolean {
  const epsilon = 0.01;
  return (
    r1.x < r2.x + r2.width - epsilon &&
    r1.x + r1.width > r2.x + epsilon &&
    r1.y < r2.y + r2.height - epsilon &&
    r1.y + r1.height > r2.y + epsilon
  );
}

function splitFreeRect(freeRect: FreeRect, placedRect: FreeRect, spacing: number): FreeRect[] {
  const newRects: FreeRect[] = [];

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

  return newRects.filter((r) => r.width > 0.1 && r.height > 0.1);
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
    if (!isContained) pruned.push(rects[i]);
  }
  return pruned;
}

// ============================================
// Core Nesting Engine (MaxRects)
// ============================================

interface Sheet {
  sheetNum: number;
  freeRects: FreeRect[];
}

interface PlacementResult {
  score: number;
  sheetIndex: number;
  rectIndex: number;
  orientation: { w: number; h: number; rotated: boolean } | null;
}

export function evaluateLayout(planksOrder: PlankInput[], materialThicknessKey: string): NestingResult {
  const resultsLayout: any[][] = [];
  const sheets: Sheet[] = [];
  let totalUsedArea = 0;
  const unplacedPlanks: PlankInput[] = [];

  for (const plank of planksOrder) {
    let globalBestFit: PlacementResult = {
      score: Infinity,
      sheetIndex: -1,
      rectIndex: -1,
      orientation: null,
    };

    // Rotation options
    const options: { w: number; h: number; rotated: boolean }[] = [
      { w: plank.width, h: plank.height, rotated: false },
    ];
    if (plank.grain !== "Y" && plank.grain !== "YES") {
      options.push({ w: plank.height, h: plank.width, rotated: true });
    }

    // Find best fit on existing sheets
    for (let i = 0; i < sheets.length; i++) {
      const sheet = sheets[i];
      for (let j = 0; j < sheet.freeRects.length; j++) {
        const rect = sheet.freeRects[j];
        for (const opt of options) {
          if (opt.w <= rect.width + 0.01 && opt.h <= rect.height + 0.01) {
            // Bottom-left scoring
            const normalizedX = rect.x / SHEET_WIDTH;
            const normalizedY = rect.y / SHEET_HEIGHT;
            const positionScore = (normalizedX + normalizedY) * POSITION_WEIGHT;

            const wastedW = rect.width - opt.w;
            const wastedH = rect.height - opt.h;
            const fitScore = (Math.min(wastedW, wastedH) / 100) * FIT_WEIGHT;

            const distanceFromOrigin = Math.sqrt(rect.x * rect.x + rect.y * rect.y);
            const cornerBonus =
              (distanceFromOrigin /
                Math.sqrt(SHEET_WIDTH * SHEET_WIDTH + SHEET_HEIGHT * SHEET_HEIGHT)) *
              BOTTOM_LEFT_BIAS;

            const score = positionScore + fitScore + cornerBonus;

            if (score < globalBestFit.score) {
              globalBestFit = { score, sheetIndex: i, rectIndex: j, orientation: opt };
            }
          }
        }
      }
    }

    // Need new sheet?
    let targetSheetIndex = globalBestFit.sheetIndex;
    if (targetSheetIndex === -1) {
      const newSheetNum = sheets.length + 1;
      const newSheet: Sheet = {
        sheetNum: newSheetNum,
        freeRects: [
          {
            x: MARGIN,
            y: MARGIN,
            width: SHEET_WIDTH - 2 * MARGIN,
            height: SHEET_HEIGHT - 2 * MARGIN,
          },
        ],
      };
      sheets.push(newSheet);
      targetSheetIndex = sheets.length - 1;

      // Find best fit on new sheet
      const newSheetRect = newSheet.freeRects[0];
      let bestNewSheetScore = Infinity;
      for (const opt of options) {
        if (opt.w <= newSheetRect.width && opt.h <= newSheetRect.height) {
          const score = 0; // Origin is always best
          if (score < bestNewSheetScore) {
            globalBestFit = {
              score,
              sheetIndex: targetSheetIndex,
              rectIndex: 0,
              orientation: opt,
            };
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
    if (!orientation) continue;

    const targetSheet = sheets[targetSheetIndex];
    const targetRect = targetSheet.freeRects[rectIndex];

    const placedRect: FreeRect = {
      x: cleanNum(targetRect.x),
      y: cleanNum(targetRect.y),
      width: cleanNum(orientation.w),
      height: cleanNum(orientation.h),
    };

    // Calculate original dimensions with edge banding
    const eb = plank.ebValue || 0;
    const origW = orientation.w + 2 * eb;
    const origH = orientation.h + 2 * eb;

    const baseInfo = [
      plank.id,
      plank.name,
      plank.material,
      plank.thickness,
      targetSheet.sheetNum,
      placedRect.x.toFixed(1),
      placedRect.y.toFixed(1),
      orientation.w.toFixed(1),
      orientation.h.toFixed(1),
      orientation.rotated ? "Yes" : "No",
      origW.toFixed(1),
      origH.toFixed(1),
      eb,
    ];

    resultsLayout.push(baseInfo);
    totalUsedArea += orientation.w * orientation.h;

    // Update free rectangles
    const currentSpacing =
      orientation.w < SMALL_PLANK_THRESHOLD || orientation.h < SMALL_PLANK_THRESHOLD
        ? SMALL_PLANK_SPACING
        : STANDARD_SPACING;

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
    targetSheet.freeRects.sort((a, b) => a.x + a.y - (b.x + b.y));
  }

  const sheetsUsed = sheets.length;
  const sheetArea = (SHEET_WIDTH - 2 * MARGIN) * (SHEET_HEIGHT - 2 * MARGIN);
  const totalSheetArea = sheetsUsed * sheetArea;
  const utilization = totalSheetArea > 0 ? (totalUsedArea / totalSheetArea) * 100 : 0;

  // Calculate largest waste area
  let maxWasteArea = 0;
  sheets.forEach((sheet) => {
    sheet.freeRects.forEach((rect) => {
      const area = rect.width * rect.height;
      if (area > maxWasteArea) maxWasteArea = area;
    });
  });

  const wasteBonus = (maxWasteArea / sheetArea) * 10;
  const fitness =
    sheetsUsed * 1000 + (100 - utilization) + unplacedPlanks.length * 10000 - wasteBonus;

  return {
    fitness,
    layout: resultsLayout,
    sheetsUsed,
    unplacedCount: unplacedPlanks.length,
    utilization: utilization.toFixed(2),
    maxWasteArea: maxWasteArea.toFixed(0),
  };
}

// ============================================
// Genetic Algorithm
// ============================================

interface GAIndividual {
  chromosome: PlankInput[];
  fitness: number;
  details: NestingResult | null;
}

function orderedCrossover(parent1: PlankInput[], parent2: PlankInput[]): PlankInput[] {
  const size = parent1.length;
  const start = Math.floor(Math.random() * size);
  const end = Math.floor(Math.random() * (size - start)) + start;
  const segment = parent1.slice(start, end + 1);
  const segmentIds = new Set(segment.map((p) => p.id));
  const filler = parent2.filter((p) => !segmentIds.has(p.id));
  const child: PlankInput[] = [];
  let fillerIndex = 0;
  for (let i = 0; i < size; i++) {
    if (i >= start && i <= end) child.push(segment[i - start]);
    else child.push(filler[fillerIndex++]);
  }
  return child;
}

function mutate(chromosome: PlankInput[]): PlankInput[] {
  const newChromosome = [...chromosome];
  const i = Math.floor(Math.random() * newChromosome.length);
  let j = Math.floor(Math.random() * newChromosome.length);
  if (i === j) j = (i + 1) % newChromosome.length;
  [newChromosome[i], newChromosome[j]] = [newChromosome[j], newChromosome[i]];
  return newChromosome;
}

export function runGeneticAlgorithm(
  planks: PlankInput[],
  params: GAParams,
  materialKey: string,
  onProgress?: (progress: number) => void
): NestingResult {
  const { populationSize, generations, mutationRate } = params;

  let population: GAIndividual[] = [];
  for (let i = 0; i < populationSize; i++) {
    population.push({
      chromosome: shuffleArray([...planks]),
      fitness: Infinity,
      details: null,
    });
  }

  let bestSolution: GAIndividual | null = null;

  for (let gen = 0; gen < generations; gen++) {
    // Evaluate fitness
    for (const individual of population) {
      if (individual.fitness === Infinity) {
        const result = evaluateLayout(individual.chromosome, materialKey);
        individual.fitness = result.fitness;
        individual.details = result;
      }
    }

    // Sort by fitness
    population.sort((a, b) => a.fitness - b.fitness);

    // Update best
    if (!bestSolution || population[0].fitness < bestSolution.fitness) {
      bestSolution = { ...population[0] };
    }

    // Selection and reproduction
    const eliteCount = Math.max(2, Math.floor(populationSize * 0.1));
    const newPopulation = population.slice(0, eliteCount);

    while (newPopulation.length < populationSize) {
      const parent1 = population[Math.floor(Math.random() * (populationSize / 2))];
      const parent2 = population[Math.floor(Math.random() * (populationSize / 2))];
      let childChromosome = orderedCrossover(parent1.chromosome, parent2.chromosome);
      if (Math.random() < mutationRate / 100) {
        childChromosome = mutate(childChromosome);
      }
      newPopulation.push({
        chromosome: childChromosome,
        fitness: Infinity,
        details: null,
      });
    }

    population = newPopulation;
    onProgress?.((gen / generations) * 100);
  }

  return bestSolution!.details!;
}

// ============================================
// Simulated Annealing
// ============================================

export function runSimulatedAnnealing(
  planks: PlankInput[],
  params: SAParams,
  materialKey: string,
  onProgress?: (progress: number) => void
): NestingResult {
  const { iterations, initialTemp, coolingRate } = params;

  let currentSolution = {
    chromosome: shuffleArray([...planks]),
    fitness: 0,
    details: evaluateLayout(shuffleArray([...planks]), materialKey),
  };
  currentSolution.fitness = currentSolution.details.fitness;

  let bestSolution = { ...currentSolution };
  let temperature = initialTemp;

  for (let i = 0; i < iterations; i++) {
    const neighborChromosome = mutate(currentSolution.chromosome);
    const neighborDetails = evaluateLayout(neighborChromosome, materialKey);
    const neighborFitness = neighborDetails.fitness;

    const delta = neighborFitness - currentSolution.fitness;
    if (delta < 0 || Math.random() < Math.exp(-delta / temperature)) {
      currentSolution = {
        chromosome: neighborChromosome,
        fitness: neighborFitness,
        details: neighborDetails,
      };
    }

    if (currentSolution.fitness < bestSolution.fitness) {
      bestSolution = { ...currentSolution };
    }

    temperature *= coolingRate;
    onProgress?.((i / iterations) * 100);
  }

  return bestSolution.details;
}

// ============================================
// Particle Swarm Optimization
// ============================================

interface PSOParticle {
  chromosome: PlankInput[];
  velocity: number[];
  personalBest: {
    chromosome: PlankInput[];
    fitness: number;
    details: NestingResult;
  };
}

export function runParticleSwarmOptimization(
  planks: PlankInput[],
  params: PSOParams,
  materialKey: string,
  onProgress?: (progress: number) => void
): NestingResult {
  const { particles: numParticles, iterations, inertia, cognitive, social } = params;

  const particles: PSOParticle[] = [];
  let globalBest = {
    chromosome: [] as PlankInput[],
    fitness: Infinity,
    details: null as NestingResult | null,
  };

  // Initialize particles
  for (let i = 0; i < numParticles; i++) {
    const chromosome = shuffleArray([...planks]);
    const details = evaluateLayout(chromosome, materialKey);
    const particle: PSOParticle = {
      chromosome,
      velocity: Array(planks.length)
        .fill(0)
        .map(() => Math.random()),
      personalBest: { chromosome: [...chromosome], fitness: details.fitness, details },
    };
    particles.push(particle);

    if (particle.personalBest.fitness < globalBest.fitness) {
      globalBest = { ...particle.personalBest };
    }
  }

  // Iterate
  for (let iter = 0; iter < iterations; iter++) {
    for (const particle of particles) {
      // Update velocity and position
      for (let i = 0; i < particle.chromosome.length; i++) {
        particle.velocity[i] = inertia * particle.velocity[i];

        if (Math.random() < cognitive) {
          const pBestItem = particle.personalBest.chromosome[i];
          const currentIndex = particle.chromosome.findIndex((p) => p.id === pBestItem.id);
          if (currentIndex !== -1 && currentIndex !== i) {
            [particle.chromosome[i], particle.chromosome[currentIndex]] = [
              particle.chromosome[currentIndex],
              particle.chromosome[i],
            ];
          }
        }

        if (Math.random() < social && globalBest.chromosome[i]) {
          const gBestItem = globalBest.chromosome[i];
          const currentIndex = particle.chromosome.findIndex((p) => p.id === gBestItem.id);
          if (currentIndex !== -1 && currentIndex !== i) {
            [particle.chromosome[i], particle.chromosome[currentIndex]] = [
              particle.chromosome[currentIndex],
              particle.chromosome[i],
            ];
          }
        }
      }

      // Evaluate
      const details = evaluateLayout(particle.chromosome, materialKey);
      const fitness = details.fitness;

      if (fitness < particle.personalBest.fitness) {
        particle.personalBest = {
          chromosome: [...particle.chromosome],
          fitness,
          details,
        };
      }

      if (fitness < globalBest.fitness) {
        globalBest = {
          chromosome: [...particle.chromosome],
          fitness,
          details,
        };
      }
    }

    onProgress?.((iter / iterations) * 100);
  }

  return globalBest.details!;
}

// ============================================
// Main Entry Point
// ============================================

export type NestingAlgorithm = "maxrects" | "ga" | "sa" | "pso";

export interface NestingOptions {
  algorithm: NestingAlgorithm;
  gaParams?: GAParams;
  saParams?: SAParams;
  psoParams?: PSOParams;
  onProgress?: (progress: number) => void;
}

export function runNesting(
  planks: PlankInput[],
  materialKey: string,
  options: NestingOptions
): NestingResult {
  const { algorithm, gaParams, saParams, psoParams, onProgress } = options;

  // Sort planks by area (Best Fit Decreasing)
  const sortedPlanks = [...planks].sort(
    (a, b) => b.width * b.height - (a.width * a.height)
  );

  switch (algorithm) {
    case "ga":
      if (!gaParams) throw new Error("GA parameters required");
      return runGeneticAlgorithm(sortedPlanks, gaParams, materialKey, onProgress);
    case "sa":
      if (!saParams) throw new Error("SA parameters required");
      return runSimulatedAnnealing(sortedPlanks, saParams, materialKey, onProgress);
    case "pso":
      if (!psoParams) throw new Error("PSO parameters required");
      return runParticleSwarmOptimization(sortedPlanks, psoParams, materialKey, onProgress);
    case "maxrects":
    default:
      return evaluateLayout(sortedPlanks, materialKey);
  }
}
