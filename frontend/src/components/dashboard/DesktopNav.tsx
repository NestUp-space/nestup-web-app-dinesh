"use client";

import Link from 'next/link';
import Image from 'next/image';
import { NavItem } from './nav-item';
import { Home, Users, LineChart, Settings, LogOut, HelpCircle, User as UserIcon, BookCopy } from 'lucide-react';
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
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-48 flex-col border-r bg-background sm:flex">
      <div className="flex flex-col items-center gap-4 px-4 py-5">
        <div className="group flex h-9 w-full items-center justify-between">
          <Image src={LogoText} alt="Nestup Logo" className="h-10" />
        </div>

        <NavItem href="/dashboard" label="Dashboard">
          <Home className="h-5 w-5 mr-2" />
          Dashboard
        </NavItem>

        {!isLoading && user?.role && hasPermission(user?.role.roleType, 'admin') && (
          <NavItem href="/dashboard/users" label="Users">
            <Users className="h-5 w-5 mr-2" />
            Users
          </NavItem>
        )}

        {/* TODO: Review if BookCopy is the most appropriate icon for Catalogue */}
        {!isLoading && user?.role && hasPermission(user?.role.roleType, 'admin') && (
          <NavItem href="/dashboard/catalogue" label="Catalogue">
            <BookCopy className="h-5 w-5 mr-2" /> 
            Catalogue
          </NavItem>
        )}

        <NavItem href="#" label="Analytics">
          <LineChart className="h-5 w-5 mr-2" />
          Analytics
        </NavItem>

        <NavItem href="#" label="Support">
          <HelpCircle className="h-5 w-5 mr-2" />
          Support
        </NavItem>

        <NavItem href="#" label="Settings">
          <Settings className="h-5 w-5 mr-2" />
          Settings
        </NavItem>
      </div>

      <div className="mt-auto flex flex-col items-center gap-2 px-4 py-5">
        <div className="border-t w-full border-border my-2" />
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            {user?.name}
          </div>
        </div>
        <div className="text-xs text-muted-foreground ml-6">
          {user?.role ? user?.role.roleType : 'Role'}
        </div>
        <div className="text-xs text-muted-foreground ml-6">
          {user?.email}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-start gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
