'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavItem({
  href,
  label,
  children
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = pathname === href;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className={clsx(
            'flex h-10 w-full items-center justify-start rounded-md px-3 text-sm font-medium transition-colors md:h-9',
            isActive
              ? 'bg-theme-color text-white hover:bg-dark-color'
              : 'text-dark-text-bw hover:bg-lighter-bw hover:text-theme-color'
          )}
        >
          {children}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-dark-text-bw text-lightest-bw">{label}</TooltipContent>
    </Tooltip>
  );
}
