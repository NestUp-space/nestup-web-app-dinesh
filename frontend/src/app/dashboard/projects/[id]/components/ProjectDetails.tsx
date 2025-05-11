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
