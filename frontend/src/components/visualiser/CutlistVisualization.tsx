'use client';

/**
 * Cutlist Visualization Component
 * Redesigned with Orange, White, and Navy Blue color scheme
 *
 * Features:
 * - Interactive sheet visualization with zoom/pan
 * - Level 3 features (holes, grooves, L-cuts) prominently displayed
 * - Plank hover tooltips with detailed info
 * - Sheet selection dropdown
 * - Toggle for IDs, dimensions, holes, hole labels
 * - Search/highlight functionality
 * - Material legend and utilization display
 */
import { useState, useMemo, useCallback, useRef } from 'react';
import { NestResult, SHEET_CONSTANTS } from '@/types/visualiser';
import { CustomerDetails } from '@/stores/designerStore';

// ============================================
// COLOR CONSTANTS
// ============================================

const COLORS = {
  primary: '#F97316',      // Orange-500
  primaryDark: '#EA580C',  // Orange-600
  primaryLight: '#FDBA74', // Orange-300
  white: '#FFFFFF',
  navy: '#1E3A5F',         // Navy blue for text
  navyLight: '#2D4A6F',    // Lighter navy
  navyDark: '#0F2847',     // Darker navy
  background: '#FFF7ED',   // Orange-50
  surface: '#FFFFFF',
  border: '#FED7AA',       // Orange-200
  text: '#1E3A5F',         // Navy for text
  textLight: '#64748B',    // Slate-500
  success: '#22C55E',      // Green-500
  error: '#EF4444',        // Red-500
};

// ============================================
// TYPES
// ============================================

interface CutlistVisualizationProps {
  nestResults: NestResult[];
  customerDetails?: CustomerDetails;
  sheetWidth?: number;
  sheetHeight?: number;
  onDownloadPDF?: (allSheets: boolean) => void;
  onPrintLabels?: () => void;
  onDownloadCSV?: () => void;
  /** Edit mode: show selection and wire click/drag for parent toolbar */
  editMode?: boolean;
  selectedPlankId?: string | null;
  onSelectPlank?: (plankId: string | null) => void;
  onMovePlank?: (plankId: string, newSheetNum: number, newX: number, newY: number) => void;
  onRotate?: (plankId: string) => void;
  onFlip?: (plankId: string, direction: 'horizontal' | 'vertical') => void;
}

interface SheetData {
  sheetNum: number;
  planks: NestResult[];
  utilization: number;
  material: string;
  thickness: number;
}

// L-cut interface for type safety
interface LCutData {
  start: { x: number; y: number };
  center: { x: number; y: number };
  end: { x: number; y: number };
}

// Extend NestResult for L-cuts
interface NestResultWithLCuts extends NestResult {
  l_cuts?: LCutData[];
}

// ============================================
// HOLE TYPE CONFIGURATION
// ============================================

