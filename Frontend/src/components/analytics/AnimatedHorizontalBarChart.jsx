import React, { useEffect, useState } from 'react';

const BAR_COLORS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#84cc16', // Lime
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
];

// Known ticket type labels for nice display
const TICKET_TYPE_LABELS = {
  'Billing inquiry': 'Billing Inquiry',
  'Cancellation request': 'Cancellation Request',
  'Product inquiry': 'Product Inquiry',
  'Technical issue': 'Technical Issue',
  'Refund request': 'Refund Request',
};

const AnimatedHorizontalBarChart = ({
  title,
  subtitle,
  data, // { types: [...], totals: { type: count } } from ticket-status endpoint
  height = 380,
}) => {
  const [animate, setAnimate] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    setAnimate(true);

    let built = [];

    // First-response coverage format:
    // { by_ticket_type: [{ ticket_type, total, available, missing, coverage }, ...] }
    if (data && Array.isArray(data.by_ticket_type)) {
      built = data.by_ticket_type.map((r, i) => ({
        label: TICKET_TYPE_LABELS[r.ticket_type] || r.ticket_type,
        value: typeof r.available === 'number' ? r.available : 0,
        coverage: typeof r.coverage === 'number' ? r.coverage : 0,
        total: typeof r.total === 'number' ? r.total : 0,
        color: BAR_COLORS[i % BAR_COLORS.length],
      }));
    }
    // Ticket-status heatmap format:
    // { types: [...], totals: { type: count } }
    else if (
      data &&
      Array.isArray(data.types) &&
      data.totals &&
      typeof data.totals === 'object'
    ) {
      built = data.types.map((type, i) => ({
        label: TICKET_TYPE_LABELS[type] || type,
        value: typeof data.totals[type] === 'number' ? data.totals[type] : 0,
        color: BAR_COLORS[i % BAR_COLORS.length],
      }));
    } else {
      setItems([]);
      return;
    }

    built.sort((a, b) => b.value - a.value);
    setItems(built.filter((e) => e.value > 0));
  }, [data]);

  if (!items || items.length === 0) {
    return (
      <div className="card h-full animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="p-6 flex flex-col items-center justify-center h-full">
          <p className="text-slate-500 text-sm">No ticket type data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="card h-full animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {title ||
                (Array.isArray(data?.by_ticket_type)
                  ? 'First Response Timestamp Coverage by Ticket Type'
                  : 'Number of Complaints by Ticket Type')}
            </h3>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>

        <div className="relative">
          {/* Bars */}
          <div className="flex flex-col gap-4 pb-8">
            {items.map((item, i) => {
              const pct = (item.value / maxValue) * 100;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3"
                  style={{
                    animation: `slideIn 0.6s ${i * 0.1}s ease-out forwards`,
                    opacity: animate ? 1 : 0,
                    transform: animate ? 'translateX(0)' : 'translateX(-20px)',
                  }}
                >
                  {/* Label */}
                  <label
                    className="w-28 text-sm font-medium text-slate-700 shrink-0 truncate"
                    title={item.label}
                  >
                    {item.label}
                  </label>

                  {/* Bar container */}
                  <div className="flex-1 relative h-6 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: animate ? `${pct}%` : '0%',
                        background:
                          'linear-gradient(90deg, ' +
                          item.color +
                          ', ' +
                          item.color +
                          'cc)',
                        boxShadow:
                          '0 2px 8px -2px ' +
                          item.color +
                          '40',
                      }}
                    ></div>
                  </div>

                  {/* Value */}
                  <span
                    className="w-16 text-sm font-bold text-slate-900 shrink-0 text-right"
                  >
                    {item.value.toLocaleString()}
                    {item.coverage !== undefined ? `  (${item.coverage}%)` : ''}
                  </span>
                </div>
              );
            })}
          </div>

          {/* X-axis grid lines */}
          <div className="absolute top-0 left-28 right-20 bottom-8 pointer-events-none">
            {[0, 25, 50, 75, 100].map((p) => (
              <div
                key={p}
                className="absolute top-0 bottom-0 w-px bg-gray-200"
                style={{ left: `${p}%` }}
              />
            ))}
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-28 right-0 flex justify-between text-[10px] text-slate-400 font-medium pt-2">
            {[0, 25, 50, 75, 100].map((p) => (
              <span key={p}>{Math.round((p / 100) * maxValue)}</span>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-500">
          {items.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              ></span>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnimatedHorizontalBarChart;
