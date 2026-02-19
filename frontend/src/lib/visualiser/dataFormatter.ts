/**
 * Data Formatter
 * EXACT PORT from Apps Script "formatting code.js" v8.9
 * 
 * Key functions ported:
 * - detectLevel(): Determines if row is Wall/Box (1), Plank (2), or Operation (3)
 * - applyEdgeBindingWithSettings(): Apply EB thickness, skip back planks, skip if <14mm
 * - transformCoordinates(): Different mapping for horizontal/vertical/face plank types
 * - detectOperationType(): vb_main, vb_double, hing, screw, profile, slot, groove, hole
 * - getPlankType(): vertical, horizontal, face
 */

import {
  Wall,
  Box,
  Plank,
  FormattedPlankData,
  PlankOperations,
  SHEET_CONSTANTS,
} from '@/types/visualiser';

// ============================================
// CONFIGURATION - EXACT FROM APPS SCRIPT
// ============================================

const OVERSIZED_THRESHOLD = {
  length: 2400, // Sheet A dimension
  width: 1200,  // Sheet B dimension
};

// Edge binding settings - matches Apps Script defaults
const EDGE_BINDING_DEFAULTS = {
  inner: 1,   // 1mm for inner materials
  outer: 2,   // 2mm for color/outer materials
};

// ============================================
// LEVEL DETECTION - EXACT FROM APPS SCRIPT
// ============================================

/**
 * Detect level from entity data
 * Level 1: Wall/Box (has north/south/east/west in unit_location)
 * Level 2: Plank (default)
 * Level 3: Operation (hole/groove/vb/screw/hinge/profile/slot/l_cutting)
 * 
 * EXACT PORT from Apps Script detectLevel()
 */
export function detectLevel(entityName: string, unitLocation: string): number {
  const loc = (unitLocation || '').toLowerCase();
  const name = (entityName || '').toLowerCase();
  
  // Level 1: Box/Wall (has directional unit_location)
  if (/north|south|east|west/.test(loc)) return 1;
  
  // Level 3: Operation (holes, grooves, VB, etc.)
  // Include L-cut triplet types (both American "center" and British "centre" spellings) and Gola profile triplet types
  if (/hole|groove|vb|screw|hinge|hing|profile|slot|l_cutting|lcutting|l_cut_start|l_cut_center|l_cut_centre|l_cut_end|lcut_start|lcut_center|lcut_centre|lcut_end|gola_profile_start|gola_profile_center|gola_profile_centre|gola_profile_end|gola_start|gola_center|gola_centre|gola_end/.test(name)) return 3;
  
  // Level 2: Plank (default)
  return 2;
}

// ============================================
// OPERATION TYPE DETECTION - EXACT FROM APPS SCRIPT
// ============================================

export type OperationType = 
  | 'vb_main' 
  | 'vb_double' 
  | 'hing' 
  | 'screw' 
  | 'profile' 
  | 'slot' 
  | 'groove' 
  | 'hole'
  | 'l_cut_start'
  | 'l_cut_center'
  | 'l_cut_end'
  | 'l_cutting_legacy'
  | 'gola_profile_start'
  | 'gola_profile_center'
  | 'gola_profile_end'
  | 'other';

/**
 * Detect operation type from entity name
 * EXACT PORT from Apps Script detectOperationType()
 * 
 * Supports both American "center" and British "centre" spellings
 */
export function detectOperationType(entityName: string): OperationType {
  const name = (entityName || '').toLowerCase();
  
  if (/vb main|vb_main|vbm|main_vb/.test(name)) return 'vb_main';
  if (/vb double|vb_double|vbd|double_vb/.test(name)) return 'vb_double';
  if (/hinge|hing/.test(name)) return 'hing';
  if (/screw|bolt|pta/.test(name)) return 'screw';
  
  // Gola profile triplet subtypes - MUST be checked BEFORE generic /profile/ pattern
  if (/gola_profile_start|golaprofile_start|gola_start/.test(name)) return 'gola_profile_start';
  if (/gola_profile_center|gola_profile_centre|golaprofile_center|gola_center|gola_centre/.test(name)) return 'gola_profile_center';
  if (/gola_profile_end|golaprofile_end|gola_end/.test(name)) return 'gola_profile_end';
  
  // Generic profile/slot/groove (after Gola check)
  if (/profile/.test(name)) return 'profile';
  if (/slot/.test(name)) return 'slot';
  if (/groove/.test(name)) return 'groove';
  
  // L-cut triplet subtypes - Support both American (center) and British (centre) spellings
  if (/l_cut_start|lcut_start/.test(name)) return 'l_cut_start';
  if (/l_cut_center|l_cut_centre|lcut_center|lcut_centre/.test(name)) return 'l_cut_center';
  if (/l_cut_end|lcut_end/.test(name)) return 'l_cut_end';
  
  // Legacy L-cut
  if (/l_cutting|lcutting|l_groove/.test(name)) return 'l_cutting_legacy';
  
  if (/hole|drilled|bore/.test(name)) return 'hole';
  
  return 'hole'; // Default fallback
}

// ============================================
// PLANK TYPE DETECTION - EXACT FROM APPS SCRIPT
// ============================================

export type PlankType = 'vertical' | 'horizontal' | 'face' | 'auto';

/**
 * Get plank type based on name
 * Matches Apps Script getPlankType()
 */
