"use client";

import Link from 'next/link';
import { Button } from './button'; // Assuming button is in the same directory
import { Sheet, SheetContent, SheetTrigger } from './sheet'; // Assuming sheet is in the same directory
import { Home, Users2, LineChart, PanelLeft, Package2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { isAdmin } from '@/lib/authUtils';

export function MobileNav() {
  const { user, isLoading } = useUser();

  // if (isLoading) {
  //   return null; // Or a loading indicator for the nav trigger
  // }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <PanelLeft className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        <nav className="grid gap-6 text-lg font-medium">
          <Link
            href="/dashboard"
            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
          >
            <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <Home className="h-5 w-5" />
            Dashboard
          </Link>
          {!isLoading && isAdmin(user?.role) && (
            <Link
              href="/dashboard/users"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Users2 className="h-5 w-5" />
              Users
            </Link>
          )}
          <Link
            href="#"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <LineChart className="h-5 w-5" />
            Analytics
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