const HOLE_TYPES: Record<string, { label: string; color: string; bgColor: string; borderStyle: string; size: string }> = {
  vb: {
    label: 'VB Main Hole',
    color: '#DC2626',
    bgColor: 'rgba(220, 38, 38, 0.15)',
    borderStyle: 'dashed',
    size: '20mm',
  },
  screw: {
    label: 'Screw Holes',
    color: '#7C3AED',
    bgColor: 'rgba(124, 58, 237, 0.6)',
    borderStyle: 'solid',
    size: '4mm',
  },
  dowel: {
    label: 'Dowel / VB Double',
    color: '#2563EB',
    bgColor: 'rgba(37, 99, 235, 0.6)',
    borderStyle: 'solid',
    size: '5mm',
  },
  groove: {
    label: 'Grooves',
    color: '#F97316',
    bgColor: 'rgba(249, 115, 22, 0.4)',
    borderStyle: 'solid',
    size: 'Variable',
  },
  profile: {
    label: 'Profiles',
    color: '#0891B2',
    bgColor: 'rgba(8, 145, 178, 0.4)',
    borderStyle: 'solid',
    size: 'Variable',
  },
  slot: {
    label: 'Slots',
    color: '#16A34A',
    bgColor: 'rgba(22, 163, 74, 0.4)',
    borderStyle: 'solid',
    size: 'Variable',
  },
  lcut: {
    label: 'L-Cuts (Notches)',
    color: '#DB2777',
    bgColor: 'rgba(219, 39, 119, 0.25)',
    borderStyle: 'solid',
    size: 'Variable',
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#2AB7CA',
  '#F08A5D', '#B22727', '#54A0FF', '#5F27CD', '#FF9F43',
];

function getHoleTypeConfig(holeType: string) {
  const type = (holeType || '').toLowerCase();
  if (type.includes('vb') && !type.includes('double')) return HOLE_TYPES.vb;
  if (type.includes('screw')) return HOLE_TYPES.screw;
  if (type.includes('dowel') || type.includes('double')) return HOLE_TYPES.dowel;
  if (type.includes('groove')) return HOLE_TYPES.groove;
  if (type.includes('profile')) return HOLE_TYPES.profile;
  if (type.includes('slot')) return HOLE_TYPES.slot;
  return { color: '#374151', bgColor: 'rgba(55, 65, 81, 0.6)', borderStyle: 'solid', label: 'Standard', size: '' };
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CutlistVisualization({
  nestResults,
  customerDetails,
  sheetWidth = SHEET_CONSTANTS.SHEET_WIDTH,
  sheetHeight = SHEET_CONSTANTS.SHEET_HEIGHT,
  onDownloadPDF,
  onPrintLabels,
  onDownloadCSV,
  editMode = false,
  selectedPlankId = null,
  onSelectPlank,
  onMovePlank,
  onRotate,
  onFlip,
}: CutlistVisualizationProps) {
  // State
  const [zoom, setZoom] = useState(50);
  const [selectedSheet, setSelectedSheet] = useState<'all' | number>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showIds, setShowIds] = useState(true);
  const [showDimensions, setShowDimensions] = useState(false);
  const [showHoles, setShowHoles] = useState(true);
  const [showHoleLabels, setShowHoleLabels] = useState(false);
  const [highlightSearch, setHighlightSearch] = useState(true);
  
  // Tooltip state
  const [tooltipData, setTooltipData] = useState<NestResult | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ plankId: string; sheetNum: number; startX: number; startY: number; startPlankX: number; startPlankY: number } | null>(null);

  // Group planks by sheet
  const sheetData = useMemo(() => {
    const sheets = new Map<number, NestResult[]>();
    
    nestResults.forEach((plank) => {
      const sheetNum = plank.sheetNum || 1;
      if (!sheets.has(sheetNum)) {
        sheets.set(sheetNum, []);
      }
      sheets.get(sheetNum)!.push(plank);
    });

    // Calculate utilization for each sheet
    const SHEET_AREA = (sheetWidth - 2 * SHEET_CONSTANTS.MARGIN) * (sheetHeight - 2 * SHEET_CONSTANTS.MARGIN);
    
    const result: SheetData[] = [];
    sheets.forEach((planks, sheetNum) => {
      const usedArea = planks.reduce((sum, p) => sum + p.width * p.height, 0);
      const firstPlank = planks[0];
      
      result.push({
        sheetNum,
        planks,
        utilization: (usedArea / SHEET_AREA) * 100,
        material: firstPlank?.material || 'Unknown',
        thickness: firstPlank?.thickness || 18,
      });
    });

    return result.sort((a, b) => a.sheetNum - b.sheetNum);
  }, [nestResults, sheetWidth, sheetHeight]);

  // Material colors
  const materialColors = useMemo(() => {
    const colors = new Map<string, string>();
    let colorIndex = 0;
    
    nestResults.forEach((plank) => {
      const key = `${plank.material}_${plank.thickness}`;
      if (!colors.has(key)) {
        colors.set(key, plank.color || DEFAULT_COLORS[colorIndex % DEFAULT_COLORS.length]);
        colorIndex++;
      }
    });
    
    return colors;
  }, [nestResults]);

  // Material stats
  const materialStats = useMemo(() => {
    const stats = new Map<string, { color: string; count: number }>();
    
    nestResults.forEach((plank) => {
      const key = `${plank.material}_${plank.thickness}mm`;
      const existing = stats.get(key);
      if (existing) {
        existing.count++;
      } else {
        const colorKey = `${plank.material}_${plank.thickness}`;
        stats.set(key, {
          color: materialColors.get(colorKey) || '#9E9E9E',
          count: 1,
        });
      }
    });
    
    return stats;
  }, [nestResults, materialColors]);

  // Filtered sheets for display
  const sheetsToDisplay = useMemo(() => {
    if (selectedSheet === 'all') {
      return sheetData;
    }
    return sheetData.filter((s) => s.sheetNum === selectedSheet);
  }, [sheetData, selectedSheet]);

  // Overall stats
  const overallStats = useMemo(() => {
    const totalUtilization = sheetData.length > 0
      ? sheetData.reduce((sum, s) => sum + s.utilization, 0) / sheetData.length
      : 0;
    
    // Count Level 3 features
    let totalFeatures = 0;
    nestResults.forEach(plank => {
      totalFeatures += plank.holes?.length || 0;
      totalFeatures += (plank as NestResultWithLCuts).l_cuts?.length || 0;
    });
    
    return {
      totalPlanks: nestResults.length,
      totalSheets: sheetData.length,
      overallUtilization: totalUtilization.toFixed(1),
      totalFeatures,
    };
  }, [nestResults, sheetData]);

  // Scale factor for zoom
  const scale = zoom / 100;

  // Handle plank hover
  const handlePlankMouseEnter = useCallback((plank: NestResult, event: React.MouseEvent) => {
    setTooltipData(plank);
    setTooltipPosition({ x: event.clientX + 15, y: event.clientY + 15 });
  }, []);

  const handlePlankMouseMove = useCallback((event: React.MouseEvent) => {
    setTooltipPosition({ x: event.clientX + 15, y: event.clientY + 15 });
  }, []);

  const handlePlankMouseLeave = useCallback(() => {
    setTooltipData(null);
  }, []);

  // Check if plank matches search
  const isSearchMatch = useCallback((plank: NestResult) => {
    if (!searchQuery) return false;
    const query = searchQuery.toLowerCase();
    return (
      plank.id.toLowerCase().includes(query) ||
      plank.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Validate L-cut data: check if points are distinct
  const isLCutDegenerate = (lcut: LCutData): boolean => {
    const EPSILON = 0.1;
    const startEqualsCenter = Math.abs(lcut.start.x - lcut.center.x) < EPSILON && 
                              Math.abs(lcut.start.y - lcut.center.y) < EPSILON;
    const centerEqualsEnd = Math.abs(lcut.center.x - lcut.end.x) < EPSILON && 
                            Math.abs(lcut.center.y - lcut.end.y) < EPSILON;
    return startEqualsCenter || centerEqualsEnd;
  };

  // Render L-cut SVG for a plank
  const renderLCuts = (plank: NestResultWithLCuts, plankW: number, plankH: number) => {
    if (!showHoles || !plank.l_cuts || plank.l_cuts.length === 0) return null;

    return plank.l_cuts.map((lcut, index) => {
      // Check for degenerate data
      if (isLCutDegenerate(lcut)) {
        const warningX = (Math.max(lcut.start.x, lcut.center.x, lcut.end.x) / 2) * scale;
        const warningY = ((plank.height - Math.max(lcut.start.y, lcut.center.y, lcut.end.y)) / 2) * scale;
        return (
          <div
            key={`lcut-warning-${index}`}
            className="absolute z-10 cursor-help rounded px-1.5 py-0.5"
            style={{ 
              left: warningX, 
              top: warningY,
              backgroundColor: 'rgba(249, 115, 22, 0.2)',
              border: `2px dashed ${COLORS.primary}`,
            }}
            title="WARNING: Invalid L-Cut data - points are not distinct. Check SketchUp export."
          >
            <span className="text-base font-bold" style={{ color: COLORS.primary }}>⚠️</span>
          </div>
        );
      }

      // CNC coordinate system: Y increases upward, browser Y increases downward
      const startX = lcut.start.x * scale;
      const startY = (plank.height - lcut.start.y) * scale;
      const centerX = lcut.center.x * scale;
      const centerY = (plank.height - lcut.center.y) * scale;
      const endX = lcut.end.x * scale;
      const endY = (plank.height - lcut.end.y) * scale;

      // Determine cut corner
      const corners = [
        { x: 0, y: 0, name: 'top-left' },
        { x: plankW, y: 0, name: 'top-right' },
        { x: plankW, y: plankH, name: 'bottom-right' },
        { x: 0, y: plankH, name: 'bottom-left' }
      ];
      
      let cutCorner = corners[0];
      let minDist = Infinity;
      corners.forEach(corner => {
        const dist = Math.sqrt(Math.pow(centerX - corner.x, 2) + Math.pow(centerY - corner.y, 2));
        if (dist < minDist) {
          minDist = dist;
          cutCorner = corner;
        }
      });

      const notchPolygon = `${cutCorner.x},${cutCorner.y} ${startX},${startY} ${centerX},${centerY} ${endX},${endY}`;

      return (
        <div
          key={`lcut-${index}`}
          className="absolute pointer-events-none z-10"
          style={{ width: plankW, height: plankH, left: 0, top: 0 }}
        >
          <svg
            className="absolute overflow-visible"
            style={{ width: '100%', height: '100%' }}
            viewBox={`0 0 ${plankW} ${plankH}`}
            preserveAspectRatio="none"
          >
            <polygon
              points={notchPolygon}
              fill={HOLE_TYPES.lcut.bgColor}
              stroke={HOLE_TYPES.lcut.color}
              strokeWidth="2"
            />
            <polyline
              points={`${startX},${startY} ${centerX},${centerY} ${endX},${endY}`}
              fill="none"
              stroke="#9D174D"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {/* Control points */}
          <div
            className="absolute w-2 h-2 rounded-full"
            style={{ left: startX - 4, top: startY - 4, backgroundColor: '#22C55E', border: '1px solid #166534' }}
            title={`L-Cut ${index + 1} Start (${lcut.start.x.toFixed(1)}, ${lcut.start.y.toFixed(1)})`}
          />
          <div
            className="absolute w-2 h-2 rounded-full"
            style={{ left: centerX - 4, top: centerY - 4, backgroundColor: COLORS.primary, border: '1px solid #C2410C' }}
            title={`L-Cut ${index + 1} Center (${lcut.center.x.toFixed(1)}, ${lcut.center.y.toFixed(1)})`}
          />
          <div
            className="absolute w-2 h-2 rounded-full"
            style={{ left: endX - 4, top: endY - 4, backgroundColor: '#EF4444', border: '1px solid #B91C1C' }}
            title={`L-Cut ${index + 1} End (${lcut.end.x.toFixed(1)}, ${lcut.end.y.toFixed(1)})`}
          />
        </div>
      );
    });
  };

  if (nestResults.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg" style={{ backgroundColor: COLORS.background }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primaryLight }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={COLORS.primary}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium" style={{ color: COLORS.navy }}>No Cutlist Data</p>
          <p className="text-sm mt-1" style={{ color: COLORS.textLight }}>Generate files first to see visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: COLORS.background }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: COLORS.primary }}>
        <h2 className="text-xl font-semibold text-white">Cutlist Visualization</h2>
        
        <div className="flex items-center gap-3">
          {onDownloadCSV && (
            <button
              onClick={onDownloadCSV}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md"
              style={{ backgroundColor: COLORS.white, color: COLORS.primary }}
            >
              Download CSV
            </button>
          )}
          {onDownloadPDF && (
            <>
              <button
                onClick={() => onDownloadPDF(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md"
                style={{ backgroundColor: COLORS.white, color: COLORS.primary }}
              >
                Download PDF
              </button>
              <button
                onClick={() => onDownloadPDF(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md"
                style={{ backgroundColor: COLORS.white, color: COLORS.primary }}
              >
                Download All
              </button>
            </>
          )}
          {onPrintLabels && (
            <button
              onClick={onPrintLabels}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md"
              style={{ backgroundColor: COLORS.white, color: COLORS.primary }}
            >
              Print Labels
            </button>
          )}
        </div>

        <div className="flex items-center gap-8 text-sm">
          <div className="text-center">
            <span className="block text-xl font-bold text-white">{overallStats.totalPlanks}</span>
            <span className="text-white/80 text-xs">Total Planks</span>
          </div>
          <div className="text-center">
            <span className="block text-xl font-bold text-white">{overallStats.totalSheets}</span>
            <span className="text-white/80 text-xs">Sheets Used</span>
          </div>
          <div className="text-center">
            <span className="block text-xl font-bold text-white">{overallStats.overallUtilization}%</span>
            <span className="text-white/80 text-xs">Utilization</span>
          </div>
          <div className="text-center">
            <span className="block text-xl font-bold px-3 py-0.5 rounded-lg" style={{ backgroundColor: COLORS.white, color: COLORS.primary }}>
              {overallStats.totalFeatures}
            </span>
            <span className="text-white/80 text-xs">Level 3 Features</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white overflow-y-auto p-5 flex-shrink-0 border-r" style={{ borderColor: COLORS.border }}>
          {/* Controls */}
          <div className="space-y-5 mb-6">
            {/* Sheet Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.navy }}>Sheet Selection</label>
              <select
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: COLORS.border, color: COLORS.navy }}
              >
                <option value="all">All Sheets ({sheetData.length})</option>
                {sheetData.map((sheet) => (
                  <option key={sheet.sheetNum} value={sheet.sheetNum}>
                    Sheet {sheet.sheetNum} - {sheet.material}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.navy }}>Search Planks</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ID or name..."
                  className="w-full px-3 py-2.5 pl-10 border rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: COLORS.border, color: COLORS.navy }}
                />
                <svg className="w-5 h-5 absolute left-3 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Zoom */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium" style={{ color: COLORS.navy }}>Zoom</label>
                <span className="text-sm font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: COLORS.primaryLight, color: COLORS.primaryDark }}>
                  {zoom}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={200}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ 
                  background: `linear-gradient(to right, ${COLORS.primary} 0%, ${COLORS.primary} ${(zoom - 10) / 1.9}%, #E5E7EB ${(zoom - 10) / 1.9}%, #E5E7EB 100%)` 
                }}
              />
            </div>

            {/* Toggle Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium" style={{ color: COLORS.navy }}>Display Options</h3>
              <ToggleOption checked={showIds} onChange={setShowIds} label="Show Plank IDs" />
              <ToggleOption checked={showDimensions} onChange={setShowDimensions} label="Show Dimensions" />
              <ToggleOption checked={showHoles} onChange={setShowHoles} label="Show Level 3 Features" highlight />
              <ToggleOption checked={showHoleLabels} onChange={setShowHoleLabels} label="Show Feature Labels" />
              <ToggleOption checked={highlightSearch} onChange={setHighlightSearch} label="Highlight Search" />
            </div>
          </div>

          {/* Feature Types Legend */}
          <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: COLORS.background }}>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: COLORS.navy }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.primary }}></span>
              Level 3 Feature Types
            </h4>
            <div className="space-y-2 text-xs">
              {Object.entries(HOLE_TYPES).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border-2"
                    style={{ 
                      backgroundColor: config.bgColor, 
                      borderColor: config.color,
                      borderStyle: config.borderStyle,
                    }}
                  />
                  <span className="flex-1" style={{ color: COLORS.navy }}>{config.label}</span>
                  <span className="text-gray-400">{config.size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Materials Legend */}
          <div className="mb-6">
            <h4 className="font-semibold text-sm mb-3" style={{ color: COLORS.navy }}>Materials</h4>
            <div className="space-y-2">
              {Array.from(materialStats.entries()).map(([key, stats]) => (
                <div key={key} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: COLORS.background }}>
                  <div
                    className="w-5 h-5 rounded border"
                    style={{ backgroundColor: stats.color, borderColor: COLORS.border }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: COLORS.navy }}>{key}</p>
                    <p className="text-xs" style={{ color: COLORS.textLight }}>{stats.count} planks</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sheet Utilization */}
          <div>
            <h4 className="font-semibold text-sm mb-3" style={{ color: COLORS.navy }}>Sheet Utilization</h4>
            <div className="space-y-2">
              {sheetData.map((sheet) => (
                <div 
                  key={sheet.sheetNum} 
                  className="p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md"
                  style={{ 
                    borderColor: selectedSheet === sheet.sheetNum ? COLORS.primary : COLORS.border,
                    backgroundColor: selectedSheet === sheet.sheetNum ? COLORS.background : COLORS.white,
                  }}
                  onClick={() => setSelectedSheet(sheet.sheetNum)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium" style={{ color: COLORS.navy }}>Sheet {sheet.sheetNum}</span>
                    <span className="text-sm font-semibold" style={{ color: COLORS.primary }}>{sheet.utilization.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E7EB' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${sheet.utilization}%`,
                        background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
                      }}
                    />
                  </div>
                  <div className="text-xs mt-1" style={{ color: COLORS.textLight }}>
                    {sheet.planks.length} planks
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Visualization Area */}
        <div ref={containerRef} className="flex-1 overflow-auto p-6" style={{ backgroundColor: '#F8FAFC' }}>
          {sheetsToDisplay.map((sheet) => (
            <div key={sheet.sheetNum} className="mb-8 bg-white rounded-2xl shadow-lg overflow-hidden border" style={{ borderColor: COLORS.border }}>
              {/* Sheet Header */}
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: COLORS.navy }}>
                    {sheet.material.replace(/\s*\([^)]+\)/g, '').replace(/-\s*\d+mm/i, '').trim()} {sheet.thickness}mm - Sheet {sheet.sheetNum}
                  </h3>
                  <p className="text-sm" style={{ color: COLORS.textLight }}>
                    {sheet.planks.length} planks • {sheet.utilization.toFixed(1)}% utilization
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: COLORS.white }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.primary }}></span>
                  <span className="text-sm font-medium" style={{ color: COLORS.navy }}>
                    {sheet.planks.reduce((sum, p) => sum + (p.holes?.length || 0) + ((p as NestResultWithLCuts).l_cuts?.length || 0), 0)} Features
                  </span>
                </div>
              </div>

              {/* Sheet Canvas */}
              <div className="p-6">
                <div
                  className="relative border-2 rounded-lg mx-auto"
                  style={{
                    width: sheetWidth * scale,
                    height: sheetHeight * scale,
                    borderColor: COLORS.navy,
                    backgroundColor: COLORS.white,
                  }}
                >
                  {/* Planks */}
                  {sheet.planks.map((plank) => {
                    const isMatch = isSearchMatch(plank);
                    const colorKey = `${plank.material}_${plank.thickness}`;
                    const plankColor = materialColors.get(colorKey) || plank.color || '#9E9E9E';

                    // CNC origin is bottom-left, browser Y is top-down
                    const x = plank.x * scale;
                    const y = (sheetHeight - plank.y - plank.height) * scale;
                    const w = plank.width * scale;
                    const h = plank.height * scale;

                    const hasFeatures = (plank.holes && plank.holes.length > 0) || ((plank as NestResultWithLCuts).l_cuts && (plank as NestResultWithLCuts).l_cuts!.length > 0);
                    const isSelected = editMode && selectedPlankId === plank.id;

                    const handlePlankClick = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (editMode && onSelectPlank) onSelectPlank(plank.id);
                    };

                    const handlePointerDown = (e: React.PointerEvent) => {
                      if (!editMode || !onMovePlank) return;
                      e.currentTarget.setPointerCapture(e.pointerId);
                      dragStateRef.current = {
                        plankId: plank.id,
                        sheetNum: sheet.sheetNum,
                        startX: e.clientX,
                        startY: e.clientY,
                        startPlankX: plank.x,
                        startPlankY: plank.y,
                      };
                    };
                    const handlePointerUp = (e: React.PointerEvent) => {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                      const state = dragStateRef.current;
                      dragStateRef.current = null;
                      if (state && state.plankId === plank.id && onMovePlank) {
                        const dx = (e.clientX - state.startX) / scale;
                        const dy = -(e.clientY - state.startY) / scale;
                        const newX = Math.max(0, Math.min(sheetWidth - plank.width, state.startPlankX + dx));
                        const newY = Math.max(0, Math.min(sheetHeight - plank.height, state.startPlankY + dy));
                        if (Math.abs(newX - plank.x) > 0.5 || Math.abs(newY - plank.y) > 0.5) {
                          onMovePlank(plank.id, sheet.sheetNum, newX, newY);
                        }
                      }
                    };

                    return (
                      <div
                        key={plank.id}
                        className={`absolute border flex flex-col items-center justify-center transition-all hover:z-10 hover:shadow-xl ${
                          editMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                        } ${(isMatch && highlightSearch) || isSelected ? 'ring-4 z-20' : ''} ${hasFeatures && showHoles ? 'ring-1' : ''}`}
                        style={{
                          left: x,
                          top: y,
                          width: w,
                          height: h,
                          backgroundColor: plankColor,
                          borderColor: isSelected ? COLORS.primary : COLORS.navyDark,
                          borderWidth: isSelected ? 3 : 1,
                          ringColor: (isMatch && highlightSearch) || isSelected ? COLORS.primary : hasFeatures ? COLORS.primaryLight : 'transparent',
                        } as React.CSSProperties & { ringColor?: string }}
                        onMouseEnter={(e) => !editMode && handlePlankMouseEnter(plank, e)}
                        onMouseMove={handlePlankMouseMove}
                        onMouseLeave={handlePlankMouseLeave}
                        onClick={handlePlankClick}
                        onPointerDown={editMode && onMovePlank ? handlePointerDown : undefined}
                        onPointerUp={editMode && onMovePlank ? handlePointerUp : undefined}
                        onPointerCancel={editMode && onMovePlank ? handlePointerUp : undefined}
                      >
                        {showIds && w > 25 && h > 20 && (
                          <span 
                            className="px-1.5 py-0.5 rounded text-[8px] font-bold shadow-sm"
                            style={{ backgroundColor: COLORS.white, color: COLORS.navy }}
                          >
                            {plank.id}
                          </span>
                        )}
                        {showDimensions && w > 50 && h > 35 && (
                          <span 
                            className="px-1 rounded text-[7px] mt-0.5"
                            style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: COLORS.textLight }}
                          >
                            {plank.width.toFixed(0)}×{plank.height.toFixed(0)}
                          </span>
                        )}

                        {/* Holes */}
                        {showHoles && plank.holes && plank.holes.map((hole, holeIndex) => {
                          const config = getHoleTypeConfig(hole.type || hole.description);
                          
                          if (hole.isRectangular) {
                            const holeW = (hole.width || 10) * scale;
                            const holeH = (hole.length || 5) * scale;
                            const holeX = hole.x * scale;
                            const holeY = (plank.height - hole.y - (hole.length || 5)) * scale;

                            return (
                              <div
                                key={holeIndex}
                                className="absolute rounded"
                                style={{
                                  left: holeX,
                                  top: holeY,
                                  width: holeW,
                                  height: holeH,
                                  backgroundColor: config.bgColor,
                                  borderWidth: 2,
                                  borderStyle: config.borderStyle as 'solid' | 'dashed',
                                  borderColor: config.color,
                                }}
                              >
                                {showHoleLabels && holeW > 15 && (
                                  <span 
                                    className="absolute -top-4 left-0 text-[8px] whitespace-nowrap px-1 rounded"
                                    style={{ backgroundColor: config.color, color: 'white' }}
                                  >
                                    {hole.description || hole.type}
                                  </span>
                                )}
                              </div>
                            );
                          } else {
                            const diameter = (hole.diameter || 5) * scale;
                            const holeX = hole.x * scale;
                            const holeY = (plank.height - hole.y - (hole.diameter || 5)) * scale;

                            return (
                              <div
                                key={holeIndex}
                                className="absolute rounded-full"
                                style={{
                                  left: holeX,
                                  top: holeY,
                                  width: diameter,
                                  height: diameter,
                                  backgroundColor: config.bgColor,
                                  borderWidth: hole.type?.toLowerCase().includes('vb') ? 2 : 1,
                                  borderStyle: config.borderStyle as 'solid' | 'dashed',
                                  borderColor: config.color,
                                }}
                              >
                                {showHoleLabels && diameter > 15 && (
                                  <span 
                                    className="absolute -top-4 left-0 text-[8px] whitespace-nowrap px-1 rounded"
                                    style={{ backgroundColor: config.color, color: 'white' }}
                                  >
                                    {hole.description || hole.type}
                                  </span>
                                )}
                              </div>
                            );
                          }
                        })}

                        {/* L-Cuts */}
                        {renderLCuts(plank as NestResultWithLCuts, w, h)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltipData && (
        <PlankTooltip 
          plank={tooltipData as NestResultWithLCuts} 
          position={tooltipPosition}
          isLCutDegenerate={isLCutDegenerate}
        />
      )}
    </div>
  );
}

