import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Filter, RefreshCcw, Calendar, User } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import { ticketService } from '../services/ticketService';
import { StatusBadge, PriorityBadge } from '../components/dashboard/RecentTickets';
import { formatDate } from '../utils/formatters';
import { useToast } from '../hooks/useToast';

const AGENT_LIST = [
  'Agent A',
  'Agent B',
  'Agent C',
  'Agent D',
];

const TicketDetailsModal = ({ ticket, onClose }) => {
  if (!ticket) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              #{ticket.ticket_code?.slice(-4) || '??'}
            </span>
            <h3 className="text-xl font-bold text-gray-900">Ticket Details</h3>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            ticket.source === 'Historical'
              ? 'bg-amber-100 text-amber-700 border border-amber-200'
              : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}>
            {ticket.source}
          </span>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reported By</p>
              <p className="text-sm font-medium text-gray-900">{ticket.reported_by || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Machine ID</p>
              <p className="text-sm font-medium text-gray-900">{ticket.machine_id}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Issue Type</p>
              <p className="text-sm font-medium text-gray-900">{ticket.issue_type}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Priority</p>
              <div><PriorityBadge priority={ticket.priority} /></div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p>
              <div><StatusBadge status={ticket.status} /></div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Assigned Agent</p>
              <p className="text-sm font-medium text-gray-900">
                {ticket.source === 'Historical' ? 'N/A' : ticket.assigned_agent || 'Not assigned'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Downtime</p>
              <p className="text-sm font-medium text-gray-900">{ticket.downtime_minutes ?? 0} mins</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Created</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(ticket.created_at)}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Description</p>
            <p className="text-sm text-gray-600 leading-relaxed">{ticket.description}</p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Timeline</p>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1 flex-shrink-0" />
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-900">Ticket Created</p>
                  <p className="text-xs text-gray-500">{formatDate(ticket.created_at)}</p>
                </div>
              </div>
              {ticket.resolved_at && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1 flex-shrink-0" />
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-900">Ticket Resolved</p>
                    <p className="text-xs text-gray-500">{formatDate(ticket.resolved_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { show } = useToast();

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (customerFilter.trim()) params.customer = customerFilter.trim();
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const data = await ticketService.getAllTickets(params);
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      show({ title: 'Failed to load tickets', description: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, customerFilter, statusFilter, priorityFilter, fromDate, toDate, show]);

  const updateStatus = async (id, newStatus) => {
    try {
      await ticketService.updateTicketStatus(id, newStatus);
      await fetchTickets();
      show({
        title: 'Status Updated',
        description: `Ticket #${id} status changed to ${newStatus}`,
        type: 'success',
      });
    } catch (err) {
      show({ title: 'Failed to update status', description: err.message, type: 'error' });
    }
  };

  const updateAgent = async (id, agent) => {
    try {
      await ticketService.updateTicketAgent(id, agent);
      await fetchTickets();
      show({
        title: 'Agent Updated',
        description: `Ticket #${id} agent ${agent ? 'assigned to ' + agent : 'unassigned'}`,
        type: 'success',
      });
    } catch (err) {
      show({ title: 'Failed to update agent', description: err.message, type: 'error' });
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  if (loading) {
    return (
      <Layout>
        <Loading message="Loading tickets..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <ErrorMessage message={error} onRetry={fetchTickets} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Ticket Inventory</h2>
            <p className="text-slate-500">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found</p>
          </div>
          <button
            onClick={fetchTickets}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:shadow-soft transition-all shadow-sm"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by ticket ID, machine ID, or person..."
                  className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchTickets()}
                />
              </div>

              {/* Customer filter */}
              <div className="relative w-full">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by customer name..."
                  className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchTickets()}
                />
              </div>

              {/* Date From */}
              <div className="relative w-full">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  placeholder="From"
                  className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              {/* Date To */}
              <div className="relative w-full">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  placeholder="To"
                  className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              {/* Status filter */}
              <select
                className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>

              {/* Priority filter */}
              <select
                className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>

              {/* Apply Filters button */}
              <button
                onClick={fetchTickets}
                className="col-span-1 md:col-auto btn-primary"
              >
                <Filter className="w-4 h-4 mr-2" />Apply Filters
              </button>
            </div>
          </div>

          {tickets.length === 0 ? (
            <div className="p-12 text-center">
              <EmptyState
                message="No tickets matching your criteria"
                icon="inbox"
                action={fetchTickets}
                actionLabel="Refresh"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full w-full text-left text-sm">
                <thead className="bg-gray-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr className="whitespace-nowrap">
                    <th className="px-6 py-4 font-semibold">Ticket ID</th>
                    <th className="px-6 py-4 font-semibold">Reported By</th>
                    <th className="px-6 py-4 font-semibold">Machine ID</th>
                    <th className="px-6 py-4 font-semibold">Issue Type</th>
                    <th className="px-6 py-4 font-semibold">Priority</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Assigned Agent</th>
                    <th className="px-6 py-4 font-semibold">Created At</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors group whitespace-nowrap">
                      <td className="px-6 py-4 font-medium text-gray-900">#{ticket.ticket_code}</td>
                      <td className="px-6 py-4 text-gray-600">{ticket.reported_by || '—'}</td>
                      <td className="px-6 py-4 text-gray-600 font-mono">{ticket.machine_id}</td>
                      <td className="px-6 py-4 text-gray-600">{ticket.issue_type}</td>
                      <td className="px-6 py-4"><PriorityBadge priority={ticket.priority} /></td>
                      <td className="px-6 py-4">
                        {ticket.source === 'Historical' ? (
                          // Historical tickets: read-only status badge
                          <StatusBadge status={ticket.status} />
                        ) : (
                          // CRUD tickets: editable status dropdown
                          <select
                            className="text-xs font-semibold bg-transparent border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            value={ticket.status}
                            onChange={(e) => updateStatus(ticket.id, e.target.value)}
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {ticket.source === 'Historical' ? (
                          // Historical tickets: N/A badge
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                            N/A
                          </span>
                        ) : ticket.status === 'Open' ? (
                          // CRUD Open tickets: agent assignment dropdown
                          <select
                            className="text-xs font-semibold bg-transparent border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                            value={ticket.assigned_agent || ''}
                            onChange={(e) => updateAgent(ticket.id, e.target.value)}
                          >
                            <option value="">Assign Agent</option>
                            {AGENT_LIST.map((agent) => (
                              <option key={agent} value={agent}>{agent}</option>
                            ))}
                          </select>
                        ) : (
                          // CRUD Pending/Resolved: read-only agent badge
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            ticket.assigned_agent
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}>
                            {ticket.assigned_agent || 'Unassigned'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(ticket.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <TicketDetailsModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      </div>
    </Layout>
  );
};

export default Tickets;
