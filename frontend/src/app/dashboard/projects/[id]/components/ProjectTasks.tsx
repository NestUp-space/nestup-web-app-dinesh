/**
 * Project Tasks Component
 * Displays the tasks and subtasks for a project
 */

'use client';

import React from 'react';
import { Task, Project } from '@/types';
import CollapsibleTaskCard from '@/components/dashboard/CollapsibleTaskCard';

interface ProjectTasksProps {
  tasks: Task[];
  formatDate: (dateString?: string) => string;
  project: Project; // Changed from projectId to project
}

export const ProjectTasks: React.FC<ProjectTasksProps> = ({ 
  tasks, 
  formatDate,
  project
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">Project Timeline & Tasks</h2>
      </div>
      
      {tasks && tasks.length > 0 ? (
        <div className="space-y-6">
          {tasks.map((task) => (
            <CollapsibleTaskCard 
              key={task.id} 
              task={task} 
              formatDate={formatDate}
              project={project}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No tasks found for this project.</p>
      )}
    </div>
  );
};

export default ProjectTasks;
