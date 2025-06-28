import axios, { AxiosError } from 'axios';

// API URL - In production, this would come from environment variables
const API_URL = process.env.REACT_APP_API_URL;

// Interface for Defect objects returned from the API
// Contains all properties of a road defect including metadata
export interface Defect {
  id: number;
  defect_type: string;
  severity: string;
  latitude: number;
  longitude: number;
  notes?: string;
  reported_at: string;
  updated_at?: string;
}

// Interface for creating a new defect
// Contains only the properties needed to create a defect
export interface DefectCreate {
  defect_type: string;
  severity: string;
  latitude: number;
  longitude: number;
  notes?: string;
}

// Interface for defect statistics data
// Used for analytics and dashboard visualizations
export interface DefectStatistics {
  total_count: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  by_time: Record<string, number>;
}

// Generic API response wrapper
// Provides consistent structure for all API responses
// Includes data and optional error message
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Create axios instance with common configuration
// Uses the base API URL and sets default headers
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service object with methods for all API operations
// Organized by resource type (defects)
const api = {
  // Defect endpoints for CRUD operations and analytics
  defects: {
    // Get all defects
    // Returns an array of defect objects
    getAll: async (): Promise<ApiResponse<Defect[]>> => {
      try {
        console.log('Making API request to:', `${API_URL}/defects`);
        const response = await apiClient.get('/defects');
        console.log('API response data:', response.data);
        return { data: response.data };
      } catch (error) {
        // Detailed error logging for debugging
        console.error('Error fetching defects:', error);
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          console.error('Response error data:', axiosError.response.data);
          console.error('Response error status:', axiosError.response.status);
          console.error('Response error headers:', axiosError.response.headers);
        } else if (axiosError.request) {
          console.error('Request error:', axiosError.request);
        } else {
          console.error('Error message:', axiosError.message);
        }
        // Return empty array with error message for UI
        return {
          data: [],
          error: 'Failed to fetch defects. Please try again later.',
        };
      }
    },

    // Get a specific defect by ID
    getById: async (id: number): Promise<ApiResponse<Defect>> => {
      try {
        const response = await apiClient.get(`/defects/${id}`);
        return { data: response.data };
      } catch (error) {
        console.error(`Error fetching defect ${id}:`, error);
        return {
          data: {} as Defect,
          error: 'Failed to fetch defect details. Please try again later.',
        };
      }
    },

    // Create a new defect
    // Takes a DefectCreate object and returns the created Defect
    create: async (defect: DefectCreate): Promise<ApiResponse<Defect>> => {
      try {
        const response = await apiClient.post('/defects', defect);
        return { data: response.data };
      } catch (error) {
        console.error('Error creating defect:', error);
        return {
          data: {} as Defect,
          error: 'Failed to create defect. Please try again later.',
        };
      }
    },

    // Update an existing defect
    // Takes defect ID and partial defect data to update
    update: async (id: number, defect: Partial<DefectCreate>): Promise<ApiResponse<Defect>> => {
      try {
        const response = await apiClient.put(`/defects/${id}`, defect);
        return { data: response.data };
      } catch (error) {
        console.error(`Error updating defect ${id}:`, error);
        return {
          data: {} as Defect,
          error: 'Failed to update defect. Please try again later.',
        };
      }
    },

    // Delete a defect by ID
    delete: async (id: number): Promise<ApiResponse<{ success: boolean }>> => {
      try {
        const response = await apiClient.delete(`/defects/${id}`);
        return { data: response.data };
      } catch (error) {
        console.error(`Error deleting defect ${id}:`, error);
        return {
          data: { success: false },
          error: 'Failed to delete defect. Please try again later.',
        };
      }
    },

    // Get defect statistics for analytics
    getStatistics: async (): Promise<ApiResponse<DefectStatistics>> => {
      try {
        const response = await apiClient.get('/defects/statistics/summary');
        return { data: response.data };
      } catch (error) {
        console.error('Error fetching statistics:', error);
        return {
          data: {
            total_count: 0,
            by_type: {},
            by_severity: {},
            by_time: {},
          },
          error: 'Failed to fetch statistics. Please try again later.',
        };
      }
    },

    // Upload defect data from external sources
    // Takes a payload with coordinates and metadata
    uploadData: async (payload: any): Promise<ApiResponse<Defect>> => {
      try {
        const response = await apiClient.post('/defects/upload', payload);
        return { data: response.data };
      } catch (error) {
        console.error('Error uploading defect data:', error);
        return {
          data: {} as Defect,
          error: 'Failed to upload defect data. Please try again later.',
        };
      }
    },
  },
};

export default api; 