export function getPlankType(plankName: string): PlankType {
  const name = (plankName || '').toLowerCase();
  
  if (/left|right|vertical|maindummy|middle/.test(name)) return 'vertical';
  if (/door|back|skirting|drawfacia|drawfront|drawback|drawdummy|draw|dummy|tandemback/.test(name)) return 'face';
  if (/top|bottom|shelf|tandembottom/.test(name)) return 'horizontal';
  
  return 'auto';
}

// ============================================
// EDGE BINDING WITH SETTINGS - EXACT FROM APPS SCRIPT
// ============================================

export interface EBSettings {
  [material: string]: number;
}

/**
 * Apply edge binding with settings
 * EXACT PORT from Apps Script applyEdgeBindingWithSettings()
 * 
 * Rules:
 * - Skip if thickness < 14mm
 * - Skip back planks (no EB needed)
 * - Default: 2mm offset, subtract from length and width
 */
export function applyEdgeBindingWithSettings(
  plankName: string,
  plankMaterial: string,
  initialLength: number,
  initialWidth: number,
  plankThickness: number,
  ebSettings?: EBSettings
): { newLength: number; newWidth: number; offset: number } {
  const name = (plankName || '').toLowerCase();
  const material = (plankMaterial || '').trim();
  
  // Rule 1: Skip if thickness < 14mm (thin materials don't need EB)
  if (plankThickness < 14) {
    return { newLength: initialLength, newWidth: initialWidth, offset: 0 };
  }
  
  // Rule 2: Skip back planks (they're not visible)
  if (/\bback\b|back plank|back_panel|back panel/.test(name)) {
    return { newLength: initialLength, newWidth: initialWidth, offset: 0 };
  }
  
  // Determine offset from settings or defaults
  let offset = 2; // Default 2mm
  
  if (ebSettings) {
    // Try exact material match
    if (ebSettings[material] !== undefined) {
      offset = ebSettings[material];
    } else {
      // Try to find a matching material
      const materialLower = material.toLowerCase();
      for (const [key, value] of Object.entries(ebSettings)) {
        if (materialLower.includes(key.toLowerCase())) {
          offset = value;
          break;
        }
      }
    }
  } else {
    // Use defaults based on material type
    const isInner = material.toLowerCase().includes('inner');
    offset = isInner ? EDGE_BINDING_DEFAULTS.inner : EDGE_BINDING_DEFAULTS.outer;
  }
  
  // Validate offset
  if (isNaN(offset) || offset < 0) offset = 0;
  
  // Apply EB offset: subtract from both length and width (2 sides each)
  return {
    newLength: initialLength - (2 * offset),
    newWidth: initialWidth - (2 * offset),
    offset,
  };
}

// ============================================
// COORDINATE TRANSFORMATION - EXACT FROM APPS SCRIPT
// ============================================

interface TransformedCoordinates {
  transformedX: number;
  transformedY: number;
  finalZ: number;
  startX: number | null;
  startY: number | null;
  startZ: number | null;
}

/**
 * Transform coordinates based on plank type and operation
 * EXACT PORT from Apps Script transformCoordinates()
 * 
 * Different mapping for:
 * - horizontal: rawFaceX = rawY, rawFaceY = rawX
 * - vertical: rawFaceX = rawY, rawFaceY = rawZ
 * - face: rawFaceX = rawX, rawFaceY = rawZ
 */
export function transformCoordinates(
  rawX: number,
  rawY: number,
  rawZ: number,
  lenX: number,
  lenY: number,
  lenZ: number,
  plankType: PlankType,
  opType: OperationType,
  plankThickness: number,
  plankOffset: number,
  finalPlankWidth: number,
  plankName: string
): TransformedCoordinates {
  let rawFaceX: number, rawFaceY: number, rawFaceDimL: number, rawFaceDimW: number;
  let startZ: number;
  
  // L-cut boundary points: use actual X,Y surface coordinates
  const lCutOpTypes: OperationType[] = ['l_cut_start', 'l_cut_center', 'l_cut_end'];
  
  if (lCutOpTypes.includes(opType)) {
    rawFaceX = rawX;
    rawFaceY = rawY;
    rawFaceDimL = lenX;
    rawFaceDimW = lenY;
    startZ = lenZ;
  } else if (plankType === 'horizontal') {
    rawFaceX = rawY;
    rawFaceY = rawX;
    rawFaceDimL = lenX;
    rawFaceDimW = lenY;
    startZ = lenZ;
  } else if (plankType === 'vertical') {
    rawFaceX = rawY;
    rawFaceY = rawZ;
    rawFaceDimL = lenZ;
    rawFaceDimW = lenY;
    startZ = lenX;
  } else {
    // face type or auto
    rawFaceX = rawX;
    rawFaceY = rawZ;
    rawFaceDimL = lenX;
    rawFaceDimW = lenZ;
    startZ = lenY;
  }
  
  // Apply edge binding offset
  let offset = Number(plankOffset);
  if (isNaN(offset) || offset < 0) offset = 0;
  
  if (offset > 0) {
    rawFaceX -= offset;
    rawFaceY -= offset;
  }
  
  // Calculate output coordinates
  let transformedX: number, transformedY: number, finalZ: number;
  let startX: number | null = null, startY: number | null = null, startZ_out: number | null = null;
  
  const grooveTokens = ['groove', 'slot', 'profile', 'l_groove', 'l_cutting'];
  
  if (grooveTokens.includes(opType)) {
    startX = rawFaceX;
    startY = rawFaceY + offset;
    startZ_out = startZ;
    transformedX = rawFaceDimL;
    transformedY = rawFaceDimW;
    finalZ = startZ_out;
  } else {
    transformedX = rawFaceX;
    transformedY = rawFaceY;
    
    // Set Z based on operation type
    switch (opType) {
      case 'hing': finalZ = 14; break;
      case 'vb_main': finalZ = 16; break;
      case 'vb_double': finalZ = 11; break;
      default: finalZ = plankThickness || 0; break;
    }
  }
  
  // Mirror for right/bottom/door planks
  const pName = (plankName || '').toLowerCase();
  const shouldMirror = (
    pName.includes('right') ||
    pName.includes('bottom') ||
    pName.includes('door')
  );
  
  if (shouldMirror) {
    if (startX !== null) {
      startX = finalPlankWidth - startX;
    } else {
      transformedX = finalPlankWidth - transformedX;
    }
  }
  
  return { transformedX, transformedY, finalZ, startX, startY, startZ: startZ_out };
}

