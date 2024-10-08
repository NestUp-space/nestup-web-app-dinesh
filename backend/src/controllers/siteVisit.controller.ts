import { Request, Response } from 'express';
import { createOrUpdateUser, createDraftProject } from '@/services/siteVisit.service';
import { StatusCodes } from 'http-status-codes';

export const bookSiteVisit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, projectName, projectAddress, projectLocation, preferredSlot } = req.body;

    // Create or update user
    const user = await createOrUpdateUser(name, phone);

    // Create draft project
    const project = await createDraftProject(
      user.id,
      projectName,
      projectAddress,
      projectLocation,
      new Date(preferredSlot)
    );

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
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to book site visit',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};