'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Pagination from '@/components/ui/pagination';
import UserCard from '@/components/ui/userCard';

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
  const [error, setError] = useState<string | null>(null);

  // Function to fetch users
  const fetchUsers = async () => {
    const token = localStorage.getItem('token'); // Retrieve the token from localStorage

    if (!token) {
      setError('Unauthorized. Please log in.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/users?page=${currentPage}&pageSize=${pageSize}`, {
        headers: {
          'Authorization': `Bearer ${token}`, // Include the token in Authorization header
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized. Please log in.');
        } else {
          throw new Error('Failed to fetch users');
        }
      }

      const data = await response.json();
      setUsers(data.users);
      setTotalUsers(data.total);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load users. Please try again later.');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize]);

  const handleCreateUser = async () => {
    const token = localStorage.getItem('token'); // Retrieve the token for user creation

    if (!token) {
      setError('Unauthorized. Please log in.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include token in header
        },
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
        setShowCreateForm(false);
        fetchUsers();
      } else {
        setError('Failed to create user. Please try again.');
      }
    } catch (err) {
      setError('Failed to create user. Please try again.');
      console.error(err);
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
          </div>
        )}

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

        {error && <p className="text-red-600">{error}</p>}

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
