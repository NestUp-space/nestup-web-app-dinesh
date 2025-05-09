/**
 * API Client
 * Provides a standardized interface for making API requests
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

interface ApiClientOptions {
  headers?: Record<string, string>;
  withAuth?: boolean;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export class ApiClient {
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem('token');
  }

  private getHeaders(options?: ApiClientOptions): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    });

    if (options?.withAuth !== false) {
      const token = this.getAuthToken();
      if (token) {
        headers.append('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const message = data?.message || response.statusText || 'API request failed';
      throw new ApiError(message, response.status, data);
    }

    return {
      data: data as T,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    };
  }

  async get<T = any>(endpoint: string, options?: ApiClientOptions): Promise<T> {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const headers = this.getHeaders(options);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const result = await this.handleResponse<T>(response);
    return result.data;
  }

  async post<T = any, D = any>(endpoint: string, data?: D, options?: ApiClientOptions): Promise<T> {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const headers = this.getHeaders(options);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    const result = await this.handleResponse<T>(response);
    return result.data;
  }

  async put<T = any, D = any>(endpoint: string, data?: D, options?: ApiClientOptions): Promise<T> {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const headers = this.getHeaders(options);

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    const result = await this.handleResponse<T>(response);
    return result.data;
  }

  async delete<T = any>(endpoint: string, options?: ApiClientOptions): Promise<T> {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const headers = this.getHeaders(options);

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    const result = await this.handleResponse<T>(response);
    return result.data;
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();
