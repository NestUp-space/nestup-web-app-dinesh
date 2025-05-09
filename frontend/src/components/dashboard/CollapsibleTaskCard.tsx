"use client";

import React, { useState, useEffect, lazy, Suspense } from 'react'; // Added lazy and Suspense
import { Button } from '@/components/dashboard/button';
import { Eye, Edit3, ChevronDown, ChevronUp, CheckCircle, Circle, PlusCircle as PlusCircleIcon, Trash2 as TrashIcon, UploadCloud, Info, UserCheck, Download, Package } from 'lucide-react';
import BimTaskContent from './BimTaskContent';
// Use corrected paths for dynamic import
// import ModelSelector from '@/components/dashboard/ModelSelector'; 
// import MaterialManagement from '@/components/dashboard/MaterialManagement';
import { Task, Subtask, Project } from '@/types';

// Lazy load the components
const MaterialManagement = lazy(() => import('@/components/dashboard/MaterialManagement'));
const ModelSelector = lazy(() => import('@/components/dashboard/ModelSelector'));


interface CollapsibleTaskCardProps {
  task: Task;
  formatDate: (dateString?: string) => string;
  project?: Project; // Changed from projectId to project
  // onUpdateTask: (taskId: number, data: Partial<Task>) => void; // For editing task name/details
  // onDeleteTask: (taskId: number) => void;
}