// ============================================
// MAIN FORMATTING FUNCTION
// ============================================

export interface FormatOptions {
  validateSize?: boolean;
  includeOperations?: boolean;
  transformOperationCoordinates?: boolean;
  ebSettings?: EBSettings;
}

/**
 * Transform Level 3 operations coordinates based on plank type
 * EXACT PORT from Apps Script transformCoordinates() for operations
 * 
 * This transforms raw catalog coordinates to face coordinates for each operation
 */
function transformOperationCoordinatesForPlank(
  operations: PlankOperations,
  plankType: PlankType,
  plankThickness: number,
  plankOffset: number,
  finalPlankWidth: number,
  finalPlankLength: number,
  plankName: string
): PlankOperations {
  console.log(`[TransformOps] Starting for plank "${plankName}"`);
  console.log(`[TransformOps] plankType=${plankType}, thickness=${plankThickness}, offset=${plankOffset}, width=${finalPlankWidth}, length=${finalPlankLength}`);
  console.log(`[TransformOps] Input operations:`, {
    screws: operations.screws?.length || 0,
    hinges: operations.hinges?.length || 0,
    vb_main: operations.vb_main?.length || 0,
    vb_double: operations.vb_double?.length || 0,
    grooves: operations.grooves?.length || 0,
    slots: operations.slots?.length || 0,
    profiles: operations.profiles?.length || 0,
    l_cuts: operations.l_cuts?.length || 0,
  });
  
  const transformed: PlankOperations = {
    screws: [],
    hinges: [],
    vb_main: [],
    vb_double: [],
    slots: [],
    grooves: [],
    profiles: [],
    l_cuts: [],
  };

  const pName = (plankName || '').toLowerCase();
  const shouldMirror = (
    pName.includes('right') ||
    pName.includes('bottom') ||
    pName.includes('door')
  );
  
  console.log(`[TransformOps] shouldMirror=${shouldMirror}`);

  // Transform hole operations (screws, hinges, vb_main, vb_double)
  const transformHole = (hole: { x: number; y: number; z: number; diameter?: number }, opType: OperationType) => {
    // Handle missing/invalid coordinates
    const rawX = typeof hole.x === 'number' && !isNaN(hole.x) ? hole.x : 0;
    const rawY = typeof hole.y === 'number' && !isNaN(hole.y) ? hole.y : 0;
    const rawZ = typeof hole.z === 'number' && !isNaN(hole.z) ? hole.z : 0;
    
    console.log(`[Transform] Hole input: (${rawX}, ${rawY}, ${rawZ}) type=${opType} plankType=${plankType}`);
    
    let rawFaceX: number, rawFaceY: number;
    
    if (plankType === 'horizontal') {
      rawFaceX = rawY;
      rawFaceY = rawX;
    } else if (plankType === 'vertical') {
      rawFaceX = rawY;
      rawFaceY = rawZ;
    } else {
      // face type or auto
      rawFaceX = rawX;
      rawFaceY = rawZ;
    }
    
    // Apply edge binding offset
    let offset = Number(plankOffset);
    if (isNaN(offset) || offset < 0) offset = 0;
    
    if (offset > 0) {
      rawFaceX -= offset;
      rawFaceY -= offset;
    }
    
    let transformedX = rawFaceX;
    let transformedY = rawFaceY;
    let finalZ: number;
    
    // Set Z based on operation type
    switch (opType) {
      case 'hing': finalZ = 14; break;
      case 'vb_main': finalZ = 16; break;
      case 'vb_double': finalZ = 11; break;
      default: finalZ = plankThickness || 0; break;
    }
    
    // Mirror for right/bottom/door planks
    if (shouldMirror) {
      transformedX = finalPlankWidth - transformedX;
    }
    
    console.log(`[Transform] Hole output: (${transformedX}, ${transformedY}, ${finalZ})`);
    
    return {
      x: Math.round(transformedX * 10) / 10,
      y: Math.round(transformedY * 10) / 10,
      z: Math.round(finalZ * 10) / 10,
      diameter: hole.diameter,
    };
  };

  // Transform groove operations (slots, grooves, profiles)
  const transformGroove = (groove: { x: number; y: number; z: number; length: number; width: number; depth: number }) => {
    // Handle missing/invalid coordinates
    const rawX = typeof groove.x === 'number' && !isNaN(groove.x) ? groove.x : 0;
    const rawY = typeof groove.y === 'number' && !isNaN(groove.y) ? groove.y : 0;
    const rawZ = typeof groove.z === 'number' && !isNaN(groove.z) ? groove.z : 0;
    const lenX = typeof groove.length === 'number' && !isNaN(groove.length) ? groove.length : 0;
    const lenY = typeof groove.width === 'number' && !isNaN(groove.width) ? groove.width : 0;
    const lenZ = typeof groove.depth === 'number' && !isNaN(groove.depth) ? groove.depth : 0;
    
    console.log(`[Transform] Groove input: pos(${rawX}, ${rawY}, ${rawZ}) dim(${lenX}, ${lenY}, ${lenZ}) plankType=${plankType}`);
    
    let rawFaceX: number, rawFaceY: number, rawFaceDimL: number, rawFaceDimW: number, startZ: number;
    
    if (plankType === 'horizontal') {
      rawFaceX = rawY;
      rawFaceY = rawX;
      rawFaceDimL = lenX;
      rawFaceDimW = lenY;
      startZ = lenZ;
    } else if (plankType === 'vertical') {
      rawFaceX = rawY;
      rawFaceY = rawZ;
      rawFaceDimL = lenZ;
      rawFaceDimW = lenY;
      startZ = lenX;
    } else {
      rawFaceX = rawX;
      rawFaceY = rawZ;
      rawFaceDimL = lenX;
      rawFaceDimW = lenZ;
      startZ = lenY;
    }
    
    // Apply edge binding offset
    let offset = Number(plankOffset);
    if (isNaN(offset) || offset < 0) offset = 0;
    
    if (offset > 0) {
      rawFaceX -= offset;
      rawFaceY -= offset;
    }
    
    let startX = rawFaceX;
    let startY = rawFaceY + offset;
    const transformedLength = rawFaceDimL;
    const transformedWidth = rawFaceDimW;
    
    // Mirror for right/bottom/door planks
    if (shouldMirror) {
      startX = finalPlankWidth - startX;
    }
    
    return {
      x: Math.round(startX * 10) / 10,
      y: Math.round(startY * 10) / 10,
      z: Math.round(startZ * 10) / 10,
      length: Math.round(transformedLength * 10) / 10,
      width: Math.round(transformedWidth * 10) / 10,
      depth: groove.depth,
    };
  };

  // Transform L-cut operations
  const transformLCut = (lcut: { start: { x: number; y: number; z?: number }; center: { x: number; y: number; z?: number }; end: { x: number; y: number; z?: number } }) => {
    console.log(`[Transform] L-cut input: start(${lcut.start?.x}, ${lcut.start?.y}) center(${lcut.center?.x}, ${lcut.center?.y}) end(${lcut.end?.x}, ${lcut.end?.y})`);
    
    // L-cuts use actual surface coordinates (X, Y), not depth
    // Apply edge binding offset and mirroring
    let offset = Number(plankOffset);
    if (isNaN(offset) || offset < 0) offset = 0;
    
    const transformPoint = (p: { x: number; y: number } | undefined) => {
      if (!p) {
        console.warn('[Transform] L-cut point is undefined');
        return { x: 0, y: 0, z: 0 };
      }
      
      let x = typeof p.x === 'number' && !isNaN(p.x) ? p.x : 0;
      let y = typeof p.y === 'number' && !isNaN(p.y) ? p.y : 0;
      
      if (offset > 0) {
        x -= offset;
        y -= offset;
      }
      
      // Clamp to plank boundaries
      x = Math.max(0, Math.min(x, finalPlankLength));
      y = Math.max(0, Math.min(y, finalPlankWidth));
      
      if (shouldMirror) {
        x = finalPlankLength - x;
      }
      
      return {
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        z: 0,
      };
    };
    
    const result = {
      start: transformPoint(lcut.start),
      center: transformPoint(lcut.center),
      end: transformPoint(lcut.end),
    };
    
    console.log(`[Transform] L-cut output: start(${result.start.x}, ${result.start.y}) center(${result.center.x}, ${result.center.y}) end(${result.end.x}, ${result.end.y})`);
    
    return result;
  };

  // Process screws
  if (operations.screws && Array.isArray(operations.screws) && operations.screws.length > 0) {
    console.log(`[TransformOps] Processing ${operations.screws.length} screws`);
    operations.screws.forEach((hole, i) => {
      console.log(`[TransformOps] Screw ${i}: raw=(${hole.x}, ${hole.y}, ${hole.z})`);
      transformed.screws!.push(transformHole(hole, 'screw'));
    });
  }

  // Process hinges
  if (operations.hinges && Array.isArray(operations.hinges) && operations.hinges.length > 0) {
    console.log(`[TransformOps] Processing ${operations.hinges.length} hinges`);
    operations.hinges.forEach((hole, i) => {
      console.log(`[TransformOps] Hinge ${i}: raw=(${hole.x}, ${hole.y}, ${hole.z})`);
      transformed.hinges!.push(transformHole(hole, 'hing'));
    });
  }

  // Process VB main
  if (operations.vb_main && Array.isArray(operations.vb_main) && operations.vb_main.length > 0) {
    console.log(`[TransformOps] Processing ${operations.vb_main.length} vb_main`);
    operations.vb_main.forEach((hole, i) => {
      console.log(`[TransformOps] VB Main ${i}: raw=(${hole.x}, ${hole.y}, ${hole.z})`);
      transformed.vb_main!.push(transformHole(hole, 'vb_main'));
    });
  }

  // Process VB double
  if (operations.vb_double && Array.isArray(operations.vb_double) && operations.vb_double.length > 0) {
    console.log(`[TransformOps] Processing ${operations.vb_double.length} vb_double`);
    operations.vb_double.forEach((hole, i) => {
      console.log(`[TransformOps] VB Double ${i}: raw=(${hole.x}, ${hole.y}, ${hole.z})`);
      transformed.vb_double!.push(transformHole(hole, 'vb_double'));
    });
  }

  // Process grooves
  if (operations.grooves && Array.isArray(operations.grooves) && operations.grooves.length > 0) {
    console.log(`[TransformOps] Processing ${operations.grooves.length} grooves`);
    operations.grooves.forEach((groove, i) => {
      console.log(`[TransformOps] Groove ${i}: raw=(${groove.x}, ${groove.y}, ${groove.z})`);
      transformed.grooves!.push(transformGroove(groove));
    });
  }

  // Process slots
  if (operations.slots && Array.isArray(operations.slots) && operations.slots.length > 0) {
    console.log(`[TransformOps] Processing ${operations.slots.length} slots`);
    operations.slots.forEach((slot, i) => {
      console.log(`[TransformOps] Slot ${i}: raw=(${slot.x}, ${slot.y}, ${slot.z})`);
      transformed.slots!.push(transformGroove(slot));
    });
  }

  // Process profiles
  if (operations.profiles && Array.isArray(operations.profiles) && operations.profiles.length > 0) {
    console.log(`[TransformOps] Processing ${operations.profiles.length} profiles`);
    operations.profiles.forEach((profile, i) => {
      console.log(`[TransformOps] Profile ${i}: raw=(${profile.x}, ${profile.y}, ${profile.z})`);
      transformed.profiles!.push(transformGroove(profile));
    });
  }

  // Process L-cuts
  if (operations.l_cuts && Array.isArray(operations.l_cuts) && operations.l_cuts.length > 0) {
    console.log(`[TransformOps] Processing ${operations.l_cuts.length} l_cuts`);
    operations.l_cuts.forEach((lcut, i) => {
      console.log(`[TransformOps] L-cut ${i}`);
      transformed.l_cuts!.push(transformLCut(lcut));
    });
  }

  console.log(`[TransformOps] Output operations:`, {
    screws: transformed.screws?.length || 0,
    hinges: transformed.hinges?.length || 0,
    vb_main: transformed.vb_main?.length || 0,
    vb_double: transformed.vb_double?.length || 0,
    grooves: transformed.grooves?.length || 0,
    slots: transformed.slots?.length || 0,
    profiles: transformed.profiles?.length || 0,
    l_cuts: transformed.l_cuts?.length || 0,
  });

  return transformed;
}

