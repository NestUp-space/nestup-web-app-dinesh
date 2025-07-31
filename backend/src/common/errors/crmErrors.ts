export class CrmIntegrationError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'CrmIntegrationError';
  }
}

export class CalendarIntegrationError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'CalendarIntegrationError';
  }
}

export class BookingValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'BookingValidationError';
  }
}
