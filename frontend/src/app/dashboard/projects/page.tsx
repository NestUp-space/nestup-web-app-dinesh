"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/dashboard/tabs';
// import { Breadcrumb } from '@/components/dashboard/breadcrumb'; // Old primitive, replaced by DashboardBreadcrumb
import { DashboardBreadcrumb } from '@/components/dashboard/dashboardBreadcrumb'; // Import DashboardBreadcrumb
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/dashboard/button';
import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation'; // Import useRouter

export default function ProjectsPage({ // Renamed from ProductsPage to ProjectsPage for clarity
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
  const [clients, setClients] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [projects, setProjects] = useState<any[]>([]); // State for projects
  const { user } = useUser();
  const token = localStorage.getItem('token');
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
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
          setProjects(data.projects || []);
        } else {
          console.error('Failed to fetch projects:', response.status);
          setProjects([]);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      }
    };

    const fetchUsersByRole = async (roleName: string) => {
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

    const loadClientsAndEngineers = async () => {
      // Use lowercase role names as they were working before
      const clientsData = await fetchUsersByRole('client');
      console.log('Client data before setting state:', clientsData);
      setClients(clientsData);
      const engineersData = await fetchUsersByRole('engineer');
      console.log('Engineer data before setting state:', engineersData);
      setEngineers(engineersData);
    };

    loadClientsAndEngineers();
    fetchProjects(); // Fetch projects on component mount
  }, [token]);

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
          clientId: selectedClient,
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
      setSelectedClient('');
      setSelectedEngineer('');
      
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
      <DashboardBreadcrumb /> {/* Add breadcrumb here */}
      {/* The old Breadcrumb component was likely a placeholder or the primitives, 
          DashboardBreadcrumb is the auto-generating one. 
          If the old one was specifically styled and placed, adjust DashboardBreadcrumb placement or styling as needed.
          For now, placing it at the top.
      */}
      <div className="flex items-center justify-between my-4"> {/* Added my-4 for spacing */}
        <h1 className="text-2xl font-semibold">Projects</h1>
        {user?.role?.role !== 'client' && (
          <Button size="sm" className="h-8 gap-1" onClick={() => setIsCreateProjectModalOpen(true)}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add Project
            </span>
          </Button>
        )}
      </div>
      
      <TabsList className="mb-4">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="draft">Draft</TabsTrigger>
        <TabsTrigger value="archived" className="hidden sm:flex">
          Archived
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="bg-white shadow-lg rounded-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{project.name}</h2>
                <p className="text-gray-600 text-sm mb-1">
                  {project.description ? `${project.description.substring(0, 100)}...` : 'No description available.'}
                </p>
                <p className="text-gray-600 text-sm mb-1">
                  <strong>Client:</strong> {project.client?.name || 'N/A'}
                </p>
                <p className="text-gray-600 text-sm mb-1">
                  <strong>Engineer:</strong> {project.engineer?.name || 'N/A'}
                </p>
                <div className="mt-3">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    project.status?.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    project.status?.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                    project.status?.status === 'Pending' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status?.status || 'Unknown Status'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No projects found.</p>
        )}
      </TabsContent>

      {isCreateProjectModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Project</h3>
              <div className="mt-2">
                <label htmlFor="projectName" className="block text-gray-700 text-sm font-bold mb-2">Project Name</label>
                <input
                  type="text"
                  id="projectName"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:shadow-outline"
                  placeholder="Project Name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <div className="mt-2">
                <label htmlFor="projectDescription" className="block text-gray-700 text-sm font-bold mb-2">Project Description</label>
                <textarea
                  id="projectDescription"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:shadow-outline"
                  placeholder="Project Description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                />
              </div>
              <div className="mt-2">
                <label htmlFor="projectAddress" className="block text-gray-700 text-sm font-bold mb-2">Project Address</label>
                <input
                  type="text"
                  id="projectAddress"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:shadow-outline"
                  placeholder="Project Address"
                  value={projectAddress}
                  onChange={(e) => setProjectAddress(e.target.value)}
                />
              </div>
              <div className="mt-2">
                <label htmlFor="projectLocation" className="block text-gray-700 text-sm font-bold mb-2">Project Location</label>
                <input
                  type="text"
                  id="projectLocation"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:shadow-outline"
                  placeholder="Project Location"
                  value={projectLocation}
                  onChange={(e) => setProjectLocation(e.target.value)}
                />
              </div>
              <div className="mt-2">
                <label htmlFor="client" className="block text-gray-700 text-sm font-bold mb-2">Client</label>
                <select
                  id="client"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:shadow-outline"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                >
                  <option value="">Select Client</option>
                  {clients && clients.length > 0 ? (
                    clients.map((client: any) => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))
                  ) : (
                    <option value="" disabled>No clients available</option>
                  )}
                </select>
                <div className="text-xs text-left mt-1 text-gray-500">
                  {clients && clients.length > 0 ? `${clients.length} clients available` : 'No clients available'}
                </div>
              </div>
              <div className="mt-2">
                <label htmlFor="engineer" className="block text-gray-700 text-sm font-bold mb-2">Engineer</label>
                <select
                  id="engineer"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:shadow-outline"
                  value={selectedEngineer}
                  onChange={(e) => setSelectedEngineer(e.target.value)}
                >
                  <option value="">Select Engineer</option>
                  {engineers && engineers.length > 0 ? (
                    engineers.map((engineer: any) => (
                      <option key={engineer.id} value={engineer.id}>{engineer.name}</option>
                    ))
                  ) : (
                    <option value="" disabled>No engineers available</option>
                  )}
                </select>
                <div className="text-xs text-left mt-1 text-gray-500">
                  {engineers && engineers.length > 0 ? `${engineers.length} engineers available` : 'No engineers available'}
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <Button
                  onClick={handleCreateProject}
                  className="transition-all px-4 py-2 bg-theme-color text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-dark-color focus:outline-none focus:ring-2 focus:ring-green-300"
                >
                  Create Project
                </Button>
                <Button
                  onClick={() => setIsCreateProjectModalOpen(false)}
                  className="transition-all mt-2 px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Tabs>
  );
}
