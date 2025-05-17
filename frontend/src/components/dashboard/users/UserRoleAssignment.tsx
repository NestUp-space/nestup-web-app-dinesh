"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/card";
import { Button } from "@/components/dashboard/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/select";
import { Label } from "@/components/dashboard/label";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useUser } from '@/context/UserContext';

interface UserRoleAssignmentProps {
  userId: number;
  userName: string;
  currentRoleId: number | null;
  onRoleAssigned: () => void;
}

interface Role {
  id: number;
  role: string;  // Changed from 'name'
  roleType: string;  // Changed from 'type'
}

export function UserRoleAssignment({ userId, userName, currentRoleId, onRoleAssigned }: UserRoleAssignmentProps) {
  const { user: loggedInUser } = useUser();
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>(currentRoleId?.toString() || '');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Fetch available roles
  React.useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found");
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
        if (data.success) {
          setRoles(data.roles);
          if (currentRoleId) {
            setSelectedRoleId(currentRoleId.toString());
          }
        } else {
          throw new Error(data.message || "Failed to fetch roles");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [currentRoleId]);

  const handleRoleChange = (value: string) => {
    setSelectedRoleId(value);
    // Clear any previous messages
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!selectedRoleId) {
      setError("Please select a role");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleId: parseInt(selectedRoleId)
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user role");
      }

      const data = await response.json();
      if (data.success) {
        setSuccess("Role assigned successfully");
        onRoleAssigned();
      } else {
        throw new Error(data.message || "Failed to update user role");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-4">
          <div className="text-muted-foreground">Loading roles...</div>
        </CardContent>
      </Card>
    );
  }

  // Check if user has permission to assign roles
  const canAssignRoles = loggedInUser?.permissions?.includes('users.edit');
  if (!canAssignRoles) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You don't have permission to assign roles.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Assignment</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 flex items-center gap-2 text-green-500 text-sm bg-green-50 p-3 rounded-md">
            <CheckCircle className="h-4 w-4" />
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">User</Label>
            <div className="p-2 border rounded-md bg-muted/20">
              {userName}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-dark-text font-semibold">Role</Label>
            <Select value={selectedRoleId} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full bg-lighter-bg border-light-border hover:bg-light-bg focus:ring-theme-color text-dark-text placeholder:text-dark-text-bw">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="bg-lightest-bg border-light-border">
                {roles.map((role) => (
                  <SelectItem 
                    key={role.id} 
                    value={role.id.toString()}
                    className="text-dark-text hover:bg-lighter-bg focus:bg-lighter-bg data-[state=checked]:bg-light-interactive data-[state=checked]:text-white"
                  >
                    <div className="flex items-center">
                      {selectedRoleId === role.id.toString() && <CheckCircle className="mr-2 h-4 w-4 text-white" />}
                      {role.role}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={saving || !selectedRoleId || selectedRoleId === currentRoleId?.toString()}
            className="w-full bg-theme-color hover:bg-dark-color text-white"
          >
            {saving ? "Saving..." : "Assign Role"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
