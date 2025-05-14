"use client";

import React, { useState, ChangeEvent } from 'react';
import { useFormContext, Controller } from 'react-hook-form'; 
import Image from 'next/image'; // For image preview

// This component assumes it's rendered within a <FormProvider> from ModelBuilderForm
// The 'ModelFormData' type would be defined in ModelBuilderForm.tsx
interface ModelFormData {
  modelType: string;
  description?: string | null;
  imageUrl?: string | null; // Changed from screenshotUrl to imageUrl to match Prisma
  // other fields from the main form schema...
}

interface ModelMetadataEditorProps {
  onFileSelect: (file: File | null) => void; // Callback to pass the selected file to the parent
}

export default function ModelMetadataEditor({ onFileSelect }: ModelMetadataEditorProps) {
  const { register, control, formState: { errors }, setValue, watch } = useFormContext<ModelFormData>();
  // const [selectedFile, setSelectedFile] = useState<File | null>(null); // Managed by parent
  const [previewUrl, setPreviewUrl] = useState<string | null>(watch('imageUrl') || null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onFileSelect(file); // Pass file to parent

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      // The parent (ModelBuilderForm) will handle the upload and setValue('imageUrl', ...)
      // For preview purposes, if imageUrl is not yet set by an upload, this local preview is fine.
      // If an existing imageUrl is present (e.g. editing an existing item), it should be preferred for preview
      // until a new file is selected.
    } else {
      setPreviewUrl(watch('imageUrl') || null); // Revert to existing imageUrl if file is deselected
    }
  };
  
  // Effect to update preview if imageUrl changes from parent (e.g., after upload or initial load)
  React.useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (name === 'imageUrl') {
        setPreviewUrl(value.imageUrl || null);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Column: Model Info */}
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
            rows={4}
            placeholder="A brief description of the model..."
            {...register('description')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
        </div>
      </div>

      {/* Right Column: Image Upload */}
      <div className="space-y-4">
        <div>
          <label htmlFor="catalogueImage" className="block text-sm font-medium text-gray-700 mb-1">Catalogue Image</label>
          <input
            id="catalogueImage"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-indigo-50 file:text-indigo-700
                     hover:file:bg-indigo-100"
          />
          {/* Hidden input to store the image URL from react-hook-form */}
          <input type="hidden" {...register('imageUrl')} />
          
          {previewUrl && (
            <div className="mt-2">
              <Image 
                src={previewUrl} 
                alt="Image Preview" 
                width={300} 
                height={200} 
                className="rounded-md object-contain w-full max-h-[200px]"
              />
            </div>
          )}
          <div className="mt-2 text-xs text-gray-500">
            This image will be displayed in the model selector
          </div>
          {errors.imageUrl && <p className="text-sm text-red-500 mt-1">{errors.imageUrl.message}</p>}
        </div>
      </div>
    </div>
  );
}
