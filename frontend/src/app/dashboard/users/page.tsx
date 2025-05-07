"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/card";
import { Button } from "@/components/dashboard/button";
import Pagination from "@/components/dashboard/pagination";
import UserCard from "@/components/dashboard/userCard";
import Link from "next/link";

// Define the User type
interface User {
  id: number;
  email: string;
  isActive: boolean;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/users?page=${currentPage}&pageSize=${pageSize}`,
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
      setUsers(data.users);
      setTotalUsers(data.total);
      setError(null);
    } catch (err) {
      setError("Could not load users. Please try again later.");
    }
  }, [currentPage, pageSize]); // fetchUsers is now stable due to useCallback

  useEffect(() => {
    fetchUsers(); // Call the function inside the effect
  }, [fetchUsers]); // Now only depends on the memoized fetchUsers

  return (
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
        <Button className="mb-4">
          <Link href="/dashboard/users/create-user">
            Create User
          </Link>
        </Button>

        <h3 className="text-lg font-semibold mt-4">All Users</h3>
        {users.length > 0 ? (
          <div className="grid gap-4">
            {users.map((user) => (
              <div key={user.id}>
                <UserCard user={user} />
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
  );
};

export default UsersPage;
