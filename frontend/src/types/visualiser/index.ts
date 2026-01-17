// ============================================
// VISUALISER TYPES - Core Data Structures
// ============================================

// ---- Basic Geometry ----
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Dimensions {
  lenX: number;
  lenY: number;
  lenZ: number;
}

// ---- Plank & Box Structures ----
export interface Plank {
  id: string;
  entityName: string;
  material: string;
  materialColor: string;
  thickness: number;
  position: Vector3D;
  dimensions: Dimensions;
  stepNumber: number;
  rowIndex?: number;
  explodeDirection: Vector3D;
  assemblyDirection: {
    arrow: string;
    text: string;
  };
  operations?: PlankOperations;
}

export interface PlankOperations {
  screws?: HoleOperation[];
  hinges?: HoleOperation[];
  vb_main?: HoleOperation[];
  vb_double?: HoleOperation[];
  slots?: SlotOperation[];
  l_cuts?: LCutOperation[];
}

export interface HoleOperation {
  x: number;
  y: number;
  z?: number;
  diameter?: number;
  type?: string;
  description?: string;
}

export interface SlotOperation {
  x: number;
  y: number;
  z?: number;
  length: number;
  width: number;
  depth: number;
  type: string;
}

export interface LCutOperation {
  x: number;
  y: number;
}

export interface Box {
  id: string;
  entityName: string;
  roomName: string;
  boxType?: string;
  position: Vector3D;
  dimensions: Dimensions;
  rowIndex?: number;
  planks: Plank[];
  checklist: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  name: string;
  material: string;
  dimensions: string;
  checked?: boolean;
}

export interface Wall {
  id: string;
  entityName: string;
  roomName: string;
  dimensions: Dimensions;
  boxes: Box[];
}

// ---- Installation Guide Data ----
export interface InstallationGuideData {
  walls: Wall[];
  materialLegend: MaterialLegendItem[];
  summary: {
    totalWalls: number;
    totalBoxes: number;
    totalPlanks: number;
  };
}

export interface MaterialLegendItem {
  name: string;
  color: string;
}

// ---- Cutlist / Nesting Types ----
export interface NestResult {
  id: string;
  name: string;
  material: string;
  thickness: number;
  sheetNum: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
  color?: string;
  originalWidth?: number;
  originalHeight?: number;
  ebValue?: number;
  holes?: CutlistHole[];
}

export interface CutlistHole {
  x: number;
  y: number;
  diameter?: number;
  length?: number;
  width?: number;
  type: string;
  description?: string;
  isRectangular: boolean;
}

export interface SheetLayout {
  sheetNum: number;
  material: string;
  thickness: number;
  planks: NestResult[];
  utilization: number;
}

export interface CutlistData {
  planks: Record<number, NestResult[]>;
  stats: CutlistStats;
  constants: SheetConstants;
  clientDetails?: ClientDetails;
  spreadsheetName?: string;
}

export interface CutlistStats {
  totalPlanks: number;
  totalSheets: number;
  materialThicknessStats: Record<string, { color: string; count: number }>;
  sheetUtilization: Record<number, { percentage: string; usedArea: number }>;
}

export interface SheetConstants {
  SHEET_WIDTH: number;
  SHEET_HEIGHT: number;
  SPACING: number;
}

export interface ClientDetails {
  customerName?: string;
  firmName?: string;
  projectId?: string;
}

// ---- Nesting Algorithm Types ----
export interface PlankInput {
  id: string;
  name: string;
  material: string;
  thickness: number;
  width: number;
  height: number;
  grain?: string;
  operations?: PlankOperations;
  ebValue?: number;
}

export interface FreeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NestingResult {
  fitness: number;
  layout: any[][];
  sheetsUsed: number;
  unplacedCount: number;
  utilization: string;
  maxWasteArea?: string;
}

export interface GAParams {
  populationSize: number;
  generations: number;
  mutationRate: number;
}

export interface SAParams {
  iterations: number;
  initialTemp: number;
  coolingRate: number;
}

export interface PSOParams {
  particles: number;
  iterations: number;
  inertia: number;
  cognitive: number;
  social: number;
}

// ---- G-Code Types ----
export interface GCodeConfig {
  Z_SAFE: number;
  SPINDLE_SPEED: number;
  CUTTING_FEED_RATE: number;
  PLUNGE_FEED_RATE: number;
  BIT_RADIUS: number;
  TOOL_DIAMETER_T2: number;
}

export interface GCodePlank {
  id: string;
  name: string;
  material: string;
  thickness: number;
  sheet: string;
  x: number;
  y: number;
  placedWidth: number;
  placedHeight: number;
  rotated: boolean;
  features: PlankOperations;
}

export interface GCodeResult {
  sheetName: string;
  fileName: string;
  materialFolder: string;
  thicknessFolder: string;
  content: string;
  plankCount: number;
}

// ---- Report Types ----
export interface MaterialEstimate {
  materialThickness: string;
  roomNames: string;
  plankCount: number;
  totalArea: number;
  sheetsUsed: number;
  avgAreaPerSheet: number;
  utilization: number;
  totalEdge: number;
}

