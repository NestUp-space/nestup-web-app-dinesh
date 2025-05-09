import {
  GlobalRules,
  ModelDefinition,
  Plank,
  LShapedBoxInputs
} from '../../types/bim.types';

import {
  getMaterialThickness,
  calculateEdgeBanding,
  calculateAdjustedWidth,
  createDummyPanel,
  createDoorPanel
} from '../generatorUtils';

/**
 * @description Generates planks for an L-Shaped Box model
 * @param model The L-Shaped Box model definition
 * @param inputs The runtime inputs for the L-Shaped Box model
 * @param rules The global BIM rules
 * @returns Array of planks with calculated dimensions and properties
 */
export function generatePlanks(
  model: ModelDefinition,
  inputs: LShapedBoxInputs,
  rules: GlobalRules,
  boxNumber: string = '1',
  packetNumber: string = '1'
): Plank[] {
  // Validate required inputs
  if (!inputs.mainBoxHeight || !inputs.mainBoxWidth || !inputs.mainBoxDepth ||
      !inputs.secondaryBoxHeight || !inputs.secondaryBoxWidth || !inputs.secondaryBoxDepth ||
      !inputs.innerMaterialCode || !inputs.backMaterialCode) {
    throw new Error('Missing required inputs for L-Shaped Box.');
  }

  // Create a deep copy of the model's planks to avoid modifying the original
  const planks: Plank[] = JSON.parse(JSON.stringify(model.planks));

  // Get material thicknesses
  const innerMaterialThickness = getMaterialThickness(inputs.innerMaterialCode, model);
  const backMaterialThickness = getMaterialThickness(inputs.backMaterialCode, model);
  const outerMaterialThickness = inputs.outerMaterialCode ?
    getMaterialThickness(inputs.outerMaterialCode, model) : innerMaterialThickness;

  // Calculate dimensions for each plank based on rules and material properties

  // Main Back Plank
  const mainBackPlank = planks.find(p => p.name === 'Main Back Plank');
  if (mainBackPlank) {
    mainBackPlank.plankId = `B${boxNumber}P${packetNumber}_MainBack`;
    mainBackPlank.height = inputs.mainBoxHeight;
    mainBackPlank.width = inputs.mainBoxWidth;
    mainBackPlank.materialCode = inputs.backMaterialCode;
    mainBackPlank.thickness = backMaterialThickness;
    mainBackPlank.grainDirection = 'vertical';
  }

  // Secondary Back Plank
  const secondaryBackPlank = planks.find(p => p.name === 'Secondary Back Plank');
  if (secondaryBackPlank) {
    secondaryBackPlank.plankId = `B${boxNumber}P${packetNumber}_SecondaryBack`;
    secondaryBackPlank.height = inputs.secondaryBoxHeight;
    secondaryBackPlank.width = inputs.secondaryBoxWidth;
    secondaryBackPlank.materialCode = inputs.backMaterialCode;
    secondaryBackPlank.thickness = backMaterialThickness;
    secondaryBackPlank.grainDirection = 'vertical';
  }

  // Left Outer Plank
  const leftOuterPlank = planks.find(p => p.name === 'Left Outer Plank');
  if (leftOuterPlank) {
    leftOuterPlank.plankId = `B${boxNumber}P${packetNumber}_LeftOuter`;
    leftOuterPlank.height = inputs.mainBoxHeight;
    leftOuterPlank.width = inputs.mainBoxDepth;
    leftOuterPlank.materialCode = inputs.leftAdjacency === "Expose" ?
      inputs.outerMaterialCode : inputs.innerMaterialCode;
    leftOuterPlank.thickness = inputs.leftAdjacency === "Expose" ?
      outerMaterialThickness : innerMaterialThickness;
    leftOuterPlank.grainDirection = 'vertical';

    // Apply edge banding
    leftOuterPlank.edgeBanding = calculateEdgeBanding(
      'left',
      inputs.leftAdjacency,
      rules,
      false
    );
  }

  // Right Outer Plank
  const rightOuterPlank = planks.find(p => p.name === 'Right Outer Plank');
  if (rightOuterPlank) {
    rightOuterPlank.plankId = `B${boxNumber}P${packetNumber}_RightOuter`;
    rightOuterPlank.height = inputs.secondaryBoxHeight;
    rightOuterPlank.width = inputs.secondaryBoxDepth;
    rightOuterPlank.materialCode = inputs.rightAdjacency === "Expose" ?
      inputs.outerMaterialCode : inputs.innerMaterialCode;
    rightOuterPlank.thickness = inputs.rightAdjacency === "Expose" ?
      outerMaterialThickness : innerMaterialThickness;
    rightOuterPlank.grainDirection = 'vertical';

    // Apply edge banding
    rightOuterPlank.edgeBanding = calculateEdgeBanding(
      'right',
      inputs.rightAdjacency,
      rules,
      false
    );
  }

  // Left Inner Plank (shared between main and secondary box)
  const leftInnerPlank = planks.find(p => p.name === 'Left Inner Plank');
  if (leftInnerPlank) {
    leftInnerPlank.plankId = `B${boxNumber}P${packetNumber}_LeftInner`;
    leftInnerPlank.height = Math.max(inputs.mainBoxHeight, inputs.secondaryBoxHeight);
    leftInnerPlank.width = Math.max(inputs.mainBoxDepth, inputs.secondaryBoxDepth);
    leftInnerPlank.materialCode = inputs.innerMaterialCode;
    leftInnerPlank.thickness = innerMaterialThickness;
    leftInnerPlank.grainDirection = 'vertical';

    // Apply edge banding - inner panel usually has minimal edge banding
    leftInnerPlank.edgeBanding = {
      top: rules.edgeBandingRules.notExposedOrInnerLaminate.thickness_mm + 'mm',
      right: 'none',
      bottom: rules.edgeBandingRules.notExposedOrInnerLaminate.thickness_mm + 'mm',
      left: 'none'
    };
  }

  // Calculate adjusted widths for top and bottom planks
  const mainAdjustedWidth = calculateAdjustedWidth(
    inputs.mainBoxWidth,
    inputs.leftAdjacency,
    'Box', // Right side connects to secondary box
    leftOuterPlank?.thickness || innerMaterialThickness,
    innerMaterialThickness, // Inner panel thickness
    rules
  );

  const secondaryAdjustedWidth = calculateAdjustedWidth(
    inputs.secondaryBoxWidth,
    'Box', // Left side connects to main box
    inputs.rightAdjacency,
    innerMaterialThickness, // Inner panel thickness
    rightOuterPlank?.thickness || innerMaterialThickness,
    rules
  );

  // Main Top Plank
  const mainTopPlank = planks.find(p => p.name === 'Main Top Plank');
  if (mainTopPlank) {
    mainTopPlank.plankId = `B${boxNumber}P${packetNumber}_MainTop`;
    mainTopPlank.height = inputs.mainBoxDepth;
    mainTopPlank.width = mainAdjustedWidth;
    mainTopPlank.materialCode = inputs.innerMaterialCode;
    mainTopPlank.thickness = innerMaterialThickness;
    mainTopPlank.grainDirection = 'horizontal';

    // Apply edge banding
    mainTopPlank.edgeBanding = {
      top: rules.edgeBandingRules.exposedOrOuterLaminate.thickness_mm + 'mm',
      right: 'none',
      bottom: 'none',
      left: 'none'
    };
  }

  // Main Bottom Plank
  const mainBottomPlank = planks.find(p => p.name === 'Main Bottom Plank');
  if (mainBottomPlank) {
    mainBottomPlank.plankId = `B${boxNumber}P${packetNumber}_MainBottom`;
    mainBottomPlank.height = inputs.mainBoxDepth;
    mainBottomPlank.width = mainAdjustedWidth;
    mainBottomPlank.materialCode = inputs.innerMaterialCode;
    mainBottomPlank.thickness = innerMaterialThickness;
    mainBottomPlank.grainDirection = 'horizontal';

    // Apply edge banding
    mainBottomPlank.edgeBanding = {
      top: 'none',
      right: 'none',
      bottom: rules.edgeBandingRules.notExposedOrInnerLaminate.thickness_mm + 'mm',
      left: 'none'
    };
  }

  // Secondary Top Plank
  const secondaryTopPlank = planks.find(p => p.name === 'Secondary Top Plank');
  if (secondaryTopPlank) {
    secondaryTopPlank.plankId = `B${boxNumber}P${packetNumber}_SecondaryTop`;
    secondaryTopPlank.height = inputs.secondaryBoxDepth;
    secondaryTopPlank.width = secondaryAdjustedWidth;
    secondaryTopPlank.materialCode = inputs.innerMaterialCode;
    secondaryTopPlank.thickness = innerMaterialThickness;
    secondaryTopPlank.grainDirection = 'horizontal';

    // Apply edge banding
    secondaryTopPlank.edgeBanding = {
      top: rules.edgeBandingRules.exposedOrOuterLaminate.thickness_mm + 'mm',
      right: 'none',
      bottom: 'none',
      left: 'none'
    };
  }

  // Secondary Bottom Plank
  const secondaryBottomPlank = planks.find(p => p.name === 'Secondary Bottom Plank');
  if (secondaryBottomPlank) {
    secondaryBottomPlank.plankId = `B${boxNumber}P${packetNumber}_SecondaryBottom`;
    secondaryBottomPlank.height = inputs.secondaryBoxDepth;
    secondaryBottomPlank.width = secondaryAdjustedWidth;
    secondaryBottomPlank.materialCode = inputs.innerMaterialCode;
    secondaryBottomPlank.thickness = innerMaterialThickness;
    secondaryBottomPlank.grainDirection = 'horizontal';

    // Apply edge banding
    secondaryBottomPlank.edgeBanding = {
      top: 'none',
      right: 'none',
      bottom: rules.edgeBandingRules.notExposedOrInnerLaminate.thickness_mm + 'mm',
      left: 'none'
    };
  }

  // Add shelves if any
  if (inputs.numberOfShelves > 0) {
    // Distribute shelves between main and secondary boxes
    const mainShelves = Math.ceil(inputs.numberOfShelves / 2);
    const secondaryShelves = inputs.numberOfShelves - mainShelves;

    // Add shelves to main box
    for (let i = 0; i < mainShelves; i++) {
      planks.push({
        plankId: `B${boxNumber}P${packetNumber}_MainShelf${i + 1}`,
        name: `Main Shelf ${i + 1}`,
        width: mainAdjustedWidth,
        height: inputs.mainBoxDepth,
        materialCode: inputs.innerMaterialCode,
        grainDirection: 'horizontal',
        thickness: innerMaterialThickness,
        edgeBanding: {
          top: 'none',
          right: 'none',
          bottom: 'none',
          left: rules.edgeBandingRules.notExposedOrInnerLaminate.thickness_mm + 'mm'
        }
      });
    }

    // Add shelves to secondary box
    for (let i = 0; i < secondaryShelves; i++) {
      planks.push({
        plankId: `B${boxNumber}P${packetNumber}_SecondaryShelf${i + 1}`,
        name: `Secondary Shelf ${i + 1}`,
        width: secondaryAdjustedWidth,
        height: inputs.secondaryBoxDepth,
        materialCode: inputs.innerMaterialCode,
        grainDirection: 'horizontal',
        thickness: innerMaterialThickness,
        edgeBanding: {
          top: 'none',
          right: 'none',
          bottom: 'none',
          left: rules.edgeBandingRules.notExposedOrInnerLaminate.thickness_mm + 'mm'
        }
      });
    }
  }

  // Add dummy panels if needed based on adjacency rules
  if (inputs.leftAdjacency === 'Wall' && rules.adjacencyRules.wallSide.dummyPanelRequired) {
    planks.push(createDummyPanel(
      'Left',
      inputs.mainBoxHeight,
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
      inputs.secondaryBoxHeight,
      rules.adjacencyRules.wallSide.dummyWidthOnSheet_mm || 75,
      inputs.innerMaterialCode,
      innerMaterialThickness,
      rules,
      boxNumber,
      packetNumber
    ));
  }

  if (inputs.backAdjacency === 'Wall' && rules.adjacencyRules.wallSide.dummyPanelRequired) {
    // Add dummy panels for back wall if needed
    planks.push(createDummyPanel(
      'Back-Main',
      inputs.mainBoxHeight,
      rules.adjacencyRules.wallSide.dummyWidthOnSheet_mm || 75,
      inputs.innerMaterialCode,
      innerMaterialThickness,
      rules,
      boxNumber,
      packetNumber
    ));

    planks.push(createDummyPanel(
      'Back-Secondary',
      inputs.secondaryBoxHeight,
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
    if (inputs.door.exposedSide === 'main') {
      planks.push(createDoorPanel(
        inputs.mainBoxHeight,
        inputs.mainBoxWidth,
        inputs.outerMaterialCode || inputs.innerMaterialCode,
        outerMaterialThickness,
        rules,
        boxNumber,
        packetNumber
      ));
    } else if (inputs.door.exposedSide === 'secondary') {
      planks.push(createDoorPanel(
        inputs.secondaryBoxHeight,
        inputs.secondaryBoxWidth,
        inputs.outerMaterialCode || inputs.innerMaterialCode,
        outerMaterialThickness,
        rules,
        boxNumber,
        packetNumber
      ));
    }
  }

  return planks;
}
