"use client";

import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import ModelInputParameterItem from './ModelInputParameterItem'; // Import the new component

// This type should align with the Zod schema in ModelBuilderForm.tsx
interface ModelInputParameterField {
  id?: string; 
  inputName: string;
  displayLabel?: string | null; // Changed from string to allow null
  inputType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'SELECT' | 'SELECT_MATERIAL';
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
  const { control } = useFormContext<ModelFormData>(); 
  const { fields, append, remove } = useFieldArray({
    control,
    name: "inputParameters", 
  });

  return (
    <div className="space-y-6">
      {fields.map((field, index) => (
        <ModelInputParameterItem key={field.id} index={index} remove={remove} />
      ))}
      
      <Button
        type="button"
        variant="outline"
        onClick={() => append({ 
          inputName: '', 
          displayLabel: '', 
          inputType: 'TEXT', 
          defaultValue: '', 
          options: '', 
          unit: '',
          description: '' 
        })}
        className="mt-4"
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Add Input Parameter
      </Button>
    </div>
  );
}
