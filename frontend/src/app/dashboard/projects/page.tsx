"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/dashboard/tabs';
import { DashboardBreadcrumb } from '@/components/dashboard/dashboardBreadcrumb';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/dashboard/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/dashboard/dialog'; // Import Dialog components
import { Input } from '@/components/dashboard/input';
import { Label } from '@/components/dashboard/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/dashboard/select'; // Import Select components
import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions'; // Import the new hook
import { PERMISSIONS } from '@/constants/permissions'; // Import frontend permissions

// ProjectCard component definition
interface ProjectCardProps {
  project: any;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const router = useRouter();
  
  return (
    <div 
      key={project.id} 
      className="bg-lightest-bw border border-light-bw shadow-md rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={() => router.push(`/dashboard/projects/${project.id}`)}
    >
      <h2 className="text-xl font-semibold text-dark-text-bw mb-2">{project.name}</h2>
      <p className="text-dark-text-bw/80 text-sm mb-3">
        {project.description ? `${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}` : 'No description available.'}
      </p>
      <div className="space-y-1 text-sm text-dark-text-bw/70">
        <p><strong>Designer:</strong> {project.designer?.name || 'N/A'}</p>
        <p><strong>Project Manager:</strong> {project.projectManager?.name || 'N/A'}</p>
        <p><strong>Engineer:</strong> {project.engineer?.name || 'N/A'}</p>
        <p><strong>Tasks:</strong> {project.tasks?.length || 0}</p>
      </div>
      
      <div className="mt-4">
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
          project.status?.status === 'Completed' ? 'bg-green-100 text-green-700 border border-green-200' :
          project.status?.status === 'Active' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
          project.status?.status === 'Draft' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
          project.status?.status === 'Archived' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
          'bg-lighter-bw text-dark-text-bw border border-light-bw' // Default/Unknown status
        }`}>
          {project.status?.status || 'Unknown Status'}
        </span>
      </div>
    </div>
  );
};

export default function ProjectsPage({
  searchParams
}: {
  searchParams: { q: string; offset: string };
}) {
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [projectSqft, setProjectSqft] = useState(0);
  const [projectEstimatedTime, setProjectEstimatedTime] = useState('');
  const [projectStatusId, setProjectStatusId] = useState(1); // Default to status ID 1
  const [designers, setDesigners] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [selectedDesigner, setSelectedDesigner] = useState('');
  const [selectedProjectManager, setSelectedProjectManager] = useState('');
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [projects, setProjects] = useState<any[]>([]); // State for projects
  const { user } = useUser();
  const { hasPermission } = usePermissions(); // Use the hook
  const token = localStorage.getItem('token');
  const router = useRouter(); // Initialize useRouter

  // State for filtered projects by status
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [draftProjects, setDraftProjects] = useState<any[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<any[]>([]);

  const fetchProjects = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects`, {
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
  };

