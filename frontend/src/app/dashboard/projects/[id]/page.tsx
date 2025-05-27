"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import Breadcrumbs from '@/components/dashboard/Breadcrumbs';
import { Project, User, UpdateProjectData, Status } from '@/types';
import { useProject, useUpdateProject } from '@/hooks';
import {
  ProjectHeader,
  ProjectDetails,
  ProjectTasks,
  EditProjectModal
} from './components';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const { user } = useUser();
  
  // State for modals
  const [showEditModal, setShowEditModal] = useState(false);
  
  // State for users lists (for dropdowns)
  const [clientsList, setClientsList] = useState<User[]>([]);
  const [engineersList, setEngineersList] = useState<User[]>([]);
  const [designersList, setDesignersList] = useState<User[]>([]); // New
  const [projectManagersList, setProjectManagersList] = useState<User[]>([]); // New
  const [statusesList, setStatusesList] = useState<Status[]>([]); // New

  // Custom hooks for data fetching and operations
  const { project, loading, error, refetch } = useProject(projectId);
  const { updateProject, loading: isUpdating } = useUpdateProject(projectId);
  
  // Format date helper function
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };
  
  // Fetch users for dropdowns
  useEffect(() => {
    const fetchUsersByRole = async (roleName: string, setter: React.Dispatch<React.SetStateAction<User[]>>) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users?roleName=${roleName}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || `Failed to fetch ${roleName}s`);
        }
        const data = await response.json();
        setter(data.data.users || []);
      } catch (err: any) {
        console.error(`Failed to fetch ${roleName}s:`, err.message);
      }
    };
    
    fetchUsersByRole('client', setClientsList);
    fetchUsersByRole('engineer', setEngineersList);
    fetchUsersByRole('designer', setDesignersList); // New
    fetchUsersByRole('projectManager', setProjectManagersList); // New
  }, []);

  // Fetch project statuses
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/statuses/project`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || `Failed to fetch statuses`);
        }
        const data = await response.json();
        setStatusesList(data.data.statuses || []);
      } catch (err: any) {
        console.error('Failed to fetch statuses:', err.message);
      }
    };
    fetchStatuses();
  }, []);
  
  // Handle project update
  const handleUpdate = async (data: UpdateProjectData) => {
    try {
      await updateProject(data);
      refetch();
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating project:', err);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading project details...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500"><p>Error: {error.message}</p></div>;
  }

  if (!project) {
    return <div className="flex justify-center items-center h-screen"><p>Project not found.</p></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Breadcrumbs />

      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 mb-8 mt-4">
        <ProjectHeader 
          project={project} 
          onEdit={() => setShowEditModal(true)} 
        />
        
        <ProjectDetails 
          project={project} 
          formatDate={formatDate}
          onProjectUpdate={refetch} 
        />
      </div>

      <ProjectTasks 
        tasks={project.tasks} 
        formatDate={formatDate}
        project={project} // Pass the full project object
        onTaskUpdate={refetch} // Pass refetch to handle task updates
      />

      {/* Modals */}
      {showEditModal && (
        <EditProjectModal
          isOpen={showEditModal}
          project={project} 
          clientsList={clientsList} 
          engineersList={engineersList} 
          designersList={designersList} // New
          projectManagersList={projectManagersList} // New
          statusesList={statusesList} // New
          onClose={() => setShowEditModal(false)} 
          onSave={handleUpdate} 
        />
      )}
    </div>
  );
}
