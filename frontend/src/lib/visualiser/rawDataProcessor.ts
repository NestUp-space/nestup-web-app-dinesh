/**
 * Raw Data Processor
 * Processes raw SketchUp CSV data through the complete manufacturing pipeline
 * 
 * Pipeline: Raw Data → Formatted Data → Plank List → Nest Result → Reports
 */

import type {
  PlankInput,
  NestResult,
  MaterialEstimate,
  QASheetData,
  PressingListItem,
} from "@/types/visualiser";
import { runNesting, type NestingAlgorithm } from "./nestingEngine";

// ============================================
// Types
// ============================================

export interface RawSketchUpRow {
  // Core identification
  entityName: string;
  boxName: string;
  roomName: string;
  wallName?: string;
  
  // Position (3D)
  posX: number;
  posY: number;
  posZ: number;
  
  // Dimensions
  lenX: number;  // Width/Length
  lenY: number;  // Depth
  lenZ: number;  // Height
  
  // Material
  material: string;
  materialCode?: string;
  thickness: number;
  
  // Edge Banding
  ebTop?: number;
  ebBottom?: number;
  ebLeft?: number;
  ebRight?: number;
  ebCode?: string;
  
  // Manufacturing
  grainDirection?: string;
  mirror?: boolean;
  sequence?: number;
  
  // Original row reference
  rowIndex: number;
}

export interface FormattedPlank {
  id: string;
  name: string;
  boxName: string;
  roomName: string;
  
  // 2D Dimensions (after 3D→2D conversion)
  width: number;   // CNC-friendly width
  height: number;  // CNC-friendly height
  thickness: number;
  
  // Material
  material: string;
  materialCode: string;
  
  // Edge Banding (calculated)
  eb: {
    top: { thickness: number; code: string } | null;
    bottom: { thickness: number; code: string } | null;
    left: { thickness: number; code: string } | null;
    right: { thickness: number; code: string } | null;
  };
  ebValue: number;  // Total EB deduction
  
  // Manufacturing flags
  grainDirection: string;
  isMirrored: boolean;
  mirrorPairId?: string;
  
  // Original dimensions (before EB deduction)
  originalWidth: number;
  originalHeight: number;
  
  // Sequence
  sequence: number;
  rowIndex: number;
}

export interface PlankListItem {
  id: string;
  name: string;
  boxName: string;
  roomName: string;
  material: string;
  thickness: number;
  width: number;
  height: number;
  ebValue: number;
  grainDirection: string;
  quantity: number;
  area: number;
}

export interface ProcessedData {
  // Customer info
  customerName: string;
  projectId: string;
  date: string;
  
  // Stage 1: Formatted Data
  formattedPlanks: FormattedPlank[];
  
  // Stage 2: Plank List
  plankList: PlankListItem[];
  
  // Stage 3: Nest Result
  nestResult: Record<number, NestResult[]>;
  nestStats: {
    totalSheets: number;
    totalPlanks: number;
    avgUtilization: number;
    byMaterial: Record<string, { sheets: number; planks: number }>;
  };
  
  // Stage 4: Reports
  materialEstimate: MaterialEstimate[];
  inputQA: QASheetData[];
  outputQA: QASheetData[];
  pressingList: PressingListItem[];
  
  // Invoice data
  invoice: {
    items: {
      description: string;
      quantity: number;
      unit: string;
      rate: number;
      amount: number;
    }[];
    totalAmount: number;
  };
  
  // Summary stats
  summary: {
    totalWalls: number;
    totalBoxes: number;
    totalPlanks: number;
    totalSheets: number;
    totalEdgeBanding: number;
    materials: string[];
  };
}

// ============================================
// Column Mapping
// ============================================

interface ColumnIndices {
  entityName: number;
  boxName: number;
  roomName: number;
  wallName: number;
  posX: number;
  posY: number;
  posZ: number;
  lenX: number;
  lenY: number;
  lenZ: number;
  material: number;
  materialCode: number;
  thickness: number;
  ebTop: number;
  ebBottom: number;
  ebLeft: number;
  ebRight: number;
  ebCode: number;
  grainDirection: number;
  mirror: number;
  sequence: number;
}

