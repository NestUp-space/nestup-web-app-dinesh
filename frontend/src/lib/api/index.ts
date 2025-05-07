/**
 * API utilities for making requests to the backend
 */

// Base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// Types
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Generic GET request
 * @param endpoint API endpoint
 * @param requiresAuth Whether the request requires authentication
 * @returns Promise with response data
 */
export const get = async <T>(endpoint: string, requiresAuth = true): Promise<ApiResponse<T>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if required
    if (requiresAuth) {
      const token = localStorage.getItem('token');
      if (!token) {
        return {
          success: false,
          message: 'Authentication required',
        };
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API GET error for ${endpoint}:`, error);
    return {
      success: false,
      message: 'Network error. Please try again.',
    };
  }
};

/**
 * Generic POST request
 * @param endpoint API endpoint
 * @param body Request body
 * @param requiresAuth Whether the request requires authentication
 * @returns Promise with response data
 */
export const post = async <T>(
  endpoint: string,
  body: any,
  requiresAuth = true
): Promise<ApiResponse<T>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if required
    if (requiresAuth) {
      const token = localStorage.getItem('token');
      if (!token) {
        return {
          success: false,
          message: 'Authentication required',
        };
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API POST error for ${endpoint}:`, error);
    return {
      success: false,
      message: 'Network error. Please try again.',
    };
  }
};

/**
 * Generic PUT request
 * @param endpoint API endpoint
 * @param body Request body
 * @param requiresAuth Whether the request requires authentication
 * @returns Promise with response data
 */
export const put = async <T>(
  endpoint: string,
  body: any,
  requiresAuth = true
): Promise<ApiResponse<T>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if required
    if (requiresAuth) {
      const token = localStorage.getItem('token');
      if (!token) {
        return {
          success: false,
          message: 'Authentication required',
        };
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API PUT error for ${endpoint}:`, error);
    return {
      success: false,
      message: 'Network error. Please try again.',
    };
  }
};

/**
 * Generic DELETE request
 * @param endpoint API endpoint
 * @param requiresAuth Whether the request requires authentication
 * @returns Promise with response data
 */
export const del = async <T>(endpoint: string, requiresAuth = true): Promise<ApiResponse<T>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if required
    if (requiresAuth) {
      const token = localStorage.getItem('token');
      if (!token) {
        return {
          success: false,
          message: 'Authentication required',
        };
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API DELETE error for ${endpoint}:`, error);
    return {
      success: false,
      message: 'Network error. Please try again.',
    };
  }
};

/**
 * Check if user is authenticated
 * @returns Boolean indicating if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

/**
 * Get authentication token
 * @returns Auth token or null if not authenticated
 */
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};
