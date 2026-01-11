"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useCutlistStore, useAppStore } from "@/store/visualiserStore";
import type { NestResult, CutlistData, CutlistHole } from "@/types/visualiser";

// Demo data for testing
const DEMO_CUTLIST_DATA: CutlistData = {
  planks: {
    1: [
      { id: "P001", name: "Left Side", material: "White MDF", thickness: 18, sheetNum: 1, x: 10, y: 10, width: 720, height: 560, rotated: false, color: "#FF6B6B", holes: [] },
      { id: "P002", name: "Right Side", material: "White MDF", thickness: 18, sheetNum: 1, x: 740, y: 10, width: 720, height: 560, rotated: false, color: "#FF6B6B", holes: [] },
      { id: "P003", name: "Bottom Panel", material: "White MDF", thickness: 18, sheetNum: 1, x: 10, y: 580, width: 564, height: 560, rotated: false, color: "#FF6B6B", holes: [
        { x: 50, y: 50, diameter: 5, type: "screw", isRectangular: false, description: "Screw 1" },
        { x: 514, y: 50, diameter: 5, type: "screw", isRectangular: false, description: "Screw 2" },
      ]},
      { id: "P004", name: "Top Panel", material: "White MDF", thickness: 18, sheetNum: 1, x: 584, y: 580, width: 564, height: 560, rotated: false, color: "#FF6B6B", holes: [] },
    ],
    2: [
      { id: "P005", name: "Back Panel", material: "White MDF", thickness: 8, sheetNum: 2, x: 10, y: 10, width: 684, height: 564, rotated: false, color: "#4ECDC4", holes: [] },
      { id: "P006", name: "Shelf 1", material: "Oak Veneer", thickness: 18, sheetNum: 2, x: 704, y: 10, width: 500, height: 400, rotated: false, color: "#45B7D1", holes: [
        { x: 10, y: 200, length: 480, width: 8, type: "groove", isRectangular: true, description: "Groove 1" },
      ]},
    ],
  },
  stats: {
    totalPlanks: 6,
    totalSheets: 2,
    materialThicknessStats: {
      "White MDF_18mm": { color: "#FF6B6B", count: 4 },
      "White MDF_8mm": { color: "#4ECDC4", count: 1 },
      "Oak Veneer_18mm": { color: "#45B7D1", count: 1 },
    },
    sheetUtilization: {
      1: { percentage: "72.5", usedArea: 2156160 },
      2: { percentage: "45.2", usedArea: 1344960 },
    },
  },
  constants: {
    SHEET_WIDTH: 1220,
    SHEET_HEIGHT: 2440,
    SPACING: 10,
  },
  clientDetails: {
    customerName: "Demo Customer",
    firmName: "Nestup Demo",
  },
  spreadsheetName: "Demo Project",
};

// ============================================
// Utility Functions
// ============================================

function getHoleTypeClass(holeType: string): string {
  if (!holeType) return "hole-standard";
  const type = holeType.toLowerCase();
  if (type.includes("vb")) return "hole-vb";
  if (type.includes("screw")) return "hole-screw";
  if (type.includes("dowel")) return "hole-dowel";
  if (type.includes("groove")) return "hole-groove";
  if (type.includes("profile")) return "hole-profile";
  if (type.includes("slot")) return "hole-slot";
  return "hole-standard";
}

// ============================================
// PDF Generation
// ============================================

