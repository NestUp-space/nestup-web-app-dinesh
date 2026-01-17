/**
 * CatalogPanel Component
 * Displays cabinet templates for placement and handles catalog uploads
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDesignerStore } from "@/store/designerStore";
import { parseCatalogCSV, createDemoCatalog } from "@/lib/visualiser/catalogParser";
import type { BoxTemplate, Catalog } from "@/types/visualiser";

// ============================================
// Template Card Component
// ============================================

interface TemplateCardProps {
  template: BoxTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
}

function TemplateCard({ template, isSelected, onSelect, onDoubleClick }: TemplateCardProps) {
  return (
    <div
      className={`p-3 rounded-dls-md border-2 cursor-pointer transition-all ${
        isSelected
          ? "border-primary-orange bg-lighter-interactive/20"
          : "border-light-bw hover:border-medium-border hover:bg-lighter-bg"
      }`}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
    >
      {/* Preview */}
      <div 
        className="w-full aspect-square rounded-dls-md mb-2 flex items-center justify-center text-4xl"
        style={{ backgroundColor: template.previewColor || '#FFEBD1' }}
      >
        {template.boxType?.includes('wall') ? '🗄️' : 
         template.boxType?.includes('tall') ? '🚪' : '📦'}
      </div>
      
      {/* Info */}
      <div className="text-sm font-medium text-neutral-dark truncate">
        {template.entityName}
      </div>
      {template.boxModel && (
        <div className="text-xs text-technical-gray">
          {template.boxModel}
        </div>
      )}
      <div className="text-xs text-light-interactive-bw mt-1">
        {template.defaultWidth} × {template.defaultDepth} × {template.defaultHeight}
      </div>
      <div className="text-xs text-light-interactive-bw">
        {template.plankTemplates.length} planks
      </div>
    </div>
  );
}

// ============================================
// Upload Dialog Component
// ============================================

interface UploadDialogProps {
  onClose: () => void;
  onUpload: (catalog: Catalog) => void;
}

