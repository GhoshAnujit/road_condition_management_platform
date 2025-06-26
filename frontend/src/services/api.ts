import axios, { AxiosError } from 'axios';

// API URL - In production, this would come from environment variables
const API_URL = 'http://localhost:8000/api';

// Defect types
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

export interface DefectCreate {
  defect_type: string;
  severity: string;
  latitude: number;
  longitude: number;
  notes?: string;
}

export interface DefectStatistics {
  total_count: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  by_time: Record<string, number>;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Create axios instance with common config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service
const api = {
  // Defect endpoints
  defects: {
    getAll: async (): Promise<ApiResponse<Defect[]>> => {
      try {
        console.log('Making API request to:', `${API_URL}/defects`);
        const response = await apiClient.get('/defects');
        console.log('API response data:', response.data);
        return { data: response.data };
      } catch (error) {
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
        return {
          data: [],
          error: 'Failed to fetch defects. Please try again later.',
        };
      }
    },

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