async function generatePDF(
  cutlistData: CutlistData, 
  selectedSheet: number | 'all',
  customerName?: string
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  
  const pageW = 210;
  const pageH = 297;
  const margin = 10;
  const headerH = 30;
  const tableH = 80;
  const vizAreaH = pageH - margin * 2 - headerH - tableH;
  const vizAreaW = pageW - margin * 2;

  const sheetsToRender = selectedSheet === 'all' 
    ? Object.keys(cutlistData.planks).map(Number).sort((a, b) => a - b)
    : [selectedSheet as number];

  for (let i = 0; i < sheetsToRender.length; i++) {
    if (i > 0) doc.addPage();
    
    const sheetNum = sheetsToRender[i];
    const sheetPlanks = cutlistData.planks[sheetNum];
    const firstPlank = sheetPlanks[0];
    
    // Get material info
    let matName = firstPlank?.material || "Sheet";
    matName = matName.replace(/-\s*\d+mm/i, "").trim();
    const thick = firstPlank?.thickness || "";
    const sheetTitle = `${matName} ${thick}mm - Sheet ${sheetNum}`;

    // Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(sheetTitle, margin, margin + 8);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Material: ${matName}`, margin, margin + 14);
    
    if (customerName) {
      doc.text(customerName, pageW - margin, margin + 8, { align: "right" });
    }
    doc.text(new Date().toLocaleDateString(), pageW - margin, margin + 14, { align: "right" });
    
    doc.setLineWidth(0.5);
    doc.line(margin, margin + 22, pageW - margin, margin + 22);

    // Calculate scale
    const sheetWidth = cutlistData.constants.SHEET_WIDTH;
    const sheetHeight = cutlistData.constants.SHEET_HEIGHT;
    const scaleX = vizAreaW / sheetWidth;
    const scaleY = vizAreaH / sheetHeight;
    const finalScale = Math.min(scaleX, scaleY);
    
    const drawW = sheetWidth * finalScale;
    const drawH = sheetHeight * finalScale;
    const startX = margin + (vizAreaW - drawW) / 2;
    const startY = margin + headerH + (vizAreaH - drawH) / 2;

    // Draw sheet border
    doc.setDrawColor(0);
    doc.rect(startX, startY, drawW, drawH);

    // Draw planks
    sheetPlanks.forEach(p => {
      const px = startX + p.x * finalScale;
      const py = startY + (sheetHeight - p.y - p.height) * finalScale;
      const pw = p.width * finalScale;
      const ph = p.height * finalScale;

      // Fill plank
      doc.setFillColor(240, 240, 240);
      doc.setDrawColor(50);
      doc.rect(px, py, pw, ph, "FD");

      // Draw ID
      if (pw > 5 && ph > 4) {
        doc.setFontSize(Math.min(8, ph));
        doc.setTextColor(0);
        doc.text(String(p.id), px + pw / 2, py + ph / 2, { align: "center", baseline: "middle" });
      }
    });

    // Table
    const tableTop = pageH - margin - tableH;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Part List (First 15)", margin, tableTop);
    
    let rowY = tableTop + 5;
    doc.setFontSize(8);
    doc.text("ID", margin, rowY);
    doc.text("Name", margin + 15, rowY);
    doc.text("Size (mm)", margin + 70, rowY);
    
    doc.line(margin, rowY + 1, pageW - margin, rowY + 1);
    rowY += 5;
    doc.setFont("helvetica", "normal");
    
    const planksToShow = sheetPlanks.slice(0, 15);
    planksToShow.forEach(p => {
      doc.text(String(p.id), margin, rowY);
      let name = p.name || "";
      if (name.length > 35) name = name.substring(0, 35) + "...";
      doc.text(name, margin + 15, rowY);
      doc.text(`${Math.round(p.width)} x ${Math.round(p.height)}`, margin + 70, rowY);
      rowY += 4;
    });

    // Footer
    doc.setFontSize(8);
    doc.text(`Page ${i + 1} of ${sheetsToRender.length}`, pageW / 2, pageH - 5, { align: "center" });
  }

  const fileName = selectedSheet === 'all' 
    ? `Cutlist_All_Sheets.pdf`
    : `Cutlist_Sheet_${selectedSheet}.pdf`;
  doc.save(fileName);
}

// ============================================
// Components
// ============================================

interface PlankTooltipProps {
  plank: NestResult;
  position: { x: number; y: number };
}

