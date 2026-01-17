/**
 * Cabinet Designer V2
 * Main container component for the 3D cabinet design interface
 * Uses the new designerStore and modular components
 */

"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Scene } from "./Canvas3D";
import { 
  useDesignerStore, 
  selectCurrentWall, 
  selectCurrentWallBoxes,
  selectSelectedBox,
} from "@/store/designerStore";
import { WallPanel, CatalogPanel, PropertiesPanel, LaminatePanel } from "./panels";
import { ExportDialog } from "./dialogs";
import { useDesignerShortcuts } from "@/hooks/useDesignerShortcuts";
import { 
  calculateAllPlanks, 
  createPlanksFromCalculated, 
  createFormulaContext 
} from "@/lib/visualiser/formulaEngine";
import type { EditMode, Position3D, BoxTemplate } from "@/types/visualiser";

// ============================================
// Toolbar Component
// ============================================

interface ToolbarProps {
  currentTool: string;
  viewMode: string;
  showDimensions: boolean;
  showGrid: boolean;
  isSnappingEnabled: boolean;
  walls: { id: string; name: string }[];
  currentWallId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: 'select' | 'move' | 'rotate') => void;
  onViewModeChange: (mode: 'perspective' | 'front' | 'top' | 'right') => void;
  onToggleDimensions: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onWallChange: (wallId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
}

