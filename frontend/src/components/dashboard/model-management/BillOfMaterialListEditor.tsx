"use client";

import React, { useEffect } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Trash2, PlusCircle } from 'lucide-react';
import PlankLogicEditor from './PlankLogicEditor';
import { Button } from '@/components/dashboard/button';
import { Input } from '@/components/dashboard/input';
import { Label } from '@/components/dashboard/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/dashboard/select';
import { cn } from '@/lib/utils';

// Define BomItemType locally to avoid circular dependency
export enum BomItemType {
  PLANK = 'PLANK',
  HARDWARE = 'HARDWARE',
  ADDON = 'ADDON',
}

type PlankPosition = 'left' | 'right' | 'top' | 'bottom' | 'back' | 'door';

interface DefaultPlank {
  itemName: string;
  itemType: BomItemType;
  itemDescription: string;
  plankPosition: PlankPosition;
  defaultDetails: {
    packetNumber: number;
    plankLocationIdentifier: string;
    edgeBandingType: 'CEB' | 'IEB';
  };
}

const DEFAULT_PLANKS: DefaultPlank[] = [
  {
    itemName: 'Left Plank',
    itemType: BomItemType.PLANK,
    itemDescription: 'Left side plank of the box',
    plankPosition: 'left',
    defaultDetails: {
      packetNumber: 1,
      plankLocationIdentifier: 'LT',
      edgeBandingType: 'IEB'
    }
  },
  {
    itemName: 'Right Plank',
    itemType: BomItemType.PLANK,
    itemDescription: 'Right side plank of the box',
    plankPosition: 'right',
    defaultDetails: {
      packetNumber: 1,
      plankLocationIdentifier: 'RT',
      edgeBandingType: 'IEB'
    }
  },
  {
    itemName: 'Top Plank',
    itemType: BomItemType.PLANK,
    itemDescription: 'Top plank of the box',
    plankPosition: 'top',
    defaultDetails: {
      packetNumber: 1,
      plankLocationIdentifier: 'TP',
      edgeBandingType: 'IEB'
    }
  },
  {
    itemName: 'Bottom Plank',
    itemType: BomItemType.PLANK,
    itemDescription: 'Bottom plank of the box',
    plankPosition: 'bottom',
    defaultDetails: {
      packetNumber: 1,
      plankLocationIdentifier: 'BP',
      edgeBandingType: 'IEB'
    }
  },
  {
    itemName: 'Back Panel',
    itemType: BomItemType.PLANK,
    itemDescription: 'Back panel of the box',
    plankPosition: 'back',
    defaultDetails: {
      packetNumber: 1,
      plankLocationIdentifier: 'BK',
      edgeBandingType: 'IEB'
    }
  },
  {
    itemName: 'Door Panel',
    itemType: BomItemType.PLANK,
    itemDescription: 'Door panel (if required)',
    plankPosition: 'door',
    defaultDetails: {
      packetNumber: 1,
      plankLocationIdentifier: 'DR',
      edgeBandingType: 'IEB'
    }
  }
];

