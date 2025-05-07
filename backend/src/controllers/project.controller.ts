import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { 
  createProjectService, 
  getProjectsService, 
  getProjectByIdService, // Import new service
  updateProjectService, 
  deleteProjectService, 
  createTaskService, 
  getTasksService, 
  updateTaskService, 
  deleteTaskService, 
  updateTaskStatusService 
} from '../services/project.service';
import taskTemplate from '../constants/taskTemplate.json';

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: { id: number; role: string };
}

export const createProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
    }

    if (req.user.role === 'client') {
      return res.status(StatusCodes.FORBIDDEN).json({ message: 'Client users are not allowed to create projects' });
    }

    // Extract values from request body
    const { name, projectDescription, description, engineerId, clientId } = req.body;
    
    // Use projectDescription or description (whichever is provided)
    const projectDesc = projectDescription || description;
    
    // Set default values for required fields that might be missing from frontend
    const address = req.body.address || 'N/A';
    const location = req.body.location || 'N/A';
    
    // Convert numeric values to integers
    const sqft = parseInt(req.body.sqft, 10) || 0;
    const estimatedTime = req.body.estimatedTime || new Date();
    const statusId = parseInt(req.body.statusId, 10) || 1; // Assuming 1 is a valid status ID
    const vbCount = parseInt(req.body.vbCount, 10) || 0;
    
    // Convert IDs to integers
    const engineerIdInt = parseInt(engineerId, 10);
    const clientIdInt = parseInt(clientId, 10);
    
    // Get the user ID for createdById and updatedById
    const createdById = req.user.id;

    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Project name is required' });
    }

    const project = await createProjectService({
      name,
      description: projectDesc || null,
      address: address || 'N/A',
      location: location || 'N/A',
      sqft: sqft || 0,
      estimatedTime: estimatedTime || new Date(),
      vbCount: vbCount || 0,
      statusId: statusId || 1,
      engineerId: engineerIdInt || null,
      clientId: clientIdInt || null,
      createdById
    });

    // Add tasks from the template to the project
    for (const task of taskTemplate) {
      await createTaskService(project.id, task);
    }

    res.status(StatusCodes.CREATED).json({ project, message: 'Project created with tasks from template' });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
  }
};

export const getProjects = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const userRole = req.user.role; // Assuming role is like 'client', 'admin', 'engineer'

    let projects;

    if (userRole === 'client') {
      // Updated logic: Fetch projects where the user is mapped as a client
      // This requires the getProjectsService to handle this specific filtering
      // For now, the service uses createdById if userId is passed.
      // This part might need further refinement in getProjectsService if client-specific view is different.
      projects = await getProjectsService(userId); 
    } else {
      // For admin, engineer, etc., fetch all projects or based on other criteria
      projects = await getProjectsService(); // Fetches all projects
    }
    
    // Transform the client data to be directly accessible
    const transformedProjects = projects.map(project => {
      const clientData = project.client.length > 0 ? project.client[0].client : null;
      return {
        ...project,
        client: clientData, // Replace the array with the direct client object or null
      };
    });

    res.status(StatusCodes.OK).json({ projects: transformedProjects });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
  }
};

export const getProjectById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
    }
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(projectId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid project ID' });
    }

    const project = await getProjectByIdService(projectId);

    if (!project) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Project not found' });
    }
    
    // Transform client data for consistency
    const clientData = project.client.length > 0 ? project.client[0].client : null;
    const transformedProject = {
      ...project,
      client: clientData,
    };

    // Optional: Add authorization check here if needed (e.g., client can only see their own projects)

    res.status(StatusCodes.OK).json({ project: transformedProject });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const project = await updateProjectService(Number(req.params.projectId), req.body);
    res.status(200).json({ project });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    await deleteProjectService(Number(req.params.projectId));
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const task = await createTaskService(Number(req.params.projectId), req.body);
    res.status(201).json({ task });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await getTasksService(Number(req.params.projectId));
    res.status(200).json({ tasks });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const task = await updateTaskService(Number(req.params.taskId), req.body);
    res.status(200).json({ task });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    await deleteTaskService(Number(req.params.taskId));
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    await updateTaskStatusService(Number(req.params.taskId), req.body.status);  // Ensure taskId is a number
    res.status(200).json({ message: 'Task status updated successfully' });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
