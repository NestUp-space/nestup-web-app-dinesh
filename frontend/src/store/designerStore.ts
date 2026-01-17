/**
 * Cabinet Designer State Management
 * Central Zustand store for the 3D cabinet designer
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  DesignerWall,
  DesignerBox,
  DesignerPlank,
  BoxTemplate,
  PlankTemplate,
  Catalog,
  PlywoodMaterial,
  Laminate,
  SnapSettings,
  Position3D,
  BoxDimensions,
  BoxMaterials,
} from '@/types/visualiser';

// ============================================
// Types
// ============================================

export type DesignerTool = 'select' | 'move' | 'rotate' | 'place';
export type ViewMode = 'perspective' | 'front' | 'top' | 'right';

interface HistoryEntry {
  walls: DesignerWall[];
  timestamp: number;
}

interface DesignerState {
  // Project
  projectId: string | null;
  projectName: string;
  
  // Walls
  walls: DesignerWall[];
  currentWallId: string | null;
  
  // Selection
  selectedBoxId: string | null;
  selectedPlankIds: string[];
  hoveredObjectId: string | null;
  
  // Tool
  currentTool: DesignerTool;
  viewMode: ViewMode;
  
  // Snap
  isSnappingEnabled: boolean;
  snapSettings: SnapSettings;
  
  // UI State
  showGrid: boolean;
  showDimensions: boolean;
  showAxes: boolean;
  explodeAmount: number;
  
  // Panels
  isCatalogPanelOpen: boolean;
  isPropertiesPanelOpen: boolean;
  isLaminatePanelOpen: boolean;
  isWallPanelOpen: boolean;
  
  // Catalog
  catalogs: Catalog[];
  activeCatalogId: string | null;
  boxTemplates: BoxTemplate[];
  placingTemplateId: string | null;
  
  // Materials
  plywoodOptions: PlywoodMaterial[];
  laminateOptions: Laminate[];
  
  // LiDAR
  pointCloudData: Float32Array | null;
  isPointCloudVisible: boolean;
  detectedSurfaces: any[];
  
  // History (Undo/Redo)
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  maxHistorySize: number;
  
  // Auto-save
  lastSavedAt: number | null;
  isDirty: boolean;
}

interface DesignerActions {
  // Project
  setProject: (id: string | null, name: string) => void;
  
  // Walls
  setCurrentWall: (wallId: string | null) => void;
  addWall: (wall: Omit<DesignerWall, 'id' | 'boxes'>) => string;
  updateWall: (wallId: string, updates: Partial<DesignerWall>) => void;
  deleteWall: (wallId: string) => void;
  reorderWalls: (wallIds: string[]) => void;
  
  // Boxes
  addBox: (wallId: string, box: Omit<DesignerBox, 'id' | 'planks'>, planks?: DesignerPlank[]) => string;
  updateBox: (boxId: string, updates: Partial<DesignerBox>) => void;
  updateBoxPosition: (boxId: string, position: Position3D) => void;
  updateBoxRotation: (boxId: string, rotation: number) => void;
  updateBoxDimensions: (boxId: string, dimensions: Partial<BoxDimensions>) => void;
  updateBoxMaterials: (boxId: string, materials: Partial<BoxMaterials>) => void;
  deleteBox: (boxId: string) => void;
  duplicateBox: (boxId: string, newPosition?: Position3D) => string | null;
  
  // Planks
  updatePlank: (boxId: string, plankId: string, updates: Partial<DesignerPlank>) => void;
  updatePlankMaterial: (boxId: string, plankId: string, outerCode: string, innerCode?: string) => void;
  bulkUpdatePlankMaterials: (boxId: string, plankIds: string[], outerCode: string, innerCode?: string) => void;
  replacePlanks: (boxId: string, planks: DesignerPlank[]) => void;
  
  // Selection
  selectBox: (boxId: string | null) => void;
  selectPlanks: (plankIds: string[]) => void;
  addPlankToSelection: (plankId: string) => void;
  removePlankFromSelection: (plankId: string) => void;
  clearSelection: () => void;
  setHoveredObject: (objectId: string | null) => void;
  
  // Tool
  setTool: (tool: DesignerTool) => void;
  setViewMode: (mode: ViewMode) => void;
  
  // Snap
  toggleSnapping: () => void;
  updateSnapSettings: (settings: Partial<SnapSettings>) => void;
  
  // UI
  toggleGrid: () => void;
  toggleDimensions: () => void;
  toggleAxes: () => void;
  setExplodeAmount: (amount: number) => void;
  toggleCatalogPanel: () => void;
  togglePropertiesPanel: () => void;
  toggleLaminatePanel: () => void;
  toggleWallPanel: () => void;
  
  // Catalog
  setCatalogs: (catalogs: Catalog[]) => void;
  setActiveCatalog: (catalogId: string | null) => void;
  setBoxTemplates: (templates: BoxTemplate[]) => void;
  addCatalog: (catalog: Catalog) => void;
  setPlacingTemplate: (templateId: string | null) => void;
  
  // Materials
  setPlywoodOptions: (options: PlywoodMaterial[]) => void;
  setLaminateOptions: (options: Laminate[]) => void;
  
  // LiDAR
  setPointCloudData: (data: Float32Array | null) => void;
  togglePointCloudVisibility: () => void;
  setDetectedSurfaces: (surfaces: any[]) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  clearHistory: () => void;
  
  // Persistence
  markDirty: () => void;
  markSaved: () => void;
  
  // Utilities
  getCurrentWall: () => DesignerWall | null;
  getBoxById: (boxId: string) => { box: DesignerBox; wall: DesignerWall } | null;
  getPlankById: (plankId: string) => { plank: DesignerPlank; box: DesignerBox; wall: DesignerWall } | null;
  getAllBoxes: () => DesignerBox[];
  getAllPlanks: () => DesignerPlank[];
  
  // Reset
  reset: () => void;
}

// ============================================
// Initial State
// ============================================

const DEFAULT_SNAP_SETTINGS: SnapSettings = {
  enabled: true,
  gridSize: 50,
  snapDistance: 20,
  floorSnap: true,
  wallSnap: true,
  boxEdgeSnap: true,
  gridSnap: true,
  cornerSnap: true,
};

const initialState: DesignerState = {
  // Project
  projectId: null,
  projectName: 'Untitled Project',
  
  // Walls
  walls: [],
  currentWallId: null,
  
  // Selection
  selectedBoxId: null,
  selectedPlankIds: [],
  hoveredObjectId: null,
  
  // Tool
  currentTool: 'select',
  viewMode: 'perspective',
  
  // Snap
  isSnappingEnabled: true,
  snapSettings: DEFAULT_SNAP_SETTINGS,
  
  // UI State
  showGrid: true,
  showDimensions: true,
  showAxes: true,
  explodeAmount: 0,
  
  // Panels
  isCatalogPanelOpen: true,
  isPropertiesPanelOpen: true,
  isLaminatePanelOpen: false,
  isWallPanelOpen: true,
  
  // Catalog
  catalogs: [],
  activeCatalogId: null,
  boxTemplates: [],
  placingTemplateId: null,
  
  // Materials
  plywoodOptions: [],
  laminateOptions: [],
  
  // LiDAR
  pointCloudData: null,
  isPointCloudVisible: false,
  detectedSurfaces: [],
  
  // History
  undoStack: [],
  redoStack: [],
  maxHistorySize: 50,
  
  // Auto-save
  lastSavedAt: null,
  isDirty: false,
};

// ============================================
// Helper Functions
// ============================================

function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// Store
// ============================================

export const useDesignerStore = create<DesignerState & DesignerActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // ============================================
        // Project Actions
        // ============================================
        
        setProject: (id, name) => set({ projectId: id, projectName: name }),

        // ============================================
        // Wall Actions
        // ============================================
        
        setCurrentWall: (wallId) => set({ 
          currentWallId: wallId,
          selectedBoxId: null,
          selectedPlankIds: [],
        }),

        addWall: (wallData) => {
          const id = generateId('wall-');
          const newWall: DesignerWall = {
            ...wallData,
            id,
            boxes: [],
            sortOrder: get().walls.length,
          };
          
          set((state) => {
            const newState = {
              walls: [...state.walls, newWall],
              currentWallId: state.currentWallId || id,
              isDirty: true,
            };
            return newState;
          });
          
          get().saveToHistory();
          return id;
        },

        updateWall: (wallId, updates) => {
          set((state) => ({
            walls: state.walls.map((wall) =>
              wall.id === wallId ? { ...wall, ...updates } : wall
            ),
            isDirty: true,
          }));
          get().saveToHistory();
        },

        deleteWall: (wallId) => {
          set((state) => {
            const newWalls = state.walls.filter((wall) => wall.id !== wallId);
            const newCurrentWallId = 
              state.currentWallId === wallId 
                ? (newWalls.length > 0 ? newWalls[0].id : null)
                : state.currentWallId;
            
            return {
              walls: newWalls,
              currentWallId: newCurrentWallId,
              selectedBoxId: null,
              selectedPlankIds: [],
              isDirty: true,
            };
          });
          get().saveToHistory();
        },

        reorderWalls: (wallIds) => {
          set((state) => ({
            walls: wallIds
              .map((id, index) => {
                const wall = state.walls.find((w) => w.id === id);
                return wall ? { ...wall, sortOrder: index } : null;
              })
              .filter((w): w is DesignerWall => w !== null),
            isDirty: true,
          }));
        },

        // ============================================
        // Box Actions
        // ============================================
        
        addBox: (wallId, boxData, planks = []) => {
          const id = generateId('box-');
          const newBox: DesignerBox = {
            ...boxData,
            id,
            planks: planks.map((p, idx) => ({ ...p, id: p.id || generateId('plank-'), parentBoxId: id })),
          };
          
          set((state) => ({
            walls: state.walls.map((wall) =>
              wall.id === wallId
                ? { ...wall, boxes: [...wall.boxes, newBox] }
                : wall
            ),
            isDirty: true,
          }));
          
          get().saveToHistory();
          return id;
        },

        updateBox: (boxId, updates) => {
          set((state) => ({
            walls: state.walls.map((wall) => ({
              ...wall,
              boxes: wall.boxes.map((box) =>
                box.id === boxId ? { ...box, ...updates } : box
              ),
            })),
            isDirty: true,
          }));
          get().saveToHistory();
        },

        updateBoxPosition: (boxId, position) => {
          set((state) => ({
            walls: state.walls.map((wall) => ({
              ...wall,
              boxes: wall.boxes.map((box) =>
                box.id === boxId ? { ...box, position } : box
              ),
            })),
            isDirty: true,
          }));
        },

        updateBoxRotation: (boxId, rotation) => {
          set((state) => ({
            walls: state.walls.map((wall) => ({
              ...wall,
              boxes: wall.boxes.map((box) =>
                box.id === boxId ? { ...box, rotationZ: rotation } : box
              ),
            })),
            isDirty: true,
          }));
        },

        updateBoxDimensions: (boxId, dimensions) => {
          set((state) => ({
            walls: state.walls.map((wall) => ({
              ...wall,
              boxes: wall.boxes.map((box) =>
                box.id === boxId
                  ? {
                      ...box,
                      dimensions: { ...box.dimensions, ...dimensions },
                    }
                  : box
              ),
            })),
            isDirty: true,
          }));
          get().saveToHistory();
        },

        updateBoxMaterials: (boxId, materials) => {
          set((state) => ({
            walls: state.walls.map((wall) => ({
              ...wall,
              boxes: wall.boxes.map((box) =>
                box.id === boxId ? { ...box, ...materials } : box
              ),
            })),
            isDirty: true,
          }));
          get().saveToHistory();
        },

        deleteBox: (boxId) => {
          set((state) => ({
            walls: state.walls.map((wall) => ({
              ...wall,
              boxes: wall.boxes.filter((box) => box.id !== boxId),
            })),
            selectedBoxId: state.selectedBoxId === boxId ? null : state.selectedBoxId,
            selectedPlankIds: [],
            isDirty: true,
          }));
          get().saveToHistory();
        },

        duplicateBox: (boxId, newPosition) => {
          const result = get().getBoxById(boxId);
          if (!result) return null;
          
          const { box, wall } = result;
          const newId = generateId('box-');
          const offset = newPosition || {
            x: box.position.x + 100,
            y: box.position.y,
            z: box.position.z,
          };
          
          const newBox: DesignerBox = {
            ...box,
            id: newId,
            name: `${box.name} (Copy)`,
            position: offset,
            planks: box.planks.map((p) => ({
              ...p,
              id: generateId('plank-'),
              parentBoxId: newId,
            })),
          };
          
          set((state) => ({
            walls: state.walls.map((w) =>
              w.id === wall.id
                ? { ...w, boxes: [...w.boxes, newBox] }
                : w
            ),
            selectedBoxId: newId,
            isDirty: true,
          }));
          
          get().saveToHistory();
          return newId;
        },

        // ============================================
        // Plank Actions
        // ============================================
        
        updatePlank: (boxId, plankId, updates) => {
          set((state) => ({
            walls: state.walls.map((wall) => ({
              ...wall,
              boxes: wall.boxes.map((box) =>
                box.id === boxId
                  ? {
                      ...box,
                      planks: box.planks.map((plank) =>
                        plank.id === plankId ? { ...plank, ...updates } : plank
                      ),
                    }
                  : box
              ),
            })),
            isDirty: true,
          }));
        },

        updatePlankMaterial: (boxId, plankId, outerCode, innerCode) => {
          set((state) => ({
            walls: state.walls.map((wall) => ({
              ...wall,
              boxes: wall.boxes.map((box) =>
                box.id === boxId
                  ? {
                      ...box,
                      planks: box.planks.map((plank) =>
                        plank.id === plankId
                          ? {
                              ...plank,
                              outerLaminateCode: outerCode,
                              innerLaminateCode: innerCode || outerCode,
                            }
                          : plank
                      ),
                    }
                  : box
              ),
            })),
            isDirty: true,
          }));
          get().saveToHistory();
        },

        bulkUpdatePlankMaterials: (boxId, plankIds, outerCode, innerCode) => {
          set((state) => ({
            walls: state.walls.map((wall) => ({
              ...wall,
              boxes: wall.boxes.map((box) =>
                box.id === boxId
                  ? {
                      ...box,
                      planks: box.planks.map((plank) =>
                        plankIds.includes(plank.id)
                          ? {
                              ...plank,
                              outerLaminateCode: outerCode,
                              innerLaminateCode: innerCode || outerCode,
                            }
                          : plank
                      ),
                    }
                  : box
              ),
            })),
            isDirty: true,
          }));
          get().saveToHistory();
        },

        replacePlanks: (boxId, planks) => {
          set((state) => ({
            walls: state.walls.map((wall) => ({
              ...wall,
              boxes: wall.boxes.map((box) =>
                box.id === boxId
                  ? { ...box, planks: planks.map(p => ({ ...p, parentBoxId: boxId })) }
                  : box
              ),
            })),
            isDirty: true,
          }));
          get().saveToHistory();
        },

        // ============================================
        // Selection Actions
        // ============================================
        
        selectBox: (boxId) => set({ 
          selectedBoxId: boxId, 
          selectedPlankIds: [] 
        }),

        selectPlanks: (plankIds) => set({ selectedPlankIds: plankIds }),

        addPlankToSelection: (plankId) => set((state) => ({
          selectedPlankIds: state.selectedPlankIds.includes(plankId)
            ? state.selectedPlankIds
            : [...state.selectedPlankIds, plankId],
        })),

        removePlankFromSelection: (plankId) => set((state) => ({
          selectedPlankIds: state.selectedPlankIds.filter((id) => id !== plankId),
        })),

        clearSelection: () => set({ 
          selectedBoxId: null, 
          selectedPlankIds: [],
          hoveredObjectId: null,
        }),

        setHoveredObject: (objectId) => set({ hoveredObjectId: objectId }),

        // ============================================
        // Tool Actions
        // ============================================
        
        setTool: (tool) => set({ currentTool: tool }),
        setViewMode: (mode) => set({ viewMode: mode }),

        // ============================================
        // Snap Actions
        // ============================================
        
        toggleSnapping: () => set((state) => ({ 
          isSnappingEnabled: !state.isSnappingEnabled 
        })),

        updateSnapSettings: (settings) => set((state) => ({
          snapSettings: { ...state.snapSettings, ...settings },
        })),

        // ============================================
        // UI Actions
        // ============================================
        
        toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
        toggleDimensions: () => set((state) => ({ showDimensions: !state.showDimensions })),
        toggleAxes: () => set((state) => ({ showAxes: !state.showAxes })),
        setExplodeAmount: (amount) => set({ explodeAmount: amount }),
        toggleCatalogPanel: () => set((state) => ({ isCatalogPanelOpen: !state.isCatalogPanelOpen })),
        togglePropertiesPanel: () => set((state) => ({ isPropertiesPanelOpen: !state.isPropertiesPanelOpen })),
        toggleLaminatePanel: () => set((state) => ({ isLaminatePanelOpen: !state.isLaminatePanelOpen })),
        toggleWallPanel: () => set((state) => ({ isWallPanelOpen: !state.isWallPanelOpen })),

        // ============================================
        // Catalog Actions
        // ============================================
        
        setCatalogs: (catalogs) => set({ catalogs }),
        setActiveCatalog: (catalogId) => set({ activeCatalogId: catalogId }),
        setBoxTemplates: (templates) => set({ boxTemplates: templates }),
        addCatalog: (catalog) => set((state) => ({ 
          catalogs: [...state.catalogs, catalog] 
        })),
        setPlacingTemplate: (templateId) => set({ 
          placingTemplateId: templateId,
          currentTool: templateId ? 'place' : 'select',
        }),

        // ============================================
        // Materials Actions
        // ============================================
        
        setPlywoodOptions: (options) => set({ plywoodOptions: options }),
        setLaminateOptions: (options) => set({ laminateOptions: options }),

        // ============================================
        // LiDAR Actions
        // ============================================
        
        setPointCloudData: (data) => set({ pointCloudData: data }),
        togglePointCloudVisibility: () => set((state) => ({ 
          isPointCloudVisible: !state.isPointCloudVisible 
        })),
        setDetectedSurfaces: (surfaces) => set({ detectedSurfaces: surfaces }),

        // ============================================
        // History Actions
        // ============================================
        
        saveToHistory: () => {
          const state = get();
          const entry: HistoryEntry = {
            walls: JSON.parse(JSON.stringify(state.walls)),
            timestamp: Date.now(),
          };
          
          set((state) => ({
            undoStack: [...state.undoStack.slice(-state.maxHistorySize + 1), entry],
            redoStack: [],
          }));
        },

        undo: () => {
          const { undoStack, walls } = get();
          if (undoStack.length === 0) return;
          
          const currentEntry: HistoryEntry = {
            walls: JSON.parse(JSON.stringify(walls)),
            timestamp: Date.now(),
          };
          
          const previousEntry = undoStack[undoStack.length - 1];
          
          set((state) => ({
            walls: previousEntry.walls,
            undoStack: state.undoStack.slice(0, -1),
            redoStack: [...state.redoStack, currentEntry],
            selectedBoxId: null,
            selectedPlankIds: [],
          }));
        },

        redo: () => {
          const { redoStack, walls } = get();
          if (redoStack.length === 0) return;
          
          const currentEntry: HistoryEntry = {
            walls: JSON.parse(JSON.stringify(walls)),
            timestamp: Date.now(),
          };
          
          const nextEntry = redoStack[redoStack.length - 1];
          
          set((state) => ({
            walls: nextEntry.walls,
            redoStack: state.redoStack.slice(0, -1),
            undoStack: [...state.undoStack, currentEntry],
            selectedBoxId: null,
            selectedPlankIds: [],
          }));
        },

        clearHistory: () => set({ undoStack: [], redoStack: [] }),

        // ============================================
        // Persistence Actions
        // ============================================
        
        markDirty: () => set({ isDirty: true }),
        markSaved: () => set({ isDirty: false, lastSavedAt: Date.now() }),

        // ============================================
        // Utility Functions
        // ============================================
        
        getCurrentWall: () => {
          const { walls, currentWallId } = get();
          return walls.find((w) => w.id === currentWallId) || null;
        },

        getBoxById: (boxId) => {
          const { walls } = get();
          for (const wall of walls) {
            const box = wall.boxes.find((b) => b.id === boxId);
            if (box) return { box, wall };
          }
          return null;
        },

        getPlankById: (plankId) => {
          const { walls } = get();
          for (const wall of walls) {
            for (const box of wall.boxes) {
              const plank = box.planks.find((p) => p.id === plankId);
              if (plank) return { plank, box, wall };
            }
          }
          return null;
        },

        getAllBoxes: () => {
          const { walls } = get();
          return walls.flatMap((w) => w.boxes);
        },

        getAllPlanks: () => {
          const { walls } = get();
          return walls.flatMap((w) => w.boxes.flatMap((b) => b.planks));
        },

        // ============================================
        // Reset
        // ============================================
        
        reset: () => set({ ...initialState }),
      }),
      {
        name: 'cabinet-designer-store',
        partialize: (state) => ({
          // Only persist essential data
          projectId: state.projectId,
          projectName: state.projectName,
          walls: state.walls,
          currentWallId: state.currentWallId,
          catalogs: state.catalogs,
          activeCatalogId: state.activeCatalogId,
          boxTemplates: state.boxTemplates,
          plywoodOptions: state.plywoodOptions,
          laminateOptions: state.laminateOptions,
          snapSettings: state.snapSettings,
          showGrid: state.showGrid,
          showDimensions: state.showDimensions,
          lastSavedAt: state.lastSavedAt,
        }),
      }
    ),
    { name: 'designer-store' }
  )
);

// ============================================
// Selectors (for performance optimization)
// ============================================

export const selectCurrentWall = (state: DesignerState) => 
  state.walls.find((w) => w.id === state.currentWallId) || null;

export const selectCurrentWallBoxes = (state: DesignerState) => {
  const wall = state.walls.find((w) => w.id === state.currentWallId);
  return wall?.boxes || [];
};

export const selectSelectedBox = (state: DesignerState) => {
  if (!state.selectedBoxId) return null;
  for (const wall of state.walls) {
    const box = wall.boxes.find((b) => b.id === state.selectedBoxId);
    if (box) return box;
  }
  return null;
};

export const selectCanUndo = (state: DesignerState) => state.undoStack.length > 0;
export const selectCanRedo = (state: DesignerState) => state.redoStack.length > 0;
