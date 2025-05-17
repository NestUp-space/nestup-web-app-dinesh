/**
 * Custom hook for material data
 * Provides state management and API interactions for materials
 */

import { useCallback, useEffect } from 'react';
import { useGet, usePost, usePut, useDelete } from './useApi';
import { PLY_THICKNESS_VALUES } from '@/constants/materialConstants';

export interface Material {
  id: number;
  projectId: number;
  materialId: string; // User-defined unique ID within the project
  plyThickness: typeof PLY_THICKNESS_VALUES[number];
  innerLaminateCode: string;
  outerLaminateCode: string;
  overallThickness: number; // Calculated: innerLaminate + plyThickness + outerLaminate
  plyType: string; // e.g., HDHMR, Blockboard
  grainDirection: 'Y' | 'N'; // Updated to only allow Y/N
  createdAt: string;
  updatedAt: string;
}

// For a single material, the responseObject IS the Material object wrapped
interface SingleMaterialPayload {
  material: Material;
}

// Generic wrapper for your backend's standard API response
interface ServiceResponseWrapper<Payload> {
  success: boolean;
  message: string;
  responseObject: Payload;
  statusCode: number;
}


export interface CreateMaterialData {
  materialId: string;
  plyThickness: typeof PLY_THICKNESS_VALUES[number];
  innerLaminateCode: string;
  outerLaminateCode: string;
  plyType: string;
  grainDirection: 'Y' | 'N';
}

export interface UpdateMaterialData {
  materialId?: string;
  plyThickness?: typeof PLY_THICKNESS_VALUES[number];
  innerLaminateCode?: string;
  outerLaminateCode?: string;
  plyType?: string;
  grainDirection?: 'Y' | 'N';
}

// Hook for fetching all materials for a project
export function useProjectMaterials(projectId: string | number | null) {
  const endpoint = projectId ? `/projects/${projectId}/materials` : null;
  const enabled = !!endpoint;

  // DEBUG: Log parameters to observe hook behavior and ensure correct fetch conditions.
  console.log(`[useProjectMaterials] Initializing for projectId: ${projectId}. Endpoint: ${endpoint}, Enabled: ${enabled}`);

  // useGet will return ServiceResponseWrapper<Material[]>, where Material[] is the direct payload in responseObject
  const { data, error, loading, refetch } = useGet<ServiceResponseWrapper<Material[]>>(
    endpoint || '/projects/0/materials', // Provide a fallback URL if useGet requires one even when disabled.
    !enabled // Pass !enabled as the 'skip' parameter. Fetch if enabled is true (skip is false).
  );

  // DEBUG: Log when the data object from useGet changes, and what is being returned
  useEffect(() => {
    console.log('[useProjectMaterials] Data from useGet changed. Current data:', data);
    if (data) {
      if (data.success && Array.isArray(data.responseObject)) {
        console.log(`[useProjectMaterials] Successfully fetched ${data.responseObject.length} materials.`, data.responseObject);
      } else if (data.success === false) {
        console.warn('[useProjectMaterials] API call was not successful. Message:', data.message, 'Full response:', data);
      } else if (!Array.isArray(data.responseObject)) {
        console.warn('[useProjectMaterials] responseObject is not an array. Full response:', data);
      }
    } else {
      console.log('[useProjectMaterials] Data from useGet is currently null or undefined.');
    }
  }, [data]);
  
  const materialsToReturn = (data?.success && Array.isArray(data.responseObject) ? data.responseObject : []) as Material[];
  // console.log('[useProjectMaterials] Returning materials:', materialsToReturn); // Potentially very verbose

  return {
    materials: materialsToReturn,
    error,
    loading,
    refetch
  };
}

