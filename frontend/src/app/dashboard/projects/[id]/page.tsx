"use client";

import React, { useEffect, useState, FormEvent } from 'react'; // Added FormEvent
import { useParams, useRouter } from 'next/navigation'; // To get ID from URL, Added useRouter
import { useUser } from '@/context/UserContext';
import Breadcrumbs from '@/components/dashboard/Breadcrumbs'; // Added Breadcrumbs
import CollapsibleTaskCard from '@/components/dashboard/CollapsibleTaskCard'; // Import CollapsibleTaskCard
import { Button } from '@/components/dashboard/button'; // Assuming you have this
import { PlusCircle, Edit3, Trash2, Eye, ChevronDown, ChevronUp, CheckCircle, Circle } from 'lucide-react'; // Icons, added CheckCircle, Circle, Chevrons

interface Subtask {
  id: number;
  name: string;
  description?: string;
  actionRequired?: string; // New
  type?: string;           // New
  metadataJson?: string;   // New
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  taskId: number;
}

interface Task {
  id: number;
  name: string;
  stage?: string;          // New
  uploaderRole?: string;   // New
  viewerRoles?: string;    // New (comma-separated string or JSON string)
  status: { id: number; status: string };
  createdAt: string;
  updatedAt: string;
  subtasks?: Subtask[]; 
  // Add other task fields if necessary
}

