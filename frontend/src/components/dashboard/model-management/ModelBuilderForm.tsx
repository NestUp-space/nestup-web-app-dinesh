"use client";

import React from 'react';
import { useForm, FormProvider, SubmitHandler, SubmitErrorHandler } from 'react-hook-form'; // Added SubmitErrorHandler
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
import { Button } from '@/components/dashboard/button'; // Added Button import

// Define Zod Schemas for sub-structures
const ModelInputParameterSchema = z.object({
  id: z.string().optional(),
  inputName: z.string().min(1, "Parameter name is required"),
  displayLabel: z.string().min(1, "Display label is required").optional().nullable(),
  inputType: z.enum(['NUMBER', 'TEXT', 'BOOLEAN', 'SELECT', 'SELECT_MATERIAL']),
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
  itemType: z.nativeEnum(BomItemType),
  itemDescription: z.string().optional().nullable(),
  itemLogicScript: z.string().optional().nullable(),
  addonModelId: z.string().optional().nullable(),
  // details field will be handled by the discriminated union below
});

// Define schemas for each BOM item type's details
const PlankDetailsSchemaFrontend = z.object({
  edgeBanding: z.object({
    top: z.object({ thickness: z.union([z.literal(1), z.literal(2)]), materialCode: z.string() }).optional(),
    bottom: z.object({ thickness: z.union([z.literal(1), z.literal(2)]), materialCode: z.string() }).optional(),
    left: z.object({ thickness: z.union([z.literal(1), z.literal(2)]), materialCode: z.string() }).optional(),
    right: z.object({ thickness: z.union([z.literal(1), z.literal(2)]), materialCode: z.string() }).optional(),
  }).optional().nullable(),
  // Include other plank-specific fields from PlankLogicEditor if they are part of 'details'
  name: z.string().optional().nullable(), // From PlankLogicEditor
  widthLogic: z.string().optional().nullable(), // From PlankLogicEditor
  lengthLogic: z.string().optional().nullable(), // From PlankLogicEditor
  materialCode: z.string().optional().nullable(), // From PlankLogicEditor
  grainDirection: z.string().optional().nullable(), // From PlankLogicEditor
  packetNumber: z.number().optional().nullable(), // From PlankLogicEditor
  plankLocationIdentifier: z.string().optional().nullable(), // From PlankLogicEditor
  edgeBandingType: z.string().optional().nullable(), // From PlankLogicEditor
}).nullable(); // Allow PlankDetails to be null as per backend

const HardwareDetailsSchemaFrontend = z.any().optional().nullable();
const AddonDetailsSchemaFrontend = z.any().optional().nullable();

// Create specific schemas for each item type by extending the base and adding the correct details schema
const PlankBomItemSchemaFrontend = BillOfMaterialItemSchema.extend({
  itemType: z.literal(BomItemType.PLANK),
  details: PlankDetailsSchemaFrontend,
});

const HardwareBomItemSchemaFrontend = BillOfMaterialItemSchema.extend({
  itemType: z.literal(BomItemType.HARDWARE),
  details: HardwareDetailsSchemaFrontend,
});

const AddonBomItemSchemaFrontend = BillOfMaterialItemSchema.extend({
  itemType: z.literal(BomItemType.ADDON),
  details: AddonDetailsSchemaFrontend,
});

// Create the discriminated union for bomItems
const DiscriminatedBomItemSchema = z.discriminatedUnion("itemType", [
  PlankBomItemSchemaFrontend,
  HardwareBomItemSchemaFrontend,
  AddonBomItemSchemaFrontend,
]);


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
  bomItems: z.array(DiscriminatedBomItemSchema).optional(), // Use the discriminated union here
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
  { inputName: 'outerMaterialCode', displayLabel: 'Outer Material', inputType: 'SELECT_MATERIAL' as InputTypeEnum, defaultValue: null, unit: null, description: 'Select the material to be used for the external surfaces of the box. You can choose from available materials during runtime.', options: null },
  { inputName: 'innerMaterialCode', displayLabel: 'Inner Material', inputType: 'SELECT_MATERIAL' as InputTypeEnum, defaultValue: null, unit: null, description: 'Select the material to be used for the internal surfaces of the box. You can choose from available materials during runtime.', options: null },
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
  onDataFetched?: (modelName: string) => void; // New callback prop
}

