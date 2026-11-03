import { apiRequest } from './api';

export const analyticsService = {
  getDashboardSummary: async () => {
    return await apiRequest('/api/dashboard/summary');
  },
  getCategoryAnalysis: async () => {
    return await apiRequest('/api/analytics/categories');
  },
  getPriorityAnalysis: async () => {
    return await apiRequest('/api/analytics/priorities');
  },
  getTrendsAnalysis: async () => {
    return await apiRequest('/api/analytics/trends');
  },
  exportTicketsCSV: async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/export/tickets`);
    if (!response.ok) throw new Error('CSV export failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  },
};
