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
  console.log(`[useProjectMaterials] Hook params - projectId: ${projectId}, endpoint: ${endpoint}, enabled: ${enabled}`);

  // useGet will return ServiceResponseWrapper<Material[]>, where Material[] is the direct payload in responseObject
  const { data, error, loading, refetch } = useGet<ServiceResponseWrapper<Material[]>>(
    endpoint || '/projects/0/materials', // Provide a fallback URL if useGet requires one even when disabled.
    !enabled // Pass !enabled as the 'skip' parameter. Fetch if enabled is true (skip is false).
  );

  // DEBUG: Log when the data object from useGet changes
  useEffect(() => {
    console.log('[useProjectMaterials] Data from useGet changed (should be ServiceResponseWrapper<Material[]>):', data);
    if (data && data.success && Array.isArray(data.responseObject)) {
      console.log(`[useProjectMaterials] Materials count from data.responseObject: ${data.responseObject.length}`, data.responseObject);
    } else if (data) {
      console.log('[useProjectMaterials] data.responseObject is not an array, or data.success is false:', data);
    }
  }, [data]);
  
  return {
    // Access the materials array directly from data.responseObject
    materials: (data?.success && Array.isArray(data.responseObject) ? data.responseObject : []) as Material[],
    error,
    loading,
    refetch
  };
}

// Hook for creating a material
export function useCreateMaterial(projectId: string | number) {
  // usePost will return the ServiceResponseWrapper, and its payload is SingleMaterialPayload
  const postHook = usePost<ServiceResponseWrapper<SingleMaterialPayload>, CreateMaterialData>();
  
  const createMaterial = useCallback(async (data: CreateMaterialData) => {
    const resultWrapper = await postHook.execute(`/projects/${projectId}/materials`, data);
    // Extract the actual material from the responseObject
    return resultWrapper?.success ? resultWrapper.responseObject?.material : undefined;
  }, [projectId, postHook]);
  
  return {
    createMaterial,
    loading: postHook.loading,
    error: postHook.error
  };
}

// Hook for updating a material
export function useUpdateMaterial() {
  // usePut will return the ServiceResponseWrapper, and its payload is SingleMaterialPayload
  const putHook = usePut<ServiceResponseWrapper<SingleMaterialPayload>, UpdateMaterialData>();
  
  const updateMaterial = useCallback(async (materialId: string | number, data: UpdateMaterialData) => {
    console.log(`[useUpdateMaterial] Executing update for materialId: ${materialId}`, data);
    const resultWrapper = await putHook.execute(`/materials/${materialId}`, data);
    console.log('[useUpdateMaterial] Update result wrapper:', resultWrapper);
    // Extract the actual material from the responseObject
    return resultWrapper?.success ? resultWrapper.responseObject?.material : undefined;
  }, [putHook]);
  
  return {
    updateMaterial,
    loading: putHook.loading,
    error: putHook.error
  };
}

// Hook for deleting a material
export function useDeleteMaterial() {
  // Assuming delete returns a simple message in the wrapper
  const deleteHook = useDelete<ServiceResponseWrapper<{ message: string }>>();
  
  const deleteMaterial = useCallback(async (materialId: string | number) => {
    const resultWrapper = await deleteHook.execute(`/materials/${materialId}`);
    return resultWrapper;
  }, [deleteHook]);
  
  return {
    deleteMaterial,
    loading: deleteHook.loading,
    error: deleteHook.error
  };
}
