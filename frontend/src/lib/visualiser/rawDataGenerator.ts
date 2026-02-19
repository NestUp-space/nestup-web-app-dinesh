/**
 * Raw Data Generator
 * Converts designer store data to hierarchical raw data format
 * 
 * Levels:
 * - Level 0 = Wall
 * - Level 1 = Box
 * - Level 2 = Plank
 * - Level 3 = Holes/Operations (screws, hinges, VB holes, grooves, etc.)
 */

import type { Wall, Box, Plank, PlankOperations, HoleOperation, GrooveOperation, LCutOperation } from '@/types/visualiser';

// ============================================
// RAW DATA ROW INTERFACE
// ============================================

export interface RawDataRow {
  entityName: string;
  level: number;
  material: string;
  roomName: string;
  unitLocation: string;
  boxModel: string;
  boxType: string;
  lenX: number;
  lenY: number;
  lenZ: number;
  x: number;
  y: number;
  z: number;
  plankId: string;
  // Additional metadata for operations
  operationType?: string;
  operationDetails?: string;
}

// ============================================
// COLUMN DEFINITIONS FOR TABLE VIEW
// ============================================

export const RAW_DATA_COLUMNS = [
  { key: 'entityName', label: 'Entity Name', width: 200 },
  { key: 'level', label: 'Level', width: 60 },
  { key: 'material', label: 'Material', width: 120 },
  { key: 'roomName', label: 'Room_Name', width: 120 },
  { key: 'unitLocation', label: 'Unit_Location', width: 100 },
  { key: 'boxModel', label: 'Box_Model', width: 120 },
  { key: 'boxType', label: 'Box_Type', width: 100 },
  { key: 'lenX', label: 'LenX', width: 80, type: 'number' as const },
  { key: 'lenY', label: 'LenY', width: 80, type: 'number' as const },
  { key: 'lenZ', label: 'LenZ', width: 80, type: 'number' as const },
  { key: 'x', label: 'X', width: 80, type: 'number' as const },
  { key: 'y', label: 'Y', width: 80, type: 'number' as const },
  { key: 'z', label: 'Z', width: 80, type: 'number' as const },
  { key: 'plankId', label: 'plank_id', width: 80 },
];

// ============================================
// GENERATE RAW DATA FROM WALLS
// ============================================

/**
 * Generate raw data rows from the designer store walls
 * Creates hierarchical data with Level 0 (Wall), Level 1 (Box), Level 2 (Plank), Level 3 (Operations)
 */
export function generateRawData(walls: Wall[]): RawDataRow[] {
  const rows: RawDataRow[] = [];

  for (const wall of walls) {
    // Level 0: Wall
    rows.push({
      entityName: wall.entityName || `Wall ${wall.id}`,
      level: 0,
      material: '',
      roomName: wall.roomName || '',
      unitLocation: wall.unitLocation || '',
      boxModel: '',
      boxType: '',
      lenX: wall.dimensions?.lenX || 0,
      lenY: wall.dimensions?.lenY || 0,
      lenZ: wall.dimensions?.lenZ || 0,
      x: wall.position?.x || 0,
      y: wall.position?.y || 0,
      z: wall.position?.z || 0,
      plankId: '',
    });

    // Process each box in the wall
    for (const box of wall.boxes) {
      // Level 1: Box
      rows.push({
        entityName: box.entityName || `Box ${box.id}`,
        level: 1,
        material: '',
        roomName: box.roomName || wall.roomName || '',
        unitLocation: box.unitLocation || wall.unitLocation || '',
        boxModel: box.boxModel || '',
        boxType: box.boxType || '',
        lenX: box.dimensions?.lenX || box.boxWidth || 0,
        lenY: box.dimensions?.lenY || box.boxDepth || 0,
        lenZ: box.dimensions?.lenZ || box.boxHeight || 0,
        x: box.position?.x || 0,
        y: box.position?.y || 0,
        z: box.position?.z || 0,
        plankId: '',
      });

      // Process each plank in the box
      for (const plank of box.planks) {
        // Level 2: Plank
        rows.push({
          entityName: plank.entityName || `Plank ${plank.id}`,
          level: 2,
          material: plank.material || '',
          roomName: box.roomName || wall.roomName || '',
          unitLocation: box.unitLocation || wall.unitLocation || '',
          boxModel: box.boxModel || '',
          boxType: box.boxType || '',
          lenX: plank.dimensions?.lenX || 0,
          lenY: plank.dimensions?.lenY || 0,
          lenZ: plank.dimensions?.lenZ || 0,
          x: plank.position?.x || 0,
          y: plank.position?.y || 0,
          z: plank.position?.z || 0,
          plankId: '', // Will be filled during formatted data generation
        });

        // Level 3: Operations (holes, grooves, etc.) - REQUIRED
        if (plank.operations) {
          const operationRows = generateOperationRows(plank, box, wall);
          rows.push(...operationRows);
        }
      }
    }
  }

  return rows;
}

