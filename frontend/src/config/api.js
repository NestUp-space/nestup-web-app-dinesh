// API Configuration for different environments
const getApiBaseUrl = () => {
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    // Production - use your Railway backend URL
    if (window.location.hostname === 'nestup.space' || window.location.hostname.includes('vercel.app')) {
      return process.env.NEXT_PUBLIC_API_URL || 'https://nestup-web-app-production.up.railway.app';
    }
  }
  
  // Development fallback
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
};

export const API_BASE_URL = getApiBaseUrl();

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile'
  },
  USERS: '/api/users',
  PROJECTS: '/api/projects',
  MATERIALS: '/api/materials',
  BIM: '/api/bim',
  CATALOGUE: '/api/v1/catalogue',
  HEALTH: '/health-check'
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Default fetch configuration
export const defaultFetchConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Include cookies for authentication
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  buildApiUrl,
  defaultFetchConfig
};
