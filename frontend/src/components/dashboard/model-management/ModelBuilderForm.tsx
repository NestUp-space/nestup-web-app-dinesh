"use client";

import React from 'react';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// import { BomItemType } from '@prisma/client'; // REMOVE: Frontend should not import from @prisma/client
import ModelMetadataEditor from './ModelMetadataEditor';
import ModelInputParameterListEditor from './ModelInputParameterListEditor';
import BillOfMaterialListEditor from './BillOfMaterialListEditor';
import SiteInstructionsEditor from './SiteInstructionsEditor';
import SampleInputsEditor from './SampleInputsEditor'; // For sampleOnsiteInputs (general JSON)
import { apiClient } from '@/lib/api/client';
import useSWR, { useSWRConfig } from 'swr';

// Define Zod Schemas for sub-structures
const ModelInputParameterSchema = z.object({
  id: z.string().optional(),
  inputName: z.string().min(1, "Parameter name is required"),
  displayLabel: z.string().min(1, "Display label is required").optional().nullable(),
  inputType: z.enum(['NUMBER', 'TEXT', 'BOOLEAN', 'SELECT']),
  defaultValue: z.string().optional().nullable(),
  options: z.string().optional().nullable(), 
  unit: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

// Define BomItemType locally for frontend use, matching Prisma's enum values
export enum BomItemType { // Keep this enum definition
  PLANK = 'PLANK',
  HARDWARE = 'HARDWARE',
  ADDON = 'ADDON',
}

const BillOfMaterialItemSchema = z.object({ // Keep this schema definition
  id: z.string().optional(),
  itemName: z.string().min(1, "Item name is required"),
  itemType: z.nativeEnum(BomItemType), // Use locally defined enum
  itemDescription: z.string().optional().nullable(),
  itemLogicScript: z.string().optional().nullable(), // NEW: For JS logic script
  addonModelId: z.string().optional().nullable(),
});

const SiteInstructionSchema = z.object({ // This was the start of the duplicated section to remove
  id: z.string().optional(), 
  text: z.string().min(1, "Instruction text cannot be empty"),
});

// Define the Zod schema for the entire form
const modelFormSchema = z.object({
  modelType: z.string().min(1, "Model name/type is required"),
  description: z.string().optional().nullable(),
  screenshotUrl: z.string().url("Invalid URL format").optional().nullable().or(z.literal('')),
  sampleRuntimeInputsJson: z.string().optional().refine((val) => { // NEW: For sample inputs for script testing
    if (!val || val.trim() === "") return true; 
    try {
      JSON.parse(val);
      return true;
    } catch (e) {
      return false;
    }
  }, { message: "Sample Runtime Inputs must be a valid JSON string or empty" }).nullable(),
  inputParameters: z.array(ModelInputParameterSchema).optional(),
  bomItems: z.array(BillOfMaterialItemSchema).optional(),
  siteEngineerInstructions: z.array(SiteInstructionSchema).optional(),
  sampleOnsiteInputs: z.string().optional().refine((val) => { 
    if (!val || val.trim() === "") return true; 
    try {
      JSON.parse(val);
      return true;
    } catch (e) {
      return false;
    }
  }, { message: "Invalid JSON format for Sample Onsite Inputs" }).nullable(),
});

type ModelFormData = z.infer<typeof modelFormSchema>;

interface ModelBuilderFormProps {
  modelId?: string; 
  initialData?: Partial<ModelFormData>; 
  onSaveSuccess?: (modelId: string) => void;
  onCancel?: () => void;
}

export default function ModelBuilderForm({
  modelId,
  initialData,
  onSaveSuccess,
  onCancel,
}: ModelBuilderFormProps) {
  const methods = useForm<ModelFormData>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: initialData || {
      modelType: '',
      description: null,
      screenshotUrl: null,
      sampleRuntimeInputsJson: '{}', // Default to empty JSON string
      inputParameters: [],
      bomItems: [],
      siteEngineerInstructions: [],
      sampleOnsiteInputs: '{}', 
    },
  });

  const { control, register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = methods;
  const { mutate } = useSWRConfig();

  const { data: existingModelData, isLoading: isLoadingModel } = useSWR<ModelFormData>(
    modelId ? `/model-definitions/${modelId}` : null,
    async (url: string) => {
      const response = await apiClient.get(url);
      const modelData = response.data;
      // Ensure JSON string fields are correctly formatted for the form
      modelData.sampleOnsiteInputs = (modelData.sampleOnsiteInputs && typeof modelData.sampleOnsiteInputs === 'object') 
        ? JSON.stringify(modelData.sampleOnsiteInputs, null, 2) 
        : (modelData.sampleOnsiteInputs || '{}');
      modelData.sampleRuntimeInputsJson = (modelData.sampleRuntimeInputsJson && typeof modelData.sampleRuntimeInputsJson === 'object')
        ? JSON.stringify(modelData.sampleRuntimeInputsJson, null, 2)
        : (modelData.sampleRuntimeInputsJson || '{}');
      
      modelData.inputParameters = modelData.inputParameters || [];
      modelData.bomItems = modelData.bomItems || [];
      modelData.siteEngineerInstructions = modelData.siteEngineerInstructions || [];
      return modelData;
    },
    {
      onSuccess: (data) => {
        if (data) reset(data);
      },
      revalidateOnFocus: false,
    }
  );
  
  const onSubmit: SubmitHandler<ModelFormData> = async (formData) => {
    console.log('Form data submitted:', formData);

    // The backend DTO expects sampleRuntimeInputsJson as a string, which it will parse.
    // sampleOnsiteInputs is also expected as a string by the DTO.
    // The Zod schema already validates they are valid JSON strings if not empty/null.

    const payload = {
      modelType: formData.modelType, // Maps to ModelDefinition.name
      description: formData.description,
      screenshotUrl: formData.screenshotUrl,
      sampleRuntimeInputsJson: formData.sampleRuntimeInputsJson, // Pass as string
      inputParameters: formData.inputParameters,
      bomItems: formData.bomItems?.map(item => ({
        id: item.id, // Include ID for updates
        itemName: item.itemName,
        itemType: item.itemType,
        itemDescription: item.itemDescription,
        itemLogicScript: item.itemLogicScript, // Pass the script
        addonModelId: item.addonModelId,
      })),
      siteEngineerInstructions: formData.siteEngineerInstructions, // Pass as is
      sampleOnsiteInputs: formData.sampleOnsiteInputs, // Pass as string
    };

    try {
      let response;
      if (modelId) { // Update mode
        response = await apiClient.put(`/model-definitions/${modelId}`, payload);
        alert(`Model updated successfully! Model ID: ${modelId}`);
        mutate(`/model-definitions/${modelId}`); // Revalidate specific model
      } else { // Create mode
        response = await apiClient.post('/model-definitions', payload);
        alert(`Model created successfully! Model ID: ${response.data.id}`);
        if (onSaveSuccess) onSaveSuccess(response.data.id);
      }
      mutate('/model-definitions'); // Revalidate the list of models
      
    } catch (apiError: any) {
      console.error("API Error:", apiError);
      const errorMessage = apiError.response?.data?.errors?.[0]?.message || apiError.response?.data?.message || apiError.message || 'An unknown error occurred.';
      alert(`Error: ${errorMessage}`);
    }
  };
  
  if (modelId && isLoadingModel) {
    return <p>Loading model data...</p>;
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        <div className="p-4 border rounded-md">
          <h3 className="text-lg font-semibold mb-3">1. Basic Information</h3>
          <ModelMetadataEditor />
        </div>

        <div className="p-4 border rounded-md">
          <h3 className="text-lg font-semibold mb-3">2. Input Parameters (for Runtime)</h3>
          <ModelInputParameterListEditor />
        </div>
        
        <div className="p-4 border rounded-md">
          <h3 className="text-lg font-semibold mb-3">3. Sample Runtime Inputs (for Testing Scripts)</h3>
          {/* UI for sampleRuntimeInputsJson */}
          <div>
            <label htmlFor="sampleRuntimeInputsJson" className="block text-sm font-medium text-gray-700 mb-1">
              Sample Runtime Inputs (JSON format)
            </label>
            <textarea
              id="sampleRuntimeInputsJson"
              {...register("sampleRuntimeInputsJson")}
              rows={6}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder='e.g., {"boxHeight": 1000, "boxWidth": 600, "materialCode": "MW001"}'
            />
            {errors.sampleRuntimeInputsJson && (
              <p className="text-sm text-red-500 mt-1">{errors.sampleRuntimeInputsJson.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Provide a JSON object with sample values for the input parameters defined above. This will be used to test your BOM item logic scripts.
            </p>
          </div>
        </div>

        <div className="p-4 border rounded-md">
          <h3 className="text-lg font-semibold mb-3">4. Bill of Materials (Planks, Hardware, etc.)</h3>
          <BillOfMaterialListEditor />
        </div>
        
        <div className="p-4 border rounded-md">
          <h3 className="text-lg font-semibold mb-3">5. Site Engineer Instructions</h3>
          <SiteInstructionsEditor />
        </div>

        <div className="p-4 border rounded-md">
          <h3 className="text-lg font-semibold mb-3">6. Sample Onsite Inputs (General Reference JSON)</h3>
          <SampleInputsEditor /> {/* This was for the old sampleOnsiteInputs, might be redundant or repurposed */}
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button 
            type="button" 
            className="px-4 py-2 border rounded-md hover:bg-gray-100" 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 border rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : (modelId ? 'Update Model' : 'Create Model')}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
