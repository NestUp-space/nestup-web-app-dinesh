/**
 * LiDAR Session Hook
 * Custom hook for managing LiDAR session state and API calls
 */

import { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import {
  LidarSession,
  SessionListResponse,
  LayoutResponse,
  ApiResponse,
  LidarSessionStatus,
} from '@/types/lidar';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }
  
  return response.json();
};

// POST/PUT/DELETE helper
const apiRequest = async <T>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: unknown
): Promise<ApiResponse<T>> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}${url}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  return response.json();
};

/**
 * Hook for listing sessions
 */
export function useLidarSessions(options?: {
  status?: LidarSessionStatus;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (options?.status) params.set('status', options.status);
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.offset) params.set('offset', String(options.offset));
  
  const queryString = params.toString();
  const url = `/api/lidar/sessions${queryString ? `?${queryString}` : ''}`;
  
  const { data, error, isLoading } = useSWR<ApiResponse<LidarSession[]> & { meta: SessionListResponse['meta'] }>(
    url,
    fetcher,
    { refreshInterval: 5000 } // Refresh every 5 seconds
  );
  
  return {
    sessions: data?.data || [],
    meta: data?.meta,
    isLoading,
    error,
    refresh: () => mutate(url),
  };
}

/**
 * Hook for a single session
 */
export function useLidarSession(sessionId: string | null) {
  const url = sessionId ? `/api/lidar/sessions/${sessionId}` : null;
  
  const { data, error, isLoading } = useSWR<ApiResponse<LidarSession>>(
    url,
    fetcher,
    { refreshInterval: 3000 }
  );
  
  return {
    session: data?.data,
    isLoading,
    error,
    refresh: () => url && mutate(url),
  };
}

/**
 * Hook for session layout (walls, floor plan)
 */
export function useSessionLayout(sessionId: string | null) {
  const url = sessionId ? `/api/lidar/sessions/${sessionId}/layout` : null;
  
  const { data, error, isLoading } = useSWR<ApiResponse<LayoutResponse>>(
    url,
    fetcher
  );
  
  return {
    layout: data?.data,
    isLoading,
    error,
    refresh: () => url && mutate(url),
  };
}

/**
 * Hook for session management operations
 */
export function useLidarSessionMutations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const createSession = useCallback(async (data: {
    projectId?: number;
    name?: string;
    deviceId?: string;
    location?: { lat: number; lng: number };
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<LidarSession>(
        '/api/lidar/sessions',
        'POST',
        data
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create session');
      }
      
      // Refresh sessions list
      mutate('/api/lidar/sessions');
      
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const updateSession = useCallback(async (
    sessionId: string,
    data: { name?: string; status?: LidarSessionStatus }
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<LidarSession>(
        `/api/lidar/sessions/${sessionId}`,
        'PUT',
        data
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update session');
      }
      
      // Refresh session data
      mutate(`/api/lidar/sessions/${sessionId}`);
      mutate('/api/lidar/sessions');
      
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const deleteSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<void>(
        `/api/lidar/sessions/${sessionId}`,
        'DELETE'
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete session');
      }
      
      // Refresh sessions list
      mutate('/api/lidar/sessions');
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const triggerProcessing = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<{ jobId: string; status: string }>(
        `/api/lidar/sessions/${sessionId}/process`,
        'POST'
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to trigger processing');
      }
      
      // Refresh session data
      mutate(`/api/lidar/sessions/${sessionId}`);
      
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    createSession,
    updateSession,
    deleteSession,
    triggerProcessing,
    isLoading,
    error,
  };
}
