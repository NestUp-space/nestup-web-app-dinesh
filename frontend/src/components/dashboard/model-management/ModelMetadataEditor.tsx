"use client";

import React, { useState, ChangeEvent } from 'react';
import { useFormContext } from 'react-hook-form'; 
import Image from "next/legacy/image"; 
import { Input } from '@/components/ui/input'; 
import { Label } from '@/components/ui/label';   
import { cn } from '@/lib/utils';

interface ModelFormData {
  modelType: string;
  description?: string | null;
  imageUrl?: string | null;
}

interface ModelMetadataEditorProps {
  onFileSelect: (file: File | null) => void; 
}

export default function ModelMetadataEditor({ onFileSelect }: ModelMetadataEditorProps) {
  const { register, formState: { errors }, watch } = useFormContext<ModelFormData>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(watch('imageUrl') || null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onFileSelect(file); 

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(watch('imageUrl') || null); 
    }
  };
  
  React.useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (name === 'imageUrl') {
        setPreviewUrl(value.imageUrl || null);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      {/* Left Column: Model Info */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="modelType">Model Name / Type</Label>
          <Input
            id="modelType"
            type="text"
            placeholder="e.g., Simple Box, L-Shaped Wardrobe"
            {...register('modelType')}
            className={cn(errors.modelType && "border-red-500 focus-visible:ring-red-500")}
          />
          {errors.modelType && <p className="text-xs text-red-600 mt-1">{errors.modelType.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            rows={6} 
            placeholder="A brief description of the model, its use cases, and key features..."
            {...register('description')}
            className={cn(
              "block w-full rounded-md border border-light-bw bg-lightest-bw px-3 py-2 text-sm text-dark-text-bw ring-offset-lightest-bw placeholder:text-dark-text-bw/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-color focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              errors.description && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
        </div>
      </div>

      {/* Right Column: Image Upload */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="catalogueImage">Catalogue Image</Label>
          <Input
            id="catalogueImage"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={cn(errors.imageUrl && "border-red-500 focus-visible:ring-red-500")}
          />
          <input type="hidden" {...register('imageUrl')} />
          
          {previewUrl && (
            <div className="mt-3 p-2 border border-light-bw rounded-md bg-lighter-bw/30 aspect-video flex items-center justify-center">
              <Image 
                src={previewUrl} 
                alt="Image Preview" 
                width={280} 
                height={180} 
                className="rounded-md object-contain max-h-[180px] w-auto"
              />
            </div>
          )}
          <p className="text-xs text-dark-text-bw/70 mt-1">
            This image will be displayed in the model selector. Recommended aspect ratio 16:9.
          </p>
          {errors.imageUrl && <p className="text-xs text-red-600 mt-1">{errors.imageUrl.message}</p>}
        </div>
      </div>
    </div>
  );
}
