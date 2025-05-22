"use client";

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Button } from '@/components/dashboard/button';
import { 
  Eye, Edit3, ChevronDown, ChevronUp, CheckCircle, Circle, 
  PlusCircle as PlusCircleIcon, Trash2 as TrashIcon, UploadCloud, 
  Info, UserCheck, Download, Package, Loader2, MinusCircle, Edit
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Assuming this is the correct path for Radix Dropdown
import { Task, Subtask, Project } from '@/types';
import { useUser } from '@/context/UserContext';
import { PERMISSIONS as FE_PERMISSIONS } from '@/constants/permissions';
import { useProject as useProjectHook } from '@/hooks/useProject';
import { defaultProjectTaskTemplates, FrontendTaskTemplate } from '@/constants/projectTaskTemplate'; // Import task template for order and type

const MaterialManagement = lazy(() => import('@/components/dashboard/MaterialManagement'));
const ModelSelector = lazy(() => import('@/components/dashboard/ModelSelector'));

interface CollapsibleTaskCardProps {
  task: Task;
  formatDate: (dateString?: string) => string;
  project?: Project;
  onTaskUpdate?: () => void; // Callback to refresh project data
}

const CollapsibleTaskCard: React.FC<CollapsibleTaskCardProps> = ({ task, formatDate, project, onTaskUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSubtasks, setCurrentSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); // For loading state
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
  }, [task.subtasks]);

  const handleStatusUpdate = async (newStatusId: number) => {
    if (!project || !project.id || !token) {
      alert("Project details or authentication token not found.");
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects/${project.id}/tasks/${task.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatusId }),
      });

      if (response.ok) {
        // alert('Task status updated successfully!'); // Consider using a toast notification system instead of alert
        if (onTaskUpdate) {
          onTaskUpdate();
        } else if (refetchProjectHook) {
          refetchProjectHook();
        }
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
    if (!token) {
      alert("Authentication token not found.");
      return;
    }
    try {
      // Note: The API endpoint for subtask update might need to include projectId and taskId if it's nested
      // For now, assuming /api/projects/subtasks/:subtaskId is correct or will be adjusted if subtask routes are nested differently.
      // The current backend subtask controller uses /api/tasks/:taskId/subtasks/:subtaskId or /api/projects/:projectId/tasks/:taskId/subtasks/:subtaskId
      // The CollapsibleTaskCard currently calls /api/projects/subtasks/:subtaskId which seems incorrect based on backend routes.
      // This should likely be /api/projects/${project?.id}/tasks/${task.id}/subtasks/${subtaskId}
      const subtaskUpdateUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects/${project?.id}/tasks/${task.id}/subtasks/${subtaskId}`;

      const response = await fetch(subtaskUpdateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !currentCompletedStatus }),
      });
      if (response.ok) {
        const responseData = await response.json(); // Expect { subtask: Subtask, parentTask?: TaskWithSubtasks | null }
        
        // Update current subtask
        setCurrentSubtasks(prevSubtasks =>
          prevSubtasks.map(st => st.id === subtaskId ? { ...st, completed: responseData.subtask.completed } : st)
        );

        // If parent task was updated (e.g., all subtasks completed), refresh project
        if (responseData.parentTask && onTaskUpdate) {
          onTaskUpdate();
        } else if (responseData.parentTask && refetchProjectHook) {
          refetchProjectHook();
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects/${project.id}/tasks/${task.id}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newSubtaskName, isTemplateSubtask: false }), // Explicitly set isTemplateSubtask to false
      });
      if (response.ok) {
        const newSubtaskData = await response.json();
        // Ensure the new subtask from API response includes isTemplateSubtask
        setCurrentSubtasks(prevSubtasks => [...prevSubtasks, newSubtaskData.subtask]);
        setNewSubtaskName('');
        if (onTaskUpdate) onTaskUpdate(); // Refresh project to get updated task status if backend modifies it
        else if (refetchProjectHook) refetchProjectHook();
      } else {
        const errorData = await response.json();
        alert(`Error adding subtask: ${errorData.message}`);
      }
    } catch (error) {
      alert(`Failed to add subtask: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    if (!token || !project?.id) {
      alert("Project ID and authentication are required to delete a subtask.");
      return;
    }
    // Optional: Add a confirmation dialog here
    // if (!confirm("Are you sure you want to delete this subtask?")) {
    //   return;
    // }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects/${project.id}/tasks/${task.id}/subtasks/${subtaskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setCurrentSubtasks(prevSubtasks => prevSubtasks.filter(st => st.id !== subtaskId));
        alert('Subtask deleted successfully.');
        if (onTaskUpdate) onTaskUpdate();
        else if (refetchProjectHook) refetchProjectHook();
      } else {
        const errorData = await response.json();
        alert(`Error deleting subtask: ${errorData.message}`);
      }
    } catch (error) {
      alert(`Failed to delete subtask: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const isTaskCompleted = task.status?.status === 'Completed';

  // Function to check if preceding tasks are completed
  const arePreviousTasksCompleted = () => {
    if (!project || !project.tasks || !task.stage || !task.name) return true; // Default to true if data is missing

    const currentTaskTemplateIndex = defaultProjectTaskTemplates.findIndex(
      (template: FrontendTaskTemplate) => template.stage === task.stage && template.taskName === task.name
    );

    if (currentTaskTemplateIndex === -1) {
      // Task not in standard template, or template mismatch
      console.warn(`Task ${task.name} (Stage: ${task.stage}) not found in defaultProjectTaskTemplates. Cannot check previous task completion.`);
      return true; // Or false, depending on desired behavior for non-template tasks
    }

    for (let i = 0; i < currentTaskTemplateIndex; i++) {
      const precedingTemplateTask = defaultProjectTaskTemplates[i];
      const correspondingActualTask = project.tasks.find(
        (pTask) => pTask.stage === precedingTemplateTask.stage && pTask.name === precedingTemplateTask.taskName
      );

      if (correspondingActualTask && correspondingActualTask.status?.status !== 'Completed') {
        return false; // Found a preceding task that is not completed
      }
    }
    return true; // All preceding tasks are completed
  };

  const canSetToCompleted = arePreviousTasksCompleted();

  const renderStatusUpdateDropdownItems = () => (
    <>
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
    </>
  );


  return (
    <div className={`bg-white shadow-lg rounded-lg p-5 border border-gray-200 ${isTaskCompleted ? 'border-l-4 border-green-500' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex-grow">
          {task.stage && <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{task.stage}</p>}
          <h3 className="text-lg font-semibold text-gray-800">{task.name}</h3>
          <div className="flex items-center mt-1">
            {(() => {
              const statusText = task.status?.status || 'N/A';
              const isTaskModifiable = project && task.status?.status !== 'Completed';

              const canUserUpdateThisTaskStatus = isTaskModifiable && (
                (currentUser?.role?.role === 'Project Manager' && userHasPermission(FE_PERMISSIONS.TASKS.UPDATE_STATUS_ANY)) ||
                userHasPermission(FE_PERMISSIONS.TASKS.UPDATE_STATUS_ANY) || // General permission for anyone
                (task.uploaderRole === 'Client' && userHasPermission(FE_PERMISSIONS.TASKS.UPDATE_STATUS_AS_CLIENT)) ||
                (task.uploaderRole === 'BIM Engineer' && userHasPermission(FE_PERMISSIONS.TASKS.UPDATE_STATUS_AS_BIM_ENGINEER))
              );

              let icon = <MinusCircle size={16} className="mr-1.5 text-gray-500" />;
              let textColor = 'text-gray-700';
              let bgColor = 'bg-gray-100'; // Base background for button
              let hoverBgColor = 'hover:bg-gray-200'; // Base hover for button

              if (statusText === 'Completed') {
                icon = <CheckCircle size={16} className="mr-1.5 text-green-500" />;
                textColor = 'text-green-700'; bgColor = 'bg-green-100'; hoverBgColor = 'hover:bg-green-200';
              } else if (statusText === 'Active') {
                icon = isUpdatingStatus ? <Loader2 size={16} className="mr-1.5 text-orange-500 animate-spin" /> : <Loader2 size={16} className="mr-1.5 text-orange-500 animate-spin" />; // Keep spinning for active
                textColor = 'text-orange-700'; bgColor = 'bg-orange-100'; hoverBgColor = 'hover:bg-orange-200';
              } else if (statusText === 'Draft') {
                icon = isUpdatingStatus ? <Loader2 size={16} className="mr-1.5 text-gray-500 animate-spin" /> : <Circle size={16} className="mr-1.5 text-gray-500" />;
                textColor = 'text-gray-700'; bgColor = 'bg-gray-100'; hoverBgColor = 'hover:bg-gray-200';
              } else if (statusText === 'Pending') {
                icon = isUpdatingStatus ? <Loader2 size={16} className="mr-1.5 text-blue-500 animate-spin" /> : <Loader2 size={16} className="mr-1.5 text-blue-500 animate-spin" />; // Keep spinning for pending
                textColor = 'text-blue-700'; bgColor = 'bg-blue-100'; hoverBgColor = 'hover:bg-blue-200';
              }
              
              const buttonBaseClasses = `inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full mr-2 transition-colors duration-150 ease-in-out`;
              const buttonClasses = `${buttonBaseClasses} ${bgColor} ${textColor} ${canUserUpdateThisTaskStatus ? `${hoverBgColor} cursor-pointer` : 'cursor-not-allowed opacity-75'}`;
              
              const statusButtonContent = (
                <>
                  {isUpdatingStatus && statusText !== 'Active' && statusText !== 'Pending' ? <Loader2 size={16} className="mr-1.5 animate-spin" /> : icon}
                  {statusText}
                  {canUserUpdateThisTaskStatus && <ChevronDown size={14} className="ml-1.5" />}
                </>
              );

              if (canUserUpdateThisTaskStatus) {
                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost" // Use ghost or a custom variant to better control background
                        size="sm" // Adjust size as needed, "sm" is usually good for this
                        className={buttonClasses}
                        disabled={isUpdatingStatus}
                      >
                        {statusButtonContent}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {renderStatusUpdateDropdownItems()}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              
              // Render as a non-interactive button/span if not updatable
              return (
                <Button
                  variant="ghost"
                  size="sm"
                  className={buttonClasses}
                  disabled
                  aria-disabled="true"
                >
                   {icon}
                   {statusText}
                </Button>
              );
            })()}
          </div>
        </div>
        {/* The separate Edit button DropdownMenu is removed as its functionality is merged */}
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="ml-auto">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </Button>
      </div>
      

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Created: {formatDate(task.createdAt)}</p>
      <p className="text-xs text-gray-500">Last Updated: {formatDate(task.updatedAt)}</p>
          <h4 className="text-md font-semibold text-gray-700 mb-3">Actions / Subtasks:</h4>
          {currentSubtasks.length > 0 ? (
            <ul className="space-y-3">
              {currentSubtasks.map(subtask => (
                <li key={subtask.id} className="p-3 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <Button variant="ghost" size="icon" className="mr-3 mt-0.5 flex-shrink-0" onClick={() => handleToggleSubtaskCompletion(subtask.id, subtask.completed)}>
                        {subtask.completed ? <CheckCircle size={20} className="text-green-500" /> : <Circle size={20} className="text-gray-400" />}
                      </Button>
                      <div>
                        <span className={`font-medium ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                          {subtask.name}
                        </span>
                        {subtask.actionRequired && <p className="text-xs text-gray-600 mt-0.5">{subtask.actionRequired}</p>}
                        {subtask.type && (
                          <div className="mt-1 flex items-center text-xs text-gray-500">
                            {subtask.type === 'file_upload' && <UploadCloud size={14} className="mr-1" />}
                            {subtask.type === 'information' && <Info size={14} className="mr-1" />}
                            {subtask.type === 'approval' && <UserCheck size={14} className="mr-1" />}
                            {subtask.type === 'payment_confirmation' && <Download size={14} className="mr-1" />}
                            <span>Type: {subtask.type}</span>
                          </div>
                        )}
                        {subtask.type === 'file_upload' && (
                            <Button variant="outline" size="sm" className="mt-2 text-xs h-7 px-2">
                                <UploadCloud size={14} className="mr-1" /> Upload File
                            </Button>
                        )}
                        {(() => {
                          if (subtask.metadataJson) {
                            try {
                              const metadata = JSON.parse(subtask.metadataJson);
                              if (metadata && typeof metadata.frontendComponent === 'string') {
                                const componentPath = metadata.frontendComponent;
                                const projectId = project?.id;
                                return (
                                  <div className="mt-3 pt-3 border-t border-gray-100 w-full">
                                    <Suspense fallback={<div>Loading component...</div>}>
                                      {componentPath.includes('MaterialManagement.tsx') && projectId !== undefined && (
                                        <MaterialManagement projectId={projectId} />
                                      )}
                                      {componentPath.includes('ModelSelector.tsx') && project && (
                                        <ModelSelector subtask={subtask} project={project} />
                                      )}
                                    </Suspense>
                                  </div>
                                );
                              }
                            } catch (e) {
                              console.error(`Failed to parse subtask metadataJson for subtask "${subtask.name}":`, subtask.metadataJson, e);
                              return <p className="text-xs text-red-500 mt-2">Error loading subtask-specific tool.</p>;
                            }
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                    {userHasPermission(FE_PERMISSIONS.SUBTASKS.DELETE) && !subtask.isTemplateSubtask && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteSubtask(subtask.id)} 
                        className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                        title="Delete this subtask"
                      >
                        <TrashIcon size={16} />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No specific actions or subtasks defined for this step.</p>
          )}

          {userHasPermission(FE_PERMISSIONS.SUBTASKS.CREATE) && (
            <form onSubmit={handleAddSubtask} className="mt-4 flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskName}
                onChange={(e) => setNewSubtaskName(e.target.value)}
                placeholder="New subtask name"
                className="flex-grow p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <Button type="submit" size="sm" className="h-9">
                <PlusCircleIcon size={16} className="mr-1.5" /> Add
              </Button>
            </form>
          )}
          
          {task.name === "Site Visit" && task.metadataJson && (
            (() => {
              try {
                const metadata = JSON.parse(task.metadataJson);
                if (metadata && Array.isArray(metadata.frontendComponents)) {
                  return (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">Task Specific Tools:</h5>
                      <Suspense fallback={<div>Loading tools...</div>}>
                        {metadata.frontendComponents.map((componentPath: string) => {
                          if (componentPath.includes('MaterialManagement.tsx')) {
                            if (project && typeof project.id === 'number') {
                              return <MaterialManagement key="material-management" projectId={project.id} />;
                            }
                            return <p key="mm-loading-error" className="text-xs text-gray-500">Material Management (Project ID missing)</p>;
                          }
                          if (componentPath.includes('ModelSelector.tsx')) {
                            if (project) {
                              return <ModelSelector key="model-selector" subtask={task as any} project={project} />;
                            }
                            return <p key="ms-loading-error" className="text-xs text-gray-500">Model Selector (Project data missing)</p>;
                          }
                          return null;
                        })}
                      </Suspense>
                    </div>
                  );
                }
              } catch (e) {
                console.error("Failed to parse task metadataJson:", e);
                return <p className="text-xs text-red-500 mt-2">Error loading task tools.</p>;
              }
              return null;
            })()
          )}
          {/* Add Subtask Form Removed */}
        </div>
      )}
    </div>
  );
};

export default CollapsibleTaskCard;
