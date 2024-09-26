'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Pagination from '@/components/ui/pagination'; // Assuming a custom pagination component

interface User {
  id: number;
  email: string;
  isActive: boolean;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [error, setError] = useState<string | null>(null); // State to manage errors

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize]); // Fetch users when page or page size changes

  const fetchUsers = async () => {
    try {
      const response = await fetch(`http://localhost:8080/users?page=${currentPage}&pageSize=${pageSize}`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
        setTotalUsers(data.total); // Assuming total users count is provided in response
        setError(null); // Reset error on successful fetch
      } else {
        throw new Error('Invalid user data received');
      }
    } catch (err) {
      console.error(err);
      setError('Could not load users. Please try again later.');
    }
  };

  const handleCreateUser = async () => {
    const response = await fetch('http://localhost:8080/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newUserEmail,
        password: newUserPassword,
      }),
    });

    if (response.ok) {
      const newUser = await response.json();
      setNewUserEmail('');
      setNewUserPassword('');
      setCreatedUser(newUser);
      setSuccessMessage('User created successfully!');
      setShowCreateForm(false); // Hide the form after creation
      fetchUsers(); // Refresh user list after creation
    } else {
      setError('Failed to create user. Please try again.');
    }
  };

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
            {createdUser && (
              <div>
                <p>Created User: {createdUser.email} - {createdUser.isActive ? 'Active' : 'Inactive'}</p>
                <Button onClick={() => setCreatedUser(null)} className="mt-2">Back to User List</Button>
              </div>
            )}
          </div>
        )}

        {!successMessage && (
          <>
            <Button onClick={() => setShowCreateForm((prev) => !prev)} className="mb-4">
              {showCreateForm ? 'Cancel' : 'Create User'}
            </Button>

            {showCreateForm && (
              <div className="mb-4">
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
                <Button onClick={handleCreateUser} className="mt-2">Create User</Button>
              </div>
            )}
          </>
        )}

        {error && <p className="text-red-600">{error}</p>} {/* Display error if exists */}

        <h3 className="text-lg font-semibold mt-4">All Users</h3>
        <ul className="list-disc list-inside mb-4">
          {users.map((user) => (
            <li key={user.id} className="flex justify-between items-center">
              <p>{user.email} - {user.isActive ? 'Active' : 'Inactive'}</p>
            </li>
          ))}
        </ul>

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
