"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, ChevronUp, CheckCircle, Circle, 
  PlusCircle as PlusCircleIcon, Trash2 as TrashIcon,
  Info, Loader2, MinusCircle, XCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Task, Subtask, Project } from '@/types';
import { useUser } from '@/context/UserContext';
import { PERMISSIONS as FE_PERMISSIONS } from '@/constants/permissions';
import { useProject as useProjectHook } from '@/hooks/useProject';
import { defaultProjectTaskTemplates, FrontendTaskTemplate } from '@/constants/projectTaskTemplate';
import {
  FileUploadSubtask,
  ApprovalSubtask,
  DataCollectionSubtask,
  PaymentSubtask
} from '@/components/dashboard/subtasks';

interface CollapsibleTaskCardProps {
  task: Task;
  formatDate: (dateString?: string) => string;
  project?: Project;
  onTaskUpdate?: () => void;
}

const CollapsibleTaskCard: React.FC<CollapsibleTaskCardProps> = ({ task, formatDate, project, onTaskUpdate }) => {
  const [isOpen, setIsOpen] = useState(task.status?.status === 'Active');
  const [currentSubtasks, setCurrentSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [selectedSubtask, setSelectedSubtask] = useState<Subtask | null>(null);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const { user: currentUser, hasPermission: userHasPermission } = useUser();
  const { refetch: refetchProjectHook } = useProjectHook(project?.id.toString() || null);

  const statusIdMap: { [key: string]: number } = {
    'Draft': 1,
    'Active': 2,
    'Completed': 3,
    'Archived': 4,
    'On Hold': 5,
  };

  useEffect(() => {
    setCurrentSubtasks(task.subtasks || []);
    if (task.status?.status === 'Active') {
      setIsOpen(true);
    } else if (task.status?.status === 'Completed' || task.status?.status === 'Draft') {
      setIsOpen(false);
    }
  }, [task.subtasks, task.status?.status]);

  const handleStatusUpdate = async (newStatusId: number) => {
    if (!project || !project.id || !token) {
      alert("Project details or authentication token not found.");
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${project.id}/tasks/${task.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatusId }),
        }
      );

      if (response.ok) {
        if (newStatusId === statusIdMap['Active']) {
          setIsOpen(true);
        } else if (newStatusId === statusIdMap['Completed'] || newStatusId === statusIdMap['Draft']) {
          setIsOpen(false);
        }
        if (onTaskUpdate) onTaskUpdate();
        else if (refetchProjectHook) refetchProjectHook();
      } else {
        const errorData = await response.json();
        alert(`Error updating task status: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert(`Failed to update task status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleToggleSubtaskCompletion = async (subtaskId: number, currentCompletedStatus: boolean) => {
    if (!token || !project) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${project.id}/tasks/${task.id}/subtasks/${subtaskId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ completed: !currentCompletedStatus }),
        }
      );
      if (response.ok) {
        const responseData = await response.json();
        setCurrentSubtasks(prevSubtasks =>
          prevSubtasks.map(st => st.id === subtaskId ? { ...st, completed: responseData.subtask.completed } : st)
        );
        if (responseData.parentTask?.status?.status !== task.status?.status) {
          if (onTaskUpdate) onTaskUpdate();
          else if (refetchProjectHook) refetchProjectHook();
        }
      } else {
        const errorData = await response.json();
        alert(`Error updating subtask: ${errorData.message}`);
      }
    } catch (error) {
      alert(`Failed to update subtask: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskName.trim() || !token || !project?.id) {
      alert("Subtask name, project ID, and authentication are required.");
      return;
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${project.id}/tasks/${task.id}/subtasks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ name: newSubtaskName, isTemplateSubtask: false }),
        }
      );
      if (response.ok) {
        const newSubtaskData = await response.json();
        setCurrentSubtasks(prevSubtasks => [...prevSubtasks, newSubtaskData.subtask]);
        setNewSubtaskName('');
        if (onTaskUpdate) onTaskUpdate();
        else if (refetchProjectHook) refetchProjectHook();
      } else {
        const errorData = await response.json();
        alert(`Error adding subtask: ${errorData.message}`);
      }
    } catch (error) {
      alert(`Failed to add subtask: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const renderSubtaskContent = (subtask: Subtask) => {
    if (!project) return null;

    const handleSubtaskComplete = () => {
      if (onTaskUpdate) onTaskUpdate();
      else if (refetchProjectHook) refetchProjectHook();
    };

    switch (subtask.type) {
      case 'upload':
        return (
          <FileUploadSubtask
            subtask={subtask}
            project={project}
            onUploadComplete={handleSubtaskComplete}
            currentUser={currentUser}
          />
        );
      case 'approval':
        return (
          <ApprovalSubtask
            subtask={subtask}
            project={project}
            onApprovalComplete={handleSubtaskComplete}
            currentUser={currentUser}
          />
        );
      case 'data_collection':
        return (
          <DataCollectionSubtask
            subtask={subtask}
            project={project}
            onDataSaved={handleSubtaskComplete}
            currentUser={currentUser}
          />
        );
      case 'payment':
        return (
          <PaymentSubtask
            subtask={subtask}
            project={project}
            onPaymentComplete={handleSubtaskComplete}
            currentUser={currentUser}
          />
        );
      default:
        return null;
    }
  };

  // Check if previous tasks are completed
  const arePreviousTasksCompleted = () => {
    if (!project || !project.tasks || !task.stage || !task.name) return true;

    const currentTaskTemplateIndex = defaultProjectTaskTemplates.findIndex(
      (template: FrontendTaskTemplate) => template.stage === task.stage && template.taskName === task.name
    );

    if (currentTaskTemplateIndex === -1) {
      console.warn(`Task ${task.name} (Stage: ${task.stage}) not found in defaultProjectTaskTemplates.`);
      return true;
    }

    for (let i = 0; i < currentTaskTemplateIndex; i++) {
      const precedingTemplateTask = defaultProjectTaskTemplates[i];
      const correspondingActualTask = project.tasks.find(
        (pTask) => pTask.stage === precedingTemplateTask.stage && pTask.name === precedingTemplateTask.taskName
      );

      if (correspondingActualTask && correspondingActualTask.status?.status !== 'Completed') {
        return false;
      }
    }
    return true;
  };

  const canSetToCompleted = arePreviousTasksCompleted();
  const isTaskCompleted = task.status?.status === 'Completed';

  const handleSubtaskClick = (subtask: Subtask) => {
    setSelectedSubtask(selectedSubtask?.id === subtask.id ? null : subtask);
  };

  return (
    <div className={`
      bg-white shadow-lg rounded-lg border border-gray-200 
      ${isTaskCompleted ? 'border-l-4 border-green-500' : ''}
      overflow-hidden transition-all duration-200 ease-in-out
    `}>
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-grow">
            {task.stage && <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{task.stage}</p>}
            <h3 className="text-lg font-semibold text-gray-800">{task.name}</h3>
            <div className="flex items-center mt-1">
              {(() => {
                const statusText = task.status?.status || 'N/A';
                const isTaskModifiable = project && task.status?.status !== 'Completed';

                const canUserUpdateThisTaskStatus = isTaskModifiable && (
                  (currentUser?.role?.role === 'Project Manager' && userHasPermission(FE_PERMISSIONS.TASKS.UPDATE_STATUS_ANY)) ||
                  userHasPermission(FE_PERMISSIONS.TASKS.UPDATE_STATUS_ANY) ||
                  (task.uploaderRole === 'Client' && userHasPermission(FE_PERMISSIONS.TASKS.UPDATE_STATUS_AS_CLIENT)) ||
                  (task.uploaderRole === 'BIM Engineer' && userHasPermission(FE_PERMISSIONS.TASKS.UPDATE_STATUS_AS_BIM_ENGINEER))
                );

                let icon = <MinusCircle size={16} className="mr-1.5 text-gray-500" />;
                let textColor = 'text-gray-700';
                let bgColor = 'bg-gray-100';
                let hoverBgColor = 'hover:bg-gray-200';

                if (statusText === 'Completed') {
                  icon = <CheckCircle size={16} className="mr-1.5 text-green-500" />;
                  textColor = 'text-green-700'; bgColor = 'bg-green-100'; hoverBgColor = 'hover:bg-green-200';
                } else if (statusText === 'Active') {
                  icon = isUpdatingStatus ? <Loader2 size={16} className="mr-1.5 text-orange-500 animate-spin" /> : <Loader2 size={16} className="mr-1.5 text-orange-500" />;
                  textColor = 'text-orange-700'; bgColor = 'bg-orange-100'; hoverBgColor = 'hover:bg-orange-200';
                } else if (statusText === 'Draft') {
                  icon = isUpdatingStatus ? <Loader2 size={16} className="mr-1.5 text-gray-500 animate-spin" /> : <Circle size={16} className="mr-1.5 text-gray-500" />;
                  textColor = 'text-gray-700';
                } else if (statusText === 'Pending') {
                  icon = isUpdatingStatus ? <Loader2 size={16} className="mr-1.5 text-blue-500 animate-spin" /> : <Loader2 size={16} className="mr-1.5 text-blue-500" />;
                  textColor = 'text-blue-700'; bgColor = 'bg-blue-100'; hoverBgColor = 'hover:bg-blue-200';
                }

                const buttonBaseClasses = `inline-flex items-center px-2.5 py-1 text-sm font-medium rounded-full mr-2`;
                const buttonClasses = `${buttonBaseClasses} ${bgColor} ${textColor} ${canUserUpdateThisTaskStatus ? `${hoverBgColor} cursor-pointer` : 'cursor-not-allowed opacity-75'}`;

                const statusButtonContent = (
                  <>
                    {icon}
                    {statusText}
                    {canUserUpdateThisTaskStatus && <ChevronDown size={14} className="ml-1.5" />}
                  </>
                );

                if (canUserUpdateThisTaskStatus) {
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={buttonClasses}
                          disabled={isUpdatingStatus}
                        >
                          {statusButtonContent}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {task.status?.status !== 'Active' && task.status?.status !== 'Completed' && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(statusIdMap['Active'])}>
                            Set to In Progress
                          </DropdownMenuItem>
                        )}
                        {task.status?.status !== 'Completed' && (
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(statusIdMap['Completed'])}
                            disabled={!canSetToCompleted}
                            title={!canSetToCompleted ? "Previous tasks must be completed first" : ""}
                          >
                            Set to Completed
                            {!canSetToCompleted && <Info size={14} className="ml-2 text-yellow-500" />}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }

                return (
                  <div className={buttonClasses}>
                    {statusButtonContent}
                  </div>
                );
              })()}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="ml-auto">
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </Button>
        </div>

        {isOpen && (
          <div className="lg:grid lg:grid-cols-[1fr,400px] lg:gap-6">
            {/* Left Column: Task List */}
            <div className="border-r border-gray-200 pr-6">
              <div className="mb-4">
                <p className="text-xs text-gray-500">Created: {formatDate(task.createdAt)}</p>
                <p className="text-xs text-gray-500">Updated: {formatDate(task.updatedAt)}</p>
              </div>
              
              <h4 className="text-md font-semibold text-gray-700 mb-4">Subtasks</h4>
              
              {currentSubtasks.length > 0 ? (
                <ul className="space-y-3">
                  {currentSubtasks.map(subtask => (
                    <li 
                      key={subtask.id}
                      className={`
                        p-4 rounded-lg border transition-all duration-200
                        ${selectedSubtask?.id === subtask.id ? 
                          'bg-blue-50 border-blue-200' : 
                          'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }
                        cursor-pointer
                      `}
                      onClick={() => handleSubtaskClick(subtask)}
                    >
                      <div className="flex items-start">
                        {subtask.actionByRole === currentUser?.role?.role && 
                         currentUser?.role?.role === 'Project Manager' && 
                         userHasPermission(FE_PERMISSIONS.SUBTASKS.CHANGE_STATUS) && (
                          <Button 
                            variant="ghost"
                            size="icon"
                            className="mr-3 mt-0.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSubtaskCompletion(subtask.id, subtask.completed);
                            }}
                          >
                            {subtask.completed ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400" />
                            )}
                          </Button>
                        )}
                        
                        {/* Show status icon for view-only users (like Designers) */}
                        {(subtask.actionByRole === currentUser?.role?.role && 
                          currentUser?.role?.role !== 'Project Manager') ||
                         !userHasPermission(FE_PERMISSIONS.SUBTASKS.CHANGE_STATUS) ? (
                          <div className="mr-3 mt-0.5 p-2">
                            {subtask.completed ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        ) : null}
                        
                        <div className="flex-grow">
                          <span className={`font-medium ${subtask.completed ? ' text-gray-500' : 'text-gray-800'}`}>
                            {subtask.name}
                          </span>
                          {subtask.actionRequired && (
                            <p className="text-sm text-gray-600 mt-1">{subtask.actionRequired}</p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No subtasks defined.</p>
              )}

              {/* Add Subtask Form */}
              {userHasPermission(FE_PERMISSIONS.SUBTASKS.CREATE) && (
                <form onSubmit={handleAddSubtask} className="mt-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubtaskName}
                      onChange={(e) => setNewSubtaskName(e.target.value)}
                      placeholder="New subtask name"
                      className="flex-grow p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Button type="submit" size="sm">
                      Add
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Right Column: Subtask Details */}
            <div className={`
              lg:block
              ${selectedSubtask ? 'block' : 'hidden lg:block'}
              p-6 bg-gray-50
            `}>
              {selectedSubtask ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {selectedSubtask.name}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSubtask(null)}
                      className="lg:hidden"
                    >
                      <XCircle className="h-5 w-5" />
                    </Button>
                  </div>
                  {renderSubtaskContent(selectedSubtask)}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Select a subtask to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollapsibleTaskCard;
