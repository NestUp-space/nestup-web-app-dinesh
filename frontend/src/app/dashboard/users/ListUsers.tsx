import React, { useEffect, useState } from 'react';
import axios from 'axios';
import EditUser from './EditUser';

interface User {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  role: string; // Add role property
  isActive: boolean; // Add isActive property
}

const ListUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data.users);
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
      await axios.patch(`/api/users/${userId}/toggle-active`, { isActive });
      fetchUsers();
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>User List</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone Number</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.phoneNumber}</td>
              <td>
                <button onClick={() => setEditingUser(user)}>Edit</button>
                {user.role === 'superadmin' ? (
                  <button disabled>Cannot Disable</button>
                ) : (
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
          <EditUser user={editingUser} onUpdate={handleUpdate} />
        </div>
      )}
    </div>
  );
};

export default ListUsers;
