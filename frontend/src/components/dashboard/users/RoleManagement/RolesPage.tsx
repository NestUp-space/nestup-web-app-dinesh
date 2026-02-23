"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleTab } from './RoleTab';
import { CreateRoleDialog } from './CreateRoleDialog';
import { useUser } from '@/context/UserContext'; // Import useUser
import { useRoles, Role } from '@/hooks/useRoles'; // Import the new hook and Role type

export function RolesManagement() {
  const { user: loggedInUser } = useUser();
  const { roles, loading, error, refetch } = useRoles();

  // No explicit useEffect for fetching needed, useRoles handles it.

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-dark-text-bw/70">Loading roles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-lightest-bw border-light-bw">
        <CardContent className="p-8 text-center">
          <p className="text-red-500 mb-4">Error: {error?.message || 'An unknown error occurred'}</p>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-lightest-bw border-light-bw shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-2xl text-dark-text-bw">Role Management</CardTitle>
          {loggedInUser?.permissions?.includes('roles.create') && (
            <CreateRoleDialog onRoleCreated={refetch} />
          )}
        </CardHeader>
        <CardContent>
          {roles.length > 0 ? (
            <div className="space-y-4">
              {roles.map((role) => (
                <RoleTab
                  key={role.id}
                  role={role}
                  onUpdate={refetch}
                />
              ))}
            </div>
          ) : (
            <p className="text-dark-text-bw/70 text-center py-10">
              No roles found. Create your first role to get started.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-lightest-bw border-light-bw shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-dark-text-bw">About Role Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-dark-text-bw/80">
            Roles define what users can do in the system. Each role can have different permissions for viewing and managing various sections.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-light-bw p-4 bg-lightest-bw">
              <h3 className="font-semibold text-dark-text-bw mb-2">Managing Roles</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-dark-text-bw/70">
                <li>Create new roles with predefined permission templates</li>
                <li>Customize permissions for each role</li>
                <li>View and edit existing role permissions</li>
              </ul>
            </div>
            <div className="rounded-lg border border-light-bw p-4 bg-lightest-bw">
              <h3 className="font-semibold text-dark-text-bw mb-2">Permission Types</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-dark-text-bw/70">
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
