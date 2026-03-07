/**
 * Project Details Component
 * Displays detailed information about a project
 */

'use client';

import React, { useState, useEffect } from 'react'; // Added useEffect
import { Project } from '@/types'; // Updated imports
import useSWR, { mutate } from 'swr'; // Added SWR and mutate
import { apiClient } from '@/lib/api/client'; // Added apiClient
import { usePermissions } from '@/hooks/usePermissions'; // Import usePermissions
import { PERMISSIONS } from '@/constants/permissions'; // Import PERMISSIONS
import { Button } from '@/components/ui/button'; // Import Button
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components
import { PROJECT_STATUS as PROJECT_STATUS_MAP, PROJECT_STATUS_NAMES, PROJECT_STATUS_COLORS } from '@/constants/project'; // Import names and colors

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

const fetcher = (url: string) => apiClient.get(url).then(res => res.data.data); // Adjusted to access nested data property

interface ProjectDetailsProps {
  project: Project;
  formatDate: (dateString?: string) => string;
  onProjectUpdate: () => void; // Callback to refresh project list on parent
}

// Define available statuses for the dropdown
const STATUS_OPTIONS = [
  { id: PROJECT_STATUS_MAP.DRAFT, name: 'Draft' },
  { id: PROJECT_STATUS_MAP.ACTIVE, name: 'Active' },
  { id: PROJECT_STATUS_MAP.ARCHIVED, name: 'Archived' },
  { id: PROJECT_STATUS_MAP.COMPLETED, name: 'Completed' },
];


export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project, 
  formatDate,
  onProjectUpdate
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false); // Kept for potential future use
  const { hasPermission } = usePermissions();
  const [selectedStatusId, setSelectedStatusId] = useState<number | undefined>(project.statusId);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    setSelectedStatusId(project.statusId);
  }, [project.statusId]);
  
  const { 
    data: projectModelInstances, 
    error: instancesError, 
    // mutate: mutateInstances // Mutate will be handled by onProjectUpdate
  } = useSWR<ProjectModelInstanceDisplay[]>( 
    project?.id ? `/api/projects/${project.id}/model-instances` : null, 
    fetcher
  );

  const handleStatusChange = async () => {
    if (!project || selectedStatusId === undefined || selectedStatusId === project.statusId) {
      return;
    }
    setIsUpdatingStatus(true);
    try {
      await apiClient.patch(`/api/projects/${project.id}/status`, { statusId: selectedStatusId });
      // alert('Project status updated successfully!');
      onProjectUpdate(); // Refresh project data on parent
      mutate(`/api/projects/${project.id}`); // Revalidate this specific project's data
    } catch (error: any) {
      console.error('Failed to update project status:', error);
      alert(`Error: ${error.response?.data?.message || error.message || 'Failed to update status'}`);
      // Revert selected status if update fails
      setSelectedStatusId(project.statusId);
    } finally {
      setIsUpdatingStatus(false);
    }
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
            <div className="flex items-center">
              <p className="mr-2"><strong>Status:</strong></p>
              {hasPermission(PERMISSIONS.PROJECTS.CHANGE_STATUS) ? (
                <div className="flex items-center space-x-2">
                  <Select
                    value={selectedStatusId?.toString() || ""}
                    onValueChange={(value) => setSelectedStatusId(parseInt(value, 10))}
                    disabled={isUpdatingStatus}
                  >
                    <SelectTrigger className="h-9 w-[150px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(option => (
                        <SelectItem key={option.id} value={String(option.id)}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleStatusChange} 
                    disabled={isUpdatingStatus || selectedStatusId === project.statusId}
                    size="sm"
                  >
                    {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                  </Button>
                </div>
              ) : (
                <span className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full ${
                  project.status?.status === 'Completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                  project.status?.status === 'Active' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                  project.status?.status === 'Draft' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                  project.status?.status === 'Archived' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                  'bg-lighter-bw text-dark-text-bw border border-light-bw'
                }`}>
                  {project.status?.status || 'N/A'}
                </span>
              )}
            </div>
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