function findColumnIndex(headers: string[], names: string[]): number {
  const normalized = headers.map(h => h.toLowerCase().trim().replace(/\s+/g, ''));
  return normalized.findIndex(h => names.some(n => h.includes(n.toLowerCase().replace(/\s+/g, ''))));
}

function mapColumns(headers: string[]): ColumnIndices {
  return {
    entityName: findColumnIndex(headers, ['entityname', 'entity', 'name', 'plankname', 'partname']),
    boxName: findColumnIndex(headers, ['boxname', 'box', 'cabinet', 'cabinetname']),
    roomName: findColumnIndex(headers, ['roomname', 'room', 'zone']),
    wallName: findColumnIndex(headers, ['wallname', 'wall', 'level']),
    posX: findColumnIndex(headers, ['posx', 'x', 'positionx']),
    posY: findColumnIndex(headers, ['posy', 'y', 'positiony']),
    posZ: findColumnIndex(headers, ['posz', 'z', 'positionz']),
    lenX: findColumnIndex(headers, ['lenx', 'length', 'width', 'w']),
    lenY: findColumnIndex(headers, ['leny', 'depth', 'd']),
    lenZ: findColumnIndex(headers, ['lenz', 'height', 'h']),
    material: findColumnIndex(headers, ['material', 'mat', 'materialname']),
    materialCode: findColumnIndex(headers, ['materialcode', 'matcode', 'code']),
    thickness: findColumnIndex(headers, ['thickness', 'thk', 'thick']),
    ebTop: findColumnIndex(headers, ['ebtop', 'edgetop', 'top']),
    ebBottom: findColumnIndex(headers, ['ebbottom', 'edgebottom', 'bottom']),
    ebLeft: findColumnIndex(headers, ['ebleft', 'edgeleft', 'left']),
    ebRight: findColumnIndex(headers, ['ebright', 'edgeright', 'right']),
    ebCode: findColumnIndex(headers, ['ebcode', 'edgecode', 'bandingcode']),
    grainDirection: findColumnIndex(headers, ['grain', 'graindirection', 'direction']),
    mirror: findColumnIndex(headers, ['mirror', 'mirrored', 'ismirror']),
    sequence: findColumnIndex(headers, ['sequence', 'seq', 'step', 'order']),
  };
}

// ============================================
// Stage 1: Parse Raw Data
// ============================================

function parseRawData(headers: string[], rows: string[][]): RawSketchUpRow[] {
  const cols = mapColumns(headers);
  const rawData: RawSketchUpRow[] = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(cell => !cell || cell.trim() === '')) continue;
    
    const getValue = (idx: number, defaultVal: string = ''): string => {
      return idx >= 0 && row[idx] ? row[idx].trim() : defaultVal;
    };
    
    const getNumber = (idx: number, defaultVal: number = 0): number => {
      const val = getValue(idx);
      const num = parseFloat(val);
      return isNaN(num) ? defaultVal : num;
    };
    
    rawData.push({
      entityName: getValue(cols.entityName, `Part_${i + 1}`),
      boxName: getValue(cols.boxName, `Box_${Math.floor(i / 10) + 1}`),
      roomName: getValue(cols.roomName, 'Default Room'),
      wallName: getValue(cols.wallName),
      posX: getNumber(cols.posX),
      posY: getNumber(cols.posY),
      posZ: getNumber(cols.posZ),
      lenX: getNumber(cols.lenX, 100),
      lenY: getNumber(cols.lenY, 100),
      lenZ: getNumber(cols.lenZ, 18),
      material: getValue(cols.material, 'Plywood'),
      materialCode: getValue(cols.materialCode),
      thickness: getNumber(cols.thickness, 18),
      ebTop: getNumber(cols.ebTop),
      ebBottom: getNumber(cols.ebBottom),
      ebLeft: getNumber(cols.ebLeft),
      ebRight: getNumber(cols.ebRight),
      ebCode: getValue(cols.ebCode),
      grainDirection: getValue(cols.grainDirection, 'N'),
      mirror: getValue(cols.mirror).toLowerCase() === 'yes' || getValue(cols.mirror).toLowerCase() === 'true',
      sequence: getNumber(cols.sequence, i + 1),
      rowIndex: i + 1,
    });
  }
  
  return rawData;
}

// ============================================
// Stage 2: Generate Formatted Data (3D → 2D)
// ============================================

