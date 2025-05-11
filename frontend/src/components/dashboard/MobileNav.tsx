"use client";

import Link from 'next/link';
import { Button } from './button'; // Assuming button is in the same directory
import { Sheet, SheetContent, SheetTrigger } from './sheet'; // Assuming sheet is in the same directory
import { Home, Users2, LineChart, PanelLeft, Package2, Settings, BookCopy, FolderKanban, Workflow } from 'lucide-react'; // Added FolderKanban, Workflow
import { useUser } from '@/context/UserContext';
import { isAdmin, hasPermission } from '@/lib/authUtils'; // Assuming hasPermission might be more generic if roles differ

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
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <FolderKanban className="h-5 w-5" />
            Projects
          </Link>
          {!isLoading && user?.role && hasPermission(user.role.roleType, 'admin') && ( 
            <Link
              href="/dashboard/users"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Users2 className="h-5 w-5" />
              Users
            </Link>
          )}
          {!isLoading && user?.role && hasPermission(user.role.roleType, 'admin') && ( 
            <Link
              href="/dashboard/catalogue"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <BookCopy className="h-5 w-5" /> 
              Catalogue
            </Link>
          )}
          {!isLoading && user?.role && hasPermission(user.role.roleType, 'admin') && ( // Assuming BIM Process has same permissions
            <Link
              href="/dashboard/bimProcess"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground" // No longer indented
            >
              <Workflow className="h-5 w-5" />
              BIM Process
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