function Toolbar({
  currentTool,
  viewMode,
  showDimensions,
  showGrid,
  isSnappingEnabled,
  walls,
  currentWallId,
  canUndo,
  canRedo,
  onToolChange,
  onViewModeChange,
  onToggleDimensions,
  onToggleGrid,
  onToggleSnap,
  onWallChange,
  onUndo,
  onRedo,
}: ToolbarProps) {
  const tools = [
    { id: 'select', icon: '👆', label: 'Select (V)' },
    { id: 'move', icon: '✥', label: 'Move (M)' },
    { id: 'rotate', icon: '↻', label: 'Rotate (R)' },
  ] as const;

  const viewModes = [
    { id: 'perspective', label: '3D' },
    { id: 'front', label: 'Front' },
    { id: 'top', label: 'Top' },
    { id: 'right', label: 'Right' },
  ] as const;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-lightest-bg/95 backdrop-blur px-3 py-2 rounded-dls-lg shadow-lg z-30">
      {/* Tool buttons */}
      <div className="flex gap-1 pr-3 border-r border-light-bw">
        {tools.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => onToolChange(id)}
            title={label}
            className={`w-10 h-10 rounded-dls-md flex items-center justify-center text-lg transition-colors ${
              currentTool === id
                ? "bg-primary-orange text-white"
                : "bg-lighter-bg text-neutral-dark hover:bg-light-bg"
            }`}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Wall selector */}
      {walls.length > 0 && (
        <div className="px-3 border-r border-light-bw">
          <select
            value={currentWallId || ''}
            onChange={(e) => onWallChange(e.target.value)}
            className="px-3 py-2 rounded-dls-md text-sm font-medium bg-lighter-bg text-neutral-dark border-none focus:ring-2 focus:ring-primary-orange"
          >
            {walls.map((wall) => (
              <option key={wall.id} value={wall.id}>
                {wall.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* View modes */}
      <div className="flex gap-1 pr-3 border-r border-light-bw">
        {viewModes.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onViewModeChange(id)}
            className={`px-3 py-2 rounded-dls-md text-sm font-medium transition-colors ${
              viewMode === id
                ? "bg-neutral-dark text-white"
                : "bg-lighter-bg text-neutral-dark hover:bg-light-bg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Undo/Redo */}
      <div className="flex gap-1 pr-3 border-r border-light-bw">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`w-10 h-10 rounded-dls-md flex items-center justify-center text-lg transition-colors ${
            canUndo
              ? "bg-lighter-bg text-neutral-dark hover:bg-light-bg"
              : "bg-lightest-bw text-lighter-interactive-bw cursor-not-allowed"
          }`}
        >
          ↶
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={`w-10 h-10 rounded-dls-md flex items-center justify-center text-lg transition-colors ${
            canRedo
              ? "bg-lighter-bg text-neutral-dark hover:bg-light-bg"
              : "bg-lightest-bw text-lighter-interactive-bw cursor-not-allowed"
          }`}
        >
          ↷
        </button>
      </div>

      {/* Toggle options */}
      <div className="flex gap-1">
        <button
          onClick={onToggleDimensions}
          title="Toggle Dimensions"
          className={`w-10 h-10 rounded-dls-md flex items-center justify-center text-lg transition-colors ${
            showDimensions ? "bg-accent-green/20 text-accent-green" : "bg-lighter-bg text-light-interactive-bw"
          }`}
        >
          📏
        </button>
        <button
          onClick={onToggleGrid}
          title="Toggle Grid"
          className={`w-10 h-10 rounded-dls-md flex items-center justify-center text-lg transition-colors ${
            showGrid ? "bg-accent-green/20 text-accent-green" : "bg-lighter-bg text-light-interactive-bw"
          }`}
        >
          #
        </button>
        <button
          onClick={onToggleSnap}
          title="Toggle Snap"
          className={`w-10 h-10 rounded-dls-md flex items-center justify-center text-lg transition-colors ${
            isSnappingEnabled ? "bg-accent-green/20 text-accent-green" : "bg-lighter-bg text-light-interactive-bw"
          }`}
        >
          🧲
        </button>
      </div>
    </div>
  );
}

// ============================================
// Status Bar Component
// ============================================

function StatusBar() {
  const currentTool = useDesignerStore((state) => state.currentTool);
  const selectedBoxId = useDesignerStore((state) => state.selectedBoxId);
  const selectedPlankIds = useDesignerStore((state) => state.selectedPlankIds);
  const walls = useDesignerStore((state) => state.walls);
  const boxes = useDesignerStore(selectCurrentWallBoxes);
  const lastSavedAt = useDesignerStore((state) => state.lastSavedAt);

  const selectionText = selectedPlankIds.length > 0
    ? `${selectedPlankIds.length} plank(s)`
    : selectedBoxId || 'None';

  const lastSaved = lastSavedAt
    ? `${Math.round((Date.now() - lastSavedAt) / 60000)}min ago`
    : 'Never';

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-lightest-bg/90 backdrop-blur px-4 py-2 rounded-full shadow-lg text-sm z-30">
      <span className="text-technical-gray">Mode: </span>
      <span className="font-medium text-neutral-dark capitalize">{currentTool}</span>
      <span className="mx-2 text-light-bw">|</span>
      <span className="text-technical-gray">Selected: </span>
      <span className="font-medium text-neutral-dark">{selectionText}</span>
      <span className="mx-2 text-light-bw">|</span>
      <span className="text-technical-gray">Walls: </span>
      <span className="font-medium text-neutral-dark">{walls.length}</span>
      <span className="mx-2 text-light-bw">|</span>
      <span className="text-technical-gray">Boxes: </span>
      <span className="font-medium text-neutral-dark">{boxes.length}</span>
      <span className="mx-2 text-light-bw">|</span>
      <span className="text-technical-gray">Saved: </span>
      <span className="font-medium text-neutral-dark">{lastSaved}</span>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function CabinetDesignerV2() {
  // Store state
  const walls = useDesignerStore((state) => state.walls);
  const currentWallId = useDesignerStore((state) => state.currentWallId);
  const selectedBoxId = useDesignerStore((state) => state.selectedBoxId);
  const selectedPlankIds = useDesignerStore((state) => state.selectedPlankIds);
  const currentTool = useDesignerStore((state) => state.currentTool);
  const viewMode = useDesignerStore((state) => state.viewMode);
  const showGrid = useDesignerStore((state) => state.showGrid);
  const showDimensions = useDesignerStore((state) => state.showDimensions);
  const showAxes = useDesignerStore((state) => state.showAxes);
  const isSnappingEnabled = useDesignerStore((state) => state.isSnappingEnabled);
  const snapSettings = useDesignerStore((state) => state.snapSettings);
  const explodeAmount = useDesignerStore((state) => state.explodeAmount);
  const undoStack = useDesignerStore((state) => state.undoStack);
  const redoStack = useDesignerStore((state) => state.redoStack);
  const placingTemplateId = useDesignerStore((state) => state.placingTemplateId);
  const boxTemplates = useDesignerStore((state) => state.boxTemplates);
  
  // Store actions
  const setTool = useDesignerStore((state) => state.setTool);
  const setViewMode = useDesignerStore((state) => state.setViewMode);
  const setCurrentWall = useDesignerStore((state) => state.setCurrentWall);
  const selectBox = useDesignerStore((state) => state.selectBox);
  const selectPlanks = useDesignerStore((state) => state.selectPlanks);
  const toggleGrid = useDesignerStore((state) => state.toggleGrid);
  const toggleDimensions = useDesignerStore((state) => state.toggleDimensions);
  const toggleSnapping = useDesignerStore((state) => state.toggleSnapping);
  const undo = useDesignerStore((state) => state.undo);
  const redo = useDesignerStore((state) => state.redo);
  const addWall = useDesignerStore((state) => state.addWall);
  const addBox = useDesignerStore((state) => state.addBox);
  const setPlacingTemplate = useDesignerStore((state) => state.setPlacingTemplate);

  // Get current wall and boxes
  const currentWall = useDesignerStore(selectCurrentWall);
  const currentWallBoxes = useDesignerStore(selectCurrentWallBoxes);
  
  // Get placing template
  const placingTemplate = boxTemplates.find(t => t.id === placingTemplateId) || null;

  // Export dialog state
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  // Use keyboard shortcuts hook
  useDesignerShortcuts();

  // Initialize with a default wall if none exist
  useEffect(() => {
    if (walls.length === 0) {
      addWall({
        name: 'Wall A',
        roomName: 'Default Room',
        width: 3000,
        height: 2700,
        depth: 200,
        sortOrder: 0,
      });
    }
  }, [walls.length, addWall]);

  // Handle plank selection
  const handleSelectPlank = useCallback((plankId: string | null) => {
    selectPlanks(plankId ? [plankId] : []);
  }, [selectPlanks]);

  // Handle plank double-click (open laminate panel)
  const handlePlankDoubleClick = useCallback((plankId: string) => {
    // Will be implemented with laminate panel
    console.log('Double-clicked plank:', plankId);
  }, []);

  // Handle box placement
  const handlePlaceBox = useCallback((position: Position3D) => {
    if (!placingTemplate || !currentWallId) return;
    
    // Build formula context
    const context = createFormulaContext({
      boxWidth: placingTemplate.defaultWidth,
      boxDepth: placingTemplate.defaultDepth,
      boxHeight: placingTemplate.defaultHeight,
      skirtingHeight: placingTemplate.defaultSkirtingHeight,
    });
    
    // Calculate planks from templates
    const calculatedPlanks = calculateAllPlanks(placingTemplate.plankTemplates, context);
    
    // Create plank objects
    const tempId = `temp-${Date.now()}`;
    const planks = createPlanksFromCalculated(
      calculatedPlanks,
      tempId,
      placingTemplate.plankTemplates
    );
    
    // Add box to wall
    const boxId = addBox(
      currentWallId,
      {
        name: placingTemplate.entityName,
        roomName: currentWall?.roomName || '',
        boxModel: placingTemplate.boxModel,
        boxType: placingTemplate.boxType,
        templateId: placingTemplate.id,
        position,
        rotationZ: 0,
        dimensions: {
          lenX: placingTemplate.defaultWidth,
          lenY: placingTemplate.defaultDepth,
          lenZ: placingTemplate.defaultHeight,
          boxWidth: placingTemplate.defaultWidth,
          boxDepth: placingTemplate.defaultDepth,
          boxHeight: placingTemplate.defaultHeight,
          skirtingHeight: placingTemplate.defaultSkirtingHeight,
        },
        carcassThickness: 18,
        doorThickness: 18,
        backplankThickness: 6,
      },
      planks.map(p => ({ ...p, parentBoxId: '' })) // parentBoxId will be set by addBox
    );
    
    // Select the new box
    selectBox(boxId);
    
    // Clear placement mode
    setPlacingTemplate(null);
  }, [placingTemplate, currentWallId, currentWall, addBox, selectBox, setPlacingTemplate]);


  return (
    <div className="relative w-full h-full">
      {/* 3D Canvas */}
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          // SketchUp-style sky blue background
          gl.setClearColor("#87CEEB");
        }}
      >
        <PerspectiveCamera 
          makeDefault 
          position={[1500, 1350, 5000]} 
          fov={50}
          near={1}
          far={50000}
        />
        <Suspense fallback={null}>
          <Scene
            wall={currentWall}
            boxes={currentWallBoxes}
            selectedBoxId={selectedBoxId}
            selectedPlankId={selectedPlankIds[0] || null}
            placingTemplate={placingTemplate}
            isSnappingEnabled={isSnappingEnabled}
            snapGridSize={snapSettings.gridSize}
            viewMode={viewMode}
            showGrid={showGrid}
            showDimensions={showDimensions}
            showAxes={showAxes}
            explodeAmount={explodeAmount}
            onSelectBox={selectBox}
            onSelectPlank={handleSelectPlank}
            onPlankDoubleClick={handlePlankDoubleClick}
            onPlaceBox={handlePlaceBox}
          />
        </Suspense>
      </Canvas>

      {/* UI Overlays */}
      <Toolbar
        currentTool={currentTool}
        viewMode={viewMode}
        showDimensions={showDimensions}
        showGrid={showGrid}
        isSnappingEnabled={isSnappingEnabled}
        walls={walls.map((w) => ({ id: w.id, name: w.name }))}
        currentWallId={currentWallId}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onToolChange={setTool}
        onViewModeChange={setViewMode}
        onToggleDimensions={toggleDimensions}
        onToggleGrid={toggleGrid}
        onToggleSnap={toggleSnapping}
        onWallChange={setCurrentWall}
        onUndo={undo}
        onRedo={redo}
      />

      <WallPanel />
      <CatalogPanel />
      <PropertiesPanel />
      <LaminatePanel />
      <StatusBar />

      {/* Export button */}
      <button
        onClick={() => setShowExportDialog(true)}
        className="absolute bottom-4 right-4 bg-primary-orange text-white px-4 py-2 rounded-dls-md shadow-lg hover:bg-dark-color transition-colors z-30 flex items-center gap-2"
      >
        <span>📤</span>
        <span>Export</span>
      </button>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
    </div>
  );
}
