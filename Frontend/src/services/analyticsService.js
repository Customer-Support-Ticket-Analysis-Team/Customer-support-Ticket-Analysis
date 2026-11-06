import { apiRequest } from './api';

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
};

export const analyticsService = {
  // --- New historical analytics endpoints (support ?from=&to=) ---
  getHistoricalTicketStatus: async (params = {}) => {
    return await apiRequest(`/api/analytics/historical/ticket-status${buildQuery(params)}`);
  },
  getHistoricalPriority: async (params = {}) => {
    return await apiRequest(`/api/analytics/historical/priority${buildQuery(params)}`);
  },
  getHistoricalProductTypes: async (params = {}) => {
    return await apiRequest(`/api/analytics/historical/product-types${buildQuery(params)}`);
  },
  getHistoricalSatisfactionByType: async (params = {}) => {
    return await apiRequest(`/api/analytics/historical/satisfaction-by-type${buildQuery(params)}`);
  },
  getHistoricalSatisfactionByChannel: async (params = {}) => {
    return await apiRequest(`/api/analytics/historical/satisfaction-by-channel${buildQuery(params)}`);
  },
  getHistoricalFirstResponse: async (params = {}) => {
    return await apiRequest(`/api/analytics/historical/first-response${buildQuery(params)}`);
  },
  getHistoricalResolution: async (params = {}) => {
    return await apiRequest(`/api/analytics/historical/resolution${buildQuery(params)}`);
  },

  // --- Existing endpoints preserved for backward compatibility ---
  getDashboardSummary: async (params = {}) => {
    return await apiRequest(`/api/dashboard/summary${buildQuery(params)}`);
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
