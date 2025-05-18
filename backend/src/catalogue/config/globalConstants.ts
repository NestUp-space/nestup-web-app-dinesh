export const GLOBAL_CONSTANTS = {
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
  },
  STANDARD_MATERIALS: { // Standard materials for use in model definition script testing
    "STD_EXPOSE_18MM": { overallThickness: 18, plyThickness: 18, type: "Expose" },
    "STD_INNER_18MM": { overallThickness: 18, plyThickness: 18, type: "Inner" },
    "STD_BACK_6MM": { overallThickness: 6, plyThickness: 6, type: "Back" }
  },
  DEFAULT_SAMPLE_RUNTIME_INPUTS: {
    simpleBox: { // Assuming "Simple Box 002" can use these defaults
      // Common input parameters for a simple box
      boxHeight: 600,
      boxWidth: 400,
      boxDepth: 300,
      leftAdjacency: 'Expose',
      rightAdjacency: 'Expose',
      hasDoor: true,
      // Sample material structures expected by scripts
      // The script uses 'door.MaterialCode.thickness', 'backpanel.MaterialCode.thickness'
      // We map STANDARD_MATERIALS to these paths.
      // Note: The script uses '.thickness', STANDARD_MATERIALS has '.overallThickness'.
      // We will provide 'thickness' in these sample inputs for direct script compatibility,
      // using values from STANDARD_MATERIALS.
      door: {
        MaterialCode: { 
          code: "STD_EXPOSE_18MM", 
          thickness: 18, // Directly from STANDARD_MATERIALS.STD_EXPOSE_18MM.overallThickness (assuming it's 18)
                           // If STANDARD_MATERIALS.STD_EXPOSE_18MM.overallThickness is different, adjust this value.
                           // For now, hardcoding based on the name "18MM".
        }
      },
      backpanel: {
        MaterialCode: {
          code: "STD_BACK_6MM",
          thickness: 6, // Directly from STANDARD_MATERIALS.STD_BACK_6MM.overallThickness (assuming it's 6)
        }
      },
      // If scripts need to look up material details by code from runtimeInputs:
      // outerMaterialCode: "STD_EXPOSE_18MM",
      // innerMaterialCode: "STD_INNER_18MM",
      // materials: { // Example of how richer material data could be structured if needed
      //   "STD_EXPOSE_18MM": { overallThickness: 18, type: "Expose" },
      //   "STD_INNER_18MM": { overallThickness: 18, type: "Inner" },
      // }
    },
    // A generic fallback if model-specific defaults aren't found
    generic: {
      door: { MaterialCode: { thickness: 18 } },
      backpanel: { MaterialCode: { thickness: 6 } },
      // Add other absolutely essential defaults for any script
    }
  },
  // For LeftPlank.EDGE_BANDING, assuming it refers to a general edge banding thickness
  // The script context makes GLOBAL_CONSTANTS available.
  // If LeftPlank refers to plankDetails, then EDGE_BANDING should be in plankDetails.
  // For now, let's assume it's a global constant. The script uses `LeftPlank.EDGE_BANDING`.
  // This implies LeftPlank is an object in the global scope of the script.
  // Let's provide a default edge banding thickness directly.
  // The script context provides globalConstants.EDGE_BANDING.INNER_EDGEBANDING etc.
  // If the script is `(2 * LeftPlank.EDGE_BANDING)`, it might mean `LeftPlank` is a special keyword
  // or it's expected in `plankDetails`.
  // Given the structure of other constants, let's assume `EDGE_BANDING` is an object.
  // The script `(2 * LeftPlank.EDGE_BANDING)` is problematic if LeftPlank is not defined.
  // For now, we ensure EDGE_BANDING values are available. The script might need adjustment
  // to use, e.g., `globalConstants.EDGE_BANDING.INNER_EDGEBANDING`.
  // Or, if LeftPlank refers to the current plank's details: `plankDetails.edgeBandingThickness`
} as const;

// Array of ply thickness values for UI rendering
export const PLY_THICKNESS_VALUES = [3.2, 4, 6, 8, 9, 12, 15, 18, 19, 20, 25] as const;
