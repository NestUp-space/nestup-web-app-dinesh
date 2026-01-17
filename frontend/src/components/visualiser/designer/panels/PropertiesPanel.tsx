/**
 * PropertiesPanel Component
 * Displays and allows editing of selected box/plank properties
 * Handles dimension changes with formula recalculation
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useDesignerStore, selectSelectedBox } from "@/store/designerStore";
import { 
  recalculatePlanks, 
  createFormulaContext,
  determinePlankCategory 
} from "@/lib/visualiser/formulaEngine";
import type { DesignerBox, PlankTemplate } from "@/types/visualiser";

// ============================================
// Dimension Input Component
// ============================================

interface DimensionInputProps {
  label: string;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function DimensionInput({
  label,
  value,
  unit = "mm",
  min = 0,
  max = 10000,
  step = 1,
  onChange,
  disabled = false,
}: DimensionInputProps) {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    const numValue = parseFloat(localValue);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
    } else {
      setLocalValue(String(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-technical-gray w-16">{label}</label>
      <div className="flex-1 flex items-center gap-1">
        <input
          type="number"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={`w-full px-2 py-1.5 text-sm border rounded-dls-sm focus:ring-2 focus:ring-primary-orange focus:border-transparent ${
            disabled 
              ? "bg-lighter-bg text-technical-gray border-light-bw" 
              : "bg-white text-neutral-dark border-light-bw"
          }`}
        />
        <span className="text-xs text-light-interactive-bw w-8">{unit}</span>
      </div>
    </div>
  );
}

// ============================================
// Position Input Component
// ============================================

interface PositionInputsProps {
  x: number;
  y: number;
  z: number;
  onChange: (axis: "x" | "y" | "z", value: number) => void;
  disabled?: boolean;
}

function PositionInputs({ x, y, z, onChange, disabled }: PositionInputsProps) {
  return (
    <div className="space-y-2">
      <DimensionInput
        label="X"
        value={Math.round(x)}
        onChange={(v) => onChange("x", v)}
        disabled={disabled}
      />
      <DimensionInput
        label="Y"
        value={Math.round(y)}
        onChange={(v) => onChange("y", v)}
        disabled={disabled}
      />
      <DimensionInput
        label="Z"
        value={Math.round(z)}
        onChange={(v) => onChange("z", v)}
        disabled={disabled}
      />
    </div>
  );
}

// ============================================
// Plank List Item Component
// ============================================

interface PlankListItemProps {
  plank: {
    id: string;
    name: string;
    plankRole?: string;
    dimensions: { lenX: number; lenY: number; lenZ: number };
    color: string;
    materialString?: string;
  };
  isSelected: boolean;
  onClick: () => void;
}

function PlankListItem({ plank, isSelected, onClick }: PlankListItemProps) {
  const category = determinePlankCategory(plank.plankRole || plank.name);
  
  return (
    <div
      onClick={onClick}
      className={`p-2 rounded-dls-md cursor-pointer transition-colors ${
        isSelected
          ? "bg-lighter-interactive/30 border border-light-border"
          : "bg-lighter-bg hover:bg-light-bg"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-sm border flex-shrink-0"
          style={{ backgroundColor: plank.color }}
        />
        <span className="text-sm font-medium text-neutral-dark truncate">
          {plank.name}
        </span>
        {plank.plankRole && (
          <span className="text-xs text-light-interactive-bw capitalize">
            ({plank.plankRole})
          </span>
        )}
      </div>
      <div className="text-xs text-technical-gray ml-5 mt-0.5">
        {Math.round(plank.dimensions.lenX)} × {Math.round(plank.dimensions.lenY)} × {Math.round(plank.dimensions.lenZ)}mm
      </div>
      {plank.materialString && (
        <div className="text-xs text-light-interactive-bw ml-5">
          {plank.materialString}
        </div>
      )}
    </div>
  );
}

// ============================================
// Main PropertiesPanel Component
// ============================================

export function PropertiesPanel() {
  const selectedBoxId = useDesignerStore((state) => state.selectedBoxId);
  const selectedPlankIds = useDesignerStore((state) => state.selectedPlankIds);
  const explodeAmount = useDesignerStore((state) => state.explodeAmount);
  const boxTemplates = useDesignerStore((state) => state.boxTemplates);
  const isPropertiesPanelOpen = useDesignerStore((state) => state.isPropertiesPanelOpen);
  
  const setExplodeAmount = useDesignerStore((state) => state.setExplodeAmount);
  const updateBox = useDesignerStore((state) => state.updateBox);
  const updateBoxPosition = useDesignerStore((state) => state.updateBoxPosition);
  const updateBoxDimensions = useDesignerStore((state) => state.updateBoxDimensions);
  const replacePlanks = useDesignerStore((state) => state.replacePlanks);
  const selectPlanks = useDesignerStore((state) => state.selectPlanks);
  const togglePropertiesPanel = useDesignerStore((state) => state.togglePropertiesPanel);
  const toggleLaminatePanel = useDesignerStore((state) => state.toggleLaminatePanel);
  
  const selectedBox = useDesignerStore(selectSelectedBox);

  const selectedPlank = selectedBox?.planks.find((p) =>
    selectedPlankIds.includes(p.id)
  );

  // Handle dimension change with plank recalculation
  const handleDimensionChange = useCallback(
    (dimension: "boxWidth" | "boxDepth" | "boxHeight" | "skirtingHeight", value: number) => {
      if (!selectedBox) return;

      // Get template if available
      const template = boxTemplates.find((t) => t.id === selectedBox.templateId);

      // Update dimensions
      const newDimensions = {
        ...selectedBox.dimensions,
        [dimension]: value,
        // Also update lenX/Y/Z for compatibility
        ...(dimension === "boxWidth" && { lenX: value }),
        ...(dimension === "boxDepth" && { lenY: value }),
        ...(dimension === "boxHeight" && { lenZ: value }),
      };

      updateBoxDimensions(selectedBox.id, newDimensions);

      // Recalculate planks if we have a template
      if (template && template.plankTemplates.length > 0) {
        const updatedBox: DesignerBox = {
          ...selectedBox,
          dimensions: newDimensions,
        };

        const newPlanks = recalculatePlanks(updatedBox, template.plankTemplates);
        replacePlanks(selectedBox.id, newPlanks);
      }
    },
    [selectedBox, boxTemplates, updateBoxDimensions, replacePlanks]
  );

  // Handle position change
  const handlePositionChange = useCallback(
    (axis: "x" | "y" | "z", value: number) => {
      if (!selectedBox) return;

      updateBoxPosition(selectedBox.id, {
        ...selectedBox.position,
        [axis]: value,
      });
    },
    [selectedBox, updateBoxPosition]
  );

  // Handle plank selection
  const handlePlankClick = useCallback(
    (plankId: string) => {
      if (selectedPlankIds.includes(plankId)) {
        selectPlanks(selectedPlankIds.filter((id) => id !== plankId));
      } else {
        selectPlanks([plankId]);
      }
    },
    [selectedPlankIds, selectPlanks]
  );

  if (!isPropertiesPanelOpen) {
    return (
      <button
        onClick={togglePropertiesPanel}
        className="absolute top-20 right-4 bg-lightest-bg/95 backdrop-blur p-2 rounded-dls-md shadow-lg z-30 hover:bg-lighter-bg transition-colors"
        title="Show Properties"
      >
        ⚙️
      </button>
    );
  }

  return (
    <div className="absolute top-4 right-4 w-80 bg-lightest-bg/95 backdrop-blur rounded-dls-lg shadow-lg overflow-hidden z-30">
      <div className="px-4 py-3 bg-lighter-bg border-b border-light-bw flex items-center justify-between">
        <h3 className="font-semibold text-neutral-dark">Properties</h3>
        <button
          onClick={togglePropertiesPanel}
          className="p-1.5 hover:bg-light-bg rounded-dls-sm transition-colors"
          title="Hide Panel"
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[calc(100vh-150px)] overflow-y-auto">
        {/* Explode Control */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-neutral-dark">Explode View</span>
            <span className="text-sm font-bold text-primary-orange">
              {Math.round(explodeAmount * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={explodeAmount}
            onChange={(e) => setExplodeAmount(Number(e.target.value))}
            className="w-full accent-primary-orange"
          />
        </div>

        {/* Box Properties */}
        {selectedBox && (
          <>
            {/* Box Info */}
            <div className="p-3 bg-primary-blue/10 rounded-dls-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-primary-blue">
                  📦 {selectedBox.name}
                </h4>
                {selectedBox.boxModel && (
                  <span className="text-xs bg-primary-blue/20 text-primary-blue px-2 py-0.5 rounded-dls-sm">
                    {selectedBox.boxModel}
                  </span>
                )}
              </div>
              {selectedBox.boxType && (
                <div className="text-xs text-primary-blue/80 mb-2 capitalize">
                  Type: {selectedBox.boxType.replace("_", " ")}
                </div>
              )}
            </div>

            {/* Dimensions */}
            <div className="p-3 bg-lighter-bg rounded-dls-md">
              <h5 className="text-sm font-semibold text-neutral-dark mb-3">
                Dimensions
              </h5>
              <div className="space-y-2">
                <DimensionInput
                  label="Width"
                  value={selectedBox.dimensions.boxWidth || selectedBox.dimensions.lenX}
                  onChange={(v) => handleDimensionChange("boxWidth", v)}
                  min={100}
                  max={5000}
                />
                <DimensionInput
                  label="Depth"
                  value={selectedBox.dimensions.boxDepth || selectedBox.dimensions.lenY}
                  onChange={(v) => handleDimensionChange("boxDepth", v)}
                  min={100}
                  max={2000}
                />
                <DimensionInput
                  label="Height"
                  value={selectedBox.dimensions.boxHeight || selectedBox.dimensions.lenZ}
                  onChange={(v) => handleDimensionChange("boxHeight", v)}
                  min={100}
                  max={3000}
                />
                <DimensionInput
                  label="Skirting"
                  value={selectedBox.dimensions.skirtingHeight || 0}
                  onChange={(v) => handleDimensionChange("skirtingHeight", v)}
                  min={0}
                  max={500}
                />
              </div>
            </div>

            {/* Position */}
            <div className="p-3 bg-lighter-bg rounded-dls-md">
              <h5 className="text-sm font-semibold text-neutral-dark mb-3">
                Position
              </h5>
              <PositionInputs
                x={selectedBox.position.x}
                y={selectedBox.position.y}
                z={selectedBox.position.z}
                onChange={handlePositionChange}
              />
            </div>

            {/* Rotation */}
            <div className="p-3 bg-lighter-bg rounded-dls-md">
              <h5 className="text-sm font-semibold text-neutral-dark mb-3">
                Rotation
              </h5>
              <DimensionInput
                label="Z"
                value={selectedBox.rotationZ || 0}
                unit="°"
                onChange={(v) => updateBox(selectedBox.id, { rotationZ: v })}
                min={0}
                max={360}
                step={90}
              />
            </div>

            {/* Material Thicknesses */}
            <div className="p-3 bg-lighter-bg rounded-dls-md">
              <h5 className="text-sm font-semibold text-neutral-dark mb-3">
                Material Thickness
              </h5>
              <div className="space-y-2">
                <DimensionInput
                  label="Carcass"
                  value={selectedBox.carcassThickness}
                  onChange={(v) => {
                    updateBox(selectedBox.id, { carcassThickness: v });
                    handleDimensionChange("boxWidth", selectedBox.dimensions.boxWidth || selectedBox.dimensions.lenX);
                  }}
                  min={6}
                  max={50}
                />
                <DimensionInput
                  label="Door"
                  value={selectedBox.doorThickness}
                  onChange={(v) => {
                    updateBox(selectedBox.id, { doorThickness: v });
                    handleDimensionChange("boxWidth", selectedBox.dimensions.boxWidth || selectedBox.dimensions.lenX);
                  }}
                  min={6}
                  max={50}
                />
                <DimensionInput
                  label="Back"
                  value={selectedBox.backplankThickness}
                  onChange={(v) => {
                    updateBox(selectedBox.id, { backplankThickness: v });
                    handleDimensionChange("boxWidth", selectedBox.dimensions.boxWidth || selectedBox.dimensions.lenX);
                  }}
                  min={3}
                  max={25}
                />
              </div>
            </div>

            {/* Planks List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-semibold text-neutral-dark">
                  Planks ({selectedBox.planks.length})
                </h5>
                <button
                  onClick={toggleLaminatePanel}
                  className="text-xs text-primary-orange hover:text-dark-color"
                >
                  Edit Laminates →
                </button>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {selectedBox.planks.map((plank) => (
                  <PlankListItem
                    key={plank.id}
                    plank={plank}
                    isSelected={selectedPlankIds.includes(plank.id)}
                    onClick={() => handlePlankClick(plank.id)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Selected Plank Details */}
        {selectedPlank && (
          <div className="p-3 bg-lighter-interactive/20 rounded-dls-md">
            <h4 className="font-semibold text-dark-text mb-2">
              🪵 {selectedPlank.name}
            </h4>
            <div className="text-sm text-technical-gray space-y-1">
              <div>ID: {selectedPlank.id}</div>
              {selectedPlank.plankRole && (
                <div className="capitalize">Role: {selectedPlank.plankRole}</div>
              )}
              <div>
                Size: {Math.round(selectedPlank.dimensions.lenX)} ×{" "}
                {Math.round(selectedPlank.dimensions.lenY)} ×{" "}
                {Math.round(selectedPlank.dimensions.lenZ)}mm
              </div>
              <div>
                Position: ({Math.round(selectedPlank.position.x)},{" "}
                {Math.round(selectedPlank.position.y)},{" "}
                {Math.round(selectedPlank.position.z)})
              </div>
              {selectedPlank.materialString && (
                <div>Material: {selectedPlank.materialString}</div>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-technical-gray">Color:</span>
              <div
                className="w-6 h-6 rounded-dls-sm border"
                style={{ backgroundColor: selectedPlank.color }}
              />
            </div>
          </div>
        )}

        {/* No Selection */}
        {!selectedBox && (
          <div className="text-center text-technical-gray py-8">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-sm">Select a box to view and edit properties</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertiesPanel;
