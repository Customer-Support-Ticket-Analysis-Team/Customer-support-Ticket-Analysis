import { apiRequest } from './api';

export const notificationService = {
  getNotifications: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/api/notifications?${query}` : '/api/notifications';
    return await apiRequest(endpoint);
  },

  getUnreadCount: async () => {
    const data = await apiRequest('/api/notifications/unread-count');
    return data.count ?? 0;
  },

  markAsRead: async (notificationId) => {
    return await apiRequest(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  markAllAsRead: async () => {
    return await apiRequest('/api/notifications/read-all', {
      method: 'PATCH',
    });
  },

  deleteNotification: async (notificationId) => {
    return await apiRequest(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },
};