export interface SFTResult {
  boxModel: string;
  boxType: string;
  orientation: string;
  lengthMm: number;
  widthMm: number;
  squareFeet: number;
  originalRow: number;
}

export interface Invoice {
  customerName: string;
  projectId: string;
  date: string;
  items: InvoiceItem[];
  totalAmount: number;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface QASheetData {
  plankId: string;
  plankName: string;
  material: string;
  dimensions: string;
  status: 'pending' | 'passed' | 'failed';
  notes?: string;
}

export interface PressingListItem {
  sheetNum: number;
  material: string;
  thickness: number;
  plankCount: number;
  planks: {
    id: string;
    name: string;
    width: number;
    height: number;
  }[];
}

// ---- Google Sheets Types ----
export interface SheetData {
  headers: string[];
  rows: any[][];
}

export interface SpreadsheetInfo {
  id: string;
  name: string;
  sheets: {
    name: string;
    index: number;
  }[];
}

// ---- 3D Designer Types ----

// Helper types
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface BoxDimensions {
  boxWidth: number;
  boxDepth: number;
  boxHeight: number;
  skirtingHeight?: number;
}

export interface BoxMaterials {
  carcassPly?: string;
  doorPly?: string;
  backPly?: string;
  carcassThickness?: number;
  doorThickness?: number;
  backplankThickness?: number;
}

// Wall for designer (extends base Wall)
export interface DesignerWall {
  id: string;
  name: string;
  roomName: string;
  sortOrder: number;
  
  // Dimensions
  width: number;   // mm
  height: number;  // mm
  depth: number;   // mm (wall thickness)
  color: string;
  
  // LiDAR integration
  isFromScan?: boolean;
  scanId?: string;
  scanConfidence?: number;
  boundaryPoints?: Position3D[];
  
  // Contained boxes
  boxes: DesignerBox[];
}

// Extended Box for designer
export interface DesignerBox {
  id: string;
  name: string;
  roomName: string;
  boxModel?: string;
  boxType?: string;
  templateId?: string;
  sortOrder?: number;
  
  // Position (local to wall, in mm)
  position: Position3D;
  rotationZ: number;
  
  // Dimensions (user-adjustable)
  dimensions: BoxDimensions & Dimensions;
  
  // Thicknesses (derived from material selection)
  carcassThickness: number;
  doorThickness: number;
  backplankThickness: number;
  
  // Material selections (display names)
  carcassPly?: string;
  doorPly?: string;
  backPly?: string;
  
  // Planks
  planks: DesignerPlank[];
  
  // UI state (not persisted)
  isSelected?: boolean;
}

// Extended Plank for designer
export interface DesignerPlank {
  id: string;
  name: string;
  plankRole?: PlankRole;
  sortOrder?: number;
  parentBoxId: string;
  
  // Position relative to box
  position: Position3D;
  
  // Dimensions
  dimensions: Dimensions;
  
  // Material
  material?: string;
  materialString?: string;
  outerLaminateCode?: string;
  innerLaminateCode?: string;
  coreMaterial?: string;
  color: string;
  
  // Formula storage (for recalculation)
  dimensionFormulas?: {
    lenX?: string;
    lenY?: string;
    lenZ?: string;
  };
  positionFormulas?: {
    x?: string;
    y?: string;
    z?: string;
  };
  
  // Operations
  operations?: PlankOperations;
  
  // UI state
  isSelected?: boolean;
}

export type PlankRole = 
  | 'left' 
  | 'right' 
  | 'top' 
  | 'bottom' 
  | 'back' 
  | 'shelf' 
  | 'door' 
  | 'drawer_front'
  | 'partition'
  | 'rail'
  | 'other';

// ---- Catalog Types ----

export interface Catalog {
  id: string;
  name: string;
  description?: string;
  version: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Column mappings from CSV
  columnConfig?: CatalogColumnConfig;
  
  // Templates
  boxTemplates: BoxTemplate[];
}

export interface CatalogColumnConfig {
  entityName: number;
  level: number;
  boxModel: number;
  boxType: number;
  lenX: number;
  lenY: number;
  lenZ: number;
  posX: number;
  posY: number;
  posZ: number;
  boxWidth: number;
  boxDepth: number;
  boxHeight: number;
  skirtingHeight: number;
  material: number;
  grainDirection: number;
}

export interface BoxTemplate {
  id: string;
  catalogId: string;
  
  entityName: string;
  boxModel?: string;
  boxType?: string;
  
  // Default dimensions
  defaultWidth: number;
  defaultDepth: number;
  defaultHeight: number;
  defaultSkirtingHeight: number;
  
  // Plank templates with formulas
  plankTemplates: PlankTemplate[];
  
  // Preview
  thumbnailUrl?: string;
  previewColor?: string;
}

export interface PlankTemplate {
  id: string;
  entityName: string;
  plankRole: PlankRole;
  sortOrder: number;
  
