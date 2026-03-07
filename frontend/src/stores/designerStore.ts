/**
 * Designer Store
 * Zustand store for the 3D Cabinet Designer
 * Includes undo/redo history tracking
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Wall,
  Box,
  Plank,
  DesignMode,
  CatalogModel,
  PlywoodOption,
  LaminateOption,
  Position,
  Dimensions,
  GenerationProgress,
  GenerationStep,
  FormattedPlankData,
  PlankListItem,
  NestResult,
  MaterialSummary,
  PlankTemplate,
  Guideline,
  MeasurementMode,
  MeasurementResult,
  MeasureGuideLine,
  MeasureGuidePoint,
} from '@/types/visualiser';
import { CatalogBoxWithPlanks, getMaterialColor, transformSubComponentsToOperations, localConvertDriveUrl } from '@/lib/visualiser/catalogParser';
import { 
  recalculatePlanks, 
  calculatePlanksFromFormulas, 
  BoxDimensions,
  STANDARD_PLANK_FORMULAS 
} from '@/lib/visualiser/plankFormulaSystem';
import type { DesignSnapshot } from './historyMiddleware';

// ============================================
// CUSTOMER DETAILS TYPE
// ============================================

export interface CustomerDetails {
  customerName: string;
  firmName: string;
  address: string;
  phone: string;
  email: string;
  gst: string;
  transportAmount: number;
}

export interface MoveToolRuntimeState {
  dragState: unknown;
  movePhase: 'idle' | 'moving';
  applyNumericInput: (input: string) => boolean;
  inferencePoints: unknown[];
  cancelTwoClick: () => void;
  setLockedAxis: (axis: 'x' | 'y' | 'z' | null) => void;
  copyModeToggle: () => void;
  beginMoveFromSelection: () => void;
}

const DEFAULT_CUSTOMER_DETAILS: CustomerDetails = {
  customerName: '',
  firmName: '',
  address: '',
  phone: '',
  email: '',
  gst: '',
  transportAmount: 0,
};

// ============================================
// HISTORY CONFIGURATION
// ============================================

const HISTORY_LIMIT = 50;

// ============================================
// STORE STATE TYPE
// ============================================

interface DesignerState {
  // Design Data
  walls: Wall[];
  selectedWallId: string | null;
  selectedBoxId: string | null;
  selectedPlankId: string | null;
  
  // Active Wall (for multi-wall tabs - different from selected)
  activeWallId: string | null;

  // Undo/Redo History
  past: DesignSnapshot[];
  future: DesignSnapshot[];

  // Interaction Mode
  designMode: DesignMode;
  placingModelId: string | null;

  // Catalog Data
  catalogModels: CatalogModel[];
  catalogBoxesWithPlanks: CatalogBoxWithPlanks[];
  plywoodLibrary: PlywoodOption[];
  laminateLibrary: LaminateOption[];
  catalogLoaded: boolean;
  lastCatalogRefresh: string | null;
  isRefreshingCatalog: boolean;

  // Camera & View
  cameraPosition: Position;
  cameraTarget: Position;
  viewMode: 'perspective' | 'top' | 'front' | 'side';

  // UI State
  showGrid: boolean;
  showAxes: boolean;
  showLabels: boolean;
  snapEnabled: boolean;
  snapGridSize: number;
  
  // Guidelines (Construction Lines)
  guidelines: Guideline[];
  selectedGuidelineId: string | null;
  isPlacingGuideline: boolean;
  guidelineStartPoint: Position | null;

  // Measurement Tool (Tape Measure)
  measurementMode: MeasurementMode;
  measurementHistory: MeasurementResult[];
  measureGuideLines: MeasureGuideLine[];
  measureGuidePoints: MeasureGuidePoint[];
  measureGuidesVisible: boolean;
  activeMeasurement: { startPoint: Position; currentPoint: Position } | null;
  selectedMeasureGuideId: string | null;
  moveToolRuntime: MoveToolRuntimeState | null;

  // File Generation
  generationProgress: GenerationProgress | null;
  rawData: Record<string, unknown>[] | null;
  formattedData: FormattedPlankData[] | null;
  plankList: PlankListItem[] | null;
  nestResults: NestResult[] | null;
  materialSummary: MaterialSummary[] | null;

  // Customer Details
  customerDetails: CustomerDetails;

  // Project Info
  projectName: string;
  projectId: string | null;
  lastSaved: string | null;
  isDirty: boolean;

  // Actions
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistory: () => void;
  beginHistoryTransaction: () => void;
  endHistoryTransaction: () => void;
  runInHistoryTransaction: <T>(operation: () => T) => T;
  clearHistory: () => void;
  
  // Walls
  addWall: (wall: Omit<Wall, 'id' | 'boxes'>) => string;
  updateWall: (id: string, updates: Partial<Wall>) => void;
  deleteWall: (id: string) => void;
  selectWall: (id: string | null) => void;
  setActiveWall: (id: string | null) => void;

  // Boxes
  addBox: (wallId: string, box: Omit<Box, 'id' | 'planks' | 'checklist'>) => string;
  updateBox: (id: string, updates: Partial<Box>) => void;
  deleteBox: (id: string) => void;
  selectBox: (id: string | null) => void;
  moveBox: (id: string, position: Position) => void;
  duplicateBox: (boxId: string, newPosition: Position) => string;
  rotateBox: (id: string, degrees: number) => void;
  
  // Update box dimensions with formula-based plank recalculation
  updateBoxDimensions: (boxId: string, dimensions: Partial<BoxDimensions>) => void;

  // Planks
  addPlank: (boxId: string, plank: Omit<Plank, 'id'>) => string;
  updatePlank: (id: string, updates: Partial<Plank>) => void;
  deletePlank: (id: string) => void;
  selectPlank: (id: string | null) => void;

  // Mode & Interaction
  setDesignMode: (mode: DesignMode) => void;
  setPlacingModel: (modelId: string | null) => void;

  // Catalog
  setCatalogModels: (models: CatalogModel[]) => void;
  setCatalogBoxesWithPlanks: (boxes: CatalogBoxWithPlanks[]) => void;
  setPlywoodLibrary: (options: PlywoodOption[]) => void;
  setLaminateLibrary: (options: LaminateOption[]) => void;
  setCatalogLoaded: (loaded: boolean) => void;
  setLastCatalogRefresh: (date: string | null) => void;
  setIsRefreshingCatalog: (refreshing: boolean) => void;
  
  // Add box from catalog with plank templates
  addBoxFromCatalog: (wallId: string, catalogBoxId: string, position: Position) => string | null;
  
  // Apply laminate to box
  applyLaminateToBox: (boxId: string, laminate: LaminateOption, side: 'outer' | 'inner' | 'both') => void;

  // Camera & View
  setCameraPosition: (position: Position) => void;
  setCameraTarget: (target: Position) => void;
  setViewMode: (mode: 'perspective' | 'top' | 'front' | 'side') => void;
  resetCamera: () => void;

  // UI Toggles
  toggleGrid: () => void;
  toggleAxes: () => void;
  toggleLabels: () => void;
  toggleSnap: () => void;
  setSnapGridSize: (size: number) => void;
  
  // Guidelines (Construction Lines)
  addGuideline: (guideline: Omit<Guideline, 'id'>) => string;
  updateGuideline: (id: string, updates: Partial<Guideline>) => void;
  deleteGuideline: (id: string) => void;
  selectGuideline: (id: string | null) => void;
  clearGuidelines: () => void;
  startPlacingGuideline: (startPoint: Position) => void;
  finishPlacingGuideline: (endPoint: Position, axis: 'x' | 'y' | 'z') => void;
  cancelPlacingGuideline: () => void;

  // Measurement Tool (Tape Measure)
  setMeasurementMode: (mode: MeasurementMode) => void;
  addMeasurement: (result: Omit<MeasurementResult, 'id' | 'timestamp'>) => string;
  clearMeasurementHistory: () => void;
  addMeasureGuideLine: (guide: Omit<MeasureGuideLine, 'id'>) => string;
  updateMeasureGuideLine: (id: string, updates: Partial<MeasureGuideLine>) => void;
  deleteMeasureGuideLine: (id: string) => void;
  addMeasureGuidePoint: (point: Omit<MeasureGuidePoint, 'id'>) => string;
  deleteMeasureGuidePoint: (id: string) => void;
  clearMeasureGuides: () => void;
  toggleMeasureGuidesVisible: () => void;
  setActiveMeasurement: (measurement: { startPoint: Position; currentPoint: Position } | null) => void;
  selectMeasureGuide: (id: string | null) => void;
  setMoveToolRuntime: (runtime: MoveToolRuntimeState | null) => void;

  // File Generation
  setGenerationProgress: (progress: GenerationProgress | null) => void;
  updateGenerationStep: (stepId: string, updates: Partial<GenerationStep>) => void;
  setRawData: (data: Record<string, unknown>[] | null) => void;
  setFormattedData: (data: FormattedPlankData[] | null) => void;
  setPlankList: (data: PlankListItem[] | null) => void;
  setNestResults: (data: NestResult[] | null) => void;
  setMaterialSummary: (data: MaterialSummary[] | null) => void;
  clearGeneratedData: () => void;

  // Project
  setProjectName: (name: string) => void;
  setProjectId: (id: string | null) => void;
  markDirty: () => void;
  markSaved: () => void;

  // Customer Details
  setCustomerDetails: (details: Partial<CustomerDetails>) => void;
  clearCustomerDetails: () => void;
  hasCustomerDetails: () => boolean;

  // Bulk Operations
  loadDesign: (data: { walls: Wall[]; projectName?: string; customerDetails?: CustomerDetails }) => void;
  clearDesign: () => void;
  getDesignData: () => { walls: Wall[]; projectName: string; customerDetails: CustomerDetails };
}

// ============================================
// ID GENERATOR
// ============================================

let idCounter = 0;
const generateId = (prefix: string): string => {
  idCounter += 1;
  return `${prefix}_${Date.now()}_${idCounter}`;
};

// History transaction batching:
// - first mutating action inside a transaction pushes exactly one snapshot
// - subsequent actions in same transaction do not fragment undo history
let historyTransactionDepth = 0;
let transactionHasSnapshot = false;

// ============================================
// HELPER: DETERMINE PLANK ROLE FROM NAME
// ============================================

import type { PlankRole } from '@/types/visualiser';

function determinePlankRole(entityName: string): PlankRole {
  const name = entityName.toLowerCase();
  if (name.includes('left')) return 'left';
  if (name.includes('right')) return 'right';
  if (name.includes('top')) return 'top';
  if (name.includes('bottom')) return 'bottom';
  if (name.includes('back')) return 'back';
  if (name.includes('front')) return 'front';
  if (name.includes('door')) return 'door';
  if (name.includes('shelf')) return 'shelf';
  if (name.includes('skirting') || name.includes('skriting')) return 'skirting';
  if (name.includes('facia')) return 'facia';
  if (name.includes('drawer')) return 'drawer';
  return 'other';
}

// ============================================
// LAMINATE COLOR MAPPING
// ============================================

const LAMINATE_COLOR_MAP: Record<string, string> = {
  // Common wood tones
  'walnut': '#5D4037',
  'oak': '#D2B48C',
  'cherry': '#B5651D',
  'maple': '#FFE4B5',
  'teak': '#8B6914',
  'mahogany': '#C04000',
  'ash': '#E8DCC8',
  'beech': '#E6C9A8',
  // Colors
  'white': '#FAFAFA',
  'black': '#1A1A1A',
  'grey': '#808080',
  'gray': '#808080',
  'cream': '#FFFDD0',
  'ivory': '#FFFFF0',
  // Laminates
  'anthracite': '#383838',
  'stone': '#A0A0A0',
  'sand': '#C2B280',
};

/**
 * Get a display color from a laminate for 3D visualization
 */
