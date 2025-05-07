"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/card";
import { Button } from "@/components/dashboard/button";

interface User {
  id: number;
  email: string;
  isActive: boolean;
}

const UserDetailsPage: React.FC = () => {
  const { id } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!id) return;

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("No token found. Please log in.");
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }

        const data = await response.json();
        setUser(data);
        setError(null);
      } catch (err) {
        setError("Could not load user details. Please try again later.");
      }
    };

    fetchUser();
  }, [id]);

  if (error) {
    return <p>{error}</p>;
  }

  if (!user) {
    return <p>Loading user details...</p>;
  }

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">User Details</CardTitle>
        <CardDescription>View and manage user details.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Email: {user.email}</p>
        <p>Status: {user.isActive ? 'Active' : 'Inactive'}</p>
        <Button>Update User</Button>
      </CardContent>
    </Card>
  );
};

export default UserDetailsPage;
