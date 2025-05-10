"use client";

import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
// import { Button } from '@/components/ui/button';
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label'; // Assuming shadcn/ui
import { Trash2, PlusCircle } from 'lucide-react';

// This type should align with the Zod schema in ModelBuilderForm.tsx
interface SiteInstructionField {
  id?: string; // For useFieldArray key
  text: string;
}

interface ModelFormData {
  siteEngineerInstructions?: SiteInstructionField[];
  // other fields from the main form schema...
}

export default function SiteInstructionsEditor() {
  const { control, register, formState: { errors } } = useFormContext<ModelFormData>(); 
  const { fields, append, remove } = useFieldArray({
    control,
    name: "siteEngineerInstructions", 
  });

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start space-x-2">
          <textarea
            id={`siteEngineerInstructions.${index}.text`}
            placeholder={`Instruction ${index + 1}`}
            {...register(`siteEngineerInstructions.${index}.text` as const)}
            rows={2}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm flex-grow"
          />
          <button
            type="button"
            onClick={() => remove(index)}
            className="p-2 text-red-500 hover:text-red-700 mt-1" // Adjusted margin for alignment
            title="Remove Instruction"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      ))}
      {/* Display field array level errors if any, though individual item errors are handled by Zod schema */}
      {/* {errors.siteEngineerInstructions?.root && <p className="text-sm text-red-500 mt-1">{errors.siteEngineerInstructions.root.message}</p>} */}
      {/* Or loop through errors.siteEngineerInstructions for individual messages if not caught by field-level errors (less common with Zod) */}


      <button
        type="button"
        onClick={() => append({ text: '' })}
        className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <PlusCircle className="mr-2 h-5 w-5" /> Add Instruction
      </button>
    </div>
  );
}
