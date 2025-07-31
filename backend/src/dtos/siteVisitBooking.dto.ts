export interface SiteVisitBooking {
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
  visitDate: Date;
  alternateDate?: Date;
  requirements?: string;
  source: string;
  utmParams?: Record<string, string>;
}

export interface BookingResult {
  success: boolean;
  bookingId: string;
  crmLeadId?: string;
  calendarEventId?: string;
  errors?: string[];
}

export interface CrmLeadData {
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
  siteVisitDate: Date;
  alternateDate?: Date;
  requirements?: string;
  source: string;
  utmParams?: Record<string, string>;
}

export interface CalendarEventData {
  summary: string;
  description: string;
  location: string;
  startTime: Date;
  duration: number; // in minutes
  attendeeEmail: string;
}
