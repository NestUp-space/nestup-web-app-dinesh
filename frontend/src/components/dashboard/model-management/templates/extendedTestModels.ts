import { Model } from '@/types/plankTypes';
import { SIMPLE_MODEL, COMPLEX_MODEL } from './testModels';

export const CORNER_UNIT_MODEL: Model = {
  id: "corner-unit",
  name: "Corner Unit Model",
  runtimeInputs: [
    { inputName: "boxDepth", displayLabel: "Box Depth (mm)" },
    { inputName: "boxHeight", displayLabel: "Box Height (mm)" },
    { inputName: "boxWidth", displayLabel: "Box Width (mm)" },
    { inputName: "cornerAngle", displayLabel: "Corner Angle (degrees)" },
    { inputName: "leftAdjacency", displayLabel: "Left Side Type" },
    { inputName: "rightAdjacency", displayLabel: "Right Side Type" },
    { inputName: "skirting", displayLabel: "Skirting Height (mm)" },
    { inputName: "outerMaterialCode", displayLabel: "Outer Material Code" },
    { inputName: "innerMaterialCode", displayLabel: "Inner Material Code" }
  ],
  planks: [
    {
      plankNumber: "P1",
      plankIdentifier: "CA",
      displayName: "Corner Angle Panel",
      description: "Angled panel for corner unit",
      order: 1,
      widthLogic: `Width = boxDepth * Math.sin(cornerAngle * Math.PI / 180);`,
      lengthLogic: `Height = boxHeight - skirting;`,
      materialCode: `Material = outerMaterialCode;`
    },
    {
      plankNumber: "P2",
      plankIdentifier: "SP",
      displayName: "Side Panel",
      description: "Side panel with angle cut",
      order: 2,
      widthLogic: `Width = boxWidth - 
         (2 * MATERIAL_THICKNESS.inner) - 
         (2 * EDGE_BANDING.INNER_EDGEBANDING);`,
      lengthLogic: `Height = boxHeight - skirting;`,
      materialCode: `Material = innerMaterialCode;`
    }
  ]
};

export const TALL_UNIT_MODEL: Model = {
  id: "tall-unit",
  name: "Tall Unit Model",
  runtimeInputs: [
    { inputName: "boxDepth", displayLabel: "Box Depth (mm)" },
    { inputName: "boxHeight", displayLabel: "Box Height (mm)" },
    { inputName: "boxWidth", displayLabel: "Box Width (mm)" },
    { inputName: "shelfCount", displayLabel: "Number of Shelves" },
    { inputName: "drawerCount", displayLabel: "Number of Drawers" },
    { inputName: "drawerHeight", displayLabel: "Drawer Height (mm)" },
    { inputName: "leftAdjacency", displayLabel: "Left Side Type" },
    { inputName: "rightAdjacency", displayLabel: "Right Side Type" },
    { inputName: "skirting", displayLabel: "Skirting Height (mm)" },
    { inputName: "outerMaterialCode", displayLabel: "Outer Material Code" },
    { inputName: "innerMaterialCode", displayLabel: "Inner Material Code" }
  ],
  planks: [
    {
      plankNumber: "P1",
      plankIdentifier: "DF",
      displayName: "Drawer Front",
      description: "Drawer front panel",
      order: 1,
      widthLogic: `Width = boxWidth - (2 * MATERIAL_THICKNESS.expose);`,
      lengthLogic: `Height = drawerHeight - (2 * EDGE_BANDING.COLOR_EDGEBANDING);`,
      materialCode: `Material = outerMaterialCode;`
    },
    {
      plankNumber: "P2",
      plankIdentifier: "SH",
      displayName: "Shelf",
      description: "Adjustable shelf",
      order: 2,
      widthLogic: `Width = boxWidth - (2 * MATERIAL_THICKNESS.inner);`,
      lengthLogic: `Height = boxDepth - MATERIAL_THICKNESS.back - 
                   (2 * EDGE_BANDING.INNER_EDGEBANDING);`,
      materialCode: `Material = innerMaterialCode;`
    }
  ]
};

export const EXTENDED_TEST_MODELS = [
  SIMPLE_MODEL,
  COMPLEX_MODEL,
  CORNER_UNIT_MODEL,
  TALL_UNIT_MODEL
];
