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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6 bg-lightest-bw border border-light-bw rounded-lg shadow-sm">
        <div>
          <h2 className="text-2xl font-semibold text-dark-text-bw mb-4">Project Details</h2>
          <div className="space-y-2 text-sm text-dark-text-bw/80">
            <p><strong>Description:</strong> {project.description || 'N/A'}</p>
            <p><strong>Address:</strong> {project.address || 'N/A'}</p>
            <p><strong>Location:</strong> {project.location || 'N/A'}</p>
            <p><strong>Sq. Footage:</strong> {project.sqft || 'N/A'} sqft</p>
            <p>
              <strong>Status:</strong> 
              <span className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full ${
                project.status?.status === 'Completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                project.status?.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                project.status?.status === 'Pending' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                'bg-lighter-bw text-dark-text-bw border border-light-bw'
              }`}>
                {project.status?.status || 'N/A'}
              </span>
            </p>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-dark-text-bw mb-4">Key Information</h2>
          <div className="space-y-2 text-sm text-dark-text-bw/80">
            <p><strong>Designer:</strong> {project.designer?.name || 'N/A'} ({project.designer?.email || 'N/A'})</p>
            <p><strong>Project Manager:</strong> {project.projectManager?.name || 'N/A'} ({project.projectManager?.email || 'N/A'})</p>
            <p><strong>Engineer:</strong> {project.engineer?.name || 'N/A'} ({project.engineer?.email || 'N/A'})</p>
            <p><strong>Estimated Completion:</strong> {formatDate(project.estimatedTime)}</p>
            <p><strong>Created At:</strong> {formatDate(project.createdAt)}</p>
            <p><strong>Last Updated:</strong> {formatDate(project.updatedAt)}</p>
          </div>
        </div>
      </div>
      {/* Sections for "Furniture Models / Boxes" and modals have been removed as per previous commit. */}
    </div>
  );
};

export default ProjectDetails;
