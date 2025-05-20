"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/card";
import { Button } from "@/components/dashboard/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/select";
import { Label } from "@/components/dashboard/label";
import Link from 'next/link';
import { useUser } from '@/context/UserContext'; // Import useUser
import { useUsersList } from '@/hooks/useUsers'; // Import the new hook
import { User } from '@/types'; // Use global User type
import { UserListItem } from './UserListItem'; // Import the new component

export function UserList() {
  const { user: loggedInUser } = useUser(); // Get the logged-in user's data
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [selectedRole, setSelectedRole] = React.useState<string>(''); // Keep 'all' or specific role type string

  const { users, totalUsers, loading, error, refetch } = useUsersList({
    currentPage,
    pageSize,
    selectedRole: selectedRole === 'all' ? '' : selectedRole, // Pass empty string if 'all'
  });

  // Effect to refetch when filters change
  React.useEffect(() => {
    // useUsersList hook handles fetching internally based on its dependencies.
    // If currentPage, pageSize, or selectedRole change, useUsersList will re-trigger useGet.
    // No explicit refetch() call needed here unless for a manual refresh button.
  }, [currentPage, pageSize, selectedRole]);

  const canEditUsers = loggedInUser?.permissions?.includes('users.edit') || false;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-dark-text-bw/70">Loading users...</p>
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
          <CardTitle className="text-2xl text-dark-text-bw">Users</CardTitle>
          {loggedInUser?.permissions?.includes('users.create') && (
            <Link href="/dashboard/users/create-user"> {/* Corrected Link based on file structure */}
              <Button>Create User</Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label htmlFor="roleFilter" className="mb-2 block">Filter by Role</Label>
            <Select value={selectedRole} onValueChange={(value) => {
              setSelectedRole(value);
              setCurrentPage(1); // Reset to first page on filter change
            }}>
              <SelectTrigger id="roleFilter" className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem> 
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="engineer">Engineer</SelectItem>
                {/* TODO: Fetch roles dynamically for this filter if needed */}
              </SelectContent>
            </Select>
          </div>

          <div className="divide-y divide-light-bw rounded-md border border-light-bw">
            {users.map((user) => (
              <UserListItem key={user.id} user={user} canEdit={canEditUsers} />
            ))}
          </div>

          {users.length === 0 && (
            <div className="text-center py-10 text-dark-text-bw/70">
              No users found for the selected criteria.
            </div>
          )}
        </CardContent>
      </Card>
      {/* TODO: Add pagination controls if totalUsers > pageSize */}
    </div>
  );
}
