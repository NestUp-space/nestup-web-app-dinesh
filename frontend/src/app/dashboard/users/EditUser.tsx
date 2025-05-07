import React, { useState } from 'react';
import axios from 'axios';

interface EditUserProps {
  user: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
    role?: string;
  };
  onUpdate: () => void;
  currentUserRole?: string;
}

const EditUser = ({ user, onUpdate, currentUserRole = '' }: EditUserProps) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
  });
  const [newPassword, setNewPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`/api/users/${user.id}`, formData);
      setSuccessMessage('User updated successfully!');
      setErrorMessage('');
      onUpdate();
    } catch (error) {
      setErrorMessage('Failed to update user.');
      setSuccessMessage('');
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setErrorMessage('Password cannot be empty');
      return;
    }
    
    try {
      await axios.patch(`/api/users/${user.id}/update-password`, { newPassword });
      setSuccessMessage('Password updated successfully!');
      setErrorMessage('');
      setNewPassword('');
    } catch (error) {
      setErrorMessage('Failed to update password.');
      setSuccessMessage('');
    }
  };

  return (
    <div>
      <h2>Edit User</h2>
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
        <button type="submit">Update User</button>
      </form>

      {currentUserRole === 'superadmin' && (
        <div>
          <h3>Update Password</h3>
          <form onSubmit={handlePasswordUpdate}>
            <div>
              <label>New Password:</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit">Update Password</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default EditUser;
