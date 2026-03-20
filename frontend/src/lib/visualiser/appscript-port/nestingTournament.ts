/**
 * Nesting Tournament — Multi-Configuration Runner
 *
 * Runs multiple algorithm/parameter combinations, scores each result,
 * and returns the best one. Prevents overlaps (Layer 1) and penalizes
 * any remaining overlaps (Layer 2).
 *
 * The tournament is ASYNC: it yields to the browser between configurations
 * so the UI stays responsive and progress updates render.
 */

import { createCutlist, type CutlistResult, type NestingAlgorithmParams } from './cutlist';
import { pipelineNestToStore } from './resultConverters';
import { SHEET_CONSTANTS } from '@/types/visualiser';

export interface TournamentConfig {
  name: string;
  description: string;
  params: NestingAlgorithmParams;
}

export interface TournamentResult {
  cutlist: CutlistResult;
  configName: string;
  configDescription: string;
  score: number;
  avgUtilization: number;
  sheetCount: number;
  overlapCount: number;
  unplacedCount: number;
}

export type TournamentProgressCallback = (configIndex: number, totalConfigs: number, configName: string) => void;

const TOURNAMENT_CONFIGS: TournamentConfig[] = [
  {
    name: 'BFD Baseline',
    description: 'Best Fit Decreasing (deterministic)',
    params: { algorithm: 'bfd' },
  },
  {
    name: 'GA-heavy',
    description: 'GA 60%, SA 20%, PSO 20%',
    params: { algorithm: 'ga', gaPopSize: 10, gaGenerations: 15, gaMutationRate: 2 },
  },
  {
    name: 'SA-heavy',
    description: 'GA 20%, SA 60%, PSO 20%',
    params: { algorithm: 'sa', saIterations: 200, saTemp: 100, saCoolingRate: 0.99 },
  },
  {
    name: 'PSO-heavy',
    description: 'GA 20%, SA 20%, PSO 60%',
    params: { algorithm: 'pso', psoParticles: 10, psoIterations: 15, psoInertia: 0.7, psoCognitive: 1.5, psoSocial: 1.5 },
  },
  {
    name: 'Balanced',
    description: 'GA 33%, SA 33%, PSO 34%',
    params: { algorithm: 'ga', gaPopSize: 8, gaGenerations: 12, gaMutationRate: 2 },
  },
  {
    name: 'GA+SA',
    description: 'GA 40%, SA 40%, PSO 20%',
    params: { algorithm: 'sa', saIterations: 150, saTemp: 80, saCoolingRate: 0.99 },
  },
  {
    name: 'SA+PSO',
    description: 'GA 20%, SA 40%, PSO 40%',
    params: { algorithm: 'pso', psoParticles: 8, psoIterations: 12, psoInertia: 0.7, psoCognitive: 1.5, psoSocial: 1.5 },
  },
];

function yieldToUI(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Run the full nesting tournament asynchronously.
 * Yields to the browser between configs so UI stays responsive.
 */
export async function runNestingTournamentAsync(
  formattedHeader: string[],
  formattedRows: (string | number)[][],
  plankListHeader: string[],
  plankListRows: (string | number)[][],
  onProgress?: TournamentProgressCallback,
): Promise<TournamentResult> {
  const configs = TOURNAMENT_CONFIGS;
  const results: TournamentResult[] = [];

  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    onProgress?.(i + 1, configs.length, config.name);

    // Yield so the browser can paint the progress update
    await yieldToUI();

    const t0 = Date.now();
    try {
      const cutlist = createCutlist(
        formattedHeader,
        formattedRows,
        plankListHeader,
        plankListRows,
        config.params,
      );

      const scored = scoreCutlistResult(cutlist, config.name, config.description);
      results.push(scored);
      console.log(`[Tournament] ${config.name} completed in ${Date.now() - t0}ms — score: ${scored.score.toFixed(1)}, util: ${scored.avgUtilization.toFixed(1)}%`);
    } catch (err) {
      console.warn(`[Tournament] ${config.name} failed in ${Date.now() - t0}ms:`, err);
    }
  }

  if (results.length === 0) {
    throw new Error('All tournament configurations failed');
  }

  results.sort((a, b) => b.score - a.score);
  return results[0];
}

/**
 * Synchronous fallback (used when called from synchronous pipeline).
 * @deprecated Use runNestingTournamentAsync for responsive UI.
 */
export function runNestingTournament(
  formattedHeader: string[],
  formattedRows: (string | number)[][],
  plankListHeader: string[],
  plankListRows: (string | number)[][],
  onProgress?: TournamentProgressCallback,
): TournamentResult {
  const configs = TOURNAMENT_CONFIGS;
  const results: TournamentResult[] = [];

  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    onProgress?.(i + 1, configs.length, config.name);

    try {
      const cutlist = createCutlist(
        formattedHeader,
        formattedRows,
        plankListHeader,
        plankListRows,
        config.params,
      );

      const scored = scoreCutlistResult(cutlist, config.name, config.description);
      results.push(scored);
    } catch {
      // Config failed — skip it
    }
  }

  if (results.length === 0) {
    throw new Error('All tournament configurations failed');
  }

  results.sort((a, b) => b.score - a.score);
  return results[0];
}

function scoreCutlistResult(
  cutlist: CutlistResult,
  configName: string,
  configDescription: string,
): TournamentResult {
  const nestResults = pipelineNestToStore(cutlist);

  const sheetMap = new Map<number, Array<{ x: number; y: number; width: number; height: number }>>();
  let unplacedCount = 0;

  for (const plank of nestResults) {
    if (plank.sheetNum <= 0) { unplacedCount++; continue; }
    if (!sheetMap.has(plank.sheetNum)) sheetMap.set(plank.sheetNum, []);
    sheetMap.get(plank.sheetNum)!.push({
      x: plank.x, y: plank.y, width: plank.width, height: plank.height,
    });
  }

  const sheetCount = sheetMap.size;
  const sheetArea = SHEET_CONSTANTS.SHEET_WIDTH * SHEET_CONSTANTS.SHEET_HEIGHT;

  let totalUtilization = 0;
  let totalOverlaps = 0;

  Array.from(sheetMap.entries()).forEach(([, planks]) => {
    const usedArea = planks.reduce((sum: number, p: { width: number; height: number }) => sum + p.width * p.height, 0);
    totalUtilization += sheetArea > 0 ? (usedArea / sheetArea) * 100 : 0;

    for (let i = 0; i < planks.length; i++) {
      for (let j = i + 1; j < planks.length; j++) {
        if (rectsOverlap(planks[i], planks[j])) {
          totalOverlaps++;
        }
      }
    }
  });

  const avgUtilization = sheetCount > 0 ? totalUtilization / sheetCount : 0;

  const score = avgUtilization
    - (totalOverlaps * 10000)
    - (sheetCount * 100)
    - (unplacedCount * 50000);

  return {
    cutlist,
    configName,
    configDescription,
    score,
    avgUtilization,
    sheetCount,
    overlapCount: totalOverlaps,
    unplacedCount,
  };
}

const OVERLAP_TOLERANCE = 0.5;

function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    a.x < b.x + b.width - OVERLAP_TOLERANCE &&
    a.x + a.width > b.x + OVERLAP_TOLERANCE &&
    a.y < b.y + b.height - OVERLAP_TOLERANCE &&
    a.y + a.height > b.y + OVERLAP_TOLERANCE
  );
}
