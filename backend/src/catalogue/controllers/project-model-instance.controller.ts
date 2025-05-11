import { Request, Response, NextFunction } from 'express';
import { ProjectModelInstanceService } from '../services/project-model-instance.service'; // Updated import
import { CreateProjectModelInstanceSchema, UpdateProjectModelInstanceSchema } from '../dtos/model.dto'; // Updated DTO import
import { ZodError } from 'zod';
import { StatusCodes } from 'http-status-codes';

const projectModelInstanceService = new ProjectModelInstanceService(); // Updated service instantiation

// Middleware for Zod validation (can be moved to a shared middleware file)
const validateData = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Validation failed',
        errors: error.errors,
      });
    } else {
      next(error); // Pass to global error handler
    }
  }
};

export const createProjectModelInstance = [ // Updated DTO schema
  validateData(CreateProjectModelInstanceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const instance = await projectModelInstanceService.create(req.body);
      res.status(StatusCodes.CREATED).json(instance);
    } catch (error) {
      console.error('Error creating project model instance:', error);
      next(error);
    }
  }
];

export const getAllProjectModelInstancesByProjectId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(projectId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid project ID format.' });
    }
    const instances = await projectModelInstanceService.findAllByProjectId(projectId);
    res.status(StatusCodes.OK).json(instances);
  } catch (error) {
    console.error(`Error fetching project model instances for project ${req.params.projectId}:`, error);
    next(error);
  }
};

export const getProjectModelInstanceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { instanceId } = req.params; // Assuming route param is instanceId
    const instance = await projectModelInstanceService.findById(instanceId);
    if (!instance) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Project Model Instance not found' });
    }
    res.status(StatusCodes.OK).json(instance);
  } catch (error) {
    console.error(`Error fetching project model instance ${req.params.instanceId}:`, error);
    next(error);
  }
};

export const updateProjectModelInstance = [ // Updated DTO schema
  validateData(UpdateProjectModelInstanceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { instanceId } = req.params;
      const updatedInstance = await projectModelInstanceService.update(instanceId, req.body);
      if (!updatedInstance) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Project Model Instance not found' });
      }
      res.status(StatusCodes.OK).json(updatedInstance);
    } catch (error) {
      console.error(`Error updating project model instance ${req.params.instanceId}:`, error);
      next(error);
    }
  }
];

export const deleteProjectModelInstance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { instanceId } = req.params;
    const deletedInstance = await projectModelInstanceService.delete(instanceId);
    if (!deletedInstance) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Project Model Instance not found or already deleted' });
    }
    res.status(StatusCodes.OK).json({ message: 'Project Model Instance deleted successfully', item: deletedInstance });
  } catch (error) {
    console.error(`Error deleting project model instance ${req.params.instanceId}:`, error);
    if ((error as any).code === 'P2025') { // Prisma specific error code for record not found
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Project Model Instance not found' });
    }
    next(error);
  }
};

export const getGeneratedPlankListsForInstance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { instanceId } = req.params;
    const plankLists = await projectModelInstanceService.findGeneratedPlankListsByInstanceId(instanceId);
    res.status(StatusCodes.OK).json(plankLists);
  } catch (error) {
    console.error(`Error fetching generated plank lists for instance ${req.params.instanceId}:`, error);
    next(error);
  }
};
