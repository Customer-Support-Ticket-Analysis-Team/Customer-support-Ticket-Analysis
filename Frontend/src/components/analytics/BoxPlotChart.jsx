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

const BoxPlotChart = ({
  title,
  subtitle,
  data, // { types: [], series: { type: { count, mean, median, min, max, q1, q3, values } } }
  xKey = 'types',
  height = 350,
}) => {
  if (!data || !data.types || !data.series) {
    return null;
  }

  const { types, series } = data;

  // Calculate stats for display
  const getStats = (key) => {
    const s = series[key];
    if (!s) return null;
    return s;
  };

  // Find global min/max for Y axis scaling
  let globalMin = 5;
  let globalMax = 1;
  types.forEach((t) => {
    const s = series[t];
    if (s) {
      if (s.min < globalMin) globalMin = s.min;
      if (s.max > globalMax) globalMax = s.max;
    }
  });
  const yPadding = (globalMax - globalMin) * 0.1 || 0.5;
  const yAxisMin = Math.max(0, globalMin - yPadding);
  const yAxisMax = Math.min(5, globalMax + yPadding);

  const chartWidth = Math.max(types.length * 120, 400);

  return (
    <div className="card h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>

        {/* Stats summary row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {types.map((t) => {
            const s = series[t];
            if (!s) return null;
            const color = getColorForKey(t);
            return (
              <div key={t} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{t}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-gray-900">Avg: {s.mean}</span>
                  <span className="font-medium text-slate-600">Median: {s.median}</span>
                  <span className="font-medium text-slate-500">n={s.count}</span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: color }}></span>
                  Range: {s.min}–{s.max}
                </div>
              </div>
            );
          })}
        </div>

        {/* Box plot visualization */}
        <div className="overflow-x-auto">
          <div className="min-w-[500px] relative" style={{ height: height }}>
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none">
              {[yAxisMax, (yAxisMax + yAxisMin) / 2, yAxisMin].forEach === undefined ? null : null}
              {[Math.round(yAxisMax * 10) / 10, Math.round(((yAxisMax + yAxisMin) / 2) * 10) / 10, Math.round(yAxisMin * 10) / 10].map((label, i) => (
                <div
                  key={i}
                  className="absolute left-0 w-16 text-right text-[10px] text-slate-400 font-medium"
                  style={{
                    top: `${((yAxisMax - label) / (yAxisMax - yAxisMin)) * 100}%`,
                    transform: 'translateY(-50%)',
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Box plots */}
            <div className="absolute left-20 right-0 top-0 bottom-0 flex items-end justify-around gap-4 p-4">
              {types.map((t) => {
                const s = series[t];
                if (!s) return null;
                const color = getColorForKey(t);

                // Calculate positions within the plot area (0-100%)
                const plotHeightPct = (val) =>
                  Math.round(((val - yAxisMin) / (yAxisMax - yAxisMin)) * 100);

                return (
                  <div
                    key={t}
                    className="flex flex-col items-center"
                    style={{ width: '60px' }}
                  >
                    {/* Whisker line (min to max) */}
                    <div
                      className="w-px bg-slate-300 absolute"
                      style={{
                        left: '50%',
                        top: `${plotHeightPct(s.max)}%`,
                        height: `${plotHeightPct(s.min) - plotHeightPct(s.max)}%`,
                        transform: 'translateX(-50%)',
                      }}
                    ></div>

                    {/* Box (Q1 to Q3) */}
                    <div
                      className="w-16 rounded-sm shadow-sm border border-slate-200"
                      style={{
                        backgroundColor: color,
                        opacity: 0.7,
                        position: 'absolute',
                        left: '50%',
                        top: `${plotHeightPct(s.q3)}%`,
                        height: `${plotHeightPct(s.q1) - plotHeightPct(s.q3)}%`,
                        transform: 'translateX(-50%)',
                      }}
                    ></div>

                    {/* Median line */}
                    <div
                      className="w-16 bg-white border-t-2 border-white absolute"
                      style={{
                        left: '50%',
                        top: `${plotHeightPct(s.median)}%`,
                        transform: 'translateX(-50%) translateY(-50%)',
                      }}
                    ></div>

                    {/* Mean dot */}
                    <div
                      className="w-2 h-2 rounded-full border-2 border-white shadow-sm absolute"
                      style={{
                        backgroundColor: color,
                        left: '50%',
                        top: `${plotHeightPct(s.mean)}%`,
                        transform: 'translateX(-50%) translateY(-50%)',
                        zIndex: 10,
                      }}
                    ></div>

                    {/* Label */}
                    <div className="mt-3 text-center">
                      <span
                        className="text-xs font-medium text-slate-700 truncate w-full"
                        title={t}
                      >
                        {t}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        n={s.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis line */}
            <div
              className="absolute left-20 right-0 bottom-0 h-px bg-gray-200"
            ></div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-200"></span>
            Q1–Q3 box
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-white border-t-2 border-white"></span>
            Median
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400 border-2 border-white shadow-sm"></span>
            Mean
          </span>
        </div>
      </div>
    </div>
  );
};

export default BoxPlotChart;
