import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Project {
  id: number;
  name: string;
  description: string;
}

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data.projects);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch projects');
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      await axios.post('/api/projects', {
        name: newProjectName,
        description: newProjectDescription,
      });
      setNewProjectName('');
      setNewProjectDescription('');
      fetchProjects();
    } catch (err) {
      setError('Failed to create project');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) return <p>Loading projects...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Manage Projects</h1>
      <div>
        <h2>Create New Project</h2>
        <input
          type="text"
          placeholder="Project Name"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
        />
        <textarea
          placeholder="Project Description"
          value={newProjectDescription}
          onChange={(e) => setNewProjectDescription(e.target.value)}
        />
        <button onClick={handleCreateProject}>Create Project</button>
      </div>
      <div>
        <h2>Active Projects</h2>
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <button onClick={() => window.location.href = `/dashboard/projects/${project.id}/tasks`}>
                Manage Tasks
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProjectsPage;
