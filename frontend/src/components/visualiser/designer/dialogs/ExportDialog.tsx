/**
 * ExportDialog Component
 * Dialog for exporting cut lists and project data
 */

"use client";

import React, { useState, useCallback } from "react";
import { useDesignerStore } from "@/store/designerStore";
import {
  exportCutlistCSV,
  exportMaterialSummaryCSV,
  exportProjectJSON,
  generateMaterialSummary,
  downloadFile,
} from "@/lib/visualiser/exporters/cutlistExporter";

// ============================================
// Export Format Card
// ============================================

interface FormatCardProps {
  title: string;
  description: string;
  icon: string;
  isSelected: boolean;
  onClick: () => void;
}

function FormatCard({ title, description, icon, isSelected, onClick }: FormatCardProps) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 text-left transition-all w-full ${
        isSelected
          ? "border-orange-500 bg-orange-50"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-medium text-gray-800">{title}</div>
      <div className="text-sm text-gray-500">{description}</div>
    </button>
  );
}

// ============================================
// Main ExportDialog Component
// ============================================

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const walls = useDesignerStore((state) => state.walls);
  const projectName = useDesignerStore((state) => state.projectName);

  const [exportFormat, setExportFormat] = useState<'cutlist' | 'materials' | 'project'>('cutlist');
  const [includeOptions, setIncludeOptions] = useState({
    materials: true,
    area: true,
    positions: false,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string } | null>(null);

  // Calculate statistics
  const stats = {
    walls: walls.length,
    boxes: walls.reduce((sum, w) => sum + w.boxes.length, 0),
    planks: walls.reduce((sum, w) => sum + w.boxes.reduce((s, b) => s + b.planks.length, 0), 0),
  };

  // Get material summary
  const materialSummary = generateMaterialSummary(walls);

  const handleExport = useCallback(() => {
    setIsExporting(true);
    setExportResult(null);

    try {
      let result;
      let mimeType = 'text/csv';

      switch (exportFormat) {
        case 'cutlist':
          result = exportCutlistCSV(walls, {
            includeMaterials: includeOptions.materials,
            includeArea: includeOptions.area,
            includePositions: includeOptions.positions,
          });
          break;
        case 'materials':
          result = exportMaterialSummaryCSV(walls);
          break;
        case 'project':
          result = exportProjectJSON(walls, projectName);
          mimeType = 'application/json';
          break;
        default:
          throw new Error('Invalid export format');
      }

      if (result.success && result.data && result.filename) {
        downloadFile(result.data, result.filename, mimeType);
        setExportResult({ success: true, message: `Downloaded ${result.filename}` });
      } else {
        setExportResult({ success: false, message: result.error || 'Export failed' });
      }
    } catch (error) {
      setExportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Export failed',
      });
    } finally {
      setIsExporting(false);
    }
  }, [exportFormat, includeOptions, walls, projectName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Export Project</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{stats.walls}</div>
              <div className="text-xs text-gray-500">Walls</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{stats.boxes}</div>
              <div className="text-xs text-gray-500">Boxes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{stats.planks}</div>
              <div className="text-xs text-gray-500">Planks</div>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Export Format</h4>
            <div className="space-y-2">
              <FormatCard
                title="Cut List CSV"
                description="Detailed list of all planks with dimensions"
                icon="📋"
                isSelected={exportFormat === 'cutlist'}
                onClick={() => setExportFormat('cutlist')}
              />
              <FormatCard
                title="Material Summary"
                description="Aggregated material quantities and sheet estimates"
                icon="📊"
                isSelected={exportFormat === 'materials'}
                onClick={() => setExportFormat('materials')}
              />
              <FormatCard
                title="Project JSON"
                description="Complete project data for backup or import"
                icon="💾"
                isSelected={exportFormat === 'project'}
                onClick={() => setExportFormat('project')}
              />
            </div>
          </div>

          {/* Options (for cutlist) */}
          {exportFormat === 'cutlist' && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Include</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeOptions.materials}
                    onChange={(e) => setIncludeOptions(prev => ({ ...prev, materials: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-orange-500"
                  />
                  <span className="text-sm text-gray-700">Material strings and laminate codes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeOptions.area}
                    onChange={(e) => setIncludeOptions(prev => ({ ...prev, area: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-orange-500"
                  />
                  <span className="text-sm text-gray-700">Area calculations (sqft)</span>
                </label>
              </div>
            </div>
          )}

          {/* Material Preview (for materials format) */}
          {exportFormat === 'materials' && materialSummary.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Preview</h4>
              <div className="max-h-40 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-600">Material</th>
                      <th className="px-3 py-2 text-right text-gray-600">Planks</th>
                      <th className="px-3 py-2 text-right text-gray-600">Sheets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialSummary.map((m, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2 truncate max-w-[200px]">{m.material}</td>
                        <td className="px-3 py-2 text-right">{m.plankCount}</td>
                        <td className="px-3 py-2 text-right">{m.estimatedSheets}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Export Result */}
          {exportResult && (
            <div className={`p-3 rounded-lg ${
              exportResult.success
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              {exportResult.success ? '✓' : '✕'} {exportResult.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || stats.planks === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isExporting || stats.planks === 0
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            {isExporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportDialog;
