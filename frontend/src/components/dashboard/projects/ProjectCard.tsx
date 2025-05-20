"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

// ProjectCard component definition
export interface ProjectCardProps {
  project: any; // Consider defining a more specific type for project
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const router = useRouter();
  
  return (
    <div 
      key={project.id} 
      className="bg-lightest-bw border border-light-bw shadow-md rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={() => router.push(`/dashboard/projects/${project.id}`)}
    >
      <h2 className="text-xl font-semibold text-dark-text-bw mb-2">{project.name}</h2>
      <p className="text-dark-text-bw/80 text-sm mb-3">
        {project.description ? `${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}` : 'No description available.'}
      </p>
      <div className="space-y-1 text-sm text-dark-text-bw/70">
        <p><strong>Designer:</strong> {project.designer?.name || 'N/A'}</p>
        <p><strong>Project Manager:</strong> {project.projectManager?.name || 'N/A'}</p>
        <p><strong>Engineer:</strong> {project.engineer?.name || 'N/A'}</p>
        <p><strong>Tasks:</strong> {project.tasks?.length || 0}</p>
      </div>
      
      <div className="mt-4">
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
          project.status?.status === 'Completed' ? 'bg-green-100 text-green-700 border border-green-200' :
          project.status?.status === 'Active' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
          project.status?.status === 'Draft' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
          project.status?.status === 'Archived' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
          'bg-lighter-bw text-dark-text-bw border border-light-bw' // Default/Unknown status
        }`}>
          {project.status?.status || 'Unknown Status'}
        </span>
      </div>
    </div>
  );
};

export default ProjectCard;
