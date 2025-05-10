/**
 * Project Details Component
 * Displays detailed information about a project
 */

'use client';

import React, { useState } from 'react'; // Added useState
import { Project, Task, Subtask } from '@/types'; // Updated imports
import useSWR from 'swr'; // Added SWR
import { apiClient } from '@/lib/api/client'; // Added apiClient
import ProjectModelInstanceForm from '@/components/dashboard/project-model-instance/ProjectModelInstanceForm'; // Added form import
import { PlusCircle, ListChecks } from 'lucide-react'; // Added icons
// Assuming a simple modal, otherwise import your modal components
// import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/modal"; // Example for NextUI
// import { Button } from '@/components/ui/button'; // Assuming shadcn button

// Define type for ProjectModelInstance (simplified)
interface GeneratedPlankListDisplay {
  id: string;
  generatedAt: string;
  csvContent: string | null; // Assuming it might be null if only filePath is used
  // filePath: string | null;
}

interface ProjectModelInstanceDisplay {
  id: string;
  modelDefinition: {
    id: string;
    name: string;
  };
  runtimeInputsJson: any;
  createdAt: string;
}

const fetcher = (url: string) => apiClient.get(url).then(res => res.data);

interface ProjectDetailsProps {
  project: Project;
  formatDate: (dateString?: string) => string;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project, 
  formatDate 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { 
    data: projectModelInstances, 
    error: instancesError, 
    mutate: mutateInstances 
  } = useSWR<ProjectModelInstanceDisplay[]>( // Type for SWR data
    project?.id ? `/model-management/project-instances/by-project/${project.id}` : null, 
    fetcher
  );

  // State to manage which instance's generated lists are being viewed
  const [viewingListsForInstance, setViewingListsForInstance] = useState<string | null>(null);

  const { data: generatedLists, error: generatedListsError } = useSWR<GeneratedPlankListDisplay[]>(
    viewingListsForInstance ? `/model-management/project-instances/${viewingListsForInstance}/generated-plank-lists` : null,
    fetcher
  );

  const handleSaveSuccess = (instanceId: string) => {
    mutateInstances(); // Revalidate the list of instances
    setIsModalOpen(false);
  };

  const handleGeneratePlankList = async (instanceId: string) => {
    try {
      const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/model-management/generate/plank-list`, 
        { 
          method: 'POST',
          headers,
          body: JSON.stringify({ projectModelInstanceId: instanceId }),
        }
      );

      if (!response.ok) {
        // Try to parse error message if it's JSON, otherwise use statusText
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // Not a JSON response
        }
        throw new Error(errorData?.message || response.statusText || `HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = `plank_list_${instanceId}.csv`; // Default filename
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (fileNameMatch && fileNameMatch.length === 2)
          fileName = fileNameMatch[1];
      }
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      if(link.parentNode) {
        link.parentNode.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
      alert('Plank list generated and download started!');

    } catch (error: any) {
      console.error("Error generating plank list:", error);
      alert(`Error: ${error.message || 'Failed to generate plank list.'}`);
    }
  };

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

    {/* Section for Model Instances */}
    <div className="mt-8 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Furniture Models in Project</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Furniture Model
        </button>
      </div>

      {instancesError && <p className="text-red-500">Error loading furniture models.</p>}
      {!projectModelInstances && !instancesError && <p>Loading furniture models...</p>}
      {projectModelInstances && projectModelInstances.length === 0 && (
        <p className="text-gray-500">No furniture models added to this project yet.</p>
      )}
      {projectModelInstances && projectModelInstances.length > 0 && (
        <div className="space-y-3">
          {projectModelInstances.map(instance => (
            <React.Fragment key={instance.id}> {/* Use React.Fragment as the root for each mapped item */}
              <div className="p-3 border rounded-md bg-gray-50 flex justify-between items-center">
                <div>
                  <p className="font-medium">{instance.modelDefinition.name}</p>
                  <p className="text-xs text-gray-500">Instance ID: {instance.id}</p>
                  <p className="text-xs text-gray-500">Added: {formatDate(instance.createdAt)}</p>
                  {/* TODO: Display some key runtime inputs or a summary */}
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setViewingListsForInstance(viewingListsForInstance === instance.id ? null : instance.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    title={viewingListsForInstance === instance.id ? "Hide Generated Lists" : "View Generated Lists"}
                  >
                    {viewingListsForInstance === instance.id ? "Hide Lists" : "View Lists"}
                  </button>
                  <button 
                    onClick={() => handleGeneratePlankList(instance.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    title="Generate New Plank List"
                  >
                    <ListChecks className="mr-1.5 h-4 w-4" />
                    Generate New List
                  </button>
                </div>
              </div>
              {viewingListsForInstance === instance.id && (
                <div className="ml-4 mt-0 mb-2 p-3 border-l-2 border-indigo-500 bg-white shadow-sm rounded-r-md space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Generated Plank Lists:</h4>
                  {generatedListsError && <p className="text-xs text-red-500">Error loading generated lists.</p>}
                  {!generatedLists && !generatedListsError && <p className="text-xs text-gray-500">Loading lists...</p>}
                  {generatedLists && generatedLists.length === 0 && <p className="text-xs text-gray-500">No plank lists generated yet for this instance.</p>}
                  {generatedLists && generatedLists.map(list => (
                    <div key={list.id} className="text-xs flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0">
                      <span>Generated: {formatDate(list.generatedAt)} (ID: {list.id.substring(0,8)})</span>
                      {list.csvContent && (
                         <button 
                          onClick={() => {
                            const blob = new Blob([list.csvContent!], { type: 'text/csv;charset=utf-8;' });
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `plank_list_${instance.id}_${list.id.substring(0,8)}.csv`);
                            document.body.appendChild(link);
                            link.click();
                            if(link.parentNode) link.parentNode.removeChild(link);
                            window.URL.revokeObjectURL(url);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Download CSV
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>

    {/* Modal for Adding Project Model Instance */}
    {isModalOpen && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
        <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
          <div className="mt-3 text-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add New Furniture Model to Project</h3>
            <div className="text-left">
              <ProjectModelInstanceForm
                projectId={project.id.toString()} // Ensure projectId is string if API expects string
                onSaveSuccess={handleSaveSuccess}
                onCancel={() => setIsModalOpen(false)}
              />
            </div>
            {/* <div className="items-center px-4 py-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div> */}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default ProjectDetails;