export default function ModelBuilderForm({
  modelId,
  initialData,
  onSaveSuccess,
  onCancel,
  onDataFetched, // Destructure new prop
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

  const onInvalid: SubmitErrorHandler<ModelFormData> = (validationErrors) => {
    console.error('--- FORM VALIDATION FAILED (onInvalid) ---', validationErrors);
    // You can add more detailed logging or UI feedback here if needed
  };

  const { data: existingModelData, isLoading: isLoadingModel } = useSWR<ModelFormData>(
    modelId ? `/v1/catalogue/${modelId}` : null, // Removed /api prefix
    async (url: string) => {
      const response = await apiClient.get(url); // apiClient.get returns the data directly
      // Ensure data structure matches ModelFormData, especially for nested arrays
      // The backend sends 'name', frontend form uses 'modelType'
      // Ensure bomItems have a default details structure if missing, especially for PLANK
      const processedBomItems = (response.bomItems || []).map((item: any) => {
        if (item.itemType === BomItemType.PLANK && (item.details === undefined || item.details === null)) {
          return { ...item, details: { edgeBanding: {} } }; // Default for PLANK
        } else if ((item.itemType === BomItemType.HARDWARE || item.itemType === BomItemType.ADDON) && item.details === undefined) {
          return { ...item, details: null }; // Default for others
        }
        return item;
      });

      const fetchedData = {
        ...response,
        modelType: response.name,
        inputParameters: response.inputParameters || [],
        bomItems: processedBomItems,
      };
      delete fetchedData.name;
      return fetchedData;
    },
    {
      onSuccess: (data) => {
        if (data) {
          reset(data);
          if (onDataFetched && data.modelType) {
            onDataFetched(data.modelType); // Call the callback with the model name (modelType)
          }
        }
      },
      revalidateOnFocus: false,
    }
  );
  
  const onSubmit: SubmitHandler<ModelFormData> = async (formData) => {
    // console.log('--- onSubmit CALLED ---'); // Diagnostic log removed
    // console.log('Form data submitted:', formData); // Diagnostic log removed
    // console.log('Errors from formState:', errors); // Diagnostic log removed

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
    
    let modelName = formData.modelType;
    if (!modelId) { // Only version name for new models
      try {
        const existingModels = await apiClient.get('/v1/catalogue');
        const modelBaseName = formData.modelType.replace(/ v\d+$/, ""); // Remove existing version suffix if any
        const versions = existingModels
          .filter((m: any) => m.name.startsWith(modelBaseName))
          .map((m: any) => {
            const match = m.name.match(/ v(\d+)$/);
            return match ? parseInt(match[1]) : (m.name === modelBaseName ? 1 : 0);
          })
          .filter((v: number) => v > 0) 
          .sort((a: number, b: number) => a - b);
        
        if (versions.length > 0) {
          const latestVersion = versions[versions.length -1];
          if (existingModels.some((m:any) => m.name === modelBaseName) && !modelBaseName.endsWith(` v${latestVersion}`)) {
             modelName = `${modelBaseName} v${latestVersion + 1}`;
          } else if (!existingModels.some((m:any) => m.name === modelBaseName) && versions.length === 0) {
            // This case means no "Simple Box" and no "Simple Box vX" exists, so use original name
          } else if (versions.includes(1) && modelBaseName === formData.modelType && !formData.modelType.includes(" v")) {
             modelName = `${modelBaseName} v${latestVersion + 1}`;
          }
        } else if (existingModels.some((m:any) => m.name === modelBaseName)) {
           modelName = `${modelBaseName} v2`;
        }


      } catch (error) {
        console.error("Error fetching existing models for versioning:", error);
        // Proceed with original name if fetching fails
      }
    }

    const payload: any = { 
      name: modelName, // Use potentially versioned name
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
        details: item.details, // Include the details field
      })),
      // siteEngineerInstructions: formData.siteEngineerInstructions, // Removed
      // sampleOnsiteInputs: formData.sampleOnsiteInputs, // Removed
    };
    // Clean up undefined fields from payload that were removed
    if (payload.sampleRuntimeInputsJson === undefined) delete payload.sampleRuntimeInputsJson;
    if (payload.siteEngineerInstructions === undefined) delete payload.siteEngineerInstructions;
    if (payload.sampleOnsiteInputs === undefined) delete payload.sampleOnsiteInputs;


    try {
      // console.log('--- Attempting API call ---'); // Diagnostic log removed
      let response;
      if (modelId) { // Update mode
        response = await apiClient.put(`/v1/catalogue/${modelId}`, payload); 
        alert(`Model "${formData.modelType}" (ID: ${modelId}) updated successfully.`);
        mutate(`/v1/catalogue/${modelId}`); 
        if (onSaveSuccess) onSaveSuccess(modelId); // Call onSaveSuccess for updates too
      } else { // Create mode
        response = await apiClient.post('/v1/catalogue', payload); 
        alert(`Model "${formData.modelType}" (ID: ${response.id}) created successfully.`); 
        if (onSaveSuccess) onSaveSuccess(response.id); 
      }
      mutate('/api/v1/catalogue'); // Revalidate the list for both create and update
      
    } catch (apiError: any) {
      const operation = modelId ? 'updating' : 'creating';
      const modelNameInfo = formData.modelType ? `model "${formData.modelType}"` : 'the model';
      const errorMessage = apiError.response?.data?.errors?.[0]?.message || apiError.response?.data?.message || apiError.message || 'An unknown error occurred.';
      alert(`Error ${operation} ${modelNameInfo}: ${errorMessage}`);
    }
  };
  
  if (modelId && isLoadingModel) {
    return <p>Loading model data...</p>;
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
        
        <div className="p-6 border border-light-bw rounded-lg bg-lightest-bw shadow-sm">
          <h3 className="text-xl font-semibold text-dark-text-bw mb-4">1. Basic Information</h3>
          <ModelMetadataEditor onFileSelect={setSelectedImageFile} />
        </div>

        <div className="p-6 border border-light-bw rounded-lg bg-lightest-bw shadow-sm">
          <h3 className="text-xl font-semibold text-dark-text-bw mb-4">2. Input Parameters (for Runtime)</h3>
          <ModelInputParameterListEditor />
        </div>
        
        <div className="p-6 border border-light-bw rounded-lg bg-lightest-bw shadow-sm">
          <h3 className="text-xl font-semibold text-dark-text-bw mb-4">3. Bill of Materials (Planks, Hardware, etc.)</h3>
          <BillOfMaterialListEditor />
        </div>
        
        <div className="flex justify-end space-x-3 pt-6 pb-2">
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : (modelId ? 'Update Model' : 'Create Model')}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
