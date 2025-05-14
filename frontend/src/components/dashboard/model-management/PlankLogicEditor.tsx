"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import CollapsibleVariables from './CollapsibleVariables';
import ExpressionInput from './ExpressionInput';

interface RuntimeInput {
  inputName: string;
  displayLabel?: string | null;
  description?: string | null;
  inputType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'SELECT';
  options?: string | null;
  defaultValue?: string | null;
  unit?: string | null;
}

type EdgeBandingType = 'CEB' | 'IEB';

interface PlankLogicEditorProps {
  bomItemIndex: number;
  runtimeInputs: RuntimeInput[];
  globalConstants: Record<string, any>;
  sampleRuntimeInputsJson?: string | null;
}

const DEFAULT_GLOBAL_CONSTANTS = {
  MATERIAL_THICKNESS: {
    expose: 18,  // External/exposed plank thickness
    inner: 18,   // Internal plank thickness
    back: 6      // Back panel thickness
  },
  EDGE_BANDING: {
    INNER_EDGEBANDING: 1,  // Internal edge banding thickness
    COLOR_EDGEBANDING: 2   // Exposed/color edge banding thickness
  }
};

export default function PlankLogicEditor({
  bomItemIndex,
  runtimeInputs,
  globalConstants,
}: PlankLogicEditorProps) {
  const { watch, setValue } = useFormContext();

  // Initialize default values if empty
  React.useEffect(() => {
    const widthLogic = watch(`bomItems.${bomItemIndex}.details.widthLogic`);
    const lengthLogic = watch(`bomItems.${bomItemIndex}.details.lengthLogic`);
    const materialCode = watch(`bomItems.${bomItemIndex}.details.materialCode`);
    const edgeBandingType = watch(`bomItems.${bomItemIndex}.details.edgeBandingType`);
    const packetNumber = watch(`bomItems.${bomItemIndex}.details.packetNumber`);

    const defaultLogic = {
      width: `// Assign to 'Width'
if (leftAdjacency === 'Expose') {
  Width = boxDepth - MATERIAL_THICKNESS.expose - 
         (2 * EDGE_BANDING.COLOR_EDGEBANDING);
} else {
  Width = boxDepth - MATERIAL_THICKNESS.inner - 
         (2 * EDGE_BANDING.INNER_EDGEBANDING);
}`,
      height: `// Assign to 'Height'
if (leftAdjacency === 'Expose') {
  Height = boxHeight - (2 * EDGE_BANDING.COLOR_EDGEBANDING);
} else {
  Height = boxHeight - skirting - 
         (2 * EDGE_BANDING.INNER_EDGEBANDING);
}`,
      material: `// Assign to 'Material'
if (leftAdjacency === 'Expose') {
  Material = outerMaterialCode;
} else {
  Material = innerMaterialCode;
}`
    };

    if (!widthLogic) setValue(`bomItems.${bomItemIndex}.details.widthLogic`, defaultLogic.width);
    if (!lengthLogic) setValue(`bomItems.${bomItemIndex}.details.lengthLogic`, defaultLogic.height);
    if (!materialCode) setValue(`bomItems.${bomItemIndex}.details.materialCode`, defaultLogic.material);
    if (!edgeBandingType) setValue(`bomItems.${bomItemIndex}.details.edgeBandingType`, 'IEB');
    if (!packetNumber) setValue(`bomItems.${bomItemIndex}.details.packetNumber`, 1);
  }, [bomItemIndex, setValue, watch]);

  return (
    <div className="space-y-6">
      {/* Variables Reference */}
      <CollapsibleVariables
        runtimeInputs={runtimeInputs}
        globalConstants={{
          ...DEFAULT_GLOBAL_CONSTANTS,
          ...globalConstants
        }}
      />

      {/* Basic Properties */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Packet Number */}
        <div>
          <label htmlFor={`bomItems.${bomItemIndex}.details.packetNumber`} className="block text-sm font-medium text-gray-700 mb-1">
            Packet Number
          </label>
          <input
            type="number"
            min="1"
            id={`bomItems.${bomItemIndex}.details.packetNumber`}
            {...useFormContext().register(`bomItems.${bomItemIndex}.details.packetNumber`, {
              valueAsNumber: true,
              min: 1
            })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* Plank Location Identifier */}
        <div>
          <label htmlFor={`bomItems.${bomItemIndex}.details.plankLocationIdentifier`} className="block text-sm font-medium text-gray-700 mb-1">
            Plank Location (2 letters)
          </label>
          <input
            type="text"
            maxLength={2}
            id={`bomItems.${bomItemIndex}.details.plankLocationIdentifier`}
            {...useFormContext().register(`bomItems.${bomItemIndex}.details.plankLocationIdentifier`)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm uppercase"
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        {/* Edge Banding Type */}
        <div>
          <label htmlFor={`bomItems.${bomItemIndex}.details.edgeBandingType`} className="block text-sm font-medium text-gray-700 mb-1">
            Edge Banding Thickness
          </label>
          <select
            id={`bomItems.${bomItemIndex}.details.edgeBandingType`}
            {...useFormContext().register(`bomItems.${bomItemIndex}.details.edgeBandingType`)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="CEB">Color Edge Banding - CEB - 2 mm</option>
            <option value="IEB">Inner Edge Banding - IEB - 1 mm</option>
          </select>
        </div>
      </div>

      {/* Width Calculation */}
      <ExpressionInput
        label="Width Calculation"
        value={watch(`bomItems.${bomItemIndex}.details.widthLogic`) || ''}
        onChange={(value) => setValue(`bomItems.${bomItemIndex}.details.widthLogic`, value)}
        runtimeInputs={runtimeInputs}
        globalConstants={{
          ...DEFAULT_GLOBAL_CONSTANTS,
          ...globalConstants
        }}
      />

      {/* Length/Height Calculation */}
      <ExpressionInput
        label="Length Calculation"
        value={watch(`bomItems.${bomItemIndex}.details.lengthLogic`) || ''}
        onChange={(value) => setValue(`bomItems.${bomItemIndex}.details.lengthLogic`, value)}
        runtimeInputs={runtimeInputs}
        globalConstants={{
          ...DEFAULT_GLOBAL_CONSTANTS,
          ...globalConstants
        }}
      />

      {/* Material Code Logic */}
      <ExpressionInput
        label="Material Code"
        value={watch(`bomItems.${bomItemIndex}.details.materialCode`) || ''}
        onChange={(value) => setValue(`bomItems.${bomItemIndex}.details.materialCode`, value)}
        runtimeInputs={runtimeInputs}
        globalConstants={{
          ...DEFAULT_GLOBAL_CONSTANTS,
          ...globalConstants
        }}
      />
    </div>
  );
}