/**
 * Format design data into plank list format
 * EXACT PORT from Apps Script formatSketchUpData()
 * 
 * Returns:
 * - data: Formatted plank data with sequential IDs (1, 2, 3, 4, 5...)
 * - plankIdMap: Map of original plank id -> generated sequential ID
 * - warnings: Any validation warnings
 * - errors: Any processing errors
 */
export function formatDesignData(
  walls: Wall[],
  options: FormatOptions = {}
): {
  data: FormattedPlankData[];
  plankIdMap: Map<string, string>;
  warnings: string[];
  errors: string[];
} {
  const { validateSize = true, includeOperations = true, transformOperationCoordinates = true, ebSettings } = options;

  const formattedData: FormattedPlankData[] = [];
  const plankIdMap = new Map<string, string>(); // original id -> sequential id
  const warnings: string[] = [];
  const errors: string[] = [];
  let plankIdCounter = 1; // Simple sequential: 1, 2, 3, 4, 5...

  console.log('[DataFormatter] Starting formatDesignData with', walls.length, 'walls');

  walls.forEach((wall) => {
    wall.boxes.forEach((box) => {
      // Determine box orientation from unit_location
      const orientation = getBoxOrientation(box.unitLocation || wall.unitLocation);
      
      // Generate planks if box has none (auto-generate from dimensions)
      const planks = box.planks.length > 0 
        ? box.planks 
        : generateBoxPlanks(box);

      planks.forEach((plank, plankIndex) => {
        // Skip if not level 2 (plank)
        const level = detectLevel(plank.entityName, box.unitLocation || '');
        if (level !== 2) return;
        
        // Validate plank dimensions (oversized check - STRICT Level 2 only)
        if (validateSize) {
          const { lenX, lenY, lenZ } = plank.dimensions;
          const dims = [lenX, lenY, lenZ].sort((a, b) => a - b);
          const thickness = dims[0];
          
          // Skip thickness check for likely mislabeled items
          if (thickness <= 50) {
            const middle = dims[1];
            const largest = dims[2];
            
            const fitsOrientation1 = largest <= OVERSIZED_THRESHOLD.length && middle <= OVERSIZED_THRESHOLD.width;
            const fitsOrientation2 = largest <= OVERSIZED_THRESHOLD.width && middle <= OVERSIZED_THRESHOLD.length;
            
            if (!fitsOrientation1 && !fitsOrientation2) {
              warnings.push(`Oversized plank: ${plank.entityName} in ${box.entityName} (${largest}x${middle}mm)`);
            }
          }
        }

        // Get plank type for coordinate transformation
        const plankType = getPlankType(plank.entityName);
        
        // Calculate transformed dimensions based on orientation and plank type
        const transformedDimensions = calculateTransformedDimensions(
          plank.dimensions.lenX,
          plank.dimensions.lenY,
          plank.dimensions.lenZ,
          orientation,
          plankType
        );

        // Apply edge binding with settings
        const ebResult = applyEdgeBindingWithSettings(
          plank.entityName,
          plank.material,
          transformedDimensions.length,
          transformedDimensions.width,
          transformedDimensions.thickness,
          ebSettings
        );

        // Generate sequential plank ID (1, 2, 3, 4, 5...)
        const sequentialId = String(plankIdCounter++);
        
        // Store mapping: original plank id -> sequential id
        if (plank.id) {
          plankIdMap.set(plank.id, sequentialId);
        }
        // Also map by entity name for backfilling raw data
        plankIdMap.set(plank.entityName, sequentialId);

        // Transform operations if present and requested
        let finalOperations: PlankOperations = {};
        if (includeOperations && plank.operations) {
          const hasAnyOps = 
            (plank.operations.screws && plank.operations.screws.length > 0) ||
            (plank.operations.hinges && plank.operations.hinges.length > 0) ||
            (plank.operations.vb_main && plank.operations.vb_main.length > 0) ||
            (plank.operations.vb_double && plank.operations.vb_double.length > 0) ||
            (plank.operations.slots && plank.operations.slots.length > 0) ||
            (plank.operations.grooves && plank.operations.grooves.length > 0) ||
            (plank.operations.profiles && plank.operations.profiles.length > 0) ||
            (plank.operations.l_cuts && plank.operations.l_cuts.length > 0);
          
          if (hasAnyOps) {
            console.log(`[DataFormatter] Plank "${plank.entityName}" has operations, transforming...`);
            
            if (transformOperationCoordinates) {
              finalOperations = transformOperationCoordinatesForPlank(
                plank.operations,
                plankType,
                transformedDimensions.thickness,
                ebResult.offset,
                ebResult.newWidth,
                ebResult.newLength,
                plank.entityName
              );
            } else {
              finalOperations = plank.operations;
            }
            
            // Log operation counts
            const opCounts = {
              screws: finalOperations.screws?.length || 0,
              hinges: finalOperations.hinges?.length || 0,
              vb_main: finalOperations.vb_main?.length || 0,
              vb_double: finalOperations.vb_double?.length || 0,
              grooves: finalOperations.grooves?.length || 0,
              slots: finalOperations.slots?.length || 0,
              profiles: finalOperations.profiles?.length || 0,
              l_cuts: finalOperations.l_cuts?.length || 0,
            };
            console.log(`[DataFormatter] Plank "${plank.entityName}" operations:`, opCounts);
          }
        }

        // Format plank data
        const formatted: FormattedPlankData = {
          roomName: box.roomName || wall.roomName,
          boxType: box.boxType || 'Custom',
          boxModel: box.boxModel || box.entityName,
          boxOrientation: orientation,
          boxName: box.entityName,
          plankName: plank.entityName || `Plank ${plankIndex + 1}`,
          plankId: sequentialId, // Simple sequential ID: 1, 2, 3, 4, 5...
          plankLength: ebResult.newLength,
          plankWidth: ebResult.newWidth,
          plankThickness: transformedDimensions.thickness,
          plankMaterial: plank.material || getDefaultMaterial(plank, box),
          ebValue: ebResult.offset,
          ebApplied: ebResult.offset > 0,
          operations: finalOperations,
        };

        formattedData.push(formatted);
      });
    });
  });

  console.log(`[DataFormatter] Formatted ${formattedData.length} planks total`);
  
  return { data: formattedData, plankIdMap, warnings, errors };
}

