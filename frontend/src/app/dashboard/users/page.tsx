"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { Tabs } from "@/components/dashboard/users/Tabs";
import { UserList } from "@/components/dashboard/users/UserList";
import { RolesManagement } from "@/components/dashboard/users/RoleManagement/RolesPage";
import { usePermissions } from '@/hooks/usePermissions'; // Import usePermissions
import { PERMISSIONS } from '@/constants/permissions'; // Import PERMISSIONS

export default function UsersPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { hasPermission } = usePermissions(); // Use the hook

  React.useEffect(() => {
    // Only proceed if loading is complete
    if (isLoading) {
      console.log('UsersPage - Still loading user data, skipping permission check.');
      return;
    }

    console.log('UsersPage - Loading complete. Current User state:', user);
    // user?.permissions is logged by usePermissions hook via UserContext if needed
    // console.log('UsersPage - Current User Permissions from context:', user?.permissions);

    if (user) {
      // User object exists, now check permissions using the hook
      const canViewUsers = hasPermission(PERMISSIONS.USERS.VIEW);
      console.log('UsersPage - Has users.view permission (checked with hook):', canViewUsers);
      if (!canViewUsers) {
        console.log('UsersPage - Redirecting to dashboard due to missing users.view permission.');
        router.push('/dashboard');
      } else {
        console.log('UsersPage - User has users.view permission. Access granted.');
      }
    } else {
      // No user object, implies not authenticated or error during profile load
      console.log('UsersPage - No user object found after loading. Redirecting to login or dashboard as a fallback.');
      router.push('/dashboard'); // Or /login
    }
  }, [user, isLoading, router, hasPermission]); // Added hasPermission to dependencies

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-dark-text-bw/70">Loading user data...</p>
      </div>
    );
  }

  // The useEffect hook above handles the permission check and redirection.
  // If the user does not have 'users.view' permission, they will be redirected.
  // This permission-based approach allows for more granular access control
  // compared to role-based checks, as any role with the right permissions can access this page.

  const showRoles = pathname.includes('/roles');
  return showRoles ? <RolesManagement /> : <UserList />;
}
