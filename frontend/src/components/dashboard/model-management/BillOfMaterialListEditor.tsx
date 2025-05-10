"use client";

import React, { useState } from 'react';
import { useFormContext, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { Trash2, PlusCircle, Edit3 } from 'lucide-react';
import { BomItemType } from './ModelBuilderForm'; // Import local BomItemType
import ItemLogicEditorModal from './ItemLogicEditorModal'; // Import the new modal

// This type should align with the Zod schema in ModelBuilderForm.tsx
interface BillOfMaterialItemData {
  id?: string; 
  itemName: string;
  itemType: BomItemType; 
  itemDescription?: string | null;
  itemLogicScript?: string | null; // Changed from specific rule fields
  addonModelId?: string | null;
}

interface ModelFormData {
  inputParameters?: Array<{ inputName: string; displayLabel?: string | null; description?: string | null }>;
  sampleRuntimeInputsJson?: string | null;
  bomItems?: BillOfMaterialItemData[];
}

export default function BillOfMaterialListEditor() {
  const { control, register, formState: { errors }, watch, setValue, getValues } = useFormContext<ModelFormData>(); 
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "bomItems", 
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [currentItemScript, setCurrentItemScript] = useState<string | null>('');

  // Watch inputParameters from the main form to pass to the modal
  const availableRuntimeInputs = useWatch({ control, name: "inputParameters" }) || [];
  const sampleRuntimeInputsJsonString = useWatch({ control, name: "sampleRuntimeInputsJson" });

  const itemTypeOptions = Object.values(BomItemType); // Use all defined BomItemTypes

  const handleOpenModal = (index: number) => {
    setCurrentItemScript(fields[index].itemLogicScript || '');
    setEditingItemIndex(index);
    setIsModalOpen(true);
  };

  const handleSaveScript = (script: string) => {
    if (editingItemIndex !== null) {
      const fieldName = `bomItems.${editingItemIndex}.itemLogicScript` as const;
      setValue(fieldName, script); // Update the specific field in the form state
      // `update` function from useFieldArray can also be used if you need to replace the whole item object
      // update(editingItemIndex, { ...fields[editingItemIndex], itemLogicScript: script });
    }
    setIsModalOpen(false);
    setEditingItemIndex(null);
  };

  return (
    <div className="space-y-4">
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
              <label htmlFor={`bomItems.${index}.itemName`} className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input
                id={`bomItems.${index}.itemName`}
                placeholder="e.g., Top Plank, Hinge Set"
                {...register(`bomItems.${index}.itemName` as const)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.bomItems?.[index]?.itemName && <p className="text-sm text-red-500 mt-1">{errors.bomItems[index]?.itemName?.message}</p>}
            </div>
            <div>
              <label htmlFor={`bomItems.${index}.itemType`} className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
              <select
                id={`bomItems.${index}.itemType`}
                {...register(`bomItems.${index}.itemType` as const)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {itemTypeOptions.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor={`bomItems.${index}.itemDescription`} className="block text-sm font-medium text-gray-700 mb-1">Item Description</label>
            <textarea
              id={`bomItems.${index}.itemDescription`}
              rows={2}
              placeholder="Brief description of the BOM item"
              {...register(`bomItems.${index}.itemDescription` as const)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Item Logic Script Section */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Logic Script</label>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-600 flex-grow p-2 border border-dashed border-gray-300 rounded-md min-h-[40px]">
                {watch(`bomItems.${index}.itemLogicScript`) ? (
                  <code className="text-xs block truncate">{watch(`bomItems.${index}.itemLogicScript`)}</code>
                ) : (
                  <span className="text-gray-400">No script defined.</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => handleOpenModal(index)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit3 className="h-4 w-4 mr-1.5" /> Edit Script
              </button>
            </div>
            {errors.bomItems?.[index]?.itemLogicScript && <p className="text-sm text-red-500 mt-1">{errors.bomItems[index]?.itemLogicScript?.message}</p>}
          </div>

          {/* Conditional fields for ADDON type */}
          {watch(`bomItems.${index}.itemType`) === BomItemType.ADDON && (
            <div>
              <label htmlFor={`bomItems.${index}.addonModelId`} className="block text-sm font-medium text-gray-700 mb-1">Addon Model ID (if type is ADDON)</label>
              <input
                id={`bomItems.${index}.addonModelId`}
                placeholder="Enter ModelDefinition ID for addon"
                {...register(`bomItems.${index}.addonModelId` as const)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ 
          itemName: '', 
          itemType: BomItemType.PLANK, // Default to PLANK
          itemDescription: '',
          itemLogicScript: '', 
          addonModelId: '' 
        })}
        className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <PlusCircle className="mr-2 h-5 w-5" /> Add BOM Item
      </button>

      {isModalOpen && editingItemIndex !== null && (
        <ItemLogicEditorModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItemIndex(null);
          }}
          initialScript={currentItemScript}
          onSave={handleSaveScript}
          availableRuntimeInputs={availableRuntimeInputs}
          sampleRuntimeInputsJsonString={sampleRuntimeInputsJsonString}
          itemName={fields[editingItemIndex]?.itemName || 'New Item'}
        />
      )}
    </div>
  );
}