// ============================================
// GENERATE OPERATION ROWS (LEVEL 3)
// ============================================

/**
 * Generate Level 3 rows for plank operations (holes, grooves, L-cuts, etc.)
 */
function generateOperationRows(plank: Plank, box: Box, wall: Wall): RawDataRow[] {
  const rows: RawDataRow[] = [];
  const ops = plank.operations;
  if (!ops) return rows;

  const baseInfo = {
    level: 3,
    material: plank.material || '',
    roomName: box.roomName || wall.roomName || '',
    unitLocation: box.unitLocation || wall.unitLocation || '',
    boxModel: box.boxModel || '',
    boxType: box.boxType || '',
    plankId: '', // Will be filled during formatted data generation
  };

  // Screw holes
  if (ops.screws && ops.screws.length > 0) {
    ops.screws.forEach((screw, index) => {
      rows.push({
        ...baseInfo,
        entityName: `Screw_${index + 1}`,
        lenX: screw.diameter || 5,
        lenY: screw.diameter || 5,
        lenZ: 0, // Through hole
        x: screw.x,
        y: screw.y,
        z: screw.z,
        operationType: 'screw',
        operationDetails: `D${screw.diameter || 5}`,
      });
    });
  }

  // Hinge holes
  if (ops.hinges && ops.hinges.length > 0) {
    ops.hinges.forEach((hinge, index) => {
      rows.push({
        ...baseInfo,
        entityName: `Hinge_${index + 1}`,
        lenX: hinge.diameter || 35,
        lenY: hinge.diameter || 35,
        lenZ: 12, // Standard hinge depth
        x: hinge.x,
        y: hinge.y,
        z: hinge.z,
        operationType: 'hinge',
        operationDetails: `D${hinge.diameter || 35}`,
      });
    });
  }

  // VB Main holes
  if (ops.vb_main && ops.vb_main.length > 0) {
    ops.vb_main.forEach((vb, index) => {
      rows.push({
        ...baseInfo,
        entityName: `VB_Main_${index + 1}`,
        lenX: vb.diameter || 8,
        lenY: vb.diameter || 8,
        lenZ: 0,
        x: vb.x,
        y: vb.y,
        z: vb.z,
        operationType: 'vb_main',
        operationDetails: `D${vb.diameter || 8}`,
      });
    });
  }

  // VB Double holes
  if (ops.vb_double && ops.vb_double.length > 0) {
    ops.vb_double.forEach((vb, index) => {
      rows.push({
        ...baseInfo,
        entityName: `VB_Double_${index + 1}`,
        lenX: vb.diameter || 8,
        lenY: vb.diameter || 8,
        lenZ: 0,
        x: vb.x,
        y: vb.y,
        z: vb.z,
        operationType: 'vb_double',
        operationDetails: `D${vb.diameter || 8}`,
      });
    });
  }

  // Slots
  if (ops.slots && ops.slots.length > 0) {
    ops.slots.forEach((slot, index) => {
      rows.push({
        ...baseInfo,
        entityName: `Slot_${index + 1}`,
        lenX: slot.length,
        lenY: slot.width,
        lenZ: slot.depth,
        x: slot.x,
        y: slot.y,
        z: slot.z,
        operationType: 'slot',
        operationDetails: `${slot.length}x${slot.width}x${slot.depth}`,
      });
    });
  }

  // Grooves
  if (ops.grooves && ops.grooves.length > 0) {
    ops.grooves.forEach((groove, index) => {
      rows.push({
        ...baseInfo,
        entityName: `Groove_${index + 1}`,
        lenX: groove.length,
        lenY: groove.width,
        lenZ: groove.depth,
        x: groove.x,
        y: groove.y,
        z: groove.z,
        operationType: 'groove',
        operationDetails: `${groove.length}x${groove.width}x${groove.depth}`,
      });
    });
  }

  // Profiles
  if (ops.profiles && ops.profiles.length > 0) {
    ops.profiles.forEach((profile, index) => {
      rows.push({
        ...baseInfo,
        entityName: `Profile_${index + 1}`,
        lenX: profile.length,
        lenY: profile.width,
        lenZ: profile.depth,
        x: profile.x,
        y: profile.y,
        z: profile.z,
        operationType: 'profile',
        operationDetails: `${profile.length}x${profile.width}x${profile.depth}`,
      });
    });
  }

  // L-cuts
  if (ops.l_cuts && ops.l_cuts.length > 0) {
    ops.l_cuts.forEach((lcut, index) => {
      rows.push({
        ...baseInfo,
        entityName: `L_Cut_${index + 1}`,
        // For L-cuts, we store the bounding dimensions
        lenX: Math.abs(lcut.end.x - lcut.start.x) || lcut.x || 0,
        lenY: Math.abs(lcut.end.y - lcut.start.y) || lcut.y || 0,
        lenZ: 0, // Through cut
        // Position is the start point
        x: lcut.start.x,
        y: lcut.start.y,
        z: lcut.start.z,
        operationType: 'l_cut',
        operationDetails: `Start(${lcut.start.x},${lcut.start.y})->Center(${lcut.center.x},${lcut.center.y})->End(${lcut.end.x},${lcut.end.y})`,
      });
    });
  }

  return rows;
}

