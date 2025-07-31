import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError } from '../common/errors/customErrors';
import { siteVisitBookingService, CreateBookingInput } from '../services/siteVisitBooking.service';

export const bookSiteVisit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = req.body;

    // Transform validated data to match service interface
    const bookingData: CreateBookingInput = {
      ...validatedData,
      preferredDateTime: new Date(validatedData.preferredDateTime),
      alternateDateTime: validatedData.alternateDateTime ? new Date(validatedData.alternateDateTime) : undefined
    };

    // Create the booking with integrated CRM and Calendar
    const result = await siteVisitBookingService.createBooking(bookingData);

    // Check if there were any critical errors (booking creation should still succeed even with integration errors)
    const hasErrors = result.errors.length > 0;

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: hasErrors 
        ? 'Site visit booked successfully with some integration warnings'
        : 'Site visit booked successfully',
      bookingId: result.booking.id,
      crmLeadId: result.crmLeadId,
      calendarEventId: result.calendarEventId,
      warnings: hasErrors ? result.errors : undefined
    });
  } catch (error: unknown) {
    console.error('Error booking site visit:', error);
    if (error instanceof BadRequestError) {
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
