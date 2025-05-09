/**
 * Type Definitions
 * Centralized type definitions for the frontend application
 */

// User-related types
export interface User {
  id: number;
  name: string;
  email: string;
  profilePicUrl?: string;
  phoneNumber?: string;
  role?: UserRole;
}

export interface UserRole {
  id: number;
  name: string;
  roleType: string;
}

// Auth-related types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
}

// API-related types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Error-related types
export interface ApiError {
  message: string;
  statusCode?: number;
  errorCode?: string;
}

// UI-related types
export interface MenuItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
}

export interface Breadcrumb {
  label: string;
  href: string;
}

// Form-related types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'date';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string | number }[];
  validation?: (value: any) => string | null;
}

// Status-related types
export interface Status {
  id: number;
  status: string;
  color?: string;
}

// Re-export project-related types from hooks for convenience
export * from '../hooks/useProject';
export * from '../hooks/useTask';
export * from '../hooks/useSubtask';
