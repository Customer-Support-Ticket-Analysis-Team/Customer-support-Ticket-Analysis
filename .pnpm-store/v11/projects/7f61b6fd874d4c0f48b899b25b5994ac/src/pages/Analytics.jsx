import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { analyticsService } from '../services/analyticsService';
import HeatmapChart from '../components/analytics/HeatmapChart';
import BoxPlotChart from '../components/analytics/BoxPlotChart';
import TimestampAnalysisChart from '../components/analytics/TimestampAnalysisChart';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Section A: Ticket Distribution
  const [ticketStatusData, setTicketStatusData] = useState(null);
  const [priorityData, setPriorityData] = useState(null);
  const [productTypesData, setProductTypesData] = useState(null);

  // Section B: Customer Experience
  const [satisfactionByType, setSatisfactionByType] = useState(null);
  const [satisfactionByChannel, setSatisfactionByChannel] = useState(null);

  // Section C: Response & Resolution
  const [firstResponseData, setFirstResponseData] = useState(null);
  const [resolutionData, setResolutionData] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        ticketStatusRes,
        priorityRes,
        productTypesRes,
        satisfactionTypeRes,
        satisfactionChannelRes,
        firstResponseRes,
        resolutionRes,
      ] = await Promise.all([
        analyticsService.getHistoricalTicketStatus(),
        analyticsService.getHistoricalPriority(),
        analyticsService.getHistoricalProductTypes(),
        analyticsService.getHistoricalSatisfactionByType(),
        analyticsService.getHistoricalSatisfactionByChannel(),
        analyticsService.getHistoricalFirstResponse(),
        analyticsService.getHistoricalResolution(),
      ]);

      setTicketStatusData(ticketStatusRes.data?.data || ticketStatusRes.data || ticketStatusRes || null);
      setPriorityData(priorityRes.data?.data || priorityRes.data || priorityRes || null);
      setProductTypesData(productTypesRes.data?.data || productTypesRes.data || productTypesRes || null);
      setSatisfactionByType(satisfactionTypeRes.data?.data || satisfactionTypeRes.data || satisfactionTypeRes || null);
      setSatisfactionByChannel(satisfactionChannelRes.data?.data || satisfactionChannelRes.data || satisfactionChannelRes || null);
      setFirstResponseData(firstResponseRes.data?.data || firstResponseRes.data || firstResponseRes || null);
      setResolutionData(resolutionRes.data?.data || resolutionRes.data || resolutionRes || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <Layout>
        <Loading message="Loading historical analytics..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <ErrorMessage message={error} onRetry={fetchAll} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Customer Support Analytics</h2>
            <p className="text-slate-500">Historical ticket intelligence from 8,469+ resolved records</p>
          </div>
        </div>

        {/* Section A: Ticket Distribution Analysis */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">A. Ticket Distribution Analysis</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Ticket Type vs Status */}
            <HeatmapChart
              title="Ticket Type vs Status"
              subtitle="Percentage of tickets by type and status"
              data={ticketStatusData}
              xKey="ticket_type"
              yKey="ticket_status"
              height={320}
            />

            {/* Chart 2: Ticket Type vs Priority */}
            <HeatmapChart
              title="Ticket Type vs Priority"
              subtitle="Priority distribution across ticket types"
              data={priorityData}
              xKey="ticket_type"
              yKey="ticket_priority"
              height={320}
            />

            {/* Chart 3: Product vs Ticket Type */}
            <HeatmapChart
              title="Product vs Ticket Type"
              subtitle="Top 10 products by ticket count"
              data={productTypesData}
              xKey="ticket_type"
              yKey="product"
              yAxisKeysProp={productTypesData?.products}
              height={320}
            />
          </div>
        </section>

        {/* Section B: Customer Experience Analysis */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">B. Customer Experience Analysis</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 4: Satisfaction by Ticket Type */}
            <BoxPlotChart
              title="Satisfaction by Ticket Type"
              subtitle="Customer satisfaction ratings distribution"
              data={satisfactionByType}
              height={350}
            />

            {/* Chart 5: Satisfaction by Ticket Channel */}
            <BoxPlotChart
              title="Satisfaction by Ticket Channel"
              subtitle="Satisfaction across support channels"
              data={satisfactionByChannel}
              height={350}
            />
          </div>
        </section>

        {/* Section C: Response & Resolution Analysis */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">C. Response & Resolution Analysis</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 6: First Response Time */}
            <TimestampAnalysisChart
              title="First Response Time Analysis"
              subtitle="Availability and distribution of first-response timestamps"
              data={firstResponseData}
              chartType="first-response"
              height={380}
            />

            {/* Chart 7: Time to Resolution */}
            <TimestampAnalysisChart
              title="Time to Resolution Analysis"
              subtitle="Availability and distribution of resolution timestamps (Closed tickets)"
              data={resolutionData}
              chartType="resolution"
              height={380}
            />
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Analytics;
