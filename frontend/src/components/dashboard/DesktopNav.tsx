"use client";

import Link from 'next/link';
import Image from 'next/image';
import Logo from "@img/NestupLogoOnly.svg";
import { NavItem } from './nav-item'; // Assuming nav-item is in the same directory
import { Home, Users2, LineChart, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'; // Assuming tooltip is in the same directory
import { useUser } from '@/context/UserContext';
import { isAdmin } from '@/lib/authUtils';

export function DesktopNav() {
  const { user, isLoading } = useUser();

  // Optionally, show a loading state or return null while loading
  // For a nav bar, usually, we might want to show a minimal version or nothing for the protected items
  // if (isLoading) {
  //   return null; // Or a loading spinner, or a basic nav without protected items
  // }

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <div className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base">
          <Link href="/dashboard" className="flex rounded-md h-12">
            <Image src={Logo} alt="logo" className="object-contain hover:cursor-pointer" />
          </Link>
          <span className="sr-only">Nestup</span>
        </div>

        <NavItem href="/dashboard" label="Dashboard">
          <Home className="h-5 w-5" />
        </NavItem>

        {!isLoading && isAdmin(user?.role) && (
          <NavItem href="/dashboard/users" label="Users">
            <Users2 className="h-5 w-5" />
          </NavItem>
        )}

        <NavItem href="#" label="Analytics">
          <LineChart className="h-5 w-5" />
        </NavItem>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="#"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>
      </nav>
    </aside>
  );
}