const CollapsibleTaskCard: React.FC<CollapsibleTaskCardProps> = ({ task, formatDate, project }) => { // Changed projectId to project
  const [isOpen, setIsOpen] = useState(false);
  const [currentSubtasks, setCurrentSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Effect to update subtasks if task prop changes (e.g., parent re-fetches)
  useEffect(() => {
    setCurrentSubtasks(task.subtasks || []);
  }, [task.subtasks]);

  const handleToggleSubtaskCompletion = async (subtaskId: number, currentCompletedStatus: boolean) => {
    if (!token) {
      alert("Authentication token not found.");
      return;
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !currentCompletedStatus }),
      });
      if (response.ok) {
        const updatedSubtask = await response.json();
        setCurrentSubtasks(prevSubtasks =>
          prevSubtasks.map(st => st.id === subtaskId ? { ...st, completed: updatedSubtask.subtask.completed } : st)
        );
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
    if (!newSubtaskName.trim() || !token) {
      alert("Subtask name is required and you must be logged in.");
      return;
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects/tasks/${task.id}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newSubtaskName }),
      });
      if (response.ok) {
        const newSubtaskData = await response.json();
        setCurrentSubtasks(prevSubtasks => [...prevSubtasks, newSubtaskData.subtask]);
        setNewSubtaskName(''); // Clear input
      } else {
        const errorData = await response.json();
        alert(`Error adding subtask: ${errorData.message}`);
      }
    } catch (error) {
      alert(`Failed to add subtask: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const handleDeleteSubtask = async (subtaskId: number) => {
    if (!token) {
      alert("Authentication token not found.");
      return;
    }
    if (!confirm("Are you sure you want to delete this subtask?")) {
        return;
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects/subtasks/${subtaskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setCurrentSubtasks(prevSubtasks => prevSubtasks.filter(st => st.id !== subtaskId));
        alert("Subtask deleted successfully.");
      } else {
        const errorData = await response.json();
        alert(`Error deleting subtask: ${errorData.message}`);
      }
    } catch (error) {
      alert(`Failed to delete subtask: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  return (
    <div className="bg-white shadow-lg rounded-lg p-5 border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <div className="flex-grow">
          {task.stage && <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{task.stage}</p>}
          <h3 className="text-lg font-semibold text-gray-800">{task.name}</h3>
          <div className="flex items-center mt-1">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full mr-2 ${
              task.status?.status === 'Completed' ? 'bg-green-100 text-green-700' :
              task.status?.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
            task.status?.status === 'Pending' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {task.status?.status || 'N/A'}
          </span>
            {task.uploaderRole && <span className="text-xs text-gray-500"> (Initiated by: {task.uploaderRole})</span>}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="ml-auto">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </Button>
      </div>
      <p className="text-sm text-gray-500 mb-1">Created: {formatDate(task.createdAt)}</p>
      <p className="text-sm text-gray-500">Last Updated: {formatDate(task.updatedAt)}</p>
      {/* TODO: Add View/Edit Task buttons if needed */}
      {/* <div className="mt-3 flex space-x-2">
        <Button variant="outline" size="sm"><Eye className="mr-1 h-3 w-3" /> View Details</Button>
        <Button variant="outline" size="sm"><Edit3 className="mr-1 h-3 w-3" /> Update Task</Button>
      </div> */}

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-200">
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
                            {/* Add more icons for other types */}
                            <span>Type: {subtask.type}</span>
                          </div>
                        )}
                        {/* Render UI based on subtask type and name */}
                        {subtask.type === 'file_upload' && (
                            <Button variant="outline" size="sm" className="mt-2 text-xs h-7 px-2">
                                <UploadCloud size={14} className="mr-1" /> Upload File
                            </Button>
                        )}
                        
                        {/* BIM engineer to upload site measurements subtask */}
                        {subtask.name === "BIM engineer to upload site measurements" && project && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            {/* Material Management Component */}
                            <div className="mb-4">
                              <h6 className="text-xs font-semibold text-gray-600 mb-2">Manage Materials for Site Measurements:</h6>
                              <MaterialManagement projectId={project.id} />
                            </div>

                            {/* Box Configuration / Model Selector Component */}
                            <div>
                              <h6 className="text-xs font-semibold text-gray-600 mb-2">Configure Box/Model for Site Measurements:</h6>
                              <ModelSelector subtask={subtask} project={project} />
                            </div>
                          </div>
                        )}

                        {/* Display Materials List for specific subtask */}
                        {subtask.name === "Collection of material details." && project?.materials && (
                           <div className="mt-3 pt-2 border-t border-gray-200">
                             <h5 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                               <Package size={14} className="mr-1.5" /> Project Materials:
                             </h5>
                             {project.materials.length > 0 ? (
                               <ul className="list-disc list-inside space-y-1 text-xs text-gray-500 pl-4">
                                 {project.materials.map(material => (
                                   <li key={material.id}>
                                     {material.name} (ID: {material.id})
                                   </li>
                                 ))}
                               </ul>
                             ) : (
                               <p className="text-xs text-gray-400 italic pl-4">No materials added to this project yet.</p>
                             )}
                           </div>
                         )}
                         {/* Add ModelSelector component for 'Collect Model and dimensions.' subtask */}
                         {subtask.name === "Collect Model and dimensions." && project && (
                           <ModelSelector subtask={subtask} project={project} />
                         )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteSubtask(subtask.id)} className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0">
                      <TrashIcon size={16} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No specific actions or subtasks defined for this step.</p>
          )}

          {/* BIM Task Content */}
          {project?.id && task.name && ( // Use project.id and ensure project exists
            <BimTaskContent
              taskId={task.id}
              projectId={project.id} // Pass project.id
              taskName={task.name}
            />
          )}

          {/* New logic for Site Visit task specific components */}
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
                              // Pass the main task as 'subtask' prop if ModelSelector expects a task-like object.
                              // This casting to 'any' for subtask might hide type issues if ModelSelector strictly expects a Subtask.
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

          {/* The duplicated BIM Task Content block that was here has been removed. */}

          <form onSubmit={handleAddSubtask} className="mt-4 flex items-center space-x-2">
            <input
              type="text"
              value={newSubtaskName}
              onChange={(e) => setNewSubtaskName(e.target.value)}
              placeholder="New subtask name"
              className="flex-grow mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
            <Button type="submit" size="sm" variant="default">
              <PlusCircleIcon size={16} className="mr-1" /> Add
            </Button>
          </form>
          
          
        </div>
      )}
    </div>
  );
};

export default CollapsibleTaskCard;
