"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/card";
import { Button } from "@/components/dashboard/button";
import Pagination from "@/components/dashboard/pagination";
import UserCard from "@/components/dashboard/userCard";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { isAdmin, hasPermission } from '@/lib/authUtils';
import Breadcrumbs from '@/components/dashboard/Breadcrumbs';

// Define the User type
interface User {
  id: number;
  email: string;
  isActive: boolean;
}

const UsersPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    console.log("User role:", user?.role, "Is admin:", user?.role ? hasPermission(user?.role.roleType, 'admin') : false);
    if (!isLoading && user?.role && !hasPermission(user?.role.roleType, 'admin')) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users?page=${currentPage}&pageSize=${pageSize}`;
      if (selectedRole) {
        url += `&roleName=${selectedRole}`;
      }

      const response = await fetch(
        url,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.data.users);
      setTotalUsers(data.data.total);
      setError(null);
    } catch (err) {
      setError("Could not load users. Please try again later.");
    }
  }, [currentPage, pageSize, selectedRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(event.target.value);
  };

  return (
    <>
      <Breadcrumbs />
      <Card className="p-6">
        <CardHeader>
        <CardTitle className="text-xl font-bold">User Management</CardTitle>
        <CardDescription>View, create, and manage users.</CardDescription>
      </CardHeader>
      <CardContent>
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 text-green-800 border border-green-300 rounded">
            <p>{successMessage}</p>
          </div>
        )}
        <Link href="/dashboard/users/create-user">
          <Button variant="createUser" className="mb-4">
            Create User
          </Button>
        </Link>

        {/* Role Filter Dropdown */}
        <div className="mb-4">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">Filter by Role:</label>
          <select
            id="role"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={selectedRole}
            onChange={handleRoleChange}
          >
            <option value="">All Roles</option>
            <option value="client">Client</option>
            <option value="engineer">Engineer</option>
          </select>
        </div>

        <h3 className="text-lg font-semibold mt-4">All Users</h3>
        {users.length > 0 ? (
          <div className="grid gap-4">
            {users.map((user) => (
              <div key={user.id}>
                <UserCard user={user} onClick={() => router.push(`/dashboard/users/${user.id}`)} />
              </div>
            ))}
          </div>
        ) : (
          <p>No users found.</p>
        )}

        <Pagination
          totalCount={totalUsers}
          page={currentPage}
          limit={pageSize}
          onPageChange={setCurrentPage}
          onLimitChange={setPageSize}
        />
      </CardContent>
      </Card>
    </>
  );
};

export default UsersPage;
