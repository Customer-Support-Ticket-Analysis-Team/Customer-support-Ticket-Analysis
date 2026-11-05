import React from 'react';

const SEMANTIC_COLORS = {
  Open: '#2F80ED',
  Pending: '#FF8A45',
  Closed: '#43C76D',
  Low: '#43C76D',
  Medium: '#F5C542',
  High: '#FF8A45',
  Critical: '#F05252',
};

const getColorForKey = (key) => {
  return SEMANTIC_COLORS[key] || '#16B89A';
};

const TimestampAnalysisChart = ({
  title,
  subtitle,
  data, // { total_tickets, available_timestamps, missing_timestamps, coverage_percentage, by_ticket_type: [], by_ticket_channel: [], hour_of_day: [], consistency_issues, data_quality_note }
  chartType = 'first-response', // 'first-response' or 'resolution'
  height = 300,
}) => {
  if (!data) return null;

  const {
    total_tickets,
    available_timestamps,
    missing_timestamps,
    coverage_percentage,
    by_ticket_type = [],
    by_ticket_channel = [],
    hour_of_day = [],
    consistency_issues = 0,
    data_quality_note,
  } = data;

  const isFirstResponse = chartType === 'first-response';

  // Find max count for bar chart scaling
  const allCounts = [...hour_of_day.map((h) => h.count), ...by_ticket_channel.map((c) => c.total)];
  const maxCount = Math.max(...allCounts, 1);

  return (
    <div className="card h-full">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{total_tickets}</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-100 bg-blue-50">
            <p className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-1">Available Timestamps</p>
            <p className="text-2xl font-bold text-blue-700">{available_timestamps}</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-100 bg-amber-50">
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">Missing Timestamps</p>
            <p className="text-2xl font-bold text-amber-700">{missing_timestamps}</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-100 bg-teal-50">
            <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">Coverage</p>
            <p className="text-2xl font-bold text-teal-700">{coverage_percentage}%</p>
          </div>
        </div>

        {/* Charts Row: Coverage by category + Hour distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coverage by Ticket Type/Channel */}
          <div className="card p-6 h-full">
            <h4 className="text-sm font-bold text-gray-900 mb-4">
              Coverage by {isFirstResponse ? 'Ticket Type' : 'Ticket Priority'}
            </h4>
            <div className="space-y-3">
              {(isFirstResponse ? by_ticket_type : by_ticket_channel).map((item) => {
                const pct = item.coverage;
                const color = pct >= 80 ? '#43C76D' : pct >= 50 ? '#F5C542' : '#F05252';
                return (
                  <div key={item.ticket_type || item.ticket_channel} className="flex items-center gap-3">
                    <span className="w-24 text-xs text-slate-600 truncate">
                      {item.ticket_type || item.ticket_channel}
                    </span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      ></div>
                    </div>
                    <span className="w-16 text-xs font-medium text-right text-slate-700">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hour of Day Distribution */}
          <div className="card p-6 h-full">
            <h4 className="text-sm font-bold text-gray-900 mb-4">
              Hour-of-Day Distribution
            </h4>
            {hour_of_day.length > 0 ? (
              <div className="flex items-end justify-between gap-2 h-32">
                {hour_of_day.map((h) => {
                  const barHeight = Math.round((h.count / maxCount) * 100);
                  return (
                    <div
                      key={h.hour}
                      className="flex flex-col items-center gap-2 w-full"
                    >
                      <div
                        className="w-full bg-indigo-500 rounded-t-sm transition-all duration-300"
                        style={{ height: `${barHeight}%` }}
                      ></div>
                      <span className="text-[10px] text-slate-500 font-medium">{h.hour}:00</span>
                      <span className="text-[10px] font-bold text-indigo-600">{h.count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-slate-400 text-sm">
                No timestamp data available
              </div>
            )}
          </div>
        </div>

        {/* Data Quality Note */}
        {data_quality_note || consistency_issues > 0 ? (
          <div className="mt-6 p-4 rounded-xl border border-amber-200 bg-amber-50">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
              Data Quality Note
            </h4>
            <p className="text-sm text-amber-700 leading-relaxed">
              {data_quality_note ||
                `Found ${consistency_issues} records where the first-response timestamp is after the resolution timestamp. These are preserved as-is from the source dataset.`}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TimestampAnalysisChart;
