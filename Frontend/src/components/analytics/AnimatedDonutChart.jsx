import React, { useEffect, useState } from 'react';

const STATUS_COLORS = {
  Closed: '#43C76D',    // Green
  Open: '#2F80ED',      // Blue
  Pending: '#FF8A45',   // Orange
};

const STATUS_LABELS = {
  Closed: 'Closed',
  Open: 'Open',
  Pending: 'Pending',
};

const AnimatedDonutChart = ({
  title,
  subtitle,
  data, // { statuses: [], cells: [{ticket_status, count, percentage}], totals: {} }
  height = 280,
}) => {
  const [animate, setAnimate] = useState(false);

  // Aggregate counts per status across all ticket types
  useEffect(() => {
    setAnimate(true);
  }, []);

  if (!data || !data.statuses || !data.cells || data.statuses.length === 0 || data.cells.length === 0) {
    return null;
  }

  // Aggregate: sum counts per status across all types
  const statusMap = {};
  data.statuses.forEach((s) => {
    statusMap[s] = 0;
  });
  data.cells.forEach((cell) => {
    const status = cell.ticket_status;
    if (statusMap.hasOwnProperty(status)) {
      statusMap[status] += cell.count;
    }
  });

  const total = Object.values(statusMap).reduce((a, b) => a + b, 0);
  const statuses = data.statuses.map((s) => ({
    label: STATUS_LABELS[s] || s,
    value: statusMap[s] || 0,
    percentage: total > 0 ? Math.round(((statusMap[s] || 0) / total) * 100) : 0,
    color: STATUS_COLORS[s] || '#16B89A',
  }));

  // Sort by value descending for consistent rendering
  statuses.sort((a, b) => b.value - a.value);

  // Calculate cumulative percentages for donut segments
  let cumulative = 0;
  const segments = statuses.map((s) => {
    const start = cumulative;
    const end = cumulative + s.percentage;
    cumulative = end;
    return { ...s, start, end };
  });

  const radius = 70;
  const center = 90;
  const strokeWidth = 24;

  // SVG path for each donut segment
  const getSegmentPath = (startPct, endPct) => {
    const startAngle = (startPct / 100) * 2 * Math.PI - Math.PI / 2;
    const endAngle = (endPct / 100) * 2 * Math.PI - Math.PI / 2;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    const largeArcFlag = endPct - startPct > 50 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  return (
    <div className="card h-full animate-fade-in">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title || 'Ticket Status Distribution'}</h3>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-8">
          {/* Donut Chart */}
          <div className="flex-1 max-w-md">
            <svg
              className="w-full h-auto block mx-auto"
              viewBox="0 0 180 180"
              style={{ height: height }}
            >
              {/* Background ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth={strokeWidth}
                className="transition-all duration-700 ease-out"
              />

              {/* Animated segments */}
              {segments.map((seg, i) => (
                <path
                  key={i}
                  d={getSegmentPath(seg.start, seg.end)}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{
                    strokeDasharray: '283', // 2 * PI * 45 (radius of inner path approx)
                    strokeDashoffset: animate ? 0 : 283,
                  }}
                />
              ))}

              {/* Center value */}
              <text
                x={center}
                y={center + 5}
                textAnchor="middle"
                className="font-bold text-2xl text-gray-900"
              >
                {total}
              </text>
              <text
                x={center}
                y={center + 28}
                textAnchor="middle"
                className="text-xs text-slate-500 font-medium"
              >
                Total Tickets
              </text>
            </svg>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-3">
            {segments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-3 animate-fade-in">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: seg.color }}
                ></span>
                <span className="text-sm font-medium text-gray-700">{seg.label}</span>
                <span className="ml-auto text-sm font-bold text-gray-900">
                  {seg.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedDonutChart;
