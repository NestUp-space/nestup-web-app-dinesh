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
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground',
                'group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium'
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
