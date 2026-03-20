'use client';

import React, { useState, useMemo } from 'react';
import { useDesignerStore } from '@/stores/designerStore';
import { CatalogModel } from '@/types/visualiser';
import { BoxDefaultsManager } from '@/lib/visualiser/boxDefaultsManager';

export const CatalogPanel: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const {
    catalogModels,
    catalogBoxesWithPlanks,
    selectedWallId,
    activeWallId,
    addBoxFromCatalog,
    setPlacingModel,
    placingModelId,
    walls,
  } = useDesignerStore();

  // Get unique categories (box types)
  const categories = useMemo(() => {
    const types = new Set(catalogModels.map((m) => m.boxType).filter(Boolean));
    return ['all', ...Array.from(types)];
  }, [catalogModels]);

  // Filter models
  const filteredModels = useMemo(() => {
    return catalogModels.filter((model) => {
      const matchesSearch =
        searchTerm === '' ||
        model.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.boxModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.boxType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || model.boxType === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [catalogModels, searchTerm, selectedCategory]);

  // Group by room or type
  const groupedModels = useMemo(() => {
    const groups: Record<string, CatalogModel[]> = {};
    filteredModels.forEach((model) => {
      const key = model.boxType || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(model);
    });
    return groups;
  }, [filteredModels]);

  const handleAddToWall = (model: CatalogModel) => {
    // Use activeWallId (tab-selected wall) first, fall back to selectedWallId (3D-clicked wall)
    const targetWallId = activeWallId || selectedWallId;
    if (!targetWallId) {
      alert('Please add a wall first to add a box.');
      return;
    }

    const wall = walls.find((w) => w.id === targetWallId);
    if (!wall) return;

    // Find the matching catalog box with planks
    const catalogBox = catalogBoxesWithPlanks.find(
      (b) => b.id === model.id || b.entityName === model.entityName
    );
    
    // Debug: Log the matching results
    console.log(`[CatalogPanel] Looking for model ID "${model.id}" or entityName "${model.entityName}"`);
    console.log(`[CatalogPanel] Available catalogBoxes:`, catalogBoxesWithPlanks.map(b => ({ id: b.id, name: b.entityName, planks: b.planks.length })));
    console.log(`[CatalogPanel] Found matching box:`, catalogBox ? { id: catalogBox.id, planks: catalogBox.planks.length } : 'NOT FOUND');
    
    if (catalogBox) {
      // Log Level 3 data in the found box
      let totalSubComponents = 0;
      catalogBox.planks.forEach((p) => {
        totalSubComponents += p.subComponents?.length || 0;
      });
      console.log(`[CatalogPanel] Box has ${catalogBox.planks.length} planks with ${totalSubComponents} total subComponents`);
    }

    // Use BoxDefaultsManager to calculate position (EXACT PORT from Apps Script)
    // First box: X=0, Y=boxDepth (back against wall), Z=0 (on floor)
    // Subsequent boxes: X=prevX+prevWidth, Y=same, Z=same
    const position = BoxDefaultsManager.calculateNextPosition(
      {
        boxWidth: model.boxWidth,
        boxDepth: model.boxDepth,
        boxHeight: model.boxHeight,
        skirting: model.skirting,
        skirtingWidth: model.skirtingWidth,
        carcusThickness: model.carcusThickness,
        doorThickness: model.doorThickness,
        backplankThickness: model.backplankThickness,
      },
      wall.boxes
    );

    console.log('[CatalogPanel] Calculated position:', position);

    if (catalogBox) {
      // Use addBoxFromCatalog to get the planks from the catalog
      const boxId = addBoxFromCatalog(targetWallId, catalogBox.id, position);
      
      if (boxId) {
        // Store this box as lastPlaced for next box positioning
        BoxDefaultsManager.storeLastPlaced({
          position,
          boxWidth: model.boxWidth,
          boxDepth: model.boxDepth,
          boxHeight: model.boxHeight,
          skirting: model.skirting,
          skirtingWidth: model.skirtingWidth,
          carcusThickness: model.carcusThickness,
          doorThickness: model.doorThickness,
          backplankThickness: model.backplankThickness,
        });
        
        // Set wall defaults if this is the first box
        if (wall.boxes.length === 0) {
          BoxDefaultsManager.setWallDefaults(wall.entityName, {
            position,
            boxWidth: model.boxWidth,
            boxDepth: model.boxDepth,
            boxHeight: model.boxHeight,
            skirting: model.skirting,
            skirtingWidth: model.skirtingWidth,
            carcassThickness: model.carcusThickness,
            doorThickness: model.doorThickness,
            backplankThickness: model.backplankThickness,
          });
        }
        
        console.log(`[CatalogPanel] Added box "${model.entityName}" with ${catalogBox.planks.length} planks at position (${position.x}, ${position.y}, ${position.z})`);
      }
    } else {
      console.warn(`[CatalogPanel] Catalog box with planks not found for "${model.entityName}"`);
    }
  };

  const handleStartPlacing = (model: CatalogModel) => {
    setPlacingModel(model.id);
    // In a full implementation, this would enable click-to-place mode
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="text-sm font-semibold text-gray-900">Cabinet Catalog</h2>
      </div>

      {/* Search & Filter */}
      <div className="p-3 border-b border-gray-200 space-y-2">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search cabinets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:bg-white"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:bg-white"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Wall Selection Notice */}
      {!selectedWallId && (
        <div className="px-4 py-2 bg-orange-50 border-b border-orange-100">
          <p className="text-xs text-orange-600">
            Select a wall first to add cabinets
          </p>
        </div>
      )}

      {/* Models List */}
      <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
        {Object.keys(groupedModels).length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No cabinets found</p>
          </div>
        ) : (
          Object.entries(groupedModels).map(([group, models]) => (
            <div key={group} className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">
                {group} ({models.length})
              </h3>
              <div className="space-y-1">
                {models.map((model) => (
                  <CatalogItem
                    key={model.id}
                    model={model}
                    isPlacing={placingModelId === model.id}
                    isWallSelected={!!selectedWallId}
                    onAdd={() => handleAddToWall(model)}
                    onStartPlacing={() => handleStartPlacing(model)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Add Section */}
      <div className="border-t border-gray-200 p-3 bg-white">
        <p className="text-xs text-gray-500 mb-2">Quick Stats</p>
        <div className="text-xs text-gray-400">
          {catalogModels.length} models in catalog
        </div>
      </div>
    </div>
  );
};

// ============================================
// CATALOG ITEM
// ============================================

interface CatalogItemProps {
  model: CatalogModel;
  isPlacing: boolean;
  isWallSelected: boolean;
  onAdd: () => void;
  onStartPlacing: () => void;
}

const CatalogItem: React.FC<CatalogItemProps> = ({
  model,
  isPlacing,
  isWallSelected,
  onAdd,
  onStartPlacing,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`rounded border transition-all ${
        isPlacing
          ? 'border-orange-500 bg-orange-50'
          : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm'
      }`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Icon */}
          <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {model.entityName || model.boxModel}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {model.boxWidth} × {model.boxDepth} × {model.boxHeight} mm
            </p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-2 pb-2 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2 py-2 text-xs">
            <div>
              <span className="text-gray-400">Type:</span>{' '}
              <span className="text-gray-700">{model.boxType}</span>
            </div>
            <div>
              <span className="text-gray-400">Skirting:</span>{' '}
              <span className="text-gray-700">{model.skirting}mm</span>
            </div>
            <div>
              <span className="text-gray-400">Carcass:</span>{' '}
              <span className="text-gray-700">{model.carcusThickness}mm</span>
            </div>
            <div>
              <span className="text-gray-400">Door:</span>{' '}
              <span className="text-gray-700">{model.doorThickness}mm</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              disabled={!isWallSelected}
              className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                isWallSelected
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Add to Wall
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
