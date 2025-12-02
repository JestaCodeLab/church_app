import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't attempt token refresh for auth endpoints themselves (login/refresh)
      // otherwise a failed login attempt would trigger a refresh which may
      // redirect the user back to /login (causing a page reload).
      const reqUrl: string | undefined = originalRequest?.url;
      if (reqUrl && (reqUrl.includes('/auth/login') || reqUrl.includes('/auth/refresh'))) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: (refreshToken: any) => api.post('/auth/refresh', { refreshToken }),
};

// Merchant API
export const merchantAPI = {
  register: (data: any) => api.post('/merchants/register', data),
  verifyEmail: (data: any) => api.post('/merchants/verify-email', data),
  resendCode: (data: any) => api.post('/merchants/resend-code', data),
  completeOnboarding: (data: any) => api.put('/merchants/onboarding', data),
};

// Member API
export const memberAPI = {
  getMembers: (params: any) => api.get('/members', { params }),
  getMember: (id: any) => api.get(`/members/${id}`),
  createMember: (data: any) => api.post('/members', data),
  updateMember: (id: any, data: any) => api.put(`/members/${id}`, data),
  deleteMember: (id: any, permanent = false) => api.delete(`/members/${id}`, { params: { permanent } }),
  getStats: () => api.get('/members/stats'),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAllMerchants: (params: any) => api.get('/admin/merchants', { params }),
  getMerchant: (id: any) => api.get(`/admin/merchants/${id}`),
  updateMerchantStatus: (id: any, status: any) => api.patch(`/admin/merchants/${id}/status`, { status }),
  getAllUsers: (params: any) => api.get('/admin/users', { params }),
  getMerchantUsers: (merchantId: any, params: any) => api.get(`/admin/merchants/${merchantId}/users`, { params }),
};

// Branch API
export const branchAPI = {
  getBranches: (params: any) => api.get('/branches', { params }),
  getBranch: (id: any) => api.get(`/branches/${id}`),
  createBranch: (data: any) => api.post('/branches', data),
  updateBranch: (id: any, data: any) => api.put(`/branches/${id}`, data),
  deleteBranch: (id: any, permanent = false) => api.delete(`/branches/${id}`, { params: { permanent } }),
  getStats: (id: any) => api.get(`/branches/${id}/stats`),
  getSummary: () => api.get('/branches/summary'),
};


// Settings API
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateProfile: (data: any) => api.put('/settings/profile', data),
  updateProfilePhoto: (data: any) => api.put('/settings/profile/photo', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  changePassword: (data: any) => api.put('/settings/security/password', data),
  updateNotifications: (category: string, data: any) => api.put(`/settings/notifications/${category}`, data),
  getSubscription: () => api.get('/settings/subscription'),
  changePlan: (plan: any) => api.post('/settings/subscription/change-plan', { plan }),
  verifyPayment: (reference: any) => api.post('/settings/subscription/verify-payment', { reference }),
  getBillingHistory: (params: any) => api.get('/settings/subscription/billing-history', { params }),
  updatePaymentMethod: (data: any) => api.put('/settings/subscription/payment-method', data),
};

export default api;