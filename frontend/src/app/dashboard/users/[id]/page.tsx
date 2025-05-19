"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/dashboard/card";
import { Button } from "@/components/dashboard/button";
import { Input } from "@/components/dashboard/input";
import { Label } from "@/components/dashboard/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/select";
import { Switch } from "@/components/dashboard/switch";
import { AlertCircle, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useUser } from '@/context/UserContext';
import { UserRoleAssignment } from '@/components/dashboard/users/UserRoleAssignment';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

interface UserDetails {
  id: number;
  email: string;
  name: string;
  phoneNumber: string | null;
  isActive: boolean;
  role: {
    id: number;
    name: string; // Changed from role
    type?: string; // Changed from roleType
  };
}

interface Role {
  id: number;
  name: string; // Changed from role
  type?: string; // Changed from roleType
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { user: loggedInUser } = useUser();
  
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // States for Create User Form
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    profilePicUrl: '',
    roleId: '',
  });

  // Permissions check
  useEffect(() => {
    if (userId === 'create') {
      if (!loggedInUser?.permissions?.includes('users.create')) {
        setError("You don't have permission to create users.");
        setLoading(false);
        // router.push('/dashboard/users'); // Or a general access denied page
        return;
      }
      setIsCreateMode(true);
      setLoading(false); // No user details to load for create mode initially
    } else {
      if (!loggedInUser?.permissions?.includes('users.view')) {
        // router.push('/dashboard'); // Or a general access denied page
        setError("You don't have permission to view users.");
        setLoading(false);
        return;
      }
      setIsCreateMode(false);
    }
  }, [loggedInUser, router, userId]);

  // Fetch user details or roles for create mode
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!userId || userId === 'create') return; // Already handled or not applicable
      setLoading(true);
      try {
        const data = await apiClient.get<{ success: boolean; user: UserDetails; message?: string }>(`/users/${userId}`);
        if (data.success) {
          setUser(data.user);
        } else {
          throw new Error(data.message || "Failed to fetch user details");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    const fetchRoles = async () => {
      setLoading(true); // Consider a separate loading state for roles if preferred
      try {
        // Assuming the API returns { success: boolean, roles: Role[] }
        const response = await apiClient.get<{ success: boolean; roles: Role[]; message?: string }>('/roles');
        if (response.success) {
          setRoles(response.roles);
        } else {
          throw new Error(response.message || "Failed to fetch roles");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch roles for the form.");
      } finally {
        setLoading(false); // Or the separate roles loading state
      }
    };

    if (isCreateMode) {
      fetchRoles();
      // No user details to fetch, form will be rendered.
      // setLoading(false) was already called in the permission check effect.
    } else if (userId) {
      fetchUserDetails();
    } else if (!userId && !isCreateMode) {
      // Handle cases where userId might be undefined or null, though useParams should provide a string
      setLoading(false);
      setError("User ID is missing.");
    }
  }, [userId, isCreateMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, roleId: value }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    if (!loggedInUser?.permissions?.includes('users.create')) {
      setFormError("You don't have permission to create users.");
      setFormSubmitting(false);
      return;
    }

    // Basic Validation
    if (!formData.name || !formData.email || !formData.password || !formData.phoneNumber || !formData.roleId) {
      setFormError("Please fill in all required fields (Name, Email, Password, Phone Number, Role).");
      setFormSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        roleId: parseInt(formData.roleId, 10), // Ensure roleId is a number
      };
      const response = await apiClient.post<{ success: boolean; user?: UserDetails; message?: string }>('/users', payload);
      
      if (response.success && response.user) {
        setFormSuccess(`User "${response.user.name}" created successfully!`);
        // Optionally redirect or clear form
        // router.push(`/dashboard/users/${response.user.id}`);
        setFormData({ name: '', email: '', password: '', phoneNumber: '', profilePicUrl: '', roleId: '' });
      } else {
        throw new Error(response.message || "Failed to create user.");
      }
    } catch (error: unknown) {
      let messageToDisplay = "An unexpected error occurred during user creation."; // Default generic message

      if (typeof error === 'object' && error !== null) {
        const errObj = error as any; // Type assertion to access potential properties

        // Attempt to get the detailed error string from backend response
        // Common patterns: err.error (if error object is the response body)
        // or err.response.data.error (if error is a wrapper like Axios error)
        const detailedErrorString = errObj.error || errObj.response?.data?.error;

        if (typeof detailedErrorString === 'string' &&
            (detailedErrorString.includes("Unique constraint failed") ||
             detailedErrorString.toLowerCase().includes("email already exists"))) {
          messageToDisplay = "This email address is already registered. Please use a different email.";
        } else if (typeof errObj.message === 'string') {
          // Fallback to errObj.message if specific string not found in detailedErrorString
          // This handles cases where errObj.message might itself contain the required text,
          // or provides a more specific message than the default.
           if (errObj.message.includes("Unique constraint failed") || errObj.message.toLowerCase().includes("email already exists")) {
             messageToDisplay = "This email address is already registered. Please use a different email.";
           } else {
             messageToDisplay = errObj.message; // Use the message from the error object
           }
        }
      }
      // If error is not an object or no specific/useful message found, 
      // messageToDisplay remains the default "An unexpected error occurred...".

      setFormError(messageToDisplay);
    } finally {
      setFormSubmitting(false);
    }
  };


  const handleToggleStatus = async () => {
    if (!user || isCreateMode) return;

    if (!loggedInUser?.permissions?.includes('users.edit')) {
      setStatusError("You don't have permission to edit users.");
      return;
    }

    try {
      setStatusUpdating(true);
      setStatusSuccess(null);
      setStatusError(null);

      const data = await apiClient.put<{ success: boolean; message?: string }>(
        `/users/${userId}/toggle-status`,
        { isActive: !user.isActive }
      );

      if (data.success) {
        setUser({
          ...user,
          isActive: !user.isActive
        });
        setStatusSuccess(`User ${!user.isActive ? 'activated' : 'deactivated'} successfully`);
      } else {
        throw new Error(data.message || "Failed to update user status");
      }
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleRoleAssigned = async () => {
    if (isCreateMode || !userId) return;
    // Refresh user details after role assignment
    setLoading(true);
    try {
      const data = await apiClient.get<{ success: boolean; user: UserDetails; message?: string }>(`/users/${userId}`);
      if (data.success) {
        setUser(data.user);
      } else {
        throw new Error(data.message || "Failed to fetch updated user details");
      }
    } catch (err) {
      console.error("Error refreshing user details:", err);
      setError(err instanceof Error ? err.message : "Failed to refresh user details");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isCreateMode) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-theme-color" />
        <p className="text-dark-text-bw/70">Loading User Details...</p>
      </div>
    );
  }
  
  if (error && !isCreateMode) {
    return (
      <Card className="bg-lightest-bw border-light-bw">
        <CardHeader>
          <CardTitle className="text-xl text-red-600">Error</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isCreateMode) {
    if (error && !roles.length) {
       return (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold text-dark-text-bw">Create New User</h1>
            <Button variant="outline" asChild>
              <Link href="/dashboard/users">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
              </Link>
            </Button>
          </div>
          <Card className="bg-lightest-bw border-light-bw">
            <CardHeader>
              <CardTitle className="text-xl text-red-600">Error Fetching Roles</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-red-600">{error}</div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold text-dark-text-bw">Create New User</h1>
          <Button variant="outline" asChild>
            <Link href="/dashboard/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Link>
          </Button>
        </div>
        <Card className="bg-lightest-bw border-light-bw shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-dark-text-bw">New User Form</CardTitle>
            <CardDescription className="text-dark-text-bw/70">Enter the details for the new user. Fields marked with * are required.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profilePicUrl">Profile Picture URL</Label>
                  <Input id="profilePicUrl" name="profilePicUrl" value={formData.profilePicUrl} onChange={handleInputChange} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="roleId">Role *</Label>
                  {loading && !roles.length ? (
                     <div className="flex items-center text-sm text-dark-text-bw/70 h-10">
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading roles...
                     </div>
                  ) : (
                    <Select name="roleId" onValueChange={handleSelectChange} value={formData.roleId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={String(role.id)}>
                            {role.name} 
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-100 border border-red-200 p-3 rounded-md">
                  <AlertCircle className="h-5 w-5" />
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-100 border border-green-200 p-3 rounded-md">
                  <CheckCircle className="h-5 w-5" />
                  {formSuccess}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={formSubmitting}>
                  {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create User
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!user) { 
    return (
      <Card className="bg-lightest-bw border-light-bw">
        <CardContent className="p-8 text-center">
          <p className="text-dark-text-bw/70 mb-4">User data is not available.</p>
          <Button variant="outline" asChild>
            <Link href="/dashboard/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-dark-text-bw">User Details</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-lightest-bw border-light-bw shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-dark-text-bw">User Information</CardTitle>
            <CardDescription className="text-dark-text-bw/70">View and manage user details.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Name", value: user.name },
                { label: "Email", value: user.email },
                { label: "Phone Number", value: user.phoneNumber || "Not provided" },
                {
                  label: "Current Role",
                  value: user.role.type
                           ? `${user.role.name} (${user.role.type})`
                           : user.role.name
                },
              ].map(item => (
                <div key={item.label} className="space-y-1">
                  <Label className="text-xs text-dark-text-bw/60">{item.label}</Label>
                  <div className="p-2.5 border border-light-bw rounded-md bg-lightest-bw text-sm text-dark-text-bw">
                    {item.label === "Current Role" ? (
                      <>
                        <span className="font-medium">{user.role.name}</span>
                        {user.role.type && <span className="text-xs text-dark-text-bw/70 ml-1">({user.role.type})</span>}
                      </>
                    ) : (
                      item.value
                    )}
                  </div>
                </div>
              ))}
              
              {loggedInUser?.permissions?.includes('users.edit') && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="user-status" className="text-sm font-medium text-dark-text-bw">User Status</Label>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${user.isActive ? "text-green-600" : "text-red-600"}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                      <Switch
                        id="user-status"
                        checked={user.isActive}
                        onCheckedChange={handleToggleStatus}
                        disabled={statusUpdating}
                        aria-label={`Toggle user status to ${user.isActive ? 'inactive' : 'active'}`}
                      />
                    </div>
                  </div>
                  
                  {statusSuccess && (
                    <div className="flex items-center gap-2 text-green-600 text-sm bg-green-100 border border-green-200 p-3 rounded-md">
                      <CheckCircle className="h-5 w-5" />
                      {statusSuccess}
                    </div>
                  )}
                  
                  {statusError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-100 border border-red-200 p-3 rounded-md">
                      <AlertCircle className="h-5 w-5" />
                      {statusError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <UserRoleAssignment
          userId={user.id}
          userName={user.name}
          currentRoleId={user.role.id}
          onRoleAssigned={handleRoleAssigned}
        />
      </div>
    </div>
  );
}
