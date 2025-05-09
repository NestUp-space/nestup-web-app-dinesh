/**
 * Custom hook for site visit box data
 * Provides state management and API interactions for site visit boxes
 */

import { useCallback } from 'react';
import { useGet, usePost, usePut, useDelete } from './useApi';

export interface SiteVisitBox {
  id: number;
  taskId: number;
  order: number;
  modelType: string; // e.g., "Simple Box", "L-Shaped Box"
  inputs: Record<string, any>; // Store the specific dimensions, adjacencies, material codes, etc.
  createdAt: string;
  updatedAt: string;
}

export interface ModelInfo {
  modelType: string;
  description: string;
  screenshotUrl: string;
  runtimeInputs: Record<string, any>;
}

interface SiteVisitBoxesResponse {
  boxes: SiteVisitBox[];
}

interface SiteVisitBoxResponse {
  box: SiteVisitBox;
}

interface ModelsResponse {
  models: ModelInfo[];
}

interface ModelInfoResponse {
  model: ModelInfo;
}

interface PlankListResponse {
  plankList: any[];
  csvUrl?: string;
}

export interface CreateSiteVisitBoxData {
  modelType: string;
  inputs: Record<string, any>;
  order?: number;
}

export interface UpdateSiteVisitBoxData {
  modelType?: string;
  inputs?: Record<string, any>;
  order?: number;
}

// Hook for fetching all site visit boxes for a task
export function useTaskSiteVisitBoxes(taskId: string | number | null) {
  const endpoint = taskId ? `/tasks/${taskId}/site-visit/boxes` : null;
  const { data, error, loading, refetch } = useGet<SiteVisitBoxesResponse>(
    endpoint || '/tasks/0/site-visit/boxes',
    !endpoint
  );
  
  return {
    boxes: data?.boxes || [],
    error,
    loading,
    refetch
  };
}

// Hook for creating a site visit box
export function useCreateSiteVisitBox(taskId: string | number) {
  const postHook = usePost<SiteVisitBoxResponse, CreateSiteVisitBoxData>();
  
  const createSiteVisitBox = useCallback(async (data: CreateSiteVisitBoxData) => {
    const result = await postHook.execute(`/tasks/${taskId}/site-visit/boxes`, data);
    return result?.box;
  }, [taskId, postHook]);
  
  return {
    createSiteVisitBox,
    loading: postHook.loading,
    error: postHook.error
  };
}

// Hook for updating a site visit box
export function useUpdateSiteVisitBox(boxId: string | number) {
  const putHook = usePut<SiteVisitBoxResponse, UpdateSiteVisitBoxData>();
  
  const updateSiteVisitBox = useCallback(async (data: UpdateSiteVisitBoxData) => {
    const result = await putHook.execute(`/site-visit/boxes/${boxId}`, data);
    return result?.box;
  }, [boxId, putHook]);
  
  return {
    updateSiteVisitBox,
    loading: putHook.loading,
    error: putHook.error
  };
}

// Hook for deleting a site visit box
export function useDeleteSiteVisitBox() {
  const deleteHook = useDelete<{ message: string }>();
  
  const deleteSiteVisitBox = useCallback(async (boxId: string | number) => {
    return await deleteHook.execute(`/site-visit/boxes/${boxId}`);
  }, [deleteHook]);
  
  return {
    deleteSiteVisitBox,
    loading: deleteHook.loading,
    error: deleteHook.error
  };
}

// Hook for fetching available BIM models
export function useAvailableBimModels() {
  const { data, error, loading, refetch } = useGet<ModelsResponse>('/bim/models/info');
  
  return {
    models: data?.models || [],
    error,
    loading,
    refetch
  };
}

// Hook for fetching a specific BIM model info
export function useBimModelInfo(modelType: string | null) {
  const endpoint = modelType ? `/bim/models/${encodeURIComponent(modelType)}/info` : null;
  const { data, error, loading, refetch } = useGet<ModelInfoResponse>(
    endpoint || '/bim/models/default/info',
    !endpoint
  );
  
  return {
    modelInfo: data?.model,
    error,
    loading,
    refetch
  };
}

// Hook for validating model inputs
export function useValidateModelInputs() {
  const postHook = usePost<{ valid: boolean; errors?: string[] }, Record<string, any>>();
  
  const validateInputs = useCallback(async (modelType: string, inputs: Record<string, any>) => {
    return await postHook.execute(`/bim/models/${encodeURIComponent(modelType)}/validate`, inputs);
  }, [postHook]);
  
  return {
    validateInputs,
    loading: postHook.loading,
    error: postHook.error
  };
}

// Hook for generating a plank list for a task
export function useGeneratePlankList(taskId: string | number) {
  const postHook = usePost<PlankListResponse, void>();
  
  const generatePlankList = useCallback(async () => {
    return await postHook.execute(`/tasks/${taskId}/site-visit/generate-planklist`);
  }, [taskId, postHook]);
  
  return {
    generatePlankList,
    loading: postHook.loading,
    error: postHook.error
  };
}

// Hook for downloading a plank list CSV
export function usePlankListDownloadUrl(taskId: string | number) {
  return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${taskId}/site-visit/download-planklist-csv`;
}
