import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CreateUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    roleId: '',
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/users', formData);
      setSuccessMessage('User created successfully!');
      setErrorMessage('');
      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        roleId: '',
      });
      fetchRoles();
    } catch (error) {
      setErrorMessage('Failed to create user.');
      setSuccessMessage('');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/roles', newRoleData);
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
    } catch (error) {
      setErrorMessage('Failed to create role.');
      setSuccessMessage('');
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get('/api/roles');
      setRoles(response.data.roles);
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
          <label>Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div>
          <label>Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div>
          <label>Phone Number:</label>
          <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
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
