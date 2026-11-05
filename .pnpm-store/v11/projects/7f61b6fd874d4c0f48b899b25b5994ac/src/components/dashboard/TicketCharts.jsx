import React from 'react';
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
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#64748b', // slate
];

const ChartContainer = ({ title, children }) => (
  <div className="card h-full">
    <div className="p-6 border-b border-gray-100">
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
    </div>
    <div className="p-6 h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </div>
);

export { ChartContainer, COLORS };
