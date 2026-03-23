/**
 * Nesting Service — plank-list nesting (MaxRects / GA / SA / PSO).
 * Tournament mode is not supported on this endpoint; use POST /api/visualiser/generate with tournament.
 */

import {
  runNesting,
  type AlgorithmType,
  type GAParams,
  type SAParams,
  type PSOParams,
  type PlacedPlank,
} from '../pipeline/nestingEngine';
import type { NestHole, NestResult, PlankListItem } from '../types/visualiser.types';

export interface NestServiceInput {
  plankList: PlankListItem[];
  algorithm: 'bfd' | 'ga' | 'sa' | 'pso' | 'tournament';
  algorithmParams?: {
    populationSize?: number;
    generations?: number;
    mutationRate?: number;
    temperature?: number;
    coolingRate?: number;
    swarmSize?: number;
    iterations?: number;
  };
}

function mapAlgorithm(
  a: NestServiceInput['algorithm']
): { engine: AlgorithmType; note?: string } {
  switch (a) {
    case 'bfd':
      return { engine: 'maxrects' };
    case 'ga':
      return { engine: 'ga' };
    case 'sa':
      return { engine: 'sa' };
    case 'pso':
      return { engine: 'pso' };
    case 'tournament':
      return {
        engine: 'maxrects',
        note:
          'tournament is only available via POST /api/visualiser/generate; using MaxRects (BFD-style) for this request.',
      };
    default:
      return { engine: 'maxrects' };
  }
}

function defaultGaParams(): GAParams {
  return { populationSize: 30, generations: 50, mutationRate: 0.15 };
}

function defaultSaParams(): SAParams {
  return { initialTemperature: 1000, coolingRate: 0.95, iterations: 200 };
}

function defaultPsoParams(): PSOParams {
  return {
    particles: 30,
    iterations: 100,
    inertia: 0.7,
    cognitive: 1.5,
    social: 1.5,
  };
}

function placedPlankToNestResult(p: PlacedPlank, color: string): NestResult {
  const holes: NestHole[] = (p.operations || []).map((op) => ({
    x: op.x,
    y: op.y,
    type: op.type,
    isRectangular: op.isRectangular,
    description: op.description,
    diameter: op.diameter,
    width: op.width,
    length: op.length,
  }));

  return {
    id: p.id,
    name: p.name,
    material: p.material,
    thickness: p.thickness,
    sheetNum: p.sheetNum,
    x: p.x,
    y: p.y,
    width: p.placedWidth,
    height: p.placedHeight,
    rotated: p.rotated,
    color: p.color ?? color,
    originalWidth: p.originalWidth,
    originalHeight: p.originalHeight,
    ebValue: p.ebValue,
    holes,
  };
}

export class NestingService {
  static nest(input: NestServiceInput): NestResult[] {
    const { engine, note } = mapAlgorithm(input.algorithm);
    const params = input.algorithmParams;
    let ga: GAParams | undefined;
    let sa: SAParams | undefined;
    let pso: PSOParams | undefined;

    if (engine === 'ga') {
      ga = {
        ...defaultGaParams(),
        populationSize: params?.populationSize ?? defaultGaParams().populationSize,
        generations: params?.generations ?? defaultGaParams().generations,
        mutationRate: params?.mutationRate ?? defaultGaParams().mutationRate,
      };
    } else if (engine === 'sa') {
      const d = defaultSaParams();
      sa = {
        iterations: params?.iterations ?? d.iterations,
        initialTemperature: params?.temperature ?? d.initialTemperature,
        coolingRate: params?.coolingRate ?? d.coolingRate,
      };
    } else if (engine === 'pso') {
      const d = defaultPsoParams();
      pso = {
        particles: params?.swarmSize ?? d.particles,
        iterations: params?.iterations ?? d.iterations,
        inertia: d.inertia,
        cognitive: d.cognitive,
        social: d.social,
      };
    }

    const merged = engine === 'ga' ? ga : engine === 'sa' ? sa : pso;
    const { allPlacedPlanks } = runNesting(
      input.plankList,
      engine,
      merged,
      undefined
    );

    if (note && process.env.NODE_ENV !== 'production') {
      console.info(`[NestingService] ${note}`);
    }

    const defaultColor = '#94a3b8';
    return allPlacedPlanks.map((p) => placedPlankToNestResult(p, defaultColor));
  }
}
