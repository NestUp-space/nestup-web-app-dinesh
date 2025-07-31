import { google, calendar_v3 } from 'googleapis';
import { logger } from '../config/logger';

interface CreateEventData {
  summary: string;
  description: string;
  location: string;
  startTime: Date;
  duration: number; // in minutes
  attendeeEmail: string;
}

class GoogleCalendarService {
  private calendar: calendar_v3.Calendar;

  constructor() {
    // Service Account authentication
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    this.calendar = google.calendar({ version: 'v3', auth });
  }

  async createEvent(data: CreateEventData): Promise<string> {
    try {
      const endTime = new Date(data.startTime.getTime() + data.duration * 60000);

      const event: calendar_v3.Schema$Event = {
        summary: data.summary,
        description: data.description,
        location: data.location,
        start: {
          dateTime: data.startTime.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        attendees: [
          { email: data.attendeeEmail },
          { email: process.env.GOOGLE_CALENDAR_DEFAULT_ATTENDEE || 'admin@nestup.space' }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours
            { method: 'email', minutes: 2 * 60 },  // 2 hours
            { method: 'popup', minutes: 30 },      // 30 minutes
          ],
        },
        guestsCanModify: false,
        guestsCanInviteOthers: false,
        guestsCanSeeOtherGuests: false,
      };

      const response = await this.calendar.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        requestBody: event,
        sendUpdates: 'all', // Send email invitations
      });

      if (response.data.id) {
        logger.info('Google Calendar event created successfully', { 
          eventId: response.data.id,
          summary: data.summary 
        });
        return response.data.id;
      } else {
        throw new Error('Failed to create calendar event: No event ID returned');
      }
    } catch (error: any) {
      logger.error('Google Calendar event creation failed', { 
        data, 
        error: error.message 
      });
      throw error;
    }
  }

  async updateEvent(eventId: string, data: Partial<CreateEventData>): Promise<void> {
    try {
      const updateData: calendar_v3.Schema$Event = {};

      if (data.summary) updateData.summary = data.summary;
      if (data.description) updateData.description = data.description;
      if (data.location) updateData.location = data.location;
      
      if (data.startTime && data.duration) {
        const endTime = new Date(data.startTime.getTime() + data.duration * 60000);
        updateData.start = {
          dateTime: data.startTime.toISOString(),
          timeZone: 'Asia/Kolkata',
        };
        updateData.end = {
          dateTime: endTime.toISOString(),
          timeZone: 'Asia/Kolkata',
        };
      }

      await this.calendar.events.update({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        eventId,
        requestBody: updateData,
        sendUpdates: 'all',
      });

      logger.info('Google Calendar event updated successfully', { eventId });
    } catch (error: any) {
      logger.error('Google Calendar event update failed', { 
        eventId, 
        data, 
        error: error.message 
      });
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        eventId,
        sendUpdates: 'all',
      });

      logger.info('Google Calendar event deleted successfully', { eventId });
    } catch (error: any) {
      logger.error('Google Calendar event deletion failed', { 
        eventId, 
        error: error.message 
      });
      throw error;
    }
  }

  async getEvent(eventId: string): Promise<calendar_v3.Schema$Event | null> {
    try {
      const response = await this.calendar.events.get({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        eventId,
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      logger.error('Google Calendar event retrieval failed', { 
        eventId, 
        error: error.message 
      });
      throw error;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
