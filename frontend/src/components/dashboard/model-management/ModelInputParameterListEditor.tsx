"use client";

import React from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
// import { Button } from '@/components/ui/button'; // Assuming shadcn/ui
// import { Input } from '@/components/ui/input'; // Assuming shadcn/ui
// import { Label } from '@/components/ui/label'; // Assuming shadcn/ui
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Assuming shadcn/ui
import { Trash2, PlusCircle } from 'lucide-react';

// This type should align with the Zod schema in ModelBuilderForm.tsx
interface ModelInputParameterField {
  id?: string; 
  inputName: string;
  displayLabel: string;
  inputType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'SELECT';
  defaultValue?: string | null;
  options?: string | null; 
  unit?: string | null;
  description?: string | null;
}

interface ModelFormData {
  inputParameters?: ModelInputParameterField[];
  // other fields from the main form schema...
}

export default function ModelInputParameterListEditor() {
  const { control, register, formState: { errors }, watch, setValue } = useFormContext<ModelFormData>(); 
  const { fields, append, remove } = useFieldArray({
    control,
    name: "inputParameters", 
  });

  const inputTypeOptions: ModelInputParameterField['inputType'][] = ['NUMBER', 'TEXT', 'BOOLEAN', 'SELECT'];

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="p-4 border rounded-md space-y-3 relative bg-gray-50"> {/* Removed duplicate div opening tag */}
          <button
            type="button"
            onClick={() => remove(index)}
            className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700"
            title="Remove Parameter"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`inputParameters.${index}.inputName`} className="block text-sm font-medium text-gray-700 mb-1">Parameter Name (ID)</label>
              <input
                id={`inputParameters.${index}.inputName`}
                placeholder="e.g., boxWidth, doorHasDoor"
                {...register(`inputParameters.${index}.inputName` as const)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.inputParameters?.[index]?.inputName && <p className="text-sm text-red-500 mt-1">{errors.inputParameters[index]?.inputName?.message}</p>}
            </div>
            <div>
              <label htmlFor={`inputParameters.${index}.displayLabel`} className="block text-sm font-medium text-gray-700 mb-1">Display Label</label>
              <input
                id={`inputParameters.${index}.displayLabel`}
                placeholder="e.g., Box Width, Has Door?"
                {...register(`inputParameters.${index}.displayLabel` as const)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.inputParameters?.[index]?.displayLabel && <p className="text-sm text-red-500 mt-1">{errors.inputParameters[index]?.displayLabel?.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`inputParameters.${index}.inputType`} className="block text-sm font-medium text-gray-700 mb-1">Input Type</label>
              <select
                id={`inputParameters.${index}.inputType`}
                {...register(`inputParameters.${index}.inputType` as const)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {inputTypeOptions.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.inputParameters?.[index]?.inputType && <p className="text-sm text-red-500 mt-1">{errors.inputParameters[index]?.inputType?.message}</p>}
            </div>
            <div>
              <label htmlFor={`inputParameters.${index}.defaultValue`} className="block text-sm font-medium text-gray-700 mb-1">Default Value</label>
              <input
                id={`inputParameters.${index}.defaultValue`}
                {...register(`inputParameters.${index}.defaultValue` as const)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          {watch(`inputParameters.${index}.inputType`) === 'SELECT' && (
             <div>
              <label htmlFor={`inputParameters.${index}.options`} className="block text-sm font-medium text-gray-700 mb-1">Options (comma-separated)</label>
              <input
                id={`inputParameters.${index}.options`}
                placeholder="e.g., Option1,Option2,Option3"
                {...register(`inputParameters.${index}.options` as const)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`inputParameters.${index}.unit`} className="block text-sm font-medium text-gray-700 mb-1">Unit (if applicable)</label>
              <input
                id={`inputParameters.${index}.unit`}
                placeholder="e.g., mm, cm"
                {...register(`inputParameters.${index}.unit` as const)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
             <div>
              <label htmlFor={`inputParameters.${index}.description`} className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                id={`inputParameters.${index}.description`}
                rows={2}
                placeholder="Brief description of the parameter"
                {...register(`inputParameters.${index}.description` as const)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      ))}
      
      <button
        type="button"
        onClick={() => append({ 
          inputName: '', 
          displayLabel: '', 
          inputType: 'TEXT', 
          defaultValue: '', 
          options: '', 
          unit: '',
          description: '' 
        })}
        className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <PlusCircle className="mr-2 h-5 w-5" /> Add Input Parameter
      </button>
    </div>
  );
}
