"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'Users', href: '/dashboard/users' },
  { name: 'User Roles', href: '/dashboard/users/roles' }
];

export function Tabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-light-bw mb-6">
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                isActive
                  ? 'border-theme-color text-theme-color'
                  : 'border-transparent text-dark-text-bw/70 hover:border-dark-text-bw/50 hover:text-dark-text-bw',
                'group inline-flex items-center border-b-2 py-3 px-1 text-sm font-medium transition-colors duration-150'
              )}
            >
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
