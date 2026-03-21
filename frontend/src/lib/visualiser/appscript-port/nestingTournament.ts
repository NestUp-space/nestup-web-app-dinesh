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

/**
 * BFD runs first (deterministic, <1s). If it achieves >= SKIP_THRESHOLD
 * utilization with 0 overlaps, the slower metaheuristic configs are skipped.
 * This eliminates the ~3-minute freeze for typical datasets.
 */
const SKIP_THRESHOLD = 70; // percent avg utilization

const BFD_CONFIG: TournamentConfig = {
  name: 'BFD Baseline',
  description: 'Best Fit Decreasing (deterministic)',
  params: { algorithm: 'bfd' },
};

const METAHEURISTIC_CONFIGS: TournamentConfig[] = [
  {
    name: 'GA-light',
    description: 'Genetic Algorithm (fast)',
    params: { algorithm: 'ga', gaPopSize: 15, gaGenerations: 20, gaMutationRate: 2 },
  },
  {
    name: 'SA-light',
    description: 'Simulated Annealing (fast)',
    params: { algorithm: 'sa', saIterations: 300, saTemp: 60, saCoolingRate: 0.995 },
  },
];

function yieldToUI(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Run the nesting tournament asynchronously.
 *
 * Strategy:
 *  1. Run BFD first (~1s, deterministic).
 *  2. If BFD >= SKIP_THRESHOLD utilization and 0 overlaps → return immediately.
 *  3. Otherwise run 2 lighter metaheuristic configs and pick the best.
 */
export async function runNestingTournamentAsync(
  formattedHeader: string[],
  formattedRows: (string | number)[][],
  plankListHeader: string[],
  plankListRows: (string | number)[][],
  onProgress?: TournamentProgressCallback,
): Promise<TournamentResult> {
  const results: TournamentResult[] = [];

  // Phase 1: BFD (fast, deterministic)
  onProgress?.(1, 1 + METAHEURISTIC_CONFIGS.length, BFD_CONFIG.name);
  await yieldToUI();

  const t0 = Date.now();
  const bfdCutlist = createCutlist(
    formattedHeader, formattedRows, plankListHeader, plankListRows, BFD_CONFIG.params,
  );
  const bfd = scoreCutlistResult(bfdCutlist, BFD_CONFIG.name, BFD_CONFIG.description);
  results.push(bfd);
  console.log(
    `[Tournament] BFD completed in ${Date.now() - t0}ms — ` +
    `score: ${bfd.score.toFixed(1)}, util: ${bfd.avgUtilization.toFixed(1)}%, ` +
    `sheets: ${bfd.sheetCount}, overlaps: ${bfd.overlapCount}, unplaced: ${bfd.unplacedCount}`
  );

  if (bfd.avgUtilization >= SKIP_THRESHOLD && bfd.overlapCount === 0 && bfd.unplacedCount === 0) {
    console.log(
      `[Tournament] BFD achieved ${bfd.avgUtilization.toFixed(1)}% utilization ` +
      `(>= ${SKIP_THRESHOLD}%) with 0 overlaps — skipping metaheuristics.`
    );
    return bfd;
  }

  // Phase 2: lightweight metaheuristics (only if BFD was suboptimal)
  console.log(`[Tournament] BFD below threshold (${bfd.avgUtilization.toFixed(1)}% < ${SKIP_THRESHOLD}%) — running metaheuristics...`);
  for (let i = 0; i < METAHEURISTIC_CONFIGS.length; i++) {
    const config = METAHEURISTIC_CONFIGS[i];
    onProgress?.(i + 2, 1 + METAHEURISTIC_CONFIGS.length, config.name);
    await yieldToUI();

    const ct0 = Date.now();
    try {
      const cutlist = createCutlist(
        formattedHeader, formattedRows, plankListHeader, plankListRows, config.params,
      );
      const scored = scoreCutlistResult(cutlist, config.name, config.description);
      results.push(scored);
      console.log(
        `[Tournament] ${config.name} completed in ${Date.now() - ct0}ms — ` +
        `score: ${scored.score.toFixed(1)}, util: ${scored.avgUtilization.toFixed(1)}%, ` +
        `sheets: ${scored.sheetCount}, overlaps: ${scored.overlapCount}, unplaced: ${scored.unplacedCount}`
      );
    } catch (err) {
      console.warn(`[Tournament] ${config.name} failed in ${Date.now() - ct0}ms:`, err);
    }

    await yieldToUI();
  }

  if (results.length === 0) {
    throw new Error('All tournament configurations failed');
  }

  results.sort((a, b) => b.score - a.score);

  console.log(`\n[Tournament] === RESULTS (${results.length} configs completed) ===`);
  results.forEach((r, i) => {
    console.log(
      `  ${i + 1}. ${r.configName} (${r.configDescription}): ` +
      `score=${r.score.toFixed(1)}, util=${r.avgUtilization.toFixed(1)}%, ` +
      `sheets=${r.sheetCount}, overlaps=${r.overlapCount}, unplaced=${r.unplacedCount}`
    );
  });
  const winner = results[0];
  console.log(
    `[Tournament] === WINNER: ${winner.configName} ===\n` +
    `  Score: ${winner.score.toFixed(1)} | Avg Utilization: ${winner.avgUtilization.toFixed(1)}% | ` +
    `Sheets: ${winner.sheetCount} | Overlaps: ${winner.overlapCount} | Unplaced: ${winner.unplacedCount}\n`
  );

  return winner;
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
  const bfdCutlist = createCutlist(
    formattedHeader, formattedRows, plankListHeader, plankListRows, BFD_CONFIG.params,
  );
  const bfd = scoreCutlistResult(bfdCutlist, BFD_CONFIG.name, BFD_CONFIG.description);
  onProgress?.(1, 1, BFD_CONFIG.name);

  if (bfd.avgUtilization >= SKIP_THRESHOLD && bfd.overlapCount === 0 && bfd.unplacedCount === 0) {
    console.log(`[Tournament-sync] BFD: ${bfd.avgUtilization.toFixed(1)}% — skipping metaheuristics`);
    return bfd;
  }

  const results: TournamentResult[] = [bfd];
  for (let i = 0; i < METAHEURISTIC_CONFIGS.length; i++) {
    const config = METAHEURISTIC_CONFIGS[i];
    onProgress?.(i + 2, 1 + METAHEURISTIC_CONFIGS.length, config.name);
    try {
      const cutlist = createCutlist(
        formattedHeader, formattedRows, plankListHeader, plankListRows, config.params,
      );
      results.push(scoreCutlistResult(cutlist, config.name, config.description));
    } catch {
      // Config failed — skip it
    }
  }

  results.sort((a, b) => b.score - a.score);
  console.log(`[Tournament-sync] WINNER: ${results[0].configName} — ${results[0].avgUtilization.toFixed(1)}%`);
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
    - (sheetCount * 5)
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
