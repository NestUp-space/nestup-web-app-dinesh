'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';

/**
 * Renders the main site Navbar (NESTUP logo, Home, Visualiser, etc.) only on
 * routes that are not visualiser or measurements. Hidden on /visualiser/* and
 * /measurements/* so those flows have a full-screen experience without the top bar.
 */
export function ConditionalNavbar() {
  const pathname = usePathname();
  if (pathname?.startsWith('/visualiser') || pathname?.startsWith('/measurements')) {
    return null;
  }
  return (
    <div className="h-24 top-0 fixed bg-white z-50 w-full">
      <Navbar />
    </div>
  );
}
