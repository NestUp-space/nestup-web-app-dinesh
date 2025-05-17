"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/card";
import { Button } from "@/components/dashboard/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/select";
import { Label } from "@/components/dashboard/label";
import Link from 'next/link';
import { useUser } from '@/context/UserContext'; // Import useUser

interface User {
  id: number;
  email: string;
  isActive: boolean;
  name: string;
  role: {
    name: string;
    type: string;
  };
}

export function UserList() {
  const { user: loggedInUser } = useUser(); // Get the logged-in user's data
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalUsers, setTotalUsers] = React.useState(0);
  const [selectedRole, setSelectedRole] = React.useState<string>('');

  const fetchUsers = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/users?page=${currentPage}&pageSize=${pageSize}`;
      if (selectedRole) {
        url += `&roleType=${selectedRole}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.data.users);
      setTotalUsers(data.data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, selectedRole]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Button 
            variant="outline" 
            onClick={() => {
              setLoading(true);
              fetchUsers();
            }}
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
            <Link href="/dashboard/users/create">
              <Button>Create User</Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label htmlFor="roleFilter" className="mb-2 block">Filter by Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="roleFilter" className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem> 
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="engineer">Engineer</SelectItem>
                {/* Add other roles as needed */}
              </SelectContent>
            </Select>
          </div>

          <div className="divide-y divide-light-bw rounded-md border border-light-bw">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 hover:bg-lighter-bw transition-colors duration-150"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-dark-text-bw">{user.name}</p>
                  <p className="text-xs text-dark-text-bw/70">{user.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-dark-text-bw/70 px-2 py-0.5 bg-lighter-bw rounded-full border border-light-bw">{user.role.name}</span>
                  {loggedInUser?.permissions?.includes('users.edit') && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/dashboard/users/${user.id}`}>
                        Manage
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
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
