import useSWR from 'swr';
import { apiClient } from '@/lib/api/client';
import { BomItemType } from '@/components/dashboard/model-management/modelSchemas'; // Import BomItemType from modelSchemas

// Define structure for BOM item details for use in ModelData
interface HookPlankDetails {
  name?: string | null;
  widthLogic?: string | null;
  lengthLogic?: string | null;
  materialCode?: string | null;
  grainDirection?: string | null;
  packetNumber?: number | null;
  plankLocationIdentifier?: string | null;
  edgeBandingType?: string | null; // 'CEB' | 'IEB'
  edgeBanding?: {
    top?: { thickness: 1 | 2; materialCode: string };
    bottom?: { thickness: 1 | 2; materialCode: string };
    left?: { thickness: 1 | 2; materialCode: string };
    right?: { thickness: 1 | 2; materialCode: string };
  } | null;
}

// Define the discriminated union for bomItems within ModelData
type HookBomItem = 
  | { id?: string; itemName: string; itemType: BomItemType.PLANK; itemDescription?: string | null; itemLogicScript?: string | null; addonModelId?: string | null; details: HookPlankDetails | null; }
  | { id?: string; itemName: string; itemType: BomItemType.HARDWARE; itemDescription?: string | null; itemLogicScript?: string | null; addonModelId?: string | null; details: any | null; }
  | { id?: string; itemName: string; itemType: BomItemType.ADDON; itemDescription?: string | null; itemLogicScript?: string | null; addonModelId?: string | null; details: any | null; };

export interface ModelData {
  id?: string;
  modelType: string; 
  name?: string; 
  description: string | null;
  imageUrl: string | null;
  inputParameters?: Array<{
    id?: string;
    inputName: string;
    displayLabel?: string | null;
    inputType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'SELECT' | 'SELECT_MATERIAL';
    defaultValue?: string | null;
    options?: string | null;
    unit?: string | null;
    description?: string | null;
  }>;
  bomItems?: HookBomItem[]; // Use the discriminated union type
}

// Type for the raw API response for a single model
interface ApiModelResponse {
  id: string;
  name: string; // Backend sends 'name'
  description: string | null;
  imageUrl: string | null;
  inputParameters?: any[]; 
  bomItems?: Array<{ // More specific type for bomItems from API
    id?: string;
    itemName: string;
    itemType: string; // itemType from API will be a string like 'PLANK'
    itemDescription?: string | null;
    itemLogicScript?: string | null;
    addonModelId?: string | null;
    details?: any | null; 
  }>;
}


const modelFetcher = async (url: string): Promise<ModelData> => {
  const response = await apiClient.get<ApiModelResponse>(url);
  
  const processedBomItems = (response.bomItems || []).map((item): HookBomItem | null => {
    const commonFields = {
      id: item.id,
      itemName: item.itemName,
      itemDescription: item.itemDescription,
      itemLogicScript: item.itemLogicScript,
      addonModelId: item.addonModelId,
    };

    // Ensure item.details is at least an empty object if it's for PLANK and details are expected
    const itemDetails = item.details === undefined ? null : item.details;

    if (item.itemType === BomItemType.PLANK || item.itemType === 'PLANK') {
      let plankDetails: HookPlankDetails | null = null;
      if (itemDetails === null || typeof itemDetails !== 'object') {
        plankDetails = { name: item.itemName, edgeBanding: {} };
      } else {
        plankDetails = {
          name: itemDetails.name || item.itemName,
          widthLogic: itemDetails.widthLogic,
          lengthLogic: itemDetails.lengthLogic,
          materialCode: itemDetails.materialCode,
          grainDirection: itemDetails.grainDirection,
          packetNumber: itemDetails.packetNumber,
          plankLocationIdentifier: itemDetails.plankLocationIdentifier,
          edgeBandingType: itemDetails.edgeBandingType,
          edgeBanding: itemDetails.edgeBanding || {},
        };
      }
      return { 
        ...commonFields,
        itemType: BomItemType.PLANK, // Use enum member for strong typing
        details: plankDetails
      };
    } else if (item.itemType === BomItemType.HARDWARE || item.itemType === 'HARDWARE') {
      return { 
        ...commonFields,
        itemType: BomItemType.HARDWARE,
        details: itemDetails
      };
    } else if (item.itemType === BomItemType.ADDON || item.itemType === 'ADDON') {
      return { 
        ...commonFields,
        itemType: BomItemType.ADDON,
        details: itemDetails
      };
    } else {
      console.warn("Unknown BOM item type in modelFetcher:", item.itemType);
      return null; 
    }
  }).filter(Boolean) as HookBomItem[];

  const formData: ModelData = {
    id: response.id,
    modelType: response.name,
    name: response.name, 
    description: response.description,
    imageUrl: response.imageUrl,
    inputParameters: response.inputParameters || [],
    bomItems: processedBomItems,
  };
  return formData;
};

