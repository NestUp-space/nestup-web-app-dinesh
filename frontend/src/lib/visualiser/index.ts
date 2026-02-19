// Core parsing and formatting
export * from './catalogParser';
// dataFormatter: omit detectOperationType (catalogParser already exports it)
export {
  detectLevel,
  type OperationType,
  type PlankType,
  getPlankType,
  type EBSettings,
  applyEdgeBindingWithSettings,
  transformCoordinates,
  type FormatOptions,
  formatDesignData,
  generateBoxPlanks,
  formatDataToCSV,
} from './dataFormatter';
export * from './plankListGenerator';
export * from './rawDataGenerator';

// Nesting: use nestingAlgorithm's runNesting (returns sheetLayouts). Export nestingEngine except runNesting to avoid conflict.
export * from './nestingAlgorithm';
export {
  type NestingPlank,
  type PlankOperations,
  type OperationData,
  type FreeRect,
  type Sheet,
  type PlacedPlank,
  type TransformedOperation,
  type NestingResult,
  type NestResultByGroup,
  type GAParams,
  type SAParams,
  type PSOParams,
  type AlgorithmType,
  evaluateLayout,
  runGeneticAlgorithm,
  runSimulatedAnnealing,
  runPSO,
  type MaterialSummary,
  generateMaterialSummary,
  SHEET_WIDTH,
  SHEET_HEIGHT,
  MARGIN,
  STANDARD_SPACING,
} from './nestingEngine';

// File generation services
export * from './fileGenerationService';
export * from './sftCalculation';
export * from './gcodeGenerator';
export * from './invoiceGenerator';
export * from './pdfGenerator';
export * from './labelGenerator';
export * from './materialEstimatePdf';

// Texture and visual services: omit convertDriveUrl (catalogParser re-exports it from googleSheetsService)
export {
  LaminateTextureCache,
  useLaminateTexture,
  preloadLaminateTextures,
  applyTextureToMaterial,
} from './laminateTextureService';

// Utility services
export * from './boxDefaultsManager';
export * from './snapSystem';
// moveTool: omit SnapPoint, SnapResult (snapSystem already exports them)
export {
  MoveToolConfig,
  Vec3,
  type AABB,
  AABBUtils,
  snapToGrid,
  snapToPoints,
  snapToAxis,
  type CollisionResult,
  resolveCollision,
  constrainToFloor,
  constrainToWall,
  dataToThree,
  threeToData,
  rotateAroundZ,
  getBoxCenter,
} from './moveTool';
export * from './plankFormulaSystem';
export * from './googleSheetsService';
