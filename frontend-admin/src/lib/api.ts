/**
 * API Helper for Strapi v5
 * Handles authentication, data wrapping, and error handling
 */

import { API_URL, STORAGE_KEYS, wrapStrapiData, unwrapStrapiResponse } from './config';

// Types for API responses
export interface StrapiAuthResponse {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
    confirmed: boolean;
    blocked: boolean;
  };
}

export interface StrapiError {
  error: {
    status: number;
    name: string;
    message: string;
    details?: any;
  };
}

// Get JWT token from localStorage
const getAuthToken = (): string | null => {
  const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  console.log('JWT:', token); // Add JWT logging as requested
  return token;
};

// Get user info from localStorage
export const getUserInfo = () => {
  const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);
  return userInfo ? JSON.parse(userInfo) : null;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Redirect to login if not authenticated
const redirectToLogin = () => {
  // Clear any existing auth data
  localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_INFO);
  
  // Redirect to login (in a real app, you'd use React Router)
  window.location.href = '/';
};

// Main API fetch helper
export const apiFetch = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  const url = `${API_URL}${endpoint}`;

  // Prepare headers
  const headers: HeadersInit = {
    ...options.headers,
  };

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add authorization header if token exists
  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  // If no token and this is not an auth endpoint, redirect to login
  if (!token && !endpoint.includes('/auth/')) {
    redirectToLogin();
    throw new Error('Authentication required');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle non-2xx responses
    if (!response.ok) {
      const errorData: StrapiError = await response.json();
      
      // If token is invalid, clear auth and redirect
      if (response.status === 401) {
        redirectToLogin();
        throw new Error('Authentication expired');
      }
      
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return unwrapStrapiResponse(data);
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Authentication API calls
export const authAPI = {
  // Login user
  login: async (identifier: string, password: string): Promise<StrapiAuthResponse> => {
    const response = await apiFetch<StrapiAuthResponse>('/api/auth/local', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });

    // Store auth data in localStorage
    localStorage.setItem(STORAGE_KEYS.JWT_TOKEN, response.jwt);
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.user));

    return response;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
  },
};

// Trees API calls
export const treesAPI = {
  // Upload a single file to Strapi v5
  uploadFile: async (file: File): Promise<number> => {
    const formData = new FormData();
    formData.append('files', file);

    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('=== File Upload Debug ===');
    console.log('Uploading file:', file.name, `(${file.size} bytes, ${file.type})`);
    console.log('FormData entries:', [...formData]);
    console.log('Using JWT token:', token ? 'Present' : 'Missing');

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('Upload response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('Upload error details:', errorData);
        } catch (jsonError) {
          const textResponse = await response.text();
          console.error('Upload error response (text):', textResponse);
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }
        throw new Error(errorData.error?.message || `Upload failed: ${response.status}`);
      }

      const uploadedFiles = await response.json();
      console.log('File uploaded successfully:', uploadedFiles);
      
      // Return the ID of the first uploaded file
      return uploadedFiles[0].id;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  },

  // Create a new tree entry with file references
  create: async (treeData: any, files?: { tree_photo?: File; planter_photo?: File }) => {
    console.log('=== Tree Creation Debug ===');
    console.log('Tree data object:', treeData);
    console.log('Files object:', files);
    console.log('JWT token for tree creation:', getAuthToken() ? 'Present' : 'Missing');

    try {
      // Step 1: Upload files first (if any)
      let treePhotoId: number | null = null;
      let planterPhotoId: number | null = null;

      if (files?.tree_photo) {
        console.log('Uploading tree photo...');
        treePhotoId = await treesAPI.uploadFile(files.tree_photo);
      }

      if (files?.planter_photo) {
        console.log('Uploading planter photo...');
        planterPhotoId = await treesAPI.uploadFile(files.planter_photo);
      }

      // Step 2: Create entry with file references
      const entryData = {
        data: {
          ...treeData,
          // Add file references if files were uploaded
          ...(treePhotoId && { tree_photo: treePhotoId }),
          ...(planterPhotoId && { planter_photo: planterPhotoId }),
        },
      };

      console.log('Creating entry with data:', entryData);
      console.log('File references - tree_photo ID:', treePhotoId, 'planter_photo ID:', planterPhotoId);

      // Use apiFetch for the entry creation (JSON request)
      const result = await apiFetch('/api/trees', {
        method: 'POST',
        body: JSON.stringify(entryData),
      });

      console.log('Tree entry created successfully:', result);
      return result;
    } catch (error) {
      console.error('Tree creation error:', error);
      throw error;
    }
  },

  // Get all trees (for future use)
  getAll: async () => {
    return await apiFetch('/api/trees');
  },

  // Get tree by ID (for future use)
  getById: async (id: string | number) => {
    return await apiFetch(`/api/trees/${id}`);
  },
};
