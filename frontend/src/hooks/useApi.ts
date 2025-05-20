/**
 * Custom hook for API data fetching
 * Provides state management and error handling for API requests
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api/client';

interface UseApiOptions<T, P = any> {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: P;
  initialData?: T;
  skip?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useApi<T = any, P = any>({
  endpoint,
  method = 'GET',
  params,
  initialData,
  skip = false,
  onSuccess,
  onError,
}: UseApiOptions<T, P>) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(!skip);

  const fetchData = useCallback(async (options?: { forceFetch?: boolean }) => {
    const isForced = options?.forceFetch === true;
    // Log the endpoint being used by this specific hook instance
    console.log(`[useApi fetchData] Hook instance for endpoint: ${endpoint}, Method: ${method}, Skip: ${skip}, ForceFetch: ${isForced}`);
    
    if (skip && !isForced) {
      console.log(`[useApi fetchData] Skipping fetch for endpoint: ${endpoint} (skip=${skip}, forceFetch=${isForced})`);
      setLoading(false); // Ensure loading is false if skipped and not forced
      return;
    }

    console.log(`[useApi fetchData] Starting fetch for endpoint: ${endpoint} (skip=${skip}, forceFetch=${isForced})`);
    setLoading(true);
    setError(null);

    try {
      let result: T;

      switch (method) {
        case 'GET':
          console.log(`[useApi fetchData] apiClient.get called with endpoint: ${endpoint}`);
          result = await apiClient.get<T>(endpoint);
          break;
        case 'POST':
          console.log(`[useApi fetchData] apiClient.post called with endpoint: ${endpoint}`);
          result = await apiClient.post<T, P>(endpoint, params);
          break;
        case 'PUT':
          console.log(`[useApi fetchData] apiClient.put called with endpoint: ${endpoint}`);
          result = await apiClient.put<T, P>(endpoint, params);
          break;
        case 'DELETE':
          console.log(`[useApi fetchData] apiClient.delete called with endpoint: ${endpoint}`);
          result = await apiClient.delete<T>(endpoint);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      setData(result);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  }, [endpoint, method, params, skip, onSuccess, onError]);

  useEffect(() => {
    // Initial fetch on mount, respecting skip unless endpoint is empty
    if (endpoint) { // Only run if endpoint is valid
      fetchData();
    } else {
      setLoading(false); // If no endpoint, not loading
    }
  }, [fetchData, endpoint]); // Add endpoint to dependencies

  const refetch = useCallback(() => {
    if (endpoint) { // Only refetch if endpoint is valid
      fetchData({ forceFetch: true });
    }
  }, [fetchData, endpoint]); // Add endpoint to dependencies

  return { data, error, loading, refetch };
}

// Specialized hooks for common operations
export function useGet<T = any>(endpoint: string, skip = false, initialData?: T) {
  return useApi<T>({ endpoint, method: 'GET', skip, initialData });
}

export function usePost<T = any, P = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (endpoint: string, data?: P, onSuccess?: (data: T) => void): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.post<T, P>(endpoint, data);
      if (onSuccess) {
        onSuccess(result);
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error };
}

export function usePut<T = any, P = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (endpoint: string, data?: P, onSuccess?: (data: T) => void): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.put<T, P>(endpoint, data);
      if (onSuccess) {
        onSuccess(result);
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error };
}

export function useDelete<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (endpoint: string, onSuccess?: (data: T) => void): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.delete<T>(endpoint);
      if (onSuccess) {
        onSuccess(result);
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error };
}
