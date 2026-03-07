"use client";

import React from 'react';
import ModelBuilderForm from '@/components/dashboard/model-management/ModelBuilderForm';
import { BomItemType } from '@/components/dashboard/model-management/modelSchemas'; // Import BomItemType from modelSchemas
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation'; // Added useRouter and useParams
import { Button } from '@/components/ui/button'; // Added Button import

// Define a type for the form data, aligning with ModelFormData structure for bomItems
interface SimplePlankDetails { // Based on PlankDetailsSchemaFrontend output (nullable)
  name?: string | null;
  widthLogic?: string | null;
  lengthLogic?: string | null;
  materialCode?: string | null;
  grainDirection?: string | null;
  packetNumber?: number | null;
  plankLocationIdentifier?: string | null;
  edgeBandingType?: string | null; // 'CEB' | 'IEB'
  edgeBanding?: {
    top?: { thickness: 1 | 2; materialCode: string };
    bottom?: { thickness: 1 | 2; materialCode: string };
    left?: { thickness: 1 | 2; materialCode: string };
    right?: { thickness: 1 | 2; materialCode: string };
  } | null;
}

interface SimplePlankBomItem {
  itemName: string;
  itemType: BomItemType.PLANK; // Specific literal type
  itemDescription?: string | null;
  itemLogicScript?: string | null;
  details: SimplePlankDetails | null;
}

type SimpleBomItem = SimplePlankBomItem;

type SimpleBoxModelData = {
  modelType: string;
  description: string | null;
  imageUrl: string | null;
  inputParameters?: Array<{
    inputName: string;
    displayLabel?: string | null;
    inputType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'SELECT' | 'SELECT_MATERIAL';
    defaultValue?: string | null;
    options?: string | null;
    unit?: string | null;
    description?: string | null;
  }>;
  bomItems?: SimpleBomItem[];
};

