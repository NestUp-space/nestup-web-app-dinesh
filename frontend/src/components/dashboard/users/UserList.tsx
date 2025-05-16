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
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading users...</div>
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
              setLoading(true);
              fetchUsers();
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
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Users</CardTitle>
          {loggedInUser?.permissions?.includes('users.create') && (
            <Link href="/dashboard/users/create">
              <Button variant="outline" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Create User
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label>Filter by Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="engineer">Engineer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="divide-y divide-border rounded-md border">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{user.role.name}</span>
                  {loggedInUser?.permissions?.includes('users.edit') && (
                    <Button
                      variant="ghost"
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
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
