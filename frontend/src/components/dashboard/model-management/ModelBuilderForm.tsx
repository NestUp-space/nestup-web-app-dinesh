"use client";

import React from 'react';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// import { BomItemType } from '@prisma/client'; // REMOVE: Frontend should not import from @prisma/client
import ModelMetadataEditor from './ModelMetadataEditor';
import ModelInputParameterListEditor from './ModelInputParameterListEditor';
import BillOfMaterialListEditor from './BillOfMaterialListEditor';
// import SiteInstructionsEditor from './SiteInstructionsEditor'; // Removed
// import SampleInputsEditor from './SampleInputsEditor'; // Removed
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

// const SiteInstructionSchema = z.object({ // Removed
//   id: z.string().optional(), 
//   text: z.string().min(1, "Instruction text cannot be empty"),
// });

// Define the Zod schema for the entire form
const modelFormSchema = z.object({
  modelType: z.string().min(1, "Model name/type is required"),
  description: z.string().optional().nullable(),
  imageUrl: z.union([
    z.literal(""), 
    z.string().url("Invalid URL format")
  ]).optional().nullable(), // Allows empty string, valid URL, null, or undefined
  // sampleRuntimeInputsJson: z.string().optional().refine((val) => { // Removed
  //   if (!val || val.trim() === "") return true; 
  //   try {
  //     JSON.parse(val);
  //     return true;
  //   } catch (e) {
  //     return false;
  //   }
  // }, { message: "Sample Runtime Inputs must be a valid JSON string or empty" }).nullable(),
  inputParameters: z.array(ModelInputParameterSchema).optional(),
  bomItems: z.array(BillOfMaterialItemSchema).optional(),
  // siteEngineerInstructions: z.array(SiteInstructionSchema).optional(), // Removed
  // sampleOnsiteInputs: z.string().optional().refine((val) => { // Removed
  //   if (!val || val.trim() === "") return true; 
  //   try {
  //     JSON.parse(val);
  //     return true;
  //   } catch (e) {
  //     return false;
  //   }
  // }, { message: "Invalid JSON format for Sample Onsite Inputs" }).nullable(),
});

type ModelFormData = z.infer<typeof modelFormSchema>;

// Explicitly type the inputType to match the Zod enum
type InputTypeEnum = z.infer<typeof ModelInputParameterSchema>['inputType'];

