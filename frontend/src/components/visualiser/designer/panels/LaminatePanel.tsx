'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useDesignerStore, useSelectedBox } from '@/store/designerStore';
import { LaminateOption } from '@/types/visualiser';
import { localConvertDriveUrl } from '@/lib/visualiser/catalogParser';

// Laminate color mapping for 3D visualization
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
 * LaminatePanel - EXACT PORT from Apps Script openLaminateSidePanel
 * 
 * Features:
 * - Shows laminate options with images from Google Drive URLs
 * - Filter by brand
 * - Search by code/colour
 * - Apply laminate to selected planks
 * - Side selection (outer/inner/both)
 */

interface LaminatePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export const LaminatePanel: React.FC<LaminatePanelProps> = ({ isOpen, onClose }) => {
  const selectedBox = useSelectedBox();
  const { laminateLibrary, updatePlank, selectPlank, selectedPlankId, applyLaminateToBox } = useDesignerStore();
  
  // State
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSide, setSelectedSide] = useState<'outer' | 'inner' | 'both'>('outer');
  const [selectedLaminate, setSelectedLaminate] = useState<LaminateOption | null>(null);
  const [selectedPlankIds, setSelectedPlankIds] = useState<string[]>([]);
  
  // Reset selection when box changes
  useEffect(() => {
    setSelectedPlankIds([]);
    setSelectedLaminate(null);
  }, [selectedBox?.id]);

  // Get unique brands from laminate library
  const brands = useMemo(() => {
    const brandSet = new Set<string>();
    laminateLibrary.forEach(lam => {
      if (lam.brand) brandSet.add(lam.brand);
    });
    return Array.from(brandSet).sort();
  }, [laminateLibrary]);

  // Filter laminates
  const filteredLaminates = useMemo(() => {
    return laminateLibrary.filter(lam => {
      // Brand filter
      if (brandFilter !== 'all' && lam.brand !== brandFilter) {
        return false;
      }
      
      // Search filter
      if (searchTerm) {
        const searchIn = [
          lam.code || '',
          lam.colour || '',
          lam.brand || '',
          lam.displayName || ''
        ].join(' ').toLowerCase();
        
        if (!searchIn.includes(searchTerm.toLowerCase())) {
          return false;
        }
      }
      
      return true;
    });
  }, [laminateLibrary, brandFilter, searchTerm]);

  // Use centralized URL conversion function
  const convertDriveUrl = useCallback((url: string): string => {
    return localConvertDriveUrl(url);
  }, []);

  // Toggle plank selection
  const togglePlankSelection = (plankId: string) => {
    setSelectedPlankIds(prev => 
      prev.includes(plankId) 
        ? prev.filter(id => id !== plankId)
        : [...prev, plankId]
    );
  };

  // Select all planks
  const selectAllPlanks = () => {
    if (selectedBox) {
      setSelectedPlankIds(selectedBox.planks.map(p => p.id));
    }
  };

  // Deselect all planks
  const deselectAllPlanks = () => {
    setSelectedPlankIds([]);
  };

  // Apply laminate to selected planks with visual update (including texture)
  const applyLaminate = useCallback(() => {
    if (!selectedLaminate) return;
    
    // Get the display color for 3D visualization (fallback when no texture)
    const displayColor = getLaminateDisplayColor(selectedLaminate);
    
    // Get texture URL - ensure it's converted to thumbnail format
    const rawPhotoUrl = selectedLaminate.photoUrl || '';
    const textureUrl = rawPhotoUrl ? localConvertDriveUrl(rawPhotoUrl) : '';
    
    console.log(`[LaminatePanel] Applying laminate: ${selectedLaminate.code}, texture URL: ${textureUrl}`);
    
    // If planks are selected, apply to those planks only
    if (selectedPlankIds.length > 0) {
      selectedPlankIds.forEach(plankId => {
        const updates: Record<string, unknown> = {
          materialColor: displayColor,
          laminateCode: selectedLaminate.code,
          laminateBrand: selectedLaminate.brand,
          // Add texture URL for 3D rendering - this is the key for texture mapping
          textureUrl: textureUrl,
        };
        
        if (selectedSide === 'outer' || selectedSide === 'both') {
          updates.outerLaminate = selectedLaminate.code;
          updates.outerLaminateUrl = textureUrl;
        }
        
        if (selectedSide === 'inner' || selectedSide === 'both') {
          updates.innerLaminate = selectedLaminate.code;
          updates.innerLaminateUrl = textureUrl;
        }
        
        updatePlank(plankId, updates);
      });
      
      console.log(`[LaminatePanel] Applied ${selectedLaminate.code} to ${selectedPlankIds.length} planks (${selectedSide}), texture: ${textureUrl ? 'yes' : 'no'}`);
    }
    // If a box is selected but no planks, apply to entire box
    else if (selectedBox) {
      applyLaminateToBox(selectedBox.id, selectedLaminate, selectedSide);
      console.log(`[LaminatePanel] Applied ${selectedLaminate.code} to box "${selectedBox.entityName}" (${selectedSide})`);
    }
  }, [selectedLaminate, selectedPlankIds, selectedBox, selectedSide, updatePlank, applyLaminateToBox]);
  
  // Quick apply: clicking a laminate directly applies it to selected box
  const handleLaminateClick = useCallback((laminate: LaminateOption) => {
    setSelectedLaminate(laminate);
    
    // If box is selected and no planks selected, apply immediately
    if (selectedBox && selectedPlankIds.length === 0) {
      // Ensure photoUrl is converted for texture loading
      const laminateWithConvertedUrl = {
        ...laminate,
        photoUrl: laminate.photoUrl ? localConvertDriveUrl(laminate.photoUrl) : '',
      };
      
      applyLaminateToBox(selectedBox.id, laminateWithConvertedUrl, selectedSide);
      console.log(`[LaminatePanel] Quick-applied ${laminate.code} to box "${selectedBox.entityName}", texture: ${laminateWithConvertedUrl.photoUrl}`);
    }
  }, [selectedBox, selectedPlankIds, selectedSide, applyLaminateToBox]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-50 flex flex-col border-r border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">🎨 Laminate Picker</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-orange-500"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-gray-200 space-y-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search laminates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 pl-9 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:bg-white"
          />
          <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Brand Filter */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Brand</label>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setBrandFilter('all')}
              className={`px-2 py-1 text-xs rounded ${
                brandFilter === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {brands.map(brand => (
              <button
                key={brand}
                onClick={() => setBrandFilter(brand)}
                className={`px-2 py-1 text-xs rounded ${
                  brandFilter === brand
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plank Selection (when box is selected) */}
      {selectedBox && (
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-500">Select Planks</label>
            <div className="space-x-2">
              <button
                onClick={selectAllPlanks}
                className="text-xs text-orange-500 hover:text-orange-600"
              >
                All
              </button>
              <button
                onClick={deselectAllPlanks}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                None
              </button>
            </div>
          </div>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {selectedBox.planks.map(plank => (
              <label
                key={plank.id}
                className="flex items-center gap-2 text-xs cursor-pointer hover:bg-orange-50 px-1 py-0.5 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedPlankIds.includes(plank.id)}
                  onChange={() => togglePlankSelection(plank.id)}
                  className="rounded border-gray-300 bg-white text-orange-500 focus:ring-orange-500"
                />
                <span className="text-gray-700">{plank.entityName}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Side Selection */}
      <div className="px-4 py-3 border-b border-gray-200">
        <label className="block text-xs text-gray-500 mb-2">Apply to Side</label>
        <div className="flex gap-2">
          {(['outer', 'inner', 'both'] as const).map(side => (
            <button
              key={side}
              onClick={() => setSelectedSide(side)}
              className={`flex-1 px-2 py-1.5 text-xs rounded capitalize ${
                selectedSide === side
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {side}
            </button>
          ))}
        </div>
      </div>

      {/* Laminate Grid */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {filteredLaminates.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            {laminateLibrary.length === 0 ? (
              <>
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No laminates loaded</p>
                <p className="text-xs mt-1">Add laminate library CSV to sample_data</p>
              </>
            ) : (
              <p className="text-sm">No laminates match your filters</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredLaminates.map(laminate => (
              <div
                key={laminate.id || laminate.code}
                onClick={() => handleLaminateClick(laminate)}
                className={`rounded-lg overflow-hidden cursor-pointer transition-all border ${
                  selectedLaminate?.code === laminate.code
                    ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-200 border-orange-300'
                    : 'border-gray-200 hover:border-orange-300 hover:shadow-md'
                }`}
              >
                {/* Laminate Image */}
                <div className="aspect-square bg-gray-100 relative">
                  {laminate.photoUrl ? (
                    <img
                      src={convertDriveUrl(laminate.photoUrl)}
                      alt={laminate.code}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Price badge */}
                  {laminate.price && (
                    <div className="absolute top-1 right-1 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                      ₹{laminate.price}
                    </div>
                  )}
                </div>
                
                {/* Laminate Info */}
                <div className="p-2 bg-white">
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {laminate.code}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">
                    {laminate.colour || laminate.brand}
                  </div>
                  {laminate.thickness && (
                    <div className="text-[10px] text-gray-400">
                      {laminate.thickness}mm
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apply Button */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <button
          onClick={applyLaminate}
          disabled={!selectedLaminate || selectedPlankIds.length === 0}
          className={`w-full px-4 py-2 rounded text-sm font-medium ${
            selectedLaminate && selectedPlankIds.length > 0
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {selectedLaminate 
            ? `Apply ${selectedLaminate.code} to ${selectedPlankIds.length} plank${selectedPlankIds.length !== 1 ? 's' : ''}`
            : 'Select a laminate'
          }
        </button>
      </div>
    </div>
  );
};
