import dynamic from 'next/dynamic';
import React from 'react';

// Dynamic import to avoid SSR issues with xterm
export const XTermConsole = dynamic(() => import('./XTermConsole'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
        <p>Loading Console...</p>
      </div>
    </div>
  ),
});