// ============================================
// UPDATE RAW DATA WITH PLANK IDS
// ============================================

/**
 * Backfill plank IDs from formatted data into raw data
 * This is called after formatted data generation to sync the IDs
 */
export function backfillPlankIds(
  rawData: RawDataRow[],
  plankIdMap: Map<string, string> // Map of plank entityName -> plankId
): RawDataRow[] {
  return rawData.map(row => {
    // Only update Level 2 (Plank) and Level 3 (Operations) rows
    if (row.level === 2 || row.level === 3) {
      // For Level 2, use entity name directly
      // For Level 3, we need to find the parent plank's ID
      if (row.level === 2) {
        const plankId = plankIdMap.get(row.entityName);
        if (plankId) {
          return { ...row, plankId };
        }
      } else if (row.level === 3) {
        // Level 3 operations inherit the plank ID from their parent
        // We need to look backwards in the data to find the parent plank
        // For now, this will be handled by the caller who has context
        return row;
      }
    }
    return row;
  });
}

// ============================================
// CONVERT RAW DATA TO CSV
// ============================================

/**
 * Convert raw data rows to CSV string
 */
export function rawDataToCSV(data: RawDataRow[]): string {
  const headers = RAW_DATA_COLUMNS.map(col => col.label);
  const rows = data.map(row => [
    row.entityName,
    row.level.toString(),
    row.material,
    row.roomName,
    row.unitLocation,
    row.boxModel,
    row.boxType,
    row.lenX.toString(),
    row.lenY.toString(),
    row.lenZ.toString(),
    row.x.toString(),
    row.y.toString(),
    row.z.toString(),
    row.plankId,
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
}

// ============================================
// STATISTICS SUMMARY
// ============================================

export interface RawDataStats {
  totalRows: number;
  wallCount: number;
  boxCount: number;
  plankCount: number;
  operationCount: number;
  operationsByType: Record<string, number>;
}

/**
 * Calculate statistics from raw data
 */
export function calculateRawDataStats(data: RawDataRow[]): RawDataStats {
  const operationsByType: Record<string, number> = {};

  const stats: RawDataStats = {
    totalRows: data.length,
    wallCount: 0,
    boxCount: 0,
    plankCount: 0,
    operationCount: 0,
    operationsByType,
  };

  for (const row of data) {
    switch (row.level) {
      case 0:
        stats.wallCount++;
        break;
      case 1:
        stats.boxCount++;
        break;
      case 2:
        stats.plankCount++;
        break;
      case 3:
        stats.operationCount++;
        if (row.operationType) {
          operationsByType[row.operationType] = (operationsByType[row.operationType] || 0) + 1;
        }
        break;
    }
  }

  return stats;
}
