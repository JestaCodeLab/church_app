
import axios from 'axios';
import toast from 'react-hot-toast';
import { getSecureItem, setSecureItem, clearSecureItems } from '../utils/encryption';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Module-level network status for axios interceptor
let isOnlineGlobal = navigator.onLine;

// Export function to update network status from NetworkContext
export const updateNetworkStatus = (status: boolean) => {
  isOnlineGlobal = status;
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Check network and add auth token
api.interceptors.request.use(
  async (config) => {
    // Check network status before making request
    if (!isOnlineGlobal) {
      toast.error('No internet connection. Please check your network.');
      return Promise.reject(new Error('No internet connection'));
    }

    const token = await getSecureItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // For super admin: add merchant header if merchant is selected
    const user = await getSecureItem('user');
    if (user) {
      try {
        if (user.role?.slug === 'super_admin') {
          const selectedMerchantSubdomain = localStorage.getItem('superAdminSelectedMerchantSubdomain');
          if (selectedMerchantSubdomain) {
            config.headers['X-Merchant-Subdomain'] = selectedMerchantSubdomain;
          }
        }
      } catch (e) {
        // Silently fail if can't parse user
      }
    }

    // If FormData is being sent, remove the default Content-Type header
    // to let the browser set it with the boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
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
        const refreshToken = await getSecureItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        await setSecureItem('accessToken', accessToken);
        await setSecureItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        clearSecureItems(['accessToken', 'refreshToken', 'user']);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: any) => {
    // ✅ Extract subdomain from current URL
    const hostname = window.location.hostname;
    const parts = hostname.split('.');

    let subdomain = null;

    // Check if we're on a subdomain
    if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
      // faith.localhost
      if (parts.length === 2 && parts[0] !== 'localhost') {
        subdomain = parts[0];
      }
    } else if (parts.length >= 3) {
      // faith.thechurchhq.com
      subdomain = parts[0];
    }

    console.log('🌐 Frontend subdomain:', subdomain);

    // ✅ Send subdomain in request body
    return api.post('/auth/login', {
      ...credentials,
      subdomain: subdomain
    });
  },
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: (refreshToken: any) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email: string) => {
    // ✅ Extract subdomain from current URL
    const hostname = window.location.hostname;
    const parts = hostname.split('.');

    let subdomain = null;

    // Check if we're on a subdomain
    if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
      // faith.localhost
      if (parts.length === 2 && parts[0] !== 'localhost') {
        subdomain = parts[0];
      }
    } else if (parts.length >= 3) {
      // faith.thechurchhq.com
      subdomain = parts[0];
    }

    return api.post('/auth/forgot-password', { email, subdomain });
  },
  resetPassword: (token: string, email: string, newPassword: string, confirmPassword: string) => {
    // ✅ Extract subdomain from current URL
    const hostname = window.location.hostname;
    const parts = hostname.split('.');

    let subdomain = null;

    // Check if we're on a subdomain
    if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
      // faith.localhost
      if (parts.length === 2 && parts[0] !== 'localhost') {
        subdomain = parts[0];
      }
    } else if (parts.length >= 3) {
      // faith.thechurchhq.com
      subdomain = parts[0];
    }

    return api.post('/auth/reset-password', { token, email, newPassword, confirmPassword, subdomain });
  },
};

// Merchant API
export const merchantAPI = {
  register: (data: any) => api.post('/merchants/register', data),
  verifyEmail: (data: any) => api.post('/merchants/verify-email', data),
  resendCode: (data: any) => api.post('/merchants/resend-code', data),
  completeOnboarding: (data: any) => {
    // Check if data is FormData (for file uploads)
    if (data instanceof FormData) {
      // Don't set Content-Type header - let browser/axios handle it with proper boundary
      return api.put('/merchants/onboarding', data, {
        headers: {
          'Content-Type': undefined
        }
      });
    }
    return api.put('/merchants/onboarding', data);
  },
  planFeatures: () => api.get('/merchants/plan-features'),
  getSenderIDStatus: () => api.get('/merchants/sender-id/status'),
  getMerchantBySubdomain: (subdomain: string) => api.get(`/merchants/by-subdomain/${subdomain}`),
};

