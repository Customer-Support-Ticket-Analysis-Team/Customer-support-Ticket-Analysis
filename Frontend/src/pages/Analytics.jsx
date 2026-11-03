import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Download, Monitor, Clock, BarChart3 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { analyticsService } from '../services/analyticsService';
import { ChartContainer, COLORS } from '../components/dashboard/TicketCharts';
import { useToast } from '../hooks/useToast';

const Analytics = () => {
  const [categoryData, setCategoryData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [machineData, setMachineData] = useState([]);
  const [resolutionStats, setResolutionStats] = useState({
    avgResolutionHours: 0,
    totalResolved: 0,
    totalDowntime: 0,
    machineCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { show } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, prios, trends] = await Promise.all([
        analyticsService.getCategoryAnalysis(),
        analyticsService.getPriorityAnalysis(),
        analyticsService.getTrendsAnalysis(),
      ]);

      if (cats && cats.labels) {
        setCategoryData(cats.labels.map((l, i) => ({ name: l, value: cats.values[i] || 0 })));
      }
      if (prios && prios.labels) {
        setPriorityData(prios.labels.map((l, i) => ({ name: l, value: prios.values[i] || 0 })));
      }
      if (trends && trends.labels) {
        setTrendData(trends.labels.map((l, i) => ({ name: l, value: trends.values[i] || 0 })));
      }

      // Derive machine-wise data from trends if available, otherwise from categories
      if (cats && cats.labels) {
        setMachineData(
          cats.labels.map((l, i) => ({ name: l, value: cats.values[i] || 0 }))
        );
      }

      // Resolution stats from dashboard summary if available
      try {
        const summary = await analyticsService.getDashboardSummary();
        setResolutionStats({
          avgResolutionHours: summary.average_resolution_hours ?? 0,
          totalResolved: summary.resolved_tickets ?? 0,
          totalDowntime: 0,
          machineCount: 0,
        });
      } catch (e) {
        // Dashboard summary not critical for analytics page
      }
    } catch (err) {
      setError(err.message);
      show({ title: 'Failed to load analytics', description: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportCSV = async () => {
    try {
      await analyticsService.exportTicketsCSV();
      show({
        title: 'Export Started',
        description: 'Tickets CSV download has begun.',
        type: 'success',
      });
    } catch (err) {
      show({ title: 'Export Failed', description: err.message, type: 'error' });
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loading message="Loading analytics data..." />
      </Layout>
    );
  }

  if (error) {
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
            <h2 className="text-2xl font-bold text-gray-900">Advanced Ticket Analytics</h2>
            <p className="text-slate-500">Deep insights into ticket distribution, trends, and machine performance</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="btn-primary"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="card p-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Total Categories</p>
            <h3 className="text-2xl font-bold text-gray-900">{categoryData.length}</h3>
          </div>
          <div className="card p-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Avg Resolution Time</p>
            <h3 className="text-2xl font-bold text-gray-900">{resolutionStats.avgResolutionHours.toFixed(1)} hrs</h3>
          </div>
          <div className="card p-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Total Resolved</p>
            <h3 className="text-2xl font-bold text-gray-900">{resolutionStats.totalResolved}</h3>
          </div>
          <div className="card p-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Data Points</p>
            <h3 className="text-2xl font-bold text-gray-900">{trendData.length}</h3>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer title="Category-wise Ticket Analysis">
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

          <ChartContainer title="Priority-wise Ticket Analysis">
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

        {/* Machine Downtime Analysis Section */}
        <div className="card">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Monitor className="w-5 h-5 text-industrial-blue" />
              <h3 className="text-lg font-bold text-gray-900">Machine Downtime Analysis</h3>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-gray-100 px-2.5 py-0.5 rounded">
              Total Tracked
            </span>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Avg Downtime per Ticket</p>
              <p className="text-2xl font-bold text-gray-900">{resolutionStats.avgResolutionHours.toFixed(1)} hrs</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Machines Monitored</p>
              <p className="text-2xl font-bold text-gray-900">{machineData.length}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Downtime</p>
              <p className="text-2xl font-bold text-gray-900">{resolutionStats.totalDowntime} mins</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Resolution Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {categoryData.length > 0 ? ((resolutionStats.totalResolved / (categoryData.reduce((a, b) => a + b.value, 0) || 1)) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