function convert3Dto2D(raw: RawSketchUpRow): { width: number; height: number } {
  // Convert 3D dimensions to 2D sheet dimensions
  // Typically: lenX and lenY become width and height for CNC
  // lenZ is the thickness
  
  const dims = [raw.lenX, raw.lenY, raw.lenZ].filter(d => d > 0);
  dims.sort((a, b) => b - a); // Sort descending
  
  // The two largest dimensions become width and height
  // The smallest (or specified thickness) is the material thickness
  const width = dims[0] || 100;
  const height = dims[1] || 100;
  
  return { width, height };
}

function calculateEdgeBanding(raw: RawSketchUpRow): FormattedPlank['eb'] {
  const defaultCode = raw.ebCode || 'STD';
  
  return {
    top: raw.ebTop && raw.ebTop > 0 ? { thickness: raw.ebTop, code: defaultCode } : null,
    bottom: raw.ebBottom && raw.ebBottom > 0 ? { thickness: raw.ebBottom, code: defaultCode } : null,
    left: raw.ebLeft && raw.ebLeft > 0 ? { thickness: raw.ebLeft, code: defaultCode } : null,
    right: raw.ebRight && raw.ebRight > 0 ? { thickness: raw.ebRight, code: defaultCode } : null,
  };
}

function calculateEBValue(eb: FormattedPlank['eb']): number {
  // Calculate total EB deduction per side
  let total = 0;
  if (eb.top) total += eb.top.thickness;
  if (eb.bottom) total += eb.bottom.thickness;
  if (eb.left) total += eb.left.thickness;
  if (eb.right) total += eb.right.thickness;
  return total / 4; // Average per edge for sizing
}

function generateFormattedData(rawData: RawSketchUpRow[]): FormattedPlank[] {
  const formatted: FormattedPlank[] = [];
  const mirrorPairs: Map<string, string> = new Map();
  
  for (let i = 0; i < rawData.length; i++) {
    const raw = rawData[i];
    const { width, height } = convert3Dto2D(raw);
    const eb = calculateEdgeBanding(raw);
    const ebValue = calculateEBValue(eb);
    
    // Calculate final dimensions after EB deduction
    const finalWidth = width - (eb.left?.thickness || 0) - (eb.right?.thickness || 0);
    const finalHeight = height - (eb.top?.thickness || 0) - (eb.bottom?.thickness || 0);
    
    const plankId = `P${String(i + 1).padStart(4, '0')}`;
    
    const plank: FormattedPlank = {
      id: plankId,
      name: raw.entityName,
      boxName: raw.boxName,
      roomName: raw.roomName,
      width: Math.max(finalWidth, 10),
      height: Math.max(finalHeight, 10),
      thickness: raw.thickness,
      material: raw.material,
      materialCode: raw.materialCode || raw.material.substring(0, 3).toUpperCase(),
      eb,
      ebValue,
      grainDirection: raw.grainDirection || 'N',
      isMirrored: raw.mirror || false,
      originalWidth: width,
      originalHeight: height,
      sequence: raw.sequence,
      rowIndex: raw.rowIndex,
    };
    
    formatted.push(plank);
    
    // Handle mirror pairs
    if (raw.mirror) {
      const mirrorKey = `${raw.boxName}-${raw.entityName}`;
      if (mirrorPairs.has(mirrorKey)) {
        plank.mirrorPairId = mirrorPairs.get(mirrorKey);
        const pairPlank = formatted.find(p => p.id === plank.mirrorPairId);
        if (pairPlank) pairPlank.mirrorPairId = plankId;
      } else {
        mirrorPairs.set(mirrorKey, plankId);
      }
    }
  }
  
  return formatted;
}

// ============================================
// Stage 3: Generate Plank List
// ============================================

function generatePlankList(formattedPlanks: FormattedPlank[]): PlankListItem[] {
  return formattedPlanks.map(plank => ({
    id: plank.id,
    name: plank.name,
    boxName: plank.boxName,
    roomName: plank.roomName,
    material: plank.material,
    thickness: plank.thickness,
    width: plank.width,
    height: plank.height,
    ebValue: plank.ebValue,
    grainDirection: plank.grainDirection,
    quantity: 1,
    area: (plank.width * plank.height) / 1000000, // Convert to sqm
  }));
}

