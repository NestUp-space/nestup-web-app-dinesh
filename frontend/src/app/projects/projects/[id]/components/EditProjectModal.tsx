/**
 * Edit Project Modal Component
 * Modal for editing project details
 */

'use client';

import React from 'react';
import { Button } from '@/components/dashboard/button';
import { Project, User } from '@/types';
import { useForm } from '@/hooks';

interface EditProjectModalProps {
  project: Project;
  clientsList: User[];
  engineersList: User[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  project,
  clientsList,
  engineersList,
  onClose,
  onSave
}) => {
  const { values, handleChange, handleSubmit, errors, isSubmitting } = useForm({
    initialValues: {
      name: project.name,
      description: project.description || '',
      address: project.address || '',
      location: project.location || '',
      sqft: project.sqft || '',
      clientId: project.client?.id || '',
      engineerId: project.engineer?.id || '',
    },
    validationSchema: {
      name: (value) => !value ? 'Project name is required' : null,
    },
    onSubmit: onSave
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Project</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 mb-6">
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input
                type="text"
                id="edit-name"
                name="name"
                value={values.name}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                id="edit-description"
                name="description"
                rows={3}
                value={values.description}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="edit-address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                id="edit-address"
                name="address"
                value={values.address}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700 mb-1">Location (Lat, Long)</label>
              <input
                type="text"
                id="edit-location"
                name="location"
                value={values.location}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="edit-sqft" className="block text-sm font-medium text-gray-700 mb-1">Square Footage</label>
              <input
                type="number"
                id="edit-sqft"
                name="sqft"
                value={values.sqft}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
            {/* Client Dropdown */}
            <div>
              <label htmlFor="edit-client" className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select
                id="edit-client"
                name="clientId"
                value={values.clientId}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              >
                <option value="">Select Client</option>
                {clientsList.map(client => (
                  <option key={client.id} value={client.id}>{client.name} ({client.email})</option>
                ))}
              </select>
            </div>
            {/* Engineer Dropdown */}
            <div>
              <label htmlFor="edit-engineer" className="block text-sm font-medium text-gray-700 mb-1">Engineer</label>
              <select
                id="edit-engineer"
                name="engineerId"
                value={values.engineerId}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              >
                <option value="">Select Engineer</option>
                {engineersList.map(engineer => (
                  <option key={engineer.id} value={engineer.id}>{engineer.name} ({engineer.email})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;
