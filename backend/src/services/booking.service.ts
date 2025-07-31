import { logger } from '../config/logger';
import { zohoCrmService } from './zohoCrm.service';
import { googleCalendarService } from './googleCalendar.service';
import { SiteVisitBooking } from '../dtos/siteVisitBooking.dto';
import { PrismaClient } from '@prisma/client';

interface BookingResult {
  success: boolean;
  bookingId: string;
  crmLeadId?: string;
  calendarEventId?: string;
  errors?: string[];
}

export class BookingService {
  private prisma = new PrismaClient();

  async createBooking(bookingData: SiteVisitBooking): Promise<BookingResult> {
    const result: BookingResult = {
      success: false,
      bookingId: '',
      errors: []
    };

    try {
      // Create database record first
      const booking = await this.prisma.booking.create({
        data: {
          firstName: bookingData.firstName,
          lastName: bookingData.lastName,
          email: bookingData.email,
          phone: bookingData.phone,
          address: bookingData.address,
          preferredDateTime: bookingData.visitDate,
          alternateDateTime: bookingData.alternateDate || null,
          projectType: bookingData.requirements,
          source: bookingData.source || 'Website',
          utmParams: bookingData.utmParams,
          status: 'PENDING'
        }
      });
      result.bookingId = booking.id;

      // Sync with Zoho CRM
      const crmLeadId = await this.syncWithCrm(booking);
      if (crmLeadId) result.crmLeadId = crmLeadId;

      // Sync with Google Calendar
      const calendarEventId = await this.syncWithCalendar(booking);
      if (calendarEventId) result.calendarEventId = calendarEventId;

      // Update booking status
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: crmLeadId && calendarEventId ? 'COMPLETED' : 'FAILED'
        }
      });

      result.success = !!crmLeadId && !!calendarEventId;
      return result;
    } catch (error: any) {
      logger.error('Booking creation failed', {
        bookingData,
        error: error.message
      });
      result.errors?.push(error.message);
      return result;
    }
  }

  private async syncWithCrm(booking: any): Promise<string | null> {
    try {
      // Check if lead already exists
      const existingLead = await zohoCrmService.searchLead(
        booking.email,
        booking.phone
      );

      const leadData = {
        firstName: booking.firstName,
        lastName: booking.lastName,
        email: booking.email,
        phone: booking.phone,
        address: {
          street: booking.address.street,
          city: booking.address.city,
          state: booking.address.state,
          pincode: booking.address.pincode
        },
        siteVisitDate: booking.visitDate,
        alternateDate: booking.alternateDate,
        requirements: booking.requirements,
        source: booking.source || 'Website Booking',
        utmParams: booking.utmParams
      };

      const leadId = existingLead
        ? await zohoCrmService.updateLead(existingLead.id, leadData)
        : await zohoCrmService.createLead(leadData);

      // Add booking note to lead
      await zohoCrmService.addNoteToLead(
        leadId,
        `Site visit booked for ${booking.visitDate.toLocaleDateString()}`
      );

      return leadId;
    } catch (error: any) {
      logger.error('CRM sync failed', {
        bookingId: booking.id,
        error: error.message
      });
      return null;
    }
  }

  private async syncWithCalendar(booking: any): Promise<string | null> {
    try {
      const eventData = {
        summary: `Site Visit - ${booking.firstName} ${booking.lastName}`,
        description: `Site visit for ${booking.requirements || 'property viewing'}`,
        location: `${booking.address.street}, ${booking.address.city}, ${booking.address.state} ${booking.address.pincode}`,
        startTime: booking.visitDate,
        duration: 60, // 1 hour duration
        attendeeEmail: booking.email
      };

      return await googleCalendarService.createEvent(eventData);
    } catch (error: any) {
      logger.error('Calendar sync failed', {
        bookingId: booking.id,
        error: error.message
      });
      return null;
    }
  }

  async retryFailedSyncs(bookingId: string): Promise<BookingResult> {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId }
      });
      if (!booking) {
        throw new Error('Booking not found');
      }

      const result: BookingResult = {
        success: false,
        bookingId,
        errors: []
      };

      if (booking.status === 'FAILED') {
        const crmLeadId = await this.syncWithCrm(booking);
        const calendarEventId = await this.syncWithCalendar(booking);
        
        if (crmLeadId && calendarEventId) {
          result.crmLeadId = crmLeadId;
          result.calendarEventId = calendarEventId;
          await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'COMPLETED' }
          });
        } else {
          if (!crmLeadId) result.errors?.push('CRM retry failed');
          if (!calendarEventId) result.errors?.push('Calendar retry failed');
        }
      }

      result.success = !result.errors?.length;
      return result;
    } catch (error: any) {
      logger.error('Retry failed syncs error', {
        bookingId,
        error: error.message
      });
      return {
        success: false,
        bookingId,
        errors: [error.message]
      };
    }
  }
}
