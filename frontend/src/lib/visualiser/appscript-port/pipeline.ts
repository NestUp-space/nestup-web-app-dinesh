/**
 * File Generation Pipeline — Orchestrator
 *
 * Wires all AppScript-ported modules in the correct order.
 * Two entry points:
 *   1. From designer walls (Wall[] → raw 2D array → pipeline)
 *   2. From imported raw data (CSV/Excel → 2D array → pipeline)
 *
 * Output: all generated data as structured objects, ready for display/export.
 */

import {
  formatSketchUpData,
  validateOversizedPlanks,
  type EBSettings,
  type FormattedDataResult,
} from './formattedData';
import { createPlankList, type PlankListResult } from './plankList';
import { createCutlist, type CutlistResult, type NestingAlgorithmParams } from './cutlist';
import { runNestingTournament, runNestingTournamentAsync } from './nestingTournament';
import { createMaterialSummary, type MaterialSummaryResult } from './materialSummary';
import { generatePressingList, type PressingListResult, type CustomerDetails } from './pressingList';
import {
  generateMaterialEstimate,
  type MaterialEstimateResult,
} from './materialEstimate';
import {
  generateInputQA,
  extractMaterialDataForQA,
  type InputQAResult,
} from './inputQA';
import { createOutputQA, type OutputQAResult } from './outputQA';

export interface PipelineInput {
  rawValues: unknown[][];
  ebSettings: EBSettings;
  customerDetails?: CustomerDetails;
  hardwareData?: (string | number)[][];
  sftData?: (string | number)[][] | null;
  nestingParams?: NestingAlgorithmParams;
}

export interface PipelineResult {
  formattedData: FormattedDataResult;
  plankList: PlankListResult;
  cutlist: CutlistResult;
  materialSummary: MaterialSummaryResult;
  pressingList: PressingListResult;
  materialEstimate: MaterialEstimateResult;
  inputQA: InputQAResult;
  outputQA: OutputQAResult;
  oversizedWarnings: string[];
  gcode?: unknown;
  winningConfigLabel?: string;
}

export type PipelineProgressCallback = (step: string, message: string) => void;

/**
 * Runs the full file generation pipeline.
 * This is the single entry point — identical logic path regardless of data source.
 */
