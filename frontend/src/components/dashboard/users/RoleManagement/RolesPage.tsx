"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/card";
import { Button } from "@/components/dashboard/button";
import { RoleTab } from './RoleTab';
import { CreateRoleDialog } from './CreateRoleDialog';
import { useUser } from '@/context/UserContext'; // Import useUser

interface Role {
  id: number;
  name: string;
  type: string;
  permissions: Record<string, boolean>;
}

export function RolesManagement() {
  const { user: loggedInUser } = useUser();
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }

      const data = await response.json();
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
    fetchRoles();
  }, []);

  if (loading) {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Role Management</CardTitle>
          {loggedInUser?.permissions?.includes('roles.create') && (
            <CreateRoleDialog onRoleCreated={fetchRoles} />
          )}
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
                No roles found. Create your first role to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Role Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Roles define what users can do in the system. Each role can have different permissions for viewing and managing various sections.
          </p>
          <div className="grid gap-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Managing Roles</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>Create new roles with predefined permission templates</li>
                <li>Customize permissions for each role</li>
                <li>View and edit existing role permissions</li>
              </ul>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Permission Types</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>View - Access to read and view content</li>
                <li>Create - Permission to add new items</li>
                <li>Edit - Ability to modify existing content</li>
                <li>Delete - Permission to remove content</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