// ============================================
// Stage 4: Generate Nest Result
// ============================================

function generateNestResult(
  formattedPlanks: FormattedPlank[],
  algorithm: NestingAlgorithm = 'maxrects'
): { nestResult: Record<number, NestResult[]>; stats: ProcessedData['nestStats'] } {
  // Group planks by material and thickness
  const groups: Map<string, PlankInput[]> = new Map();
  
  for (const plank of formattedPlanks) {
    const key = `${plank.material}_${plank.thickness}mm`;
    if (!groups.has(key)) groups.set(key, []);
    
    groups.get(key)!.push({
      id: plank.id,
      name: plank.name,
      material: plank.material,
      thickness: plank.thickness,
      width: plank.width,
      height: plank.height,
      grain: plank.grainDirection,
      ebValue: plank.ebValue,
    });
  }
  
  // Run nesting for each group
  const nestResult: Record<number, NestResult[]> = {};
  const byMaterial: Record<string, { sheets: number; planks: number }> = {};
  let sheetOffset = 0;
  let totalUtilization = 0;
  let groupCount = 0;
  
  const defaultColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#2AB7CA',
    '#F08A5D', '#B22727', '#54A0FF', '#5F27CD', '#FF9F43'
  ];
  let colorIdx = 0;
  
  for (const [materialKey, planks] of groups) {
    const result = runNesting(planks, materialKey, { algorithm });
    
    // Process layout results
    for (const row of result.layout) {
      const [id, name, material, thickness, sheetNum, x, y, w, h, rotated, origW, origH, eb] = row;
      const actualSheetNum = parseInt(sheetNum) + sheetOffset;
      
      if (!nestResult[actualSheetNum]) {
        nestResult[actualSheetNum] = [];
      }
      
      nestResult[actualSheetNum].push({
        id: String(id),
        name: String(name),
        material: String(material),
        thickness: parseFloat(thickness),
        sheetNum: actualSheetNum,
        x: parseFloat(x),
        y: parseFloat(y),
        width: parseFloat(w),
        height: parseFloat(h),
        rotated: String(rotated).toLowerCase() === 'yes',
        originalWidth: parseFloat(origW),
        originalHeight: parseFloat(origH),
        ebValue: parseFloat(eb) || 0,
        color: defaultColors[colorIdx % defaultColors.length],
      });
    }
    
    byMaterial[materialKey] = {
      sheets: result.sheetsUsed,
      planks: planks.length,
    };
    
    sheetOffset += result.sheetsUsed;
    totalUtilization += parseFloat(result.utilization);
    groupCount++;
    colorIdx++;
  }
  
  return {
    nestResult,
    stats: {
      totalSheets: Object.keys(nestResult).length,
      totalPlanks: formattedPlanks.length,
      avgUtilization: groupCount > 0 ? totalUtilization / groupCount : 0,
      byMaterial,
    },
  };
}

// ============================================
// Stage 5: Generate Reports
// ============================================

function generateMaterialEstimate(
  formattedPlanks: FormattedPlank[],
  nestStats: ProcessedData['nestStats']
): MaterialEstimate[] {
  const materialGroups: Map<string, {
    planks: FormattedPlank[];
    rooms: Set<string>;
    totalEdge: number;
  }> = new Map();
  
  for (const plank of formattedPlanks) {
    const key = `${plank.material}_${plank.thickness}mm`;
    if (!materialGroups.has(key)) {
      materialGroups.set(key, { planks: [], rooms: new Set(), totalEdge: 0 });
    }
    const group = materialGroups.get(key)!;
    group.planks.push(plank);
    group.rooms.add(plank.roomName);
    
    // Calculate edge banding length
    const perimeter = 2 * (plank.width + plank.height);
    let ebLength = 0;
    if (plank.eb.top) ebLength += plank.width;
    if (plank.eb.bottom) ebLength += plank.width;
    if (plank.eb.left) ebLength += plank.height;
    if (plank.eb.right) ebLength += plank.height;
    group.totalEdge += ebLength / 1000; // Convert to meters
  }
  
  const estimates: MaterialEstimate[] = [];
  const SHEET_AREA = 1.22 * 2.44; // 8×4 feet in sqm
  
  for (const [key, group] of materialGroups) {
    const totalArea = group.planks.reduce((sum, p) => sum + (p.width * p.height) / 1000000, 0);
    const materialStats = nestStats.byMaterial[key];
    const sheetsUsed = materialStats?.sheets || Math.ceil(totalArea / SHEET_AREA);
    
    estimates.push({
      materialThickness: key,
      roomNames: Array.from(group.rooms).join(', '),
      plankCount: group.planks.length,
      totalArea: Math.round(totalArea * 100) / 100,
      sheetsUsed,
      avgAreaPerSheet: Math.round((totalArea / sheetsUsed) * 100) / 100,
      utilization: Math.round((totalArea / (sheetsUsed * SHEET_AREA)) * 100),
      totalEdge: Math.round(group.totalEdge * 100) / 100,
    });
  }
  
  return estimates;
}

