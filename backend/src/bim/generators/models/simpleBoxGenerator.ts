import {
  GlobalRules,
  ModelDefinition,
  Plank,
  SimpleBoxInputs,
} from '../../types/bim.types';

import {
  getMaterialThickness,
  // calculateEdgeBanding, // Will not be used, specific logic implemented
  // calculateAdjustedWidth, // Will not be used, specific logic implemented
  createDummyPanel, // May still be used or adapted
  // createDoorPanel // Will not be used, specific logic implemented
} from '../generatorUtils';

/**
 * @description Generates planks for a Simple Box model based on detailed rules.
 * @param model The Simple Box model definition
 * @param inputs The runtime inputs for the Simple Box model
 * @param rules The global BIM rules
 * @param boxNumber The box number for ID generation
 * @param packetNumber The packet number for ID generation (e.g., P1)
 * @returns Array of planks with calculated dimensions and properties
 */
export function generatePlanks(
  model: ModelDefinition,
  inputs: SimpleBoxInputs,
  rules: GlobalRules,
  boxNumber: string = '1',
  packetNumber: string = '1',
): Plank[] {
  // Validate required inputs (basic check, more specific checks can be added)
  if (
    !inputs.boxHeight ||
    !inputs.boxWidth ||
    !inputs.boxDepth ||
    !inputs.innerMaterialCode ||
    !inputs.backMaterialCode ||
    !inputs.outerMaterialCode // Assuming outer material is also generally required
  ) {
    throw new Error('Missing required inputs for Simple Box.');
  }

  const BH = inputs.boxHeight;
  const BW = inputs.boxWidth;
  const BD = inputs.boxDepth;
  const LE = inputs.leftAdjacency;
  const RE = inputs.rightAdjacency;
  const SKT = inputs.skirting;
  const S = inputs.numberOfShelves;
  const ILC = inputs.innerMaterialCode;
  const ELC = inputs.outerMaterialCode;
  const BLC = inputs.backMaterialCode;
  const CLC = inputs.door?.hasDoor ? ELC : ''; // Assuming door uses outer material code for now

  // Fetch Material Thicknesses
  const IT = getMaterialThickness(ILC, model);
  const ET = getMaterialThickness(ELC, model);
  const BT = getMaterialThickness(BLC, model);
  // const CT = CLC ? getMaterialThickness(CLC, model) : 0; // Door thickness if needed

  // Fetch Edge Banding Thicknesses from GlobalRules
  const CEB = rules.edgeBandingRules.exposedOrOuterLaminate.thickness_mm;
  const IEB = rules.edgeBandingRules.notExposedOrInnerLaminate.thickness_mm;

  const generatedPlanks: Plank[] = [];

  // --- 1. Left Plank ---
  const leftPlankTemplate = model.planks.find(p => p.name === 'Left Plank');
  if (leftPlankTemplate) {
    const leftPlank: Plank = { ...leftPlankTemplate, holes: [], grooves: [] };
    leftPlank.plankId = `B${boxNumber}P${packetNumber}_L`;

    if (LE === 'Expose') {
      leftPlank.width = BD - ET - 2 * CEB;
      leftPlank.height = BH - 2 * CEB;
      leftPlank.materialCode = ELC;
    } else { // Box or Wall
      leftPlank.width = BD - ET - BT - 2 * IEB;
      leftPlank.height = BH - SKT - 2 * IEB;
      leftPlank.materialCode = ILC;
    }
    leftPlank.thickness = LE === 'Expose' ? ET : IT; // Assuming this logic for thickness

    // Screw Holes for Left Plank
    if (LE !== 'Expose') {
      leftPlank.holes?.push({ x: leftPlank.width / 4, y: SKT + IT / 2 - ET, z: -0.01, t: 'T3' });
      leftPlank.holes?.push({ x: leftPlank.width / 2, y: SKT + IT / 2 - ET, z: -0.01, t: 'T3' });
      leftPlank.holes?.push({ x: (3 * leftPlank.width) / 4, y: SKT + IT / 2 - ET, z: -0.01, t: 'T3' });
      leftPlank.holes?.push({ x: leftPlank.width / 4, y: leftPlank.height - IT / 2 - ET, z: -0.01, t: 'T3' });
      leftPlank.holes?.push({ x: leftPlank.width / 2, y: leftPlank.height - IT / 2 - ET, z: -0.01, t: 'T3' });
      leftPlank.holes?.push({ x: (3 * leftPlank.width) / 4, y: leftPlank.height - IT / 2 - ET, z: -0.01, t: 'T3' });
    }

    // VB Screw Holes for Left Plank
    if (LE === 'Expose') {
      leftPlank.holes?.push({ x: 50 - CEB, y: leftPlank.height - IT + 9 + CEB, z: ET - 11, t: 'T6' });
      leftPlank.holes?.push({ x: leftPlank.width - 50 + CEB, y: leftPlank.height - IT + 9 + CEB, z: ET - 11, t: 'T6' });
      if (leftPlank.width > 450) {
        leftPlank.holes?.push({ x: leftPlank.width / 2, y: leftPlank.height - IT + 9 + CEB, z: ET - 11, t: 'T6' });
      }
    }
    if (SKT === 0 && LE === 'Expose') { // Added LE === 'Expose' condition based on context
      leftPlank.holes?.push({ x: 50 - CEB, y: IT - 9 - CEB, z: ET - 11, t: 'T6' });
      leftPlank.holes?.push({ x: leftPlank.width - 50 + CEB, y: IT - 9 - CEB, z: ET - 11, t: 'T6' });
      if (leftPlank.width > 450) {
        leftPlank.holes?.push({ x: leftPlank.width / 2, y: IT - 9 - CEB, z: ET - 11, t: 'T6' });
      }
    }
    
    // Back Panel Groove for Left Plank
    let grooveTypeL = '';
    if (BT === 8) grooveTypeL = 'T7';
    else if (BT === 10) grooveTypeL = 'T8';
    else if (BT === 12) grooveTypeL = 'T9';
    else if (BT === 14) grooveTypeL = 'T10';
    if (grooveTypeL) {
        leftPlank.grooves?.push({ x1: leftPlank.width - BT / 2 + CEB, y1: SKT - CEB, x2: leftPlank.width - BT / 2 + CEB, y2: leftPlank.height - CEB, z: 10, t: grooveTypeL });
    }
    // TODO: Add specific edge banding logic for Left Plank based on rules
    generatedPlanks.push(leftPlank);
  }

  // --- 2. Top Plank ---
  const topPlankTemplate = model.planks.find(p => p.name === 'Top Plank');
  if (topPlankTemplate) {
    const topPlank: Plank = { ...topPlankTemplate, holes: [], grooves: [] };
    topPlank.plankId = `B${boxNumber}P${packetNumber}_T`; // Corrected ID
    topPlank.materialCode = ILC;
    topPlank.thickness = IT; // Assuming this logic for thickness

    if (LE === 'Expose' && RE === 'Expose') {
      topPlank.width = BW - IEB - ET;
    } else if (LE === 'Expose' || RE === 'Expose') {
      topPlank.width = BW - 2 * IEB - ET - IT;
    } else { // LE != Expose && RE != Expose
      topPlank.width = BW - 2 * IEB - 2 * IT;
    }
    topPlank.height = BD - 2 * IT - BT - ET; // This formula seems unusual, usually depth related. Re-check. Assuming it's correct as per rules.

    // VB Main Holes for Top Plank
    if (LE === 'Expose') {
      topPlank.holes?.push({ x: 9.5 - IT, y: 50 - IT, z: IT - 14, t: 'T_VB_LE' }); // Added type for clarity
      topPlank.holes?.push({ x: 9.5 - IT, y: topPlank.height - 50 + IT, z: IT - 14, t: 'T_VB_LE' });
      if (topPlank.height > 450) {
        topPlank.holes?.push({ x: 9.5 - IT, y: topPlank.height / 2, z: IT - 14, t: 'T_VB_LE' });
      }
    }
    if (RE === 'Expose') {
      topPlank.holes?.push({ x: topPlank.width - 9.5 + IT, y: 50 - IT, z: IT - 14, t: 'T_VB_RE' });
      topPlank.holes?.push({ x: topPlank.width - 9.5 + IT, y: topPlank.height - 50 + IT, z: IT - 14, t: 'T_VB_RE' });
      if (topPlank.height > 450) {
        topPlank.holes?.push({ x: topPlank.width - 9.5 + IT, y: topPlank.height / 2, z: IT - 14, t: 'T_VB_RE' });
      }
    }
    // TODO: Add specific edge banding logic for Top Plank
    generatedPlanks.push(topPlank);
  }

  // --- 3. Right Plank ---
  const rightPlankTemplate = model.planks.find(p => p.name === 'Right Plank');
  if (rightPlankTemplate) {
    const rightPlank: Plank = { ...rightPlankTemplate, holes: [], grooves: [] };
    rightPlank.plankId = `B${boxNumber}P${packetNumber}_R`;

    if (RE === 'Expose') {
      rightPlank.width = BD - ET - 2 * CEB;
      rightPlank.height = BH - 2 * CEB;
      rightPlank.materialCode = ELC;
    } else { // Box or Wall
      rightPlank.width = BD - ET - BT - 2 * IEB;
      rightPlank.height = BH - SKT - 2 * IEB;
      rightPlank.materialCode = ILC;
    }
    rightPlank.thickness = RE === 'Expose' ? ET : IT; // Assuming this logic for thickness

    // Screw Holes for Right Plank
    if (RE !== 'Expose') {
        rightPlank.holes?.push({ x: rightPlank.width / 4, y: SKT + IT / 2 - ET, z: -0.01, t: 'T3' });
        rightPlank.holes?.push({ x: rightPlank.width / 2, y: SKT + IT / 2 - ET, z: -0.01, t: 'T3' });
        rightPlank.holes?.push({ x: (3 * rightPlank.width) / 4, y: SKT + IT / 2 - ET, z: -0.01, t: 'T3' });
        rightPlank.holes?.push({ x: rightPlank.width / 4, y: rightPlank.height - IT / 2 - ET, z: -0.01, t: 'T3' });
        rightPlank.holes?.push({ x: rightPlank.width / 2, y: rightPlank.height - IT / 2 - ET, z: -0.01, t: 'T3' });
        rightPlank.holes?.push({ x: (3 * rightPlank.width) / 4, y: rightPlank.height - IT / 2 - ET, z: -0.01, t: 'T3' });
    }

    // VB Screw Holes for Right Plank
    if (RE === 'Expose') {
      rightPlank.holes?.push({ x: 50 - CEB, y: rightPlank.height - IT + 9 + CEB, z: ET - 11, t: 'T6' });
      rightPlank.holes?.push({ x: rightPlank.width - 50 + CEB, y: rightPlank.height - IT + 9 + CEB, z: ET - 11, t: 'T6' });
      if (rightPlank.width > 450) {
        rightPlank.holes?.push({ x: rightPlank.width / 2, y: rightPlank.height - IT + 9 + CEB, z: ET - 11, t: 'T6' });
      }
    }
     if (SKT === 0 && RE === 'Expose') { // Added RE === 'Expose' condition
      rightPlank.holes?.push({ x: 50 - CEB, y: IT - 9 - CEB, z: ET - 11, t: 'T6' });
      rightPlank.holes?.push({ x: rightPlank.width - 50 + CEB, y: IT - 9 - CEB, z: ET - 11, t: 'T6' });
      if (rightPlank.width > 450) {
        rightPlank.holes?.push({ x: rightPlank.width / 2, y: IT - 9 - CEB, z: ET - 11, t: 'T6' });
      }
    }

    // Back Panel Groove for Right Plank
    let grooveTypeR = '';
    if (BT === 8) grooveTypeR = 'T7';
    else if (BT === 10) grooveTypeR = 'T8';
    else if (BT === 12) grooveTypeR = 'T9';
    else if (BT === 14) grooveTypeR = 'T10';
    if (grooveTypeR) {
        rightPlank.grooves?.push({ x1: rightPlank.width - BT / 2 + CEB, y1: SKT - CEB, x2: rightPlank.width - BT / 2 + CEB, y2: rightPlank.height - CEB, z: 10, t: grooveTypeR });
    }
    // TODO: Add specific edge banding logic for Right Plank
    generatedPlanks.push(rightPlank);
  }

  // --- 4. Bottom Plank ---
  const bottomPlankTemplate = model.planks.find(p => p.name === 'Bottom Plank');
  if (bottomPlankTemplate) {
    const bottomPlank: Plank = { ...bottomPlankTemplate, holes: [], grooves: [] };
    bottomPlank.plankId = `B${boxNumber}P${packetNumber}_B`; // Corrected ID
    bottomPlank.materialCode = ILC;
    bottomPlank.thickness = IT; // Assuming this logic for thickness

    if (LE === 'Expose' && RE === 'Expose') {
      bottomPlank.width = BW - IEB - ET;
    } else if (LE === 'Expose' || RE === 'Expose') {
      bottomPlank.width = BW - 2 * IEB - ET - IT;
    } else { // LE != Expose && RE != Expose
      bottomPlank.width = BW - 2 * IEB - 2 * IT;
    }
    bottomPlank.height = BD - 2 * IT - BT - ET; // This formula seems unusual, re-check. Assuming it's correct as per rules.

    // VB Main Holes for Bottom Plank
    if (LE === 'Expose') {
      bottomPlank.holes?.push({ x: 9.5 - IT, y: 50 - IT, z: IT - 14, t: 'B_VB_LE' }); // Added type for clarity
      bottomPlank.holes?.push({ x: 9.5 - IT, y: bottomPlank.height - 50 + IT, z: IT - 14, t: 'B_VB_LE' });
      if (bottomPlank.height > 450) {
        bottomPlank.holes?.push({ x: 9.5 - IT, y: bottomPlank.height / 2, z: IT - 14, t: 'B_VB_LE' });
      }
    }
    if (RE === 'Expose') {
      bottomPlank.holes?.push({ x: bottomPlank.width - 9.5 + IT, y: 50 - IT, z: IT - 14, t: 'B_VB_RE' });
      bottomPlank.holes?.push({ x: bottomPlank.width - 9.5 + IT, y: bottomPlank.height - 50 + IT, z: IT - 14, t: 'B_VB_RE' });
      if (bottomPlank.height > 450) {
        bottomPlank.holes?.push({ x: bottomPlank.width - 9.5 + IT, y: bottomPlank.height / 2, z: IT - 14, t: 'B_VB_RE' });
      }
    }
    // TODO: Add specific edge banding logic for Bottom Plank
    generatedPlanks.push(bottomPlank);
  }

  // --- 5. Back Panel ---
  const backPlankTemplate = model.planks.find(p => p.name === 'Back Plank');
  if (backPlankTemplate) {
    const backPlank: Plank = { ...backPlankTemplate, holes: [], grooves: [] };
    backPlank.plankId = `B${boxNumber}P${packetNumber}_BP`; // Changed identifier to BP for Back Panel
    backPlank.materialCode = BLC; // As per rules, MC = BLC (Back Laminate Code)
    backPlank.thickness = BT; // Back panel thickness

    if (LE === 'Expose' && RE === 'Expose') {
      backPlank.width = BW - 2 * (ET - 10);
    } else if (LE === 'Expose' || RE === 'Expose') {
      backPlank.width = BW - (ET - 10);
    } else { // LE != Expose && RE != Expose
      backPlank.width = BW;
    }
    backPlank.height = BH - SKT;
    // No holes or grooves specified for back panel in the rules, but can be added if needed.
    // TODO: Add specific edge banding logic for Back Panel if any
    generatedPlanks.push(backPlank);
  }

  // --- 6. Door Plank ---
  if (inputs.door?.hasDoor) {
    const doorPlankTemplate = model.planks.find(p => p.name === 'Door Plank');
    if (doorPlankTemplate) {
      const doorPlank: Plank = { ...doorPlankTemplate, holes: [], grooves: [] };
      doorPlank.plankId = `B${boxNumber}P${packetNumber}_D`;
      doorPlank.materialCode = CLC; // Assuming CLC is outer material or specific door material
      doorPlank.thickness = ET; // Assuming door uses outer material thickness

      if (BW <= 600) {
        doorPlank.width = BW - (2 + CEB); // 2mm clearance
      } else { // BW > 600
        doorPlank.width = BW / 2 - (2 + CEB); // For double doors, this is one leaf
        // Note: The rules imply one door plank. If two are needed for BW > 600, this logic needs duplication or adjustment.
      }
      doorPlank.height = BH - (2 + CEB + SKT); // 2mm clearance

      // No holes or grooves specified for door panel in the rules.
      // TODO: Add specific edge banding logic for Door Plank (likely all edges CEB)
      generatedPlanks.push(doorPlank);
      // If double door for BW > 600, potentially add a second door plank here.
      // For now, assuming the rule generates one plank (or one leaf of a double door)
    }
  }
  
  // --- Shelves ---
  if (S > 0) {
    // Shelf width calculation needs to be similar to Top/Bottom planks
    let shelfWidth = 0;
     if (LE === 'Expose' && RE === 'Expose') {
      shelfWidth = BW - IEB - ET; // This might need to be BW - 2*ET if shelves sit between exposed panels
    } else if (LE === 'Expose' || RE === 'Expose') {
      // One side exposed, other side internal. Shelf sits between an outer panel and an inner panel.
      shelfWidth = BW - ET - IT - (2 * IEB); // Approximation, depends on exact construction
    } else { // Both sides internal
      shelfWidth = BW - 2 * IT - (2 * IEB);
    }
    // Shelf depth is usually BD - BT (if it stops at back panel) - some clearance
    const shelfDepth = BD - BT - (IEB*2); // Approximation, assuming it fits inside and has back clearance

    for (let i = 0; i < S; i++) {
      generatedPlanks.push({
        plankId: `B${boxNumber}P${packetNumber}_S${i + 1}`,
        name: `Shelf ${i + 1}`,
        width: shelfWidth, 
        height: shelfDepth, // This is depth of shelf
        materialCode: ILC,
        grainDirection: 'horizontal', // Assuming
        thickness: IT,
        edgeBanding: { // Example: Front edge banded with IEB
          top: 'none',
          right: 'none',
          bottom: 'none', // Or IEB + 'mm' if bottom front edge is also banded
          left: IEB + 'mm', 
        },
        holes: [], // Add shelf support holes if rules are provided
        grooves: [],
      });
    }
  }

  // Add dummy panels if needed (using existing utility for now, can be refined)
  if (LE === 'Wall' && rules.adjacencyRules.wallSide.dummyPanelRequired) {
    generatedPlanks.push(createDummyPanel(
      'Left',
      BH, // Box Height
      rules.adjacencyRules.wallSide.dummyWidthOnSheet_mm || 75,
      ILC,
      IT,
      rules,
      boxNumber,
      packetNumber
    ));
  }

  if (RE === 'Wall' && rules.adjacencyRules.wallSide.dummyPanelRequired) {
    generatedPlanks.push(createDummyPanel(
      'Right',
      BH, // Box Height
      rules.adjacencyRules.wallSide.dummyWidthOnSheet_mm || 75,
      ILC,
      IT,
      rules,
      boxNumber,
      packetNumber
    ));
  }

  return generatedPlanks;
}
