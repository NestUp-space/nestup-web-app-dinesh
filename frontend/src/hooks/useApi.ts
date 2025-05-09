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

  const fetchData = useCallback(async () => {
    if (skip) return;

    setLoading(true);
    setError(null);

    try {
      let result: T;

      switch (method) {
        case 'GET':
          result = await apiClient.get<T>(endpoint);
          break;
        case 'POST':
          result = await apiClient.post<T, P>(endpoint, params);
          break;
        case 'PUT':
          result = await apiClient.put<T, P>(endpoint, params);
          break;
        case 'DELETE':
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
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch };
}

// Specialized hooks for common operations
export function useGet<T = any>(endpoint: string, skip = false, initialData?: T) {
  return useApi<T>({ endpoint, method: 'GET', skip, initialData });
}

export function usePost<T = any, P = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (endpoint: string, data?: P): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.post<T, P>(endpoint, data);
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

  const execute = useCallback(async (endpoint: string, data?: P): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.put<T, P>(endpoint, data);
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

  const execute = useCallback(async (endpoint: string): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.delete<T>(endpoint);
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
