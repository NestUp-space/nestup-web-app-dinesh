import { useGet } from './useApi';
import { User } from '@/types'; // Assuming User type is in @/types

// This interface describes the structure of the data returned by the /api/users endpoint
interface UserListApiResponse {
  success: boolean;
  message: string;
  responseObject: User[];
  statusCode: number;
  // If the backend adds pagination details like 'total', 'page', 'pageSize' at this level,
  // they can be added here. For now, 'total' is derived from responseObject.length.
}

// This interface was likely intended for a different API structure or a nested data object.
// It's not directly used for the current /api/users response structure where responseObject is User[].
// interface UsersResponse {
//   users: User[];
//   total: number;
//   page: number;
//   pageSize: number;
//   // totalPages: number; // If backend provides this
// }

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
  //
  // CORRECTED UNDERSTANDING (based on API logs):
  // The /api/users endpoint returns User[] directly in `responseObject`.
  // The useGet hook will therefore provide User[] as its `data`.
  //
  // CORRECTED UNDERSTANDING (after reviewing apiClient.ts):
  // apiClient.get (and thus useGet) returns the full API response object.
  // For /api/users, this is UserListApiResponse.
  const { data, error, loading, refetch } = useGet<UserListApiResponse>(endpoint);

  return {
    users: data?.responseObject || [], // Extract User[] from responseObject
    totalUsers: data?.responseObject?.length || 0, // Derive total from the fetched array length.
                                                  // For true pagination, backend should provide a 'total' count.
    error,
    loading,
    refetch,
  };
}
