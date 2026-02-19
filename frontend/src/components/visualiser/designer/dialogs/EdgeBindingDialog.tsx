/**
 * Edge Binding Settings Dialog
 * Pre-generation popup for selecting edge binding thickness per material
 * Replicates Apps Script showEdgeBindingDialog()
 */

'use client';

import React, { useState, useEffect } from 'react';

// ============================================
// TYPES
// ============================================

export interface EBSettings {
  [material: string]: number;
}

interface EdgeBindingDialogProps {
  isOpen: boolean;
  materials: string[];
  onSubmit: (settings: EBSettings) => void;
  onCancel: () => void;
}

// ============================================
// EDGE BINDING OPTIONS
// ============================================

const EB_OPTIONS = [
  { value: 0, label: 'None (0 mm)' },
  { value: 0.5, label: '0.5 mm' },
  { value: 0.8, label: '0.8 mm' },
  { value: 1, label: '1.0 mm' },
  { value: 1.3, label: '1.3 mm' },
  { value: 2, label: '2.0 mm' },
];

// ============================================
// COMPONENT
// ============================================

export const EdgeBindingDialog: React.FC<EdgeBindingDialogProps> = ({
  isOpen,
  materials,
  onSubmit,
  onCancel,
}) => {
  const [settings, setSettings] = useState<EBSettings>({});

  // Initialize with defaults when materials change
  useEffect(() => {
    const defaults: EBSettings = {};
    materials.forEach((mat) => {
      // Default: inner materials = 1mm, color materials = 2mm
      const isInner = mat.toLowerCase().includes('inner') || 
                      mat.toLowerCase().includes('plain');
      defaults[mat] = isInner ? 1 : 2;
    });
    setSettings(defaults);
  }, [materials]);

  if (!isOpen) return null;

  const handleChange = (material: string, value: number) => {
    setSettings((prev) => ({
      ...prev,
      [material]: value,
    }));
  };

  const handleSubmit = () => {
    onSubmit(settings);
  };

  const handleSetAll = (value: number) => {
    const newSettings: EBSettings = {};
    materials.forEach((mat) => {
      newSettings[mat] = value;
    });
    setSettings(newSettings);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 border border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Edge Binding Settings</h2>
          <p className="text-sm text-gray-400 mt-1">
            Choose EB thickness for each material. Applied equally to all 4 sides.
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {/* Quick Set Buttons */}
          <div className="flex gap-2 mb-4 pb-4 border-b border-gray-700">
            <span className="text-sm text-gray-400">Quick set all:</span>
            <button
              onClick={() => handleSetAll(0)}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              None
            </button>
            <button
              onClick={() => handleSetAll(1)}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              1mm
            </button>
            <button
              onClick={() => handleSetAll(2)}
              className="px-2 py-1 text-xs bg-orange-600 hover:bg-orange-500 text-white rounded"
            >
              2mm
            </button>
          </div>

          {/* Material List */}
          {materials.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No materials found</p>
          ) : (
            <div className="space-y-3">
              {materials.map((material) => (
                <div
                  key={material}
                  className="flex items-center justify-between py-2 border-b border-gray-700/50"
                >
                  <span className="text-gray-200 text-sm truncate flex-1 mr-4">
                    {material}
                  </span>
                  <select
                    value={settings[material] || 0}
                    onChange={(e) => handleChange(material, parseFloat(e.target.value))}
                    className="bg-gray-700 text-white text-sm rounded px-3 py-1.5 border border-gray-600 focus:border-orange-500 focus:outline-none"
                  >
                    {EB_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default EdgeBindingDialog;
