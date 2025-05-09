/**
 * Custom hook for subtask data
 * Provides state management and API interactions for subtasks
 */

import { useCallback } from 'react';
import { useGet, usePost, usePut, useDelete } from './useApi';
import { Subtask } from './useProject';

interface SubtasksResponse {
  subtasks: Subtask[];
}

interface SubtaskResponse {
  subtask: Subtask;
  message?: string;
}

interface CreateSubtaskData {
  name: string;
  description?: string;
  actionRequired?: string;
  type?: string;
  metadataJson?: string;
}

interface UpdateSubtaskData {
  name?: string;
  description?: string;
  completed?: boolean;
  actionRequired?: string;
  type?: string;
  metadataJson?: string;
}

// Hook for fetching all subtasks for a task
export function useTaskSubtasks(taskId: string | number | null) {
  const endpoint = taskId ? `/projects/tasks/${taskId}/subtasks` : null;
  const { data, error, loading, refetch } = useGet<SubtasksResponse>(
    endpoint || '/projects/tasks/0/subtasks',
    !endpoint
  );
  
  return {
    subtasks: data?.subtasks || [],
    error,
    loading,
    refetch
  };
}

// Hook for creating a subtask
export function useCreateSubtask(taskId: string | number) {
  const postHook = usePost<SubtaskResponse, CreateSubtaskData>();
  
  const createSubtask = useCallback(async (data: CreateSubtaskData) => {
    const result = await postHook.execute(`/projects/tasks/${taskId}/subtasks`, data);
    return result?.subtask;
  }, [taskId, postHook]);
  
  return {
    createSubtask,
    loading: postHook.loading,
    error: postHook.error
  };
}

// Hook for updating a subtask
export function useUpdateSubtask(subtaskId: string | number) {
  const putHook = usePut<SubtaskResponse, UpdateSubtaskData>();
  
  const updateSubtask = useCallback(async (data: UpdateSubtaskData) => {
    const result = await putHook.execute(`/projects/subtasks/${subtaskId}`, data);
    return result?.subtask;
  }, [subtaskId, putHook]);
  
  return {
    updateSubtask,
    loading: putHook.loading,
    error: putHook.error
  };
}

// Hook for toggling a subtask's completion status
export function useToggleSubtaskCompletion(subtaskId: string | number) {
  const putHook = usePut<SubtaskResponse, { completed: boolean }>();
  
  const toggleCompletion = useCallback(async (currentStatus: boolean) => {
    const result = await putHook.execute(`/projects/subtasks/${subtaskId}`, { completed: !currentStatus });
    return result?.subtask;
  }, [subtaskId, putHook]);
  
  return {
    toggleCompletion,
    loading: putHook.loading,
    error: putHook.error
  };
}

// Hook for deleting a subtask
export function useDeleteSubtask() {
  const deleteHook = useDelete<{ message: string }>();
  
  const deleteSubtask = useCallback(async (subtaskId: string | number) => {
    return await deleteHook.execute(`/projects/subtasks/${subtaskId}`);
  }, [deleteHook]);
  
  return {
    deleteSubtask,
    loading: deleteHook.loading,
    error: deleteHook.error
  };
}

// Export types for use in components
export type { CreateSubtaskData, UpdateSubtaskData };
