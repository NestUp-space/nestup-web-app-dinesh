'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDesignerStore, useDesignSummary } from '@/stores/designerStore';
import {
  formatDesignData,
  generatePlankList,
  runNesting,
} from '@/lib/visualiser';
import { downloadCutlistPdf, SheetPdfData } from '@/lib/visualiser/pdfGenerator';

// ============================================
// HELPER FUNCTIONS
// ============================================

function getCleanMaterial(material: string): string {
  if (!material) return 'Sheet';
  return String(material).replace(/\s*\([^)]+\)/g, '').replace(/-\s*\d+mm/i, '').trim();
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function PdfPage() {
  const router = useRouter();
  const summary = useDesignSummary();
  const { walls, customerDetails, projectName } = useDesignerStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<string>('all');

  // Generate nesting data
  const { sheetLayouts, sheetPdfData } = useMemo(() => {
    if (walls.length === 0) {
      return { sheetLayouts: [], sheetPdfData: [] };
    }

    const { data: formattedData } = formatDesignData(walls);
    const { plankList } = generatePlankList(formattedData);
    const { sheetLayouts } = runNesting(plankList);

    // Build per-material sheet numbering
    const materialSheetMap = new Map<string, Map<number, number>>();
    const materialCounters = new Map<string, number>();
    
    sheetLayouts.forEach((sheet, index) => {
      if (sheet.planks.length > 0) {
        const material = getCleanMaterial(sheet.planks[0].material);
        if (!materialSheetMap.has(material)) {
          materialSheetMap.set(material, new Map());
        }
        const counter = (materialCounters.get(material) || 0) + 1;
        materialCounters.set(material, counter);
        materialSheetMap.get(material)!.set(index + 1, counter);
      }
    });

    // Build sheet PDF data
    const sheetPdfData: SheetPdfData[] = sheetLayouts.map((sheet, index) => {
      const material = getCleanMaterial(sheet.planks[0]?.material || 'Unknown');
      const matNum = materialSheetMap.get(material)?.get(index + 1) || 1;
      
      return {
        sheetNum: index + 1,
        planks: sheet.planks,
        displayTitle: `${material} Sheet ${matNum}`,
        material,
        utilization: sheet.utilization,
      };
    });

    return { sheetLayouts, sheetPdfData };
  }, [walls]);

  // Download handlers
  const handleDownloadAll = async () => {
    setIsGenerating(true);
    try {
      await downloadCutlistPdf({
        clientName: customerDetails.customerName || 'Client',
        projectName: projectName || 'Cutlist',
        sheets: sheetPdfData,
        printAll: true,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadSelected = async () => {
    setIsGenerating(true);
    try {
      const sheetNum = selectedSheet === 'all' ? 1 : parseInt(selectedSheet);
      await downloadCutlistPdf({
        clientName: customerDetails.customerName || 'Client',
        projectName: projectName || 'Cutlist',
        sheets: sheetPdfData,
        printAll: false,
        selectedSheet: sheetNum,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (sheetLayouts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-lg mb-4">No design data available</p>
          <Link href="/visualiser/designer" className="px-4 py-2 bg-orange-500 rounded-lg hover:bg-orange-600">
            Go to Designer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/visualiser/reports/cutlist" className="text-white/70 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-light">Download Cutlist PDF</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6">PDF Export Options</h2>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-indigo-600">{sheetLayouts.length}</div>
                <div className="text-sm text-gray-600">Total Sheets</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">
                  {sheetPdfData.reduce((sum, s) => sum + s.planks.length, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Planks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">
                  {(sheetPdfData.reduce((sum, s) => sum + s.utilization, 0) / sheetPdfData.length).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Avg Utilization</div>
              </div>
            </div>
          </div>

          {/* Sheet Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Sheet for Single Download:
            </label>
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Sheets (Multi-page PDF)</option>
              {sheetPdfData.map((sheet) => (
                <option key={sheet.sheetNum} value={sheet.sheetNum}>
                  {sheet.displayTitle} - {sheet.planks.length} planks
                </option>
              ))}
            </select>
          </div>

          {/* Download Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleDownloadAll}
              disabled={isGenerating}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download All Sheets (Multi-page PDF)
                </>
              )}
            </button>

            {selectedSheet !== 'all' && (
              <button
                onClick={handleDownloadSelected}
                disabled={isGenerating}
                className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Download {sheetPdfData.find(s => s.sheetNum === parseInt(selectedSheet))?.displayTitle || 'Selected Sheet'}
                  </>
                )}
              </button>
            )}
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">PDF Contents:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Vector drawing of planks with holes</li>
              <li>• Per-material sheet numbering</li>
              <li>• Part list table (first 15 planks per sheet)</li>
              <li>• Customer/project information in header</li>
              <li>• CNC-compatible coordinates (Y-flipped)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
