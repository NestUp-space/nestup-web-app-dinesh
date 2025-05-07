import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EditUser from './EditUser';
import { useUser } from '../../../context/UserContext';
import * as api from '../../../lib/api';
import { isAdmin } from '../../../lib/authUtils';

interface User {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
}

interface UsersResponse {
  users: User[];
  total: number;
}

const ListUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !isAdmin(currentUser?.role)) {
      router.push('/dashboard');
    }
  }, [currentUser, isUserLoading, router]);

  const fetchUsers = async () => {
    try {
      // Ensure currentUser is loaded and is an admin before fetching
      if (!currentUser || !isAdmin(currentUser.role)) {
        setLoading(false);
        // Optionally set an error or just don't fetch
        // setError("Unauthorized to fetch users."); 
        return;
      }
      const response = await api.get<UsersResponse>('/api/users');
      if (response.success && response.data) {
        setUsers(response.data.users || []);
      } else {
        setError(response.message || 'Failed to fetch users');
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch users');
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    setEditingUser(null);
    fetchUsers();
  };

  const handleToggleActiveStatus = async (userId: number, isActive: boolean) => {
    try {
      const response = await api.post(`/api/users/${userId}/toggle-active`, { isActive });
      if (response.success) {
        fetchUsers();
      } else {
        setError(response.message || 'Failed to update user status');
      }
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  useEffect(() => {
    // Fetch users only if the current user is loaded and is an admin
    if (!isUserLoading && currentUser && isAdmin(currentUser.role)) {
      fetchUsers();
    } else if (!isUserLoading && (!currentUser || !isAdmin(currentUser.role))) {
      // If user is loaded but not admin, stop loading and potentially show error or redirect
      setLoading(false);
      // setError("Access Denied"); // Or handle redirect as done in the other useEffect
    }
  }, [currentUser, isUserLoading]); // Rerun when currentUser or its loading state changes

  if (isUserLoading || loading) return <p>Loading users...</p>;
  if (error) return <p>{error}</p>;
  if (!isAdmin(currentUser?.role)) {
    // This check is a fallback, primary redirection is handled by useEffect
    return <p>Access Denied. You do not have permission to view this page.</p>;
  }
  
  if (users.length === 0) return <p>No users found.</p>;

  return (
    <div>
      <h2>User List</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone Number</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.phoneNumber}</td>
              <td>{user.role}</td>
              <td>{user.isActive ? 'Active' : 'Inactive'}</td>
              <td>
                <button onClick={() => setEditingUser(user)}>Edit</button>
                {user.role !== 'super admin' && ( // Allow disabling admins but not super admins
                  <button onClick={() => handleToggleActiveStatus(user.id, !user.isActive)}>
                    {user.isActive ? 'Disable' : 'Enable'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editingUser && (
        <div>
          <EditUser
            user={editingUser}
            onUpdate={handleUpdate}
            currentUserRole={currentUser?.role}
          />
        </div>
      )}
    </div>
  );
};

export default ListUsers;
