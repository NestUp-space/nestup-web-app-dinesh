'use client';

import React, { Suspense } from 'react';

export default function VisualiserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden overflow-y-auto bg-white">
      <Suspense
        fallback={
          <div className="h-full w-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-3" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        }
      >
        {children}
      </Suspense>
    </div>
  );
}
