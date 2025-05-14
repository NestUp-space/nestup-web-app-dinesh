export const GLOBAL_CONSTANTS = {
  MATERIAL_THICKNESS: {
    expose: 18,    // External/exposed plank thickness in mm
    inner: 18,     // Internal plank thickness in mm
    back: 6        // Back panel thickness in mm
  },
  EDGE_BANDING: {
    INNER_EDGEBANDING: 1,  // Internal edge banding thickness in mm
    COLOR_EDGEBANDING: 2   // Exposed/color edge banding thickness in mm
  },
  PLY_THICKNESS_OPTIONS: {
    T3_2: 3.2,   // 3.2mm
    T4: 4,       // 4mm
    T6: 6,       // 6mm
    T8: 8,       // 8mm
    T9: 9,       // 9mm
    T12: 12,     // 12mm
    T15: 15,     // 15mm
    T18: 18,     // 18mm
    T19: 19,     // 19mm
    T20: 20,     // 20mm
    T25: 25      // 25mm
  }
} as const;

// Array of ply thickness values for UI rendering
export const PLY_THICKNESS_VALUES = [3.2, 4, 6, 8, 9, 12, 15, 18, 19, 20, 25] as const;
