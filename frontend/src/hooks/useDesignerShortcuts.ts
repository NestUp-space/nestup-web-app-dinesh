/**
 * useDesignerShortcuts Hook
 * Keyboard shortcut handler for the cabinet designer
 */

"use client";

import { useEffect, useCallback } from "react";
import { useDesignerStore } from "@/store/designerStore";

export interface ShortcutHandlers {
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export function useDesignerShortcuts(handlers?: ShortcutHandlers) {
  // Store actions
  const setTool = useDesignerStore((state) => state.setTool);
  const setViewMode = useDesignerStore((state) => state.setViewMode);
  const selectBox = useDesignerStore((state) => state.selectBox);
  const selectPlanks = useDesignerStore((state) => state.selectPlanks);
  const undo = useDesignerStore((state) => state.undo);
  const redo = useDesignerStore((state) => state.redo);
  const toggleGrid = useDesignerStore((state) => state.toggleGrid);
  const toggleDimensions = useDesignerStore((state) => state.toggleDimensions);
  const toggleSnapping = useDesignerStore((state) => state.toggleSnapping);
  const toggleCatalogPanel = useDesignerStore((state) => state.toggleCatalogPanel);
  const togglePropertiesPanel = useDesignerStore((state) => state.togglePropertiesPanel);
  const toggleWallPanel = useDesignerStore((state) => state.toggleWallPanel);
  const setPlacingTemplate = useDesignerStore((state) => state.setPlacingTemplate);
  const deleteBox = useDesignerStore((state) => state.deleteBox);
  const duplicateBox = useDesignerStore((state) => state.duplicateBox);
  
  // Store state
  const selectedBoxId = useDesignerStore((state) => state.selectedBoxId);
  const placingTemplateId = useDesignerStore((state) => state.placingTemplateId);
  const walls = useDesignerStore((state) => state.walls);
  const currentWallId = useDesignerStore((state) => state.currentWallId);
  const setCurrentWall = useDesignerStore((state) => state.setCurrentWall);

  // Navigate to next/previous wall
  const navigateWall = useCallback((direction: 'next' | 'prev') => {
    if (walls.length <= 1) return;
    
    const currentIndex = walls.findIndex(w => w.id === currentWallId);
    let newIndex: number;
    
    if (direction === 'next') {
      newIndex = currentIndex >= walls.length - 1 ? 0 : currentIndex + 1;
    } else {
      newIndex = currentIndex <= 0 ? walls.length - 1 : currentIndex - 1;
    }
    
    setCurrentWall(walls[newIndex].id);
  }, [walls, currentWallId, setCurrentWall]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (handlers?.onDelete) {
      handlers.onDelete();
    } else if (selectedBoxId) {
      deleteBox(selectedBoxId);
    }
  }, [selectedBoxId, deleteBox, handlers]);

  // Handle duplicate
  const handleDuplicate = useCallback(() => {
    if (handlers?.onDuplicate) {
      handlers.onDuplicate();
    } else if (selectedBoxId) {
      duplicateBox(selectedBoxId);
    }
  }, [selectedBoxId, duplicateBox, handlers]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Tool shortcuts
      switch (key) {
        case 'v':
          if (!ctrl) {
            e.preventDefault();
            setTool('select');
          }
          break;
          
        case 'm':
          if (!ctrl) {
            e.preventDefault();
            setTool('move');
          }
          break;
          
        case 'r':
          if (!ctrl) {
            e.preventDefault();
            setTool('rotate');
          }
          break;
          
        case 'escape':
          e.preventDefault();
          if (placingTemplateId) {
            setPlacingTemplate(null);
          } else {
            selectBox(null);
            selectPlanks([]);
          }
          break;
          
        case 'delete':
        case 'backspace':
          if (!ctrl) {
            e.preventDefault();
            handleDelete();
          }
          break;
          
        // Undo/Redo
        case 'z':
          if (ctrl) {
            e.preventDefault();
            if (shift) {
              redo();
            } else {
              undo();
            }
          }
          break;
          
        case 'y':
          if (ctrl) {
            e.preventDefault();
            redo();
          }
          break;
          
        // Duplicate
        case 'd':
          if (ctrl) {
            e.preventDefault();
            handleDuplicate();
          }
          break;
          
        // View shortcuts (numpad style)
        case '1':
          if (!ctrl) {
            e.preventDefault();
            setViewMode('front');
          }
          break;
          
        case '3':
          if (!ctrl) {
            e.preventDefault();
            setViewMode('right');
          }
          break;
          
        case '7':
          if (!ctrl) {
            e.preventDefault();
            setViewMode('top');
          }
          break;
          
        case '0':
          if (!ctrl) {
            e.preventDefault();
            setViewMode('perspective');
          }
          break;
          
        // Toggle shortcuts
        case 'g':
          if (!ctrl) {
            e.preventDefault();
            toggleGrid();
          }
          break;
          
        case 'x':
          if (!ctrl) {
            e.preventDefault();
            toggleDimensions();
          }
          break;
          
        case 's':
          if (!ctrl) {
            e.preventDefault();
            toggleSnapping();
          }
          break;
          
        // Panel shortcuts
        case 'c':
          if (!ctrl) {
            e.preventDefault();
            toggleCatalogPanel();
          }
          break;
          
        case 'p':
          if (!ctrl) {
            e.preventDefault();
            togglePropertiesPanel();
          }
          break;
          
        case 'w':
          if (!ctrl) {
            e.preventDefault();
            toggleWallPanel();
          }
          break;
          
        // Wall navigation
        case 'pageup':
          e.preventDefault();
          navigateWall('prev');
          break;
          
        case 'pagedown':
          e.preventDefault();
          navigateWall('next');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setTool,
    setViewMode,
    selectBox,
    selectPlanks,
    undo,
    redo,
    toggleGrid,
    toggleDimensions,
    toggleSnapping,
    toggleCatalogPanel,
    togglePropertiesPanel,
    toggleWallPanel,
    placingTemplateId,
    setPlacingTemplate,
    handleDelete,
    handleDuplicate,
    navigateWall,
  ]);
}

// Keyboard shortcut reference
export const KEYBOARD_SHORTCUTS = {
  tools: [
    { key: 'V', description: 'Select tool' },
    { key: 'M', description: 'Move tool' },
    { key: 'R', description: 'Rotate tool' },
  ],
  actions: [
    { key: 'Delete', description: 'Delete selected' },
    { key: 'Ctrl+D', description: 'Duplicate selected' },
    { key: 'Ctrl+Z', description: 'Undo' },
    { key: 'Ctrl+Y', description: 'Redo' },
    { key: 'Escape', description: 'Clear selection / Cancel' },
  ],
  views: [
    { key: '1', description: 'Front view' },
    { key: '3', description: 'Right view' },
    { key: '7', description: 'Top view' },
    { key: '0', description: 'Perspective view' },
  ],
  toggles: [
    { key: 'G', description: 'Toggle grid' },
    { key: 'X', description: 'Toggle dimensions' },
    { key: 'S', description: 'Toggle snap' },
  ],
  panels: [
    { key: 'C', description: 'Toggle catalog' },
    { key: 'P', description: 'Toggle properties' },
    { key: 'W', description: 'Toggle walls' },
  ],
  navigation: [
    { key: 'PageUp', description: 'Previous wall' },
    { key: 'PageDown', description: 'Next wall' },
  ],
};

export default useDesignerShortcuts;
