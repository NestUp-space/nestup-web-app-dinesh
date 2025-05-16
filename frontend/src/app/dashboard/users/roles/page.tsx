"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/card";
import { Button } from "@/components/dashboard/button";
import { RoleTab } from '@/components/dashboard/users/RoleManagement/RoleTab';
import { CreateRoleDialog } from '@/components/dashboard/users/RoleManagement/CreateRoleDialog';
import { useUser } from '@/context/UserContext';
import { apiClient } from '@/lib/api/client'; // Import apiClient

interface Role {
  id: number;
  name: string;
  type: string;
  permissions: Record<string, boolean>;
}

const RolesPage = () => {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Check if user has permission to view roles
  React.useEffect(() => {
    if (!isLoading && user && !user.permissions?.includes('roles.view')) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const fetchRoles = async () => {
    try {
      // apiClient handles token and base URL automatically
      const data = await apiClient.get<{ success: boolean; roles: Role[]; message?: string }>('/roles');
      if (data.success) {
        setRoles(data.roles);
      } else {
        throw new Error(data.message || "Failed to fetch roles");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!isLoading && user && user.permissions?.includes('roles.view')) {
      fetchRoles();
    }
  }, [isLoading, user]); // Removed fetchRoles from dependency array as it's stable

  if (isLoading || loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading roles...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-red-500">Error: {error}</div>
          <Button 
            variant="outline" 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchRoles();
            }}
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const canCreateRoles = user?.permissions?.includes('roles.create');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Role Management</CardTitle>
          {canCreateRoles && <CreateRoleDialog onRoleCreated={fetchRoles} />}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roles.map((role) => (
              <RoleTab
                key={role.id}
                role={role}
                onUpdate={() => fetchRoles()}
              />
            ))}
            {roles.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                No roles found. {canCreateRoles ? 'Create your first role to get started.' : 'Contact an administrator to create roles.'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Roles help you control what users can see and do in the application. Each role can have different permissions for viewing and managing various sections.
          </p>
          <div className="grid gap-4">
            <div className="flex items-start gap-4">
              <div className="font-medium">View Permissions</div>
              <div className="text-sm text-muted-foreground">Allow users to view specific sections of the application</div>
            </div>
            <div className="flex items-start gap-4">
              <div className="font-medium">Edit Permissions</div>
              <div className="text-sm text-muted-foreground">Allow users to make changes within their assigned sections</div>
            </div>
            <div className="flex items-start gap-4">
              <div className="font-medium">Create Permissions</div>
              <div className="text-sm text-muted-foreground">Allow users to create new items within their assigned sections</div>
            </div>
            <div className="flex items-start gap-4">
              <div className="font-medium">Delete Permissions</div>
              <div className="text-sm text-muted-foreground">Allow users to delete items within their assigned sections</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RolesPage;
