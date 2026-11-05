import { apiRequest } from './api';

export const analyticsService = {
  // --- New historical analytics endpoints ---
  getHistoricalTicketStatus: async () => {
    return await apiRequest('/api/analytics/historical/ticket-status');
  },
  getHistoricalPriority: async () => {
    return await apiRequest('/api/analytics/historical/priority');
  },
  getHistoricalProductTypes: async () => {
    return await apiRequest('/api/analytics/historical/product-types');
  },
  getHistoricalSatisfactionByType: async () => {
    return await apiRequest('/api/analytics/historical/satisfaction-by-type');
  },
  getHistoricalSatisfactionByChannel: async () => {
    return await apiRequest('/api/analytics/historical/satisfaction-by-channel');
  },
  getHistoricalFirstResponse: async () => {
    return await apiRequest('/api/analytics/historical/first-response');
  },
  getHistoricalResolution: async () => {
    return await apiRequest('/api/analytics/historical/resolution');
  },

  // --- Existing endpoints preserved for backward compatibility ---
  getDashboardSummary: async () => {
    return await apiRequest('/api/dashboard/summary');
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
