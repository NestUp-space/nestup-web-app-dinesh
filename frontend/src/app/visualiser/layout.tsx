'use client';

import React, { Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function VisualiserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-screen flex flex-col bg-white">
      <header className="flex-shrink-0 sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <Navbar />
      </header>
      <main className="flex-1 flex flex-col min-h-0">
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-3" />
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
      <footer className="flex-shrink-0">
        <Footer />
      </footer>
    </div>
  );
}
