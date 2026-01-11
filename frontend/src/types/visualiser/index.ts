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
export interface DesignerBox {
  id: string;
  name: string;
  roomName: string;
  position: Vector3D;
  dimensions: Dimensions;
  planks: DesignerPlank[];
  isSelected?: boolean;
}

export interface DesignerPlank {
  id: string;
  name: string;
  material: string;
  color: string;
  position: Vector3D;
  dimensions: Dimensions;
  parentBoxId: string;
  isSelected?: boolean;
  operations?: PlankOperations;
}

export interface DesignerState {
  boxes: DesignerBox[];
  selectedBoxId: string | null;
  selectedPlankId: string | null;
  editMode: 'view' | 'move' | 'rotate' | 'boxMove';
  explodeAmount: number;
  showDimensions: boolean;
  snapEnabled: boolean;
}

export interface SnapPoint {
  type: 'endpoint' | 'midpoint' | 'center' | 'face';
  position: Vector3D;
  color: string;
}

// ---- Edit Mode Types ----
export type EditMode = 'view' | 'move' | 'rotate' | 'boxMove';

// ---- Export Types ----
export interface ExportOptions {
  format: 'pdf' | 'csv' | 'gcode' | 'json';
  includeHoles?: boolean;
  includeDimensions?: boolean;
  singleSheet?: number | 'all';
}