function getLaminateDisplayColor(laminate: LaminateOption): string {
  // Try to get color from laminate colour/code
  const searchTerms = [
    laminate.colour?.toLowerCase() || '',
    laminate.code?.toLowerCase() || '',
  ];
  
  for (const term of searchTerms) {
    for (const [colorKey, colorValue] of Object.entries(LAMINATE_COLOR_MAP)) {
      if (term.includes(colorKey)) {
        return colorValue;
      }
    }
  }
  
  // Default: use a pleasant wood color
  return '#D4A574';
}

// ============================================
// DEFAULT CAMERA
// ============================================

const DEFAULT_CAMERA_POSITION: Position = { x: 3000, y: -3000, z: 2000 };
const DEFAULT_CAMERA_TARGET: Position = { x: 0, y: 0, z: 500 };

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useDesignerStore = create<DesignerState>()(
  persist(
    (set, get) => ({
      // Initial State
      walls: [],
      selectedWallId: null,
      selectedBoxId: null,
      selectedPlankId: null,
      activeWallId: null,
      
      // Undo/Redo History
      past: [],
      future: [],

      designMode: 'select',
      placingModelId: null,

      catalogModels: [],
      catalogBoxesWithPlanks: [],
      plywoodLibrary: [],
      laminateLibrary: [],
      catalogLoaded: false,
      lastCatalogRefresh: null,
      isRefreshingCatalog: false,

      cameraPosition: DEFAULT_CAMERA_POSITION,
      cameraTarget: DEFAULT_CAMERA_TARGET,
      viewMode: 'perspective',

      showGrid: true,
      showAxes: true,
      showLabels: true,
      snapEnabled: true,
      snapGridSize: 50,
      
      // Guidelines
      guidelines: [],
      selectedGuidelineId: null,
      isPlacingGuideline: false,
      guidelineStartPoint: null,

      // Measurement Tool (Tape Measure)
      measurementMode: 'measure' as MeasurementMode,
      measurementHistory: [],
      measureGuideLines: [],
      measureGuidePoints: [],
      measureGuidesVisible: true,
      activeMeasurement: null,
      selectedMeasureGuideId: null,
      moveToolRuntime: null,

      generationProgress: null,
      rawData: null,
      formattedData: null,
      plankList: null,
      nestResults: null,
      materialSummary: null,

      // Customer Details
      customerDetails: DEFAULT_CUSTOMER_DETAILS,

      projectName: 'Untitled Project',
      projectId: null,
      lastSaved: null,
      isDirty: false,

      // ============================================
      // UNDO/REDO ACTIONS
      // ============================================
      
      pushHistory: () => {
        const inTransaction = historyTransactionDepth > 0;
        if (inTransaction && transactionHasSnapshot) {
          return;
        }
        set((state) => {
          const snapshot: DesignSnapshot = {
            walls: JSON.parse(JSON.stringify(state.walls)),
            guidelines: JSON.parse(JSON.stringify(state.guidelines)),
            measureGuideLines: JSON.parse(JSON.stringify(state.measureGuideLines)),
            measureGuidePoints: JSON.parse(JSON.stringify(state.measureGuidePoints)),
            measurementHistory: JSON.parse(JSON.stringify(state.measurementHistory)),
            timestamp: Date.now(),
          };
          
          const newPast = [...state.past, snapshot];
          if (newPast.length > HISTORY_LIMIT) {
            newPast.shift();
          }
          
          return {
            past: newPast,
            future: [], // Clear redo stack on new action
          };
        });
        if (inTransaction) {
          transactionHasSnapshot = true;
        }
      },

      beginHistoryTransaction: () => {
        historyTransactionDepth += 1;
      },

      endHistoryTransaction: () => {
        historyTransactionDepth = Math.max(0, historyTransactionDepth - 1);
        if (historyTransactionDepth === 0) {
          transactionHasSnapshot = false;
        }
      },

      runInHistoryTransaction: (operation) => {
        get().beginHistoryTransaction();
        try {
          return operation();
        } finally {
          get().endHistoryTransaction();
        }
      },
      
      undo: () => {
        const state = get();
        if (state.past.length === 0) return;
        
        const previousSnapshot = state.past[state.past.length - 1];
        
        set({
          past: state.past.slice(0, -1),
          future: [
            { 
              walls: JSON.parse(JSON.stringify(state.walls)), 
              guidelines: JSON.parse(JSON.stringify(state.guidelines)),
              measureGuideLines: JSON.parse(JSON.stringify(state.measureGuideLines)),
              measureGuidePoints: JSON.parse(JSON.stringify(state.measureGuidePoints)),
              measurementHistory: JSON.parse(JSON.stringify(state.measurementHistory)),
              timestamp: Date.now() 
            },
            ...state.future,
          ].slice(0, HISTORY_LIMIT),
          walls: previousSnapshot.walls,
          guidelines: previousSnapshot.guidelines || [],
          measureGuideLines: previousSnapshot.measureGuideLines || [],
          measureGuidePoints: previousSnapshot.measureGuidePoints || [],
          measurementHistory: previousSnapshot.measurementHistory || [],
          isDirty: true,
        });
      },
      
      redo: () => {
        const state = get();
        if (state.future.length === 0) return;
        
        const nextSnapshot = state.future[0];
        
        set({
          past: [
            ...state.past,
            { 
              walls: JSON.parse(JSON.stringify(state.walls)), 
              guidelines: JSON.parse(JSON.stringify(state.guidelines)),
              measureGuideLines: JSON.parse(JSON.stringify(state.measureGuideLines)),
              measureGuidePoints: JSON.parse(JSON.stringify(state.measureGuidePoints)),
              measurementHistory: JSON.parse(JSON.stringify(state.measurementHistory)),
              timestamp: Date.now() 
            },
          ].slice(-HISTORY_LIMIT),
          future: state.future.slice(1),
          walls: nextSnapshot.walls,
          guidelines: nextSnapshot.guidelines || [],
          measureGuideLines: nextSnapshot.measureGuideLines || [],
          measureGuidePoints: nextSnapshot.measureGuidePoints || [],
          measurementHistory: nextSnapshot.measurementHistory || [],
          isDirty: true,
        });
      },
      
      canUndo: () => get().past.length > 0,
      
      canRedo: () => get().future.length > 0,
      
      clearHistory: () => {
        set({ past: [], future: [] });
      },

      // ============================================
      // WALL ACTIONS
      // ============================================

      addWall: (wallData) => {
        get().pushHistory(); // Save state before change
        const id = generateId('wall');
        // All walls are placed at origin (0,0,0) for multi-wall tabs
        const wall: Wall = {
          ...wallData,
          id,
          boxes: [],
          position: { x: 0, y: 0, z: 0 },
        };
        set((state) => ({
          walls: [...state.walls, wall],
          activeWallId: state.activeWallId || id, // Set as active if first wall
          isDirty: true,
        }));
        return id;
      },

      updateWall: (id, updates) => {
        get().pushHistory(); // Save state before change
        set((state) => ({
          walls: state.walls.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
          isDirty: true,
        }));
      },

      deleteWall: (id) => {
        get().pushHistory(); // Save state before change
        set((state) => {
          const remainingWalls = state.walls.filter((w) => w.id !== id);
          return {
            walls: remainingWalls,
            selectedWallId: state.selectedWallId === id ? null : state.selectedWallId,
            activeWallId: state.activeWallId === id 
              ? (remainingWalls.length > 0 ? remainingWalls[0].id : null)
              : state.activeWallId,
            isDirty: true,
          };
        });
      },

      selectWall: (id) => {
        set({
          selectedWallId: id,
          selectedBoxId: null,
          selectedPlankId: null,
        });
      },
      
      setActiveWall: (id) => {
        set({ activeWallId: id });
      },

      // ============================================
      // BOX ACTIONS
      // ============================================

      addBox: (wallId, boxData) => {
        get().pushHistory(); // Save state before change
        const id = generateId('box');
        const box: Box = {
          ...boxData,
          id,
          planks: [],
          checklist: [],
        };
        set((state) => ({
          walls: state.walls.map((w) =>
            w.id === wallId ? { ...w, boxes: [...w.boxes, box] } : w
          ),
          isDirty: true,
        }));
        return id;
      },

      updateBox: (id, updates) => {
        set((state) => ({
          walls: state.walls.map((w) => ({
            ...w,
            boxes: w.boxes.map((b) =>
              b.id === id ? { ...b, ...updates } : b
            ),
          })),
          isDirty: true,
        }));
      },

      deleteBox: (id) => {
        get().pushHistory(); // Save state before change
        set((state) => ({
          walls: state.walls.map((w) => ({
            ...w,
            boxes: w.boxes.filter((b) => b.id !== id),
          })),
          selectedBoxId: state.selectedBoxId === id ? null : state.selectedBoxId,
          isDirty: true,
        }));
      },

      selectBox: (id) => {
        set({
          selectedBoxId: id,
          selectedPlankId: null,
        });
      },

      moveBox: (id, position) => {
        get().pushHistory(); // Save state before change
        get().updateBox(id, { position });
      },

      duplicateBox: (boxId, newPosition) => {
        const state = get();
        let sourceBox: Box | null = null;
        let wallId: string | null = null;
        for (const wall of state.walls) {
          const box = wall.boxes.find((b) => b.id === boxId);
          if (box) {
            sourceBox = box;
            wallId = wall.id;
            break;
          }
        }
        if (!sourceBox || !wallId) return '';
        const newBoxId = generateId('box');
        const newPlanks = (sourceBox.planks || []).map((p) => ({
          ...p,
          id: generateId('plank'),
        }));
        const newBox: Box = {
          ...sourceBox,
          id: newBoxId,
          position: { ...newPosition },
          planks: newPlanks,
        };
        get().pushHistory();
        set((s) => ({
          walls: s.walls.map((w) =>
            w.id !== wallId
              ? w
              : { ...w, boxes: [...w.boxes, newBox] }
          ),
          selectedBoxId: newBoxId,
          selectedPlankId: null,
          isDirty: true,
        }));
        return newBoxId;
      },

      rotateBox: (id, degrees) => {
        get().pushHistory(); // Save state before change
        set((state) => ({
          walls: state.walls.map((w) => ({
            ...w,
            boxes: w.boxes.map((b) =>
              b.id === id
                ? { ...b, rotZ: ((b.rotZ || 0) + degrees) % 360 }
                : b
            ),
          })),
          isDirty: true,
        }));
      },

      // Update box dimensions with formula-based plank recalculation
      // This mimics Google Sheets formula behavior
      updateBoxDimensions: (boxId, dimensionUpdates) => {
        get().pushHistory(); // Save state before change
        set((state) => ({
          walls: state.walls.map((wall) => ({
            ...wall,
            boxes: wall.boxes.map((box) => {
              if (box.id !== boxId) return box;
              
              // Merge current dimensions with updates; fall back to box.dimensions when boxWidth/boxDepth/boxHeight are missing
              const newDimensions: BoxDimensions = {
                boxWidth: dimensionUpdates.boxWidth ?? box.boxWidth ?? box.dimensions?.lenX ?? 600,
                boxDepth: dimensionUpdates.boxDepth ?? box.boxDepth ?? box.dimensions?.lenY ?? 550,
                boxHeight: dimensionUpdates.boxHeight ?? box.boxHeight ?? box.dimensions?.lenZ ?? 720,
                skirting: dimensionUpdates.skirting ?? box.skirting ?? 100,
                skirtingWidth: dimensionUpdates.skirtingWidth ?? box.skirtingWidth ?? 50,
                carcusThickness: dimensionUpdates.carcusThickness ?? box.carcusThickness ?? 18,
                doorThickness: dimensionUpdates.doorThickness ?? box.doorThickness ?? 18,
                backplankThickness: dimensionUpdates.backplankThickness ?? box.backplankThickness ?? 10,
              };
              
              // Recalculate all plank dimensions using formulas
              const updatedPlanks = recalculatePlanks(box.planks, newDimensions);
              
              console.log('[Store] Recalculated planks for box', boxId, 'with dimensions:', newDimensions);
              
              return {
                ...box,
                boxWidth: newDimensions.boxWidth,
                boxDepth: newDimensions.boxDepth,
                boxHeight: newDimensions.boxHeight,
                skirting: newDimensions.skirting,
                skirtingWidth: newDimensions.skirtingWidth,
                carcusThickness: newDimensions.carcusThickness,
                doorThickness: newDimensions.doorThickness,
                backplankThickness: newDimensions.backplankThickness,
                dimensions: {
                  lenX: newDimensions.boxWidth,
                  lenY: newDimensions.boxDepth,
                  lenZ: newDimensions.boxHeight,
                },
                planks: updatedPlanks,
              };
            }),
          })),
          isDirty: true,
        }));
      },

      // ============================================
      // PLANK ACTIONS
      // ============================================

      addPlank: (boxId, plankData) => {
        const id = generateId('plank');
        const plank: Plank = {
          ...plankData,
          id,
        };
        set((state) => ({
          walls: state.walls.map((w) => ({
            ...w,
            boxes: w.boxes.map((b) =>
              b.id === boxId
                ? {
                    ...b,
                    planks: [...b.planks, plank],
                    checklist: [
                      ...b.checklist,
                      {
                        id: plank.id,
                        name: plank.entityName,
                        material: plank.material,
                        dimensions: `${plank.dimensions.lenX} × ${plank.dimensions.lenY} × ${plank.dimensions.lenZ}`,
                      },
                    ],
                  }
                : b
            ),
          })),
          isDirty: true,
        }));
        return id;
      },

      updatePlank: (id, updates) => {
        set((state) => ({
          walls: state.walls.map((w) => ({
            ...w,
            boxes: w.boxes.map((b) => ({
              ...b,
              planks: b.planks.map((p) =>
                p.id === id ? { ...p, ...updates } : p
              ),
            })),
          })),
          isDirty: true,
        }));
      },

      deletePlank: (id) => {
        set((state) => ({
          walls: state.walls.map((w) => ({
            ...w,
            boxes: w.boxes.map((b) => ({
              ...b,
              planks: b.planks.filter((p) => p.id !== id),
              checklist: b.checklist.filter((c) => c.id !== id),
            })),
          })),
          selectedPlankId: state.selectedPlankId === id ? null : state.selectedPlankId,
          isDirty: true,
        }));
      },

      selectPlank: (id) => {
        set({ selectedPlankId: id });
      },

      // ============================================
      // MODE & INTERACTION
      // ============================================

      setDesignMode: (mode) => {
        set({ designMode: mode });
      },

      setPlacingModel: (modelId) => {
        set({
          placingModelId: modelId,
          designMode: modelId ? 'place' : 'select',
        });
      },

      // ============================================
      // CATALOG
      // ============================================

      setCatalogModels: (models) => {
        set({ catalogModels: models });
      },

      setCatalogBoxesWithPlanks: (boxes) => {
        // Log Level 3 data summary when catalog is loaded
        let totalPlanks = 0;
        let totalSubComponents = 0;
        boxes.forEach(box => {
          totalPlanks += box.planks.length;
          box.planks.forEach(plank => {
            const subCount = plank.subComponents?.length || 0;
            totalSubComponents += subCount;
            if (subCount > 0) {
              console.log(`[Store setCatalog] Box "${box.entityName}" > Plank "${plank.entityName}": ${subCount} subComponents`);
            }
          });
        });
        console.log(`[Store setCatalog] ====== CATALOG LOADED ======`);
        console.log(`[Store setCatalog] Boxes: ${boxes.length}`);
        console.log(`[Store setCatalog] Total planks: ${totalPlanks}`);
        console.log(`[Store setCatalog] Total Level 3 subComponents: ${totalSubComponents}`);
        console.log(`[Store setCatalog] ================================`);
        
        if (totalSubComponents === 0) {
          console.warn(`[Store setCatalog] ⚠️ WARNING: No Level 3 data in catalog! Check CSV parsing.`);
        }
        
        set({ catalogBoxesWithPlanks: boxes });
      },

      setPlywoodLibrary: (options) => {
        set({ plywoodLibrary: options });
      },

      setLaminateLibrary: (options) => {
        set({ laminateLibrary: options });
      },

      setCatalogLoaded: (loaded) => {
        set({ catalogLoaded: loaded });
      },
      
      setLastCatalogRefresh: (date) => {
        set({ lastCatalogRefresh: date });
      },
      
      setIsRefreshingCatalog: (refreshing) => {
        set({ isRefreshingCatalog: refreshing });
      },

      // Add box from catalog with plank templates
      // Uses formula-based plank generation for accurate dimensions
      addBoxFromCatalog: (wallId, catalogBoxId, position) => {
        get().pushHistory(); // Save state before change
        const state = get();
        
        // Debug: Log what we're looking for
        console.log(`[Store addBoxFromCatalog] Looking for catalogBoxId: "${catalogBoxId}"`);
        console.log(`[Store addBoxFromCatalog] Available catalog boxes: ${state.catalogBoxesWithPlanks.length}`);
        state.catalogBoxesWithPlanks.forEach((b, i) => {
          const totalSubComps = b.planks.reduce((sum, p) => sum + (p.subComponents?.length || 0), 0);
          console.log(`  [${i}] id="${b.id}" name="${b.entityName}" planks=${b.planks.length} subComponents=${totalSubComps}`);
        });
        
        const catalogBox = state.catalogBoxesWithPlanks.find(b => b.id === catalogBoxId);
        
        if (!catalogBox) {
          console.error('[Store] Catalog box not found:', catalogBoxId);
          console.log('[Store] Available IDs:', state.catalogBoxesWithPlanks.map(b => b.id));
          return null;
        }
        
        // Debug: Log the found box
        const totalSubComps = catalogBox.planks.reduce((sum, p) => sum + (p.subComponents?.length || 0), 0);
        console.log(`[Store] Found catalog box: "${catalogBox.entityName}" with ${catalogBox.planks.length} planks and ${totalSubComps} total subComponents`);

        const boxId = generateId('box');
        
        // Create box dimensions object for formula calculations
        const boxDimensions: BoxDimensions = {
          boxWidth: catalogBox.boxWidth,
          boxDepth: catalogBox.boxDepth,
          boxHeight: catalogBox.boxHeight,
          skirting: catalogBox.skirting || 100,
          skirtingWidth: catalogBox.skirtingWidth || 50,
          carcusThickness: catalogBox.carcusThickness || 18,
          doorThickness: catalogBox.doorThickness || 18,
          backplankThickness: catalogBox.backplankThickness || 10,
        };
        
        // Generate planks using formula system (like Google Sheets formulas)
        // This ensures dimensions are calculated correctly based on box dimensions
        let planks: Plank[];
        
        if (catalogBox.planks && catalogBox.planks.length > 0) {
          // Use catalog plank templates as base, then recalculate using formulas
          console.log(`[Store] Processing ${catalogBox.planks.length} plank templates from catalog box "${catalogBox.entityName}"`);
          
          planks = catalogBox.planks.map((template, index) => {
            // Debug: Log subComponents for each template
            const subCompCount = template.subComponents?.length || 0;
            if (subCompCount > 0) {
              console.log(`[Store] Plank template "${template.entityName}": ${subCompCount} subComponents`);
              template.subComponents?.forEach((sc, i) => {
                console.log(`[Store]   [${i}] ${sc.entityName} at (${sc.x}, ${sc.y}, ${sc.z})`);
              });
            }
            
            // Transform subComponents (Level 3 data) to operations
            const operations = template.subComponents && template.subComponents.length > 0
              ? transformSubComponentsToOperations(template.subComponents)
              : undefined;
            
            // Log the transformed operations
            if (operations) {
              const opCounts = {
                screws: operations.screws?.length || 0,
                hinges: operations.hinges?.length || 0,
                vb_main: operations.vb_main?.length || 0,
                vb_double: operations.vb_double?.length || 0,
                slots: operations.slots?.length || 0,
                grooves: operations.grooves?.length || 0,
                profiles: operations.profiles?.length || 0,
                l_cuts: operations.l_cuts?.length || 0,
              };
              const totalOps = Object.values(opCounts).reduce((a, b) => a + b, 0);
              if (totalOps > 0) {
                console.log(`[Store] Created operations for "${template.entityName}":`, opCounts);
              }
            }
            
            return {
              id: generateId('plank'),
              entityName: template.entityName,
              material: template.material || 'Plywood',
              materialColor: getMaterialColor(template.entityName, template.material),
              thickness: template.lenZ < template.lenX && template.lenZ < template.lenY 
                ? template.lenZ 
                : template.lenY < template.lenX 
                  ? template.lenY 
                  : template.lenX,
              position: {
                x: template.x,
                y: template.y,
                z: template.z,
              },
              dimensions: {
                lenX: template.lenX,
                lenY: template.lenY,
                lenZ: template.lenZ,
              },
              role: determinePlankRole(template.entityName),
              explodeDirection: { x: 0, y: 0, z: 0 },
              assemblyDirection: { arrow: '', text: '' },
              isDoor: template.entityName.toLowerCase().includes('door'),
              assemblyOrder: index + 1,
              autoGenerated: false,
              rowIndex: template.rowIndex,
              // Level 3 operations (holes, grooves, L-cuts, etc.)
              operations,
            };
          });
        } else {
          // Generate planks from formulas if no templates exist
          planks = calculatePlanksFromFormulas(boxDimensions);
        }

        // Debug: Log the created planks and their operations
        console.log(`[Store] Created ${planks.length} planks for box "${catalogBox.entityName}":`);
        planks.forEach((plank, idx) => {
          const opCount = plank.operations ? 
            (plank.operations.screws?.length || 0) +
            (plank.operations.hinges?.length || 0) +
            (plank.operations.vb_main?.length || 0) +
            (plank.operations.vb_double?.length || 0) +
            (plank.operations.slots?.length || 0) +
            (plank.operations.grooves?.length || 0) +
            (plank.operations.profiles?.length || 0) +
            (plank.operations.l_cuts?.length || 0) : 0;
          console.log(`  [${idx}] "${plank.entityName}" - operations: ${opCount}`);
        });

        // Box position: passed from CatalogPanel which uses BoxDefaultsManager
        // Position is in data coordinates (X=right, Y=depth towards user, Z=up)
        // First box: {x: 0, y: boxDepth, z: 0} - back face at Y=0 (against wall)
        const box: Box = {
          id: boxId,
          entityName: catalogBox.entityName,
          roomName: '',
          unitLocation: '',
          boxModel: catalogBox.boxModel,
          boxType: catalogBox.boxType,
          position,
          dimensions: {
            lenX: catalogBox.boxWidth,
            lenY: catalogBox.boxDepth,
            lenZ: catalogBox.boxHeight,
          },
          planks,
          checklist: planks.map(p => ({
            id: p.id,
            name: p.entityName,
            material: p.material,
            dimensions: `${p.dimensions.lenX} × ${p.dimensions.lenY} × ${p.dimensions.lenZ}`,
          })),
          boxWidth: catalogBox.boxWidth,
          boxDepth: catalogBox.boxDepth,
          boxHeight: catalogBox.boxHeight,
          skirting: catalogBox.skirting || 100,
          skirtingWidth: catalogBox.skirtingWidth || 50,
          carcusThickness: catalogBox.carcusThickness || 18,
          doorThickness: catalogBox.doorThickness || 18,
          backplankThickness: catalogBox.backplankThickness || 10,
        };

        set((state) => ({
          walls: state.walls.map((w) =>
            w.id === wallId ? { ...w, boxes: [...w.boxes, box] } : w
          ),
          isDirty: true,
        }));

        // Count planks with operations for logging
        const planksWithOps = planks.filter(p => p.operations && (
          (p.operations.screws?.length || 0) +
          (p.operations.hinges?.length || 0) +
          (p.operations.vb_main?.length || 0) +
          (p.operations.vb_double?.length || 0) +
          (p.operations.slots?.length || 0) +
          (p.operations.grooves?.length || 0) +
          (p.operations.profiles?.length || 0) +
          (p.operations.l_cuts?.length || 0)
        ) > 0).length;
        
        console.log(`[Store] Added box "${catalogBox.entityName}" at position (${position.x}, ${position.y}, ${position.z}) with ${planks.length} planks (${planksWithOps} have Level 3 operations)`);
        return boxId;
      },
      
      // Apply laminate to a box (updates plank material colors and textures with visual feedback)
      applyLaminateToBox: (boxId, laminate, side) => {
        get().pushHistory(); // Save state before change
        set((state) => ({
          walls: state.walls.map((wall) => ({
            ...wall,
            boxes: wall.boxes.map((box) => {
              if (box.id !== boxId) return box;
              
              // Calculate laminate display color for 3D visualization (fallback)
              const laminateColor = getLaminateDisplayColor(laminate);
              
              // Convert Google Drive URL to direct thumbnail URL for texture loading
              const rawPhotoUrl = laminate.photoUrl || '';
              const textureUrl = rawPhotoUrl ? localConvertDriveUrl(rawPhotoUrl) : '';
              
              console.log(`[Store] Applying laminate to box ${boxId}: code=${laminate.code}, textureUrl=${textureUrl}`);
              
              return {
                ...box,
                outerLaminate: side !== 'inner' ? laminate : box.outerLaminate,
                innerLaminate: side !== 'outer' ? laminate : box.innerLaminate,
                planks: box.planks.map(plank => {
                  // Apply to non-back planks for outer, all planks for both
                  const isBackPlank = plank.role === 'back';
                  const shouldApply = side === 'both' || 
                    (side === 'outer' && !isBackPlank) ||
                    (side === 'inner' && isBackPlank);
                  
                  if (!shouldApply) return plank;
                  
                  return {
                    ...plank,
                    materialColor: laminateColor,
                    laminateCode: laminate.code,
                    laminateBrand: laminate.brand,
                    // Store converted texture URL for 3D rendering
                    textureUrl: textureUrl,
                    outerLaminateUrl: side !== 'inner' ? textureUrl : plank.outerLaminateUrl,
                    innerLaminateUrl: side !== 'outer' ? textureUrl : plank.innerLaminateUrl,
                  };
                }),
              };
            }),
          })),
          isDirty: true,
        }));
        
        console.log(`[Store] Applied laminate "${laminate.code}" to box ${boxId} (${side})`);
      },

      // ============================================
      // CAMERA & VIEW
      // ============================================

      setCameraPosition: (position) => {
        set({ cameraPosition: position });
      },

      setCameraTarget: (target) => {
        set({ cameraTarget: target });
      },

      setViewMode: (mode) => {
        set({ viewMode: mode });
        // Set camera based on view mode
        switch (mode) {
          case 'top':
            set({
              cameraPosition: { x: 0, y: 0, z: 5000 },
              cameraTarget: { x: 0, y: 0, z: 0 },
            });
            break;
          case 'front':
            set({
              cameraPosition: { x: 0, y: -5000, z: 1000 },
              cameraTarget: { x: 0, y: 0, z: 1000 },
            });
            break;
          case 'side':
            set({
              cameraPosition: { x: 5000, y: 0, z: 1000 },
              cameraTarget: { x: 0, y: 0, z: 1000 },
            });
            break;
          case 'perspective':
          default:
            set({
              cameraPosition: DEFAULT_CAMERA_POSITION,
              cameraTarget: DEFAULT_CAMERA_TARGET,
            });
            break;
        }
      },

      resetCamera: () => {
        set({
          cameraPosition: DEFAULT_CAMERA_POSITION,
          cameraTarget: DEFAULT_CAMERA_TARGET,
          viewMode: 'perspective',
        });
      },

      // ============================================
      // UI TOGGLES
      // ============================================

      toggleGrid: () => {
        set((state) => ({ showGrid: !state.showGrid }));
      },

      toggleAxes: () => {
        set((state) => ({ showAxes: !state.showAxes }));
      },

      toggleLabels: () => {
        set((state) => ({ showLabels: !state.showLabels }));
      },

      toggleSnap: () => {
        set((state) => ({ snapEnabled: !state.snapEnabled }));
      },

      setSnapGridSize: (size) => {
        set({ snapGridSize: size });
      },

      // ============================================
      // GUIDELINES (Construction Lines)
      // ============================================

      addGuideline: (guidelineData) => {
        get().pushHistory(); // Save state before change for undo
        const id = generateId('guide');
        const guideline: Guideline = {
          ...guidelineData,
          id,
        };
        set((state) => ({
          guidelines: [...state.guidelines, guideline],
        }));
        return id;
      },

      updateGuideline: (id, updates) => {
        get().pushHistory(); // Save state before change for undo
        set((state) => ({
          guidelines: state.guidelines.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        }));
      },

      deleteGuideline: (id) => {
        get().pushHistory(); // Save state before change for undo
        set((state) => ({
          guidelines: state.guidelines.filter((g) => g.id !== id),
          selectedGuidelineId: state.selectedGuidelineId === id ? null : state.selectedGuidelineId,
        }));
      },

      selectGuideline: (id) => {
        set({ selectedGuidelineId: id });
      },

      clearGuidelines: () => {
        get().pushHistory(); // Save state before change for undo
        set({ guidelines: [], selectedGuidelineId: null });
      },

      startPlacingGuideline: (startPoint) => {
        set({
          isPlacingGuideline: true,
          guidelineStartPoint: startPoint,
        });
      },

      finishPlacingGuideline: (endPoint, axis) => {
        const state = get();
        if (!state.guidelineStartPoint) return;

        get().pushHistory(); // Save state before change for undo

        const id = generateId('guide');
        const guideline: Guideline = {
          id,
          start: state.guidelineStartPoint,
          end: endPoint,
          axis,
          color: axis === 'x' ? '#EF4444' : axis === 'y' ? '#22C55E' : '#3B82F6',
          isTemporary: false,
        };

        set((s) => ({
          guidelines: [...s.guidelines, guideline],
          isPlacingGuideline: false,
          guidelineStartPoint: null,
        }));
      },

      cancelPlacingGuideline: () => {
        set({
          isPlacingGuideline: false,
          guidelineStartPoint: null,
        });
      },

      // ============================================
      // MEASUREMENT TOOL (Tape Measure)
      // ============================================

      setMeasurementMode: (mode) => {
        set({ measurementMode: mode });
      },

      addMeasurement: (result) => {
        get().pushHistory();
        const id = generateId('measure');
        const measurement: MeasurementResult = {
          ...result,
          id,
          timestamp: Date.now(),
        };
        set((state) => {
          const newHistory = [measurement, ...state.measurementHistory].slice(0, 20);
          return { measurementHistory: newHistory };
        });
        return id;
      },

      clearMeasurementHistory: () => {
        set({ measurementHistory: [] });
      },

      addMeasureGuideLine: (guide) => {
        get().pushHistory();
        const id = generateId('mguide');
        const newGuide: MeasureGuideLine = {
          ...guide,
          id,
        };
        set((state) => ({
          measureGuideLines: [...state.measureGuideLines, newGuide],
        }));
        return id;
      },

      updateMeasureGuideLine: (id, updates) => {
        get().pushHistory();
        set((state) => ({
          measureGuideLines: state.measureGuideLines.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        }));
      },

      deleteMeasureGuideLine: (id) => {
        get().pushHistory();
        set((state) => ({
          measureGuideLines: state.measureGuideLines.filter((g) => g.id !== id),
          selectedMeasureGuideId: state.selectedMeasureGuideId === id ? null : state.selectedMeasureGuideId,
        }));
      },

      addMeasureGuidePoint: (point) => {
        get().pushHistory();
        const id = generateId('mgpoint');
        const newPoint: MeasureGuidePoint = {
          ...point,
          id,
        };
        set((state) => ({
          measureGuidePoints: [...state.measureGuidePoints, newPoint],
        }));
        return id;
      },

      deleteMeasureGuidePoint: (id) => {
        get().pushHistory();
        set((state) => ({
          measureGuidePoints: state.measureGuidePoints.filter((p) => p.id !== id),
        }));
      },

      clearMeasureGuides: () => {
        get().pushHistory();
        set({
          measureGuideLines: [],
          measureGuidePoints: [],
          selectedMeasureGuideId: null,
        });
      },

      toggleMeasureGuidesVisible: () => {
        set((state) => ({ measureGuidesVisible: !state.measureGuidesVisible }));
      },

      setActiveMeasurement: (measurement) => {
        set({ activeMeasurement: measurement });
      },

      selectMeasureGuide: (id) => {
        set({ selectedMeasureGuideId: id });
      },

      setMoveToolRuntime: (runtime) => {
        set({ moveToolRuntime: runtime });
      },

      // ============================================
      // FILE GENERATION
      // ============================================

      setGenerationProgress: (progress) => {
        set({ generationProgress: progress });
      },

      updateGenerationStep: (stepId, updates) => {
        set((state) => {
          if (!state.generationProgress) return state;
          return {
            generationProgress: {
              ...state.generationProgress,
              steps: state.generationProgress.steps.map((step) =>
                step.id === stepId ? { ...step, ...updates } : step
              ),
            },
          };
        });
      },

      setRawData: (data) => {
        set({ rawData: data });
      },

      setFormattedData: (data) => {
        set({ formattedData: data });
      },

      setPlankList: (data) => {
        set({ plankList: data });
      },

      setNestResults: (data) => {
        set({ nestResults: data });
      },

      setMaterialSummary: (data) => {
        set({ materialSummary: data });
      },

      clearGeneratedData: () => {
        set({
          generationProgress: null,
          rawData: null,
          formattedData: null,
          plankList: null,
          nestResults: null,
          materialSummary: null,
        });
      },

      // ============================================
      // PROJECT
      // ============================================

      setProjectName: (name) => {
        set({ projectName: name, isDirty: true });
      },

      setProjectId: (id) => {
        set({ projectId: id });
      },

      markDirty: () => {
        set({ isDirty: true });
      },

      markSaved: () => {
        set({
          isDirty: false,
          lastSaved: new Date().toISOString(),
        });
      },

      // ============================================
      // CUSTOMER DETAILS
      // ============================================

      setCustomerDetails: (details) => {
        set((state) => ({
          customerDetails: {
            ...state.customerDetails,
            ...details,
          },
          isDirty: true,
        }));
      },

      clearCustomerDetails: () => {
        set({
          customerDetails: DEFAULT_CUSTOMER_DETAILS,
          isDirty: true,
        });
      },

      hasCustomerDetails: () => {
        const state = get();
        return !!(
          state.customerDetails.customerName ||
          state.customerDetails.firmName
        );
      },

      // ============================================
      // BULK OPERATIONS
      // ============================================

      loadDesign: (data) => {
        set({
          walls: data.walls,
          projectName: data.projectName || 'Imported Design',
          customerDetails: data.customerDetails || DEFAULT_CUSTOMER_DETAILS,
          selectedWallId: null,
          selectedBoxId: null,
          selectedPlankId: null,
          isDirty: false,
          lastSaved: new Date().toISOString(),
        });
      },

      clearDesign: () => {
        set({
          walls: [],
          selectedWallId: null,
          selectedBoxId: null,
          selectedPlankId: null,
          generationProgress: null,
          formattedData: null,
          plankList: null,
          nestResults: null,
          materialSummary: null,
          customerDetails: DEFAULT_CUSTOMER_DETAILS,
          projectName: 'Untitled Project',
          projectId: null,
          isDirty: false,
          lastSaved: null,
        });
      },

      getDesignData: () => {
        const state = get();
        return {
          walls: state.walls,
          projectName: state.projectName,
          customerDetails: state.customerDetails,
        };
      },
    }),
    {
      name: 'designer-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        walls: state.walls,
        projectName: state.projectName,
        projectId: state.projectId,
        lastSaved: state.lastSaved,
        customerDetails: state.customerDetails,
        showGrid: state.showGrid,
        showAxes: state.showAxes,
        showLabels: state.showLabels,
        snapEnabled: state.snapEnabled,
        snapGridSize: state.snapGridSize,
      }),
    }
  )
);

