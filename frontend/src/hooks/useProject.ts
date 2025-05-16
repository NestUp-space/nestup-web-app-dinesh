/**
 * Custom hook for project data
 * Provides state management and API interactions for projects
 */

import { useState, useCallback } from 'react';
import { useGet, usePost, usePut, useDelete } from './useApi';

interface Project {
  id: number;
  name: string;
  description?: string;
  address?: string;
  location?: string;
  sqft?: number;
  status?: { id: number; status: string };
  designer?: { id: number; name: string; email: string };
  projectManager?: { id: number; name: string; email: string };
  engineer?: { id: number; name: string; email: string };
  estimatedTime?: string;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
  materials?: { id: number; name: string }[]; // Added materials array
}

interface Task {
  id: number;
  name: string;
  stage?: string;
  uploaderRole?: string;
  viewerRoles?: string;
  actionRequired?: string;
  status: { id: number; status: string };
  createdAt: string;
  updatedAt: string;
  metadataJson?: string; // For additional structured data like associated frontend components
  subtasks?: Subtask[];
}

interface Subtask {
  id: number;
  name: string;
  description?: string;
  actionRequired?: string;
  type?: string;
  metadataJson?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  taskId: number;
}

interface ProjectsResponse {
  projects: Project[];
}

interface ProjectResponse {
  project: Project;
}

interface CreateProjectData {
  name: string;
  description?: string;
  address?: string;
  location?: string;
  sqft?: number;
  estimatedTime?: string;
  vbCount?: number;
  statusId?: number;
  designerId?: number;
  projectManagerId?: number;
  engineerId?: number;
}

interface UpdateProjectData {
  name?: string;
  description?: string;
  address?: string;
  location?: string;
  sqft?: number;
  estimatedTime?: string;
  vbCount?: number;
  statusId?: number;
  designerId?: number;
  projectManagerId?: number;
  engineerId?: number;
}

// Hook for fetching all projects
export function useProjects() {
  const { data, error, loading, refetch } = useGet<ProjectsResponse>('/projects');
  
  return {
    projects: data?.projects || [],
    error,
    loading,
    refetch
  };
}

// Hook for fetching a single project
export function useProject(projectId: string | number | null) {
  const endpoint = projectId ? `/projects/${projectId}` : null;
  const { data, error, loading, refetch } = useGet<ProjectResponse>(
    endpoint || '/projects/0',
    !endpoint
  );
  
  return {
    project: data?.project,
    error,
    loading,
    refetch
  };
}

// Hook for creating a project
export function useCreateProject() {
  const postHook = usePost<ProjectResponse, CreateProjectData>();
  
  const createProject = useCallback(async (data: CreateProjectData) => {
    const result = await postHook.execute('/projects', data);
    return result?.project;
  }, [postHook]);
  
  return {
    createProject,
    loading: postHook.loading,
    error: postHook.error
  };
}

// Hook for updating a project
export function useUpdateProject(projectId: string | number) {
  const putHook = usePut<ProjectResponse, UpdateProjectData>();
  
  const updateProject = useCallback(async (data: UpdateProjectData) => {
    const result = await putHook.execute(`/projects/${projectId}`, data);
    return result?.project;
  }, [projectId, putHook]);
  
  return {
    updateProject,
    loading: putHook.loading,
    error: putHook.error
  };
}

// Hook for deleting a project
export function useDeleteProject() {
  const deleteHook = useDelete<{ message: string }>();
  
  const deleteProject = useCallback(async (projectId: string | number) => {
    return await deleteHook.execute(`/projects/${projectId}`);
  }, [deleteHook]);
  
  return {
    deleteProject,
    loading: deleteHook.loading,
    error: deleteHook.error
  };
}

// Export types for use in components
export type { Project, Task, Subtask, CreateProjectData, UpdateProjectData };
