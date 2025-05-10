"use client";

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label';

// This type should align with the Zod schema in ModelBuilderForm.tsx
interface ModelFormData {
  sampleOnsiteInputs?: string | null; // Storing as string, will be parsed/validated by Zod
  // other fields from the main form schema...
}

export default function SampleInputsEditor() {
  const { control, formState: { errors } } = useFormContext<ModelFormData>();

  return (
    <div className="space-y-2">
      <label htmlFor="sampleOnsiteInputs" className="block text-sm font-medium text-gray-700 mb-1">
        Sample Onsite Inputs (JSON format)
      </label>
      <Controller
        name="sampleOnsiteInputs"
        control={control}
        render={({ field }) => (
          <textarea
            id="sampleOnsiteInputs"
            rows={10}
            placeholder='Enter as JSON, e.g., { "materialCode_inner18": { "plyThickness_mm": 18, ... } }'
            {...field}
            value={field.value || ''} // Ensure controlled component if value can be null
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
          />
        )}
      />
      {errors.sampleOnsiteInputs && (
        <p className="text-sm text-red-500 mt-1">
          {errors.sampleOnsiteInputs.message}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Define sample input configurations or material references for this model. Use valid JSON.
      </p>
    </div>
  );
}
