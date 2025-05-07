"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation'; // To get ID from URL
import { useUser } from '@/context/UserContext';
// import { Breadcrumb } from '@/components/dashboard/breadcrumb'; // Removed for now
import { Button } from '@/components/dashboard/button'; // Assuming you have this
import { PlusCircle, Edit3, Trash2, Eye } from 'lucide-react'; // Icons

interface Task {
  id: number;
  name: string;
  status: { id: number; status: string };
  createdAt: string;
  updatedAt: string;
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
    } else if (!token) {
        setError("Authentication token not found. Please log in.");
        setLoading(false);
    }
  }, [projectId, token]);

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

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* <div className='my-2'>
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Projects', href: '/dashboard' }, { label: project.name }]} />
      </div> */}

      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 mb-8 mt-4"> {/* Added mt-4 for spacing */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 md:mb-0">{project.name}</h1>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm"><Edit3 className="mr-2 h-4 w-4" /> Edit</Button>
            <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
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
            {project.tasks.map((task, index) => (
              <div key={task.id} className="bg-white shadow-lg rounded-lg p-5 relative border-l-4 border-theme-color">
                <span className="absolute -left-[11px] top-1/2 -translate-y-1/2 h-5 w-5 bg-theme-color rounded-full border-4 border-white"></span>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{task.name}</h3>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    task.status?.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    task.status?.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                    task.status?.status === 'Pending' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {task.status?.status || 'N/A'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-1">Created: {formatDate(task.createdAt)}</p>
                <p className="text-sm text-gray-500">Last Updated: {formatDate(task.updatedAt)}</p>
                {/* Add more task details or actions here */}
                 <div className="mt-3 flex space-x-2">
                    <Button variant="outline" size="sm"><Eye className="mr-1 h-3 w-3" /> View</Button>
                    <Button variant="outline" size="sm"><Edit3 className="mr-1 h-3 w-3" /> Update</Button>
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No tasks found for this project.</p>
        )}
      </div>
    </div>
  );
}
