"use client";

import React from 'react';
import { Card, CardContent } from "@/components/dashboard/card";
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { Tabs } from "@/components/dashboard/users/Tabs";
import { UserList } from "@/components/dashboard/users/UserList";
import { RolesManagement } from "@/components/dashboard/users/RoleManagement/RolesPage";

export default function UsersPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useUser();

  React.useEffect(() => {
    console.log('UsersPage - User:', user);
    console.log('UsersPage - User Permissions:', user?.permissions);
    console.log('UsersPage - Has users.view permission:', user?.permissions?.includes('users.view'));
    
    if (!isLoading && user && !user.permissions?.includes('users.view')) {
      console.log('UsersPage - Redirecting to dashboard due to missing permission');
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  // The useEffect hook above handles the permission check and redirection.
  // If the user does not have 'users.view' permission, they will be redirected.
  // This permission-based approach allows for more granular access control
  // compared to role-based checks, as any role with the right permissions can access this page.

  const showRoles = pathname.includes('/roles');
  return showRoles ? <RolesManagement /> : <UserList />;
}
