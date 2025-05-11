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
    project?.id ? `/catalogue/project-instances/by-project/${project.id}` : null, 
    fetcher
  );

  // State to manage which instance's generated lists are being viewed
  const [viewingListsForInstance, setViewingListsForInstance] = useState<string | null>(null);

  const { data: generatedLists, error: generatedListsError } = useSWR<GeneratedPlankListDisplay[]>(
    viewingListsForInstance ? `/catalogue/project-instances/${viewingListsForInstance}/generated-plank-lists` : null,
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
        `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/catalogue/generate/plank-list`, 
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
      {/* Section to display and manage Project Model Instances (Boxes) */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Furniture Models / Boxes</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <PlusCircle size={18} className="mr-2" />
            Add New Model
          </button>
        </div>

        {instancesError && <p className="text-red-500">Error loading furniture models.</p>}
        {!projectModelInstances && !instancesError && <p>Loading furniture models...</p>}
        
        {projectModelInstances && projectModelInstances.length === 0 && (
          <p className="text-gray-500">No furniture models added to this project yet.</p>
        )}

        {projectModelInstances && projectModelInstances.length > 0 && (
          <div className="space-y-4">
            {projectModelInstances.map(instance => (
              <div key={instance.id} className="p-4 border rounded-md shadow-sm bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">{instance.modelDefinition.name}</h3>
                    <p className="text-sm text-gray-500">Added on: {formatDate(instance.createdAt)}</p>
                    {/* Optionally display some runtime inputs */}
                    {/* <pre className="text-xs mt-1 bg-gray-100 p-2 rounded">
                      {JSON.stringify(instance.runtimeInputsJson, null, 2)}
                    </pre> */}
                  </div>
                  <button
                    onClick={() => handleGeneratePlankList(instance.id)}
                    className="flex items-center px-3 py-1.5 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                  >
                    <ListChecks size={16} className="mr-1.5" />
                    Generate Plank List
                  </button>
                </div>
                {/* TODO: Could add section here to display previously generated lists for this instance using 'viewingListsForInstance' and 'generatedLists' SWR data */}
              </div>
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
