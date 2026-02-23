"use client";

import Link from 'next/link';
import Image from "next/legacy/image"; // Added Image import
import { Button } from '@/components/ui/button'; 
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'; 
import { Home, Users2, LineChart, PanelLeft, Settings, BookCopy, FolderKanban, Workflow, ScanLine } from 'lucide-react'; // Removed Package2, Added ScanLine
import { useUser } from '@/context/UserContext';
import LogoText from "@img/NestupLogoText.svg"; // Added LogoText import
import { isAdmin, hasPermission } from '@/lib/authUtils'; // Assuming hasPermission might be more generic if roles differ

export function MobileNav() {
  const { user, isLoading } = useUser();

  // if (isLoading) {
  //   return null; // Or a loading indicator for the nav trigger
  // }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden border-light-bw text-dark-text-bw hover:bg-lighter-bw hover:text-theme-color">
          <PanelLeft className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs bg-lightest-bw text-dark-text-bw border-r border-light-bw">
        <nav className="grid gap-3 text-lg font-medium p-4">
          <Link
            href="/dashboard"
            className="group flex h-12 w-full items-center justify-start px-1 mb-4" // Adjusted padding and height
          >
            <Image src={LogoText} alt="Nestup Logo" className="h-8" /> 
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-dark-text-bw transition-all hover:bg-lighter-bw hover:text-theme-color"
          >
            <Home className="h-5 w-5" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-dark-text-bw transition-all hover:bg-lighter-bw hover:text-theme-color"
          >
            <FolderKanban className="h-5 w-5" />
            Projects
          </Link>
          {!isLoading && user?.role && hasPermission(user.role.roleType, 'admin') && (
            <Link
              href="/dashboard/users"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-dark-text-bw transition-all hover:bg-lighter-bw hover:text-theme-color"
            >
              <Users2 className="h-5 w-5" />
              Users
            </Link>
          )}
          {!isLoading && user?.role && hasPermission(user.role.roleType, 'admin') && (
            <Link
              href="/dashboard/catalogue"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-dark-text-bw transition-all hover:bg-lighter-bw hover:text-theme-color"
            >
              <BookCopy className="h-5 w-5" />
              Catalogue
            </Link>
          )}
          {!isLoading && user?.role && hasPermission(user.role.roleType, 'admin') && ( // Assuming BIM Process has same permissions
            (<Link
              href="/dashboard/bimProcess"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-dark-text-bw transition-all hover:bg-lighter-bw hover:text-theme-color"
            >
              <Workflow className="h-5 w-5" />BIM Process
                          </Link>)
          )}
          <Link
            href="/dashboard/lidar"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-dark-text-bw transition-all hover:bg-lighter-bw hover:text-theme-color"
          >
            <ScanLine className="h-5 w-5" />
            LiDAR Scanner
          </Link>
          {/* <Link
            href="#"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-dark-text-bw transition-all hover:bg-lighter-bw hover:text-theme-color"
          >
            <LineChart className="h-5 w-5" />
            Analytics
          </Link> */}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
