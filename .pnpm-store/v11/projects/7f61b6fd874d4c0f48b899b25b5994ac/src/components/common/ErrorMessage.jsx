import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message = "An unexpected error occurred", onRetry }) => (
  <div className="flex items-start space-x-3 p-5 rounded-xl border bg-red-50 border-red-200 shadow-soft">
    <div className="flex-shrink-0 mt-0.5">
      <AlertCircle className="w-5 h-5 text-red-600" />
    </div>
    <div className="flex-1">
      <h4 className="font-semibold text-sm text-red-800 mb-1">Error</h4>
      <p className="text-sm text-red-700">{message}</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
      >
        Retry
      </button>
    )}
  </div>
);

export default ErrorMessage;
