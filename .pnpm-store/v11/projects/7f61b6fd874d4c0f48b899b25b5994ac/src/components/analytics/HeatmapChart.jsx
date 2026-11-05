import React from 'react';

const SEMANTIC_COLORS = {
  // Ticket Status
  Open: '#2F80ED',        // Blue
  Pending: '#FF8A45',     // Orange
  Closed: '#43C76D',      // Green
  // Ticket Priority
  Low: '#43C76D',         // Green
  Medium: '#F5C542',      // Yellow
  High: '#FF8A45',        // Orange
  Critical: '#F05252',    // Red
};

const getColorForKey = (key) => {
  return SEMANTIC_COLORS[key] || '#16B89A'; // Teal fallback
};

const HeatmapChart = ({
  title,
  subtitle,
  xAxisLabel,
  yAxisLabel,
  data, // { types: [], statuses/products: [], cells: [...], totals: {} }
  xKey = 'ticket_type',
  yKey = 'ticket_status',
  valueKey = 'percentage',
  yAxisKeysProp, // optional override for y-axis labels (e.g., products)
  height = 300,
}) => {
  if (!data || !data.types) {
    return null;
  }

  const { types, cells, totals } = data;
  const yAxisKeys = yAxisKeysProp || data.statuses || data.products || [];

  // Build a lookup map: `${y}|${x}` -> cell
  const cellMap = {};
  cells.forEach((c) => {
    cellMap[`${c[yKey]}|${c[xKey]}`] = c;
  });

  // Cell dimensions
  const cellSize = 80;
  const chartWidth = Math.max(types.length * cellSize, 300);
  const chartHeight = Math.max(yAxisKeys.length * cellSize, 200);

  const getIntensityColor = (percentage) => {
    // Blue-to-red intensity scale based on percentage
    if (percentage === 0) return '#f1f5f9';
    if (percentage < 25) return '#e0f2fe';
    if (percentage < 50) return '#7dd3fc';
    if (percentage < 75) return '#38bdf8';
    return '#0ea5e9';
  };

  return (
    <div className="card h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-xs font-medium text-slate-500 uppercase sticky top-0 z-10 bg-white/95 border-b border-gray-100"></th>
                  {types.map((t) => (
                    <th
                      key={t}
                      className="px-3 py-2 text-xs font-medium text-slate-500 uppercase text-center sticky top-0 z-10 bg-white/95 border-b border-gray-100"
                      style={{ minWidth: cellSize }}
                    >
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {yAxisKeys.map((y) => {
                  const total = totals && totals[y] !== undefined ? totals[y] : 0;
                  return (
                    <tr key={y} className="hover:bg-gray-50">
                      <th
                        className="px-3 py-3 text-xs font-medium text-slate-700 sticky left-0 z-20 bg-white border-r border-gray-100"
                        style={{ minWidth: 140 }}
                      >
                        {y}
                      </th>
                      {types.map((x) => {
                        const cell = cellMap[`${y}|${x}`];
                        const pct = cell ? cell[valueKey] : 0;
                        const cnt = cell ? cell.count : 0;
                        const color = getIntensityColor(pct);
                        return (
                          <td
                            key={x}
                            className="px-3 py-3 text-center h-20"
                            style={{
                              backgroundColor: color,
                              minWidth: cellSize,
                              height: cellSize,
                            }}
                          >
                            <div className="flex flex-col items-center justify-center h-full">
                              <span
                                className={`text-xs font-bold ${
                                  pct > 50 ? 'text-white' : 'text-slate-700'
                                }`}
                              >
                                {pct}%
                              </span>
                              <span className="text-[10px] text-slate-500 mt-0.5">
                                n={cnt}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                      <td
                        className="px-3 py-3 text-center font-semibold text-gray-900 border-l border-gray-200 bg-gray-50"
                      >
                        {total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-6 text-xs text-slate-500">
          {yAxisKeys.map((y) => {
            const color = getColorForKey(y);
            return (
              <span key={y} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                ></span>
                {y}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HeatmapChart;