function generateInputQA(formattedPlanks: FormattedPlank[]): QASheetData[] {
  return formattedPlanks.map(plank => ({
    plankId: plank.id,
    plankName: plank.name,
    material: `${plank.material} ${plank.thickness}mm`,
    dimensions: `${plank.width} × ${plank.height}`,
    status: 'pending' as const,
    notes: undefined,
  }));
}

function generateOutputQA(nestResult: Record<number, NestResult[]>): QASheetData[] {
  const qaData: QASheetData[] = [];
  
  for (const [sheetNum, planks] of Object.entries(nestResult)) {
    for (const plank of planks) {
      qaData.push({
        plankId: plank.id,
        plankName: `${plank.name} (Sheet ${sheetNum})`,
        material: `${plank.material} ${plank.thickness}mm`,
        dimensions: `${plank.width} × ${plank.height}`,
        status: 'pending' as const,
        notes: plank.rotated ? 'Rotated' : undefined,
      });
    }
  }
  
  return qaData;
}

function generatePressingList(nestResult: Record<number, NestResult[]>): PressingListItem[] {
  const pressingList: PressingListItem[] = [];
  
  for (const [sheetNum, planks] of Object.entries(nestResult)) {
    if (planks.length === 0) continue;
    
    pressingList.push({
      sheetNum: parseInt(sheetNum),
      material: planks[0].material,
      thickness: planks[0].thickness,
      plankCount: planks.length,
      planks: planks.map(p => ({
        id: p.id,
        name: p.name,
        width: p.width,
        height: p.height,
      })),
    });
  }
  
  return pressingList.sort((a, b) => a.sheetNum - b.sheetNum);
}

function generateInvoice(
  materialEstimate: MaterialEstimate[],
  formattedPlanks: FormattedPlank[]
): ProcessedData['invoice'] {
  const items: ProcessedData['invoice']['items'] = [];
  
  // Sheet costs
  const SHEET_RATES: Record<string, number> = {
    'plywood': 1500,
    'mdf': 1200,
    'blockboard': 1800,
    'particle': 800,
  };
  
  for (const est of materialEstimate) {
    const materialLower = est.materialThickness.toLowerCase();
    let rate = 1500; // Default rate
    for (const [key, val] of Object.entries(SHEET_RATES)) {
      if (materialLower.includes(key)) {
        rate = val;
        break;
      }
    }
    
    items.push({
      description: `${est.materialThickness} Sheets`,
      quantity: est.sheetsUsed,
      unit: 'sheets',
      rate,
      amount: est.sheetsUsed * rate,
    });
    
    // Edge banding
    if (est.totalEdge > 0) {
      items.push({
        description: `Edge Banding (${est.materialThickness})`,
        quantity: Math.ceil(est.totalEdge),
        unit: 'meters',
        rate: 25,
        amount: Math.ceil(est.totalEdge) * 25,
      });
    }
  }
  
  // Cutting charges
  items.push({
    description: 'CNC Cutting Charges',
    quantity: formattedPlanks.length,
    unit: 'planks',
    rate: 15,
    amount: formattedPlanks.length * 15,
  });
  
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  
  return { items, totalAmount };
}

// ============================================
// Main Processing Function
// ============================================

export interface ProcessingOptions {
  nestingAlgorithm?: NestingAlgorithm;
  customerName?: string;
  projectId?: string;
}

