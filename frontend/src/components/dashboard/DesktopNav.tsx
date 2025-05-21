"use client";

import Link from 'next/link';
import Image from 'next/image';
import { NavItem } from './nav-item';
import { Home, Users, LineChart, Settings, LogOut, HelpCircle, User as UserIcon, BookCopy, FolderKanban, Workflow } from 'lucide-react'; // Added FolderKanban, Workflow
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { useUser } from '@/context/UserContext';
import { isAdmin, hasPermission } from '@/lib/authUtils';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

import LogoText from "@img/NestupLogoText.svg";

export function DesktopNav() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-56 flex-col border-r border-light-bw bg-lightest-bw text-dark-text-bw sm:flex">
      <nav className="flex flex-col gap-2 p-4">
        <div className="group flex h-12 w-full items-center justify-start px-2 mb-4">
          <Image src={LogoText} alt="Nestup Logo" className="h-10" />
        </div>

        <NavItem href="/dashboard" label="Dashboard">
          <Home className="h-5 w-5 mr-3" />
          Dashboard
        </NavItem>

        <NavItem href="/dashboard/projects" label="Projects">
          <FolderKanban className="h-5 w-5 mr-3" />
          Projects
        </NavItem>

        {!isLoading && user?.role && hasPermission(user?.role.roleType, 'admin') && (
          <NavItem href="/dashboard/users" label="Users">
            <Users className="h-5 w-5 mr-3" />
            Users
          </NavItem>
        )}

        {!isLoading && user?.role && hasPermission(user?.role.roleType, 'admin') && (
          <NavItem href="/dashboard/catalogue" label="Catalogue">
            <BookCopy className="h-5 w-5 mr-3" />
            Catalogue
          </NavItem>
        )}

        {!isLoading && user?.role && hasPermission(user?.role.roleType, 'admin') && ( // Assuming BIM Process has same permissions as Catalogue
          <NavItem href="/dashboard/bimProcess" label="BIM Process">
            <Workflow className="h-5 w-5 mr-3" />
            BIM Process
          </NavItem>
        )}

        {/* <NavItem href="#" label="Analytics">
          <LineChart className="h-5 w-5 mr-3" />
          Analytics
        </NavItem>

        <NavItem href="#" label="Support">
          <HelpCircle className="h-5 w-5 mr-3" />
          Support
        </NavItem>

        <NavItem href="#" label="Settings">
          <Settings className="h-5 w-5 mr-3" />
          Settings
        </NavItem> */}
      </nav>

      <div className="mt-auto flex flex-col items-start gap-2 p-4">
        <div className="border-t w-full border-light-bw my-2" />
        <div className="flex items-center gap-3 px-2">
          <UserIcon className="h-7 w-7 text-dark-text-bw" />
          <div>
            <div className="text-m font-medium text-dark-text-bw">
              {user?.name}
            </div>
            <div className="text-xs text-dark-text-bw/70">
              {user?.role ? user?.role.roleType : 'Role'}
            </div>
            <div className="text-xs text-dark-text-bw/70">
              {user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-start gap-3 rounded-md px-2 py-2 text-sm font-medium text-dark-text-bw transition-colors hover:bg-lighter-bw hover:text-theme-color focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
