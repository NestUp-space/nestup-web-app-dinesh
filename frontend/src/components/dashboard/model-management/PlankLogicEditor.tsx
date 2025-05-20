"use client";

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import CollapsibleVariables from './CollapsibleVariables';
import ExpressionInput from './ExpressionInput';
import { Input } from '@/components/dashboard/input';
import { Label } from '@/components/dashboard/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/dashboard/select';
import { cn } from '@/lib/utils';

interface RuntimeInput {
  inputName: string;
  displayLabel?: string | null;
  description?: string | null;
  inputType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'SELECT' | 'SELECT_MATERIAL'; // Added SELECT_MATERIAL
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
    <div className="space-y-6 p-4 border border-light-bw rounded-md bg-lightest-bw/30 mt-4">
      <h4 className="text-md font-semibold text-dark-text-bw mb-3">Plank Logic Configuration</h4>
      
      <CollapsibleVariables
        runtimeInputs={runtimeInputs}
        globalConstants={{
          ...DEFAULT_GLOBAL_CONSTANTS,
          ...globalConstants
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`bomItems.${bomItemIndex}.details.packetNumber`}>Packet Number</Label>
          <Input
            type="number"
            min="1"
            id={`bomItems.${bomItemIndex}.details.packetNumber`}
            {...useFormContext().register(`bomItems.${bomItemIndex}.details.packetNumber`, {
              valueAsNumber: true,
              min: 1
            })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`bomItems.${bomItemIndex}.details.plankLocationIdentifier`}>Plank Location (2 letters)</Label>
          <Input
            type="text"
            maxLength={2}
            id={`bomItems.${bomItemIndex}.details.plankLocationIdentifier`}
            {...useFormContext().register(`bomItems.${bomItemIndex}.details.plankLocationIdentifier`)}
            className="uppercase" // Tailwind class for uppercase
            // style={{ textTransform: 'uppercase' }} // Redundant if using Tailwind class
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`bomItems.${bomItemIndex}.details.edgeBandingType`}>Edge Banding Thickness</Label>
          <Controller
            control={useFormContext().control}
            name={`bomItems.${bomItemIndex}.details.edgeBandingType`}
            render={({ field: { onChange, value } }) => (
              <Select onValueChange={onChange} value={value}>
                <SelectTrigger id={`bomItems.${bomItemIndex}.details.edgeBandingType`}>
                  <SelectValue placeholder="Select edge banding" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CEB">Color Edge Banding - CEB - 2 mm</SelectItem>
                  <SelectItem value="IEB">Inner Edge Banding - IEB - 1 mm</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

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
