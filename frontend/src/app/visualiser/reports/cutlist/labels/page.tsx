'use client';

import React, { useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDesignerStore, useDesignSummary } from '@/stores/designerStore';
import {
  formatDesignData,
  generatePlankList,
  runNesting,
} from '@/lib/visualiser';
import { NestResult, SHEET_CONSTANTS } from '@/types/visualiser';

// ============================================
// HELPER FUNCTIONS
// ============================================

function getCleanMaterial(material: string): string {
  if (!material) return 'Sheet';
  return String(material).replace(/\s*\([^)]+\)/g, '').replace(/-\s*\d+mm/i, '').trim();
}

function getRoomFromMaterial(material: string): string {
  const roomMatch = material.match(/\(([^)]+)\)/);
  return roomMatch ? roomMatch[1] : 'N/A';
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function LabelsPage() {
  const router = useRouter();
  const summary = useDesignSummary();
  const { walls, customerDetails, projectName } = useDesignerStore();
  const printRef = useRef<HTMLDivElement>(null);

  // Generate nesting data
  const { sheetLayouts, materialSheetMap, allPlanks } = useMemo(() => {
    if (walls.length === 0) {
      return { sheetLayouts: [], materialSheetMap: new Map(), allPlanks: [] };
    }

    const { data: formattedData } = formatDesignData(walls);
    const { plankList } = generatePlankList(formattedData);
    const { sheetLayouts } = runNesting(plankList);

    // Build per-material sheet numbering map
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

    // Collect all planks with sheet info
    const allPlanks: Array<NestResult & { sheetPlanks: NestResult[] }> = [];
    sheetLayouts.forEach((sheet) => {
      sheet.planks.forEach(plank => {
        allPlanks.push({ ...plank, sheetPlanks: sheet.planks });
      });
    });

    return { sheetLayouts, materialSheetMap, allPlanks };
  }, [walls]);

  // Get material sheet number
  const getMaterialSheetNumber = (sheetNum: number, material: string): number => {
    const cleanMat = getCleanMaterial(material);
    return materialSheetMap.get(cleanMat)?.get(sheetNum) || 1;
  };

  // Print handler
  const handlePrint = () => {
    window.print();
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
      {/* Header - Hidden in print */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg print:hidden">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/visualiser/reports/cutlist" className="text-white/70 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-light">Plank Labels</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/80 text-sm">{allPlanks.length} labels</span>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Labels
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Labels Container */}
      <div ref={printRef} className="p-5 print:p-0">
        <div className="flex flex-wrap">
          {allPlanks.map((plank, index) => (
            <LabelCard
              key={`${plank.id}-${index}`}
              plank={plank}
              sheetPlanks={plank.sheetPlanks}
              customerName={customerDetails.customerName}
              firmName={customerDetails.firmName}
              getMaterialSheetNumber={getMaterialSheetNumber}
            />
          ))}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 5mm;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .label-container {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================
// LABEL CARD COMPONENT
// ============================================

interface LabelCardProps {
  plank: NestResult;
  sheetPlanks: NestResult[];
  customerName: string;
  firmName: string;
  getMaterialSheetNumber: (sheetNum: number, material: string) => number;
}

const LabelCard: React.FC<LabelCardProps> = ({
  plank,
  sheetPlanks,
  customerName,
  firmName,
  getMaterialSheetNumber,
}) => {
  const roomName = getRoomFromMaterial(plank.material);
  const cleanMaterial = getCleanMaterial(plank.material);
  const materialSheetNum = getMaterialSheetNumber(plank.sheetNum, plank.material);
  const sheetDisplayText = `${cleanMaterial} Sheet ${materialSheetNum}`;
  
  // Use original dimensions if available
  const displayW = plank.originalWidth || plank.width;
  const displayH = plank.originalHeight || plank.height;
  const displayEB = plank.ebValue || 0;

  return (
    <div 
      className="label-container flex border border-dashed border-gray-400 bg-white m-1 print:m-0 print:border-solid print:border-black"
      style={{ width: '75mm', height: '50mm', padding: '3mm' }}
    >
      {/* Left Side */}
      <div className="flex-[2] flex flex-col text-[10pt] leading-tight overflow-hidden">
        <div className="text-[8pt] font-bold text-gray-600">Nestup</div>
        <div className="text-[11pt] font-bold mt-1 truncate">{plank.name}</div>
        <div className="text-[10pt] text-gray-700">{cleanMaterial} - {plank.thickness}mm</div>
        <div className="text-[10pt] font-bold mt-auto">{sheetDisplayText}</div>
        <div className="text-[9pt]">{parseFloat(String(displayW)).toFixed(1)} x {parseFloat(String(displayH)).toFixed(1)}</div>
        <div className="text-[9pt] font-bold">{roomName}</div>
        {firmName && <div className="text-[14pt] font-black">{firmName}</div>}
        {customerName && <div className="text-[14pt] font-black">{customerName}</div>}
      </div>

      {/* Right Side */}
      <div className="flex-[1.2] flex flex-col items-center text-center">
        <div className="text-[24pt] font-bold">{plank.id}</div>
        <MiniMap 
          currentPlank={plank} 
          allPlanksOnSheet={sheetPlanks} 
        />
        <div className="text-[7pt] mt-1">EB - {displayEB} mm</div>
      </div>
    </div>
  );
};

// ============================================
// MINIMAP COMPONENT
// ============================================

interface MiniMapProps {
  currentPlank: NestResult;
  allPlanksOnSheet: NestResult[];
}

const MiniMap: React.FC<MiniMapProps> = ({ currentPlank, allPlanksOnSheet }) => {
  const SHEET_W = SHEET_CONSTANTS.SHEET_WIDTH;
  const SHEET_H = SHEET_CONSTANTS.SHEET_HEIGHT;

  // Build SVG for other planks (with Y-flip for CNC coordinates)
  const otherPlanksSvg = allPlanksOnSheet
    .filter(p => p.id !== currentPlank.id)
    .map((p, i) => {
      // Y-flip: SVG origin is top-left, CNC origin is bottom-left
      const svgY = SHEET_H - p.y - p.height;
      return (
        <rect
          key={i}
          x={p.x}
          y={svgY}
          width={p.width}
          height={p.height}
          fill="white"
          stroke="#aaa"
          strokeWidth={25}
        />
      );
    });

  // Y-flip for highlighted plank
  const currentSvgY = SHEET_H - currentPlank.y - currentPlank.height;

  return (
    <svg 
      className="border border-black"
      style={{ 
        height: 'calc(100% - 32px)', 
        width: 'auto',
        aspectRatio: `${SHEET_W} / ${SHEET_H}`
      }}
      viewBox={`0 0 ${SHEET_W} ${SHEET_H}`}
    >
      {/* Sheet background */}
      <rect x="0" y="0" width={SHEET_W} height={SHEET_H} fill="white" />
      
      {/* Other planks */}
      {otherPlanksSvg}
      
      {/* Highlighted current plank */}
      <rect
        x={currentPlank.x}
        y={currentSvgY}
        width={currentPlank.width}
        height={currentPlank.height}
        fill="black"
        stroke="black"
        strokeWidth={25}
      />
    </svg>
  );
};
