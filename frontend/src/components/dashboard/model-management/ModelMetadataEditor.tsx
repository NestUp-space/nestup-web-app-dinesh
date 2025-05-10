"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form'; // To be used when integrated with ModelBuilderForm
// Assuming these are your custom/shadcn components. If not, replace with standard HTML or other library components.
// For MVP, I'll use standard HTML inputs and textarea.
// import { Input } from '@/components/ui/input'; 
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label'; 

// This component assumes it's rendered within a <FormProvider> from ModelBuilderForm
// The 'ModelFormData' type would be defined in ModelBuilderForm.tsx
interface ModelFormData {
  modelType: string;
  description?: string | null;
  screenshotUrl?: string | null;
  // other fields from the main form schema...
}

export default function ModelMetadataEditor() {
  const { register, formState: { errors } } = useFormContext<ModelFormData>();

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="modelType" className="block text-sm font-medium text-gray-700 mb-1">Model Name / Type</label>
        <input
          id="modelType"
          type="text"
          placeholder="e.g., Simple Box, L-Shaped Wardrobe"
          {...register('modelType')}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        {errors.modelType && <p className="text-sm text-red-500 mt-1">{errors.modelType.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          id="description"
          rows={3}
          placeholder="A brief description of the model..."
          {...register('description')}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
      </div>

      <div>
        <label htmlFor="screenshotUrl" className="block text-sm font-medium text-gray-700 mb-1">Screenshot URL</label>
        <input
          id="screenshotUrl"
          type="url"
          placeholder="https://example.com/image.png"
          {...register('screenshotUrl')}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        {errors.screenshotUrl && <p className="text-sm text-red-500 mt-1">{errors.screenshotUrl.message}</p>}
      </div>
      {/* <p className="text-xs text-muted-foreground">
        This section is for basic model identification.
      </p> */}
    </div>
  );
}