export function runPipeline(
  input: PipelineInput,
  onProgress?: PipelineProgressCallback
): PipelineResult {
  const { rawValues, ebSettings, customerDetails, hardwareData, sftData, nestingParams } = input;

  // Step 0: Validate oversized planks
  onProgress?.('validate', 'Validating plank sizes...');
  const oversizedCheck = validateOversizedPlanks(rawValues);
  const oversizedWarnings = oversizedCheck.details;

  // Step 1: Format raw data → Formatted_Plank_Data
  onProgress?.('formatted-data', 'Formatting plank data...');
  const formattedData = formatSketchUpData(rawValues, ebSettings);

  // Step 2: Formatted_Plank_Data → Plank List
  onProgress?.('plank-list', 'Creating plank list...');
  const plankList = createPlankList(formattedData.header, formattedData.rows);

  // Step 3: Formatted_Plank_Data + Plank List → Cutlist (Nest Result)
  let cutlist: CutlistResult;
  let winningConfigLabel: string | undefined;

  if (nestingParams?.algorithm === 'tournament') {
    onProgress?.('cutlist', 'Running nesting tournament (multiple configurations)...');
    const tournamentResult = runNestingTournament(
      formattedData.header,
      formattedData.rows,
      plankList.header,
      plankList.rows,
      (idx, total, name) => onProgress?.('cutlist', `Tournament: config ${idx}/${total} — ${name}`),
    );
    cutlist = tournamentResult.cutlist;
    winningConfigLabel = `${tournamentResult.configName} (${tournamentResult.configDescription}) — ${tournamentResult.avgUtilization.toFixed(1)}% avg utilization, ${tournamentResult.sheetCount} sheets`;
  } else {
    onProgress?.('cutlist', 'Running nesting algorithm...');
    cutlist = createCutlist(
      formattedData.header,
      formattedData.rows,
      plankList.header,
      plankList.rows,
      nestingParams
    );
  }

  // Step 4: Nest Result + Plank List → Material Summary
  onProgress?.('material-summary', 'Creating material summary...');
  const materialSummary = createMaterialSummary(
    cutlist.header,
    cutlist.rows,
    plankList.header,
    plankList.rows
  );

  // Step 5: Material Summary + Customer Details → Pressing List
  onProgress?.('pressing-list', 'Generating pressing list...');
  const pressingList = generatePressingList(
    materialSummary.header,
    materialSummary.rows,
    customerDetails
  );

  // Step 6: Material Summary + Hardware → Material Estimate
  onProgress?.('material-estimate', 'Generating material estimate...');
  const hw = hardwareData && hardwareData.length > 0
    ? hardwareData
    : [['Description', 'Quantity']];
  const materialEstimate = generateMaterialEstimate(
    materialSummary.header,
    materialSummary.rows,
    hw,
    sftData
  );

  // Step 7: Customer Details + Material Estimate → Input QA
  onProgress?.('input-qa', 'Generating Input QA...');
  const materialDataForQA = extractMaterialDataForQA(materialEstimate);
  const customerDetailsForQA: Record<string, string> = {};
  if (customerDetails) {
    Object.entries(customerDetails).forEach(([k, v]) => {
      customerDetailsForQA[k] = String(v);
    });
  }
  const inputQA = generateInputQA(customerDetailsForQA, materialDataForQA);

  // Step 8: Plank List + Formatted_Plank_Data + Customer Details → Output QA
  onProgress?.('output-qa', 'Generating Output QA...');
  const outputQA = createOutputQA(
    plankList.header,
    plankList.rows,
    formattedData.header,
    formattedData.rows,
    customerDetailsForQA
  );

  onProgress?.('complete', 'All files generated successfully!');

  return {
    formattedData,
    plankList,
    cutlist,
    materialSummary,
    pressingList,
    materialEstimate,
    inputQA,
    outputQA,
    oversizedWarnings,
    winningConfigLabel,
  };
}

