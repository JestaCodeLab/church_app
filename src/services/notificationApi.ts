import api from './api';

interface Notification {
  _id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  createdAt: string;
  readAt?: string;
}

interface NotificationResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

/**
 * Notification API Service
 * Handles all notification-related API calls
 */

export const notificationApi = {
  /**
   * Get user notifications with pagination
   */
  getNotifications: async (page = 1, limit = 10, filters?: {
    category?: string;
    isRead?: boolean;
    type?: string;
  }): Promise<NotificationResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters?.category) params.append('category', filters.category);
    if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());
    if (filters?.type) params.append('type', filters.type);

    const response = await api.get<NotificationResponse>(
      `/notifications?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data;
  },

  /**
   * Get a single notification
   */
  getNotification: async (id: string): Promise<{
    success: boolean;
    data: Notification;
  }> => {
    const response = await api.get<{
      success: boolean;
      data: Notification;
    }>(`/notifications/${id}`);
    return response.data;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string): Promise<{
    success: boolean;
    message: string;
    data: Notification;
  }> => {
    const response = await api.put<{
      success: boolean;
      message: string;
      data: Notification;
    }>(`/notifications/${id}/read`, {});
    return response.data;
  },

  /**
   * Mark a notification as unread
   */
  markAsUnread: async (id: string): Promise<{
    success: boolean;
    message: string;
    data: Notification;
  }> => {
    const response = await api.put<{
      success: boolean;
      message: string;
      data: Notification;
    }>(`/notifications/${id}/unread`, {});
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{
    success: boolean;
    message: string;
    data: { modifiedCount: number };
  }> => {
    const response = await api.put<{
      success: boolean;
      message: string;
      data: { modifiedCount: number };
    }>('/notifications/mark-all-read', {});
    return response.data;
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (id: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await api.delete<{
      success: boolean;
      message: string;
    }>(`/notifications/${id}`);
    return response.data;
  },

  /**
   * Delete multiple notifications
   */
  deleteNotifications: async (ids: string[]): Promise<{
    success: boolean;
    message: string;
    data: { deletedCount: number };
  }> => {
    const response = await api.delete<{
      success: boolean;
      message: string;
      data: { deletedCount: number };
    }>('/notifications', { data: { ids } });
    return response.data;
  },
};

export default notificationApi;
