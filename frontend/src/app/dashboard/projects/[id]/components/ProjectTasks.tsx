/**
 * Project Tasks Component
 * Displays the tasks and subtasks for a project in a timeline view
 * with status-based styling and animations
 */

'use client';

import React, { useMemo } from 'react';
import { Task, Project } from '@/types';
import CollapsibleTaskCard from '@/components/dashboard/CollapsibleTaskCard';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

// Task status enum for better type safety
export enum TaskStatus {
  DRAFT = 'Draft',
  ACTIVE = 'Active',
  COMPLETED = 'Completed'
}

// Timeline style configuration interface
interface TimelineStyleConfig {
  circleColor: string;
  lineColor: string;
  icon: React.ReactElement;
  circleSize: string;
  iconSize: number;
}

interface ProjectTasksProps {
  tasks: Task[];
  formatDate: (dateString?: string) => string;
  project: Project;
  onTaskUpdate?: () => void;
}

// Timeline style configuration map
const STYLE_CONFIG: Record<TaskStatus, TimelineStyleConfig> = {
  [TaskStatus.DRAFT]: {
    circleColor: 'bg-gray-400',
    lineColor: 'bg-gray-300',
    icon: <Circle className="text-white" />,
    circleSize: 'w-10 h-10',
    iconSize: 16
  },
  [TaskStatus.ACTIVE]: {
    circleColor: 'bg-orange-500',
    lineColor: 'bg-orange-300',
    icon: <Loader2 className="text-white animate-spin" />,
    circleSize: 'w-10 h-10',
    iconSize: 16
  },
  [TaskStatus.COMPLETED]: {
    circleColor: 'bg-green-500',
    lineColor: 'bg-green-400',
    icon: <CheckCircle className="text-white" />,
    circleSize: 'w-10 h-10',
    iconSize: 16
  }
};

// Hook for timeline styling
const useTimelineStyles = (task: Task, prevTaskStatus?: TaskStatus) => {
  return useMemo(() => {
    const status = task.status?.status as TaskStatus || TaskStatus.DRAFT;
    const config = STYLE_CONFIG[status];
    
    return {
      ...config,
      topConnectorColor: prevTaskStatus ? STYLE_CONFIG[prevTaskStatus].lineColor : undefined,
      bottomConnectorColor: config.lineColor
    };
  }, [task.status?.status, prevTaskStatus]);
};

// Timeline node component
const TaskTimelineNode: React.FC<{
  isFirst: boolean;
  isLast: boolean;
  styles: ReturnType<typeof useTimelineStyles>;
}> = ({ isFirst, isLast, styles }) => (
  <div className="flex flex-col items-center mr-6 h-full relative">
    {/* Top connector: always starts at the very top */}
    {!isFirst && (
      <div
        className={`absolute left-1/2 w-[3px] ${styles.topConnectorColor}`}
        style={{
          height: '50%'
        }}
      />
    )}

    {/* Timeline circle */}
    <div
      className={`
        ${styles.circleSize}
        rounded-full
        flex-shrink-0
        flex
        items-center
        justify-center
        ${styles.circleColor}
        border-2
        border-white
        z-20
        relative
      `}
      style={{ marginTop: isFirst ? 0 : '-50%' }}
    >
      {React.cloneElement(styles.icon, {
        size: styles.iconSize,
        className: `${styles.icon.props.className} transform translate-y-[1px]`
      })}
    </div>

    {/* Bottom connector: always stretches to the bottom */}
    {!isLast && (
      <div
        className={`absolute left-1/2 w-[3px] ${styles.bottomConnectorColor}`}
        style={{
          top: '0%',
          bottom: 0
        }}
      />
    )}
  </div>
);

export const ProjectTasks: React.FC<ProjectTasksProps> = ({
  tasks,
  formatDate,
  project,
  onTaskUpdate
}) => {
  // Sort tasks by sequenceIndex if available
  const sortedTasks = useMemo(() => {
    if (tasks?.length && tasks.every(task => typeof task.sequenceIndex === 'number')) {
      return [...tasks].sort((a, b) => (a.sequenceIndex as number) - (b.sequenceIndex as number));
    }
    return tasks;
  }, [tasks]);

  if (!tasks?.length) {
    return (
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">Project Timeline & Tasks</h2>
        <p className="text-gray-500 text-center py-8">No tasks found for this project.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">Project Timeline & Tasks</h2>
      </div>
      
      <div className="relative pl-8">
        {sortedTasks.map((task, index) => {
          const timelineStyles = useTimelineStyles(
            task,
            index > 0 ? sortedTasks[index - 1].status?.status as TaskStatus : undefined
          );

          return (
            <div key={task.id} className="flex items-start min-h-[8rem] relative mb-8">
              <div className="absolute left-0 h-full">
                <TaskTimelineNode
                  isFirst={index === 0}
                  isLast={index === sortedTasks.length - 1}
                  styles={timelineStyles}
                />
              </div>

              <div className={`flex-1 ml-16 ${task.status?.status === TaskStatus.COMPLETED ? 'pt-1' : 'pt-0'}`}>
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
    </div>
  );
};

export default ProjectTasks;