const defaultModelInputParameters: Array<Omit<z.infer<typeof ModelInputParameterSchema>, 'id'>> = [
  { inputName: 'boxHeight', displayLabel: 'Box Height', inputType: 'NUMBER' as InputTypeEnum, defaultValue: '0', unit: 'mm', description: 'The overall height of the box.', options: null },
  { inputName: 'boxWidth', displayLabel: 'Box Width', inputType: 'NUMBER' as InputTypeEnum, defaultValue: '0', unit: 'mm', description: 'The overall width of the box.', options: null },
  { inputName: 'boxDepth', displayLabel: 'Box Depth', inputType: 'NUMBER' as InputTypeEnum, defaultValue: '0', unit: 'mm', description: 'The overall depth of the box.', options: null },
  { inputName: 'leftAdjacency', displayLabel: 'Left Side Adjacency', inputType: 'SELECT' as InputTypeEnum, defaultValue: 'Expose', unit: null, description: 'Defines how the left side of the box is finished or if it connects to another element.', options: 'Expose,Wall,AdjacentBox' },
  { inputName: 'rightAdjacency', displayLabel: 'Right Side Adjacency', inputType: 'SELECT' as InputTypeEnum, defaultValue: 'Expose', unit: null, description: 'Defines how the right side of the box is finished or if it connects to another element.', options: 'Expose,Wall,AdjacentBox' },
  { inputName: 'outerMaterialCode', displayLabel: 'Outer Material', inputType: 'TEXT' as InputTypeEnum, defaultValue: null, unit: null, description: 'The material code for the external surfaces of the box.', options: null },
  { inputName: 'innerMaterialCode', displayLabel: 'Inner Material', inputType: 'TEXT' as InputTypeEnum, defaultValue: null, unit: null, description: 'The material code for the internal surfaces of the box.', options: null },
  { inputName: 'backMaterialCode', displayLabel: 'Back Panel Material', inputType: 'TEXT' as InputTypeEnum, defaultValue: null, unit: null, description: 'The material code for the back panel of the box.', options: null },
  { inputName: 'hasDoor', displayLabel: 'Has Door?', inputType: 'BOOLEAN' as InputTypeEnum, defaultValue: 'false', unit: null, description: 'Indicates if the box includes a door.', options: null },
  { inputName: 'doorExposedSide', displayLabel: 'Door Exposed Side', inputType: 'SELECT' as InputTypeEnum, defaultValue: 'Front', unit: null, description: 'Specifies which side the door is on. Only applicable if \'Has Door?\' is true.', options: 'Front,Left,Right' },
  { inputName: 'numberOfShelves', displayLabel: 'Number of Shelves', inputType: 'NUMBER' as InputTypeEnum, defaultValue: '0', unit: null, description: 'The number of internal shelves in the box.', options: null },
  { inputName: 'skirting', displayLabel: 'Skirting', inputType: 'SELECT' as InputTypeEnum, defaultValue: 'None', unit: null, description: 'Type of skirting to be added to the box, if any.', options: 'None,TypeA,TypeB' } 
];

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
      imageUrl: null, // Changed from screenshotUrl
      inputParameters: defaultModelInputParameters, // MODIFIED HERE
      bomItems: [],
    },
  });

  const { control, register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = methods;
  const { mutate } = useSWRConfig();
  const [selectedImageFile, setSelectedImageFile] = React.useState<File | null>(null);

  const { data: existingModelData, isLoading: isLoadingModel } = useSWR<ModelFormData>(
    modelId ? `/api/v1/catalogue/${modelId}` : null,
    async (url: string) => {
      const response = await apiClient.get(url);
      const modelData = response.data;
      // modelData.imageUrl is already a string or null from backend
      modelData.inputParameters = modelData.inputParameters || [];
      modelData.bomItems = modelData.bomItems || [];
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
    console.log('--- onSubmit CALLED ---'); // Diagnostic log
    console.log('Form data submitted:', formData);
    console.log('Errors from formState:', errors); // Diagnostic log for errors

    // The backend DTO expects sampleRuntimeInputsJson as a string, which it will parse.
    // sampleOnsiteInputs is also expected as a string by the DTO.
    // The Zod schema already validates they are valid JSON strings if not empty/null.
    let finalImageUrl = formData.imageUrl;

    if (selectedImageFile) {
      // Placeholder for actual image upload logic
      // This should call an API endpoint that takes the file and returns a URL
      console.log("Uploading image:", selectedImageFile.name);
      // Example: const uploadResponse = await apiClient.postForm('/files/upload/catalogue-image', { file: selectedImageFile });
      // finalImageUrl = uploadResponse.data.fileUrl;
      // For now, let's simulate this by setting a placeholder or using a local blob URL for testing if needed
      // This part needs a backend endpoint to be fully functional.
      // For the purpose of this task, we'll assume the upload happens and gives a URL.
      // If an actual upload service is not ready, this will need to be adjusted.
      // For now, if a file is selected, we'll just use a placeholder.
      // This should be replaced with actual upload call.
      alert("Image upload functionality is not fully implemented yet. Using placeholder URL if new image selected.");
      finalImageUrl = selectedImageFile ? `/placeholder-uploads/${selectedImageFile.name}` : formData.imageUrl;
    }

    const payload: any = { 
      modelType: formData.modelType, 
      description: formData.description,
      imageUrl: finalImageUrl, // Use the potentially updated image URL
      inputParameters: formData.inputParameters,
      bomItems: formData.bomItems?.map(item => ({
        id: item.id, // Include ID for updates
        itemName: item.itemName,
        itemType: item.itemType,
        itemDescription: item.itemDescription,
        itemLogicScript: item.itemLogicScript, // Pass the script
        addonModelId: item.addonModelId,
      })),
      // siteEngineerInstructions: formData.siteEngineerInstructions, // Removed
      // sampleOnsiteInputs: formData.sampleOnsiteInputs, // Removed
    };
    // Clean up undefined fields from payload that were removed
    if (payload.sampleRuntimeInputsJson === undefined) delete payload.sampleRuntimeInputsJson;
    if (payload.siteEngineerInstructions === undefined) delete payload.siteEngineerInstructions;
    if (payload.sampleOnsiteInputs === undefined) delete payload.sampleOnsiteInputs;


    try {
      console.log('--- Attempting API call ---'); // Diagnostic log
      let response;
      if (modelId) { // Update mode
        console.log(`--- Calling PUT /api/v1/catalogue/${modelId} ---`, payload); // Diagnostic log
        response = await apiClient.put(`/api/v1/catalogue/${modelId}`, payload);
        alert(`Model updated successfully! Model ID: ${modelId}`);
        mutate(`/api/v1/catalogue/${modelId}`); // Revalidate specific model
      } else { // Create mode
        console.log('--- Calling POST /api/v1/catalogue ---', payload); // Diagnostic log
        response = await apiClient.post('/api/v1/catalogue', payload);
        alert(`Model created successfully! Model ID: ${response.data.id}`);
        if (onSaveSuccess) onSaveSuccess(response.data.id);
      }
      mutate('/api/v1/catalogue'); // Revalidate the list of models, assuming this is the correct list endpoint
      console.log('--- API call successful ---'); // Diagnostic log
      
    } catch (apiError: any) {
      console.error("--- API Error ---", apiError); // Diagnostic log
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
          <ModelMetadataEditor onFileSelect={setSelectedImageFile} />
        </div>

        <div className="p-4 border rounded-md">
          <h3 className="text-lg font-semibold mb-3">2. Input Parameters (for Runtime)</h3>
          <ModelInputParameterListEditor />
        </div>
        
        {/* Section 3: Sample Runtime Inputs - REMOVED */}

        <div className="p-4 border rounded-md">
          <h3 className="text-lg font-semibold mb-3">3. Bill of Materials (Planks, Hardware, etc.)</h3> {/* Renumbered from 4 to 3 */}
          <BillOfMaterialListEditor />
        </div>
        
        {/* Section 5: Site Engineer Instructions - REMOVED */}

        {/* Section 6: Sample Onsite Inputs - REMOVED */}

        <div className="flex justify-end space-x-4 pt-4 mb-12"> {/* Added mb-12 for bottom margin */}
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
