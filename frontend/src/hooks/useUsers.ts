import { useGet } from './useApi';
import { User } from '@/types'; // Assuming User type is in @/types

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  // totalPages: number; // If backend provides this
}

interface UseUsersListParams {
  currentPage: number;
  pageSize: number;
  selectedRole?: string | null;
}

export function useUsersList({ currentPage, pageSize, selectedRole }: UseUsersListParams) {
  let endpoint = `/api/users?page=${currentPage}&pageSize=${pageSize}`;
  if (selectedRole && selectedRole !== 'all') { // Assuming 'all' means no filter
    endpoint += `&roleType=${selectedRole}`;
  }

  // The useGet hook expects the API to return data directly, or an object with a 'data' property.
  // Based on UserList.tsx, the response is { data: { users: [], total: ... } }
  // So, we need to adjust the generic type for useGet or how we access data.
  // Let's assume useGet returns the direct payload, and apiClient handles the .data.data unwrapping if necessary.
  // Or, we handle it here. For now, let's assume useGet returns the structure { users: [], total: ... }
  // If apiClient.get returns { data: { users: ... } }, then useGet<UsersApiResponseWrapper>
  // where UsersApiResponseWrapper is { data: UsersResponse }
  // For now, assuming useGet returns UsersResponse directly.
  // Correcting assumption: API likely returns { success: boolean, data: UsersResponse, ... }
  // and apiClient.get might return the 'data' part of that, so UsersResponse.
  // However, UserList.tsx showed data.data.users, implying apiClient.get returns { data: { users: ... } }
  // Let's assume apiClient.get returns the { data: UsersResponse } structure.

  const { data, error, loading, refetch } = useGet<{ data: UsersResponse }>(endpoint);

  return {
    users: data?.data?.users || [],
    totalUsers: data?.data?.total || 0,
    error,
    loading,
    refetch,
  };
}