function UploadDialog({ onClose, onUpload }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [catalogName, setCatalogName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setCatalogName(selectedFile.name.replace(/\.[^.]+$/, ''));
      setError(null);
      setWarnings([]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    const result = await parseCatalogCSV(file, catalogName);

    setIsProcessing(false);

    if (!result.success) {
      setError(result.errors?.join('\n') || 'Unknown error');
      return;
    }

    if (result.warnings) {
      setWarnings(result.warnings);
    }

    if (result.catalog) {
      onUpload(result.catalog);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-lightest-bg rounded-dls-lg shadow-2xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-light-bw">
          <h3 className="text-lg font-semibold text-neutral-dark">Upload Catalog</h3>
        </div>

        <div className="p-6 space-y-4">
          {/* File Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-dls-md p-8 text-center cursor-pointer transition-colors ${
              file
                ? "border-accent-green bg-accent-green/10"
                : "border-light-bw hover:border-medium-border hover:bg-lighter-bg"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            {file ? (
              <>
                <div className="text-4xl mb-2">📄</div>
                <div className="text-sm font-medium text-neutral-dark">{file.name}</div>
                <div className="text-xs text-technical-gray mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">📁</div>
                <div className="text-sm text-technical-gray">
                  Click to select or drag CSV file
                </div>
              </>
            )}
          </div>

          {/* Catalog Name */}
          {file && (
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1">
                Catalog Name
              </label>
              <input
                type="text"
                value={catalogName}
                onChange={(e) => setCatalogName(e.target.value)}
                className="w-full px-3 py-2 text-neutral-dark border border-light-bw rounded-dls-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-dls-md">
              <div className="text-sm text-red-700 whitespace-pre-wrap">{error}</div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="p-3 bg-warm-gold/20 border border-warm-gold rounded-dls-md">
              <div className="text-sm text-dark-text">
                {warnings.map((w, i) => (
                  <div key={i}>{w}</div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-neutral-dark hover:bg-lighter-bg rounded-dls-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || isProcessing}
              className={`px-4 py-2 rounded-dls-md transition-colors ${
                !file || isProcessing
                  ? "bg-lighter-bg text-technical-gray cursor-not-allowed"
                  : "bg-primary-orange text-white hover:bg-dark-color"
              }`}
            >
              {isProcessing ? "Processing..." : "Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main CatalogPanel Component
// ============================================

export function CatalogPanel() {
  const boxTemplates = useDesignerStore((state) => state.boxTemplates);
  const catalogs = useDesignerStore((state) => state.catalogs);
  const activeCatalogId = useDesignerStore((state) => state.activeCatalogId);
  const placingTemplateId = useDesignerStore((state) => state.placingTemplateId);
  const isCatalogPanelOpen = useDesignerStore((state) => state.isCatalogPanelOpen);
  
  const setBoxTemplates = useDesignerStore((state) => state.setBoxTemplates);
  const addCatalog = useDesignerStore((state) => state.addCatalog);
  const setActiveCatalog = useDesignerStore((state) => state.setActiveCatalog);
  const setPlacingTemplate = useDesignerStore((state) => state.setPlacingTemplate);
  const toggleCatalogPanel = useDesignerStore((state) => state.toggleCatalogPanel);

  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  // Initialize with demo catalog if none exist
  useEffect(() => {
    if (catalogs.length === 0) {
      const demoCatalog = createDemoCatalog();
      addCatalog(demoCatalog);
      setActiveCatalog(demoCatalog.id);
      setBoxTemplates(demoCatalog.boxTemplates);
    }
  }, [catalogs.length, addCatalog, setActiveCatalog, setBoxTemplates]);

  // Get active catalog's templates
  const activeCatalog = catalogs.find(c => c.id === activeCatalogId);
  const displayTemplates = activeCatalog?.boxTemplates || boxTemplates;

  // Filter templates
  const filteredTemplates = displayTemplates.filter(template => {
    const matchesSearch = 
      template.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.boxModel?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || 
      template.boxType?.includes(filterType);
    
    return matchesSearch && matchesType;
  });

  // Get unique box types for filter
  const boxTypes = Array.from(
    new Set(displayTemplates.map(t => t.boxType).filter(Boolean))
  );

  const handleUpload = useCallback((catalog: Catalog) => {
    addCatalog(catalog);
    setActiveCatalog(catalog.id);
    setBoxTemplates(catalog.boxTemplates);
    setShowUploadDialog(false);
  }, [addCatalog, setActiveCatalog, setBoxTemplates]);

  const handleTemplateSelect = useCallback((templateId: string) => {
    if (placingTemplateId === templateId) {
      setPlacingTemplate(null);
    } else {
      setPlacingTemplate(templateId);
    }
  }, [placingTemplateId, setPlacingTemplate]);

  const handleTemplateDoubleClick = useCallback((templateId: string) => {
    setPlacingTemplate(templateId);
    // TODO: Automatically start placement mode
  }, [setPlacingTemplate]);

  if (!isCatalogPanelOpen) {
    return (
      <button
        onClick={toggleCatalogPanel}
        className="absolute top-36 left-4 bg-lightest-bg/95 backdrop-blur p-2 rounded-dls-md shadow-lg z-30 hover:bg-lighter-bg transition-colors"
        title="Show Catalog"
      >
        📦
      </button>
    );
  }

  return (
    <>
      <div className="absolute top-36 left-4 w-72 bg-lightest-bg/95 backdrop-blur rounded-dls-lg shadow-lg overflow-hidden z-30">
        {/* Header */}
        <div className="px-4 py-3 bg-lighter-bg border-b border-light-bw flex items-center justify-between">
          <h3 className="font-semibold text-neutral-dark">Catalog</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowUploadDialog(true)}
              className="p-1.5 hover:bg-light-bg rounded-dls-sm transition-colors"
              title="Upload Catalog"
            >
              📤
            </button>
            <button
              onClick={toggleCatalogPanel}
              className="p-1.5 hover:bg-light-bg rounded-dls-sm transition-colors"
              title="Hide Panel"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Catalog Selector */}
        {catalogs.length > 1 && (
          <div className="px-4 py-2 border-b border-light-bw">
            <select
              value={activeCatalogId || ''}
              onChange={(e) => {
                setActiveCatalog(e.target.value);
                const catalog = catalogs.find(c => c.id === e.target.value);
                if (catalog) {
                  setBoxTemplates(catalog.boxTemplates);
                }
              }}
              className="w-full px-2 py-1.5 text-sm text-neutral-dark border border-light-bw rounded-dls-md focus:ring-2 focus:ring-primary-orange"
            >
              {catalogs.map(catalog => (
                <option key={catalog.id} value={catalog.id}>
                  {catalog.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search */}
        <div className="px-4 py-2 border-b border-light-bw">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="w-full px-3 py-2 text-sm text-neutral-dark border border-light-bw rounded-dls-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
          />
        </div>

        {/* Type Filter */}
        {boxTypes.length > 0 && (
          <div className="px-4 py-2 border-b border-light-bw flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-1 text-xs rounded-dls-sm transition-colors ${
                filterType === 'all'
                  ? 'bg-primary-orange text-white'
                  : 'bg-lighter-bg text-technical-gray hover:bg-light-bg'
              }`}
            >
              All
            </button>
            {boxTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type!)}
                className={`px-2 py-1 text-xs rounded-dls-sm capitalize transition-colors ${
                  filterType === type
                    ? 'bg-primary-orange text-white'
                    : 'bg-lighter-bg text-technical-gray hover:bg-light-bg'
                }`}
              >
                {type?.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}

        {/* Template Grid */}
        <div className="p-3 max-h-96 overflow-y-auto">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-technical-gray text-sm">
              {searchTerm ? 'No templates match your search' : 'No templates available'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={placingTemplateId === template.id}
                  onSelect={() => handleTemplateSelect(template.id)}
                  onDoubleClick={() => handleTemplateDoubleClick(template.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        {placingTemplateId && (
          <div className="px-4 py-3 bg-lighter-interactive/20 border-t border-light-border">
            <div className="text-sm text-dark-text">
              <strong>Click on wall</strong> to place the cabinet, or press <strong>Esc</strong> to cancel.
            </div>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <UploadDialog
          onClose={() => setShowUploadDialog(false)}
          onUpload={handleUpload}
        />
      )}
    </>
  );
}

export default CatalogPanel;
