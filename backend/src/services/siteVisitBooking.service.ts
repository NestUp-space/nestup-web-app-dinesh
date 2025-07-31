import { Booking, BookingStatus, Prisma } from '@prisma/client';
import { bookingRepository } from '../repositories/booking.repository';
import { zohoCrmService } from './zohoCrm.service';
import { googleCalendarService } from './googleCalendar.service';
import { BadRequestError } from '../common/errors/customErrors';
import { logger } from '../config/logger';

export interface CreateBookingInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  preferredDateTime: Date;
  alternateDateTime?: Date;
  requirements?: string;
  source?: string;
  utmParams?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
}

export interface BookingResult {
  booking: Booking;
  crmLeadId: string | null;
  calendarEventId: string | null;
  errors: string[];
}

class SiteVisitBookingService {
  async createBooking(input: CreateBookingInput): Promise<BookingResult> {
    const errors: string[] = [];
    
    try {
      // Step 1: Validate input
      this.validateBookingInput(input);
      
      // Step 2: Check for duplicate bookings
      await this.checkDuplicateBooking(input.email, input.phone, input.preferredDateTime);
      
      // Step 3: Create booking record
      const booking = await this.createBookingRecord(input);
      
      // Step 4: Async CRM and Calendar integration
      let crmLeadId: string | null = null;
      let calendarEventId: string | null = null;
      
      try {
        // CRM Integration
        crmLeadId = await this.integrateCRM(booking);
        if (crmLeadId) {
          await bookingRepository.updateCrmDetails(booking.id, crmLeadId);
        }
      } catch (error: any) {
        logger.error('CRM integration failed', { bookingId: booking.id, error: error.message });
        errors.push('CRM integration failed');
      }
      
      try {
        // Calendar Integration
        calendarEventId = await this.integrateCalendar(booking);
        if (calendarEventId) {
          await bookingRepository.updateCalendarDetails(booking.id, calendarEventId);
        }
      } catch (error: any) {
        logger.error('Calendar integration failed', { bookingId: booking.id, error: error.message });
        errors.push('Calendar integration failed');
      }
      
      // Step 5: Update booking status
      const finalStatus = this.determineFinalStatus(crmLeadId, calendarEventId);
      await bookingRepository.updateStatus(booking.id, finalStatus);
      
      // Step 6: Send notification email (fallback if integrations fail)
      if (errors.length > 0) {
        await this.sendFallbackNotification(booking);
      }
      
      return {
        booking: {
          ...booking,
          status: finalStatus,
          crmLeadId: crmLeadId || null,
          calendarEventId: calendarEventId || null
        },
        crmLeadId: crmLeadId || null,
        calendarEventId: calendarEventId || null,
        errors
      };
      
    } catch (error: any) {
      logger.error('Booking creation failed', { input, error: error.message });
      throw error;
    }
  }
  
  private validateBookingInput(input: CreateBookingInput): void {
    // Validate required fields
    if (!input.firstName?.trim()) throw new BadRequestError('First name is required');
    if (!input.lastName?.trim()) throw new BadRequestError('Last name is required');
    if (!input.email?.trim()) throw new BadRequestError('Email is required');
    if (!input.phone?.trim()) throw new BadRequestError('Phone is required');
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      throw new BadRequestError('Invalid email format');
    }
    
