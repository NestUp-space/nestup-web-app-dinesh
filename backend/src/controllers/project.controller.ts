import { Request, Response } from 'express';
import { createProjectService, getProjectsService, updateTaskStatusService } from '../services/project.service';

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: { id: number };
}

export const createProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const project = await createProjectService(req.body);
    res.status(201).json({ project });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getProjects = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const projects = await getProjectsService(req.user.id);  // Use req.user.id
    res.status(200).json({ projects });
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
