import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import { RecentTickets } from '../components/dashboard/RecentTickets';
import Layout from '../components/layout/Layout';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import { analyticsService } from '../services/analyticsService';
import { ticketService } from '../services/ticketService';
import { formatDuration } from '../utils/formatters';
import { useToast } from '../hooks/useToast';
import HeatmapChart from '../components/analytics/HeatmapChart';
import TimestampAnalysisChart from '../components/analytics/TimestampAnalysisChart';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Historical compact insights
  const [ticketStatusData, setTicketStatusData] = useState(null);
  const [firstResponseData, setFirstResponseData] = useState(null);

  const { show } = useToast();

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [summaryRes, ticketsRes] = await Promise.all([
        analyticsService.getDashboardSummary(),
        ticketService.getAllTickets(),
      ]);

      setSummary(summaryRes);
      setRecentTickets(Array.isArray(ticketsRes) ? ticketsRes : []);

      // Fetch compact historical insights
      try {
        const [tsRes, frRes] = await Promise.all([
          analyticsService.getHistoricalTicketStatus(),
          analyticsService.getHistoricalFirstResponse(),
        ]);
        setTicketStatusData(tsRes.data?.data || tsRes.data || tsRes || null);
        setFirstResponseData(frRes.data?.data || frRes.data || frRes || null);
      } catch (e) {
        // Historical insights are supplemental, not critical
        console.warn('Historical insights unavailable:', e.message);
      }
    } catch (err) {
      setError(err.message);
      show({ title: 'Failed to load dashboard', description: err.message, type: 'error' });
    } finally {
      setRefreshing(false);
    }
  }, [show]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (error && !summary) {
    return (
      <Layout>
        <ErrorMessage message={error} onRetry={fetchData} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System Health Overview</h2>
            <p className="text-slate-500">Real-time tracking of industrial support tickets</p>
          </div>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center justify-center space-x-2.5 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:shadow-soft transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* KPI Cards (CRUD + Historical) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          <StatCard
            label="Total Tickets (CRUD)"
            value={summary?.total_tickets ?? 0}
            icon={Ticket}
            colorClass="bg-blue-600 shadow-blue-600/20"
            trend={5}
          />
          <StatCard
            label="Open Tickets"
            value={summary?.open_tickets ?? 0}
            icon={AlertCircle}
            colorClass="bg-red-600 shadow-red-600/20"
            trend={-2}
          />
          <StatCard
            label="In Progress"
            value={summary?.in_progress_tickets ?? 0}
            icon={Clock}
            colorClass="bg-amber-600 shadow-amber-600/20"
            trend={8}
          />
          <StatCard
            label="Resolved"
            value={summary?.resolved_tickets ?? 0}
            icon={CheckCircle2}
            colorClass="bg-emerald-600 shadow-emerald-600/20"
            trend={12}
          />
          <StatCard
            label="Resolution Rate"
            value={summary?.resolution_rate !== undefined ? `${summary.resolution_rate}%` : '0%'}
            icon={Clock}
            colorClass="bg-indigo-600 shadow-indigo-600/20"
            trend={3}
          />
          <StatCard
            label="Historical Records"
            value={summary?.historical_total ?? 0}
            icon={Ticket}
            colorClass="bg-industrial-blue shadow-blue-600/20"
            trend={0}
          />
        </div>

        {/* Compact Historical Insights */}
        {ticketStatusData || firstResponseData ? (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card h-full">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Historical: Type vs Status</h3>
                <p className="text-sm text-slate-500">Percentage distribution</p>
              </div>
              <div className="p-6">
                <HeatmapChart
                  title=""
                  data={ticketStatusData}
                  xKey="ticket_type"
                  yKey="ticket_status"
                  height={240}
                />
              </div>
            </div>

            <div className="card h-full">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">First Response: Coverage</h3>
                <p className="text-sm text-slate-500">Timestamp availability</p>
              </div>
              <div className="p-6">
                <TimestampAnalysisChart
                  title=""
                  data={firstResponseData}
                  chartType="first-response"
                  height={240}
                />
              </div>
            </div>
          </section>
        ) : null}

        {/* Recent Tickets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            {recentTickets.length > 0 ? (
              <RecentTickets tickets={recentTickets.slice(0, 8)} />
            ) : (
              <div className="card h-full">
                <EmptyState message="No recent tickets found" icon="clock" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
