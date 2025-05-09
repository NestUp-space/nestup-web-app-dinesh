/**
 * Custom hook for material data
 * Provides state management and API interactions for materials
 */

import { useCallback } from 'react';
import { useGet, usePost, usePut, useDelete } from './useApi';

export interface Material {
  id: number;
  projectId: number;
  materialId: string; // User-defined unique ID within the project
  plyThickness: number;
  innerLaminateCode: string;
  outerLaminateCode: string;
  overallThickness: number; // Calculated: innerLaminate + plyThickness + outerLaminate
  plyType: string; // e.g., HDHMR, Blockboard
  grainDirection?: string; // Optional, applicable to specific planks
  edgebandingInnerCode: string;
  edgebandingExposedCode: string;
  createdAt: string;
  updatedAt: string;
}

interface MaterialsResponse {
  materials: Material[];
}

interface MaterialResponse {
  material: Material;
}

export interface CreateMaterialData {
  materialId: string;
  plyThickness: number;
  innerLaminateCode: string;
  outerLaminateCode: string;
  plyType: string;
  grainDirection?: string;
  edgebandingInnerCode: string;
  edgebandingExposedCode: string;
}

export interface UpdateMaterialData {
  materialId?: string;
  plyThickness?: number;
  innerLaminateCode?: string;
  outerLaminateCode?: string;
  plyType?: string;
  grainDirection?: string;
  edgebandingInnerCode?: string;
  edgebandingExposedCode?: string;
}

// Hook for fetching all materials for a project
export function useProjectMaterials(projectId: string | number | null) {
  const endpoint = projectId ? `/projects/${projectId}/materials` : null;
  const { data, error, loading, refetch } = useGet<MaterialsResponse>(
    endpoint || '/projects/0/materials',
    !endpoint
  );
  
  return {
    materials: data?.materials || [],
    error,
    loading,
    refetch
  };
}

// Hook for creating a material
export function useCreateMaterial(projectId: string | number) {
  const postHook = usePost<MaterialResponse, CreateMaterialData>();
  
  const createMaterial = useCallback(async (data: CreateMaterialData) => {
    const result = await postHook.execute(`/projects/${projectId}/materials`, data);
    return result?.material;
  }, [projectId, postHook]);
  
  return {
    createMaterial,
    loading: postHook.loading,
    error: postHook.error
  };
}

// Hook for updating a material
export function useUpdateMaterial(materialId: string | number) {
  const putHook = usePut<MaterialResponse, UpdateMaterialData>();
  
  const updateMaterial = useCallback(async (data: UpdateMaterialData) => {
    const result = await putHook.execute(`/materials/${materialId}`, data);
    return result?.material;
  }, [materialId, putHook]);
  
  return {
    updateMaterial,
    loading: putHook.loading,
    error: putHook.error
  };
}

// Hook for deleting a material
export function useDeleteMaterial() {
  const deleteHook = useDelete<{ message: string }>();
  
  const deleteMaterial = useCallback(async (materialId: string | number) => {
    return await deleteHook.execute(`/materials/${materialId}`);
  }, [deleteHook]);
  
  return {
    deleteMaterial,
    loading: deleteHook.loading,
    error: deleteHook.error
  };
}
