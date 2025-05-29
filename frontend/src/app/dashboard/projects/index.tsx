import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';

interface Project {
  id: number;
  name: string;
  description?: string; // Made optional to align with potential backend
  // Add other fields if they are returned by GET /api/projects
}

interface User {
  id: number;
  name: string;
  email: string; // Assuming email is available
  // Add other user fields if needed
}

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Form state variables
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectAddress, setNewProjectAddress] = useState('');
  const [newProjectLocation, setNewProjectLocation] = useState('');
  const [newProjectVbCount, setNewProjectVbCount] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedEngineerId, setSelectedEngineerId] = useState<string>('');
  const [selectedDesignerId, setSelectedDesignerId] = useState<string>('');
  const [selectedProjectManagerId, setSelectedProjectManagerId] = useState<string>('');
  const [selectedBimEngineerId, setSelectedBimEngineerId] = useState<string>('');

  const [clientsList, setClientsList] = useState<User[]>([]);
  const [engineersList, setEngineersList] = useState<User[]>([]);
  const [designersList, setDesignersList] = useState<User[]>([]);
  const [projectManagersList, setProjectManagersList] = useState<User[]>([]);
  const [bimEngineersList, setBimEngineersList] = useState<User[]>([]);
  const [formError, setFormError] = useState('');
  const { user } = useUser();

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Authentication token not found.");
        setLoading(false);
        return;
      }
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(response.data.projects || response.data.data?.projects || []); 
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch projects');
      setLoading(false);
    }
  };

  const fetchUsersByRole = async (roleName: string, setter: React.Dispatch<React.SetStateAction<User[]>>) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users?roleName=${roleName}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setter(response.data.data.users || []);
    } catch (err: any) {
      console.error(`Failed to fetch ${roleName}s:`, err.response?.data?.message || err.message);
      setError(prev => `${prev}\nFailed to fetch ${roleName}s.`);
    }
  };

  const handleCreateProject = async () => {
    setFormError('');
    if (!newProjectName.trim()) {
      setFormError('Project name is required.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setFormError("Authentication token not found.");
      return;
    }

    if (!user) {
      setFormError("User information not available. Please log in again.");
      return;
    }

    const projectData = {
      name: newProjectName,
      description: newProjectDescription,
      address: newProjectAddress,
      location: newProjectLocation,
      vbCount: newProjectVbCount ? parseInt(newProjectVbCount, 10) : undefined,
      clientId: selectedClientId ? parseInt(selectedClientId, 10) : undefined,
      engineerId: selectedBimEngineerId ? parseInt(selectedBimEngineerId, 10) : undefined, // Changed to selectedBimEngineerId
      designerId: selectedDesignerId ? parseInt(selectedDesignerId, 10) : undefined,
      projectManagerId: selectedProjectManagerId ? parseInt(selectedProjectManagerId, 10) : undefined,
      createdById: user.id
    };

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`, projectData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Clear form
      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectAddress('');
      setNewProjectLocation('');
      setNewProjectVbCount('');
      setSelectedClientId('');
      setSelectedEngineerId(''); // This remains for the old engineer field if it's still used or for clearing
      setSelectedDesignerId('');
      setSelectedProjectManagerId('');
      setSelectedBimEngineerId('');
      fetchProjects(); // Refresh project list
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create project');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
        fetchProjects();
        fetchUsersByRole('client', setClientsList);
        fetchUsersByRole('engineer', setEngineersList); // This might be deprecated if BIM Engineer replaces general engineer
        fetchUsersByRole('Designer', setDesignersList);
        fetchUsersByRole('Project Manager', setProjectManagersList);
        fetchUsersByRole('BIM Engineer', setBimEngineersList);
    } else {
        setError("Authentication required. Please log in.");
        setLoading(false);
    }
  }, []);

  if (loading) return <p>Loading projects...</p>;
  if (error && !projects.length) return <p style={{whiteSpace: 'pre-line'}}>{error}</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Manage Projects</h1>
      {error && <p style={{ color: 'red', whiteSpace: 'pre-line' }}>{error}</p>}
      
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Create New Project</h2>
        {formError && <p style={{ color: 'red' }}>{formError}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input
            type="text"
            placeholder="Project Name*"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            style={{ padding: '8px', marginBottom: '10px' }}
          />
          <textarea
            placeholder="Project Description"
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            style={{ padding: '8px', marginBottom: '10px', gridColumn: 'span 2' }}
            rows={3}
          />
          <input
            type="text"
            placeholder="Address"
            value={newProjectAddress}
            onChange={(e) => setNewProjectAddress(e.target.value)}
            style={{ padding: '8px', marginBottom: '10px' }}
          />
          <input
            type="text"
            placeholder="Location (Lat, Long)"
            value={newProjectLocation}
            onChange={(e) => setNewProjectLocation(e.target.value)}
            style={{ padding: '8px', marginBottom: '10px' }}
          />
          <div style={{ gridColumn: 'span 2' }}>
            <input
              type="number"
              placeholder="VB Count"
              value={newProjectVbCount}
              onChange={(e) => setNewProjectVbCount(e.target.value)}
              style={{ padding: '8px', marginBottom: '10px', width: '100%' }}
            />
          </div>

          <select 
            value={selectedClientId} 
            onChange={(e) => setSelectedClientId(e.target.value)}
            style={{ padding: '8px', marginBottom: '10px' }}
          >
            <option value="">Select Client</option>
            {clientsList.map(client => (
              <option key={client.id} value={client.id}>{client.name} ({client.email})</option>
            ))}
          </select>

          <select 
            value={selectedEngineerId} 
            onChange={(e) => setSelectedEngineerId(e.target.value)} // This might be the old engineer field or a general one
            style={{ padding: '8px', marginBottom: '10px' }}
          >
            <option value="">Select Site Engineer (Optional)</option> 
            {engineersList.map(engineer => (
              <option key={engineer.id} value={engineer.id}>{engineer.name} ({engineer.email})</option>
            ))}
          </select>

          <select 
            value={selectedDesignerId} 
            onChange={(e) => setSelectedDesignerId(e.target.value)}
            style={{ padding: '8px', marginBottom: '10px' }}
          >
            <option value="">Select Designer</option>
            {designersList.map(designer => (
              <option key={designer.id} value={designer.id}>{designer.name} ({designer.email})</option>
            ))}
          </select>

          <select 
            value={selectedProjectManagerId} 
            onChange={(e) => setSelectedProjectManagerId(e.target.value)}
            style={{ padding: '8px', marginBottom: '10px' }}
          >
            <option value="">Select Project Manager</option>
            {projectManagersList.map(pm => (
              <option key={pm.id} value={pm.id}>{pm.name} ({pm.email})</option>
            ))}
          </select>

          <select 
            value={selectedBimEngineerId} 
            onChange={(e) => setSelectedBimEngineerId(e.target.value)}
            style={{ padding: '8px', marginBottom: '10px' }}
          >
            <option value="">Select BIM Engineer</option>
            {bimEngineersList.map(bim => (
              <option key={bim.id} value={bim.id}>{bim.name} ({bim.email})</option>
            ))}
          </select>
        </div>
        <button 
          onClick={handleCreateProject} 
          style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Create Project
        </button>
      </div>

      <div>
        <h2>Active Projects</h2>
        {projects.length === 0 && !loading && <p>No projects found.</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {projects.map((project) => (
            <li key={project.id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
              <h3>{project.name}</h3>
              <p>{project.description || 'No description available.'}</p>
              <button 
                onClick={() => window.location.href = `/dashboard/projects/${project.id}`}
                style={{ padding: '8px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                View Project Details
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProjectsPage;
