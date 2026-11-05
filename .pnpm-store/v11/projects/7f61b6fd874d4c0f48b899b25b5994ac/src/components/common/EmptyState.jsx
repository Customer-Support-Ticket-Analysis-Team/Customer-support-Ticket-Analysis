import React from 'react';
import { Inbox, Clock, AlertTriangle } from 'lucide-react';

const EmptyState = ({
  message = "No data available",
  icon = "inbox",
  action,
  actionLabel,
}) => {
  const iconMap = {
    inbox: <Inbox className="w-12 h-12 text-gray-300" />,
    clock: <Clock className="w-12 h-12 text-gray-300" />,
    alert: <AlertTriangle className="w-12 h-12 text-gray-300" />,
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-6">
        {iconMap[icon] || iconMap.inbox}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{message}</h3>
      {action && actionLabel && (
        <button
          onClick={action}
          className="mt-6 px-5 py-2 text-sm font-medium text-white bg-industrial-blue rounded-xl hover:bg-blue-700 transition-colors shadow-soft"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