export default function BillOfMaterialListEditor() {
  const { control, register, watch, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "bomItems",
  });

  // Add default planks if none exist
  useEffect(() => {
    if (fields.length === 0) {
      DEFAULT_PLANKS.forEach(plank => {
        append({
          itemName: plank.itemName,
          itemType: plank.itemType,
          itemDescription: plank.itemDescription,
          details: { // Ensure details are initialized for default planks
            name: plank.itemName,
            widthLogic: '',
            lengthLogic: '',
            materialCode: '',
            grainDirection: 'vertical',
            packetNumber: plank.defaultDetails.packetNumber,
            plankLocationIdentifier: plank.defaultDetails.plankLocationIdentifier,
            edgeBandingType: plank.defaultDetails.edgeBandingType,
            edgeBanding: {}, // Initialize edgeBanding for PLANK
          }
        });
      });
    }
  }, [append, fields.length]);

  // Watch the entire bomItems array
  const bomItemsWatcher = watch('bomItems');

  useEffect(() => {
    if (bomItemsWatcher && Array.isArray(bomItemsWatcher)) {
      bomItemsWatcher.forEach((item: any, index: number) => { // Added types for item and index
        const currentItemType = item.itemType;
        const currentDetails = item.details;
        const detailsPath = `bomItems.${index}.details`;
        const itemNamePath = `bomItems.${index}.itemName`;
        const currentItemName = watch(itemNamePath) || ''; // Get current name for defaulting

        if (currentItemType === BomItemType.PLANK) {
          let needsUpdate = false;
          let newDetails: any = currentDetails; // Initialize newDetails with currentDetails

          if (!currentDetails || typeof currentDetails.edgeBanding === 'undefined') {
            needsUpdate = true;
            newDetails = { 
              ...(currentDetails || {}), 
              edgeBanding: {},
              name: currentDetails?.name || currentItemName,
              widthLogic: currentDetails?.widthLogic || '',
              lengthLogic: currentDetails?.lengthLogic || '',
              materialCode: currentDetails?.materialCode || '',
              grainDirection: currentDetails?.grainDirection || 'vertical',
            };
          }
          
          const defaultPlankDetails: any = { // Added type any for defaultPlankDetails
            name: currentItemName,
            widthLogic: '',
            lengthLogic: '',
            materialCode: '',
            grainDirection: 'vertical',
          };

          for (const key in defaultPlankDetails) {
            if (newDetails && newDetails[key] === undefined && defaultPlankDetails[key] !== undefined) {
              newDetails[key] = defaultPlankDetails[key];
              needsUpdate = true;
            } else if (!newDetails && defaultPlankDetails[key] !== undefined) {
              newDetails = { ...defaultPlankDetails, edgeBanding: {} };
              needsUpdate = true;
              break; 
            }
          }
          
          if (needsUpdate) {
            setValue(detailsPath, newDetails, { shouldDirty: true, shouldTouch: true });
          }

        } else if (currentItemType === BomItemType.HARDWARE || currentItemType === BomItemType.ADDON) {
          if (currentDetails !== null) {
            setValue(detailsPath, null, { shouldDirty: true, shouldTouch: true });
          }
        }
      });
    }
  }, [bomItemsWatcher, setValue, watch]);

  return (
    <div className="space-y-6">
      {fields.map((field, index) => (
        <div key={field.id} className="p-4 border border-light-bw rounded-lg space-y-4 relative bg-lightest-bw/50 shadow-sm">
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
              <Label htmlFor={`bomItems.${index}.itemName`}>Item Name</Label>
              <Input
                id={`bomItems.${index}.itemName`}
                {...register(`bomItems.${index}.itemName`)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`bomItems.${index}.itemType`}>Item Type</Label>
              <Controller
                control={control}
                name={`bomItems.${index}.itemType`}
                render={({ field: { onChange, value } }) => (
                  <Select onValueChange={onChange} value={value}>
                    <SelectTrigger id={`bomItems.${index}.itemType`}>
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
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`bomItems.${index}.itemDescription`}>Item Description</Label>
            <textarea
              id={`bomItems.${index}.itemDescription`}
              {...register(`bomItems.${index}.itemDescription`)}
              rows={2}
              className="block w-full rounded-md border border-light-bw bg-lightest-bw px-3 py-2 text-sm text-dark-text-bw ring-offset-lightest-bw placeholder:text-dark-text-bw/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-color focus-visible:ring-offset-2"
            />
          </div>
          
          {/* Addon Model ID Field - Conditionally Rendered */}
          {watch(`bomItems.${index}.itemType`) === BomItemType.ADDON && (
            <div className="space-y-1.5">
              <Label htmlFor={`bomItems.${index}.addonModelId`}>Addon Model ID (if Item Type is ADDON)</Label>
              <Input
                id={`bomItems.${index}.addonModelId`}
                placeholder="Enter ID of the addon model from catalogue"
                {...register(`bomItems.${index}.addonModelId` as const)}
              />
            </div>
          )}


          {watch(`bomItems.${index}.itemType`) === BomItemType.PLANK && (
            <PlankLogicEditor
              bomItemIndex={index}
              // These props might need adjustment based on how ModelBuilderForm provides them
              runtimeInputs={watch('inputParameters') || []} 
              globalConstants={{ /* Define or pass global constants */ }}
              sampleRuntimeInputsJson={"{}"} // Provide a valid JSON string or make optional
            />
          )}
        </div>
      ))}
       <Button
        type="button"
        variant="outline"
        onClick={() => append({ 
          itemName: '', 
          itemType: BomItemType.PLANK, // Default to PLANK or make it selectable
          itemDescription: '',
          itemLogicScript: '',
          addonModelId: null,
          // Default details based on the default itemType (PLANK)
          details: { 
            edgeBanding: {},
            name: 'New Plank Item', // Provide a default name or leave empty
            widthLogic: '',
            lengthLogic: '',
            materialCode: '',
            grainDirection: 'vertical',
          },
        })}
        className="mt-4"
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Add BOM Item
      </Button>
    </div>
  );
}
