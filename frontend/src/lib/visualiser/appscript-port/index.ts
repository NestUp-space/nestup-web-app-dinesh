/**
 * AppScript-to-TypeScript Port — Barrel Export
 *
 * All file generation modules ported 100% from AppScript.
 * Only I/O has been altered: Sheets API → in-memory arrays.
 *
 * Pipeline order (same as AppScript):
 *   1. formatSketchUpData (raw data → Formatted_Plank_Data)
 *   2. createPlankList (Formatted_Plank_Data → Plank List)
 *   3. createCutlist (Formatted_Plank_Data + Plank List → Nest Result)
 *   4. createMaterialSummary (Nest Result + Plank List → Material Summary)
 *   5. generatePressingList (Material Summary + Customer Details → Pressing List)
 *   6. generateMaterialEstimate (Material Summary + Hardware → Material Estimate)
 *   7. generateInputQA (Customer Details + Material Estimate → Input QA)
 *   8. createOutputQA (Plank List + Formatted_Plank_Data + Customer Details → Output QA)
 *   9. buildInstallationGuide (raw data → Visualization hierarchy)
 */

export {
  formatSketchUpData,
  validateOversizedPlanks,
  extractMaterialsFromRawData,
  findColumnIndex,
} from './formattedData';
export type { EBSettings, FormattedDataResult } from './formattedData';

export { createPlankList } from './plankList';
export type { PlankListResult } from './plankList';

export { createCutlist, getPlanksFromData } from './cutlist';
export type { CutlistResult, NestingAlgorithmParams } from './cutlist';

export { createMaterialSummary } from './materialSummary';
export type { MaterialSummaryResult } from './materialSummary';

export { generatePressingList } from './pressingList';
export type { PressingListResult, CustomerDetails } from './pressingList';

export { generateMaterialEstimate } from './materialEstimate';
export type { MaterialEstimateResult } from './materialEstimate';

export { generateInputQA, extractMaterialDataForQA } from './inputQA';
export type { InputQAResult, InputQASection, MaterialEstimateForQA } from './inputQA';

export { createOutputQA } from './outputQA';
export type { OutputQAResult } from './outputQA';

export {
  buildInstallationGuide,
  enrichMaterialFromPipeline,
  MATERIAL_COLOR_MAP,
  updatePlankPositionInData,
  updatePlankDimensionsInData,
  updateBoxPositionInData,
} from './installationGuide';
export type {
  VisualizationData,
  WallData,
  BoxData,
  PlankData,
  MaterialLegendItem,
} from './installationGuide';

export { runPipeline, runPipelineAsync, convertDesignerRawDataTo2D } from './pipeline';
export type { PipelineInput, PipelineResult, PipelineProgressCallback } from './pipeline';

export {
  rows2DToObjects,
  pipelineFormattedToStore,
  pipelinePlankListToStore,
  pipelineNestToStore,
  pipelineMaterialSummaryToStore,
} from './resultConverters';

export { exportToCSV, exportToExcel, exportAllAsZip } from './exportUtils';

export { applyCutlistModifications } from './cutlistEditor';
export type {
  CutlistData,
  CutlistModification,
  LayoutPlank,
  ApplyCutlistModificationsOptions,
} from './cutlistEditor';

export { syncPlankIdsToRaw } from './syncPlankIdsToRaw';
export type { FormattedData2D } from './syncPlankIdsToRaw';

export { generateSmartCutSequence } from './cutSequence';

export { runNestingTournament, runNestingTournamentAsync } from './nestingTournament';
export type { TournamentResult, TournamentProgressCallback } from './nestingTournament';

export {
  generateGCodeFiles,
  buildGCodeZip,
  downloadGCodeZip,
  getNestDataFromRows,
} from './gcode';
export type { GCodeResult, GCodeConfig, GCodePlank } from './gcode';
