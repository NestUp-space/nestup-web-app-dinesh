"use client";

import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import Providers from '@/components/dashboard/providers';
import { DesktopNav } from '@/components/dashboard/DesktopNav';
import { MobileNav } from '@/components/dashboard/MobileNav';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from "next/legacy/image";
import LogoText from "@img/NestupLogoText.svg";

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
      <main className="flex min-h-screen w-full bg-lightest-bw text-dark-text-bw">
        <div className="hidden lg:block w-56 shrink-0"> {/* Adjusted width to match DesktopNav */}
          <DesktopNav />
        </div>
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-light-bw bg-lightest-bw px-6">
            <div className="flex items-center gap-4 lg:hidden"> {/* MobileNav trigger visible only on small screens */}
              <MobileNav />
            </div>
            <div className="flex-1 flex justify-center lg:hidden"> {/* Logo visible only on small screens and centered */}
              <Image
                src={LogoText}
                alt="Nestup Logo"
                className="h-8"
                priority
              />
            </div>
            <div className="flex items-center gap-4"> {/* Placeholder for User Profile/Actions, pushed to the right */}
              {/* Future user profile/actions can go here */}
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </div>
      </main>
    </Providers>
  );
}
