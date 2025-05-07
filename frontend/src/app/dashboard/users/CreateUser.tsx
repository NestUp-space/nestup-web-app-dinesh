import React, { useState, useEffect } from 'react';
import * as api from '../../../lib/api';

const CreateUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    roleId: '',
    isActive: true, // Default to true as per schema
  });
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [newRoleData, setNewRoleData] = useState({
    name: '',
    permissions: {
      users: false,
      projects: false,
      tasks: false,
    }
  });
  const [showNewRoleForm, setShowNewRoleForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/users', formData);
      if (response.success) {
        setSuccessMessage('User created successfully!');
        setErrorMessage('');
        setFormData({
          name: '',
          email: '',
          phoneNumber: '',
          password: '',
          roleId: '',
          isActive: true,
        });
        fetchRoles();
      } else {
        setErrorMessage(response.message || 'Failed to create user.');
        setSuccessMessage('');
      }
    } catch (error) {
      setErrorMessage('Failed to create user.');
      setSuccessMessage('');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/roles', newRoleData);
      if (response.success) {
        setSuccessMessage('Role created successfully!');
        setErrorMessage('');
        setNewRoleData({
          name: '',
          permissions: {
            users: false,
            projects: false,
            tasks: false,
          }
        });
        setShowNewRoleForm(false);
        fetchRoles();
      } else {
        setErrorMessage(response.message || 'Failed to create role.');
        setSuccessMessage('');
      }
    } catch (error) {
      setErrorMessage('Failed to create role.');
      setSuccessMessage('');
    }
  };

  interface RolesResponse {
    roles: { id: string; name: string }[];
  }

  const fetchRoles = async () => {
    try {
      const response = await api.get<RolesResponse>('/api/roles');
      if (response.success && response.data) {
        setRoles(response.data.roles || []);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <div>
      <h2>Create User</h2>
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
        <div>
          <label>Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div>
          <label>Phone Number:</label>
          <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />
        </div>
        <div>
          <label>Role:</label>
          <select
            name="roleId"
            value={formData.roleId}
            onChange={handleChange}
            required
          >
            <option value="">Select a role</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
          <button type="button" onClick={() => setShowNewRoleForm(!showNewRoleForm)}>
            {showNewRoleForm ? 'Cancel' : 'Create New Role'}
          </button>
        </div>
        <div>
          <label>
            Active:
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
          </label>
        </div>
        <button type="submit">Create User</button>
      </form>

      {showNewRoleForm && (
        <div>
          <h3>Create New Role</h3>
          <form onSubmit={handleCreateRole}>
            <div>
              <label>Role Name:</label>
              <input
                type="text"
                value={newRoleData.name}
                onChange={(e) => setNewRoleData({ ...newRoleData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <h4>Permissions:</h4>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={newRoleData.permissions.users}
                    onChange={(e) => setNewRoleData({
                      ...newRoleData,
                      permissions: {
                        ...newRoleData.permissions,
                        users: e.target.checked
                      }
                    })}
                  />
                  Manage Users
                </label>
              </div>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={newRoleData.permissions.projects}
                    onChange={(e) => setNewRoleData({
                      ...newRoleData,
                      permissions: {
                        ...newRoleData.permissions,
                        projects: e.target.checked
                      }
                    })}
                  />
                  Manage Projects
                </label>
              </div>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={newRoleData.permissions.tasks}
                    onChange={(e) => setNewRoleData({
                      ...newRoleData,
                      permissions: {
                        ...newRoleData.permissions,
                        tasks: e.target.checked
                      }
                    })}
                  />
                  Manage Tasks
                </label>
              </div>
            </div>
            <button type="submit">Create Role</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CreateUser;
