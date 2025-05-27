"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/card";
import { Button } from "@/components/dashboard/button";

interface Role {
  id: number;
  name: string;
}

const CreateUserPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("No token found. Please log in.");
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/roles`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch roles");
        }

        const data = await response.json();
        setRoles(data.roles);
      } catch (error: any) {
        setErrorMessage(error.message || "Failed to fetch roles");
        setSuccessMessage(null);
      }
    };

    fetchRoles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !name || !phoneNumber || !role) {
      setErrorMessage("All fields are required.");
      setSuccessMessage(null);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Invalid email format.");
      setSuccessMessage(null);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      const selectedRole = roles.find((r) => r.name === role);
      if (!selectedRole) {
        throw new Error("Invalid role selected.");
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, password, name, phoneNumber, roleId: selectedRole.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create user");
      }

      setSuccessMessage("User created successfully!");
      setErrorMessage(null);
      setEmail("");
      setPassword("");
      setName("");
      setPhoneNumber("");
      setRole("");
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to create user");
      setSuccessMessage(null);
    }
  };

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Create User</CardTitle>
        <CardDescription>Create a new user.</CardDescription>
      </CardHeader>
      <CardContent>
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 text-green-800 border border-green-300 rounded">
            <p>{successMessage}</p>
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 border border-red-300 rounded">
            <p>{errorMessage}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 p-2 w-full border rounded-md"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 p-2 w-full border rounded-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              className="mt-1 p-2 w-full border rounded-md"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              className="mt-1 p-2 w-full border rounded-md"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              className="mt-1 p-2 w-full border rounded-md"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <Button variant="default" type="submit">
            Create User
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateUserPage;
