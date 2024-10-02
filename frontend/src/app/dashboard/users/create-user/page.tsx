"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/card";
import { Button } from "@/components/dashboard/button";
import { Input } from "@/components/dashboard/input";

const CreateUserPage: React.FC = () => {
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateUser = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
        }),
      });

      if (response.ok) {
        setNewUserEmail("");
        setNewUserPassword("");
        setSuccessMessage("User created successfully!");
      } else {
        setError("Failed to create user. Please try again.");
      }
    } catch (err) {
      setError("Failed to create user. Please try again.");
    }
  };

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Create New User</CardTitle>
        <CardDescription>Enter user details to create a new user.</CardDescription>
      </CardHeader>
      <CardContent>
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 text-green-800 border border-green-300 rounded">
            <p>{successMessage}</p>
          </div>
        )}
        <Input
          type="email"
          placeholder="Email"
          value={newUserEmail}
          onChange={(e) => setNewUserEmail(e.target.value)}
          className="mb-2"
        />
        <Input
          type="password"
          placeholder="Password"
          value={newUserPassword}
          onChange={(e) => setNewUserPassword(e.target.value)}
          className="mb-2"
        />
        <Button onClick={handleCreateUser} className="mt-2">
          Create User
        </Button>

        {error && (
          <div className="mt-2 text-red-500">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreateUserPage;