export function processRawData(
  headers: string[],
  rows: string[][],
  options: ProcessingOptions = {}
): ProcessedData {
  const {
    nestingAlgorithm = 'maxrects',
    customerName = 'Customer',
    projectId = `PRJ-${Date.now()}`,
  } = options;
  
  // Stage 1: Parse raw data
  const rawData = parseRawData(headers, rows);
  
  // Stage 2: Generate formatted data (3D → 2D)
  const formattedPlanks = generateFormattedData(rawData);
  
  // Stage 3: Generate plank list
  const plankList = generatePlankList(formattedPlanks);
  
  // Stage 4: Run nesting algorithm
  const { nestResult, stats: nestStats } = generateNestResult(formattedPlanks, nestingAlgorithm);
  
  // Stage 5: Generate reports
  const materialEstimate = generateMaterialEstimate(formattedPlanks, nestStats);
  const inputQA = generateInputQA(formattedPlanks);
  const outputQA = generateOutputQA(nestResult);
  const pressingList = generatePressingList(nestResult);
  const invoice = generateInvoice(materialEstimate, formattedPlanks);
  
  // Calculate summary
  const uniqueWalls = new Set(rawData.map(r => r.wallName || r.roomName));
  const uniqueBoxes = new Set(rawData.map(r => r.boxName));
  const uniqueMaterials = new Set(rawData.map(r => r.material));
  const totalEdgeBanding = materialEstimate.reduce((sum, m) => sum + m.totalEdge, 0);
  
  return {
    customerName,
    projectId,
    date: new Date().toISOString().split('T')[0],
    formattedPlanks,
    plankList,
    nestResult,
    nestStats,
    materialEstimate,
    inputQA,
    outputQA,
    pressingList,
    invoice,
    summary: {
      totalWalls: uniqueWalls.size,
      totalBoxes: uniqueBoxes.size,
      totalPlanks: formattedPlanks.length,
      totalSheets: nestStats.totalSheets,
      totalEdgeBanding: Math.round(totalEdgeBanding * 100) / 100,
      materials: Array.from(uniqueMaterials),
    },
  };
}

// ============================================
// Export Utilities
// ============================================

export function exportToCSV(data: any[], headers: string[]): string {
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] ?? row[header.toLowerCase()] ?? '';
      // Escape commas and quotes
      const strVal = String(val);
      if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

export function generateFormattedDataCSV(formattedPlanks: FormattedPlank[]): string {
  const headers = [
    'ID', 'Name', 'Box', 'Room', 'Material', 'Thickness',
    'Width', 'Height', 'Original Width', 'Original Height',
    'EB Value', 'Grain', 'Mirrored', 'Sequence'
  ];
  
  const rows = formattedPlanks.map(p => [
    p.id, p.name, p.boxName, p.roomName, p.material, p.thickness,
    p.width, p.height, p.originalWidth, p.originalHeight,
    p.ebValue, p.grainDirection, p.isMirrored ? 'Yes' : 'No', p.sequence
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function generatePlankListCSV(plankList: PlankListItem[]): string {
  const headers = [
    'ID', 'Name', 'Box', 'Room', 'Material', 'Thickness',
    'Width', 'Height', 'EB Value', 'Grain', 'Qty', 'Area (sqm)'
  ];
  
  const rows = plankList.map(p => [
    p.id, p.name, p.boxName, p.roomName, p.material, p.thickness,
    p.width, p.height, p.ebValue, p.grainDirection, p.quantity, p.area.toFixed(4)
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function generateNestResultCSV(nestResult: Record<number, NestResult[]>): string {
  const headers = [
    'ID', 'Name', 'Material', 'Thickness', 'Sheet', 'X', 'Y',
    'Width', 'Height', 'Rotated', 'Original Width', 'Original Height', 'EB'
  ];
  
  const rows: any[][] = [];
  for (const [sheetNum, planks] of Object.entries(nestResult)) {
    for (const p of planks) {
      rows.push([
        p.id, p.name, p.material, p.thickness, sheetNum,
        p.x.toFixed(1), p.y.toFixed(1), p.width.toFixed(1), p.height.toFixed(1),
        p.rotated ? 'Yes' : 'No', p.originalWidth, p.originalHeight, p.ebValue
      ]);
    }
  }
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export default {
  processRawData,
  exportToCSV,
  generateFormattedDataCSV,
  generatePlankListCSV,
  generateNestResultCSV,
};