// ============================================
// SELECTOR HOOKS
// ============================================

export const useSelectedWall = () => {
  const walls = useDesignerStore((state) => state.walls);
  const selectedWallId = useDesignerStore((state) => state.selectedWallId);
  return walls.find((w) => w.id === selectedWallId) || null;
};

export const useSelectedBox = () => {
  const walls = useDesignerStore((state) => state.walls);
  const selectedBoxId = useDesignerStore((state) => state.selectedBoxId);
  for (const wall of walls) {
    const box = wall.boxes.find((b) => b.id === selectedBoxId);
    if (box) return box;
  }
  return null;
};

export const useSelectedPlank = () => {
  const walls = useDesignerStore((state) => state.walls);
  const selectedPlankId = useDesignerStore((state) => state.selectedPlankId);
  for (const wall of walls) {
    for (const box of wall.boxes) {
      const plank = box.planks.find((p) => p.id === selectedPlankId);
      if (plank) return plank;
    }
  }
  return null;
};

export const useAllBoxes = () => {
  const walls = useDesignerStore((state) => state.walls);
  return walls.flatMap((w) => w.boxes);
};

export const useAllPlanks = () => {
  const walls = useDesignerStore((state) => state.walls);
  return walls.flatMap((w) => w.boxes.flatMap((b) => b.planks));
};

export const useDesignSummary = () => {
  const walls = useDesignerStore((state) => state.walls);
  const totalBoxes = walls.reduce((sum, w) => sum + w.boxes.length, 0);
  const totalPlanks = walls.reduce(
    (sum, w) => sum + w.boxes.reduce((s, b) => s + b.planks.length, 0),
    0
  );
  return {
    totalWalls: walls.length,
    totalBoxes,
    totalPlanks,
  };
};