function PlankTooltip({ plank, position }: PlankTooltipProps) {
  const holeCount = plank.holes?.length || 0;
  
  return (
    <div 
      className="fixed z-50 bg-gray-900/95 text-white p-3 rounded-lg shadow-xl max-w-xs border border-gray-700"
      style={{ left: position.x + 15, top: position.y + 15 }}
    >
      <h4 className="text-cyan-400 font-bold text-sm mb-2">
        {plank.id} - {plank.name || "Unnamed"}
      </h4>
      <div className="text-xs space-y-1 border-b border-gray-700 pb-2 mb-2">
        <div><strong>Material:</strong> {plank.material}</div>
        <div><strong>Size:</strong> {plank.width} × {plank.height} mm</div>
        <div><strong>Thickness:</strong> {plank.thickness}mm</div>
        {plank.rotated && <div><strong>Rotated:</strong> Yes</div>}
        <div><strong>Total Features:</strong> {holeCount}</div>
      </div>
      {plank.holes && plank.holes.length > 0 && (
        <div className="text-xs space-y-1">
          {plank.holes.slice(0, 5).map((hole, i) => (
            <div key={i} className="flex justify-between">
              <span>{hole.description || hole.type}</span>
              <span className="text-gray-400">
                {hole.isRectangular 
                  ? `${hole.length}×${hole.width}mm`
                  : `⌀${hole.diameter}mm`}
              </span>
            </div>
          ))}
          {plank.holes.length > 5 && (
            <div className="text-gray-400">+{plank.holes.length - 5} more...</div>
          )}
        </div>
      )}
    </div>
  );
}

interface SheetCanvasProps {
  sheetNum: number;
  planks: NestResult[];
  constants: { SHEET_WIDTH: number; SHEET_HEIGHT: number };
  zoom: number;
  showIds: boolean;
  showDimensions: boolean;
  showHoles: boolean;
  searchTerm: string;
  highlightSearch: boolean;
  onPlankHover: (plank: NestResult | null, position: { x: number; y: number }) => void;
}