export function useModelData(modelId?: string | null) {
  const { 
    data, 
    error, 
    isLoading, 
    mutate 
  } = useSWR<ModelData>(
    modelId ? `/v1/catalogue/${modelId}` : null,
    modelId ? modelFetcher : null, 
    { revalidateOnFocus: false } 
  );

  return {
    model: data,
    isLoading,
    error,
    mutate, 
  };
}

import { usePost, usePut } from './useApi'; // Import usePost and usePut
import { useCallback, useState } from 'react'; // Import useCallback and useState
import { useSWRConfig } from 'swr'; // For cache mutation

// Payload for creating/updating a model via API
// This should match backend DTO expectations
export interface SaveModelPayload {
  name: string;
  description: string | null;
  imageUrl: string | null;
  inputParameters?: any[]; // Should match ModelInputParameterSchema output
  bomItems?: any[];      // Should match DiscriminatedBomItemSchema output
  // Add other fields backend expects
}

// API response for single model (create/update)
interface SingleModelApiResponse {
  id: string; // Assuming backend returns the full model or at least its ID
  // ... other fields of the created/updated model, matching ApiModelResponse
  name: string;
  description: string | null;
  imageUrl: string | null;
  inputParameters?: any[];
  bomItems?: any[];
}

export function useSaveModel() {
  const { execute: executePost, loading: postLoading, error: postError } = usePost<SingleModelApiResponse, SaveModelPayload>();
  const { execute: executePut, loading: putLoading, error: putError } = usePut<SingleModelApiResponse, SaveModelPayload>();
  const { mutate: globalMutate } = useSWRConfig(); // SWR's global mutate function

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);

  const saveModel = useCallback(
    async (
      modelData: SaveModelPayload, // This is the processed data ready for API
      modelId?: string // If modelId is present, it's an update
    ): Promise<SingleModelApiResponse | null> => {
      setIsSaving(true);
      setSaveError(null);
      let response: SingleModelApiResponse | null = null;

      try {
        if (modelId) {
          // Update existing model
          response = await executePut(
            `/v1/catalogue/${modelId}`, 
            modelData,
            (updatedModel) => { // onSuccess for usePut's execute
              globalMutate(`/v1/catalogue/${modelId}`); // Revalidate specific model
              globalMutate('/v1/catalogue'); // Revalidate model list
            }
          );
        } else {
          // Create new model
          response = await executePost(
            '/v1/catalogue', 
            modelData,
            (createdModel) => { // onSuccess for usePost's execute
              globalMutate('/v1/catalogue'); // Revalidate model list
            }
          );
        }

        if (!response) { // If executePost/Put returned null due to an internal error in useApi
          throw postError || putError || new Error("API operation failed to return a result.");
        }
        // If response is present but indicates logical failure (if API wraps in success:false)
        // This part depends on how executePost/Put handle non-2xx responses that still return JSON
        // For now, assuming executePost/Put throw for HTTP errors, and success is implicit in non-error return

      } catch (err) {
        const error = err instanceof Error ? err : new Error('An unknown error occurred during save.');
        setSaveError(error);
        console.error("Error saving model:", error);
        // Re-throw or handle as per component needs, for now, error state is set
        // throw error; // Optionally re-throw
      } finally {
        setIsSaving(false);
      }
      return response; // This will be null if an error was caught and not re-thrown
    },
    [executePost, executePut, postError, putError, globalMutate]
  );

  return { saveModel, isSaving, error: saveError || postError || putError };
}

// TODO: Add useDeleteModel hook later
