'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDesignerStore, useDesignSummary } from '@/stores/designerStore';
import {
  formatDesignData,
  generatePlankList,
  runNesting,
  nestResultsToCSV,
} from '@/lib/visualiser';
import { SheetLayout, NestResult, SHEET_CONSTANTS } from '@/types/visualiser';

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
// INTERFACES
// ============================================

interface HoleData {
  x: number;
  y: number;
  type: string;
  isRectangular: boolean;
  description: string;
  diameter?: number;
  width?: number;
  length?: number;
}

interface LCutData {
  start: { x: number; y: number };
  center: { x: number; y: number };
  end: { x: number; y: number };
}

interface PlankWithFeatures extends Omit<NestResult, 'originalWidth' | 'originalHeight'> {
  l_cuts?: LCutData[];
  originalWidth?: number;
  originalHeight?: number;
}

// ============================================
// HOLE TYPE CONFIGURATION
// ============================================

const HOLE_TYPES = {
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

function getCleanMaterial(material: string): string {
  if (!material) return 'Sheet';
  return String(material).replace(/\s*\([^)]+\)/g, '').replace(/-\s*\d+mm/i, '').trim();
}

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

export default function CutlistPage() {
  const router = useRouter();
  const summary = useDesignSummary();
  const { walls, customerDetails } = useDesignerStore();

  // View State
  const [selectedSheet, setSelectedSheet] = useState<string>('all');
  const [highlightedPlank, setHighlightedPlank] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<PlankWithFeatures | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Display Options
  const [zoom, setZoom] = useState(50);
  const [showIds, setShowIds] = useState(true);
  const [showDimensions, setShowDimensions] = useState(false);
  const [showHoles, setShowHoles] = useState(true);
  const [showHoleLabels, setShowHoleLabels] = useState(false);
  const [highlightSearch, setHighlightSearch] = useState(true);

  // Generate nesting data
  const { sheetLayouts, nestResults, totalSummary, materialSheetMap } = useMemo(() => {
    if (walls.length === 0) {
      return { sheetLayouts: [], nestResults: [], totalSummary: null, materialSheetMap: new Map() };
    }

    const { data: formattedData } = formatDesignData(walls);
    const { plankList } = generatePlankList(formattedData);
    const { results, sheetLayouts, summary: nestingSummary } = runNesting(plankList);

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

    return {
      sheetLayouts,
      nestResults: results,
      totalSummary: nestingSummary,
      materialSheetMap,
    };
  }, [walls]);

  // Redirect if no design
  useEffect(() => {
    if (summary.totalBoxes === 0) {
      router.push('/visualiser/designer');
    }
  }, [summary, router]);

  // Get material sheet number
  const getMaterialSheetNumber = useCallback((sheetNum: number, material: string): number => {
    const cleanMat = getCleanMaterial(material);
    return materialSheetMap.get(cleanMat)?.get(sheetNum) || 1;
  }, [materialSheetMap]);

  // Get display title for sheet
  const getSheetDisplayTitle = useCallback((sheetNum: number): string => {
    const sheet = sheetLayouts[sheetNum - 1];
    if (!sheet || sheet.planks.length === 0) return `Sheet ${sheetNum}`;
    const material = getCleanMaterial(sheet.planks[0].material);
    const matNum = getMaterialSheetNumber(sheetNum, sheet.planks[0].material);
    return `${material} Sheet ${matNum}`;
  }, [sheetLayouts, getMaterialSheetNumber]);

  // Download handlers
  const handleDownloadCSV = () => {
    const csv = nestResultsToCSV(nestResults);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cutlist_${customerDetails?.customerName || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Tooltip handler
  const handlePlankHover = useCallback((plank: PlankWithFeatures | null, e?: React.MouseEvent) => {
    if (plank && e) {
      setTooltipData(plank);
      setTooltipPos({ x: e.pageX + 15, y: e.pageY + 15 });
      setHighlightedPlank(plank.id);
    } else {
      setTooltipData(null);
      setHighlightedPlank(null);
    }
  }, []);

  // Count total Level 3 features
  const totalFeatures = useMemo(() => {
    let holes = 0;
    let lcuts = 0;
    nestResults.forEach(plank => {
      holes += plank.holes?.length || 0;
      lcuts += (plank as PlankWithFeatures).l_cuts?.length || 0;
    });
    return { holes, lcuts, total: holes + lcuts };
  }, [nestResults]);

  if (sheetLayouts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primaryLight }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={COLORS.primary}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: COLORS.navy }}>No Design Data</h2>
          <p className="text-gray-500 mb-4">Create a design first to generate cutlist</p>
          <Link 
            href="/visualiser/designer" 
            className="inline-flex items-center px-6 py-3 rounded-lg text-white font-medium transition-colors"
            style={{ backgroundColor: COLORS.primary }}
          >
            Go to Designer
          </Link>
        </div>
      </div>
    );
  }

  // Filter sheets based on selection
  const sheetsToRender = selectedSheet === 'all' 
    ? sheetLayouts.map((s, i) => ({ sheet: s, num: i + 1 }))
    : [{ sheet: sheetLayouts[parseInt(selectedSheet) - 1], num: parseInt(selectedSheet) }].filter(s => s.sheet);

  const effectiveZoom = zoom / 100;

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      {/* Tooltip */}
      {tooltipData && (
        <PlankTooltip plank={tooltipData} position={tooltipPos} />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 shadow-md" style={{ backgroundColor: COLORS.primary }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left - Title & Back */}
            <div className="flex items-center gap-4">
              <Link 
                href="/visualiser/generate" 
                className="p-2 rounded-lg transition-colors hover:bg-white/20"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-white">Cutlist Visualization</h1>
                {customerDetails?.customerName && (
                  <p className="text-sm text-white/80">{customerDetails.customerName}</p>
                )}
              </div>
            </div>

            {/* Center - Stats */}
            <div className="flex gap-8">
              <StatCard label="Total Planks" value={nestResults.length} />
              <StatCard label="Sheets Used" value={sheetLayouts.length} />
              <StatCard label="Utilization" value={`${totalSummary?.averageUtilization?.toFixed(1) || 0}%`} />
              <StatCard label="Level 3 Features" value={totalFeatures.total} highlight />
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              <ActionButton onClick={handleDownloadCSV} icon="download">
                CSV
              </ActionButton>
              <ActionButton onClick={() => router.push('/visualiser/reports/cutlist/pdf')} icon="pdf">
                PDF
              </ActionButton>
              <ActionButton onClick={() => router.push('/visualiser/reports/cutlist/labels')} icon="label">
                Labels
              </ActionButton>
            </div>
          </div>
        </div>
      </header>

      <div className="flex" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r overflow-y-auto" style={{ borderColor: COLORS.border }}>
          <div className="p-5 space-y-6">
            {/* Sheet Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.navy }}>
                Sheet Selection
              </label>
              <select 
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(e.target.value)}
                className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: COLORS.border, 
                  color: COLORS.navy,
                  '--tw-ring-color': COLORS.primary 
                } as React.CSSProperties}
              >
                <option value="all">All Sheets ({sheetLayouts.length})</option>
                {sheetLayouts.map((_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {getSheetDisplayTitle(index + 1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.navy }}>
                Search Planks
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                  placeholder="ID or name..."
                  className="w-full p-3 pl-10 border rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: COLORS.border, color: COLORS.navy }}
                />
                <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                min="10"
                max="200"
                value={zoom}
                onChange={(e) => setZoom(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ 
                  background: `linear-gradient(to right, ${COLORS.primary} 0%, ${COLORS.primary} ${(zoom - 10) / 1.9}%, #E5E7EB ${(zoom - 10) / 1.9}%, #E5E7EB 100%)` 
                }}
              />
            </div>

            {/* Display Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium" style={{ color: COLORS.navy }}>Display Options</h3>
              <ToggleOption checked={showIds} onChange={setShowIds} label="Show Plank IDs" />
              <ToggleOption checked={showDimensions} onChange={setShowDimensions} label="Show Dimensions" />
              <ToggleOption checked={showHoles} onChange={setShowHoles} label="Show Level 3 Features" highlight />
              <ToggleOption checked={showHoleLabels} onChange={setShowHoleLabels} label="Show Feature Labels" />
              <ToggleOption checked={highlightSearch} onChange={setHighlightSearch} label="Highlight Search" />
            </div>

            {/* Feature Types Legend */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.background }}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: COLORS.navy }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.primary }}></span>
                Level 3 Feature Types
              </h3>
              <div className="space-y-2">
                {Object.entries(HOLE_TYPES).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
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

            {/* Sheet Utilization */}
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.navy }}>Sheet Utilization</h3>
              <div className="space-y-2">
                {sheetLayouts.map((sheet, index) => (
                  <div 
                    key={index} 
                    className="p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md"
                    style={{ 
                      borderColor: selectedSheet === String(index + 1) ? COLORS.primary : COLORS.border,
                      backgroundColor: selectedSheet === String(index + 1) ? COLORS.background : COLORS.white,
                    }}
                    onClick={() => setSelectedSheet(String(index + 1))}
                  >
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium" style={{ color: COLORS.navy }}>
                        {getSheetDisplayTitle(index + 1)}
                      </span>
                      <span className="font-semibold" style={{ color: COLORS.primary }}>
                        {sheet.utilization.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${sheet.utilization}%`,
                          background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {sheet.planks.length} planks • {sheet.planks.reduce((sum, p) => sum + (p.holes?.length || 0), 0)} features
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Visualization Area */}
        <main className="flex-1 p-6 overflow-auto">
          {sheetsToRender.map(({ sheet, num }) => (
            <SheetCanvas
              key={num}
              sheet={sheet}
              sheetNum={num}
              displayTitle={getSheetDisplayTitle(num)}
              zoom={effectiveZoom}
              showIds={showIds}
              showDimensions={showDimensions}
              showHoles={showHoles}
              showHoleLabels={showHoleLabels}
              searchTerm={searchTerm}
              highlightSearch={highlightSearch}
              highlightedPlank={highlightedPlank}
              onPlankHover={handlePlankHover}
            />
          ))}
        </main>
      </div>
    </div>
  );
}

// ============================================
// STAT CARD COMPONENT
// ============================================

const StatCard: React.FC<{ label: string; value: string | number; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className="text-center">
    <span 
      className={`text-xl font-bold block ${highlight ? 'px-3 py-0.5 rounded-lg' : ''}`}
      style={{ 
        color: highlight ? COLORS.primary : COLORS.white,
        backgroundColor: highlight ? COLORS.white : 'transparent',
      }}
    >
      {value}
    </span>
    <span className="text-xs text-white/80">{label}</span>
  </div>
);

// ============================================
// ACTION BUTTON COMPONENT
// ============================================

const ActionButton: React.FC<{ onClick: () => void; icon: string; children: React.ReactNode }> = ({ onClick, icon, children }) => {
  const icons: Record<string, React.ReactNode> = {
    download: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
    pdf: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
    label: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />,
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md"
      style={{ backgroundColor: COLORS.white, color: COLORS.primary }}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {icons[icon]}
      </svg>
      {children}
    </button>
  );
};

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
// SHEET CANVAS COMPONENT
// ============================================

interface SheetCanvasProps {
  sheet: SheetLayout;
  sheetNum: number;
  displayTitle: string;
  zoom: number;
  showIds: boolean;
  showDimensions: boolean;
  showHoles: boolean;
  showHoleLabels: boolean;
  searchTerm: string;
  highlightSearch: boolean;
  highlightedPlank: string | null;
  onPlankHover: (plank: PlankWithFeatures | null, e?: React.MouseEvent) => void;
}

const SheetCanvas: React.FC<SheetCanvasProps> = ({
  sheet,
  sheetNum,
  displayTitle,
  zoom,
  showIds,
  showDimensions,
  showHoles,
  showHoleLabels,
  searchTerm,
  highlightSearch,
  highlightedPlank,
  onPlankHover,
}) => {
  const sheetWidth = SHEET_CONSTANTS.SHEET_WIDTH;
  const sheetHeight = SHEET_CONSTANTS.SHEET_HEIGHT;
  const scaledWidth = sheetWidth * zoom;
  const scaledHeight = sheetHeight * zoom;

  // Filter planks by search
  const filteredPlanks = searchTerm
    ? sheet.planks.filter(p => 
        p.id.toLowerCase().includes(searchTerm) || 
        p.name.toLowerCase().includes(searchTerm)
      )
    : sheet.planks;

  // Count features on this sheet
  const featureCount = sheet.planks.reduce((sum, p) => {
    const holes = p.holes?.length || 0;
    const lcuts = (p as PlankWithFeatures).l_cuts?.length || 0;
    return sum + holes + lcuts;
  }, 0);

  return (
    <div className="mb-8 bg-white rounded-2xl shadow-lg overflow-hidden border" style={{ borderColor: COLORS.border }}>
      {/* Sheet Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: COLORS.navy }}>{displayTitle}</h2>
          <p className="text-sm text-gray-500">
            {sheet.planks.length} planks • {sheet.utilization.toFixed(1)}% utilization
            {searchTerm && ` • Showing ${filteredPlanks.length} of ${sheet.planks.length}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: COLORS.white }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.primary }}></span>
            <span className="text-sm font-medium" style={{ color: COLORS.navy }}>
              {featureCount} Level 3 Features
            </span>
          </div>
        </div>
      </div>

      {/* Sheet Canvas */}
      <div className="p-6 overflow-auto" style={{ backgroundColor: '#F8FAFC' }}>
        <div 
          className="relative border-2 rounded-lg mx-auto"
          style={{ 
            width: scaledWidth, 
            height: scaledHeight,
            borderColor: COLORS.navy,
            backgroundColor: COLORS.white,
          }}
        >
          {filteredPlanks.map(plank => (
            <PlankElement
              key={plank.id}
              plank={plank as PlankWithFeatures}
              sheetHeight={sheetHeight}
              zoom={zoom}
              showIds={showIds}
              showDimensions={showDimensions}
              showHoles={showHoles}
              showHoleLabels={showHoleLabels}
              searchTerm={searchTerm}
              highlightSearch={highlightSearch}
              isHighlighted={highlightedPlank === plank.id}
              onHover={onPlankHover}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// PLANK ELEMENT COMPONENT
// ============================================

interface PlankElementProps {
  plank: PlankWithFeatures;
  sheetHeight: number;
  zoom: number;
  showIds: boolean;
  showDimensions: boolean;
  showHoles: boolean;
  showHoleLabels: boolean;
  searchTerm: string;
  highlightSearch: boolean;
  isHighlighted: boolean;
  onHover: (plank: PlankWithFeatures | null, e?: React.MouseEvent) => void;
}

const PlankElement: React.FC<PlankElementProps> = ({
  plank,
  sheetHeight,
  zoom,
  showIds,
  showDimensions,
  showHoles,
  showHoleLabels,
  searchTerm,
  highlightSearch,
  isHighlighted,
  onHover,
}) => {
  const x = plank.x * zoom;
  // CNC Y-FLIP: Origin is bottom-left in CNC, top-left in browser
  const y = (sheetHeight - plank.y - plank.height) * zoom;
  const width = plank.width * zoom;
  const height = plank.height * zoom;

  const isSearchMatch = searchTerm && (
    plank.id.toLowerCase().includes(searchTerm) ||
    plank.name.toLowerCase().includes(searchTerm)
  );

  const hasFeatures = (plank.holes && plank.holes.length > 0) || (plank.l_cuts && plank.l_cuts.length > 0);

  return (
    <div
      className={`absolute border flex flex-col items-center justify-center cursor-pointer transition-all hover:z-30 hover:shadow-xl ${
        (isSearchMatch && highlightSearch) || isHighlighted ? 'ring-4 z-20' : ''
      } ${hasFeatures && showHoles ? 'ring-1' : ''}`}
      style={{
        left: x,
        top: y,
        width,
        height,
        backgroundColor: plank.color || '#9E9E9E',
        borderColor: COLORS.navyDark,
        borderWidth: 1,
        ringColor: (isSearchMatch && highlightSearch) || isHighlighted ? COLORS.primary : hasFeatures ? COLORS.primaryLight : 'transparent',
      } as React.CSSProperties & { ringColor?: string }}
      onMouseEnter={(e) => onHover(plank, e)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Plank ID */}
      {showIds && width > 25 && height > 20 && (
        <div 
          className="px-1.5 py-0.5 rounded text-xs font-bold z-10 shadow-sm"
          style={{ backgroundColor: COLORS.white, color: COLORS.navy }}
        >
          {plank.id}
        </div>
      )}
      
      {/* Dimensions */}
      {showDimensions && width > 50 && height > 35 && (
        <div 
          className="px-1 rounded text-[10px] mt-0.5 z-10"
          style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: COLORS.textLight }}
        >
          {plank.width.toFixed(0)}×{plank.height.toFixed(0)}
        </div>
      )}

      {/* Holes (Level 3) */}
      {showHoles && plank.holes && plank.holes.map((hole, idx) => (
        <HoleElement
          key={idx}
          hole={hole}
          plankHeight={plank.height}
          zoom={zoom}
          showLabel={showHoleLabels}
        />
      ))}

      {/* L-Cuts (Level 3) */}
      {showHoles && plank.l_cuts?.map((lcut, idx) => (
        <LCutElement
          key={`lcut-${idx}`}
          lcut={lcut}
          plankWidth={plank.width}
          plankHeight={plank.height}
          zoom={zoom}
          index={idx}
        />
      ))}
    </div>
  );
};

// ============================================
// HOLE ELEMENT COMPONENT
// ============================================

interface HoleElementProps {
  hole: HoleData;
  plankHeight: number;
  zoom: number;
  showLabel: boolean;
}

const HoleElement: React.FC<HoleElementProps> = ({ hole, plankHeight, zoom, showLabel }) => {
  const config = getHoleTypeConfig(hole.description || hole.type);
  
  // CNC Y-FLIP inside plank: hole.y is from bottom
  const rawW = hole.isRectangular ? (hole.length || 10) : (hole.diameter || 5);
  const rawH = hole.isRectangular ? (hole.width || 5) : (hole.diameter || 5);
  
  const hX = hole.x * zoom;
  const hY = (plankHeight - hole.y - rawH) * zoom;
  const hW = rawW * zoom;
  const hH = rawH * zoom;

  return (
    <div
      className={`absolute pointer-events-none z-10 ${hole.isRectangular ? 'rounded' : 'rounded-full'}`}
      style={{
        left: hX,
        top: hY,
        width: hW,
        height: hH,
        backgroundColor: config.bgColor,
        borderWidth: 2,
        borderStyle: config.borderStyle as 'solid' | 'dashed',
        borderColor: config.color,
      }}
    >
      {showLabel && hW > 15 && (
        <span 
          className="absolute -top-4 left-0 text-[8px] whitespace-nowrap px-1 rounded"
          style={{ backgroundColor: config.color, color: 'white' }}
        >
          {hole.description || hole.type}
        </span>
      )}
    </div>
  );
};

// ============================================
// L-CUT ELEMENT COMPONENT
// ============================================

interface LCutElementProps {
  lcut: LCutData;
  plankWidth: number;
  plankHeight: number;
  zoom: number;
  index: number;
}

const LCutElement: React.FC<LCutElementProps> = ({ lcut, plankWidth, plankHeight, zoom, index }) => {
  // Validate L-cut data: all three points must be distinct
  const EPSILON = 0.1;
  const startEqualsCenter = Math.abs(lcut.start.x - lcut.center.x) < EPSILON && 
                            Math.abs(lcut.start.y - lcut.center.y) < EPSILON;
  const centerEqualsEnd = Math.abs(lcut.center.x - lcut.end.x) < EPSILON && 
                          Math.abs(lcut.center.y - lcut.end.y) < EPSILON;
  const isDegenerate = startEqualsCenter || centerEqualsEnd;

  // Clamp coordinates to plank boundaries
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(val, max));
  
  const startX = clamp(lcut.start.x, 0, plankWidth) * zoom;
  const startY = (plankHeight - clamp(lcut.start.y, 0, plankHeight)) * zoom;
  const centerX = clamp(lcut.center.x, 0, plankWidth) * zoom;
  const centerY = (plankHeight - clamp(lcut.center.y, 0, plankHeight)) * zoom;
  const endX = clamp(lcut.end.x, 0, plankWidth) * zoom;
  const endY = (plankHeight - clamp(lcut.end.y, 0, plankHeight)) * zoom;

  const displayWidth = plankWidth * zoom;
  const displayHeight = plankHeight * zoom;

  // If degenerate, show warning indicator
  if (isDegenerate) {
    return (
      <div 
        className="absolute z-20 rounded p-1 cursor-help"
        style={{ 
          left: Math.max(startX, centerX, endX) / 2, 
          top: Math.max(startY, centerY, endY) / 2,
          backgroundColor: 'rgba(249, 115, 22, 0.2)',
          border: `2px dashed ${COLORS.primary}`,
        }}
        title="WARNING: Invalid L-Cut data - points are not distinct"
      >
        <span className="text-sm font-bold" style={{ color: COLORS.primary }}>⚠</span>
      </div>
    );
  }

  // Find which corner the L-cut is near
  const corners = [
    { x: 0, y: 0 },
    { x: displayWidth, y: 0 },
    { x: displayWidth, y: displayHeight },
    { x: 0, y: displayHeight }
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
    <div className="absolute pointer-events-none z-10" style={{ width: displayWidth, height: displayHeight, left: 0, top: 0 }}>
      <svg className="absolute" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {/* Filled polygon showing material to be removed */}
        <polygon 
          points={notchPolygon} 
          fill={HOLE_TYPES.lcut.bgColor}
          stroke={HOLE_TYPES.lcut.color}
          strokeWidth="2"
        />
        {/* L-shaped cut path outline */}
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
        className="absolute w-2 h-2 rounded-full z-20" 
        style={{ left: startX - 4, top: startY - 4, backgroundColor: '#22C55E', border: '1px solid #166534' }}
        title={`L-Cut ${index + 1} Start (${lcut.start.x.toFixed(1)}, ${lcut.start.y.toFixed(1)})`}
      />
      <div 
        className="absolute w-2 h-2 rounded-full z-20" 
        style={{ left: centerX - 4, top: centerY - 4, backgroundColor: COLORS.primary, border: '1px solid #C2410C' }}
        title={`L-Cut ${index + 1} Center (${lcut.center.x.toFixed(1)}, ${lcut.center.y.toFixed(1)})`}
      />
      <div 
        className="absolute w-2 h-2 rounded-full z-20" 
        style={{ left: endX - 4, top: endY - 4, backgroundColor: '#EF4444', border: '1px solid #B91C1C' }}
        title={`L-Cut ${index + 1} End (${lcut.end.x.toFixed(1)}, ${lcut.end.y.toFixed(1)})`}
      />
    </div>
  );
};

// ============================================
// PLANK TOOLTIP COMPONENT
// ============================================

interface PlankTooltipProps {
  plank: PlankWithFeatures;
  position: { x: number; y: number };
}

const PlankTooltip: React.FC<PlankTooltipProps> = ({ plank, position }) => {
  const holeCount = plank.holes?.length || 0;
  const lcutCount = plank.l_cuts?.length || 0;

  // Group holes by type for summary
  const holeSummary: Record<string, number> = {};
  if (plank.holes) {
    plank.holes.forEach(hole => {
      const type = hole.description || hole.type || 'unknown';
      holeSummary[type] = (holeSummary[type] || 0) + 1;
    });
  }

  return (
    <div 
      className="fixed z-50 max-w-xs rounded-xl shadow-2xl overflow-hidden"
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
              const EPSILON = 0.1;
              const isDegenerate = 
                (Math.abs(lc.start.x - lc.center.x) < EPSILON && Math.abs(lc.start.y - lc.center.y) < EPSILON) ||
                (Math.abs(lc.center.x - lc.end.x) < EPSILON && Math.abs(lc.center.y - lc.end.y) < EPSILON);
              
              return (
                <div 
                  key={i} 
                  className={`text-[10px] mt-1 ${isDegenerate ? 'p-1 rounded' : ''}`}
                  style={{ backgroundColor: isDegenerate ? 'rgba(249, 115, 22, 0.2)' : 'transparent' }}
                >
                  {isDegenerate && (
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
