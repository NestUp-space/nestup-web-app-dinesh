/**
 * Project Tasks Component
 * Displays the tasks and subtasks for a project
 */

'use client';

import React from 'react';
import { Task, Project } from '@/types';
import CollapsibleTaskCard from '@/components/dashboard/CollapsibleTaskCard';
import { CheckCircle, Circle, Loader2 } from 'lucide-react'; // Import icons for timeline

interface ProjectTasksProps {
  tasks: Task[];
  formatDate: (dateString?: string) => string;
  project: Project; 
  onTaskUpdate?: () => void; // Add onTaskUpdate prop
}

export const ProjectTasks: React.FC<ProjectTasksProps> = ({ 
  tasks, 
  formatDate,
  project,
  onTaskUpdate // Destructure onTaskUpdate
}) => {
  // Sort tasks by sequenceIndex if available, otherwise maintain current order (which might be by createdAt or API default)
  const sortedTasks = React.useMemo(() => {
    if (tasks && tasks.length > 0 && tasks.every(task => typeof task.sequenceIndex === 'number')) {
      return [...tasks].sort((a, b) => (a.sequenceIndex as number) - (b.sequenceIndex as number));
    }
    return tasks; // Fallback to original order if sequenceIndex is not consistently present
  }, [tasks]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">Project Timeline & Tasks</h2>
      </div>
      
      {tasks && tasks.length > 0 ? (
        <div className="relative pl-8"> {/* Add padding for timeline */}
          {/* Timeline vertical line */}
          {/* This is a simplified line; a more robust solution might draw segments between items */}
          {/* <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div> */}

          {sortedTasks.map((task, index) => {
            const statusText = task.status?.status || 'N/A';
            let circleColor = 'bg-gray-400'; // Default for Not Started / Draft
            let lineColor = 'bg-gray-300'; // Default line color
            let icon = <Circle size={12} className="text-white fill-current" />;

            if (statusText === 'Active') {
              circleColor = 'bg-orange-500';
              lineColor = 'bg-orange-500';
              icon = <Loader2 size={10} className="text-white animate-spin" />;
            } else if (statusText === 'Completed') {
              circleColor = 'bg-green-500';
              lineColor = 'bg-green-500';
              icon = <CheckCircle size={12} className="text-white fill-current" />;
            } else if (statusText === 'Draft') {
              circleColor = 'bg-gray-400';
              lineColor = 'bg-gray-300'; // Line before a draft task
            }
            
            // Determine line color based on *current* task's status for the line segment *below* it
            // The line above a task would be colored by the *previous* task's status.
            // This simplified approach colors the line segment below the current task's circle with its own status color.

            return (
              <div key={task.id} className="flex items-start mb-6">
                {/* Timeline elements */}
                <div className="flex flex-col items-center mr-4">
                  {/* Top connector line (conditionally rendered for tasks after the first) */}
                  {index > 0 && (
                    <div className={`w-0.5 h-6 ${sortedTasks[index-1].status?.status === 'Completed' ? 'bg-green-500' : (sortedTasks[index-1].status?.status === 'Active' ? 'bg-orange-500' : 'bg-gray-300')}`}></div>
                  )}
                  
                  {/* Circle/Icon */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${circleColor} z-10`}>
                    {icon}
                  </div>

                  {/* Bottom connector line (not for the last task) */}
                  {index < sortedTasks.length - 1 && (
                    <div className={`w-0.5 flex-grow ${lineColor}`}></div>
                  )}
                </div>

                {/* Task Card */}
                <div className="flex-1">
                  <CollapsibleTaskCard 
                    task={task} 
                    formatDate={formatDate}
                    project={project}
                    onTaskUpdate={onTaskUpdate}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No tasks found for this project.</p>
      )}
    </div>
  );
};

export default ProjectTasks;
