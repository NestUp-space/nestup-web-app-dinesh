"use client";

import React from 'react';
import ModelBuilderForm, { BomItemType } from '@/components/dashboard/model-management/ModelBuilderForm'; // Assuming BomItemType is exported
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation'; // Added useRouter and useParams
import { Button } from '@/components/dashboard/button'; // Added Button import

// Define a type for the form data, mirroring ModelFormData from ModelBuilderForm.tsx
type SimpleBoxModelData = {
  modelType: string;
  description: string | null;
  imageUrl: string | null;
  inputParameters?: Array<{
    inputName: string;
    displayLabel?: string | null;
    inputType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'SELECT';
    defaultValue?: string | null;
    options?: string | null;
    unit?: string | null;
    description?: string | null;
  }>;
  bomItems?: Array<{
    itemName: string;
    itemType: BomItemType;
    itemDescription?: string | null;
    itemLogicScript?: string | null;
    details?: any | null; // Assuming details can be any JSON structure or null
    addonModelId?: string | null;
  }>;
};

const simpleBoxDefaultData: SimpleBoxModelData = {
  modelType: 'Simple Box',
  description: 'A basic rectangular box with five planks: back, left, right, top, and bottom. Suitable for simple storage units, cabinets, and shelving.',
  imageUrl: null, // Changed from '/img/models/simple-box.png' to null as the image is missing
  inputParameters: [ // Based on defaultModelInputParameters from ModelBuilderForm
    { inputName: 'boxHeight', displayLabel: 'Box Height', inputType: 'NUMBER', defaultValue: '600', unit: 'mm', description: 'The overall height of the box.' },
    { inputName: 'boxWidth', displayLabel: 'Box Width', inputType: 'NUMBER', defaultValue: '700', unit: 'mm', description: 'The overall width of the box.' },
    { inputName: 'boxDepth', displayLabel: 'Box Depth', inputType: 'NUMBER', defaultValue: '550', unit: 'mm', description: 'The overall depth of the box.' },
    { inputName: 'leftAdjacency', displayLabel: 'Left Side Adjacency', inputType: 'SELECT', defaultValue: 'Expose', options: 'Expose,Wall,AdjacentBox', description: 'Defines how the left side of the box is finished.' },
    { inputName: 'rightAdjacency', displayLabel: 'Right Side Adjacency', inputType: 'SELECT', defaultValue: 'Expose', options: 'Expose,Wall,AdjacentBox', description: 'Defines how the right side of the box is finished.' },
    { inputName: 'outerMaterialCode', displayLabel: 'Outer Material', inputType: 'SELECT', defaultValue: '', description: 'Material code for external surfaces. Will use the first available material if none selected.' },
    { inputName: 'innerMaterialCode', displayLabel: 'Inner Material', inputType: 'SELECT', defaultValue: '', description: 'Material code for internal surfaces. Will use the first available material if none selected.' },
    { inputName: 'backMaterialCode', displayLabel: 'Back Panel Material', inputType: 'TEXT', defaultValue: 'BACK_MAT_01', description: 'Material code for the back panel.' },
    { inputName: 'hasDoor', displayLabel: 'Has Door?', inputType: 'BOOLEAN', defaultValue: 'false', description: 'Indicates if the box includes a door.' },
    { inputName: 'doorExposedSide', displayLabel: 'Door Exposed Side', inputType: 'SELECT', defaultValue: 'Front', options: 'Front,Left,Right', description: 'Specifies which side the door is on.' },
    { inputName: 'numberOfShelves', displayLabel: 'Number of Shelves', inputType: 'NUMBER', defaultValue: '0', description: 'Number of internal shelves.' },
    { inputName: 'skirting', displayLabel: 'Skirting', inputType: 'NUMBER', defaultValue: '0', description: 'Type of skirting.' }
  ],
  bomItems: [
    {
      itemName: 'Left Side Panel',
      itemType: BomItemType.PLANK,
      itemDescription: 'The main left vertical panel of the box.',
      details: null,
      itemLogicScript: `
function calculateProperties(runtimeInputs, globalConstants) {
  const { boxHeight, boxDepth, leftAdjacency, skirting, outerMaterialDefinition, innerMaterialDefinition, backMaterialDefinition } = runtimeInputs;
  const { edgeBandingExposedThickness, edgeBandingInternalThickness } = globalConstants;
  const BH = boxHeight; const BD = boxDepth; const LE = leftAdjacency; const SKT = skirting || 0;
  const ET = outerMaterialDefinition.overallMaterialThickness_mm; const IT = innerMaterialDefinition.overallMaterialThickness_mm; const BT = backMaterialDefinition.overallMaterialThickness_mm;
  const ELC = outerMaterialDefinition.code; const ILC = innerMaterialDefinition.code;
  const CEB = edgeBandingExposedThickness; const IEB = edgeBandingInternalThickness;
  let plankWidth, plankHeight, materialCode, plankThickness, grainDirection;
  const name = 'Left Plank'; const plankId = 'B1P1_L';
  if (LE === 'Expose') {
    plankWidth = BD - ET - (2 * CEB); plankHeight = BH - (2 * CEB); materialCode = ELC; plankThickness = ET; grainDirection = outerMaterialDefinition.grainDirection;
  } else {
    plankWidth = BD - IT - BT - (2 * IEB); plankHeight = BH - SKT - (2 * IEB); materialCode = ILC; plankThickness = IT; grainDirection = innerMaterialDefinition.grainDirection;
  }
  return { plankId, name, width: parseFloat(plankWidth.toFixed(2)), height: parseFloat(plankHeight.toFixed(2)), thickness: plankThickness, materialCode, grainDirection, screwHoles: [], vbScrewHoles: [], backPanelGroove: null };
}`.trim(),
    },
    {
      itemName: 'Right Side Panel',
      itemType: BomItemType.PLANK,
      itemDescription: 'The main right vertical panel of the box.',
      details: null,
      itemLogicScript: `
function calculateProperties(runtimeInputs, globalConstants) {
  const { boxHeight, boxDepth, rightAdjacency, skirting, outerMaterialDefinition, innerMaterialDefinition, backMaterialDefinition } = runtimeInputs;
  const { edgeBandingExposedThickness, edgeBandingInternalThickness } = globalConstants;
  const BH = boxHeight; const BD = boxDepth; const RE = rightAdjacency; const SKT = skirting || 0;
  const ET = outerMaterialDefinition.overallMaterialThickness_mm; const IT = innerMaterialDefinition.overallMaterialThickness_mm; const BT = backMaterialDefinition.overallMaterialThickness_mm;
  const ELC = outerMaterialDefinition.code; const ILC = innerMaterialDefinition.code;
  const CEB = edgeBandingExposedThickness; const IEB = edgeBandingInternalThickness;
  let plankWidth, plankHeight, materialCode, plankThickness, grainDirection;
  const name = 'Right Plank'; const plankId = 'B1P1_R';
  if (RE === 'Expose') {
    plankWidth = BD - ET - (2 * CEB); plankHeight = BH - (2 * CEB); materialCode = ELC; plankThickness = ET; grainDirection = outerMaterialDefinition.grainDirection;
  } else {
    plankWidth = BD - IT - BT - (2 * IEB); plankHeight = BH - SKT - (2 * IEB); materialCode = ILC; plankThickness = IT; grainDirection = innerMaterialDefinition.grainDirection;
  }
  return { plankId, name, width: parseFloat(plankWidth.toFixed(2)), height: parseFloat(plankHeight.toFixed(2)), thickness: plankThickness, materialCode, grainDirection, screwHoles: [], vbScrewHoles: [], backPanelGroove: null };
}`.trim(),
    },
    {
      itemName: 'Top Panel',
      itemType: BomItemType.PLANK,
      itemDescription: 'The main top horizontal panel of the box.',
      details: null,
      itemLogicScript: `
function calculateProperties(runtimeInputs, globalConstants) {
  const { boxWidth, boxDepth, leftAdjacency, rightAdjacency, outerMaterialDefinition, innerMaterialDefinition, backMaterialDefinition } = runtimeInputs;
  const { edgeBandingInternalThickness } = globalConstants;
  const BW = boxWidth; const BD = boxDepth; const LE = leftAdjacency; const RE = rightAdjacency;
  const ET = outerMaterialDefinition.overallMaterialThickness_mm; const IT = innerMaterialDefinition.overallMaterialThickness_mm; const BT = backMaterialDefinition.overallMaterialThickness_mm;
  const ILC = innerMaterialDefinition.code; const IEB = edgeBandingInternalThickness;
  let plankWidth, plankHeight;
  const name = 'Top Plank'; const plankId = 'B1P1_T'; const materialCode = ILC; const plankThickness = IT; const grainDirection = innerMaterialDefinition.grainDirection;
  if (LE === 'Expose' && RE === 'Expose') { plankWidth = BW - (2 * ET) - (2 * IEB); }
  else if (LE === 'Expose' || RE === 'Expose') { plankWidth = BW - ET - IT - (2 * IEB); }
  else { plankWidth = BW - (2 * IT) - (2 * IEB); }
  plankHeight = BD - BT - (2 * IEB);
  return { plankId, name, width: parseFloat(plankWidth.toFixed(2)), height: parseFloat(plankHeight.toFixed(2)), thickness: plankThickness, materialCode, grainDirection, screwHoles: [], vbScrewHoles: [], backPanelGroove: null };
}`.trim(),
    },
    {
      itemName: 'Bottom Panel',
      itemType: BomItemType.PLANK,
      itemDescription: 'The main bottom horizontal panel of the box.',
      details: null,
      itemLogicScript: `
function calculateProperties(runtimeInputs, globalConstants) {
  const { boxWidth, boxDepth, leftAdjacency, rightAdjacency, outerMaterialDefinition, innerMaterialDefinition, backMaterialDefinition } = runtimeInputs;
  const { edgeBandingInternalThickness } = globalConstants;
  const BW = boxWidth; const BD = boxDepth; const LE = leftAdjacency; const RE = rightAdjacency;
  const ET = outerMaterialDefinition.overallMaterialThickness_mm; const IT = innerMaterialDefinition.overallMaterialThickness_mm; const BT = backMaterialDefinition.overallMaterialThickness_mm;
  const ILC = innerMaterialDefinition.code; const IEB = edgeBandingInternalThickness;
  let plankWidth, plankHeight;
  const name = 'Bottom Plank'; const plankId = 'B1P1_B'; const materialCode = ILC; const plankThickness = IT; const grainDirection = innerMaterialDefinition.grainDirection;
  if (LE === 'Expose' && RE === 'Expose') { plankWidth = BW - (2 * ET) - (2 * IEB); }
  else if (LE === 'Expose' || RE === 'Expose') { plankWidth = BW - ET - IT - (2 * IEB); }
  else { plankWidth = BW - (2 * IT) - (2 * IEB); }
  plankHeight = BD - BT - (2 * IEB);
  return { plankId, name, width: parseFloat(plankWidth.toFixed(2)), height: parseFloat(plankHeight.toFixed(2)), thickness: plankThickness, materialCode, grainDirection, screwHoles: [], vbScrewHoles: [], backPanelGroove: null };
}`.trim(),
    },
    {
      itemName: 'Back Panel',
      itemType: BomItemType.PLANK,
      itemDescription: 'The rear closing panel of the box.',
      details: null,
      itemLogicScript: `
function calculateProperties(runtimeInputs, globalConstants) {
  const { boxWidth, boxHeight, leftAdjacency, rightAdjacency, skirting, outerMaterialDefinition, innerMaterialDefinition, backMaterialDefinition } = runtimeInputs;
  const BW = boxWidth; const BH = boxHeight; const LE = leftAdjacency; const RE = rightAdjacency; const SKT = skirting || 0;
  const ET = outerMaterialDefinition.overallMaterialThickness_mm; const IT = innerMaterialDefinition.overallMaterialThickness_mm; const BT = backMaterialDefinition.overallMaterialThickness_mm;
  const BLC = backMaterialDefinition.code;
  let plankWidth, plankHeight;
  const name = 'Back Plank'; const plankId = 'B1P1_BP'; const materialCode = BLC; const plankThickness = BT; const grainDirection = backMaterialDefinition.grainDirection;
  const grooveDepthInSidePanel = 10;
  if (LE === 'Expose' && RE === 'Expose') { plankWidth = BW - 2 * ET + 2 * grooveDepthInSidePanel; }
  else if (LE === 'Expose' || RE === 'Expose') { plankWidth = BW - ET - IT + 2 * grooveDepthInSidePanel; }
  else { plankWidth = BW - 2 * IT + 2 * grooveDepthInSidePanel; }
  plankHeight = BH - SKT - (2 * IT) + (2 * grooveDepthInSidePanel);
  return { plankId, name, width: parseFloat(plankWidth.toFixed(2)), height: parseFloat(plankHeight.toFixed(2)), thickness: plankThickness, materialCode, grainDirection, screwHoles: [], vbScrewHoles: [], backPanelGroove: null };
}`.trim(),
    },
  ],
};

export default function CreateModelPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

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
          initialData={simpleBoxDefaultData} 
          onSaveSuccess={handleSaveSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
