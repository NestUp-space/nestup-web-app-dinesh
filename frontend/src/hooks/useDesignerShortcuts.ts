/**
 * Designer Shortcuts Hook
 * Handles keyboard shortcuts for the 3D Cabinet Designer
 * 
 * Shortcuts:
 * - Ctrl+Z: Undo
 * - Ctrl+Y / Ctrl+Shift+Z: Redo
 * - Delete/Backspace: Delete selected item
 * - Escape: Deselect all / Cancel guideline placement
 * - Arrow Keys: Nudge selected box by grid size
 * - Shift + Arrow Keys: Nudge by 1mm
 * - X/Y/Z: Lock axis during drag (handled in drag interaction)
 * 
 * Tool Shortcuts:
 * - V or Space: Select tool
 * - M: Move tool
 * - R: Rotate tool
 * - G: Guidelines tool
 * - P: Paint tool
 * - T: Measure tool (Tape Measure)
 */

import { useEffect, useCallback } from 'react';
import { useDesignerStore } from '@/stores/designerStore';

interface UseDesignerShortcutsOptions {
  enabled?: boolean;
}

export function useDesignerShortcuts(options: UseDesignerShortcutsOptions = {}) {
  const { enabled = true } = options;
  
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    selectedBoxId,
    selectedPlankId,
    selectedWallId,
    selectedGuidelineId,
    deleteBox,
    deletePlank,
    deleteWall,
    deleteGuideline,
    selectBox,
    selectPlank,
    selectWall,
    selectGuideline,
    moveBox,
    snapGridSize,
    walls,
    setDesignMode,
    designMode,
    isPlacingGuideline,
    cancelPlacingGuideline,
  } = useDesignerStore();

  // Get the selected box for nudging
  const getSelectedBox = useCallback(() => {
    if (!selectedBoxId) return null;
    for (const wall of walls) {
      const box = wall.boxes.find(b => b.id === selectedBoxId);
      if (box) return box;
    }
    return null;
  }, [selectedBoxId, walls]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't handle shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const { key, ctrlKey, metaKey, shiftKey } = event;
    const isModifier = ctrlKey || metaKey; // Support both Windows and Mac

    // ============================================
    // UNDO/REDO
    // ============================================
    
    // Ctrl+Z: Undo
    if (isModifier && key === 'z' && !shiftKey) {
      event.preventDefault();
      if (canUndo()) {
        undo();
        console.log('[Shortcuts] Undo');
      }
      return;
    }

    // Ctrl+Y or Ctrl+Shift+Z: Redo
    if ((isModifier && key === 'y') || (isModifier && key === 'z' && shiftKey)) {
      event.preventDefault();
      if (canRedo()) {
        redo();
        console.log('[Shortcuts] Redo');
      }
      return;
    }

    // While Move/Measure tools are active, tool-local handlers own key behavior
    if (designMode === 'move' || designMode === 'measure') {
      if (key === 'Escape' || key === 'Delete' || key === 'Backspace') {
        return;
      }
    }

    // ============================================
    // DELETE
    // ============================================
    
    if (key === 'Delete' || key === 'Backspace') {
      event.preventDefault();
      
      if (selectedGuidelineId) {
        deleteGuideline(selectedGuidelineId);
        console.log('[Shortcuts] Deleted guideline:', selectedGuidelineId);
      } else if (selectedPlankId) {
        deletePlank(selectedPlankId);
        console.log('[Shortcuts] Deleted plank:', selectedPlankId);
      } else if (selectedBoxId) {
        deleteBox(selectedBoxId);
        console.log('[Shortcuts] Deleted box:', selectedBoxId);
      } else if (selectedWallId) {
        deleteWall(selectedWallId);
        console.log('[Shortcuts] Deleted wall:', selectedWallId);
      }
      return;
    }

    // ============================================
    // ESCAPE - Deselect / Cancel operations
    // ============================================
    
    if (key === 'Escape') {
      event.preventDefault();
      
      // If placing a guideline, cancel it first
      if (isPlacingGuideline) {
        cancelPlacingGuideline();
        console.log('[Shortcuts] Cancelled guideline placement');
        return;
      }
      
      // Otherwise deselect all
      selectBox(null);
      selectPlank(null);
      selectGuideline(null);
      
      // Also switch back to select mode
      setDesignMode('select');
      console.log('[Shortcuts] Deselected all, switched to Select mode');
      return;
    }

    // ============================================
    // TOOL SHORTCUTS (without modifier keys)
    // ============================================
    
    if (!isModifier) {
      const lowerKey = key.toLowerCase();
      
      // V or Space: Select tool
      if (lowerKey === 'v' || key === ' ') {
        event.preventDefault();
        setDesignMode('select');
        console.log('[Shortcuts] Select tool (V/Space)');
        return;
      }
      
      // M: Move tool
      if (lowerKey === 'm') {
        event.preventDefault();
        setDesignMode('move');
        console.log('[Shortcuts] Move tool (M)');
        return;
      }
      
      // R: Rotate tool
      if (lowerKey === 'r') {
        event.preventDefault();
        setDesignMode('rotate');
        console.log('[Shortcuts] Rotate tool (R)');
        return;
      }
      
      // G: Guidelines tool
      if (lowerKey === 'g') {
        event.preventDefault();
        setDesignMode('guidelines');
        console.log('[Shortcuts] Guidelines tool (G)');
        return;
      }
      
      // P: Paint tool
      if (lowerKey === 'p') {
        event.preventDefault();
        setDesignMode('paint');
        console.log('[Shortcuts] Paint tool (P)');
        return;
      }
      
      // T: Measure tool (Tape Measure)
      if (lowerKey === 't') {
        event.preventDefault();
        setDesignMode('measure');
        console.log('[Shortcuts] Measure tool (T)');
        return;
      }
    }

    // ============================================
    // ARROW KEYS - Axis selection in move mode OR nudge in other modes
    // ============================================
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      const box = getSelectedBox();
      if (!box) return;
      
      // When move tool is active, arrow keys are handled by MoveInputBox for axis selection
      // So we skip handling here to avoid conflicts
      if (designMode === 'move') {
        // Let the MoveInputBox handle arrow keys for axis selection
        // Don't prevent default here - MoveInputBox will handle it
        return;
      }
      
      event.preventDefault();
      
      // In other modes (select, etc.), arrow keys nudge the box
      // Shift = 1mm, otherwise grid size (default 50mm)
      const nudgeAmount = shiftKey ? 1 : snapGridSize;
      
      const newPosition = { ...box.position };
      
      switch (key) {
        case 'ArrowUp':
          // Move up (positive Z in data coords)
          newPosition.z += nudgeAmount;
          break;
        case 'ArrowDown':
          // Move forward (positive Y in data coords)
          newPosition.y += nudgeAmount;
          break;
        case 'ArrowLeft':
          // Move left (negative X)
          newPosition.x -= nudgeAmount;
          break;
        case 'ArrowRight':
          // Move right (positive X)
          newPosition.x += nudgeAmount;
          break;
      }
      
      moveBox(selectedBoxId!, newPosition);
      console.log(`[Shortcuts] Nudged box ${key} by ${nudgeAmount}mm`);
      return;
    }

    // ============================================
    // PAGE UP/DOWN - Move box up/down (Z axis)
    // ============================================
    
    if (key === 'PageUp' || key === 'PageDown') {
      const box = getSelectedBox();
      if (!box) return;
      
      event.preventDefault();
      
      const nudgeAmount = shiftKey ? 1 : snapGridSize;
      const newPosition = { ...box.position };
      
      if (key === 'PageUp') {
        newPosition.z += nudgeAmount;
      } else {
        newPosition.z = Math.max(0, newPosition.z - nudgeAmount); // Don't go below floor
      }
      
      moveBox(selectedBoxId!, newPosition);
      console.log(`[Shortcuts] Moved box ${key} by ${nudgeAmount}mm`);
      return;
    }

  }, [
    enabled,
    undo,
    redo,
    canUndo,
    canRedo,
    selectedBoxId,
    selectedPlankId,
    selectedWallId,
    selectedGuidelineId,
    deleteBox,
    deletePlank,
    deleteWall,
    deleteGuideline,
    selectBox,
    selectPlank,
    selectGuideline,
    moveBox,
    snapGridSize,
    getSelectedBox,
    setDesignMode,
    designMode,
    isPlacingGuideline,
    cancelPlacingGuideline,
  ]);

  // Register keyboard event listener
  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    // Expose these for UI indicators (e.g., toolbar buttons)
    canUndo: canUndo(),
    canRedo: canRedo(),
    undo,
    redo,
  };
}

export default useDesignerShortcuts;
