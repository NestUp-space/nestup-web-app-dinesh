"use client";

import React, { useState } from 'react';
import { useFormContext, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { Trash2, PlusCircle, Edit3 } from 'lucide-react';
import { BomItemType } from './ModelBuilderForm'; // Import local BomItemType
import ItemLogicEditorModal from './ItemLogicEditorModal'; // Import the new modal

// Define detail structures
interface HoleDetail {
  x: number | string;
  y: number | string;
  z: number | string;
  t: number | string;
}

interface GrooveDetail {
  x1: number | string;
  y1: number | string;
  x2: number | string;
  y2: number | string;
  z: number | string;
  t: number | string;
}

interface PlankItemDetails {
  width: number | string;
  height: number | string;
  materialCode: string;
  plankIdFormat: string;
  holes: HoleDetail[];
  grooves: GrooveDetail[];
}

interface HardwareItemDetails {
  hardwareType: string;
  countRule: string;
}

// This type should align with the Zod schema in ModelBuilderForm.tsx
interface BillOfMaterialItemData {
  id?: string;
  itemName: string;
  itemType: BomItemType;
  itemDescription?: string | null;
  details?: PlankItemDetails | HardwareItemDetails | null; // Added details field
  itemLogicScript?: string | null;
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

  // Nested field array for holes
  const useHolesFieldArray = (bomItemIndex: number) => {
    return useFieldArray({
      control,
      name: `bomItems.${bomItemIndex}.details.holes` as const,
    });
  };

  // Nested field array for grooves
  const useGroovesFieldArray = (bomItemIndex: number) => {
    return useFieldArray({
      control,
      name: `bomItems.${bomItemIndex}.details.grooves` as const,
    });
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [currentItemScript, setCurrentItemScript] = useState<string | null>('');

  // Watch inputParameters from the main form to pass to the modal
  const availableRuntimeInputs = useWatch({ control, name: "inputParameters" }) || [];
  const sampleRuntimeInputsJsonString = useWatch({ control, name: "sampleRuntimeInputsJson" });

  const itemTypeOptions = Object.values(BomItemType).filter(type => type !== BomItemType.ADDON); // Exclude ADDON

  const defaultPlankLogicScriptTemplate = `function calculateProperties(runtimeInputs, globalConstants) {
  // Common destructuring for runtimeInputs
  const { 
    boxHeight, boxWidth, boxDepth, leftAdjacency, rightAdjacency, skirting,
    outerMaterialDefinition, innerMaterialDefinition, backMaterialDefinition, 
    door, numberOfShelves, doorMaterialDefinition // Assuming doorMaterialDefinition is also passed
  } = runtimeInputs;

  // Common destructuring for globalConstants
  const { 
    edgeBandingExposedThickness, edgeBandingInternalThickness, 
    backPanelGrooveDepth, doorClearance 
    // Add more common constants if identified
  } = globalConstants;

  // --- USER TO IMPLEMENT CORE CALCULATION LOGIC HERE ---
  // Example: const calculatedWidth = boxWidth - (2 * (outerMaterialDefinition?.overallMaterialThickness_mm || 0));

  // Remember to define plankId and name based on the BoM item's static fields if possible,
  // or generate them if necessary.
  // const plankId = 'PLANK_ID_FROM_BOM_ITEM'; // Placeholder, will be set by the BoM item's own ID or name
  // const name = 'Plank Name From BoM Item'; // Placeholder

  return {
    plankId: this.plankIdFormat || 'DEFAULT_PLANK_ID', // Accessing BoM item's own properties might be tricky here, depends on execution context.
    name: this.itemName || 'Default Plank Name',     // Consider passing itemName/plankIdFormat into the script if needed directly.
    width: 0, // Replace with calculatedWidth
    height: 0, // Replace with calculatedHeight
    thickness: innerMaterialDefinition?.overallMaterialThickness_mm || 0, // Example
    materialCode: innerMaterialDefinition?.code || '', // Example
    grainDirection: innerMaterialDefinition?.grainDirection || 'N/A', // Example
    screwHoles: [],
    vbScrewHoles: [],
    backPanelGroove: null
  };
}`;

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

          {/* Conditional Details Section based on itemType */}
          {watch(`bomItems.${index}.itemType`) === BomItemType.PLANK && (
            <PlankDetailsEditor bomItemIndex={index} useHolesFieldArray={useHolesFieldArray} useGroovesFieldArray={useGroovesFieldArray} />
          )}

          {watch(`bomItems.${index}.itemType`) === BomItemType.HARDWARE && (
            <HardwareDetailsEditor bomItemIndex={index} />
          )}
          
          {/* Item Logic Script Section */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Logic Script</label>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-600 flex-grow p-2 border border-dashed border-gray-300 rounded-md h-24 min-w-0 overflow-y-auto">
                {watch(`bomItems.${index}.itemLogicScript`) ? 
                  (<code className="text-xs block whitespace-pre-wrap">{watch(`bomItems.${index}.itemLogicScript`)}</code>)
                 : 
                  (<span className="text-gray-400">No script defined.</span>)
                }
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
          details: { 
            width: '', height: '', materialCode: '', plankIdFormat: '', 
            holes: [], grooves: [] 
          }, // Default details for PLANK
          itemLogicScript: defaultPlankLogicScriptTemplate, // MODIFIED HERE
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

// Sub-component for Plank Details
function PlankDetailsEditor({ bomItemIndex, useHolesFieldArray, useGroovesFieldArray }: { bomItemIndex: number; useHolesFieldArray: any; useGroovesFieldArray: any; }) {
  const { register, formState: { errors } } = useFormContext<ModelFormData>();
  const { fields: holeFields, append: appendHole, remove: removeHole } = useHolesFieldArray(bomItemIndex);
  const { fields: grooveFields, append: appendGroove, remove: removeGroove } = useGroovesFieldArray(bomItemIndex);

  return (
    <div className="space-y-3 p-3 border-t mt-3 min-w-0"> {/* Added min-w-0 to prevent stretching */}
      <h4 className="text-md font-semibold text-gray-800">Plank Specific Details:</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`bomItems.${bomItemIndex}.details.width`} className="block text-sm font-medium">Width</label>
          <input {...register(`bomItems.${bomItemIndex}.details.width` as const)} placeholder="e.g., 600 or formula" className="input-field" />
        </div>
        <div>
          <label htmlFor={`bomItems.${bomItemIndex}.details.height`} className="block text-sm font-medium">Height</label>
          <input {...register(`bomItems.${bomItemIndex}.details.height` as const)} placeholder="e.g., 1200 or formula" className="input-field" />
        </div>
        <div>
          <label htmlFor={`bomItems.${bomItemIndex}.details.materialCode`} className="block text-sm font-medium">Material Code</label>
          <input {...register(`bomItems.${bomItemIndex}.details.materialCode` as const)} placeholder="e.g., PLY18MM" className="input-field" />
        </div>
        <div>
          <label htmlFor={`bomItems.${bomItemIndex}.details.plankIdFormat`} className="block text-sm font-medium">Plank ID Format</label>
          <input {...register(`bomItems.${bomItemIndex}.details.plankIdFormat` as const)} placeholder="e.g., {boxNum}-{idx}-TOP" className="input-field" />
        </div>
      </div>

      {/* Holes Editor */}
      <div className="pt-2">
        <h5 className="text-sm font-semibold mb-1">Holes:</h5>
        {holeFields.map((hole: any, holeIndex: number) => (
          <div key={hole.id} className="grid grid-cols-5 gap-2 items-center mb-2 p-2 border rounded-md">
            <input {...register(`bomItems.${bomItemIndex}.details.holes.${holeIndex}.x` as const)} placeholder="X" className="input-field-sm" />
            <input {...register(`bomItems.${bomItemIndex}.details.holes.${holeIndex}.y` as const)} placeholder="Y" className="input-field-sm" />
            <input {...register(`bomItems.${bomItemIndex}.details.holes.${holeIndex}.z` as const)} placeholder="Z (depth)" className="input-field-sm" />
            <input {...register(`bomItems.${bomItemIndex}.details.holes.${holeIndex}.t` as const)} placeholder="T (type/dia)" className="input-field-sm" />
            <button type="button" onClick={() => removeHole(holeIndex)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16}/></button>
          </div>
        ))}
        <button type="button" onClick={() => appendHole({ x: '', y: '', z: '', t: '' })} className="btn-secondary-sm mt-1">Add Hole</button>
      </div>

      {/* Grooves Editor */}
      <div className="pt-2">
        <h5 className="text-sm font-semibold mb-1">Grooves:</h5>
        {grooveFields.map((groove: any, grooveIndex: number) => (
          <div key={groove.id} className="grid grid-cols-7 gap-2 items-center mb-2 p-2 border rounded-md">
            <input {...register(`bomItems.${bomItemIndex}.details.grooves.${grooveIndex}.x1` as const)} placeholder="X1" className="input-field-sm" />
            <input {...register(`bomItems.${bomItemIndex}.details.grooves.${grooveIndex}.y1` as const)} placeholder="Y1" className="input-field-sm" />
            <input {...register(`bomItems.${bomItemIndex}.details.grooves.${grooveIndex}.x2` as const)} placeholder="X2" className="input-field-sm" />
            <input {...register(`bomItems.${bomItemIndex}.details.grooves.${grooveIndex}.y2` as const)} placeholder="Y2" className="input-field-sm" />
            <input {...register(`bomItems.${bomItemIndex}.details.grooves.${grooveIndex}.z` as const)} placeholder="Z (depth)" className="input-field-sm" />
            <input {...register(`bomItems.${bomItemIndex}.details.grooves.${grooveIndex}.t` as const)} placeholder="T (type/width)" className="input-field-sm" />
            <button type="button" onClick={() => removeGroove(grooveIndex)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16}/></button>
          </div>
        ))}
        <button type="button" onClick={() => appendGroove({ x1: '', y1: '', x2: '', y2: '', z: '', t: '' })} className="btn-secondary-sm mt-1">Add Groove</button>
      </div>
    </div>
  );
}

// Sub-component for Hardware Details
function HardwareDetailsEditor({ bomItemIndex }: { bomItemIndex: number }) {
  const { register, formState: { errors } } = useFormContext<ModelFormData>();
  return (
    <div className="space-y-3 p-3 border-t mt-3">
      <h4 className="text-md font-semibold text-gray-800">Hardware Specific Details:</h4>
      <div>
        <label htmlFor={`bomItems.${bomItemIndex}.details.hardwareType`} className="block text-sm font-medium">Hardware Type</label>
        <input {...register(`bomItems.${bomItemIndex}.details.hardwareType` as const)} placeholder="e.g., Hinge, Screw, Bracket" className="input-field" />
      </div>
      <div>
        <label htmlFor={`bomItems.${bomItemIndex}.details.countRule`} className="block text-sm font-medium">Count Rule (JS Logic)</label>
        <textarea
          rows={2}
          {...register(`bomItems.${bomItemIndex}.details.countRule` as const)}
          placeholder="e.g., Math.ceil(inputs.boxHeight / 500) * 2"
          className="input-field"
        />
      </div>
    </div>
  );
}

// Helper styles (consider moving to a global CSS or Tailwind config if used widely)
const InputFieldSmStyle = "mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
const InputFieldStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
const BtnSecondarySmStyle = "inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50";

// Add these classes to your Tailwind config or a global CSS file:
// .input-field { @apply mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm; }
// .input-field-sm { @apply mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm; }
// .btn-secondary-sm { @apply inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50; }
