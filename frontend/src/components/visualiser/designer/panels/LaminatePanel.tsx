/**
 * LaminatePanel Component
 * Slide-out panel for assigning laminates to planks
 */

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDesignerStore, selectSelectedBox } from "@/store/designerStore";
import { 
  computeMaterialString, 
  getCoreMaterialFromPly,
  determinePlankCategory,
  DEFAULT_LAMINATE_OPTIONS,
} from "@/lib/visualiser/materialUtils";
import type { Laminate, DesignerPlank } from "@/types/visualiser";

// ============================================
// Laminate Card Component
// ============================================

interface LaminateCardProps {
  laminate: Laminate;
  isSelected: boolean;
  onClick: () => void;
}

function LaminateCard({ laminate, isSelected, onClick }: LaminateCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-2 rounded-dls-md border-2 cursor-pointer transition-all ${
        isSelected
          ? "border-primary-orange bg-lighter-interactive/20 shadow-md"
          : "border-light-bw hover:border-medium-border hover:shadow"
      }`}
    >
      {/* Color preview */}
      <div
        className="w-full aspect-square rounded-dls-sm mb-2 border"
        style={{ backgroundColor: laminate.previewColor }}
      />
      
      {/* Info */}
      <div className="text-xs font-medium text-neutral-dark truncate">
        {laminate.code}
      </div>
      <div className="text-[10px] text-technical-gray truncate">
        {laminate.colour}
      </div>
      <div className="text-[10px] text-light-interactive-bw">
        {laminate.brand}
      </div>
    </div>
  );
}

// ============================================
// Plank Checkbox Component
// ============================================

interface PlankCheckboxProps {
  plank: DesignerPlank;
  isChecked: boolean;
  onChange: (checked: boolean) => void;
}

function PlankCheckbox({ plank, isChecked, onChange }: PlankCheckboxProps) {
  const category = determinePlankCategory(plank.plankRole || plank.name);
  
  return (
    <label className="flex items-center gap-2 p-2 rounded-dls-sm hover:bg-lighter-bg cursor-pointer">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-light-bw text-primary-orange focus:ring-primary-orange"
      />
      <span
        className="w-3 h-3 rounded-sm border"
        style={{ backgroundColor: plank.color }}
      />
      <span className="text-sm text-neutral-dark flex-1">{plank.name}</span>
      <span className={`text-xs px-1.5 py-0.5 rounded-dls-sm ${
        category === 'door' ? 'bg-purple-100 text-purple-700' :
        category === 'back' ? 'bg-primary-blue/20 text-primary-blue' :
        'bg-lighter-bg text-technical-gray'
      }`}>
        {category}
      </span>
    </label>
  );
}

// ============================================
// Main LaminatePanel Component
// ============================================

export function LaminatePanel() {
  const isLaminatePanelOpen = useDesignerStore((state) => state.isLaminatePanelOpen);
  const laminateOptions = useDesignerStore((state) => state.laminateOptions);
  const selectedBox = useDesignerStore(selectSelectedBox);
  
  const toggleLaminatePanel = useDesignerStore((state) => state.toggleLaminatePanel);
  const setLaminateOptions = useDesignerStore((state) => state.setLaminateOptions);
  const bulkUpdatePlankMaterials = useDesignerStore((state) => state.bulkUpdatePlankMaterials);
  const updatePlank = useDesignerStore((state) => state.updatePlank);

  // Local state
  const [selectedPlankIds, setSelectedPlankIds] = useState<string[]>([]);
  const [selectedLaminateId, setSelectedLaminateId] = useState<string | null>(null);
  const [applyBothSides, setApplyBothSides] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Initialize laminates if empty
  useEffect(() => {
    if (laminateOptions.length === 0) {
      setLaminateOptions(DEFAULT_LAMINATE_OPTIONS);
    }
  }, [laminateOptions.length, setLaminateOptions]);

  // Reset selection when box changes
  useEffect(() => {
    setSelectedPlankIds([]);
    setSelectedLaminateId(null);
  }, [selectedBox?.id]);

  // Get unique brands and categories
  const { brands, categories } = useMemo(() => {
    const brands = Array.from(new Set(laminateOptions.map(l => l.brand))).filter(Boolean);
    const categories = Array.from(new Set(laminateOptions.map(l => l.category))).filter(Boolean);
    return { brands, categories };
  }, [laminateOptions]);

  // Filter laminates
  const filteredLaminates = useMemo(() => {
    return laminateOptions.filter(laminate => {
      const matchesSearch = 
        laminate.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        laminate.colour?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        laminate.brand.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesBrand = filterBrand === 'all' || laminate.brand === filterBrand;
      const matchesCategory = filterCategory === 'all' || laminate.category === filterCategory;
      
      return matchesSearch && matchesBrand && matchesCategory && laminate.isActive;
    });
  }, [laminateOptions, searchTerm, filterBrand, filterCategory]);

  // Handle plank selection toggle
  const handlePlankToggle = useCallback((plankId: string, checked: boolean) => {
    setSelectedPlankIds(prev => 
      checked 
        ? [...prev, plankId]
        : prev.filter(id => id !== plankId)
    );
  }, []);

  // Select/deselect all planks
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked && selectedBox) {
      setSelectedPlankIds(selectedBox.planks.map(p => p.id));
    } else {
      setSelectedPlankIds([]);
    }
  }, [selectedBox]);

  // Apply laminate to selected planks
  const handleApply = useCallback(() => {
    if (!selectedBox || !selectedLaminateId || selectedPlankIds.length === 0) return;
    
    const laminate = laminateOptions.find(l => l.id === selectedLaminateId);
    if (!laminate) return;
    
    // Get core material from box's plywood selection
    const carcassPly = selectedBox.carcassPly;
    const coreType = getCoreMaterialFromPly(carcassPly || '');
    
    // Compute material string
    const innerCode = applyBothSides ? laminate.code : undefined;
    const materialString = computeMaterialString(coreType, laminate.code, innerCode);
    
    // Update each selected plank
    for (const plankId of selectedPlankIds) {
      const plank = selectedBox.planks.find(p => p.id === plankId);
      if (plank) {
        updatePlank(selectedBox.id, plankId, {
          outerLaminateCode: laminate.code,
          innerLaminateCode: innerCode,
          materialString,
          color: laminate.previewColor,
        });
      }
    }
    
    // Clear selection
    setSelectedPlankIds([]);
    setSelectedLaminateId(null);
  }, [selectedBox, selectedLaminateId, selectedPlankIds, applyBothSides, laminateOptions, updatePlank]);

  if (!isLaminatePanelOpen) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-96 bg-lightest-bg shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-lighter-bg border-b border-light-bw flex items-center justify-between">
        <h3 className="font-semibold text-neutral-dark">Laminate Selection</h3>
        <button
          onClick={toggleLaminatePanel}
          className="p-1.5 hover:bg-light-bg rounded-dls-sm transition-colors"
        >
          ✕
        </button>
      </div>

      {!selectedBox ? (
        <div className="flex-1 flex items-center justify-center text-technical-gray p-8 text-center">
          <div>
            <div className="text-4xl mb-2">📦</div>
            <p>Select a box to assign laminates to its planks</p>
          </div>
        </div>
      ) : (
        <>
          {/* Plank Selection */}
          <div className="px-4 py-3 border-b border-light-bw">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-neutral-dark">
                Select Planks ({selectedPlankIds.length}/{selectedBox.planks.length})
              </h4>
              <label className="flex items-center gap-2 text-xs text-technical-gray">
                <input
                  type="checkbox"
                  checked={selectedPlankIds.length === selectedBox.planks.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-light-bw text-primary-orange focus:ring-primary-orange"
                />
                All
              </label>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-0.5 bg-lighter-bg rounded-dls-md p-1">
              {selectedBox.planks.map(plank => (
                <PlankCheckbox
                  key={plank.id}
                  plank={plank}
                  isChecked={selectedPlankIds.includes(plank.id)}
                  onChange={(checked) => handlePlankToggle(plank.id, checked)}
                />
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 py-3 border-b border-light-bw space-y-2">
            {/* Search */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search laminates..."
              className="w-full px-3 py-2 text-sm text-neutral-dark border border-light-bw rounded-dls-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
            />
            
            {/* Brand & Category filters */}
            <div className="flex gap-2">
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="flex-1 px-2 py-1.5 text-sm text-neutral-dark border border-light-bw rounded-dls-md"
              >
                <option value="all">All Brands</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="flex-1 px-2 py-1.5 text-sm text-neutral-dark border border-light-bw rounded-dls-md"
              >
                <option value="all">All Types</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Laminate Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredLaminates.length === 0 ? (
              <div className="text-center text-technical-gray py-8">
                No laminates match your search
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {filteredLaminates.map(laminate => (
                  <LaminateCard
                    key={laminate.id}
                    laminate={laminate}
                    isSelected={selectedLaminateId === laminate.id}
                    onClick={() => setSelectedLaminateId(laminate.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Apply Section */}
          <div className="px-4 py-3 border-t border-light-bw bg-lighter-bg">
            {/* Both Sides Toggle */}
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={applyBothSides}
                onChange={(e) => setApplyBothSides(e.target.checked)}
                className="w-4 h-4 rounded border-light-bw text-primary-orange focus:ring-primary-orange"
              />
              <span className="text-sm text-neutral-dark">
                Apply to both sides (BSL)
              </span>
            </label>
            
            {/* Preview */}
            {selectedLaminateId && selectedPlankIds.length > 0 && (
              <div className="mb-3 p-2 bg-lightest-bg rounded-dls-md border border-light-bw text-sm">
                <div className="text-technical-gray">Preview:</div>
                <div className="font-medium text-neutral-dark">
                  {computeMaterialString(
                    getCoreMaterialFromPly(selectedBox.carcassPly || ''),
                    laminateOptions.find(l => l.id === selectedLaminateId)?.code || '',
                    applyBothSides ? laminateOptions.find(l => l.id === selectedLaminateId)?.code : undefined
                  )}
                </div>
              </div>
            )}
            
            {/* Apply Button */}
            <button
              onClick={handleApply}
              disabled={!selectedLaminateId || selectedPlankIds.length === 0}
              className={`w-full py-2 rounded-dls-md font-medium transition-colors ${
                selectedLaminateId && selectedPlankIds.length > 0
                  ? "bg-primary-orange text-white hover:bg-dark-color"
                  : "bg-lighter-bg text-technical-gray cursor-not-allowed"
              }`}
            >
              Apply to {selectedPlankIds.length} plank{selectedPlankIds.length !== 1 ? 's' : ''}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default LaminatePanel;
