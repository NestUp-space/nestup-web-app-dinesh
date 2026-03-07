'use client';

import React, { useState, useCallback } from 'react';
import {
  useDesignerStore,
  useSelectedWall,
  useSelectedBox,
  useSelectedPlank,
  useDesignSummary,
} from '@/store/designerStore';
import { DESIGNER_CONFIG } from '@/lib/visualiser/catalogParser';
import { Wall, Box, PlywoodOption } from '@/types/visualiser';
import { BoxDimensions } from '@/lib/visualiser/plankFormulaSystem';

export const PropertiesPanel: React.FC = () => {
  const selectedWall = useSelectedWall();
  const selectedBox = useSelectedBox();
  const selectedPlank = useSelectedPlank();
  const summary = useDesignSummary();

  const {
    updateWall,
    updateBox,
    updateBoxDimensions,
    deleteWall,
    deleteBox,
    rotateBox,
    plywoodLibrary,
    setProjectName,
    projectName,
  } = useDesignerStore();

  // Determine what to show
  const hasSelection = selectedWall || selectedBox || selectedPlank;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="text-sm font-semibold text-gray-900">Properties</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {/* Project Info */}
        <div className="space-y-2">
          <label className="block text-xs text-gray-500 uppercase tracking-wide">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
          />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-orange-50 rounded p-2 text-center border border-orange-100">
            <div className="text-lg font-bold text-orange-600">{summary.totalWalls}</div>
            <div className="text-xs text-gray-500">Walls</div>
          </div>
          <div className="bg-orange-50 rounded p-2 text-center border border-orange-100">
            <div className="text-lg font-bold text-orange-600">{summary.totalBoxes}</div>
            <div className="text-xs text-gray-500">Boxes</div>
          </div>
          <div className="bg-orange-50 rounded p-2 text-center border border-orange-100">
            <div className="text-lg font-bold text-orange-600">{summary.totalPlanks}</div>
            <div className="text-xs text-gray-500">Planks</div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4" />

        {/* Selection Properties */}
        {!hasSelection ? (
          <div className="text-center text-gray-400 py-8">
            <svg
              className="w-12 h-12 mx-auto mb-2 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M15 15l-2 5L9 9l11 4-5 2z"
              />
            </svg>
            <p className="text-sm">Select a wall or box to edit</p>
          </div>
        ) : selectedBox ? (
          <BoxProperties
            box={selectedBox}
            onUpdate={updateBox}
            onUpdateDimensions={updateBoxDimensions}
            onDelete={deleteBox}
            onRotate={rotateBox}
            plywoodLibrary={plywoodLibrary}
          />
        ) : selectedWall ? (
          <WallProperties
            wall={selectedWall}
            onUpdate={updateWall}
            onDelete={deleteWall}
          />
        ) : null}
      </div>
    </div>
  );
};

// ============================================
// WALL PROPERTIES
// ============================================

interface WallPropertiesProps {
  wall: Wall;
  onUpdate: (id: string, updates: Partial<Wall>) => void;
  onDelete: (id: string) => void;
}

const WallProperties: React.FC<WallPropertiesProps> = ({ wall, onUpdate, onDelete }) => {
  const locations = ['North', 'South', 'East', 'West'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-orange-500">Wall Properties</h3>
        <button
          onClick={() => onDelete(wall.id)}
          className="text-red-500 hover:text-red-600 text-xs"
        >
          Delete
        </button>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Name</label>
        <input
          type="text"
          value={wall.entityName}
          onChange={(e) => onUpdate(wall.id, { entityName: e.target.value })}
          className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
        />
      </div>

      {/* Room Name */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Room</label>
        <input
          type="text"
          value={wall.roomName}
          onChange={(e) => onUpdate(wall.id, { roomName: e.target.value })}
          className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Location</label>
        <select
          value={wall.unitLocation}
          onChange={(e) => onUpdate(wall.id, { unitLocation: e.target.value })}
          className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
        >
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      {/* Dimensions */}
      <div>
        <label className="block text-xs text-gray-500 mb-2">Dimensions (mm)</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Width</label>
            <input
              type="number"
              value={wall.dimensions.lenX}
              onChange={(e) =>
                onUpdate(wall.id, {
                  dimensions: { ...wall.dimensions, lenX: Number(e.target.value) },
                })
              }
              className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Depth</label>
            <input
              type="number"
              value={wall.dimensions.lenY}
              onChange={(e) =>
                onUpdate(wall.id, {
                  dimensions: { ...wall.dimensions, lenY: Number(e.target.value) },
                })
              }
              className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Height</label>
            <input
              type="number"
              value={wall.dimensions.lenZ}
              onChange={(e) =>
                onUpdate(wall.id, {
                  dimensions: { ...wall.dimensions, lenZ: Number(e.target.value) },
                })
              }
              className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Position */}
      <div>
        <label className="block text-xs text-gray-500 mb-2">Position (mm)</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">X</label>
            <input
              type="number"
              value={wall.position.x}
              onChange={(e) =>
                onUpdate(wall.id, {
                  position: { ...wall.position, x: Number(e.target.value) },
                })
              }
              className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Y</label>
            <input
              type="number"
              value={wall.position.y}
              onChange={(e) =>
                onUpdate(wall.id, {
                  position: { ...wall.position, y: Number(e.target.value) },
                })
              }
              className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Z</label>
            <input
              type="number"
              value={wall.position.z}
              onChange={(e) =>
                onUpdate(wall.id, {
                  position: { ...wall.position, z: Number(e.target.value) },
                })
              }
              className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Boxes count */}
      <div className="text-xs text-gray-500">
        Contains {wall.boxes.length} box{wall.boxes.length !== 1 ? 'es' : ''}
      </div>
    </div>
  );
};

