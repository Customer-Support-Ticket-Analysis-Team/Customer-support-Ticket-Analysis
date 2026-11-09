import { apiRequest } from './api';

export const ticketService = {
  getAllTickets: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/api/tickets?${query}` : '/api/tickets';
    const data = await apiRequest(endpoint);
    return data.tickets;
  },
  getTicketById: async (id) => {
    const data = await apiRequest(`/api/tickets/${id}`);
    return data.ticket;
  },
  createTicket: async (ticketData) => {
    return await apiRequest('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  },
  updateTicketStatus: async (id, status) => {
    return await apiRequest(`/api/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  updateTicketAgent: async (id, assignedAgent) => {
    return await apiRequest(`/api/tickets/${id}/assign-agent`, {
      method: 'PATCH',
      body: JSON.stringify({ assigned_agent: assignedAgent }),
    });
  },
};