    // Validate Indian phone number
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(input.phone)) {
      throw new BadRequestError('Invalid Indian phone number format');
    }
    
    // Validate address
    if (!input.address?.street?.trim()) throw new BadRequestError('Street address is required');
    if (!input.address?.city?.trim()) throw new BadRequestError('City is required');
    if (!input.address?.state?.trim()) throw new BadRequestError('State is required');
    if (!input.address?.pincode?.trim()) throw new BadRequestError('Pincode is required');
    
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(input.address.pincode)) {
      throw new BadRequestError('Invalid pincode format');
    }
    
    // Validate preferred date (future date, business hours)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    if (input.preferredDateTime <= tomorrow) {
      throw new BadRequestError('Preferred date must be at least 24 hours in the future');
    }
    
    const hours = input.preferredDateTime.getHours();
    if (hours < 8 || hours > 18) {
      throw new BadRequestError('Preferred time must be between 8:00 AM and 6:00 PM');
    }
  }
  
  private async checkDuplicateBooking(email: string, phone: string, preferredDateTime: Date): Promise<void> {
    // Check for duplicate booking on same day
    const sameDay = await bookingRepository.findByEmailAndDate(email, preferredDateTime);
    if (sameDay) {
      throw new BadRequestError('You already have a booking on this date');
    }
    
    // Check for recent booking (within 7 days)
    const recentBooking = await bookingRepository.findRecentByEmailAndPhone(email, phone, 7);
    if (recentBooking) {
      throw new BadRequestError('You have a recent booking. Please contact support for additional bookings');
    }
  }
  
  private async createBookingRecord(input: CreateBookingInput): Promise<Booking> {
    const bookingData: Prisma.BookingCreateInput = {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.toLowerCase().trim(),
      phone: input.phone.trim(),
      address: input.address,
      preferredDateTime: input.preferredDateTime,
      alternateDateTime: input.alternateDateTime,
      requirements: input.requirements?.trim(),
      source: input.source || 'website',
      utmParams: input.utmParams || {},
      status: BookingStatus.PENDING
    };
    
    return await bookingRepository.create(bookingData);
  }
  
  private async integrateCRM(booking: Booking): Promise<string | null> {
    try {
      // Check if lead already exists
      const existingLead = await zohoCrmService.searchLead(booking.email, booking.phone);
      
      if (existingLead) {
        // Update existing lead
        const leadId = await zohoCrmService.updateLead(existingLead.id, {
          firstName: booking.firstName,
          lastName: booking.lastName,
          email: booking.email,
          phone: booking.phone,
          address: booking.address as any,
          siteVisitDate: booking.preferredDateTime,
          requirements: booking.requirements ? booking.requirements : undefined,
          source: booking.source
        });
        
        logger.info('CRM lead updated', { bookingId: booking.id, leadId });
        return leadId;
      } else {
        // Create new lead
        const leadId = await zohoCrmService.createLead({
          firstName: booking.firstName,
          lastName: booking.lastName,
          email: booking.email,
          phone: booking.phone,
          address: booking.address as any,
          siteVisitDate: booking.preferredDateTime,
          alternateDate: booking.alternateDateTime ? booking.alternateDateTime : undefined, // Ensure undefined for optional Date
          requirements: booking.requirements ? booking.requirements : undefined,
          source: booking.source || 'website',
          utmParams: booking.utmParams as any // Cast to any for now, will refine DTOs later
        });
        
        logger.info('CRM lead created', { bookingId: booking.id, leadId });
        return leadId;
      }
    } catch (error: any) {
      logger.error('CRM integration error', { bookingId: booking.id, error: error.message });
      throw error;
    }
  }
  
  private async integrateCalendar(booking: Booking): Promise<string | null> {
    try {
      const eventId = await googleCalendarService.createEvent({
        summary: `Site Visit - ${booking.firstName} ${booking.lastName}`,
        description: this.generateEventDescription(booking),
        location: this.formatAddress(booking.address as any),
        startTime: booking.preferredDateTime,
        duration: 90, // 90 minutes
        attendeeEmail: booking.email
      });
      
      if (!eventId) {
        logger.warn('Calendar event creation failed', { bookingId: booking.id });
        return null;
      }
      
      logger.info('Calendar event created', { bookingId: booking.id, eventId });
      return eventId;
    } catch (error: any) {
      logger.error('Calendar integration error', { bookingId: booking.id, error: error.message });
      throw error;
    }
  }
  
  private generateEventDescription(booking: Booking): string {
    const address = booking.address as any;
    return `
Site Visit Details:
Customer: ${booking.firstName} ${booking.lastName}
Phone: ${booking.phone}
Email: ${booking.email}
Address: ${address.street}, ${address.city}, ${address.state} ${address.pincode}
Requirements: ${booking.requirements || 'None specified'}
Booking ID: ${booking.id}
Source: ${booking.source}
    `.trim();
  }
  
  private formatAddress(address: { street: string; city: string; state: string; pincode: string }): string {
    return `${address.street}, ${address.city}, ${address.state} ${address.pincode}`;
  }
  
  private determineFinalStatus(crmLeadId: string | null, calendarEventId: string | null): BookingStatus {
    if (crmLeadId && calendarEventId) {
      return BookingStatus.CONFIRMED;
    } else if (crmLeadId || calendarEventId) {
      return BookingStatus.CRM_SYNCED; // Partially integrated
    } else {
      return BookingStatus.FAILED;
    }
  }
  
  private async sendFallbackNotification(booking: Booking): Promise<void> {
    // Implementation for fallback email notification
    logger.warn('Fallback notification needed', { bookingId: booking.id });
    
    // TODO: Implement email notification service
    // await emailService.sendBookingNotification(booking);
  }
}

export const siteVisitBookingService = new SiteVisitBookingService();