// Hook for creating a material
export function useCreateMaterial(projectId: string | number) {
  console.log(`[useCreateMaterial] Initializing for projectId: ${projectId}`);
  // The backend POST /projects/:id/materials expects { materials: MaterialInput[] }
  // and returns ServiceResponseWrapper<Material[]>
  // The backend replaces all existing materials with the provided list.
  const postHook = usePost<ServiceResponseWrapper<Material[]>, { materials: CreateMaterialData[] }>();
  
  const createMaterial = useCallback(async (newMaterialData: CreateMaterialData, existingMaterials: Material[]) => {
    console.log(`[useCreateMaterial] Attempting to create material for projectId: ${projectId} with data:`, newMaterialData);
    console.log('[useCreateMaterial] Existing materials count:', existingMaterials.length);

    // Map existing materials to CreateMaterialData format if necessary, or ensure they are compatible.
    // For now, assuming CreateMaterialData is a subset of Material or compatible.
    // We need to ensure we don't send back fields like 'id', 'createdAt', 'updatedAt', 'overallThickness'
    // if the backend expects only CreateMaterialData fields for existing items.
    // Let's assume the backend can handle the full Material object for existing items if it's just updating.
    // However, the endpoint is for "materials" plural, suggesting a full replacement.
    // It's safer to map existing materials to the expected input structure if they differ.

    const existingMaterialsAsInput = existingMaterials.map(m => ({
      materialId: m.materialId,
      plyThickness: m.plyThickness,
      innerLaminateCode: m.innerLaminateCode,
      outerLaminateCode: m.outerLaminateCode,
      plyType: m.plyType,
      grainDirection: m.grainDirection,
    }));
    
    const payload = { materials: [...existingMaterialsAsInput, newMaterialData] };
    console.log('[useCreateMaterial] Payload for POST (combining existing and new):', payload);
    
    const resultWrapper = await postHook.execute(`/projects/${projectId}/materials`, payload);
    console.log('[useCreateMaterial] Response from postHook.execute:', resultWrapper);
    
    if (resultWrapper?.success && Array.isArray(resultWrapper.responseObject) && resultWrapper.responseObject.length > 0) {
      // Assuming the created material is the first one in the returned array,
      // or matches the input materialId if the backend preserves it.
      // This part might need to be more robust if the backend doesn't guarantee order or exact return.
      const createdMaterial = resultWrapper.responseObject.find(m => m.materialId === newMaterialData.materialId);
      if (createdMaterial) {
        console.log('[useCreateMaterial] Material processed successfully (found in response list):', createdMaterial);
        return createdMaterial;
      } else {
        console.error('[useCreateMaterial] Material creation reported success, but the new material was not found in the response list.', resultWrapper.responseObject);
        // Fallback to first item if specific one not found, though this is less ideal
        // return resultWrapper.responseObject[0]; 
        throw new Error('Material created but not found in response.');
      }
    } else if (resultWrapper?.success && Array.isArray(resultWrapper.responseObject) && resultWrapper.responseObject.length === 0) {
      console.warn('[useCreateMaterial] Material creation reported success, but the response list was empty. This might indicate an issue if a material was expected.', resultWrapper);
      // This case is problematic as we don't have a material object to return.
      // Depending on strictness, either throw an error or return undefined.
      throw new Error('Material creation succeeded but returned an empty list.');
    }
    else {
      console.error('[useCreateMaterial] Failed to create material. Wrapper:', resultWrapper);
      const message = resultWrapper?.message || 'Unknown error during material creation.';
      throw new Error(message);
    }
  }, [projectId, postHook]);
  
  return {
    createMaterial,
    loading: postHook.loading,
    error: postHook.error
  };
}

// Hook for updating a material
export function useUpdateMaterial() {
  console.log('[useUpdateMaterial] Initializing.');
  // usePut will return the ServiceResponseWrapper, and its payload is SingleMaterialPayload
  const putHook = usePut<ServiceResponseWrapper<SingleMaterialPayload>, UpdateMaterialData>();
  
  const updateMaterial = useCallback(async (materialId: string | number, materialData: UpdateMaterialData) => {
    console.log(`[useUpdateMaterial] Attempting to update materialId: ${materialId} with data:`, materialData);
    const resultWrapper = await putHook.execute(`/materials/${materialId}`, materialData);
    console.log('[useUpdateMaterial] Response from putHook.execute:', resultWrapper);

    if (resultWrapper?.success && resultWrapper.responseObject?.material) {
      console.log('[useUpdateMaterial] Material updated successfully:', resultWrapper.responseObject.material);
      return resultWrapper.responseObject.material;
    } else {
      console.error('[useUpdateMaterial] Failed to update material or extract from response. Wrapper:', resultWrapper);
      const message = resultWrapper?.message || 'Unknown error during material update.';
      throw new Error(message);
    }
  }, [putHook]);
  
  return {
    updateMaterial,
    loading: putHook.loading,
    error: putHook.error
  };
}

// Hook for deleting a material
export function useDeleteMaterial() {
  console.log('[useDeleteMaterial] Initializing.');
  // Assuming delete returns a simple message in the wrapper
  const deleteHook = useDelete<ServiceResponseWrapper<{ message: string }>>();
  
  const deleteMaterial = useCallback(async (materialId: string | number) => {
    console.log(`[useDeleteMaterial] Attempting to delete materialId: ${materialId}`);
    const resultWrapper = await deleteHook.execute(`/materials/${materialId}`);
    console.log('[useDeleteMaterial] Response from deleteHook.execute:', resultWrapper);

    if (resultWrapper?.success) {
      console.log('[useDeleteMaterial] Material deleted successfully. Message:', resultWrapper.message);
      return resultWrapper; // Or perhaps just resultWrapper.success or a custom success object
    } else {
      console.error('[useDeleteMaterial] Failed to delete material. Wrapper:', resultWrapper);
      const message = resultWrapper?.message || 'Unknown error during material deletion.';
      throw new Error(message);
    }
  }, [deleteHook]);
  
  return {
    deleteMaterial,
    loading: deleteHook.loading,
    error: deleteHook.error
  };
}
