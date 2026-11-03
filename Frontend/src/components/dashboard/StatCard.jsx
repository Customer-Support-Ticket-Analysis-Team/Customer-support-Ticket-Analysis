import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, colorClass, trend, trendLabel = "vs last month" }) => {
  const isPositive = trend >= 0;

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">{label}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl ${colorClass} shadow-sm shadow-${colorClass.replace('bg-', '').replace('-', '/')} /20`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center text-sm">
            <span className={`flex items-center font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? (
                <ArrowUpRight className={`w-3.5 h-3.5 mr-1.5`} />
              ) : (
                <ArrowDownRight className={`w-3.5 h-3.5 mr-1.5`} />
              )}
              {Math.abs(trend)}%
            </span>
            <span className="text-slate-400 ml-2">{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