const simpleBoxDefaultData: SimpleBoxModelData = {
  modelType: "Simple Box",
  description: "A basic rectangular box model with configurable dimensions and material thickness.",
  imageUrl: null, // Assuming "url" from YAML is a placeholder
  inputParameters: [
    {
      inputName: "boxHeight",
      displayLabel: "Box Height",
      inputType: "NUMBER",
      unit: "mm",
      defaultValue: "700",
      description: "Overall height of the box. Range: Minimum 250mm, Maximum 2400mm.",
      options: null,
    },
    {
      inputName: "boxWidth",
      displayLabel: "Box Width",
      inputType: "NUMBER",
      unit: "mm",
      defaultValue: "600",
      description: "Overall width of the box. Range: (Min: 250mm, Max: 2400mm)",
      options: null,
    },
    {
      inputName: "boxDepth",
      displayLabel: "Box Depth",
      inputType: "NUMBER",
      unit: "mm",
      defaultValue: "550",
      description: "Overall depth of the box. Range: (Min: 250mm, Max: 750mm)",
      options: null,
    },
    {
      inputName: "leftAdjacency",
      displayLabel: "Left Adjacency",
      inputType: "SELECT",
      defaultValue: "Expose",
      description: "Specify what is to the left of this box. This affects panel design and material.",
      options: "Expose,Wall,Box",
      unit: null,
    },
    {
      inputName: "rightAdjacency",
      displayLabel: "Right Adjacency",
      inputType: "SELECT",
      defaultValue: "Expose",
      description: "Specify what is to the right of this box. This affects panel design and material.",
      options: "Expose,Wall,Box",
      unit: null,
    },
    {
      inputName: "exposeMaterialCode",
      displayLabel: "Exposed Surfaces Material Code",
      inputType: "SELECT_MATERIAL",
      defaultValue: "none",
      description: "Material code for surfaces of the box that are visible from the outside. This choice determines the material's thickness (ET) and laminate code (ELC). ValueHint: Select from the list of approved materials available in the project's material library.",
      options: null,
      unit: null,
    },
    {
      inputName: "innerMaterialCode",
      displayLabel: "Internal Surfaces Material Code",
      inputType: "SELECT_MATERIAL",
      defaultValue: "none",
      description: "Material code for internal surfaces of the box. This choice determines the material's thickness (IT) and laminate code (ILC). ValueHint: Select from the list of approved materials available in the project's material library.",
      options: null,
      unit: null,
    },
    {
      inputName: "backMaterialCode",
      displayLabel: "Back Panel Material Code",
      inputType: "SELECT_MATERIAL",
      defaultValue: "none",
      description: "Material code for the back panel of the box. This choice determines the material's thickness (BT) and laminate code (BLC). ValueHint: Select from the list of approved materials available in the project's material library.",
      options: null,
      unit: null,
    }
  ],
  bomItems: [
    {
      itemName: "Left Panel",
      itemType: BomItemType.PLANK,
      itemDescription: "The vertical panel on the left side of the box.",
      details: { name: "Left Panel", edgeBanding: {} },
      itemLogicScript: `
function calculateProperties(runtimeInputs, globalConstants) {
  const { boxHeight, boxDepth, leftAdjacency, exposeMaterialCode, innerMaterialCode, backMaterialCode, exposeMaterialDefinition, innerMaterialDefinition, backMaterialDefinition, doorMaterialDefinition } = runtimeInputs;
  const boxNumber = "B1";
  const exposeEdgeBandingThickness = 2;
  const innerEdgeBandingThickness = 1;
  const T3 = "T3_ToolCode";
  const T6 = "T6_ToolCode";
  const T7 = "T7_ToolCode";
  const T8 = "T8_ToolCode";
  const T9 = "T9_ToolCode";
  const T10 = "T10_ToolCode";

  const ET = exposeMaterialDefinition?.overallMaterialThickness_mm || 0;
  const IT = innerMaterialDefinition?.overallMaterialThickness_mm || 0;
  const BT = backMaterialDefinition?.overallMaterialThickness_mm || 0;
  const doorPanel_thickness = doorMaterialDefinition?.overallMaterialThickness_mm || ET; // Assume door uses expose material if not specified

  const ELC = exposeMaterialDefinition?.code || exposeMaterialCode;
  const ILC = innerMaterialDefinition?.code || innerMaterialCode;
  
  let plankWidth, plankHeight, materialCodeToUse, plankThicknessActual, grainDirection;
  const itemName = "Left Panel";
  const packetNumber = "1";
  const plankLocation = "LT";
  const leftPlank_edgeBandingThickness = (leftAdjacency === 'Expose') ? exposeEdgeBandingThickness : innerEdgeBandingThickness;

  if (leftAdjacency === 'Expose') {
    plankWidth = boxDepth - doorPanel_thickness - (2 * leftPlank_edgeBandingThickness);
    materialCodeToUse = ELC;
    plankThicknessActual = ET;
    grainDirection = exposeMaterialDefinition?.grainDirection || 'Vertical';
  } else {
    plankWidth = boxDepth - doorPanel_thickness - BT - (2 * leftPlank_edgeBandingThickness);
    materialCodeToUse = ILC;
    plankThicknessActual = IT;
    grainDirection = innerMaterialDefinition?.grainDirection || 'Vertical';
  }
  plankHeight = boxHeight - (2 * leftPlank_edgeBandingThickness);
  const plankId = boxNumber + ':P' + packetNumber + ':' + plankLocation;

  let screwHoles = [];
  if (leftAdjacency !== 'Expose') {
    screwHoles = [
      { x: plankWidth / 4, y: (IT / 2) - leftPlank_edgeBandingThickness, z: -0.01, toolCode: T3 },
      { x: plankWidth / 2, y: (IT / 2) - leftPlank_edgeBandingThickness, z: -0.01, toolCode: T3 },
      { x: 3 * plankWidth / 4, y: (IT / 2) - leftPlank_edgeBandingThickness, z: -0.01, toolCode: T3 },
      { x: plankWidth / 4, y: plankHeight - (IT / 2) - leftPlank_edgeBandingThickness, z: -0.01, toolCode: T3 },
      { x: plankWidth / 2, y: plankHeight - (IT / 2) - leftPlank_edgeBandingThickness, z: -0.01, toolCode: T3 },
      { x: 3 * plankWidth / 4, y: plankHeight - (IT / 2) - leftPlank_edgeBandingThickness, z: -0.01, toolCode: T3 },
    ];
  }

  let vbScrewHoles = [];
  if (leftAdjacency === 'Expose') {
    vbScrewHoles.push({ x: 50 - ET, y: plankHeight - IT + 9 + ET, z: ET - 11, toolCode: T6 });
    vbScrewHoles.push({ x: plankWidth - 50 + ET, y: plankHeight - IT + 9 + ET, z: ET - 11, toolCode: T6 });
    if (plankWidth > 450) {
      vbScrewHoles.push({ x: plankWidth / 2, y: plankHeight - IT + 9 + ET, z: ET - 11, toolCode: T6 });
    }
  }
  vbScrewHoles.push({ x: 50 - ET, y: IT - 9 - ET, z: ET - 11, toolCode: T6 });
  vbScrewHoles.push({ x: plankWidth - 50 + ET, y: IT - 9 - ET, z: ET - 11, toolCode: T6 });
  if (plankWidth > 450) {
    vbScrewHoles.push({ x: plankWidth / 2, y: IT - 9 - ET, z: ET - 11, toolCode: T6 });
  }

  let backPanelGroove = [];
  let toolForGroove;
  if (BT === 8) toolForGroove = T7;
  else if (BT === 10) toolForGroove = T8;
  else if (BT === 12) toolForGroove = T9;
  else if (BT === 14) toolForGroove = T10;
  if (toolForGroove) {
    backPanelGroove = [{ 
      startX: plankWidth - (BT / 2) + ET, 
      startY: 0 - ET, 
      endX: plankWidth - (BT / 2) + ET, 
      endY: plankHeight - ET, 
      depth: 10, 
      toolCode: toolForGroove 
    }];
  }

  return { plankId, name: itemName, width: parseFloat(plankWidth.toFixed(2)), height: parseFloat(plankHeight.toFixed(2)), thickness: plankThicknessActual, materialCode: materialCodeToUse, grainDirection, screwHoles, vbScrewHoles, backPanelGroove };
}`.trim(),
    },
    {
      itemName: "Right Panel",
      itemType: BomItemType.PLANK,
      itemDescription: "The vertical panel on the right side of the box.",
      details: { name: "Right Panel", edgeBanding: {} },
      itemLogicScript: `
function calculateProperties(runtimeInputs, globalConstants) {
  const { boxHeight, boxDepth, rightAdjacency, exposeMaterialCode, innerMaterialCode, backMaterialCode, exposeMaterialDefinition, innerMaterialDefinition, backMaterialDefinition, doorMaterialDefinition } = runtimeInputs;
  const boxNumber = "B1";
  const exposeEdgeBandingThickness = 2;
  const innerEdgeBandingThickness = 1;
  const T3 = "T3_ToolCode";
  const T6 = "T6_ToolCode";
  const T7 = "T7_ToolCode";
  const T8 = "T8_ToolCode";
  const T9 = "T9_ToolCode";
  const T10 = "T10_ToolCode";

  const ET = exposeMaterialDefinition?.overallMaterialThickness_mm || 0;
  const IT = innerMaterialDefinition?.overallMaterialThickness_mm || 0;
  const BT = backMaterialDefinition?.overallMaterialThickness_mm || 0;
  const doorPanel_thickness = doorMaterialDefinition?.overallMaterialThickness_mm || ET;

  const ELC = exposeMaterialDefinition?.code || exposeMaterialCode;
  const ILC = innerMaterialDefinition?.code || innerMaterialCode;

  let plankWidth, plankHeight, materialCodeToUse, plankThicknessActual, grainDirection;
  const itemName = "Right Panel";
  const packetNumber = "1";
  const plankLocation = "RT";
  const rightPlank_edgeBandingThickness = (rightAdjacency === 'Expose') ? exposeEdgeBandingThickness : innerEdgeBandingThickness;

  if (rightAdjacency === 'Expose') {
    plankWidth = boxDepth - doorPanel_thickness - (2 * rightPlank_edgeBandingThickness);
    materialCodeToUse = ELC;
    plankThicknessActual = ET;
    grainDirection = exposeMaterialDefinition?.grainDirection || 'Vertical';
  } else {
    plankWidth = boxDepth - doorPanel_thickness - BT - (2 * rightPlank_edgeBandingThickness);
    materialCodeToUse = ILC;
    plankThicknessActual = IT;
    grainDirection = innerMaterialDefinition?.grainDirection || 'Vertical';
  }
  plankHeight = boxHeight - (2 * rightPlank_edgeBandingThickness);
  const plankId = boxNumber + ':P' + packetNumber + ':' + plankLocation;

  let screwHoles = [];
  if (rightAdjacency !== 'Expose') {
    screwHoles = [
      { x: plankWidth / 4, y: (IT / 2) - rightPlank_edgeBandingThickness, z: -0.01, toolCode: T3 },
      { x: plankWidth / 2, y: (IT / 2) - rightPlank_edgeBandingThickness, z: -0.01, toolCode: T3 },
      { x: 3 * plankWidth / 4, y: (IT / 2) - rightPlank_edgeBandingThickness, z: -0.01, toolCode: T3 },
      { x: plankWidth / 4, y: plankHeight - (IT / 2) - rightPlank_edgeBandingThickness, z: -0.01, toolCode: T3 },
      { x: plankWidth / 2, y: plankHeight - (IT / 2) - rightPlank_edgeBandingThickness, z: -0.01, toolCode: T3 },
      { x: 3 * plankWidth / 4, y: plankHeight - (IT / 2) - rightPlank_edgeBandingThickness, z: -0.01, toolCode: T3 },
    ];
  }

  let vbScrewHoles = [];
  if (rightAdjacency === 'Expose') {
    vbScrewHoles.push({ x: 50 - ET, y: plankHeight - IT + 9 + ET, z: ET - 11, toolCode: T6 });
    vbScrewHoles.push({ x: plankWidth - 50 + ET, y: plankHeight - IT + 9 + ET, z: ET - 11, toolCode: T6 });
    if (plankWidth > 450) {
      vbScrewHoles.push({ x: plankWidth / 2, y: plankHeight - IT + 9 + ET, z: ET - 11, toolCode: T6 });
    }
  }
  vbScrewHoles.push({ x: 50 - ET, y: IT - 9 - ET, z: ET - 11, toolCode: T6 });
  vbScrewHoles.push({ x: plankWidth - 50 + ET, y: IT - 9 - ET, z: ET - 11, toolCode: T6 });
  if (plankWidth > 450) {
    vbScrewHoles.push({ x: plankWidth / 2, y: IT - 9 - ET, z: ET - 11, toolCode: T6 });
  }
  
  let backPanelGroove = [];
  let toolForGroove;
  if (BT === 8) toolForGroove = T7;
  else if (BT === 10) toolForGroove = T8;
  else if (BT === 12) toolForGroove = T9;
  else if (BT === 14) toolForGroove = T10;
  if (toolForGroove) {
    backPanelGroove = [{ 
      startX: plankWidth - (BT / 2) + ET, 
      startY: 0 - ET, 
      endX: plankWidth - (BT / 2) + ET, 
      endY: plankHeight - ET, 
      depth: 10, 
      toolCode: toolForGroove 
    }];
  }

  return { plankId, name: itemName, width: parseFloat(plankWidth.toFixed(2)), height: parseFloat(plankHeight.toFixed(2)), thickness: plankThicknessActual, materialCode: materialCodeToUse, grainDirection, screwHoles, vbScrewHoles, backPanelGroove };
}`.trim(),
    },
    {
      itemName: "Top Panel",
      itemType: BomItemType.PLANK,
      itemDescription: "Top panel of the box.",
      details: { name: "Top Panel", edgeBanding: {} },
      itemLogicScript: `
function calculateProperties(runtimeInputs, globalConstants) {
  const { boxWidth, boxDepth, leftAdjacency, rightAdjacency, exposeMaterialCode, innerMaterialCode, backMaterialCode, exposeMaterialDefinition, innerMaterialDefinition, backMaterialDefinition, doorMaterialDefinition } = runtimeInputs;
  // Assuming leftPanel.thickness and rightPanel.thickness are effectively ET or IT based on adjacency
  const leftPanel_thickness = (leftAdjacency === 'Expose') ? (exposeMaterialDefinition?.overallMaterialThickness_mm || 0) : (innerMaterialDefinition?.overallMaterialThickness_mm || 0);
  const rightPanel_thickness = (rightAdjacency === 'Expose') ? (exposeMaterialDefinition?.overallMaterialThickness_mm || 0) : (innerMaterialDefinition?.overallMaterialThickness_mm || 0);

  const boxNumber = "B1";
  const innerEdgeBandingThickness = 1; // From YAML modelScopedVariables for internal edges

  const IT = innerMaterialDefinition?.overallMaterialThickness_mm || 0;
  const BT = backMaterialDefinition?.overallMaterialThickness_mm || 0;
  const doorPanel_thickness = doorMaterialDefinition?.overallMaterialThickness_mm || (exposeMaterialDefinition?.overallMaterialThickness_mm || 0);
  const ILC = innerMaterialDefinition?.code || innerMaterialCode;

  const itemName = "Top Panel";
  const packetNumber = "1";
  const plankLocation = "TP";
  
  let plankWidth = boxDepth - (2 * innerEdgeBandingThickness) - BT - doorPanel_thickness;
  let plankHeight = boxWidth - (2 * innerEdgeBandingThickness) - leftPanel_thickness - rightPanel_thickness;
  
  const plankMaterialCodeToUse = ILC;
  const plankThicknessActual = IT;
  const grainDirection = innerMaterialDefinition?.grainDirection || 'Horizontal'; // Typically horizontal for top/bottom
  const plankId = boxNumber + ':P' + packetNumber + ':' + plankLocation;

  let vbMainHoles = [];
  // Logic from YAML for vbMainHolesLogic (Top Panel)
  // Note: YAML logic for vbMainHoles seems to be for connecting to side panels.
  // The coordinates are relative to the Top Panel itself.
  if (leftAdjacency === 'Expose') { // Holes for connection to Left Exposed Panel
    vbMainHoles.push({ x: 9.5 - IT, y: 50 - IT, z: IT - 14, toolCode: 'T6' }); // Assuming T6 for VB
    vbMainHoles.push({ x: 9.5 - IT, y: plankHeight - 50 + IT, z: IT - 14, toolCode: 'T6' });
    if (plankHeight > 450) { vbMainHoles.push({ x: 9.5 - IT, y: plankHeight / 2, z: IT - 14, toolCode: 'T6' }); }
  }
  if (rightAdjacency === 'Expose') { // Holes for connection to Right Exposed Panel
    vbMainHoles.push({ x: plankWidth - 9.5 + IT, y: 50 - IT, z: IT - 14, toolCode: 'T6' });
    vbMainHoles.push({ x: plankWidth - 9.5 + IT, y: plankHeight - 50 + IT, z: IT - 14, toolCode: 'T6' });
    if (plankHeight > 450) { vbMainHoles.push({ x: plankWidth - 9.5 + IT, y: plankHeight / 2, z: IT - 14, toolCode: 'T6' }); }
  }
  // If adjacency is not 'Expose', different hole patterns or no holes might be needed.
  // The YAML logic only shows 'Expose' cases. For simplicity, only implementing these.

  return { plankId, name: itemName, width: parseFloat(plankWidth.toFixed(2)), height: parseFloat(plankHeight.toFixed(2)), thickness: plankThicknessActual, materialCode: plankMaterialCodeToUse, grainDirection, screwHoles: [], vbScrewHoles: vbMainHoles, backPanelGroove: [] };
}`.trim(),
    },
    {
      itemName: "Bottom Panel",
      itemType: BomItemType.PLANK,
      itemDescription: "Bottom panel of the box.",
      details: { name: "Bottom Panel", edgeBanding: {} },
      itemLogicScript: `
function calculateProperties(runtimeInputs, globalConstants) {
  const { boxWidth, boxDepth, leftAdjacency, rightAdjacency, exposeMaterialCode, innerMaterialCode, backMaterialCode, exposeMaterialDefinition, innerMaterialDefinition, backMaterialDefinition, doorMaterialDefinition } = runtimeInputs;
  const leftPanel_thickness = (leftAdjacency === 'Expose') ? (exposeMaterialDefinition?.overallMaterialThickness_mm || 0) : (innerMaterialDefinition?.overallMaterialThickness_mm || 0);
  const rightPanel_thickness = (rightAdjacency === 'Expose') ? (exposeMaterialDefinition?.overallMaterialThickness_mm || 0) : (innerMaterialDefinition?.overallMaterialThickness_mm || 0);

  const boxNumber = "B1";
  const innerEdgeBandingThickness = 1;

  const IT = innerMaterialDefinition?.overallMaterialThickness_mm || 0;
  const BT = backMaterialDefinition?.overallMaterialThickness_mm || 0;
  const doorPanel_thickness = doorMaterialDefinition?.overallMaterialThickness_mm || (exposeMaterialDefinition?.overallMaterialThickness_mm || 0);
  const ILC = innerMaterialDefinition?.code || innerMaterialCode;

  const itemName = "Bottom Panel";
  const packetNumber = "1";
  const plankLocation = "BT";

  let plankWidth = boxDepth - (2 * innerEdgeBandingThickness) - BT - doorPanel_thickness;
  let plankHeight = boxWidth - (2 * innerEdgeBandingThickness) - leftPanel_thickness - rightPanel_thickness;
  
  const plankMaterialCodeToUse = ILC;
  const plankThicknessActual = IT;
  const grainDirection = innerMaterialDefinition?.grainDirection || 'Horizontal';
  const plankId = boxNumber + ':P' + packetNumber + ':' + plankLocation;
  
  let vbMainHoles = []; // Same logic as Top Panel for VB holes
  if (leftAdjacency === 'Expose') {
    vbMainHoles.push({ x: 9.5 - IT, y: 50 - IT, z: IT - 14, toolCode: 'T6' });
    vbMainHoles.push({ x: 9.5 - IT, y: plankHeight - 50 + IT, z: IT - 14, toolCode: 'T6' });
    if (plankHeight > 450) { vbMainHoles.push({ x: 9.5 - IT, y: plankHeight / 2, z: IT - 14, toolCode: 'T6' }); }
  }
  if (rightAdjacency === 'Expose') {
    vbMainHoles.push({ x: plankWidth - 9.5 + IT, y: 50 - IT, z: IT - 14, toolCode: 'T6' });
    vbMainHoles.push({ x: plankWidth - 9.5 + IT, y: plankHeight - 50 + IT, z: IT - 14, toolCode: 'T6' });
    if (plankHeight > 450) { vbMainHoles.push({ x: plankWidth - 9.5 + IT, y: plankHeight / 2, z: IT - 14, toolCode: 'T6' }); }
  }

  return { plankId, name: itemName, width: parseFloat(plankWidth.toFixed(2)), height: parseFloat(plankHeight.toFixed(2)), thickness: plankThicknessActual, materialCode: plankMaterialCodeToUse, grainDirection, screwHoles: [], vbScrewHoles: vbMainHoles, backPanelGroove: [] };
}`.trim(),
    },
    {
      itemName: "Back Panel",
      itemType: BomItemType.PLANK,
      itemDescription: "Back panel of the box, typically thinner and fits into grooves.",
      details: { name: "Back Panel", edgeBanding: {} },
      itemLogicScript: `
function calculateProperties(runtimeInputs, globalConstants) {
  const { boxWidth, boxHeight, leftAdjacency, rightAdjacency, exposeMaterialCode, innerMaterialCode, backMaterialCode, exposeMaterialDefinition, innerMaterialDefinition, backMaterialDefinition } = runtimeInputs;
  const boxNumber = "B1";
  
  const ET = exposeMaterialDefinition?.overallMaterialThickness_mm || 0; // outerMaterialCode.thickness in YAML
  const IT = innerMaterialDefinition?.overallMaterialThickness_mm || 0;
  const BT = backMaterialDefinition?.overallMaterialThickness_mm || 0;
  const BLC = backMaterialDefinition?.code || backMaterialCode; // innerMaterialCode.laminateCode in YAML, but back panel should use its own material

  const itemName = "Back Panel";
  const packetNumber = "1";
  const plankLocation = "BK";
  const grooveDepth = 10; // Assuming '10' is groove depth from YAML logic

  let plankWidth;
  if (leftAdjacency === 'Expose' && rightAdjacency === 'Expose') { 
    plankWidth = boxWidth - (2 * (ET - grooveDepth)); 
  } else if (leftAdjacency === 'Expose' || rightAdjacency === 'Expose') { 
    plankWidth = boxWidth - (ET - grooveDepth) - (IT - grooveDepth); // Adjusted for one exposed, one internal
  } else { 
    plankWidth = boxWidth - (2 * (IT - grooveDepth)); 
  }
  
  let plankHeight = boxHeight; // YAML: boxHeight, assuming full height before grooving.
                               // If it fits into grooves in top/bottom, this might need adjustment.
                               // For now, using full boxHeight.

  const plankMaterialCodeToUse = BLC;
  const plankThicknessActual = BT;
  const grainDirection = backMaterialDefinition?.grainDirection || 'Vertical';
  const plankId = boxNumber + ':P' + packetNumber + ':' + plankLocation;

  return { plankId, name: itemName, width: parseFloat(plankWidth.toFixed(2)), height: parseFloat(plankHeight.toFixed(2)), thickness: plankThicknessActual, materialCode: plankMaterialCodeToUse, grainDirection, screwHoles: [], vbScrewHoles: [], backPanelGroove: [] };
}`.trim(),
    },
    {
      itemName: "Door Panel",
      itemType: BomItemType.PLANK,
      itemDescription: "Door panel of the box. Can be single or double based on width.",
      details: { name: "Door Panel", edgeBanding: {} },
      itemLogicScript: `
function calculateProperties(runtimeInputs, globalConstants) {
  const { boxWidth, boxHeight, exposeMaterialCode, exposeMaterialDefinition } = runtimeInputs;
  const boxNumber = "B1";
  const exposeEdgeBandingThickness = 2; // Assuming door uses exposed edge banding

  const ET = exposeMaterialDefinition?.overallMaterialThickness_mm || 0;
  const ELC = exposeMaterialDefinition?.code || exposeMaterialCode;

  const itemName = "Door Panel";
  const packetNumber = "1"; // Could be different
  const plankLocation = "DR";
  const doorPanel_edgeBandingThickness = exposeEdgeBandingThickness; // from YAML assumption

  let plankWidth;
  if (boxWidth <= 600) { // Single door
    plankWidth = boxWidth - (2 * doorPanel_edgeBandingThickness);
  } else { // Double door (width per door)
    plankWidth = (boxWidth / 2) - (2 * doorPanel_edgeBandingThickness);
  }
  
  let plankHeight = boxHeight - (2 * doorPanel_edgeBandingThickness);

  const plankMaterialCodeToUse = ELC;
  const plankThicknessActual = ET;
  const grainDirection = exposeMaterialDefinition?.grainDirection || 'Vertical';
  const plankId = boxNumber + ':P' + packetNumber + ':' + plankLocation;

  // Door panels typically don't have screw holes/VB holes/grooves in this context,
  // but depend on hinge hardware. Leaving these empty.
  return { plankId, name: itemName, width: parseFloat(plankWidth.toFixed(2)), height: parseFloat(plankHeight.toFixed(2)), thickness: plankThicknessActual, materialCode: plankMaterialCodeToUse, grainDirection, screwHoles: [], vbScrewHoles: [], backPanelGroove: [] };
}`.trim(),
    },
  ],
};

export default function CreateModelPage() {
  const router = useRouter();
  const params = useParams();
  // const projectId = params.id as string; // projectId not used in this component directly

  const handleSaveSuccess = (modelId: string) => {
    console.log(`Model created with ID: ${modelId}, redirecting...`);
    router.push('/dashboard/catalogue');
  };

  const handleCancel = () => {
    router.push('/dashboard/catalogue');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/catalogue">
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Back to Catalogue</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-semibold text-dark-text-bw">Create New Model</h1>
          <p className="text-dark-text-bw/70">
            Define the details of your new furniture model.
          </p>
        </div>
      </div>

      <div className="max-w-full"> {/* Changed from max-w-7xl to full for better form layout */}
        <ModelBuilderForm
          initialData={simpleBoxDefaultData} // Pass the default data for a new "Simple Box"
          onSaveSuccess={handleSaveSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
