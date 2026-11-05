import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = ({ message = "Loading data..." }) => (
  <div className="flex flex-col items-center justify-center p-12 space-y-4">
    <div className="w-10 h-10 rounded-full border-3 border-gray-100 border-t-blue-600 animate-spin flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
    </div>
    <p className="text-gray-500 font-medium animate-pulse">{message}</p>
  </div>
);

export default Loading;
