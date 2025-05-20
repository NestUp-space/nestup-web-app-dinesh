"use client";

import React from 'react';
import ProjectCard from '@/components/dashboard/projects/ProjectCard'; // Assuming ProjectCardProps is also exported or defined here
import { ProjectCardProps } from '@/components/dashboard/projects/ProjectCard'; // Explicitly import if needed for the project type

interface ProjectListProps {
  projects: any[]; // Consider using a more specific type, e.g., Project[]
  emptyListMessage?: string;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, emptyListMessage = "No projects found." }) => {
  if (!projects || projects.length === 0) {
    return <p className="text-dark-text-bw/70 text-center py-10">{emptyListMessage}</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};

export default ProjectList;
