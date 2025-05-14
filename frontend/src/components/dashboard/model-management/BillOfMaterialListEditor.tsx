"use client";

import React, { useEffect } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Trash2 } from 'lucide-react';
import PlankLogicEditor from './PlankLogicEditor';

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
  const { control, register, watch } = useFormContext();
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
          details: {
            name: plank.itemName,
            widthLogic: '',  // Will be initialized by PlankLogicEditor
            lengthLogic: '', // Will be initialized by PlankLogicEditor
            materialCode: '', // Will be initialized by PlankLogicEditor
            grainDirection: 'vertical',
            packetNumber: plank.defaultDetails.packetNumber,
            plankLocationIdentifier: plank.defaultDetails.plankLocationIdentifier,
            edgeBandingType: plank.defaultDetails.edgeBandingType
          }
        });
      });
    }
  }, [append, fields.length]);

  return (
    <div className="space-y-6">
      {fields.map((field, index) => (
        <div key={field.id} className="p-4 border rounded-md space-y-3 relative bg-gray-50">
          <button
            type="button"
            onClick={() => remove(index)}
            className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700"
            title="Remove BOM Item"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`bomItems.${index}.itemName`} className="block text-sm font-medium text-gray-700 mb-1">
                Item Name
              </label>
              <input
                id={`bomItems.${index}.itemName`}
                {...register(`bomItems.${index}.itemName`)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor={`bomItems.${index}.itemType`} className="block text-sm font-medium text-gray-700 mb-1">
                Item Type
              </label>
              <select
                id={`bomItems.${index}.itemType`}
                {...register(`bomItems.${index}.itemType`)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {Object.values(BomItemType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor={`bomItems.${index}.itemDescription`} className="block text-sm font-medium text-gray-700 mb-1">
              Item Description
            </label>
            <textarea
              id={`bomItems.${index}.itemDescription`}
              {...register(`bomItems.${index}.itemDescription`)}
              rows={2}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {watch(`bomItems.${index}.itemType`) === BomItemType.PLANK && (
            <PlankLogicEditor
              bomItemIndex={index}
              runtimeInputs={watch('inputParameters') || []}
              globalConstants={{
                MATERIAL_THICKNESS: {
                  expose: 18,
                  inner: 18,
                  back: 6
                },
                EDGE_BANDING: {
                  INNER_EDGEBANDING: 1,
                  COLOR_EDGEBANDING: 2
                }
              }}
              sampleRuntimeInputsJson={JSON.stringify({
                boxWidth: 600,
                boxHeight: 720,
                boxDepth: 560,
                leftAdjacency: 'Expose',
                rightAdjacency: 'Wall',
                hasDoor: true,
                skirting: 100,
                outerMaterialCode: 'OUT001',
                innerMaterialCode: 'IN001'
              })}
            />
          )}
        </div>
      ))}
    </div>
  );
}