interface ProjectDetails {
  id: number;
  name: string;
  description?: string;
  address?: string;
  location?: string;
  sqft?: number;
  status?: { id: number; status: string };
  client?: { id: number; name: string; email: string };
  engineer?: { id: number; name: string; email: string };
  estimatedTime?: string;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
  // Add other project fields if necessary
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string; // Get project ID from URL
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const router = useRouter(); // Added router
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProjectData, setEditingProjectData] = useState<Partial<ProjectDetails & { clientId?: number; engineerId?: number }>>({}); // Added clientId and engineerId for edit form state

  const [clientsList, setClientsList] = useState<User[]>([]); // User interface should be defined or imported
  const [engineersList, setEngineersList] = useState<User[]>([]);


  // Define User interface if not already globally available
  // interface User { id: number; name: string; email: string; }


  const handleEditInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> // Added HTMLSelectElement
  ) => {
    const { name, value } = event.target;
    setEditingProjectData(prev => {
      const newEditingData = { ...prev, [name]: value };
      if (name === 'sqft') {
        newEditingData.sqft = value === '' ? undefined : parseFloat(value);
      }
      // For dropdowns, value is already string ID, will be parsed to int on submit
      if (name === 'clientId' || name === 'engineerId') {
        newEditingData[name] = value ? parseInt(value, 10) : undefined;
      }
      return newEditingData;
    });
  };

  const handleEditSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !project) { // editingProjectData.id might not be set if it's a new field
      setError("Authentication token or project data is missing.");
      return;
    }

    if (!editingProjectData.name?.trim()) {
      setError("Project name cannot be empty.");
      return;
    }
    
    // Construct payload carefully, ensuring IDs are numbers
    const payload: any = {
      name: editingProjectData.name,
      description: editingProjectData.description,
      address: editingProjectData.address,
      location: editingProjectData.location,
      sqft: editingProjectData.sqft, // Already number or undefined
      // estimatedTime: editingProjectData.estimatedTime, // Ensure this is formatted correctly if editable
      clientId: editingProjectData.clientId ? Number(editingProjectData.clientId) : undefined,
      engineerId: editingProjectData.engineerId ? Number(editingProjectData.engineerId) : undefined,
    };
    
    // Remove undefined fields to avoid sending them
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);


    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedProjectResponse = await response.json();
        // The backend might return the full project object or just a success message.
        // Assuming it returns the updated project in updatedProjectResponse.project
        setProject(updatedProjectResponse.project); 
        alert('Project updated successfully!');
        setShowEditModal(false);
      } else {
        const errData = await response.json();
        setError(errData.message || `Failed to update project (status: ${response.status})`);
        alert(`Error: ${errData.message || 'Failed to update project'}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during update';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    }
  };
  
  const fetchUsersByRole = async (roleName: string, setter: React.Dispatch<React.SetStateAction<User[]>>) => {
    // Define User type locally if not imported, ensure it matches what API returns
    // interface User { id: number; name: string; email: string; } 
    try {
      const currentToken = localStorage.getItem("token"); // Use currentToken to avoid stale closure issues
      if (!currentToken) throw new Error("No token found");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users?roleName=${roleName}`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to fetch ${roleName}s`);
      }
      const data = await response.json();
      setter(data.data.users || []);
    } catch (err: any) {
      console.error(`Failed to fetch ${roleName}s:`, err.message);
      // Avoid overwriting main page error with dropdown fetch errors unless critical
      // setError(prev => `${prev}\nFailed to fetch ${roleName}s.`); 
    }
  };

  useEffect(() => {
    if (projectId && token) {
      const fetchProjectDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects/${projectId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setProject(data.project);
          } else {
            const errData = await response.json();
            setError(errData.message || `Failed to fetch project details (status: ${response.status})`);
            setProject(null);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
          setProject(null);
        } finally {
          setLoading(false);
        }
      };
      fetchProjectDetails();
      // Fetch users for dropdowns
      fetchUsersByRole('client', setClientsList);
      fetchUsersByRole('engineer', setEngineersList);
    } else if (!token) {
        setError("Authentication token not found. Please log in.");
        setLoading(false);
    }
  }, [projectId, token]); // Rerun if projectId or token changes

  // Define User interface if it's not defined globally or imported
  interface User { id: number; name: string; email: string; }


  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading project details...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500"><p>Error: {error}</p></div>;
  }

  if (!project) {
    return <div className="flex justify-center items-center h-screen"><p>Project not found.</p></div>;
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    if (!project || !token) return;
    // setShowDeleteConfirm(false); // Close confirm modal first
    // setLoading(true); // Optional: show loading state

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects/${project.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Redirect to projects list or show success message
        // For now, let's log and potentially set an error/success state
        console.log('Project deleted successfully');
        alert('Project deleted successfully!'); // Placeholder
        router.push('/dashboard/projects'); // Redirect after successful deletion
        setProject(null); // Clear project data
      } else {
        const errData = await response.json();
        setError(errData.message || `Failed to delete project (status: ${response.status})`);
        alert(`Error: ${errData.message || 'Failed to delete project'}`); // Placeholder
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during deletion';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`); // Placeholder
    } finally {
      // setLoading(false); // Optional: hide loading state
      setShowDeleteConfirm(false);
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-6">
      <Breadcrumbs /> {/* Added Breadcrumbs component */}

      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 mb-8 mt-4"> {/* Added mt-4 for spacing */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 md:mb-0">{project.name}</h1>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => {
              // Initialize with current project data, including existing client/engineer IDs
              setEditingProjectData({ 
                ...project, 
                clientId: project.client?.id, 
                engineerId: project.engineer?.id 
              });
              setShowEditModal(true);
            }}>
              <Edit3 className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Project Details</h2>
            <p className="text-gray-600 mb-2"><strong>Description:</strong> {project.description || 'N/A'}</p>
            <p className="text-gray-600 mb-2"><strong>Address:</strong> {project.address || 'N/A'}</p>
            <p className="text-gray-600 mb-2"><strong>Location:</strong> {project.location || 'N/A'}</p>
            <p className="text-gray-600 mb-2"><strong>Sq. Footage:</strong> {project.sqft || 'N/A'} sqft</p>
            <p className="text-gray-600 mb-2"><strong>Status:</strong> 
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
            <p className="text-gray-600 mb-2"><strong>Client:</strong> {project.client?.name || 'N/A'} ({project.client?.email || 'N/A'})</p>
            <p className="text-gray-600 mb-2"><strong>Engineer:</strong> {project.engineer?.name || 'N/A'} ({project.engineer?.email || 'N/A'})</p>
            <p className="text-gray-600 mb-2"><strong>Estimated Completion:</strong> {formatDate(project.estimatedTime)}</p>
            <p className="text-gray-600 mb-2"><strong>Created At:</strong> {formatDate(project.createdAt)}</p>
            <p className="text-gray-600 mb-2"><strong>Last Updated:</strong> {formatDate(project.updatedAt)}</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">Project Timeline & Tasks</h2>
          
        </div>
        {project.tasks && project.tasks.length > 0 ? (
          <div className="space-y-6">
            {project.tasks.map((task) => (
              <CollapsibleTaskCard key={task.id} task={task} formatDate={formatDate} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No tasks found for this project.</p>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && project && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete the project "{project.name}"? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* TODO: Add Edit Modal Here */}
      {showEditModal && project && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Project</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    value={editingProjectData.name || ''}
                    onChange={e => handleEditInputChange(e)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    id="edit-description"
                    name="description"
                    rows={3}
                    value={editingProjectData.description || ''}
                    onChange={e => handleEditInputChange(e)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    id="edit-address"
                    name="address"
                    value={editingProjectData.address || ''}
                    onChange={e => handleEditInputChange(e)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
                 <div>
                  <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700 mb-1">Location (Lat, Long)</label>
                  <input
                    type="text"
                    id="edit-location"
                    name="location"
                    value={editingProjectData.location || ''}
                    onChange={e => handleEditInputChange(e)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-sqft" className="block text-sm font-medium text-gray-700 mb-1">Square Footage</label>
                  <input
                    type="number"
                    id="edit-sqft"
                    name="sqft"
                    value={editingProjectData.sqft === undefined ? '' : editingProjectData.sqft} // Handle undefined for number input
                    onChange={e => handleEditInputChange(e)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
                {/* Client Dropdown */}
                <div>
                  <label htmlFor="edit-client" className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  <select
                    id="edit-client"
                    name="clientId"
                    value={editingProjectData.clientId || ''}
                    onChange={handleEditInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  >
                    <option value="">Select Client</option>
                    {clientsList.map(client => (
                      <option key={client.id} value={client.id}>{client.name} ({client.email})</option>
                    ))}
                  </select>
                </div>
                {/* Engineer Dropdown */}
                <div>
                  <label htmlFor="edit-engineer" className="block text-sm font-medium text-gray-700 mb-1">Engineer</label>
                  <select
                    id="edit-engineer"
                    name="engineerId"
                    value={editingProjectData.engineerId || ''}
                    onChange={handleEditInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  >
                    <option value="">Select Engineer</option>
                    {engineersList.map(engineer => (
                      <option key={engineer.id} value={engineer.id}>{engineer.name} ({engineer.email})</option>
                    ))}
                  </select>
                </div>
                {/* TODO: Add estimatedTime if it needs to be editable */}
              </div>
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                <Button type="submit" variant="default">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
