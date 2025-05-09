/**
 * @description Core types for the BIM module
 */

/**
 * @description Represents a plank in a BIM model
 */
export interface Plank {
  plankId: string;
  name: string;
  width: number | null;
  height: number | null;
  materialCode: string | null;
  grainDirection: string | null;
  thickness?: number;
  edgeBanding?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  // Additional properties for manufacturing
  sheetAssignment?: string; // Which sheet this plank is cut from
  sheetPosition?: { x: number; y: number }; // Position on the sheet
}

/**
 * @description Material properties for a specific material code
 */
export interface MaterialProperties {
  innerLaminate: string;
  outerLaminate: string;
  plyThickness_mm: number;
  overallMaterialThickness_mm: number;
  plyType: string;
}

/**
 * @description Runtime inputs for the Simple Box model
 */
export interface SimpleBoxInputs {
  boxHeight: number;
  boxWidth: number;
  boxDepth: number;
  leftAdjacency: 'Expose' | 'Box' | 'Wall';
  rightAdjacency: 'Expose' | 'Box' | 'Wall';
  outerMaterialCode: string;
  innerMaterialCode: string;
  backMaterialCode: string;
  door?: {
    hasDoor: boolean;
    exposedSide?: string;
  };
  numberOfShelves: number;
}

/**
 * @description Runtime inputs for the L-Shaped Box model
 */
export interface LShapedBoxInputs {
  mainBoxHeight: number;
  mainBoxWidth: number;
  mainBoxDepth: number;
  secondaryBoxHeight: number;
  secondaryBoxWidth: number;
  secondaryBoxDepth: number;
  leftAdjacency: 'Expose' | 'Box' | 'Wall';
  rightAdjacency: 'Expose' | 'Box' | 'Wall';
  backAdjacency: 'Expose' | 'Box' | 'Wall';
  outerMaterialCode: string;
  innerMaterialCode: string;
  backMaterialCode: string;
  door?: {
    hasDoor: boolean;
    exposedSide?: string;
  };
  numberOfShelves: number;
}

/**
 * @description Generic runtime inputs interface
 */
export interface RuntimeInputs {
  [key: string]: any;
}

/**
 * @description Model definition interface
 */
export interface ModelDefinition {
  modelType: string;
  description: string; // Description of the model
  screenshotUrl: string; // URL to a screenshot/image of the model
  runtimeInputs: RuntimeInputs;
  planks: Plank[];
  siteEngineerInstructions?: string[];
  sampleOnsiteInputs?: {
    [materialCode: string]: MaterialProperties;
  };
}

/**
 * @description Global rules for BIM processing
 */
export interface GlobalRules {
  materialDetails: {
    defaultInnerLaminateThickness_mm: number;
    defaultOuterLaminateThickness_mm: number;
    defaultEdgeBandingInnerThickness_mm: number;
    defaultEdgeBandingExposedThickness_mm: number;
  };
  adjacencyRules: {
    exposedSide: AdjacencyRule;
    boxSide: AdjacencyRule;
    wallSide: AdjacencyRule;
  };
  edgeBandingRules: {
    exposedOrOuterLaminate: EdgeBandingRule;
    notExposedOrInnerLaminate: EdgeBandingRule;
    slidingDoorException: EdgeBandingRule;
  };
  fittingRules: {
    vbFittings: FittingRule;
    screwFittings: FittingRule;
  };
  doorRules: {
    clearance_mm: number;
    description: string;
  };
  generalPlankRules: {
    shelfMaterial: string;
  };
}

/**
 * @description Adjacency rule for a specific side type
 */
interface AdjacencyRule {
  description: string;
  sidePanelExtension?: string;
  backPanelInsertion?: string;
  outerFinish?: string;
  edgeBanding?: string;
  backPanelExtension?: string;
  sidePanelGroove?: string;
  fastening?: string;
  screwHoleDiameter_mm?: number;
  logic?: string;
  dummyPanelRequired?: boolean;
  dummyWidthOnSheet_mm?: number;
  dummyClearanceOnSite_mm?: number;
}

/**
 * @description Edge banding rule
 */
interface EdgeBandingRule {
  thickness_mm: number;
  description: string;
}

/**
 * @description Fitting rule
 */
interface FittingRule {
  sidePanelHoleDiameter_mm?: number;
  adjacentPanelHoleDiameter_mm?: number;
  holeDiameter_mm?: number;
  description: string;
}

/**
 * @description Cut operation for a plank
 */
export interface CutOperation {
  plankId: string;
  materialCode: string;
  width: number;
  height: number;
  sheetId: string;
  position: { x: number; y: number };
  rotation: boolean; // true if rotated 90 degrees
}

/**
 * @description Sheet layout for cutlist
 */
export interface SheetLayout {
  sheetId: string;
  materialCode: string;
  width: number;
  height: number;
  cuts: CutOperation[];
  wastePercentage: number;
}

/**
 * @description Complete cutlist
 */
export interface CutList {
  sheets: SheetLayout[];
  totalSheets: number;
  totalPlanks: number;
  averageWastePercentage: number;
}

/**
 * @description G-code command
 */
export interface GCodeCommand {
  code: string;
  params: { [key: string]: number | string };
  comment?: string;
}

/**
 * @description Complete G-code program
 */
export interface GCodeProgram {
  commands: GCodeCommand[];
  metadata: {
    generatedAt: string;
    materialCode: string;
    totalCuts: number;
  };
}

/**
 * @description Material entity from database
 */
export interface Material {
  id: number;
  projectId: number;
  materialId: string; // User-defined unique ID within the project
  plyThickness: number;
  innerLaminateCode: string;
  outerLaminateCode: string;
  overallThickness: number;
  plyType: string;
  grainDirection?: string;
  edgebandingInnerCode: string;
  edgebandingExposedCode: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @description Site Visit Box entity from database
 */
export interface SiteVisitBox {
  id: number;
  taskId: number;
  order: number;
  modelType: string;
  inputs: any; // JSON object with model-specific inputs
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @description DTO for creating a material
 */
export interface CreateMaterialDto {
  materialId: string;
  plyThickness: number;
  innerLaminateCode: string;
  outerLaminateCode: string;
  plyType: string;
  grainDirection?: string;
  edgebandingInnerCode: string;
  edgebandingExposedCode: string;
}

/**
 * @description DTO for updating a material
 */
export interface UpdateMaterialDto {
  materialId?: string;
  plyThickness?: number;
  innerLaminateCode?: string;
  outerLaminateCode?: string;
  plyType?: string;
  grainDirection?: string;
  edgebandingInnerCode?: string;
  edgebandingExposedCode?: string;
}

/**
 * @description DTO for creating a site visit box
 */
export interface CreateSiteVisitBoxDto {
  order: number;
  modelType: string;
  inputs: any; // JSON object with model-specific inputs
}

/**
 * @description DTO for updating a site visit box
 */
export interface UpdateSiteVisitBoxDto {
  order?: number;
  modelType?: string;
  inputs?: any; // JSON object with model-specific inputs
}

/**
 * @description Response for model info
 */
export interface ModelInfo {
  modelType: string;
  description: string;
  screenshotUrl: string;
  runtimeInputs: RuntimeInputs;
}
