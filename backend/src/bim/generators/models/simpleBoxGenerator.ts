import {
  GlobalRules,
  ModelDefinition,
  Plank,
  SimpleBoxInputs
} from '../../types/bim.types';

import {
  getMaterialThickness,
  calculateEdgeBanding,
  calculateAdjustedWidth,
  createDummyPanel,
  createDoorPanel
} from '../generatorUtils';

/**
 * @description Generates planks for a Simple Box model
 * @param model The Simple Box model definition
 * @param inputs The runtime inputs for the Simple Box model
 * @param rules The global BIM rules
 * @returns Array of planks with calculated dimensions and properties
 */
export function generatePlanks(
  model: ModelDefinition,
  inputs: SimpleBoxInputs,
  rules: GlobalRules,
  boxNumber: string = '1',
  packetNumber: string = '1'
): Plank[] {
  // Validate required inputs
  if (!inputs.boxHeight || !inputs.boxWidth || !inputs.boxDepth ||
      !inputs.innerMaterialCode || !inputs.backMaterialCode) {
    throw new Error('Missing required inputs for Simple Box.');
  }

  // Create a deep copy of the model's planks to avoid modifying the original
  const planks: Plank[] = JSON.parse(JSON.stringify(model.planks));

  // Get material thicknesses
  const innerMaterialThickness = getMaterialThickness(inputs.innerMaterialCode, model);
  const backMaterialThickness = getMaterialThickness(inputs.backMaterialCode, model);
  const outerMaterialThickness = inputs.outerMaterialCode ?
    getMaterialThickness(inputs.outerMaterialCode, model) : innerMaterialThickness;

  // Calculate dimensions for each plank based on rules and material properties

  // Back Plank
  const backPlank = planks.find(p => p.name === 'Back Plank');
  if (backPlank) {
    backPlank.plankId = `B${boxNumber}P${packetNumber}_Back`;
    backPlank.height = inputs.boxHeight;
    backPlank.width = inputs.boxWidth;
    backPlank.materialCode = inputs.backMaterialCode;
    backPlank.thickness = backMaterialThickness;
    backPlank.grainDirection = 'vertical'; // Assuming vertical grain for back panel
  }

  // Left Plank
  const leftPlank = planks.find(p => p.name === 'Left Plank');
  if (leftPlank) {
    leftPlank.plankId = `B${boxNumber}P${packetNumber}_Left`;
    leftPlank.height = inputs.boxHeight;
    leftPlank.width = inputs.boxDepth;
    leftPlank.materialCode = inputs.leftAdjacency === "Expose" ?
      inputs.outerMaterialCode : inputs.innerMaterialCode;
    leftPlank.thickness = inputs.leftAdjacency === "Expose" ?
      outerMaterialThickness : innerMaterialThickness;
    leftPlank.grainDirection = 'vertical'; // Assuming vertical grain for side panels

    // Apply edge banding based on adjacency rules
    leftPlank.edgeBanding = calculateEdgeBanding(
      'left',
      inputs.leftAdjacency,
      rules,
      !!inputs.door?.hasDoor && inputs.door?.exposedSide === 'left'
    );
  }

  // Right Plank
  const rightPlank = planks.find(p => p.name === 'Right Plank');
  if (rightPlank) {
    rightPlank.plankId = `B${boxNumber}P${packetNumber}_Right`;
    rightPlank.height = inputs.boxHeight;
    rightPlank.width = inputs.boxDepth;
    rightPlank.materialCode = inputs.rightAdjacency === "Expose" ?
      inputs.outerMaterialCode : inputs.innerMaterialCode;
    rightPlank.thickness = inputs.rightAdjacency === "Expose" ?
      outerMaterialThickness : innerMaterialThickness;
    rightPlank.grainDirection = 'vertical'; // Assuming vertical grain for side panels

    // Apply edge banding based on adjacency rules
    rightPlank.edgeBanding = calculateEdgeBanding(
      'right',
      inputs.rightAdjacency,
      rules,
      !!inputs.door?.hasDoor && inputs.door?.exposedSide === 'right'
    );
  }

  // Calculate adjusted width for top and bottom planks
  // They need to fit between the side panels
  const adjustedWidth = calculateAdjustedWidth(
    inputs.boxWidth,
    inputs.leftAdjacency,
    inputs.rightAdjacency,
    leftPlank?.thickness || innerMaterialThickness,
    rightPlank?.thickness || innerMaterialThickness,
    rules
  );

  // Top Plank
  const topPlank = planks.find(p => p.name === 'Top Plank');
  if (topPlank) {
    topPlank.plankId = `B${boxNumber}P${packetNumber}_Top`;
    topPlank.height = inputs.boxDepth;
    topPlank.width = adjustedWidth;
    topPlank.materialCode = inputs.innerMaterialCode;
    topPlank.thickness = innerMaterialThickness;
    topPlank.grainDirection = 'horizontal'; // Assuming horizontal grain for top/bottom

    // Apply edge banding - top is usually exposed
    topPlank.edgeBanding = {
      top: rules.edgeBandingRules.exposedOrOuterLaminate.thickness_mm + 'mm',
      right: 'none',
      bottom: 'none',
      left: 'none'
    };
  }

  // Bottom Plank
  const bottomPlank = planks.find(p => p.name === 'Bottom Plank');
  if (bottomPlank) {
    bottomPlank.plankId = `B${boxNumber}P${packetNumber}_Bottom`;
    bottomPlank.height = inputs.boxDepth;
    bottomPlank.width = adjustedWidth;
    bottomPlank.materialCode = inputs.innerMaterialCode;
    bottomPlank.thickness = innerMaterialThickness;
    bottomPlank.grainDirection = 'horizontal'; // Assuming horizontal grain for top/bottom

    // Apply edge banding - bottom is usually not exposed
    bottomPlank.edgeBanding = {
      top: 'none',
      right: 'none',
      bottom: rules.edgeBandingRules.notExposedOrInnerLaminate.thickness_mm + 'mm',
      left: 'none'
    };
  }

  // Add shelves if any
  if (inputs.numberOfShelves > 0) {
    for (let i = 0; i < inputs.numberOfShelves; i++) {
      planks.push({
        plankId: `B${boxNumber}P${packetNumber}_Shelf${i + 1}`,
        name: `Shelf ${i + 1}`,
        width: adjustedWidth, // Same width as top/bottom planks
        height: inputs.boxDepth,
        materialCode: inputs.innerMaterialCode, // As per rule: shelf material same as inner MC
        grainDirection: 'horizontal', // Assuming horizontal grain for shelves
        thickness: innerMaterialThickness,
        edgeBanding: {
          top: 'none',
          right: 'none',
          bottom: 'none',
          left: rules.edgeBandingRules.notExposedOrInnerLaminate.thickness_mm + 'mm' // Front edge is usually banded
        }
      });
    }
  }

  // Add dummy panels if needed based on adjacency rules
  if (inputs.leftAdjacency === 'Wall' && rules.adjacencyRules.wallSide.dummyPanelRequired) {
    planks.push(createDummyPanel(
      'Left',
      inputs.boxHeight,
      rules.adjacencyRules.wallSide.dummyWidthOnSheet_mm || 75,
      inputs.innerMaterialCode,
      innerMaterialThickness,
      rules,
      boxNumber,
      packetNumber
    ));
  }

  if (inputs.rightAdjacency === 'Wall' && rules.adjacencyRules.wallSide.dummyPanelRequired) {
    planks.push(createDummyPanel(
      'Right',
      inputs.boxHeight,
      rules.adjacencyRules.wallSide.dummyWidthOnSheet_mm || 75,
      inputs.innerMaterialCode,
      innerMaterialThickness,
      rules,
      boxNumber,
      packetNumber
    ));
  }

  // Add door if specified
  if (inputs.door?.hasDoor) {
    planks.push(createDoorPanel(
      inputs.boxHeight,
      inputs.boxWidth,
      inputs.outerMaterialCode || inputs.innerMaterialCode,
      outerMaterialThickness,
      rules,
      boxNumber,
      packetNumber
    ));
  }

  return planks;
}