// Member API
export const memberAPI = {
  getMembers: (params: any) => api.get('/members', { params }),
  getMember: (id: any) => api.get(`/members/${id}`),
  createMember: (data: any) => {
    const formData = new FormData();

    // Add all text fields
    formData.append('firstName', data.firstName);
    formData.append('lastName', data.lastName);
    if (data.middleName) formData.append('middleName', data.middleName);
    if (data.email) formData.append('email', data.email);
    if (data.phone) formData.append('phone', data.phone);
    if (data.alternatePhone) formData.append('alternatePhone', data.alternatePhone);
    if (data.dateOfBirth) formData.append('dateOfBirth', data.dateOfBirth);
    if (data.gender) formData.append('gender', data.gender);
    if (data.maritalStatus) formData.append('maritalStatus', data.maritalStatus);
    if (data.membershipType) formData.append('membershipType', data.membershipType);
    if (data.membershipStatus) formData.append('membershipStatus', data.membershipStatus);
    if (data.membershipDate) formData.append('membershipDate', data.membershipDate);
    if (data.joinDate) formData.append('membershipDate', data.joinDate);
    if (data.baptismDate) formData.append('baptismDate', data.baptismDate);
    if (data.salvationDate) formData.append('salvationDate', data.salvationDate);
    if (data.occupation) formData.append('occupation', data.occupation);
    if (data.employer) formData.append('employer', data.employer);
    if (data.notes) formData.append('notes', data.notes);
    if (data.branch) formData.append('branch', data.branch);
    if (data.placeOfWork) formData.append('placeOfWork', data.placeOfWork);
    if (data.bornAgain !== undefined && data.bornAgain !== null) formData.append('bornAgain', String(data.bornAgain));
    if (data.baptismStatus) formData.append('baptismStatus', data.baptismStatus);
    if (data.howDidYouJoin) formData.append('howDidYouJoin', data.howDidYouJoin);
    if (data.howDidYouJoinOther) formData.append('howDidYouJoinOther', data.howDidYouJoinOther);

    // Add address as JSON string
    if (data.address) {
      formData.append('address', JSON.stringify(data.address));
    }

    // Add emergency contact as JSON string
    if (data.emergencyContact) {
      formData.append('emergencyContact', JSON.stringify(data.emergencyContact));
    }

    if (data.departments && Array.isArray(data.departments)) {
      data.departments.forEach((deptId: string) => {
        formData.append('departments[]', deptId);
      });
    }

    if (data.primaryDepartment) {
      formData.append('primaryDepartment', data.primaryDepartment);
    }

    // ✅ ADD: Photo file if present
    if (data.photo && data.photo instanceof File) {
      formData.append('photo', data.photo);
    }

    return api.post('/members', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // UPDATED: updateMember to handle FormData with photo
  updateMember: (id: string, data: any) => {
    console.log('update data ==>', data)
    const formData = new FormData();

    // Add all text fields
    if (data.firstName) formData.append('firstName', data.firstName);
    if (data.lastName) formData.append('lastName', data.lastName);
    if (data.middleName) formData.append('middleName', data.middleName);
    if (data.email) formData.append('email', data.email);
    if (data.phone) formData.append('phone', data.phone);
    if (data.alternatePhone) formData.append('alternatePhone', data.alternatePhone);
    if (data.dateOfBirth) formData.append('dateOfBirth', data.dateOfBirth);
    if (data.gender) formData.append('gender', data.gender);
    if (data.maritalStatus) formData.append('maritalStatus', data.maritalStatus);
    if (data.membershipType) formData.append('membershipType', data.membershipType);
    if (data.membershipStatus) formData.append('membershipStatus', data.membershipStatus);
    if (data.membershipDate) formData.append('membershipDate', data.membershipDate);
    if (data.baptismDate) formData.append('baptismDate', data.baptismDate);
    if (data.salvationDate) formData.append('salvationDate', data.salvationDate);
    if (data.occupation) formData.append('occupation', data.occupation);
    if (data.employer) formData.append('employer', data.employer);
    if (data.notes) formData.append('notes', data.notes);
    if (data.branch) formData.append('branch', data.branch);
    if (data.placeOfWork) formData.append('placeOfWork', data.placeOfWork);
    if (data.bornAgain !== undefined && data.bornAgain !== null) formData.append('bornAgain', String(data.bornAgain));
    if (data.baptismStatus) formData.append('baptismStatus', data.baptismStatus);
    if (data.howDidYouJoin) formData.append('howDidYouJoin', data.howDidYouJoin);
    if (data.howDidYouJoinOther) formData.append('howDidYouJoinOther', data.howDidYouJoinOther);

    // Add address as JSON string
    if (data.address) {
      formData.append('address', JSON.stringify(data.address));
    }

    // Add emergency contact as JSON string
    if (data.emergencyContact) {
      formData.append('emergencyContact', JSON.stringify(data.emergencyContact));
    }

    // Add ministries
    if (data.ministries) {
      if (typeof data.ministries === 'string') {
        formData.append('ministries', JSON.stringify(data.ministries.split(',').map(m => m.trim())));
      } else if (Array.isArray(data.ministries)) {
        formData.append('ministries', JSON.stringify(data.ministries));
      }
    }
    if (data.departments !== undefined && Array.isArray(data.departments)) {
      console.log('Department is available and array');

      if (data.departments.length === 0) {
        // Empty array - clear all departments
        formData.append('departments', JSON.stringify([]));
      } else {
        // Has departments - send each one
        data.departments.forEach((deptId: string) => {
          formData.append('departments[]', deptId);
        });
      }
    }

    if (data.primaryDepartment) {
      formData.append('primaryDepartment', data.primaryDepartment);
    }

    // ✅ ADD: Photo file if present
    if (data.photo && data.photo instanceof File) {
      formData.append('photo', data.photo);
    }

    return api.put(`/members/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteMember: (id: any, permanent = false) => api.delete(`/members/${id}`, { params: { permanent } }),
  getStats: () => api.get('/members/stats'),
  exportMembers: () => api.get('/members/export', { responseType: 'blob' }),
  previewImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/members/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  importMembers: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/members/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Member Transactions
  getMemberTransactions: (memberId: string, params?: any) =>
    api.get(`/members/${memberId}/transactions`, { params }),
  getTransactionDetails: (memberId: string, transactionId: string) =>
    api.get(`/members/${memberId}/transactions/${transactionId}`),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAllMerchants: (params: any) => api.get('/admin/merchants', { params }),
  getMerchant: (id: any) => api.get(`/admin/merchants/${id}`),
  updateMerchantStatus: (id: any, status: any) => api.patch(`/admin/merchants/${id}/status`, { status }),
  deleteMerchant: (id: any) => api.delete(`/admin/merchants/${id}`),
  getAllUsers: (params: any) => api.get('/admin/users', { params }),
  getMerchantUsers: (merchantId: any, params: any) => api.get(`/admin/merchants/${merchantId}/users`, { params }),

  // Feature Management
  getFeatures: () => api.get('/admin/features'),
  getFeatureStats: () => api.get('/admin/features/stats'),
  createFeature: (data: any) => api.post('/admin/features', data),
  updateFeature: (featureId: any, data: any) => api.put(`/admin/features/${featureId}`, data),
  deleteFeature: (featureId: any) => api.delete(`/admin/features/${featureId}`),

  // Plan Feature Management
  updatePlanFeatures: (planId: any, data: any) => api.patch(`/admin/plans/${planId}/features`, data),
  overrideMerchantFeatures: (merchantId: any, data: any) => api.put(`/admin/merchants/${merchantId}/features`, data),

  getAllBranches: (params: any) => api.get('/admin/branches', { params }),
  getUserById: (id: any) => api.get(`/admin/users/${id}`),
  lockUser: (id: any, data: any) => api.patch(`/admin/users/${id}/lock`, data),
  unlockUser: (id: any) => api.patch(`/admin/users/${id}/unlock`),
  updateUserStatus: (id: any, data: any) => api.patch(`/admin/users/${id}/status`, data),
  resetUserPassword: (id: any) => api.post(`/admin/users/${id}/reset-password`),
  deleteUser: (id: any) => api.delete(`/admin/users/${id}`),

  // SMS Sender ID Management
  getSenderIds: (params?: any) => api.get('/admin/sender-ids', { params }),
  approveSenderId: (merchantId: string) => api.post(`/admin/sender-ids/${merchantId}/approve`),
  rejectSenderId: (merchantId: string, reason: string) =>
    api.post(`/admin/sender-ids/${merchantId}/reject`, { reason }),

  // Merchant-specific resource creation
  getMerchantBranches: (merchantId: string, params?: any) =>
    api.get(`/admin/merchants/${merchantId}/branches`, { params }),

  createMemberForMerchant: (merchantId: string, data: any) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key === 'photo' && data[key]) {
        formData.append('photo', data[key]);
      } else if (key === 'address' || key === 'emergencyContact') {
        formData.append(key, JSON.stringify(data[key]));
      } else if (key === 'departments' && Array.isArray(data[key])) {
        data[key].forEach((dept: string) => formData.append('departments[]', dept));
      } else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });
    return api.post(`/admin/merchants/${merchantId}/members`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  createBranchForMerchant: (merchantId: string, data: any) =>
    api.post(`/admin/merchants/${merchantId}/branches`, data),

  // Permissions
  getAllPermissions: () => api.get('/admin/permissions'),
  getPermissionDetails: (permissionId: string) => api.get(`/admin/permissions/${permissionId}`),
  createPermission: (data: any) => api.post('/admin/permissions', data),
  updatePermission: (permissionId: string, data: any) => api.put(`/admin/permissions/${permissionId}`, data),
  assignPermissionToRoles: (permissionId: string, data: any) => api.post(`/admin/permissions/${permissionId}/assign`, data),
  deletePermission: (permissionId: string) => api.delete(`/admin/permissions/${permissionId}`),

  // Permission Categories
  getAllPermissionCategories: () => api.get('/admin/permission-categories'),
  getPermissionCategory: (categoryId: string) => api.get(`/admin/permission-categories/${categoryId}`),
  createPermissionCategory: (data: any) => api.post('/admin/permission-categories', data),
  updatePermissionCategory: (categoryId: string, data: any) => api.put(`/admin/permission-categories/${categoryId}`, data),
  deletePermissionCategory: (categoryId: string) => api.delete(`/admin/permission-categories/${categoryId}`),
  reorderPermissionCategories: (data: any) => api.post('/admin/permission-categories/reorder', data),

  // Feature Announcements
  getAnnouncements: (params?: any) => api.get('/admin/announcements', { params }),
  getAnnouncement: (id: string) => api.get(`/admin/announcements/${id}`),
  createAnnouncement: (data: any) => api.post('/admin/announcements', data),
  updateAnnouncement: (id: string, data: any) => api.put(`/admin/announcements/${id}`, data),
  deleteAnnouncement: (id: string) => api.delete(`/admin/announcements/${id}`),
  activateAnnouncement: (id: string) => api.patch(`/admin/announcements/${id}/activate`),
  reorderAnnouncementSlides: (id: string, slideOrder: string[]) =>
    api.patch(`/admin/announcements/${id}/slides/reorder`, { slideOrder }),
  uploadSlideImage: (announcementId: string, slideIndex: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/admin/announcements/${announcementId}/slides/${slideIndex}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Communications
  getRecipients: (type?: 'merchants' | 'users') => api.get('/admin/communications/recipients', { params: { type } }),
  sendBulkSMS: (data: { message: string; recipientIds?: string[]; sendToAll?: boolean }) =>
    api.post('/admin/communications/send-sms', data),
  sendBulkEmail: (data: { subject: string; message: string; recipientIds?: string[]; sendToAll?: boolean }) =>
    api.post('/admin/communications/send-email', data),
};

// Announcement API (merchant-facing)
export const announcementAPI = {
  getActive: () => api.get('/announcements/active'),
  dismiss: (announcementId: string) => api.post('/announcements/dismiss', { announcementId }),
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
  changePlan: (plan: any, discountCode?: string | null) =>
    api.post('/settings/subscription/change-plan', {
      plan,
      ...(discountCode && { discountCode }) // Only include if provided
    }),
  verifyPayment: (reference: any) => api.post('/settings/subscription/verify-payment', { reference }),
  getBillingHistory: (params?: any) => api.get('/settings/billing-history', { params }),
  downloadInvoice: (transactionId: string) =>
    api.get(`/settings/invoice/${transactionId}`, {
      responseType: 'blob' // Important for PDF download
    }),
  updatePaymentMethod: (data: any) => api.put('/settings/subscription/payment-method', data),
};

// Team API
export const teamAPI = {
  getTeamMembers: (params: any) => api.get('/team', { params }),
  inviteTeamMember: (data: any) => api.post('/team/invite', data),
  updateMemberRole: (id: string, data: any) => api.patch(`/team/${id}/role`, data),
  removeTeamMember: (id: string) => api.delete(`/team/${id}`),
  resendInvitation: (id: string) => api.post(`/team/${id}/resend`),
};

// Plan API
export const planAPI = {
  getPlans: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    isPublic?: boolean;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => api.get('/admin/plans', { params }),

  getPlan: (id: string) => api.get(`/admin/plans/${id}`),
  createPlan: (data: {
    name: string;
    slug: string;
    description?: string;
    price: {
      amount: number;
      currency: string;
    };
    billingCycle: 'monthly' | 'yearly' | 'one-time';
    trialDays?: number;
    limits: {
      members?: number | null;
      branches?: number | null;
      events?: number | null;
      sermons?: number | null;
      storage?: number | null;
      users?: number | null;
      smsCredits?: number | null;
      emailCredits?: number | null;
    };
    features: Record<string, boolean>;
    highlights?: string[];
    type?: 'free' | 'paid' | 'enterprise' | 'custom';
    isPublic?: boolean;
    isActive?: boolean;
    displayOrder?: number;
  }) => api.post('/admin/plans', data),

  updatePlan: (id: string, data: any) => api.put(`/admin/plans/${id}`, data),

  updatePlanLimits: (id: string, limits: {
    members?: number | null;
    branches?: number | null;
    events?: number | null;
    sermons?: number | null;
    storage?: number | null;
    users?: number | null;
    smsCredits?: number | null;
    emailCredits?: number | null;
  }) => api.patch(`/admin/plans/${id}/limits`, { limits }),

  updatePlanFeatures: (id: string, features: Record<string, boolean>) => api.patch(`/admin/plans/${id}/features`, { features }),
  togglePlanVisibility: (id: string) => api.patch(`/admin/plans/${id}/visibility`),
  getPlanStats: (id: string) => api.get(`/admin/plans/${id}/stats`),
  deletePlan: (id: string, permanent: boolean = false) => api.delete(`/admin/plans/${id}`, { params: { permanent } }),
};

// Discount API
export const discountAPI = {
  // Get all discounts
  getDiscounts: (params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'expired' | 'used-up';
    type?: 'percentage' | 'fixed';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => api.get('/admin/discounts', { params }),

  // Get single discount
  getDiscount: (id: string) => api.get(`/admin/discounts/${id}`),

  // Create discount
  createDiscount: (data: {
    code: string;
    description?: string;
    type: 'percentage' | 'fixed';
    value: number;
    applicablePlans?: string[];
    maxUses?: number | null;
    maxUsesPerMerchant?: number;
    validFrom?: Date | string;
    validUntil?: Date | string | null;
    isActive?: boolean;
  }) => api.post('/admin/discounts', data),

  // Update discount
  updateDiscount: (id: string, data: any) => api.put(`/admin/discounts/${id}`, data),

  // Delete discount
  deleteDiscount: (id: string, permanent: boolean = false) =>
    api.delete(`/admin/discounts/${id}`, { params: { permanent } }),

  // Get discount statistics
  getDiscountStats: (id: string) => api.get(`/admin/discounts/${id}/stats`),

  // Validate discount (public - for checkout)
  validateDiscount: (data: {
    code: string;
    planSlug: string;
    merchantId: string;
  }) => api.post('/discounts/validate', data)
};

// Event API
export const eventAPI = {
  // Event CRUD
  getEvents: (params?: any) => api.get('/events', { params }),
  getEvent: (id: string) => api.get(`/events/${id}`),
  createEvent: (data: any) => api.post('/events', data, {
    headers: { 'Content-Type': "multipart/form-data" }
  }),
  updateEvent: (id: string, data: any) => api.put(`/events/${id}`, data, {
    headers: { 'Content-Type': "multipart/form-data" }
  }),
  deleteEvent: (id: string) => api.delete(`/events/${id}`),

  // QR Code
  regenerateQR: (id: string) => api.post(`/events/${id}/regenerate-qr`),

  // Attendance
  checkInAttendance: (id: string, data: any) => api.post(`/events/${id}/attendance`, data),
  getAttendance: (id: string, params?: any) => api.get(`/events/${id}/attendance`, { params }),

  // Guest Management
  getUnconvertedGuests: (params?: any) => api.get('/events/guests/unconverted', { params }),
  convertGuestToMember: (attendanceId: string, data: any) =>
    api.post(`/events/attendance/${attendanceId}/convert-to-member`, data),

  // Public endpoints (no auth)
  getEventByQR: (qrData: string) =>
    axios.get(`${API_BASE_URL}/public/events/qr/${qrData}`),
  publicCheckIn: (qrData: string, data: any) =>
    axios.post(`${API_BASE_URL}/public/events/qr/${qrData}/checkin`, data),

  //donations
  getDonations: (eventId: string, params?: any) => api.get(`/events/${eventId}/donations`, { params }),
  exportDonations: (eventId: string) => api.post(`/events/${eventId}/donations/export`, {}, { responseType: 'blob' }),

};

// Department API
export const departmentAPI = {
  // Get all departments
  getDepartments: (params?: {
    isActive?: boolean;
    branchId?: string;
  }) => api.get('/departments', { params }),

  // Get departments for registration
  getDepartmentsForRegistration: (branchId?: string) =>
    api.get('/departments/registration', {
      params: branchId ? { branchId } : undefined
    }),

  // Get single department
  getDepartment: (id: string) => api.get(`/departments/${id}`),

  // Create department
  createDepartment: (data: {
    name: string;
    description?: string;
    branchId?: string;
    leaderId?: string;
    assistantLeaderIds?: string[];
    contactEmail?: string;
    contactPhone?: string;
    meetingSchedule?: {
      day: string;
      time: string;
      location: string;
      frequency: string;
    };
    isActive?: boolean;
    allowSelfRegistration?: boolean;
    color?: string;
    icon?: string;
  }) => api.post('/departments', data),

  // Update department
  updateDepartment: (id: string, data: any) =>
    api.put(`/departments/${id}`, data),

  // Delete department
  deleteDepartment: (id: string) =>
    api.delete(`/departments/${id}`),

  // Get department members
  getDepartmentMembers: (id: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => api.get(`/departments/${id}/members`, { params }),

  // Get department statistics
  getDepartmentStatistics: (id: string) =>
    api.get(`/departments/${id}/statistics`),
};

// Messaging API
export const messagingAPI = {
  // SMS Methods
  sms: {
    send: (data: any) => api.post('/sms/send', data),
    sendBulk: (data: any) => api.post('/sms/send-bulk', data),
    sendToMembers: (data: any) => api.post('/sms/send-to-members', data),
    sendToDepartment: (data: any) => api.post('/sms/send-to-department', data),
    sendToBranch: (data: any) => api.post('/sms/send-to-branch', data),
    sendToAll: (data: any) => api.post('/sms/send-to-all', data),
    getHistory: (params?: any) => api.get('/sms/history', { params }),
    getLogs: (params?: any) => api.get('/sms/logs', { params }),
    getLog: (id: string) => api.get(`/sms/logs/${id}`),
    getScheduled: (params?: any) => api.get('/sms/scheduled', { params }),
    cancelScheduled: (messageId: string) => api.delete(`/sms/scheduled/${messageId}`),
    getStatistics: (params?: any) => api.get('/sms/statistics', { params }),
  },

  // ✅ AI Message Generation
  generateMessage: (data: any) => api.post('/sms/generate-message', data),

  // Credits
  credits: {
    get: () => api.get('/sms/credits'),
    getPackages: () => api.get('/sms/credit-packages'),
    purchase: (data: any) => api.post('/sms/purchase-credits', data),
    verify: (reference: string) => api.get(`/sms/verify-purchase/${reference}`),
    getHistory: (params?: any) => api.get('/sms/purchase-history', { params }),
  },

  // Templates
  templates: {
    getAll: (params?: any) => api.get('/sms/templates', { params }),
    getOne: (id: string) => api.get(`/sms/templates/${id}`),
    create: (data: any) => api.post('/sms/templates', data),
    update: (id: string, data: any) => api.put(`/sms/templates/${id}`, data),
    delete: (id: string) => api.delete(`/sms/templates/${id}`),
    getVariables: () => api.get('/sms/templates/variables'),
  },

  // WhatsApp Methods (Coming Soon)
  whatsapp: {
    send: (data: any) => {
      // TODO: Implement when WhatsApp is ready
      throw new Error('WhatsApp messaging coming soon!');
    },
  },

  // Balance
  balance: {
    check: () => api.get('/sms/balance'),
  },
};


// Services API
export const servicesAPI = {
  getServices: (params?: any) => api.get('/services', { params }),
  getService: (id: string) => api.get(`/services/${id}`),
  createService: (data: any) => api.post('/services', data),
  updateService: (id: string, data: any) => api.put(`/services/${id}`, data),
  deleteService: (id: string) => api.delete(`/services/${id}`),
};

// Event Code API
export const eventCodeAPI = {
  getCodesForEvent: (eventId?: any) => api.get(`/event-codes/event/${eventId}`),
  regenerateCodes: (eventId: string) => api.post(`/event-codes/regenerate`, { eventId }),
};

// Finance API
export const financeAPI = {
  // Overview & Analytics
  getOverview: () => api.get('/finance/overview'),
  getTrends: (params?: { months?: number; startDate?: string; endDate?: string }) =>
    api.get('/finance/trends', { params }),

  // Income Operations
  income: {
    getAll: (params?: any) => api.get('/finance/income', { params }),
    create: (data: any) => api.post('/finance/income', data),
    getOne: (id: string) => api.get(`/finance/income/${id}`),
    update: (id: string, data: any) => api.put(`/finance/income/${id}`, data),
    delete: (id: string) => api.delete(`/finance/income/${id}`),
  },

  // Tithe Operations (uses Income with category='tithe')
  tithe: {
    getAll: (params?: any) => api.get('/finance/income', { params: { ...params, category: 'tithe' } }),
    create: (data: any) => api.post('/finance/income', { ...data, category: 'tithe' }),
    getOne: (id: string) => api.get(`/finance/income/${id}`),
    update: (id: string, data: any) => api.put(`/finance/income/${id}`, { ...data, category: 'tithe' }),
    delete: (id: string) => api.delete(`/finance/income/${id}`),
    resendSms: (id: string) => api.post(`/finance/tithe/${id}/resend-sms`, {}),
  },

  // Expense Operations
  expenses: {
    getAll: (params?: any) => api.get('/finance/expenses', { params }),
    create: (data: any) => api.post('/finance/expenses', data),
    getOne: (id: string) => api.get(`/finance/expenses/${id}`),
    update: (id: string, data: any) => api.put(`/finance/expenses/${id}`, data),
    approve: (id: string, notes?: string) =>
      api.put(`/finance/expenses/${id}/approve`, { approvalNotes: notes }),
    reject: (id: string, notes?: string) =>
      api.put(`/finance/expenses/${id}/reject`, { approvalNotes: notes }),
    delete: (id: string) => api.delete(`/finance/expenses/${id}`),
  },
};

// Sermon API
export const sermonAPI = {
  getUploadToken: () => api.post('/sermons/upload-token'),

  getSermons: (params?: any) => api.get('/sermons', { params }),

  getSermon: (id: string) => api.get(`/sermons/${id}`),

  createSermon: (data: any) => api.post('/sermons', data),

  updateSermon: (id: string, data: any) => api.put(`/sermons/${id}`, data),

  updateSermonFile: (id: string, data: any) => api.post(`/sermons/${id}/update-file`, data),

  deleteSermon: (id: string) => api.delete(`/sermons/${id}`),

  getVaultUsage: () => api.get('/sermons/vault/usage')

};

// Partnership API
export const partnershipAPI = {
  // Programme Management
  getAll: (params?: any) => api.get('/partnerships', { params }),
  getOne: (id: string) => api.get(`/partnerships/${id}`),
  create: (data: any) => api.post('/partnerships', data),
  update: (id: string, data: any) => api.put(`/partnerships/${id}`, data),
  delete: (id: string) => api.delete(`/partnerships/${id}`),

  // Transactions
  getTransactions: (id: string, params?: any) =>
    api.get(`/partnerships/${id}/transactions`, { params }),
  exportTransactions: (id: string) =>
    api.get(`/partnerships/${id}/transactions/export`, { responseType: 'blob' }),

  createManualTransaction: (id: string, data: any) =>
    api.post(`/partnerships/${id}/transactions`, data),
  deleteTransaction: (id: string, transactionId: string) =>
    api.delete(`/partnerships/${id}/transactions/${transactionId}`),

  // Partners/Registrations
  getPartners: (id: string, params?: any) =>
    api.get(`/partnerships/${id}/partners`, { params }),
  exportPartners: (id: string) =>
    api.get(`/partnerships/${id}/partners/export`, { responseType: 'blob' }),
  registerPartner: (id: string, data: any) =>
    api.post(`/partnerships/${id}/register`, data),

  editPartner: (id: string, partnerId: string, data: any) =>
    api.put(`/partnerships/${id}/partners/${partnerId}`, data),
  deletePartner: (id: string, partnerId: string) =>
    api.delete(`/partnerships/${id}/partners/${partnerId}`),

  // Public Routes (no auth required)
  getPublicProgramme: (merchantId: string, programmeId: string) =>
    api.get(`/partnerships/public/${merchantId}/${programmeId}`),
  registerPublicPartner: (merchantId: string, programmeId: string, data: any) =>
    api.post(`/partnerships/public/${merchantId}/${programmeId}/register`, data),

  initiatePublicPayment: (merchantId: string, programmeId: string, data: any) =>
    api.post(`/partnerships/public/${merchantId}/${programmeId}/payment/initiate`, data),
  verifyPublicPayment: (merchantId: string, programmeId: string, reference: string) =>
    api.get(`/partnerships/public/${merchantId}/${programmeId}/payment/verify/${reference}`),

  // Statistics
  refreshStats: (id: string) => api.post(`/partnerships/${id}/refresh`),
  getTierBreakdown: (id: string) => api.get(`/partnerships/${id}/tier-breakdown`),

  // QR Code Generation
  generateQRCode: (id: string, type: 'registration' | 'payment', links: { registrationLink: string; paymentLink: string }) =>
    api.post(`/partnerships/${id}/generate-qr`, { type, ...links }),
};

// Transaction API (for admin finance overview)
export const transactionAPI = {
  getAll: (params?: any) => api.get('/transactions', { params }),
  getStats: (params?: any) => api.get('/transactions/stats', { params }),
  getRevenueTrend: (params?: any) => api.get('/transactions/revenue-trend', { params }),
};

export default api;