  // Dimension formulas (e.g., "=carcassThickness", "=boxWidth - 2*carcassThickness")
  lenXFormula: string;
  lenYFormula: string;
  lenZFormula: string;
  
  // Position formulas
  posXFormula: string;
  posYFormula: string;
  posZFormula: string;
  
  // Default material
  defaultMaterial?: string;
  defaultColor?: string;
  
  // Sub-components (holes, hardware)
  subComponents?: SubComponentTemplate[];
}

export interface SubComponentTemplate {
  id: string;
  entityName: string;
  type: 'hole' | 'slot' | 'hardware';
  posXFormula: string;
  posYFormula: string;
  posZFormula?: string;
  parameters?: Record<string, any>;
}

// ---- Material Types ----

export interface PlywoodMaterial {
  id: string;
  brand: string;
  gradeType?: string;
  material: 'Plywood' | 'MDF' | 'HDHMR' | 'Block Board' | 'Particle Board';
  thickness: number;
  pricePerSqft?: number;
  displayName: string;
  isActive: boolean;
}

export interface Laminate {
  id: string;
  code: string;
  brand: string;
  colour?: string;
  thickness: number;
  pricePerSqft?: number;
  photoUrl?: string;
  previewColor: string;
  isActive: boolean;
  category?: string;
}

// ---- Formula Types ----

export interface FormulaContext {
  boxWidth: number;
  boxDepth: number;
  boxHeight: number;
  skirtingHeight: number;
  carcassThickness: number;
  doorThickness: number;
  backplankThickness: number;
  // Aliases for compatibility
  box_width?: number;
  box_depth?: number;
  box_height?: number;
  skirting?: number;
  carcus_thickness?: number;
  door_thickness?: number;
  backplank_thickness?: number;
}

export interface CalculatedPlank {
  entityName: string;
  plankRole: PlankRole;
  lenX: number;
  lenY: number;
  lenZ: number;
  positionX: number;
  positionY: number;
  positionZ: number;
}

// ---- Snap Types ----

export interface SnapSettings {
  enabled: boolean;
  gridSize: number;         // 50 or 100mm
  snapDistance: number;     // Activation distance (default: 20mm)
  floorSnap: boolean;
  wallSnap: boolean;
  boxEdgeSnap: boolean;
  gridSnap: boolean;
  cornerSnap: boolean;
}

export interface SnapPoint {
  type: 'endpoint' | 'midpoint' | 'center' | 'face' | 'grid' | 'edge';
  position: Position3D;
  color: string;
  sourceId?: string;
}

export interface SnapResult {
  snapped: boolean;
  position: Position3D;
  snapType?: SnapPoint['type'];
  snapIndicators?: SnapIndicator[];
}

export interface SnapIndicator {
  start: Position3D;
  end: Position3D;
  color: string;
  label?: string;
}

// ---- Collision Types ----

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface CollisionResult {
  hasCollision: boolean;
  collidingBoxIds: string[];
  outOfBounds: {
    left: boolean;
    right: boolean;
    top: boolean;
    bottom: boolean;
    front: boolean;
    back: boolean;
  };
}

// ---- LiDAR / Point Cloud Types ----

export interface PointCloudData {
  positions: Float32Array;
  colors?: Float32Array;
  normals?: Float32Array;
  pointCount: number;
  bounds: BoundingBox;
}

export interface DetectedSurface {
  id: string;
  surfaceType: 'FLOOR' | 'CEILING' | 'WALL' | 'UNKNOWN';
  confidence: number;
  
  // Plane equation (ax + by + cz + d = 0)
  planeA: number;
  planeB: number;
  planeC: number;
  planeD: number;
  
  // Bounding box
  bounds: BoundingBox;
  
  // Calculated dimensions
  width: number;
  height: number;
  
  // Boundary polygon
  boundaryPoints?: Position3D[];
  
  // User confirmation
  isConfirmed: boolean;
  userLabel?: string;
}

// ---- Designer State Types (for component props) ----

export interface DesignerState {
  boxes: DesignerBox[];
  selectedBoxId: string | null;
  selectedPlankId: string | null;
  editMode: 'view' | 'move' | 'rotate' | 'boxMove';
  explodeAmount: number;
  showDimensions: boolean;
  snapEnabled: boolean;
}

// ---- Edit Mode Types ----
export type EditMode = 'view' | 'move' | 'rotate' | 'boxMove' | 'place';

// ---- Export Types ----
export interface ExportOptions {
  format: 'pdf' | 'csv' | 'gcode' | 'json';
  includeHoles?: boolean;
  includeDimensions?: boolean;
  singleSheet?: number | 'all';
}

export interface CutlistExportRow {
  wallName: string;
  boxName: string;
  boxModel?: string;
  plankName: string;
  plankRole: string;
  lenX: number;
  lenY: number;
  lenZ: number;
  materialString?: string;
  coreType?: string;
  outerLaminateCode?: string;
  innerLaminateCode?: string;
  areaSqft: number;
}
