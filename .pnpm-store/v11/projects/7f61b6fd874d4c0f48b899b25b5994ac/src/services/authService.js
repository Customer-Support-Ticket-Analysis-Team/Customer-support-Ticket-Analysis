import { apiRequest } from './api';

export const authService = {
  login: async (credentials) => {
    return await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  logout: async () => {
    return await apiRequest('/api/auth/logout', {
      method: 'POST',
    });
  },

  getProfile: async () => {
    return await apiRequest('/api/auth/profile');
  },

  updateProfile: async (profileData) => {
    return await apiRequest('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  changePassword: async (passwordData) => {
    return await apiRequest('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  },
};
