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
  updateTaskStatusService,
  // Subtask services
  createSubtaskService,
  getSubtasksByTaskIdService,
  updateSubtaskService,
  deleteSubtaskService
} from '../services/project.service';


// Extend Request type to include user
// Assuming role might be a simple string or an object.
// For service compatibility, we'll ensure role.name is passed.
interface AuthenticatedRequest extends Request {
  user?: { id: number; role: string | { name: string; /* other role props */ } };
}

export const createProject = async (req: AuthenticatedRequest, res: Response) => {
  console.log('Entering createProject controller with body:', JSON.stringify(req.body, null, 2));
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
    
    // Convert IDs to integers and handle NaN values
    const parsedEngineerId = parseInt(engineerId, 10);
    const finalEngineerId = !isNaN(parsedEngineerId) ? parsedEngineerId : null;

    const parsedClientId = parseInt(clientId, 10);
    const finalClientId = !isNaN(parsedClientId) ? parsedClientId : null;
    
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
      engineerId: finalEngineerId,
      clientId: finalClientId,
      createdById
    });

    // Note: Task and subtask creation is now handled in createProjectService

    res.status(StatusCodes.CREATED).json({ project, message: 'Project created with tasks and subtasks from template' });
  } catch (error) {
    const err = error as Error;
    console.error('Error in createProject controller:', err); // Also log it on the backend
    res.status(StatusCodes.BAD_REQUEST).json({ 
      message: err.message, 
      name: err.name, 
      stack: err.stack, 
      details: JSON.stringify(err, Object.getOwnPropertyNames(err)) // Attempt to serialize more details
    });
  }
};

export const getProjects = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
    }

    // Prepare user object for service layer
    // The service expects role: { name: string }
    const serviceUser = {
      id: req.user.id,
      role: { 
        name: typeof req.user.role === 'string' ? req.user.role : req.user.role.name 
      }
    };

    const projects = await getProjectsService(serviceUser);
    
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

    // Prepare user object for service layer
    const serviceUser = {
      id: req.user.id,
      role: { 
        name: typeof req.user.role === 'string' ? req.user.role : req.user.role.name 
      }
    };

    const project = await getProjectByIdService(projectId, serviceUser);

    if (!project) {
      // Service layer now handles permission checks and returns null if not found or not permitted
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Project not found or access denied' });
    }
    
    // Transform client data for consistency
    const clientData = project.client.length > 0 ? project.client[0].client : null;
    const transformedProject = {
      ...project,
      client: clientData,
    };

    // Optional: Add authorization check here if needed (e.g., client can only see their own projects)

    console.log('Backend controller getProjectById, project data being sent:', JSON.stringify(transformedProject, null, 2));
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
    res.status(StatusCodes.OK).json({ message: 'Task status updated successfully' });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
  }
};

// Subtask Controllers

export const createSubtask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // TODO: Add permission checks if necessary (e.g., only project members can add subtasks)
    const taskId = parseInt(req.params.taskId, 10);
    const { name, description } = req.body;

    if (isNaN(taskId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid task ID.' });
    }
    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Subtask name is required.' });
    }

    const subtask = await createSubtaskService(taskId, { name, description });
    res.status(StatusCodes.CREATED).json({ subtask, message: 'Subtask created successfully.' });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
  }
};

export const getSubtasksForTask = async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.taskId, 10);
    if (isNaN(taskId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid task ID.' });
    }

    const subtasks = await getSubtasksByTaskIdService(taskId);
    res.status(StatusCodes.OK).json({ subtasks });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
  }
};

export const updateSubtask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // TODO: Add permission checks
    const subtaskId = parseInt(req.params.subtaskId, 10);
    const { name, description, completed } = req.body;

    if (isNaN(subtaskId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid subtask ID.' });
    }

    // Ensure at least one updatable field is provided
    if (name === undefined && description === undefined && completed === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'No update data provided.' });
    }

    const subtask = await updateSubtaskService(subtaskId, { name, description, completed });
    res.status(StatusCodes.OK).json({ subtask, message: 'Subtask updated successfully.' });
  } catch (error) {
    // Handle specific error from service (e.g., parent task completion blocked)
    if ((error as Error).message.includes('Cannot mark task as completed')) {
        return res.status(StatusCodes.CONFLICT).json({ message: (error as Error).message });
    }
    res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
  }
};

export const deleteSubtask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // TODO: Add permission checks
    const subtaskId = parseInt(req.params.subtaskId, 10);
    if (isNaN(subtaskId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid subtask ID.' });
    }

    await deleteSubtaskService(subtaskId);
    res.status(StatusCodes.OK).json({ message: 'Subtask deleted successfully.' });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
  }
};
