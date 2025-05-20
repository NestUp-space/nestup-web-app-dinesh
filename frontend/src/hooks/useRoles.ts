import { useGet, usePut, usePost } from './useApi'; // Added usePost
import { useCallback } from 'react'; // Added useCallback

// Define Role type based on its usage in RolesPage.tsx
// This should align with the backend response structure for a role.
// If a global Role type exists in @/types, it should be used/aligned.
export interface PermissionRecord { // Exporting PermissionRecord
  [key: string]: boolean;
}

export interface Role {
  id: number;
  name: string;
  type: string; // e.g., 'admin', 'custom', 'client' - needs clarification from backend
  permissions: PermissionRecord;
  // Add other fields like description, createdAt, updatedAt if available and needed
}

// Assuming the API /api/roles returns an object like { roles: Role[] }
// or if it's wrapped like { success: boolean, data: { roles: Role[] } }
// For now, let's assume apiClient.get returns the direct payload { roles: Role[] }
// based on RolesPage.tsx: const data = await response.json(); if (data.success) { setRoles(data.roles); }
// This implies the structure is { success: boolean, roles: Role[] }
// So, useGet should be typed for this structure.

interface RolesApiResponse {
  success: boolean;
  roles: Role[];
  message?: string;
}

export function useRoles() {
  const endpoint = '/api/roles';
  const { data, error, loading, refetch } = useGet<RolesApiResponse>(endpoint);

  return {
    roles: data?.success ? data.roles : [],
    error,
    loading,
    refetch,
  };
}

// Hook for updating a role's name or permissions
interface UpdateRolePayload {
  name?: string;
  permissions?: PermissionRecord;
}

// Assuming the update endpoint returns the updated Role object wrapped in a success structure
interface UpdateRoleApiResponse {
  success: boolean;
  role: Role; // Or whatever the backend returns on successful update
  message?: string;
}

export function useUpdateRole() {
  const { execute, loading, error } = usePut<UpdateRoleApiResponse, UpdateRolePayload>();

  const updateRole = useCallback(
    async (roleId: number, payload: UpdateRolePayload, onSuccessCallback?: (updatedRole: Role) => void) => {
      const result = await execute(
        `/api/roles/${roleId}`,
        payload,
        (response: UpdateRoleApiResponse) => { // Typed response parameter
          if (response?.success && response.role) {
            if (onSuccessCallback) {
              onSuccessCallback(response.role);
            }
          } else {
            // This case might indicate a successful HTTP request but logical failure from backend
            // Or if the response structure is not as expected.
            // The error state from usePut should capture HTTP errors.
            console.error("Update role response was not successful or role data missing", response);
            // Optionally throw an error here if needed, or let the component handle it via returned error state
          }
        }
      );
      
      // The execute function in usePut returns the result directly.
      // If an error occurred during execute (e.g. network error, HTTP 4xx/5xx), 
      // the error state from usePut will be set, and result might be null.
      if (result?.success && result.role) {
        return result.role;
      } else if (result && !result.success) {
        throw new Error(result.message || 'Failed to update role due to server error.');
      } else if (!result && !error) { // No result and no error from usePut means something unexpected
        throw new Error('Failed to update role for an unknown reason.');
      }
      // If error is already set by usePut, no need to throw again unless customizing the message.
      // If result is null due to an error, the error state from usePut should be checked by the component.
      return null; // Or throw error if preferred for components to try/catch
    },
    [execute, error] // Added error to dependency array
  );

  return { updateRole, loading, error };
}

// Hook for creating a role
interface CreateRolePayload {
  name: string;
  permissions: PermissionRecord;
  // type?: string; // Backend might auto-assign or have a default
}

// Assuming the create endpoint returns the new Role object wrapped
interface CreateRoleApiResponse {
  success: boolean;
  role: Role; 
  message?: string;
}

export function useCreateRole() {
  const { execute, loading, error } = usePost<CreateRoleApiResponse, CreateRolePayload>();

  const createRole = useCallback(
    async (payload: CreateRolePayload, onSuccessCallback?: (newRole: Role) => void) => {
      const result = await execute(
        `/api/roles`,
        payload,
        (response: CreateRoleApiResponse) => { // onSuccess for usePost's execute
          if (response?.success && response.role) {
            if (onSuccessCallback) {
              onSuccessCallback(response.role);
            }
          } else {
            console.error("Create role response was not successful or role data missing", response);
          }
        }
      );

      if (result?.success && result.role) {
        return result.role;
      } else if (result && !result.success) {
        throw new Error(result.message || 'Failed to create role due to server error.');
      } else if (!result && !error) {
        throw new Error('Failed to create role for an unknown reason.');
      }
      return null;
    },
    [execute, error]
  );

  return { createRole, loading, error };
}
