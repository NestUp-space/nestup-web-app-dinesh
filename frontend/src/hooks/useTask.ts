/**
 * Custom hook for task data
 * Provides state management and API interactions for tasks
 */

import { useCallback } from 'react';
import { useGet, usePost, usePut, useDelete } from './useApi';
import { Task, Subtask } from './useProject';

interface TasksResponse {
  tasks: Task[];
}

interface TaskResponse {
  task: Task;
}

interface CreateTaskData {
  name: string;
  stage?: string;
  statusId?: number;
  uploaderRole?: string;
  viewerRoles?: string | string[];
}

interface UpdateTaskData {
  name?: string;
  stage?: string;
  statusId?: number;
  uploaderRole?: string;
  viewerRoles?: string | string[];
}

// Hook for fetching all tasks for a project
export function useProjectTasks(projectId: string | number | null) {
  const endpoint = projectId ? `/projects/${projectId}/tasks` : null;
  const { data, error, loading, refetch } = useGet<TasksResponse>(
    endpoint || '/projects/0/tasks',
    !endpoint
  );
  
  return {
    tasks: data?.tasks || [],
    error,
    loading,
    refetch
  };
}

// Hook for creating a task
export function useCreateTask(projectId: string | number) {
  const postHook = usePost<TaskResponse, CreateTaskData>();
  
  const createTask = useCallback(async (data: CreateTaskData) => {
    const result = await postHook.execute(`/projects/${projectId}/tasks`, data);
    return result?.task;
  }, [projectId, postHook]);
  
  return {
    createTask,
    loading: postHook.loading,
    error: postHook.error
  };
}

// Hook for updating a task
export function useUpdateTask(taskId: string | number) {
  const putHook = usePut<TaskResponse, UpdateTaskData>();
  
  const updateTask = useCallback(async (data: UpdateTaskData) => {
    const result = await putHook.execute(`/projects/tasks/${taskId}`, data);
    return result?.task;
  }, [taskId, putHook]);
  
  return {
    updateTask,
    loading: putHook.loading,
    error: putHook.error
  };
}

// Hook for updating a task's status
export function useUpdateTaskStatus(taskId: string | number) {
  const putHook = usePut<{ message: string }, { status: number }>();
  
  const updateTaskStatus = useCallback(async (statusId: number) => {
    return await putHook.execute(`/projects/tasks/${taskId}/status`, { status: statusId });
  }, [taskId, putHook]);
  
  return {
    updateTaskStatus,
    loading: putHook.loading,
    error: putHook.error
  };
}

// Hook for deleting a task
export function useDeleteTask() {
  const deleteHook = useDelete<{ message: string }>();
  
  const deleteTask = useCallback(async (taskId: string | number) => {
    return await deleteHook.execute(`/projects/tasks/${taskId}`);
  }, [deleteHook]);
  
  return {
    deleteTask,
    loading: deleteHook.loading,
    error: deleteHook.error
  };
}

// Export types for use in components
export type { CreateTaskData, UpdateTaskData };
