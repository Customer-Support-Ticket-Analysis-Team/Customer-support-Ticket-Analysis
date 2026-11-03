import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Clock } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const StatusBadge = ({ status }) => {
  const styles = {
    'Open': 'bg-blue-50 text-blue-700 border-blue-100',
    'In Progress': 'bg-amber-50 text-amber-700 border-amber-100',
    'Resolved': 'bg-green-50 text-green-700 border-green-100',
  };
  return (
    <span className={`badge border ${styles[status] || 'bg-gray-50 text-gray-700 border-gray-100'}`}>
      {status}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const styles = {
    'Low': 'bg-gray-50 text-gray-700 border-gray-100',
    'Medium': 'bg-blue-50 text-blue-700 border-blue-100',
    'High': 'bg-orange-50 text-orange-700 border-orange-100',
    'Critical': 'bg-red-50 text-red-700 border-red-100',
  };
  return (
    <span className={`badge border ${styles[priority] || 'bg-gray-50 text-gray-700 border-gray-100'}`}>
      {priority}
    </span>
  );
};

const RecentTickets = ({ tickets }) => {
  return (
    <div className="card">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <h3 className="text-lg font-bold text-gray-900">Recent Tickets</h3>
        </div>
        <Link
          to="/tickets"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center transition-colors"
        >
          View All <ExternalLink className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>
      <div className="overflow-x-auto p-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Machine</th>
              <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
              <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-4 py-4 font-medium text-gray-900">#{ticket.ticket_code}</td>
                <td className="px-4 py-4 text-gray-600">{ticket.machine_id}</td>
                <td className="px-4 py-4"><PriorityBadge priority={ticket.priority} /></td>
                <td className="px-4 py-4"><StatusBadge status={ticket.status} /></td>
                <td className="px-4 py-4 text-gray-500">{formatDate(ticket.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { RecentTickets, StatusBadge, PriorityBadge };