// ============================================
// TOGGLE OPTION COMPONENT
// ============================================

const ToggleOption: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; highlight?: boolean }> = ({ 
  checked, 
  onChange, 
  label, 
  highlight 
}) => (
  <label className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors ${highlight ? 'border' : ''}`}
    style={{ 
      backgroundColor: highlight && checked ? COLORS.background : 'transparent',
      borderColor: highlight ? COLORS.primary : 'transparent',
    }}
  >
    <div className="relative">
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div 
        className="w-10 h-5 rounded-full transition-colors"
        style={{ backgroundColor: checked ? COLORS.primary : '#E5E7EB' }}
      />
      <div 
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </div>
    <span className={`text-sm ${highlight ? 'font-medium' : ''}`} style={{ color: COLORS.navy }}>
      {label}
    </span>
  </label>
);

// ============================================
// PLANK TOOLTIP COMPONENT
// ============================================

interface PlankTooltipProps {
  plank: NestResultWithLCuts;
  position: { x: number; y: number };
  isLCutDegenerate: (lcut: LCutData) => boolean;
}

const PlankTooltip: React.FC<PlankTooltipProps> = ({ plank, position, isLCutDegenerate }) => {
  const holeCount = plank.holes?.length || 0;
  const lcutCount = plank.l_cuts?.length || 0;

  // Group holes by type
  const holeSummary: Record<string, number> = {};
  if (plank.holes) {
    plank.holes.forEach(hole => {
      const type = hole.description || hole.type || 'unknown';
      holeSummary[type] = (holeSummary[type] || 0) + 1;
    });
  }

  return (
    <div
      className="fixed z-50 max-w-sm rounded-xl shadow-2xl overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        backgroundColor: COLORS.navyDark,
        border: `1px solid ${COLORS.navy}`,
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: COLORS.navy, backgroundColor: COLORS.navy }}>
        <h4 className="font-bold text-white flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: COLORS.primary }}>
            {plank.id}
          </span>
          {plank.name || 'Unnamed'}
        </h4>
      </div>

      {/* Details */}
      <div className="px-4 py-3 text-sm space-y-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-gray-400">Material</span>
          <span className="text-white font-medium">{plank.material}</span>
          
          <span className="text-gray-400">Size</span>
          <span className="text-white font-medium">{plank.width.toFixed(0)} × {plank.height.toFixed(0)} mm</span>
          
          <span className="text-gray-400">Thickness</span>
          <span className="text-white font-medium">{plank.thickness}mm</span>
          
          {plank.rotated && (
            <>
              <span className="text-gray-400">Rotated</span>
              <span className="text-white font-medium">Yes</span>
            </>
          )}
        </div>

        {/* Level 3 Features */}
        <div className="pt-2 border-t" style={{ borderColor: COLORS.navy }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: COLORS.primaryLight }}>
              Level 3 Features
            </span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: COLORS.primary, color: 'white' }}>
              {holeCount + lcutCount} total
            </span>
          </div>
          
          {Object.entries(holeSummary).length > 0 ? (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {Object.entries(holeSummary).map(([type, count]) => {
                const config = getHoleTypeConfig(type);
                return (
                  <div key={type} className="flex justify-between items-center text-xs py-0.5">
                    <span className="flex items-center gap-1.5 text-white">
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      {type}
                    </span>
                    <span className="text-gray-400">{count}×</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-500 text-xs italic">No holes</div>
          )}
        </div>

        {/* L-Cut Info */}
        {plank.l_cuts && plank.l_cuts.length > 0 && (
          <div className="pt-2 border-t" style={{ borderColor: COLORS.navy }}>
            <span className="text-xs font-semibold" style={{ color: HOLE_TYPES.lcut.color }}>
              L-Cuts: {plank.l_cuts.length}
            </span>
            {plank.l_cuts.map((lc, i) => {
              const degenerate = isLCutDegenerate(lc);
              return (
                <div 
                  key={i} 
                  className={`text-[10px] mt-1 ${degenerate ? 'p-1 rounded' : ''}`}
                  style={{ backgroundColor: degenerate ? 'rgba(249, 115, 22, 0.2)' : 'transparent' }}
                >
                  {degenerate && (
                    <div className="font-bold mb-0.5" style={{ color: COLORS.primary }}>
                      ⚠ Invalid: Points not distinct
                    </div>
                  )}
                  <span className="text-gray-400">
                    <span className="text-green-400">S:</span>({lc.start.x.toFixed(0)},{lc.start.y.toFixed(0)})
                    {' → '}
                    <span style={{ color: COLORS.primary }}>C:</span>({lc.center.x.toFixed(0)},{lc.center.y.toFixed(0)})
                    {' → '}
                    <span className="text-red-400">E:</span>({lc.end.x.toFixed(0)},{lc.end.y.toFixed(0)})
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CutlistVisualization;
