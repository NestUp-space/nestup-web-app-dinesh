import { Request, Response, NextFunction } from 'express';
import { createOrUpdateUser, createDraftProject } from '@/services/siteVisit.service';
import { StatusCodes } from 'http-status-codes';
import { BookSiteVisitInput } from '@/validations/siteVisit.validation';
import { BadRequestError, NotFoundError } from '../common/errors/customErrors';

export const bookSiteVisit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, phone, projectName, projectAddress, projectLocation, preferredSlot } = req.body as BookSiteVisitInput;

    const user = await createOrUpdateUser(name, phone);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const project = await createDraftProject(
      user.id,
      projectName,
      projectAddress,
      projectLocation,
      new Date(preferredSlot)
    );

    if (!project) {
      throw new BadRequestError('Failed to create draft project');
    }

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Site visit booked successfully',
      user: { name: user.name, phone: user.phoneNumber },
      project: {
        id: project.id,
        name: project.name,
        address: project.address,
        location: project.location,
        preferredSlot: project.estimatedTime
      }
    });
  } catch (error: unknown) {
    console.error('Error booking site visit:', error);
    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to book site visit',
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
    next(error);
  }
};
