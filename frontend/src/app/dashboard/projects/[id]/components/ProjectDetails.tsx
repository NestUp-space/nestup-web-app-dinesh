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
// import { PlusCircle } from 'lucide-react'; // PlusCircle will be removed if the modal is removed too.
// Assuming a simple modal, otherwise import your modal components
// import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/modal"; // Example for NextUI
// import { Button } from '@/components/ui/button'; // Assuming shadcn button - this was already commented out

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

  // Removed viewingListsForInstance state and generatedLists SWR hook

  const handleSaveSuccess = (instanceId: string) => {
    mutateInstances(); // Revalidate the list of instances
    setIsModalOpen(false);
  };

  // Removed handleGenerateInstancePlankList and handleGenerateAggregatedPlankList functions

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

    {/* The "Furniture Models / Boxes" section and its related modal for adding an instance are removed. */}
    {/* If a general "Add Model" or similar functionality is desired elsewhere, it would need a new UI trigger. */}
    {/* The modal for viewing generated lists is also removed as it was tied to the removed section. */}
    </>
  );
};

export default ProjectDetails;