function yieldToUI(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Async version of runPipeline that yields between steps.
 * Uses async tournament when algorithm is 'tournament'.
 * Keeps the UI responsive during long computations.
 */
export async function runPipelineAsync(
  input: PipelineInput,
  onProgress?: PipelineProgressCallback
): Promise<PipelineResult> {
  const { rawValues, ebSettings, customerDetails, hardwareData, sftData, nestingParams } = input;

  onProgress?.('validate', 'Validating plank sizes...');
  const oversizedCheck = validateOversizedPlanks(rawValues);
  const oversizedWarnings = oversizedCheck.details;
  await yieldToUI();

  onProgress?.('formatted-data', 'Formatting plank data...');
  await yieldToUI();
  const formattedData = formatSketchUpData(rawValues, ebSettings);
  await yieldToUI();

  onProgress?.('plank-list', 'Creating plank list...');
  await yieldToUI();
  const plankList = createPlankList(formattedData.header, formattedData.rows);
  await yieldToUI();

  let cutlist: CutlistResult;
  let winningConfigLabel: string | undefined;

  if (nestingParams?.algorithm === 'tournament') {
    onProgress?.('cutlist', 'Running nesting tournament (multiple configurations)...');
    await yieldToUI();
    const tournamentResult = await runNestingTournamentAsync(
      formattedData.header,
      formattedData.rows,
      plankList.header,
      plankList.rows,
      (idx, total, name) => onProgress?.('cutlist', `Tournament: config ${idx}/${total} — ${name}`),
    );
    cutlist = tournamentResult.cutlist;
    winningConfigLabel = `${tournamentResult.configName} (${tournamentResult.configDescription}) — ${tournamentResult.avgUtilization.toFixed(1)}% avg utilization, ${tournamentResult.sheetCount} sheets`;
  } else {
    onProgress?.('cutlist', 'Running nesting algorithm...');
    await yieldToUI();
    cutlist = createCutlist(
      formattedData.header,
      formattedData.rows,
      plankList.header,
      plankList.rows,
      nestingParams
    );
  }
  await yieldToUI();

  onProgress?.('material-summary', 'Creating material summary...');
  await yieldToUI();
  const materialSummary = createMaterialSummary(
    cutlist.header, cutlist.rows, plankList.header, plankList.rows
  );
  await yieldToUI();

  onProgress?.('pressing-list', 'Generating pressing list...');
  const pressingList = generatePressingList(
    materialSummary.header, materialSummary.rows, customerDetails
  );
  await yieldToUI();

  onProgress?.('material-estimate', 'Generating material estimate...');
  const hw = hardwareData && hardwareData.length > 0 ? hardwareData : [['Description', 'Quantity']];
  const materialEstimate = generateMaterialEstimate(
    materialSummary.header, materialSummary.rows, hw, sftData
  );
  await yieldToUI();

  onProgress?.('input-qa', 'Generating Input QA...');
  const materialDataForQA = extractMaterialDataForQA(materialEstimate);
  const customerDetailsForQA: Record<string, string> = {};
  if (customerDetails) {
    Object.entries(customerDetails).forEach(([k, v]) => {
      customerDetailsForQA[k] = String(v);
    });
  }
  const inputQA = generateInputQA(customerDetailsForQA, materialDataForQA);
  await yieldToUI();

  onProgress?.('output-qa', 'Generating Output QA...');
  const outputQA = createOutputQA(
    plankList.header, plankList.rows,
    formattedData.header, formattedData.rows,
    customerDetailsForQA
  );

  onProgress?.('complete', 'All files generated successfully!');

  return {
    formattedData, plankList, cutlist, materialSummary, pressingList,
    materialEstimate, inputQA, outputQA, oversizedWarnings, winningConfigLabel,
  };
}

/**
 * Converts RawDataRow[] (from the web app's designer) into a 2D array
 * with the same headers the AppScript expects.
 *
 * This is the bridge between the existing designer data model and the
 * AppScript-ported pipeline.
 */
export function convertDesignerRawDataTo2D(
  rawDataRows: {
    entityName?: string;
    entity_name?: string;
    level?: number;
    material?: string;
    roomName?: string;
    room_name?: string;
    unitLocation?: string;
    unit_location?: string;
    boxModel?: string;
    box_model?: string;
    boxType?: string;
    box_type?: string;
    lenX?: number;
    lenY?: number;
    lenZ?: number;
    x?: number;
    y?: number;
    z?: number;
    plankId?: string;
    plank_id?: string;
    [key: string]: unknown;
  }[]
): unknown[][] {
  const headers = [
    'entity_name',
    'Level',
    'material',
    'Room_name',
    'Unit_location',
    'box_model',
    'box_type',
    'LenX',
    'LenY',
    'LenZ',
    'X',
    'Y',
    'Z',
    'plank_id',
  ];

  const rows: unknown[][] = [headers];

  for (const row of rawDataRows) {
    rows.push([
      row.entityName ?? row.entity_name ?? '',
      row.level ?? '',
      row.material ?? '',
      row.roomName ?? row.room_name ?? '',
      row.unitLocation ?? row.unit_location ?? '',
      row.boxModel ?? row.box_model ?? '',
      row.boxType ?? row.box_type ?? '',
      row.lenX ?? 0,
      row.lenY ?? 0,
      row.lenZ ?? 0,
      row.x ?? 0,
      row.y ?? 0,
      row.z ?? 0,
      row.plankId ?? row.plank_id ?? '',
    ]);
  }

  return rows;
}
