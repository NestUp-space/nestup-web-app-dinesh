"use client";

// Tabs, TabsContent, TabsList, TabsTrigger are now in ProjectTabs
// PlusCircle, Button, Dialog components, Input, Label, Select components are now in CreateProjectDialog
import { DashboardBreadcrumb } from '@/components/dashboard/dashboardBreadcrumb';
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions'; // Import the new hook
import { PERMISSIONS } from '@/constants/permissions'; // Import frontend permissions
// ProjectCard is now used by ProjectList, not directly here
// import ProjectCard from '@/components/dashboard/projects/ProjectCard'; 
import CreateProjectDialog from '@/components/dashboard/projects/CreateProjectDialog';
import ProjectTabs from '@/components/dashboard/projects/ProjectTabs';

export default function ProjectsPage({
  searchParams
}: {
  searchParams: { q: string; offset: string };
}) {
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [designers, setDesigners] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [projects, setProjects] = useState<any[]>([]); // State for projects
  const { user } = useUser();
  const { hasPermission } = usePermissions(); // Use the hook
  const token = localStorage.getItem('token');
  const router = useRouter(); // Initialize useRouter

  // State for filtered projects by status
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [draftProjects, setDraftProjects] = useState<any[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<any[]>([]);

  const fetchProjects = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Projects API response:', data);
        const allProjects = data.data?.projects || [];
        setProjects(allProjects);
        
        // Filter projects by status
        setActiveProjects(allProjects.filter((project: any) => project.status?.status === 'Active'));
        setDraftProjects(allProjects.filter((project: any) => project.status?.status === 'Draft'));
        setArchivedProjects(allProjects.filter((project: any) => project.status?.status === 'Archived'));
      } else {
        console.error('Failed to fetch projects:', response.status);
        setProjects([]);
        setActiveProjects([]);
        setDraftProjects([]);
        setArchivedProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
      setActiveProjects([]);
      setDraftProjects([]);
      setArchivedProjects([]);
    }
  }, [token]);

  useEffect(() => {

    const fetchUsersByRole = async (roleName: string) => {
      // Check permission before making the API call
      if (!hasPermission(PERMISSIONS.USERS.VIEW)) {
        console.log(`Missing ${PERMISSIONS.USERS.VIEW} permission to fetch ${roleName} list`);
        return [];
      }

      try {
        console.log(`Fetching users with role: ${roleName}`);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/by-role?roleName=${roleName}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log(`Fetched ${roleName} data:`, data);
          return data.data;
        } else {
          console.error(`Failed to fetch ${roleName}:`, response.status);
          return [];
        }
      } catch (error) {
        console.error(`Error fetching ${roleName}:`, error);
        return [];
      }
    };

    const loadUsersForRoles = async () => {
      // Fetch users for each role only if permission exists
      if (hasPermission(PERMISSIONS.USERS.VIEW)) {
        const designersData = await fetchUsersByRole('Designer');
        console.log('Designer data before setting state:', designersData);
        setDesigners(designersData);
        
        const projectManagersData = await fetchUsersByRole('Project Manager');
        console.log('Project Manager data before setting state:', projectManagersData);
        setProjectManagers(projectManagersData);
        
        const engineersData = await fetchUsersByRole('Site Engineer');
        console.log('Engineer data before setting state:', engineersData);
        setEngineers(engineersData);
      } else {
        // If no permission, set empty arrays and potentially inform the user or adjust UI
        console.log(`User does not have ${PERMISSIONS.USERS.VIEW} permission. Skipping fetching user lists for dropdowns.`);
        setDesigners([]);
        setProjectManagers([]);
        setEngineers([]);
      }
    };

    loadUsersForRoles();
    fetchProjects(); // Fetch projects on component mount
  }, [token, hasPermission, fetchProjects]); // Add fetchProjects and hasPermission

  const search = searchParams.q ?? '';
  const offset = searchParams.offset ?? 0;

  return (
    <>
      <DashboardBreadcrumb />
      <div className="flex items-center justify-between my-6">
        <h1 className="text-3xl font-semibold text-dark-text-bw">Projects</h1>
        {user?.role?.role !== 'client' && hasPermission(PERMISSIONS.PROJECTS.CREATE) && (
          <CreateProjectDialog
            isOpen={isCreateProjectModalOpen}
            onOpenChange={setIsCreateProjectModalOpen}
            onProjectCreateSuccess={fetchProjects}
            token={token}
            designers={designers}
            projectManagers={projectManagers}
            engineers={engineers}
            currentUser={user}
          />
        )}
      </div>
      
      <ProjectTabs
        allProjects={projects}
        activeProjects={activeProjects}
        draftProjects={draftProjects}
        archivedProjects={archivedProjects}
      />
    </>
  );
}