/**
 * Calculate transformed dimensions based on orientation and plank type
 * EXACT PORT from Apps Script calculateTransformedDimensions()
 */
function calculateTransformedDimensions(
  lenX: number,
  lenY: number,
  lenZ: number,
  orientation: 'NS' | 'EW' | 'N/A',
  plankType: PlankType
): { length: number; width: number; thickness: number } {
  if (orientation === 'EW' || orientation === 'NS') {
    if (plankType === 'horizontal') {
      return { length: lenX, width: lenY, thickness: lenZ };
    }
    if (plankType === 'vertical') {
      return { length: lenZ, width: lenY, thickness: lenX };
    }
    if (plankType === 'face') {
      return { length: lenZ, width: lenX, thickness: lenY };
    }
  }
  
  // Auto: sort and use smallest as thickness
  const dims = [lenX, lenY, lenZ].sort((a, b) => a - b);
  return { thickness: dims[0], width: dims[1], length: dims[2] };
}

// ============================================
// PLANK GENERATION
// ============================================

/**
 * Generate planks for a box based on its dimensions
 * This replicates the box construction logic from Apps Script
 */
export function generateBoxPlanks(box: Box): Plank[] {
  const planks: Plank[] = [];
  const { lenX: width, lenY: depth, lenZ: height } = box.dimensions;
  const carcusT = box.carcusThickness || 18;
  const backT = box.backplankThickness || 6;
  const doorT = box.doorThickness || 18;

  // Left panel (full height)
  planks.push(createPlank({
    entityName: 'Left Panel',
    role: 'left',
    position: { x: 0, y: 0, z: 0 },
    dimensions: { lenX: carcusT, lenY: depth, lenZ: height },
    thickness: carcusT,
    material: box.carcusPly || 'Plywood',
    assemblyOrder: 1,
  }));

  // Right panel (full height)
  planks.push(createPlank({
    entityName: 'Right Panel',
    role: 'right',
    position: { x: width - carcusT, y: 0, z: 0 },
    dimensions: { lenX: carcusT, lenY: depth, lenZ: height },
    thickness: carcusT,
    material: box.carcusPly || 'Plywood',
    assemblyOrder: 2,
  }));

  // Top panel (between left and right)
  planks.push(createPlank({
    entityName: 'Top Panel',
    role: 'top',
    position: { x: carcusT, y: 0, z: height - carcusT },
    dimensions: { lenX: width - carcusT * 2, lenY: depth, lenZ: carcusT },
    thickness: carcusT,
    material: box.carcusPly || 'Plywood',
    assemblyOrder: 3,
  }));

  // Bottom panel (between left and right)
  planks.push(createPlank({
    entityName: 'Bottom Panel',
    role: 'bottom',
    position: { x: carcusT, y: 0, z: box.skirting || 0 },
    dimensions: { lenX: width - carcusT * 2, lenY: depth, lenZ: carcusT },
    thickness: carcusT,
    material: box.carcusPly || 'Plywood',
    assemblyOrder: 4,
  }));

  // Back panel
  planks.push(createPlank({
    entityName: 'Back Panel',
    role: 'back',
    position: { x: carcusT, y: 0, z: carcusT + (box.skirting || 0) },
    dimensions: { 
      lenX: width - carcusT * 2, 
      lenY: backT, 
      lenZ: height - carcusT * 2 - (box.skirting || 0)
    },
    thickness: backT,
    material: box.backPly || 'Plywood 6mm',
    assemblyOrder: 5,
  }));

  // Add skirting if present
  if (box.skirting && box.skirting > 0) {
    planks.push(createPlank({
      entityName: 'Skirting',
      role: 'skirting',
      position: { x: 0, y: depth - (box.skirtingWidth || 100), z: 0 },
      dimensions: { 
        lenX: width, 
        lenY: box.skirtingWidth || 100, 
        lenZ: box.skirting 
      },
      thickness: carcusT,
      material: box.carcusPly || 'Plywood',
      assemblyOrder: 6,
    }));
  }

  // Add door if box type suggests it has doors
  if (shouldHaveDoor(box.boxType)) {
    planks.push(createPlank({
      entityName: 'Door',
      role: 'door',
      position: { x: 0, y: depth, z: box.skirting || 0 },
      dimensions: { 
        lenX: width, 
        lenY: doorT, 
        lenZ: height - (box.skirting || 0) 
      },
      thickness: doorT,
      material: box.doorPly || 'Plywood',
      isDoor: true,
      assemblyOrder: 7,
    }));
  }

  return planks;
}

