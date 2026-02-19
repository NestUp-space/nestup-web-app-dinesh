/**
 * BoxDefaultsManager - EXACT PORT from designer_index.html
 * 
 * Manages intelligent defaults for newly placed boxes
 * 
 * When placing a new box, it inherits properties from the previously placed box:
 * 
 * Position:
 *   X = prev.X + prev.width (placed adjacent)
 *   Y = prev.Y (same depth position)
 *   Z = prev.Z (same height position)
 * 
 * Dimensions:
 *   width = from catalog (user selected this specific box size)
 *   depth = prev.depth (consistent row depth)
 *   height = prev.height (consistent row height)
 * 
 * Construction:
 *   skirting = prev.skirting
 *   skirtingWidth = prev.skirtingWidth
 *   carcassThickness = prev.carcassThickness
 *   doorThickness = prev.doorThickness
 *   backplankThickness = prev.backplankThickness
 *   carcusPly = prev.carcusPly
 *   doorPly = prev.doorPly
 *   backPly = prev.backPly
 */

import { Box, Position } from '@/types/visualiser';

export interface BoxDefaults {
  position: Position;
  boxWidth: number;
  boxDepth: number;
  boxHeight: number;
  skirting: number;
  skirtingWidth: number;
  carcassThickness: number;
  doorThickness: number;
  backplankThickness: number;
  carcusPly: string;
  doorPly: string;
  backPly: string;
}

interface LastPlacedBox {
  position: Position;
  boxWidth: number;
  boxDepth: number;
  boxHeight: number;
  skirting: number;
  skirtingWidth: number;
  carcassThickness: number;
  doorThickness: number;
  backplankThickness: number;
  carcusPly: string;
  doorPly: string;
  backPly: string;
}

interface WallDefaults {
  boxWidth: number;
  boxDepth: number;
  boxHeight: number;
  skirting: number;
  skirtingWidth: number;
  carcassThickness: number;
  doorThickness: number;
  backplankThickness: number;
  positionY: number;
  carcusPly: string;
  doorPly: string;
  backPly: string;
}

interface CatalogBox {
  boxWidth?: number;
  boxDepth?: number;
  boxHeight?: number;
  skirting?: number;
  skirtingWidth?: number;
  carcusThickness?: number;
  carcassThickness?: number;
  doorThickness?: number;
  backplankThickness?: number;
  carcusPly?: string;
  doorPly?: string;
  backPly?: string;
}

// Catalog defaults (fallback when no previous box)
const catalogDefaults: BoxDefaults = {
  position: { x: 0, y: 0, z: 0 },
  boxWidth: 600,
  boxDepth: 550,
  boxHeight: 720,
  skirting: 100,
  skirtingWidth: 50,
  carcassThickness: 18,
  doorThickness: 18,
  backplankThickness: 6,
  carcusPly: '',
  doorPly: '',
  backPly: '',
};

