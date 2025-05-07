import React, { useState } from 'react';
import axios from 'axios';

interface EditUserProps {
  user: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  };
  onUpdate: () => void;
}

const EditUser = ({ user, onUpdate }: EditUserProps) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    </div>
  );
};

export default EditUser;
