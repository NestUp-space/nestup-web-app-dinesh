"use client";

import React, { useEffect } from 'react';
import { useFormContext, Controller, UseFieldArrayRemove } from 'react-hook-form';
import { Button } from '@/components/dashboard/button';
import { Input } from '@/components/dashboard/input';
import { Label } from '@/components/dashboard/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/dashboard/select';
import { Trash2 } from 'lucide-react';
import PlankLogicEditor from './PlankLogicEditor';
import { BomItemType, ModelFormData } from './ModelBuilderForm'; // Import ModelFormData and BomItemType
import { ModelInputParameterSchema } from './ModelBuilderForm'; // Assuming this is also exported or its type is needed
import { z } from 'zod'; // For inferring sub-types if needed

// Define a type for the input parameters that PlankLogicEditor expects
// This should align with ModelInputParameterSchema from ModelBuilderForm
type RuntimeInputForPlankEditor = {
  inputName: string;
  displayLabel?: string | null;
  inputType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'SELECT' | 'SELECT_MATERIAL';
  options?: string | null;
  defaultValue?: string | null;
  unit?: string | null;
  // description?: string | null; // Add if PlankLogicEditor needs it
};


interface BomItemProps {
  index: number;
  remove: UseFieldArrayRemove;
}

export default function BomItem({ index, remove }: BomItemProps) {
  const { control, register, watch, setValue, formState: { errors } } = useFormContext<ModelFormData>();
  
  const itemTypePath = `bomItems.${index}.itemType` as const;
  const itemNamePath = `bomItems.${index}.itemName` as const;
  const itemDescriptionPath = `bomItems.${index}.itemDescription` as const;
  const addonModelIdPath = `bomItems.${index}.addonModelId` as const;
  const detailsPath = `bomItems.${index}.details` as const;

  const itemTypeWatcher = watch(itemTypePath);
  const currentItemName = watch(itemNamePath) || '';

  useEffect(() => {
    const currentDetails = watch(detailsPath);

    if (itemTypeWatcher === BomItemType.PLANK) {
      let needsUpdate = false;
      let newDetails: any = currentDetails && typeof currentDetails === 'object' ? { ...currentDetails } : {};

      const defaults = {
        name: currentItemName || `Plank ${index + 1}`,
        widthLogic: '',
        lengthLogic: '',
        materialCode: '',
        grainDirection: 'vertical',
        packetNumber: 1,
        plankLocationIdentifier: '',
        edgeBandingType: 'IEB',
        edgeBanding: {},
      };

      for (const key in defaults) {
        if (newDetails![key as keyof typeof defaults] === undefined) {
          newDetails![key as keyof typeof defaults] = defaults[key as keyof typeof defaults];
          needsUpdate = true;
        }
      }
      if (newDetails.edgeBanding === undefined) {
        newDetails.edgeBanding = {};
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        setValue(detailsPath, newDetails, { shouldDirty: true, shouldTouch: true });
      }
    } else if (itemTypeWatcher === BomItemType.HARDWARE || itemTypeWatcher === BomItemType.ADDON) {
      if (typeof currentDetails === 'object' && currentDetails !== null && 'edgeBanding' in currentDetails) {
        setValue(detailsPath, null, { shouldDirty: true, shouldTouch: true });
      } else if (currentDetails === undefined) {
        setValue(detailsPath, null, { shouldDirty: true, shouldTouch: true });
      }
    }
  }, [itemTypeWatcher, index, setValue, watch, currentItemName, detailsPath]);

  const watchedInputParameters = watch('inputParameters');
  const runtimeInputsForPlankEditor: RuntimeInputForPlankEditor[] = React.useMemo(() => {
    if (!watchedInputParameters) return [];
    return watchedInputParameters.map(p => ({
      inputName: p.inputName,
      displayLabel: p.displayLabel,
      inputType: p.inputType,
      options: p.options,
      defaultValue: p.defaultValue,
      unit: p.unit,
    }));
  }, [watchedInputParameters]);

  return (
    <div className="p-4 border border-light-bw rounded-lg space-y-4 relative bg-lightest-bw/50 shadow-sm">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => remove(index)}
        className="absolute top-3 right-3 text-red-500 hover:text-red-700 hover:bg-red-100/50"
        title="Remove BOM Item"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={itemNamePath}>Item Name</Label>
          <Input
            id={itemNamePath}
            {...register(itemNamePath)}
          />
          {errors.bomItems?.[index]?.itemName && <p className="text-xs text-red-600 mt-1">{errors.bomItems[index]?.itemName?.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={itemTypePath}>Item Type</Label>
          <Controller
            control={control}
            name={itemTypePath}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id={itemTypePath}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(BomItemType).map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
           {errors.bomItems?.[index]?.itemType && <p className="text-xs text-red-600 mt-1">{errors.bomItems[index]?.itemType?.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={itemDescriptionPath}>Item Description</Label>
        <textarea
          id={itemDescriptionPath}
          {...register(itemDescriptionPath)}
          rows={2}
          className="block w-full rounded-md border border-light-bw bg-lightest-bw px-3 py-2 text-sm text-dark-text-bw ring-offset-lightest-bw placeholder:text-dark-text-bw/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-color focus-visible:ring-offset-2"
        />
      </div>
      
      {itemTypeWatcher === BomItemType.ADDON && (
        <div className="space-y-1.5">
          <Label htmlFor={addonModelIdPath}>Addon Model ID</Label>
          <Input
            id={addonModelIdPath}
            placeholder="Enter ID of the addon model from catalogue"
            {...register(addonModelIdPath)}
          />
        </div>
      )}

      {itemTypeWatcher === BomItemType.PLANK && (
        <PlankLogicEditor
          bomItemIndex={index}
          runtimeInputs={runtimeInputsForPlankEditor} 
          globalConstants={{}}
        />
      )}
    </div>
  );
}
