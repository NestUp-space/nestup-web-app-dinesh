/**
 * Project Header Component
 * Displays the project title and action buttons
 */

'use client';

import React from 'react';
import { Button } from '@/components/dashboard/button';
import { Edit3, Trash2 } from 'lucide-react';
import { Project } from '@/types';

interface ProjectHeaderProps {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ 
  project, 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2 md:mb-0">{project.name}</h1>
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit3 className="mr-2 h-4 w-4" /> Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>
    </div>
  );
};

export default ProjectHeader;
