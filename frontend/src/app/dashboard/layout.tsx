"use client";

import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import Providers from '@/components/dashboard/providers';
import { DesktopNav } from '@/components/dashboard/DesktopNav';
import { MobileNav } from '@/components/dashboard/MobileNav';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Optionally, show a loading state or return null while loading
  if (isLoading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  if (!user) {
    return null; // The useEffect hook will redirect to /login
  }

  return (
    <Providers>
      <main className="flex min-h-screen w-full bg-gray-100">
        <DesktopNav />
        <div className="flex flex-col sm:flex-row">
          <div className="hidden sm:flex sm:w-48">
          </div>
          <div className="flex-1 sm:ml-8 sm:mt-8">
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
              <MobileNav />
            </header>
            <main className="relative flex flex-col flex-1 items-start gap-2 p-4 sm:px-6 sm:py-0 md:gap-4 bg-gray-100">
              {children}
            </main>
          </div>
        </div>
        <Analytics />
      </main>
    </Providers>
  );
}