function SheetCanvas({
  sheetNum,
  planks,
  constants,
  zoom,
  showIds,
  showDimensions,
  showHoles,
  searchTerm,
  highlightSearch,
  onPlankHover,
}: SheetCanvasProps) {
  const scaledWidth = constants.SHEET_WIDTH * (zoom / 100);
  const scaledHeight = constants.SHEET_HEIGHT * (zoom / 100);
  
  const firstPlank = planks[0];
  let matName = firstPlank?.material || "Sheet";
  matName = matName.replace(/-\s*\d+mm/i, "").trim();
  const thick = firstPlank?.thickness || "";
  const displayTitle = `${matName} ${thick}mm - Sheet ${sheetNum}`;

  const usedArea = planks.reduce((sum, p) => sum + p.width * p.height, 0);
  const totalArea = (constants.SHEET_WIDTH - 20) * (constants.SHEET_HEIGHT - 20);
  const utilization = totalArea > 0 ? ((usedArea / totalArea) * 100).toFixed(1) : "0";

  return (
    <div className="mb-10 bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 px-5 py-4 border-b border-gray-200">
        <div className="text-lg font-medium text-gray-800">{displayTitle}</div>
        <div className="text-sm text-gray-500">
          {planks.length} planks • {utilization}% utilization
        </div>
      </div>

      {/* Canvas */}
      <div 
        className="relative m-5 border-2 border-gray-800 bg-white rounded"
        style={{ width: scaledWidth, height: scaledHeight }}
      >
        {planks.map((plank) => {
          const x = plank.x * (zoom / 100);
          const y = (constants.SHEET_HEIGHT - plank.y - plank.height) * (zoom / 100);
          const width = plank.width * (zoom / 100);
          const height = plank.height * (zoom / 100);

          const isSearchMatch = searchTerm && (
            plank.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (plank.name?.toLowerCase().includes(searchTerm.toLowerCase()))
          );

          return (
            <div
              key={plank.id}
              className="absolute border border-gray-800 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg hover:z-10 transition-shadow"
              style={{
                left: x,
                top: y,
                width,
                height,
                backgroundColor: plank.color || "#9E9E9E",
                boxShadow: isSearchMatch && highlightSearch ? "0 0 0 3px #FF6B6B" : undefined,
                zIndex: isSearchMatch && highlightSearch ? 15 : 1,
              }}
              onMouseEnter={(e) => onPlankHover(plank, { x: e.clientX, y: e.clientY })}
              onMouseMove={(e) => onPlankHover(plank, { x: e.clientX, y: e.clientY })}
              onMouseLeave={() => onPlankHover(null, { x: 0, y: 0 })}
            >
              {showIds && (
                <span className="bg-white/90 px-1 py-0.5 rounded text-[10px] font-bold text-gray-800 z-20">
                  {plank.id}
                </span>
              )}
              {showDimensions && (
                <span className="bg-white/90 px-1 py-0.5 rounded text-[9px] text-gray-600 mt-0.5 z-20">
                  {plank.width}×{plank.height}
                </span>
              )}

              {/* Holes */}
              {showHoles && plank.holes?.map((hole, i) => {
                const holeClass = getHoleTypeClass(hole.type);
                const holeX = hole.x * (zoom / 100);
                const holeY = (plank.height - hole.y - (hole.isRectangular ? (hole.width || 5) : (hole.diameter || 5))) * (zoom / 100);
                
                if (hole.isRectangular) {
                  const holeW = (hole.length || 10) * (zoom / 100);
                  const holeH = (hole.width || 5) * (zoom / 100);
                  return (
                    <div
                      key={i}
                      className={`absolute pointer-events-none z-5 ${
                        holeClass === "hole-groove" 
                          ? "bg-orange-500/50 border-2 border-orange-600" 
                          : "border border-gray-500"
                      }`}
                      style={{ left: holeX, top: holeY, width: holeW, height: holeH }}
                    />
                  );
                } else {
                  const diameter = (hole.diameter || 5) * (zoom / 100);
                  return (
                    <div
                      key={i}
                      className={`absolute rounded-full pointer-events-none z-5 ${
                        holeClass === "hole-vb" 
                          ? "bg-transparent border-2 border-dashed border-red-500"
                          : holeClass === "hole-screw"
                          ? "bg-purple-700/70 border border-purple-800"
                          : "bg-black/70 border border-black"
                      }`}
                      style={{ left: holeX, top: holeY, width: diameter, height: diameter }}
                    />
                  );
                }
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function CutlistVisualization() {
  const {
    data,
    selectedSheet,
    zoom,
    showIds,
    showDimensions,
    showHoles,
    showHoleLabels,
    highlightSearch,
    searchTerm,
    setData,
    setSelectedSheet,
    setZoom,
    setShowIds,
    setShowDimensions,
    setShowHoles,
    setHighlightSearch,
    setSearchTerm,
  } = useCutlistStore();

  const [tooltipData, setTooltipData] = useState<{
    plank: NestResult | null;
    position: { x: number; y: number };
  }>({ plank: null, position: { x: 0, y: 0 } });

  // Load demo data on mount
  useEffect(() => {
    setData(DEMO_CUTLIST_DATA);
  }, [setData]);

  const handlePlankHover = useCallback((plank: NestResult | null, position: { x: number; y: number }) => {
    setTooltipData({ plank, position });
  }, []);

  const handleDownloadCSV = useCallback(() => {
    if (!data) return;
    
    let csvContent = "ID,Material,Width,Height,Thickness,Sheet,X,Y,Rotated\n";
    Object.values(data.planks).flat().forEach(plank => {
      csvContent += `"${plank.id}","${plank.material}",${plank.width},${plank.height},${plank.thickness},${plank.sheetNum},${plank.x},${plank.y},${plank.rotated}\n`;
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "cutlist-data.csv");
    link.click();
  }, [data]);

  const handleDownloadPDF = useCallback(async (allSheets: boolean) => {
    if (!data) return;
    await generatePDF(data, allSheets ? 'all' : selectedSheet, data.clientDetails?.customerName);
  }, [data, selectedSheet]);

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <p className="text-slate-400">Loading cutlist data...</p>
      </div>
    );
  }

  const sheetNumbers = Object.keys(data.planks).map(Number).sort((a, b) => a - b);
  const sheetsToRender = selectedSheet === 'all' 
    ? sheetNumbers 
    : [selectedSheet as number];
  
  const totalPlanks = Object.values(data.planks).flat().length;

  return (
    <div className="flex-1 flex flex-col bg-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-4 flex justify-between items-center shadow-lg">
        <h1 className="text-xl font-light">📐 Cutlist Visualization Dashboard</h1>
        
        <div className="flex gap-2">
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
          >
            📥 Download CSV
          </button>
          <button
            onClick={() => handleDownloadPDF(false)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
          >
            📄 Download PDF
          </button>
          <button
            onClick={() => handleDownloadPDF(true)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
          >
            📚 Download All PDF
          </button>
        </div>

        <div className="flex gap-8 text-sm">
          <div className="text-center">
            <span className="text-xl font-bold block">{data.stats.totalPlanks}</span>
            <span className="text-white/70">Total Planks</span>
          </div>
          <div className="text-center">
            <span className="text-xl font-bold block">{data.stats.totalSheets}</span>
            <span className="text-white/70">Sheets Used</span>
          </div>
          <div className="text-center">
            <span className="text-xl font-bold block">
              {Object.values(data.stats.sheetUtilization).length > 0
                ? (Object.values(data.stats.sheetUtilization).reduce(
                    (sum, s) => sum + parseFloat(s.percentage), 0
                  ) / Object.values(data.stats.sheetUtilization).length).toFixed(1)
                : 0}%
            </span>
            <span className="text-white/70">Overall Utilization</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-gray-200 p-5 overflow-y-auto">
          {/* Sheet Selector */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-600 mb-2">Sheet Selection</label>
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Sheets</option>
              {sheetNumbers.map(num => (
                <option key={num} value={num}>Sheet {num}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-600 mb-2">Search Planks</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter plank ID or name..."
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Zoom */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Zoom: <span className="text-indigo-600 font-bold">{zoom}%</span>
            </label>
            <input
              type="range"
              min={10}
              max={200}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Toggle Options */}
          <div className="space-y-3 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showIds} onChange={(e) => setShowIds(e.target.checked)} className="accent-indigo-500" />
              <span className="text-sm text-gray-700">Show Plank IDs</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showDimensions} onChange={(e) => setShowDimensions(e.target.checked)} className="accent-indigo-500" />
              <span className="text-sm text-gray-700">Show Dimensions</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showHoles} onChange={(e) => setShowHoles(e.target.checked)} className="accent-indigo-500" />
              <span className="text-sm text-gray-700">Show Holes & Features</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={highlightSearch} onChange={(e) => setHighlightSearch(e.target.checked)} className="accent-indigo-500" />
              <span className="text-sm text-gray-700">Highlight Search Results</span>
            </label>
          </div>

          {/* Feature Legend */}
          <div className="p-3 bg-gray-50 rounded-lg mb-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Feature Types</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-800 border border-purple-900" />
                <span>Screw Holes (4mm)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-dashed border-red-500" />
                <span>VB Main Hole (20mm)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <span>VB Double Hole (5mm)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 border border-orange-600" />
                <span>Grooves</span>
              </div>
            </div>
          </div>

          {/* Materials Legend */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Materials</h3>
            {Object.entries(data.stats.materialThicknessStats).map(([key, info]) => (
              <div key={key} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg mb-2">
                <div className="w-5 h-5 rounded border" style={{ backgroundColor: info.color }} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{key}</div>
                  <div className="text-xs text-gray-500">{info.count} planks</div>
                </div>
              </div>
            ))}
          </div>

          {/* Sheet Utilization */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Sheet Utilization</h3>
            {Object.entries(data.stats.sheetUtilization).map(([sheetNum, info]) => (
              <div key={sheetNum} className="p-2 bg-gray-50 rounded-lg mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Sheet {sheetNum}</span>
                  <span className="text-gray-500">{info.percentage}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
                    style={{ width: `${info.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Visualization Area */}
        <main className="flex-1 p-5 overflow-auto bg-slate-50">
          {sheetsToRender.map(sheetNum => (
            <SheetCanvas
              key={sheetNum}
              sheetNum={sheetNum}
              planks={data.planks[sheetNum] || []}
              constants={data.constants}
              zoom={zoom}
              showIds={showIds}
              showDimensions={showDimensions}
              showHoles={showHoles}
              searchTerm={searchTerm}
              highlightSearch={highlightSearch}
              onPlankHover={handlePlankHover}
            />
          ))}
        </main>
      </div>

      {/* Tooltip */}
      {tooltipData.plank && (
        <PlankTooltip plank={tooltipData.plank} position={tooltipData.position} />
      )}
    </div>
  );
}