// ============================================
// BOX PROPERTIES - EXACT PORT FROM APPS SCRIPT
// ============================================

interface BoxPropertiesProps {
  box: Box;
  onUpdate: (id: string, updates: Partial<Box>) => void;
  onUpdateDimensions: (boxId: string, dimensions: Partial<BoxDimensions>) => void;
  onDelete: (id: string) => void;
  onRotate: (id: string, degrees: number) => void;
  plywoodLibrary: PlywoodOption[];
}

const BoxProperties: React.FC<BoxPropertiesProps> = ({
  box,
  onUpdate,
  onUpdateDimensions,
  onDelete,
  onRotate,
  plywoodLibrary,
}) => {
  const editableOptions = DESIGNER_CONFIG.editableOptions;
  
  // Dimension keys that trigger formula recalculation
  const dimensionKeys = ['boxWidth', 'boxDepth', 'boxHeight', 'skirting', 'skirtingWidth', 
                         'carcusThickness', 'doorThickness', 'backplankThickness'];
  
  // Handle dimension changes with formula-based plank recalculation
  const handleDimensionChange = useCallback((key: string, value: number) => {
    if (dimensionKeys.includes(key)) {
      // Use the formula-based update that recalculates all planks
      onUpdateDimensions(box.id, { [key]: value } as Partial<BoxDimensions>);
    } else {
      // Regular update for non-dimension fields
      onUpdate(box.id, { [key]: value });
    }
  }, [box.id, onUpdate, onUpdateDimensions]);

  // Handle plywood selection with auto-thickness
  const handlePlywoodChange = useCallback((key: string, displayName: string, thicknessTarget?: string) => {
    const selected = plywoodLibrary.find((p) => p.displayName === displayName);
    
    if (selected && thicknessTarget) {
      // Update both the plywood selection and its thickness
      // Use dimension update to trigger plank recalculation
      onUpdate(box.id, { [key]: displayName });
      onUpdateDimensions(box.id, { [thicknessTarget]: selected.thickness } as Partial<BoxDimensions>);
    } else {
      onUpdate(box.id, { [key]: displayName });
    }
  }, [box.id, onUpdate, onUpdateDimensions, plywoodLibrary]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-orange-500">📦 Component Options</h3>
        <button
          onClick={() => onDelete(box.id)}
          className="text-red-500 hover:text-red-600 text-xs"
        >
          Delete
        </button>
      </div>

      {/* Box name: Level 1 entity name from catalog */}
      <div className="bg-orange-50 border border-orange-100 rounded p-3">
        <div className="text-xs text-gray-500">Name</div>
        <div className="font-medium text-gray-900">{box.entityName || box.boxModel || 'Custom'}</div>
        <div className="text-xs text-gray-500 mt-1">{box.boxType || 'Standard'}</div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onRotate(box.id, 90)}
          className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Rotate 90°
        </button>
      </div>

      {/* === DIMENSIONS SECTION === */}
      <div className="border-t border-gray-200 pt-4">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          📐 Dimensions
        </div>
        
        {/* Box Dimensions */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Width (mm)</label>
            <input
              type="number"
              value={box.boxWidth ?? box.dimensions?.lenX ?? ''}
              onChange={(e) => handleDimensionChange('boxWidth', Number(e.target.value))}
              className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Depth (mm)</label>
            <input
              type="number"
              value={box.boxDepth ?? box.dimensions?.lenY ?? ''}
              onChange={(e) => handleDimensionChange('boxDepth', Number(e.target.value))}
              className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Height (mm)</label>
            <input
              type="number"
              value={box.boxHeight ?? box.dimensions?.lenZ ?? ''}
              onChange={(e) => handleDimensionChange('boxHeight', Number(e.target.value))}
              className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Skirting */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Skirting Height</label>
            <input
              type="number"
              value={box.skirting || ''}
              onChange={(e) => handleDimensionChange('skirting', Number(e.target.value))}
              className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Skirting Width</label>
            <input
              type="number"
              value={box.skirtingWidth || ''}
              onChange={(e) => handleDimensionChange('skirtingWidth', Number(e.target.value))}
              className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* === MATERIALS SECTION === */}
      <div className="border-t border-gray-200 pt-4">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          🪵 Materials
        </div>

        {/* Carcass Plywood */}
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Carcass Plywood</label>
          <select
            value={box.carcusPly || ''}
            onChange={(e) => handlePlywoodChange('carcusPly', e.target.value, 'carcusThickness')}
            className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
          >
            <option value="">Select Plywood...</option>
            {plywoodLibrary.map((ply) => (
              <option key={ply.id || ply.sno} value={ply.displayName}>
                {ply.displayName}
              </option>
            ))}
          </select>
          <div className="text-[10px] text-gray-400 mt-1">
            Thickness: {box.carcusThickness || 18}mm
          </div>
        </div>

        {/* Door Plywood */}
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Door Plywood</label>
          <select
            value={box.doorPly || ''}
            onChange={(e) => handlePlywoodChange('doorPly', e.target.value, 'doorThickness')}
            className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
          >
            <option value="">Select Plywood...</option>
            {plywoodLibrary.map((ply) => (
              <option key={ply.id || ply.sno} value={ply.displayName}>
                {ply.displayName}
              </option>
            ))}
          </select>
          <div className="text-[10px] text-gray-400 mt-1">
            Thickness: {box.doorThickness || 18}mm
          </div>
        </div>

        {/* Back Panel Plywood */}
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Back Panel Plywood</label>
          <select
            value={box.backPly || ''}
            onChange={(e) => handlePlywoodChange('backPly', e.target.value, 'backplankThickness')}
            className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
          >
            <option value="">Select Plywood...</option>
            {plywoodLibrary.filter(p => p.thickness <= 12).map((ply) => (
              <option key={ply.id || ply.sno} value={ply.displayName}>
                {ply.displayName}
              </option>
            ))}
          </select>
          <div className="text-[10px] text-gray-400 mt-1">
            Thickness: {box.backplankThickness || 6}mm
          </div>
        </div>
      </div>

      {/* === POSITION SECTION === */}
      <div className="border-t border-gray-200 pt-4">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          📍 Position
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">X</label>
            <input
              type="number"
              value={box.position.x}
              onChange={(e) =>
                onUpdate(box.id, {
                  position: { ...box.position, x: Number(e.target.value) },
                })
              }
              className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Y</label>
            <input
              type="number"
              value={box.position.y}
              onChange={(e) =>
                onUpdate(box.id, {
                  position: { ...box.position, y: Number(e.target.value) },
                })
              }
              className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Z</label>
            <input
              type="number"
              value={box.position.z}
              onChange={(e) =>
                onUpdate(box.id, {
                  position: { ...box.position, z: Number(e.target.value) },
                })
              }
              className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-[10px] text-gray-400 mb-1">Rotation Z (°)</label>
          <input
            type="number"
            value={box.rotZ || 0}
            onChange={(e) => onUpdate(box.id, { rotZ: Number(e.target.value) })}
            step={15}
            className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Planks Summary */}
      <div className="border-t border-gray-200 pt-4">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
          Planks ({box.planks.length})
        </div>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {box.planks.slice(0, 10).map((plank) => (
            <div key={plank.id} className="text-xs text-gray-700 flex justify-between">
              <span>{plank.entityName}</span>
              <span className="text-gray-400">
                {plank.dimensions.lenX}×{plank.dimensions.lenY}×{plank.dimensions.lenZ}
              </span>
            </div>
          ))}
          {box.planks.length > 10 && (
            <div className="text-xs text-gray-400">
              ... and {box.planks.length - 10} more
            </div>
          )}
        </div>
      </div>

      {/* Apply Button */}
      <div className="pt-4">
        <button
          onClick={() => {
            // Force a recalculation with current values
            onUpdateDimensions(box.id, {
              boxWidth: box.boxWidth,
              boxDepth: box.boxDepth,
              boxHeight: box.boxHeight,
              skirting: box.skirting,
              skirtingWidth: box.skirtingWidth,
              carcusThickness: box.carcusThickness,
              doorThickness: box.doorThickness,
              backplankThickness: box.backplankThickness,
            });
          }}
          className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded text-sm text-white font-medium"
        >
          Apply Changes
        </button>
      </div>
    </div>
  );
};
