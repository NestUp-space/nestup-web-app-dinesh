import { Model } from '@/types/plankTypes';

export const SIMPLE_MODEL: Model = {
  id: "simple-box",
  name: "Simple Box Model",
  runtimeInputs: [
    { inputName: "boxDepth", displayLabel: "Box Depth (mm)" },
    { inputName: "boxHeight", displayLabel: "Box Height (mm)" },
    { inputName: "leftAdjacency", displayLabel: "Left Side Type" },
    { inputName: "rightAdjacency", displayLabel: "Right Side Type" },
    { inputName: "skirting", displayLabel: "Skirting Height (mm)" },
    { inputName: "outerMaterialCode", displayLabel: "Outer Material Code" },
    { inputName: "innerMaterialCode", displayLabel: "Inner Material Code" }
  ],
  planks: [
    {
      plankNumber: "P1",
      plankIdentifier: "LT",
      displayName: "Left Top Panel",
      description: "Left side top panel",
      order: 1,
      widthLogic: `if (leftAdjacency === 'Expose') {
  Width = boxDepth - MATERIAL_THICKNESS.expose - 
         (2 * EDGE_BANDING.COLOR_EDGEBANDING);
} else {
  Width = boxDepth - MATERIAL_THICKNESS.inner - 
         (2 * EDGE_BANDING.INNER_EDGEBANDING);
}`,
      lengthLogic: `if (leftAdjacency === 'Expose') {
  Height = boxHeight - (2 * EDGE_BANDING.COLOR_EDGEBANDING);
} else {
  Height = boxHeight - skirting - 
         (2 * EDGE_BANDING.INNER_EDGEBANDING);
}`,
      materialCode: `if (leftAdjacency === 'Expose') {
  Material = outerMaterialCode;
} else {
  Material = innerMaterialCode;
}`
    },
    {
      plankNumber: "P1",
      plankIdentifier: "RT",
      displayName: "Right Top Panel",
      description: "Right side top panel",
      order: 2,
      widthLogic: `if (rightAdjacency === 'Expose') {
  Width = boxDepth - MATERIAL_THICKNESS.expose - 
         (2 * EDGE_BANDING.COLOR_EDGEBANDING);
} else {
  Width = boxDepth - MATERIAL_THICKNESS.inner - 
         (2 * EDGE_BANDING.INNER_EDGEBANDING);
}`,
      lengthLogic: `if (rightAdjacency === 'Expose') {
  Height = boxHeight - (2 * EDGE_BANDING.COLOR_EDGEBANDING);
} else {
  Height = boxHeight - skirting - 
         (2 * EDGE_BANDING.INNER_EDGEBANDING);
}`,
      materialCode: `if (rightAdjacency === 'Expose') {
  Material = outerMaterialCode;
} else {
  Material = innerMaterialCode;
}`
    }
  ]
};

export const COMPLEX_MODEL: Model = {
  id: "complex-box",
  name: "Complex Box Model",
  runtimeInputs: [
    { inputName: "boxDepth", displayLabel: "Box Depth (mm)" },
    { inputName: "boxHeight", displayLabel: "Box Height (mm)" },
    { inputName: "boxWidth", displayLabel: "Box Width (mm)" },
    { inputName: "leftAdjacency", displayLabel: "Left Side Type" },
    { inputName: "rightAdjacency", displayLabel: "Right Side Type" },
    { inputName: "skirting", displayLabel: "Skirting Height (mm)" },
    { inputName: "shelfCount", displayLabel: "Number of Shelves" },
    { inputName: "outerMaterialCode", displayLabel: "Outer Material Code" },
    { inputName: "innerMaterialCode", displayLabel: "Inner Material Code" }
  ],
  planks: [
    {
      plankNumber: "P1",
      plankIdentifier: "BK",
      displayName: "Back Panel",
      description: "Back panel with minimal thickness",
      order: 1,
      widthLogic: `Width = boxWidth - (2 * MATERIAL_THICKNESS.inner);`,
      lengthLogic: `Height = boxHeight;`,
      materialCode: `Material = innerMaterialCode;`
    },
    {
      plankNumber: "P2",
      plankIdentifier: "TP",
      displayName: "Top Panel",
      description: "Top horizontal panel",
      order: 2,
      widthLogic: `Width = boxWidth;`,
      lengthLogic: `Height = boxDepth - MATERIAL_THICKNESS.back;`,
      materialCode: `Material = innerMaterialCode;`
    },
    {
      plankNumber: "P2",
      plankIdentifier: "BT",
      displayName: "Bottom Panel",
      description: "Bottom horizontal panel",
      order: 3,
      widthLogic: `Width = boxWidth;`,
      lengthLogic: `Height = boxDepth - MATERIAL_THICKNESS.back;`,
      materialCode: `Material = innerMaterialCode;`
    },
    {
      plankNumber: "P3",
      plankIdentifier: "LT",
      displayName: "Left Panel",
      description: "Left side panel",
      order: 4,
      widthLogic: `if (leftAdjacency === 'Expose') {
  Width = boxDepth - 
         (2 * EDGE_BANDING.COLOR_EDGEBANDING);
} else {
  Width = boxDepth - 
         (2 * EDGE_BANDING.INNER_EDGEBANDING);
}`,
      lengthLogic: `if (leftAdjacency === 'Expose') {
  Height = boxHeight - 
         (2 * EDGE_BANDING.COLOR_EDGEBANDING);
} else {
  Height = boxHeight - skirting - 
         (2 * EDGE_BANDING.INNER_EDGEBANDING);
}`,
      materialCode: `if (leftAdjacency === 'Expose') {
  Material = outerMaterialCode;
} else {
  Material = innerMaterialCode;
}`
    },
    {
      plankNumber: "P3",
      plankIdentifier: "RT",
      displayName: "Right Panel",
      description: "Right side panel",
      order: 5,
      widthLogic: `if (rightAdjacency === 'Expose') {
  Width = boxDepth - 
         (2 * EDGE_BANDING.COLOR_EDGEBANDING);
} else {
  Width = boxDepth - 
         (2 * EDGE_BANDING.INNER_EDGEBANDING);
}`,
      lengthLogic: `if (rightAdjacency === 'Expose') {
  Height = boxHeight - 
         (2 * EDGE_BANDING.COLOR_EDGEBANDING);
} else {
  Height = boxHeight - skirting - 
         (2 * EDGE_BANDING.INNER_EDGEBANDING);
}`,
      materialCode: `if (rightAdjacency === 'Expose') {
  Material = outerMaterialCode;
} else {
  Material = innerMaterialCode;
}`
    }
  ]
};

export const TEST_MODELS = [SIMPLE_MODEL, COMPLEX_MODEL];
