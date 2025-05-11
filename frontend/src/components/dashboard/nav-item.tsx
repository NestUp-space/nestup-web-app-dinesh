'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/dashboard/tooltip';
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
            'flex h-9 w-full items-center justify-start rounded-lg px-3 text-muted-foreground transition-colors hover:text-foreground md:h-8', 
            {
              'bg-accent text-accent-foreground': isActive 
            }
          )}
        >
          {children}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
