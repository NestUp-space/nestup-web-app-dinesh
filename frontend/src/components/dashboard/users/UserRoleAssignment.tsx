"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/card";
import { Button } from "@/components/dashboard/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/dashboard/select";
import { Label } from "@/components/dashboard/label";
import { AlertCircle, CheckCircle, ChevronDown } from "lucide-react";
import { useUser } from '@/context/UserContext';

interface UserRoleAssignmentProps {
  userId: number;
  userName: string;
  currentRoleId: number | null;
  onRoleAssigned: () => void;
}

interface Role {
  id: number;
  name: string; // Changed from role
  type: string; // Changed from roleType
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
      <Card className="bg-lightest-bw border-light-bw shadow-sm">
        <CardContent className="flex items-center justify-center p-6">
          <p className="text-dark-text-bw/70">Loading roles...</p>
        </CardContent>
      </Card>
    );
  }

  const canAssignRoles = loggedInUser?.permissions?.includes('users.edit');

  return (
    <Card className="bg-lightest-bw border-light-bw shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl text-dark-text-bw">Role Assignment</CardTitle>
      </CardHeader>
      <CardContent>
        {!canAssignRoles ? (
          <p className="text-sm text-dark-text-bw/70">You don&apos;t have permission to assign roles.</p>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-100 border border-red-200 p-3 rounded-md">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            )}
            
            {success && (
              <div className="flex items-center gap-2 text-green-600 text-sm bg-green-100 border border-green-200 p-3 rounded-md">
                <CheckCircle className="h-5 w-5" />
                {success}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="user-name-display" className="text-xs text-dark-text-bw/60">User</Label>
              <div id="user-name-display" className="p-2.5 border border-light-bw rounded-md bg-lighter-bw/30 text-sm text-dark-text-bw">
                {userName}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role-select" className="text-dark-text-bw">Assign Role</Label>
              <Select value={selectedRoleId} onValueChange={handleRoleChange} disabled={saving}>
                <SelectTrigger id="role-select" className="w-full bg-lightest-bw border-light-bw text-dark-text-bw hover:bg-lighter-bw/50 focus:ring-theme-color/50">
                  <SelectValue placeholder="Select a role" />
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </SelectTrigger>
                <SelectContent className="bg-lightest-bw border-light-bw text-dark-text-bw shadow-lg">
                  {roles.map((role, index) => (
                    <React.Fragment key={role.id}>
                      <SelectItem 
                        value={role.id.toString()}
                        className="hover:bg-lighter-bw/50 focus:bg-lighter-bw/70 data-[state=checked]:bg-theme-color/20 data-[state=checked]:text-theme-color-foreground py-2 px-3 cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{role.name}</span>
                          <span className="text-xs text-dark-text-bw/70">{role.type}</span>
                        </div>
                      </SelectItem>
                      {index < roles.length - 1 && <SelectSeparator className="bg-light-bw/50 my-1" />}
                    </React.Fragment>
                  ))}
                  {roles.length === 0 && (
                    <div className="p-3 text-center text-sm text-dark-text-bw/70">
                      No roles available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving || !selectedRoleId || selectedRoleId === currentRoleId?.toString()}
              className="w-full bg-theme-color text-theme-color-foreground hover:bg-theme-color/90 focus:ring-theme-color/50"
            >
              {saving ? "Saving..." : "Assign Role"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
