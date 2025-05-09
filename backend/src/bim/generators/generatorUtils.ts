import {
  GlobalRules,
  ModelDefinition,
  Plank
} from '../types/bim.types';

/**
 * @description Gets the material thickness from the model's sampleOnsiteInputs
 * @param materialCode The material code
 * @param model The model definition containing material properties
 * @returns The material thickness in mm
 */
export function getMaterialThickness(materialCode: string, model: ModelDefinition): number {
  if (!model.sampleOnsiteInputs || !model.sampleOnsiteInputs[materialCode]) {
    // Default to a reasonable thickness if material not found
    return 18; // Common thickness for cabinet materials
  }

  return model.sampleOnsiteInputs[materialCode].overallMaterialThickness_mm;
}

/**
 * @description Calculates edge banding configuration based on adjacency rules
 * @param side The side of the box ('left', 'right', 'top', 'bottom')
 * @param adjacency The adjacency type ('Expose', 'Box', 'Wall')
 * @param rules The global BIM rules
 * @param hasDoor Whether this side has a door
 * @returns Edge banding configuration
 */
export function calculateEdgeBanding(
  side: string,
  adjacency: string,
  rules: GlobalRules,
  hasDoor: boolean
): { top?: string; right?: string; bottom?: string; left?: string } {
  const edgeBanding: { top?: string; right?: string; bottom?: string; left?: string } = {};

  // Determine edge banding thickness based on adjacency
  let thickness = rules.edgeBandingRules.notExposedOrInnerLaminate.thickness_mm;

  if (adjacency === 'Expose') {
    thickness = rules.edgeBandingRules.exposedOrOuterLaminate.thickness_mm;
  }

  // Apply edge banding to exposed edges
  if (side === 'left' || side === 'right') {
    edgeBanding.top = thickness + 'mm';
    edgeBanding.bottom = thickness + 'mm';

    // Front edge (facing out) is always banded
    edgeBanding.left = thickness + 'mm';

    // Back edge depends on how the back panel is inserted
    if (adjacency === 'Expose' && rules.adjacencyRules.exposedSide.backPanelInsertion === 'extra_groove_on_inner_side') {
      edgeBanding.right = 'none'; // No edge banding where the back panel is inserted
    } else {
      edgeBanding.right = thickness + 'mm';
    }
  }

  // Special case for doors
  if (hasDoor) {
    // Door-specific edge banding rules would go here
    edgeBanding.left = rules.edgeBandingRules.exposedOrOuterLaminate.thickness_mm + 'mm';
  }

  return edgeBanding;
}

/**
 * @description Calculates the adjusted width for top/bottom/shelf planks
 * @param boxWidth The overall box width
 * @param leftAdjacency The left adjacency type
 * @param rightAdjacency The right adjacency type
 * @param leftThickness The thickness of the left panel
 * @param rightThickness The thickness of the right panel
 * @param rules The global BIM rules
 * @returns The adjusted width
 */
export function calculateAdjustedWidth(
  boxWidth: number,
  leftAdjacency: string,
  rightAdjacency: string,
  leftThickness: number,
  rightThickness: number,
  rules: GlobalRules
): number {
  let adjustedWidth = boxWidth;

  // Subtract side panel thicknesses based on adjacency rules
  if (leftAdjacency === 'Expose' || leftAdjacency === 'Box') {
    adjustedWidth -= leftThickness;
  }

  if (rightAdjacency === 'Expose' || rightAdjacency === 'Box') {
    adjustedWidth -= rightThickness;
  }

  // Handle wall adjacency with dummy panels
  if (leftAdjacency === 'Wall' && rules.adjacencyRules.wallSide.dummyPanelRequired) {
    adjustedWidth -= rules.adjacencyRules.wallSide.dummyClearanceOnSite_mm || 30;
  }

  if (rightAdjacency === 'Wall' && rules.adjacencyRules.wallSide.dummyPanelRequired) {
    adjustedWidth -= rules.adjacencyRules.wallSide.dummyClearanceOnSite_mm || 30;
  }

  return adjustedWidth;
}

/**
 * @description Creates a dummy panel for wall adjacency
 * @param side The side ('Left' or 'Right')
 * @param height The height of the dummy panel
 * @param width The width of the dummy panel
 * @param materialCode The material code
 * @param thickness The material thickness
 * @param rules The global BIM rules
 * @returns A dummy panel plank
 */
export function createDummyPanel(
  side: string,
  height: number,
  width: number,
  materialCode: string,
  thickness: number,
  rules: GlobalRules,
  boxNumber: string = '1',
  packetNumber: string = '1'
): Plank {
  return {
    plankId: `B${boxNumber}P${packetNumber}_Dummy${side}`,
    name: `Dummy ${side} Panel`,
    width: width,
    height: height,
    materialCode: materialCode,
    grainDirection: 'vertical',
    thickness: thickness,
    edgeBanding: {
      top: rules.edgeBandingRules.notExposedOrInnerLaminate.thickness_mm + 'mm',
      right: 'none',
      bottom: rules.edgeBandingRules.notExposedOrInnerLaminate.thickness_mm + 'mm',
      left: 'none'
    }
  };
}

/**
 * @description Creates a door panel
 * @param height The height of the door
 * @param width The width of the door
 * @param materialCode The material code
 * @param thickness The material thickness
 * @param rules The global BIM rules
 * @returns A door panel plank
 */
export function createDoorPanel(
  height: number,
  width: number,
  materialCode: string,
  thickness: number,
  rules: GlobalRules,
  boxNumber: string = '1',
  packetNumber: string = '1'
): Plank {
  // Apply door clearance from rules
  const doorClearance = rules.doorRules.clearance_mm || 1;

  return {
    plankId: `B${boxNumber}P${packetNumber}_Door`,
    name: `Door Panel`,
    width: width - (doorClearance * 2), // Clearance on both sides
    height: height - (doorClearance * 2), // Clearance on top and bottom
    materialCode: materialCode,
    grainDirection: 'vertical',
    thickness: thickness,
    edgeBanding: {
      top: rules.edgeBandingRules.exposedOrOuterLaminate.thickness_mm + 'mm',
      right: rules.edgeBandingRules.exposedOrOuterLaminate.thickness_mm + 'mm',
      bottom: rules.edgeBandingRules.exposedOrOuterLaminate.thickness_mm + 'mm',
      left: rules.edgeBandingRules.exposedOrOuterLaminate.thickness_mm + 'mm'
    }
  };
}
