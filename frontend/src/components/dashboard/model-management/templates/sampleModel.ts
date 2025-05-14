import { Model } from '@/types/plankTypes';

export const SAMPLE_MODEL: Model = {
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
      description: "Left side top panel with color edge banding",
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
      description: "Right side top panel with color edge banding",
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
