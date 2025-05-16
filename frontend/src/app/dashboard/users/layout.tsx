"use client";

import React from 'react';
import { Card } from "@/components/dashboard/card";
import { Tabs } from "@/components/dashboard/users/Tabs";
import Breadcrumbs from '@/components/dashboard/Breadcrumbs';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { hasPermission } from '@/lib/authUtils';

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useUser();

  React.useEffect(() => {
    if (!isLoading && user?.role && !hasPermission(user?.role.roleType, 'admin')) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user?.role || !hasPermission(user?.role.roleType, 'admin')) {
    return null;
  }

  return (
    <>
      <Breadcrumbs />
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles and permissions</p>
        </div>
        <Tabs />
        <div className="mt-4">
          {children}
        </div>
      </Card>
    </>
  );
}
