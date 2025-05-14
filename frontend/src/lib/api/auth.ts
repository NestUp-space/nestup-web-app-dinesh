/**
 * Authentication API service
 * Handles all authentication-related API calls to the backend
 */

// Base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'; // Align with index.ts and .env.local variable name

// Types
interface RegisterData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  roleName?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: any;
}

/**
 * Register a new user
 * @param userData User registration data
 * @returns Promise with registration response
 */
export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'Network error during registration. Please try again.',
    };
  }
};

/**
 * Login a user
 * @param loginData User login credentials
 * @returns Promise with login response including auth token
 */
export const login = async (loginData: LoginData): Promise<AuthResponse> => {
  try {
    console.log('Sending login request with:', loginData);
    console.log('Login attempt with email:', loginData.email);
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: loginData.email, password: loginData.password }),
    });

    const data = await response.json();
    console.log('Login response:', {
      status: response.status,
      statusText: response.statusText,
      data
    });
    return data;
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Network error during login. Please try again.',
    };
  }
};

/**
 * Request password reset
 * @param email User email
 * @returns Promise with password reset request response
 */
export const requestPasswordReset = async (email: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Password reset request error:', error);
    return {
      success: false,
      message: 'Network error during password reset request. Please try again.',
    };
  }
};

/**
 * Get current user profile using auth token
 * @returns Promise with user profile data
 */
export const getUserProfile = async (): Promise<any> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

/**
 * Logout the current user
 * Removes the authentication token from local storage
 */
export const logout = (): void => {
  localStorage.removeItem('token');
};
