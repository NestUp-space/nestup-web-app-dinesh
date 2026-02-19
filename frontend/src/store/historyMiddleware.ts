/**
 * History Middleware for Zustand
 * Implements undo/redo functionality by tracking state snapshots
 */

import { Wall, Guideline } from '@/types/visualiser';

// ============================================
// TYPES
// ============================================

export interface DesignSnapshot {
  walls: Wall[];
  guidelines: Guideline[];
  timestamp: number;
}

export interface HistoryState {
  // History stacks
  past: DesignSnapshot[];
  future: DesignSnapshot[];
  
  // Configuration
  historyLimit: number;
  
  // Computed
  canUndo: boolean;
  canRedo: boolean;
  
  // Actions
  pushHistory: (walls: Wall[]) => void;
  undo: () => Wall[] | null;
  redo: () => Wall[] | null;
  clearHistory: () => void;
}

// ============================================
// CONFIGURATION
// ============================================

const HISTORY_LIMIT = 50;

// Actions that should trigger history snapshots
export const TRACKED_ACTIONS = [
  'addWall',
  'updateWall',
  'deleteWall',
  'addBox',
  'updateBox',
  'deleteBox',
  'moveBox',
  'rotateBox',
  'addPlank',
  'updatePlank',
  'deletePlank',
  'updateBoxDimensions',
  'addBoxFromCatalog',
  'applyLaminateToBox',
  'loadDesign',
  'clearDesign',
] as const;

export type TrackedAction = typeof TRACKED_ACTIONS[number];

// ============================================
// HISTORY STORE CREATOR
// ============================================

export const createHistorySlice = (set: any, get: any): HistoryState => ({
  past: [],
  future: [],
  historyLimit: HISTORY_LIMIT,
  
  get canUndo() {
    return get().past.length > 0;
  },
  
  get canRedo() {
    return get().future.length > 0;
  },
  
  pushHistory: (walls: Wall[]) => {
    set((state: HistoryState) => {
      const snapshot: DesignSnapshot = {
        walls: JSON.parse(JSON.stringify(walls)), // Deep clone
        guidelines: [], // Standalone history slice has no guidelines; designerStore uses its own pushHistory with full state
        timestamp: Date.now(),
      };
      
      // Add to past, clear future (new action invalidates redo stack)
      const newPast = [...state.past, snapshot];
      
      // Limit history size
      if (newPast.length > state.historyLimit) {
        newPast.shift();
      }
      
      return {
        past: newPast,
        future: [], // Clear redo stack on new action
      };
    });
  },
  
  undo: () => {
    const state = get();
    if (state.past.length === 0) return null;
    
    const currentWalls = state.walls;
    const previousSnapshot = state.past[state.past.length - 1];
    
    set({
      past: state.past.slice(0, -1),
      future: [
        { walls: JSON.parse(JSON.stringify(currentWalls)), timestamp: Date.now() },
        ...state.future,
      ].slice(0, state.historyLimit),
      walls: previousSnapshot.walls,
    });
    
    return previousSnapshot.walls;
  },
  
  redo: () => {
    const state = get();
    if (state.future.length === 0) return null;
    
    const currentWalls = state.walls;
    const nextSnapshot = state.future[0];
    
    set({
      past: [
        ...state.past,
        { walls: JSON.parse(JSON.stringify(currentWalls)), timestamp: Date.now() },
      ].slice(-state.historyLimit),
      future: state.future.slice(1),
      walls: nextSnapshot.walls,
    });
    
    return nextSnapshot.walls;
  },
  
  clearHistory: () => {
    set({
      past: [],
      future: [],
    });
  },
});

// ============================================
// HELPER: Wrap action with history tracking
// ============================================

export function withHistory<T extends (...args: any[]) => any>(
  action: T,
  getWalls: () => Wall[],
  pushHistory: (walls: Wall[]) => void
): T {
  return ((...args: Parameters<T>) => {
    // Save current state before action
    pushHistory(getWalls());
    // Execute action
    return action(...args);
  }) as T;
}
