/**
 * Project Details Component
 * Displays detailed information about a project
 */

'use client';

import React from 'react';
import { Project, Task, Subtask } from '@/types'; // Updated imports
import CollapsibleTaskCard from '@/components/dashboard/CollapsibleTaskCard'; // Added import

interface ProjectDetailsProps {
  project: Project;
  formatDate: (dateString?: string) => string;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project, 
  formatDate 
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Project Details</h2>
        <p className="text-gray-600 mb-2">
          <strong>Description:</strong> {project.description || 'N/A'}
        </p>
        <p className="text-gray-600 mb-2">
          <strong>Address:</strong> {project.address || 'N/A'}
        </p>
        <p className="text-gray-600 mb-2">
          <strong>Location:</strong> {project.location || 'N/A'}
        </p>
        <p className="text-gray-600 mb-2">
          <strong>Sq. Footage:</strong> {project.sqft || 'N/A'} sqft
        </p>
        <p className="text-gray-600 mb-2">
          <strong>Status:</strong> 
          <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
            project.status?.status === 'Completed' ? 'bg-green-100 text-green-700' :
            project.status?.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
            project.status?.status === 'Pending' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {project.status?.status || 'N/A'}
          </span>
        </p>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Key Information</h2>
        <p className="text-gray-600 mb-2">
          <strong>Client:</strong> {project.client?.name || 'N/A'} ({project.client?.email || 'N/A'})
        </p>
        <p className="text-gray-600 mb-2">
          <strong>Engineer:</strong> {project.engineer?.name || 'N/A'} ({project.engineer?.email || 'N/A'})
        </p>
        <p className="text-gray-600 mb-2">
          <strong>Estimated Completion:</strong> {formatDate(project.estimatedTime)}
        </p>
        <p className="text-gray-600 mb-2">
          <strong>Created At:</strong> {formatDate(project.createdAt)}
        </p>
        <p className="text-gray-600 mb-2">
          <strong>Last Updated:</strong> {formatDate(project.updatedAt)}
        </p>
      </div>
    </div>
    </>
  );
};

export default ProjectDetails;
