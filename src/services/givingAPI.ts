import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - automatically add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await (window as any).getSecureItem?.('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add branch context if selected
    const selectedBranchId = localStorage.getItem('selectedBranchId');
    if (selectedBranchId) {
      config.headers['X-Branch-Id'] = selectedBranchId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Giving Module API
 * Handles all project and contribution operations
 */
export const givingAPI = {
  // Project Management
  projects: {
    create: (data: any) => api.post('/giving/projects', data),
    getAll: (params?: any) => api.get('/giving/projects', { params }),
    getOne: (id: string) => api.get(`/giving/projects/${id}`),
    update: (id: string, data: any) => api.put(`/giving/projects/${id}`, data),
    delete: (id: string) => api.delete(`/giving/projects/${id}`),
    publish: (id: string) => api.post(`/giving/projects/${id}/publish`),
    getStats: (id: string, params?: any) => api.get(`/giving/projects/${id}/stats`, { params }),
  },

  // Tier Management
  tiers: {
    create: (projectId: string, data: any) => api.post(`/giving/projects/${projectId}/tiers`, data),
    update: (projectId: string, tierId: string, data: any) =>
      api.put(`/giving/projects/${projectId}/tiers/${tierId}`, data),
    delete: (projectId: string, tierId: string) =>
      api.delete(`/giving/projects/${projectId}/tiers/${tierId}`),
  },

  // Contribution Management
  contributions: {
    initialize: (data: any) => api.post('/giving/contribute/initialize', data),
    verify: (reference: string) => api.post('/giving/contribute/verify', { reference }),
    getAll: (params?: any) => api.get('/giving/contribute', { params }),
    getOne: (id: string) => api.get(`/giving/contribute/${id}`),
    refund: (id: string, reason?: string) => api.post(`/giving/contribute/${id}/refund`, { reason }),
  },
};

export default givingAPI;
