/**
 * API Configuration for Strapi v5
 * Centralized configuration for API endpoints and settings
 */

// Get API URL from environment variables
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337';

// API endpoints for Strapi v5
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/local',
    REGISTER: '/api/auth/local/register',
  },
  TREES: '/api/trees',
} as const;

// Storage keys for localStorage
export const STORAGE_KEYS = {
  JWT_TOKEN: 'jwt', // Changed to match your requirement
  USER_INFO: 'user_info',
} as const;

// Strapi v5 data wrapper helper
export const wrapStrapiData = (data: any) => ({ data });

// Strapi v5 response unwrapper helper
export const unwrapStrapiResponse = (response: any) => {
  if (response.data) {
    return response.data;
  }
  return response;
};
