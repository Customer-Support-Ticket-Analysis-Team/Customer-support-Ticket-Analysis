import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  ExternalLink,
} from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import { RecentTickets } from '../components/dashboard/RecentTickets';
import Layout from '../components/layout/Layout';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import { analyticsService } from '../services/analyticsService';
import { ticketService } from '../services/ticketService';
import { useToast } from '../hooks/useToast';
import AnimatedDonutChart from '../components/analytics/AnimatedDonutChart';
import AnimatedHorizontalBarChart from '../components/analytics/AnimatedHorizontalBarChart';
import DateRangeFilter from '../components/dashboard/DateRangeFilter';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Historical compact insights
  const [ticketStatusData, setTicketStatusData] = useState(null);
  const [firstResponseData, setFirstResponseData] = useState(null);

  // Global date range state (default: All Time)
  const [dateRange, setDateRange] = useState({
    type: 'all',
    from: '',
    to: '',
    label: 'All Time',
  });

  // Tracks the latest fetch so stale responses cannot overwrite newer results.
  const requestRef = useRef(0);

  const { show } = useToast;

  const dateParams = useCallback(() => {
    if (dateRange.type === 'all' || !dateRange.from) {
      return {};
    }
    return { from: dateRange.from, to: dateRange.to };
  }, [dateRange]);

  const fetchData = useCallback(async () => {
    requestRef.current += 1;
    const myRequest = requestRef.current;
    setRefreshing(true);
    setError(null);
    const params = dateParams();
    try {
      const [summaryRes, ticketsRes] = await Promise.all([
        analyticsService.getDashboardSummary(params),
        ticketService.getAllTickets({ ...params, limit: 10 }),
      ]);

      if (myRequest !== requestRef.current) return;

      setSummary(summaryRes);
      setRecentTickets(Array.isArray(ticketsRes) ? ticketsRes : []);

      // Fetch compact historical insights (same date range)
      try {
        const [tsRes, frRes] = await Promise.all([
          analyticsService.getHistoricalTicketStatus(params),
          analyticsService.getHistoricalFirstResponse(params),
        ]);
        if (myRequest !== requestRef.current) return;
        setTicketStatusData(tsRes.data?.data || tsRes.data || tsRes || null);
        setFirstResponseData(frRes.data?.data || frRes.data || frRes || null);
      } catch (e) {
        // Historical insights are supplemental, not critical
        console.warn('Historical insights unavailable:', e.message);
        if (myRequest === requestRef.current) {
          setTicketStatusData(null);
          setFirstResponseData(null);
        }
      }
    } catch (err) {
      if (myRequest !== requestRef.current) return;
      setError(err.message);
      show({ title: 'Failed to load dashboard', description: err.message, type: 'error' });
    } finally {
      if (myRequest === requestRef.current) {
        setRefreshing(false);
      }
    }
  }, [dateParams, show]);

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
        {/* Page Header + Global Date Range Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System Health Overview</h2>
            <p className="text-slate-500">
              Real-time tracking of industrial support tickets{' '}
              <span className="text-slate-400">• {dateRange.label}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="flex items-center justify-center space-x-2.5 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:shadow-soft transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* KPI Cards (CRUD + Historical) — per updated business logic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          <StatCard
            label="Total Tickets"
            value={summary?.total_tickets ?? 0}
            icon={Ticket}
            colorClass="bg-blue-600 shadow-blue-600/20"
          />
          <StatCard
            label="Open Tickets"
            value={summary?.open_tickets ?? 0}
            icon={AlertCircle}
            colorClass="bg-red-600 shadow-red-600/20"
          />
          <StatCard
            label="Pending (In Progress)"
            value={summary?.in_progress_tickets ?? 0}
            icon={Clock}
            colorClass="bg-amber-600 shadow-amber-600/20"
          />
          <StatCard
            label="Resolved"
            value={summary?.resolved_tickets ?? 0}
            icon={CheckCircle2}
            colorClass="bg-emerald-600 shadow-emerald-600/20"
          />
          <StatCard
            label="Resolution Rate"
            value={summary?.resolution_rate !== undefined ? `${summary.resolution_rate}%` : '0%'}
            icon={Clock}
            colorClass="bg-indigo-600 shadow-indigo-600/20"
          />
          <StatCard
            label="Historical Records"
            value={summary?.historical_total ?? 0}
            icon={Ticket}
            colorClass="bg-industrial-blue shadow-blue-600/20"
          />
        </div>

        {/* Compact Historical Insights */}
        {(
          (ticketStatusData && ticketStatusData.statuses && ticketStatusData.statuses.length > 0) ||
          (firstResponseData && firstResponseData.by_ticket_type && firstResponseData.by_ticket_type.length > 0)
        ) ? (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card h-full animate-fade-in">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Ticket Status Distribution</h3>
                <p className="text-sm text-slate-500">Historical ticket breakdown by status</p>
              </div>
              <div className="p-6">
                <AnimatedDonutChart
                  title=""
                  data={ticketStatusData}
                  height={260}
                />
              </div>
            </div>

            <div className="card h-full animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">First Response: Coverage</h3>
                <p className="text-sm text-slate-500">Timestamp availability</p>
              </div>
              <div className="p-6">
                <AnimatedHorizontalBarChart
                  title=""
                  data={firstResponseData}
                  height={260}
                />
              </div>
            </div>
          </section>
        ) : null}

        {/* Recent Support Tickets Section */}
        <section className="card h-full">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">Recent Support Tickets</h3>
                <p className="text-xs text-slate-500">Latest tickets within the selected date range</p>
              </div>
            </div>
            <Link
              to="/tickets"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center transition-colors"
            >
              View All <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="p-6">
            {refreshing && recentTickets.length === 0 && summary === null ? (
              <Loading message="Loading recent tickets..." />
            ) : recentTickets.length > 0 ? (
              <RecentTickets tickets={recentTickets.slice(0, 10)} />
            ) : (
              <EmptyState
                message="No recent tickets found"
                subtitle="No tickets match the selected date range"
                icon="clock"
                action={fetchData}
                actionLabel="Refresh"
              />
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Dashboard;
