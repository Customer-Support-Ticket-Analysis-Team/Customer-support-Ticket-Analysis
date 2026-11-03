import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  BarChart3,
} from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import { RecentTickets } from '../components/dashboard/RecentTickets';
import { ChartContainer, COLORS } from '../components/dashboard/TicketCharts';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import Layout from '../components/layout/Layout';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import { analyticsService } from '../services/analyticsService';
import { ticketService } from '../services/ticketService';
import { formatDuration } from '../utils/formatters';
import { useToast } from '../hooks/useToast';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [machineData, setMachineData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { show, toasts } = useToast();

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [summaryRes, ticketsRes, categoryRes, priorityRes, trendRes] = await Promise.all([
        analyticsService.getDashboardSummary(),
        ticketService.getAllTickets(),
        analyticsService.getCategoryAnalysis(),
        analyticsService.getPriorityAnalysis(),
        analyticsService.getTrendsAnalysis(),
      ]);

      setSummary(summaryRes);
      setRecentTickets(Array.isArray(ticketsRes) ? ticketsRes : []);

      if (categoryRes && categoryRes.labels) {
        setCategoryData(categoryRes.labels.map((l, i) => ({ name: l, value: categoryRes.values[i] || 0 })));
      }

      if (priorityRes && priorityRes.labels) {
        setPriorityData(priorityRes.labels.map((l, i) => ({ name: l, value: priorityRes.values[i] || 0 })));
      }

      if (trendRes && trendRes.labels) {
        setTrendData(trendRes.labels.map((l, i) => ({ name: l, value: trendRes.values[i] || 0 })));
      }

      // Machine-wise distribution: derive from recent tickets if available
      if (Array.isArray(ticketsRes) && ticketsRes.length > 0) {
        const machineMap = {};
        ticketsRes.forEach((t) => {
          machineMap[t.machine_id] = (machineMap[t.machine_id] || 0) + 1;
        });
        setMachineData(
          Object.entries(machineMap)
            .map(([machine, count]) => ({ name: machine, value: count }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8)
        );
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
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System Health Overview</h2>
            <p className="text-slate-500">Real-time tracking of industrial support tickets</p>
          </div>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center space-x-2.5 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:shadow-soft transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard
            label="Total Tickets"
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
            icon={BarChart3}
            colorClass="bg-indigo-600 shadow-indigo-600/20"
            trend={3}
          />
          <StatCard
            label="Avg. Resolution Time"
            value={formatDuration(summary?.average_resolution_hours)}
            icon={Clock}
            colorClass="bg-purple-600 shadow-purple-600/20"
            trend={-1}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer title="Ticket Distribution by Category">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
              <Legend verticalAlign="top" align="center" />
            </PieChart>
          </ChartContainer>

          <ChartContainer title="Tickets by Priority">
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
              <Legend verticalAlign="top" align="center" />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer title="Monthly Ticket Trends">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
              <Legend verticalAlign="top" align="center" />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 7, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </LineChart>
          </ChartContainer>

          <ChartContainer title="Machine-wise Ticket Distribution">
            <BarChart data={machineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Recent Tickets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
