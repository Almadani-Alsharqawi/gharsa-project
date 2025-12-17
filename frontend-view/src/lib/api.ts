/**
 * API service for fetching tree data from Strapi backend
 * Handles all communication with the backend API
 */

// Base URL for the Strapi backend
// Use environment variable for production, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337';

// Interface for tree data structure from Strapi
export interface TreeData {
  id: number;
  documentId: string;
  location_name: string;
  google_map_location: string;
  planting_date: string;
  tree_status: string;
  notes: string;
  serial_number: string;
  planted_by: string | null;
  city: string | null;
  tree_type: string | null;
  planter_photo: any | null;
  tree_photo: {
    id: number;
    documentId: string;
    name: string;
    alternativeText: string | null;
    caption: string | null;
    width: number;
    height: number;
    formats: {
      thumbnail: { url: string };
      medium: { url: string };
      small: { url: string };
      large: { url: string };
    };
    hash: string;
    ext: string;
    mime: string;
    size: number;
    url: string;
    previewUrl: string | null;
    provider: string;
    provider_metadata: any | null;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

// API response structure
interface ApiResponse {
  data: TreeData[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

/**
 * Fetches tree data by serial number from Strapi backend
 * @param serial - The serial number of the tree to fetch
 * @returns Promise<TreeData | null> - The tree data or null if not found
 * @throws Error if API request fails
 */
export const fetchTreeBySerial = async (serial: string): Promise<TreeData | null> => {
  try {
    // Construct the API URL with filters and populate
    const url = `${API_BASE_URL}/api/trees?filters[serial_number][$eq]=${serial}&populate=*`;
    
    // Make the API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Check if the response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse the response
    const data: ApiResponse = await response.json();
    
    // Return the first tree if found, otherwise null
    return data.data && data.data.length > 0 ? data.data[0] : null;
    
  } catch (error) {
    console.error('Error fetching tree data:', error);
    throw error;
  }
};

/**
 * Gets the full URL for a Strapi media file
 * @param url - The relative URL from Strapi
 * @returns The full URL with the API base URL
 */
export const getMediaUrl = (url: string): string => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
};

/**
 * Formats a date string to Arabic locale
 * @param dateString - The date string to format
 * @returns Formatted date string in Arabic
 */
export const formatArabicDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};
