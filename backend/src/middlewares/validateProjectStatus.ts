import { Request, Response, NextFunction } from 'express';
import { PROJECT_STATUS, PROJECT_STATUS_TRANSITIONS } from '../constants/project';
import prisma from '../config/db';
import { handleServiceResponse } from '../common/utils/httpHandlers';
import { ServiceResponse } from '../common/models/serviceResponse';
import { StatusCodes } from 'http-status-codes';

export const validateProjectStatusTransition = async (req: Request, res: Response, next: NextFunction) => {
  const projectId = parseInt(req.params.id, 10);
  const { statusId: newStatusId } = req.body;

  if (isNaN(projectId)) {
    const serviceResponse = ServiceResponse.failure('Invalid project ID.', null, StatusCodes.BAD_REQUEST);
    return handleServiceResponse(serviceResponse, res);
  }

  if (newStatusId === undefined || typeof newStatusId !== 'number') {
    const serviceResponse = ServiceResponse.failure('New status ID is required and must be a number.', null, StatusCodes.BAD_REQUEST);
    return handleServiceResponse(serviceResponse, res);
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { statusId: true },
    });

    if (!project) {
      const serviceResponse = ServiceResponse.failure('Project not found.', null, StatusCodes.NOT_FOUND);
      return handleServiceResponse(serviceResponse, res);
    }

    const currentStatusId = project.statusId;

    if (currentStatusId === null || currentStatusId === undefined) { // Explicit null/undefined check
      const serviceResponse = ServiceResponse.failure('Current project status ID is missing.', null, StatusCodes.INTERNAL_SERVER_ERROR);
      return handleServiceResponse(serviceResponse, res);
    }
    
    // Ensure currentStatusId is a valid key for PROJECT_STATUS_TRANSITIONS
    if (!(currentStatusId in PROJECT_STATUS_TRANSITIONS)) {
        const serviceResponse = ServiceResponse.failure('Invalid current project status.', null, StatusCodes.BAD_REQUEST);
        return handleServiceResponse(serviceResponse, res);
    }
    const allowedTransitions = PROJECT_STATUS_TRANSITIONS[currentStatusId as keyof typeof PROJECT_STATUS_TRANSITIONS];


    if (!allowedTransitions || !allowedTransitions.includes(newStatusId)) {
      const currentStatusName = Object.keys(PROJECT_STATUS).find(key => PROJECT_STATUS[key as keyof typeof PROJECT_STATUS] === currentStatusId);
      const newStatusName = Object.keys(PROJECT_STATUS).find(key => PROJECT_STATUS[key as keyof typeof PROJECT_STATUS] === newStatusId);
      const message = `Cannot transition project from ${currentStatusName || 'Unknown'} to ${newStatusName || 'Unknown'}.`;
      const serviceResponse = ServiceResponse.failure(message, null, StatusCodes.BAD_REQUEST);
      return handleServiceResponse(serviceResponse, res);
    }

    // Additional business logic based on roles can be added here if needed
    // For example, only Project Manager or Admin can move to ACTIVE or ARCHIVE.
    // This is partially handled by permission middleware, but fine-grained checks can be here.

    next();
    return; // Explicitly return void
  } catch (error) {
    console.error('Error validating project status transition:', error);
    const serviceResponse = ServiceResponse.failure('Error validating project status transition.', null, StatusCodes.INTERNAL_SERVER_ERROR);
    return handleServiceResponse(serviceResponse, res);
  }
};