function createPlank(params: Partial<Plank> & { 
  entityName: string; 
  role: Plank['role']; 
  position: Plank['position'];
  dimensions: Plank['dimensions'];
  thickness: number;
}): Plank {
  return {
    id: `plank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    entityName: params.entityName,
    material: params.material || 'Plywood',
    materialColor: params.materialColor || '#D4A574',
    thickness: params.thickness,
    position: params.position,
    dimensions: params.dimensions,
    role: params.role,
    explodeDirection: getExplodeDirection(params.role),
    assemblyDirection: getAssemblyDirection(params.role),
    isDoor: params.isDoor || false,
    hingeSide: params.hingeSide,
    assemblyOrder: params.assemblyOrder || 0,
    autoGenerated: true,
  };
}

// ============================================
// COORDINATE TRANSFORMATION
// ============================================

/**
 * Transform plank dimensions based on orientation
 * North/South boxes have different coordinate system than East/West
 */
function transformPlankDimensions(
  plank: Plank,
  box: Box,
  orientation: 'NS' | 'EW' | 'N/A'
): { length: number; width: number } {
  const { lenX, lenY, lenZ } = plank.dimensions;

  // For planks, length is typically the longest dimension
  // Width is perpendicular to length
  // Thickness is the smallest (already captured)

  if (orientation === 'NS') {
    // North/South: X is width, Y is depth, Z is height
    return {
      length: Math.max(lenX, lenZ),
      width: Math.min(lenX, lenZ),
    };
  } else if (orientation === 'EW') {
    // East/West: Y is width, X is depth, Z is height
    return {
      length: Math.max(lenY, lenZ),
      width: Math.min(lenY, lenZ),
    };
  }

  // Default: use X as length, Y as width
  return {
    length: Math.max(lenX, lenY, lenZ),
    width: getMiddleValue(lenX, lenY, lenZ),
  };
}

function getMiddleValue(a: number, b: number, c: number): number {
  const sorted = [a, b, c].sort((x, y) => x - y);
  return sorted[1];
}

// ============================================
// EDGE BINDING CALCULATION
// ============================================

/**
 * Calculate edge binding value based on plank role and material
 * Matches Apps Script edge binding logic
 */
function calculateEdgeBinding(plank: Plank, box: Box): number {
  const role = plank.role;

  // Doors typically have color edge binding on all sides
  if (plank.isDoor || role === 'door') {
    return 4; // All 4 edges with color EB
  }

  // Back panels usually have no edge binding
  if (role === 'back') {
    return 0;
  }

  // Exposed edges get color EB, internal edges get inner EB
  switch (role) {
    case 'left':
    case 'right':
      return 2; // Front and top edges exposed
    case 'top':
    case 'bottom':
      return 1; // Front edge exposed
    case 'shelf':
      return 1; // Front edge exposed
    case 'skirting':
    case 'facia':
      return 1; // Front edge exposed
    default:
      return 1;
  }
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate plank size against sheet constraints
 */
function validatePlankSize(plank: Plank, box: Box): string | null {
  const { lenX, lenY, lenZ } = plank.dimensions;
  const maxDim = Math.max(lenX, lenY, lenZ);
  const midDim = getMiddleValue(lenX, lenY, lenZ);

  if (maxDim > OVERSIZED_THRESHOLD.length) {
    return `Warning: ${plank.entityName} in ${box.entityName} exceeds max length (${maxDim}mm > ${OVERSIZED_THRESHOLD.length}mm)`;
  }

  if (midDim > OVERSIZED_THRESHOLD.width) {
    return `Warning: ${plank.entityName} in ${box.entityName} exceeds max width (${midDim}mm > ${OVERSIZED_THRESHOLD.width}mm)`;
  }

  return null;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getBoxOrientation(unitLocation: string): 'NS' | 'EW' | 'N/A' {
  const loc = unitLocation.toLowerCase();
  if (loc === 'north' || loc === 'south') return 'NS';
  if (loc === 'east' || loc === 'west') return 'EW';
  return 'N/A';
}

function getDefaultMaterial(plank: Plank, box: Box): string {
  if (plank.isDoor) {
    return box.doorPly || 'Plywood 18mm';
  }
  if (plank.role === 'back') {
    return box.backPly || 'Plywood 6mm';
  }
  return box.carcusPly || 'Plywood 18mm';
}

function shouldHaveDoor(boxType: string): boolean {
  const type = boxType.toLowerCase();
  return (
    type.includes('base') ||
    type.includes('wall') ||
    type.includes('tall') ||
    type.includes('wardrobe') ||
    type.includes('cabinet')
  ) && !type.includes('open') && !type.includes('shelf');
}

function getExplodeDirection(role: Plank['role']): Plank['explodeDirection'] {
  const directions: Record<Plank['role'], Plank['explodeDirection']> = {
    left: { x: -1, y: 0, z: 0 },
    right: { x: 1, y: 0, z: 0 },
    top: { x: 0, y: 0, z: 1 },
    bottom: { x: 0, y: 0, z: -1 },
    back: { x: 0, y: -1, z: 0 },
    front: { x: 0, y: 1, z: 0 },
    door: { x: 0, y: 1, z: 0 },
    shelf: { x: 0, y: 0, z: 0.5 },
    skirting: { x: 0, y: 1, z: 0 },
    facia: { x: 0, y: 1, z: 0 },
    drawer: { x: 0, y: 1, z: 0 },
    dummy: { x: 0, y: 0, z: 0 },
    other: { x: 0, y: 0, z: 0 },
  };
  return directions[role] || { x: 0, y: 0, z: 0 };
}

function getAssemblyDirection(role: Plank['role']): Plank['assemblyDirection'] {
  const directions: Record<Plank['role'], Plank['assemblyDirection']> = {
    left: { arrow: '→', text: 'Insert from left' },
    right: { arrow: '←', text: 'Insert from right' },
    top: { arrow: '↓', text: 'Place on top' },
    bottom: { arrow: '↑', text: 'Place at bottom' },
    back: { arrow: '←', text: 'Slide in from back' },
    front: { arrow: '→', text: 'Attach at front' },
    door: { arrow: '→', text: 'Hinge to carcass' },
    shelf: { arrow: '↓', text: 'Place on supports' },
    skirting: { arrow: '↑', text: 'Attach at base' },
    facia: { arrow: '→', text: 'Attach to front' },
    drawer: { arrow: '→', text: 'Slide into rails' },
    dummy: { arrow: '', text: '' },
    other: { arrow: '', text: '' },
  };
  return directions[role] || { arrow: '', text: '' };
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Export formatted data to CSV format
 */
export function formatDataToCSV(data: FormattedPlankData[]): string {
  const headers = [
    'Room Name',
    'Box Type',
    'Box Model',
    'Box Orientation',
    'Box Name',
    'Plank Name',
    'Plank ID',
    'Length (mm)',
    'Width (mm)',
    'Thickness (mm)',
    'Material',
    'Edge Binding',
  ];

  const rows = data.map((item) => [
    item.roomName,
    item.boxType,
    item.boxModel,
    item.boxOrientation,
    item.boxName,
    item.plankName,
    item.plankId,
    item.plankLength,
    item.plankWidth,
    item.plankThickness,
    item.plankMaterial,
    item.ebValue,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