  useEffect(() => {

    const fetchUsersByRole = async (roleName: string) => {
      // Check permission before making the API call
      if (!hasPermission(PERMISSIONS.USERS.VIEW)) {
        console.log(`Missing ${PERMISSIONS.USERS.VIEW} permission to fetch ${roleName} list`);
        return [];
      }

      try {
        console.log(`Fetching users with role: ${roleName}`);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/by-role?roleName=${roleName}`, {
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
        const designersData = await fetchUsersByRole('designer');
        console.log('Designer data before setting state:', designersData);
        setDesigners(designersData);
        
        const projectManagersData = await fetchUsersByRole('project_manager');
        console.log('Project Manager data before setting state:', projectManagersData);
        setProjectManagers(projectManagersData);
        
        const engineersData = await fetchUsersByRole('engineer');
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
  }, [token, hasPermission]); // Add hasPermission to dependency array

  const handleCreateProject = async () => {
    try {
      // Check if user is available
      if (!user) {
        alert("User information not available. Please log in again.");
        return;
      }
      
      // Convert date string to Date object for estimatedTime
      const estimatedTime = projectEstimatedTime ? new Date(projectEstimatedTime) : new Date();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          address: projectAddress,
          location: projectLocation,
          sqft: projectSqft,
          estimatedTime: estimatedTime,
          statusId: projectStatusId,
          vbCount: 0, // Default value
          designerId: selectedDesigner,
          projectManagerId: selectedProjectManager,
          engineerId: selectedEngineer,
          createdById: user.id, // Add the user ID as createdById
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create project');
      }

      // Handle success
      setIsCreateProjectModalOpen(false);
      // Reset form fields
      setProjectName('');
      setProjectDescription('');
      setProjectAddress('');
      setProjectLocation('');
      setProjectSqft(0);
      setProjectEstimatedTime('');
      setSelectedDesigner('');
      setSelectedProjectManager('');
      setSelectedEngineer('');
      
      // Refresh the projects list
      fetchProjects();
      
      alert('Project created successfully!');
    } catch (error) {
      // Handle error
      console.error(error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to create project'}`);
    }
  };

  const search = searchParams.q ?? '';
  const offset = searchParams.offset ?? 0;

  return (
    <Tabs defaultValue="all">
      <DashboardBreadcrumb />
      <div className="flex items-center justify-between my-6">
        <h1 className="text-3xl font-semibold text-dark-text-bw">Projects</h1>
        {user?.role?.role !== 'client' && (
          <Dialog open={isCreateProjectModalOpen} onOpenChange={setIsCreateProjectModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1">
                <PlusCircle className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add Project
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Fill in the details below to create a new project.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="projectName" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="col-span-3"
                    placeholder="Project Name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="projectDescription" className="text-right">
                    Description
                  </Label>
                  <textarea
                    id="projectDescription"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="col-span-3 min-h-[80px] rounded-md border border-light-bw bg-lightest-bw px-3 py-2 text-sm text-dark-text-bw ring-offset-lightest-bw placeholder:text-dark-text-bw/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-color focus-visible:ring-offset-2"
                    placeholder="Project Description"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="projectAddress" className="text-right">
                    Address
                  </Label>
                  <Input
                    id="projectAddress"
                    value={projectAddress}
                    onChange={(e) => setProjectAddress(e.target.value)}
                    className="col-span-3"
                    placeholder="Project Address"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="projectLocation" className="text-right">
                    Location
                  </Label>
                  <Input
                    id="projectLocation"
                    value={projectLocation}
                    onChange={(e) => setProjectLocation(e.target.value)}
                    className="col-span-3"
                    placeholder="Project Location (e.g., City, State)"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="designer" className="text-right">Designer</Label>
                  <Select value={selectedDesigner} onValueChange={setSelectedDesigner}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select Designer" />
                    </SelectTrigger>
                    <SelectContent>
                      {designers && designers.length > 0 ? (
                        designers.map((designer: any) => (
                          <SelectItem key={designer.id} value={designer.id}>{designer.name}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-designers" disabled>No designers available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="projectManager" className="text-right">Project Manager</Label>
                   <Select value={selectedProjectManager} onValueChange={setSelectedProjectManager}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select Project Manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectManagers && projectManagers.length > 0 ? (
                        projectManagers.map((manager: any) => (
                          <SelectItem key={manager.id} value={manager.id}>{manager.name}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-managers" disabled>No project managers available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="engineer" className="text-right">Engineer</Label>
                  <Select value={selectedEngineer} onValueChange={setSelectedEngineer}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select Engineer" />
                    </SelectTrigger>
                    <SelectContent>
                      {engineers && engineers.length > 0 ? (
                        engineers.map((engineer: any) => (
                          <SelectItem key={engineer.id} value={engineer.id}>{engineer.name}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-engineers" disabled>No engineers available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="button" onClick={handleCreateProject}>Create Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <TabsList className="mb-6">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="draft">Draft</TabsTrigger>
        <TabsTrigger value="archived" className="hidden sm:flex">
          Archived
        </TabsTrigger>
      </TabsList>

      {/* All Projects Tab */}
      <TabsContent value="all">
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <p className="text-dark-text-bw/70 text-center py-10">No projects found.</p>
        )}
      </TabsContent>

      {/* Active Projects Tab */}
      <TabsContent value="active">
        {activeProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <p className="text-dark-text-bw/70 text-center py-10">No active projects found.</p>
        )}
      </TabsContent>

      {/* Draft Projects Tab */}
      <TabsContent value="draft">
        {draftProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {draftProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <p className="text-dark-text-bw/70 text-center py-10">No draft projects found.</p>
        )}
      </TabsContent>

      {/* Archived Projects Tab */}
      <TabsContent value="archived">
        {archivedProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {archivedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <p className="text-dark-text-bw/70 text-center py-10">No archived projects found.</p>
        )}
      </TabsContent>
    </Tabs>
  );
}