export const BoxDefaultsManager = {
  // STATE
  lastPlacedBox: null as LastPlacedBox | null,
  wallDefaultsByWall: {} as Record<string, WallDefaults>,

  /**
   * Store data from a placed box (call after successful placement)
   */
  storeLastPlaced(boxData: Partial<Box> & { position?: Position }) {
    if (!boxData) return;

    console.log('[BoxDefaultsManager] storeLastPlaced received:', boxData);

    this.lastPlacedBox = {
      position: {
        x: boxData.position?.x ?? 0,
        y: boxData.position?.y ?? 0,
        z: boxData.position?.z ?? 0,
      },
      boxWidth: boxData.boxWidth ?? boxData.dimensions?.lenX ?? 600,
      boxDepth: boxData.boxDepth ?? boxData.dimensions?.lenY ?? 550,
      boxHeight: boxData.boxHeight ?? boxData.dimensions?.lenZ ?? 720,
      skirting: boxData.skirting ?? 0,
      skirtingWidth: boxData.skirtingWidth ?? 0,
      carcassThickness: boxData.carcusThickness ?? 18,
      doorThickness: boxData.doorThickness ?? 18,
      backplankThickness: boxData.backplankThickness ?? 6,
      carcusPly: boxData.carcusPly ?? '',
      doorPly: boxData.doorPly ?? '',
      backPly: boxData.backPly ?? '',
    };

    console.log('[BoxDefaultsManager] Stored last placed box:', this.lastPlacedBox);
  },

  /**
   * Initialize wall defaults from existing boxes on a wall
   */
  initWallDefaults(wallName: string, existingBoxes: Box[], forceReload = false): WallDefaults | null {
    if (!wallName) return null;

    if (this.wallDefaultsByWall[wallName] && !forceReload) {
      console.log('[BoxDefaultsManager] Using cached defaults for "' + wallName + '"');
      return this.wallDefaultsByWall[wallName];
    }

    if (existingBoxes && existingBoxes.length > 0) {
      const firstBox = existingBoxes[0];
      this.wallDefaultsByWall[wallName] = {
        boxWidth: firstBox.boxWidth ?? 600,
        boxDepth: firstBox.boxDepth ?? 550,
        boxHeight: firstBox.boxHeight ?? 720,
        skirting: firstBox.skirting ?? 0,
        skirtingWidth: firstBox.skirtingWidth ?? 0,
        carcassThickness: firstBox.carcusThickness ?? 18,
        doorThickness: firstBox.doorThickness ?? 18,
        backplankThickness: firstBox.backplankThickness ?? 6,
        positionY: firstBox.position?.y ?? 0,  // Boxes at wall surface (Y=0)
        carcusPly: firstBox.carcusPly ?? '',
        doorPly: firstBox.doorPly ?? '',
        backPly: firstBox.backPly ?? '',
      };
      console.log('[BoxDefaultsManager] Initialized from FIRST box on "' + wallName + '"');
      return this.wallDefaultsByWall[wallName];
    }

    console.log('[BoxDefaultsManager] No existing boxes on "' + wallName + '"');
    return null;
  },

  /**
   * Set wall defaults (called after placing first box on wall)
   */
  setWallDefaults(wallName: string, defaults: Partial<BoxDefaults>) {
    if (!wallName || !defaults) return;

    if (this.wallDefaultsByWall[wallName]) {
      console.log('[BoxDefaultsManager] Wall defaults already set for "' + wallName + '"');
      return;
    }

    this.wallDefaultsByWall[wallName] = {
      boxWidth: defaults.boxWidth ?? 600,
      boxDepth: defaults.boxDepth ?? 550,
      boxHeight: defaults.boxHeight ?? 720,
      skirting: defaults.skirting ?? 0,
      skirtingWidth: defaults.skirtingWidth ?? 0,
      carcassThickness: defaults.carcassThickness ?? 18,
      doorThickness: defaults.doorThickness ?? 18,
      backplankThickness: defaults.backplankThickness ?? 6,
      positionY: defaults.position?.y ?? 0,  // Boxes should be at Y=0 (wall surface)
      carcusPly: defaults.carcusPly ?? '',
      doorPly: defaults.doorPly ?? '',
      backPly: defaults.backPly ?? '',
    };

    console.log('[BoxDefaultsManager] Set defaults from FIRST box on "' + wallName + '"');
  },

  /**
   * Get resolved defaults for a catalog box on current wall
   * EXACT PORT from Apps Script
   */
  getResolvedDefaults(catalogBox: CatalogBox, wallName: string, existingBoxes: Box[]): BoxDefaults {
    // Initialize wall defaults from existing boxes
    this.initWallDefaults(wallName, existingBoxes);
    
    const wallDefaults = this.wallDefaultsByWall[wallName];

    if (wallDefaults) {
      // Wall has existing defaults from FIRST box - inherit dimensions EXCEPT boxWidth
      const boxDepth = wallDefaults.boxDepth ?? 550;
      // Position Y should be 0 (at wall surface), not boxDepth
      const positionY = wallDefaults.positionY ?? 0;
      
      return {
        // X will be calculated later, Y=0 (at wall surface), Z always 0 for new boxes
        position: { x: 0, y: positionY, z: 0 },
        // boxWidth comes from CATALOG (user's selection), not inherited
        boxWidth: catalogBox.boxWidth ?? 600,
        // boxDepth and boxHeight inherited from first box on wall
        boxDepth: boxDepth,
        boxHeight: wallDefaults.boxHeight ?? 720,
        skirting: wallDefaults.skirting ?? 0,
        skirtingWidth: wallDefaults.skirtingWidth ?? 0,
        carcassThickness: wallDefaults.carcassThickness ?? 18,
        doorThickness: wallDefaults.doorThickness ?? 18,
        backplankThickness: wallDefaults.backplankThickness ?? 6,
        carcusPly: wallDefaults.carcusPly ?? '',
        doorPly: wallDefaults.doorPly ?? '',
        backPly: wallDefaults.backPly ?? '',
      };
    }

    // No wall defaults yet - this is the first box, use catalog values
    // COORDINATE SYSTEM:
    // - Box origin = Back-Left-Bottom corner (min X, Y, Z)
    // - Wall surface at Y=0, wall extends backward into positive Y
    // - Boxes should be in FRONT of wall (negative Y direction)
    // - For first box: position.y = 0, box extends from Y=0 (back at wall) toward negative Y
    const boxDepth = catalogBox.boxDepth ?? 550;
    
    return {
      // First box: X=0, Y=0 (back at wall surface), Z=0 (on floor)
      position: { x: 0, y: 0, z: 0 },
      boxWidth: catalogBox.boxWidth ?? catalogDefaults.boxWidth,
      boxDepth: boxDepth,
      boxHeight: catalogBox.boxHeight ?? catalogDefaults.boxHeight,
      skirting: catalogBox.skirting ?? catalogDefaults.skirting,
      skirtingWidth: catalogBox.skirtingWidth ?? catalogDefaults.skirtingWidth,
      carcassThickness: catalogBox.carcusThickness ?? catalogBox.carcassThickness ?? catalogDefaults.carcassThickness,
      doorThickness: catalogBox.doorThickness ?? catalogDefaults.doorThickness,
      backplankThickness: catalogBox.backplankThickness ?? catalogDefaults.backplankThickness,
      carcusPly: catalogBox.carcusPly ?? catalogDefaults.carcusPly,
      doorPly: catalogBox.doorPly ?? catalogDefaults.doorPly,
      backPly: catalogBox.backPly ?? catalogDefaults.backPly,
    };
  },

  /**
   * Get defaults for a new box - EXACT PORT from Apps Script
   */
  getDefaults(catalogBox: CatalogBox, wallName: string, existingBoxes: Box[]): BoxDefaults {
    if (!this.lastPlacedBox) {
      // No previous box - use catalog values
      // For first box against wall (wall surface at Y=0),
      // position.y = 0 so the BACK of the box is at wall surface.
      const boxDepth = catalogBox.boxDepth ?? catalogDefaults.boxDepth;

      console.log('[BoxDefaultsManager] First box on wall, position.y=0 (at wall surface)');

      return {
        position: { x: 0, y: 0, z: 0 },
        boxWidth: catalogBox.boxWidth ?? catalogDefaults.boxWidth,
        boxDepth: boxDepth,
        boxHeight: catalogBox.boxHeight ?? catalogDefaults.boxHeight,
        skirting: catalogBox.skirting ?? catalogDefaults.skirting,
        skirtingWidth: catalogBox.skirtingWidth ?? catalogDefaults.skirtingWidth,
        carcassThickness: catalogBox.carcusThickness ?? catalogBox.carcassThickness ?? catalogDefaults.carcassThickness,
        doorThickness: catalogBox.doorThickness ?? catalogDefaults.doorThickness,
        backplankThickness: catalogBox.backplankThickness ?? catalogDefaults.backplankThickness,
        carcusPly: catalogBox.carcusPly ?? catalogDefaults.carcusPly,
        doorPly: catalogBox.doorPly ?? catalogDefaults.doorPly,
        backPly: catalogBox.backPly ?? catalogDefaults.backPly,
      };
    }

    const prev = this.lastPlacedBox;

    // Calculate new position (adjacent to previous box)
    const newPosition: Position = {
      x: prev.position.x + prev.boxWidth, // Place to the right of previous
      y: prev.position.y,                  // Same depth
      z: prev.position.z,                  // Same height (on floor)
    };

    return {
      // Position: adjacent to previous
      position: newPosition,
      // Width from catalog (user selected this size)
      boxWidth: catalogBox.boxWidth ?? catalogDefaults.boxWidth,
      // Depth and height from previous (consistent row)
      boxDepth: prev.boxDepth,
      boxHeight: prev.boxHeight,
      // Construction from previous
      skirting: prev.skirting,
      skirtingWidth: prev.skirtingWidth,
      carcassThickness: prev.carcassThickness,
      doorThickness: prev.doorThickness,
      backplankThickness: prev.backplankThickness,
      carcusPly: prev.carcusPly,
      doorPly: prev.doorPly,
      backPly: prev.backPly,
    };
  },

  /**
   * Calculate next box position considering existing boxes (with collision avoidance)
   * 
   * IMPORTANT: Boxes must be placed IN FRONT of the wall (positive Y values)
   * - Wall surface is at Y=0, extending backward (negative Y)
   * - Boxes should have positive Y so they appear visible in front of wall
   * - A small gap ensures boxes don't clip into the wall
   */
  calculateNextPosition(
    catalogBox: CatalogBox,
    existingBoxes: Box[]
  ): Position {
    // Small gap (10mm) between wall surface and box back face
    // This ensures boxes are clearly visible in front of the wall
    const GAP_FROM_WALL = 10;
    
    if (!existingBoxes || existingBoxes.length === 0) {
      // First box: X=0, Y=GAP_FROM_WALL (in front of wall), Z=0 (on floor)
      // Box extends in positive Y direction (towards viewer/room)
      return { x: 0, y: GAP_FROM_WALL, z: 0 };
    }

    // Find rightmost edge of existing boxes
    let maxRightEdge = 0;
    let referenceY = existingBoxes[0].position?.y ?? GAP_FROM_WALL;
    let referenceZ = existingBoxes[0].position?.z ?? 0;

    for (const box of existingBoxes) {
      const rightEdge = (box.position?.x ?? 0) + (box.boxWidth ?? 600);
      if (rightEdge > maxRightEdge) {
        maxRightEdge = rightEdge;
        referenceY = box.position?.y ?? GAP_FROM_WALL;
        referenceZ = box.position?.z ?? 0;
      }
    }

    // Ensure Y is always positive (in front of wall)
    // Use Math.abs to convert any negative values to positive
    const safeY = Math.abs(referenceY) || GAP_FROM_WALL;

    // Place new box adjacent to rightmost box
    return {
      x: maxRightEdge,  // No gap - boxes touch horizontally
      y: safeY,         // Positive Y ensures box is in front of wall
      z: referenceZ,    // Same height
    };
  },

  /**
   * Clear all stored defaults
   */
  clearDefaults() {
    this.lastPlacedBox = null;
    this.wallDefaultsByWall = {};
    console.log('[BoxDefaultsManager] Cleared all defaults');
  },

  /**
   * Clear defaults for a specific wall
   */
  clearWallDefaults(wallName: string) {
    delete this.wallDefaultsByWall[wallName];
    console.log('[BoxDefaultsManager] Cleared defaults for wall:', wallName);
  },
};
