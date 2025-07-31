import { PrismaClient, Booking, BookingStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

class BookingRepository {
  async create(data: Prisma.BookingCreateInput): Promise<Booking> {
    return await prisma.booking.create({
      data
    });
  }

  async findById(id: string): Promise<Booking | null> {
    return await prisma.booking.findUnique({
      where: { id }
    });
  }

  async findByEmailAndPhone(email: string, phone: string): Promise<Booking | null> {
    return await prisma.booking.findFirst({
      where: {
        AND: [
          { email: email.toLowerCase() },
          { phone }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findByEmailAndDate(email: string, date: Date): Promise<Booking | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await prisma.booking.findFirst({
      where: {
        email: email.toLowerCase(),
        preferredDateTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          not: BookingStatus.CANCELLED
        }
      }
    });
  }

  async findRecentByEmailAndPhone(email: string, phone: string, days: number): Promise<Booking | null> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await prisma.booking.findFirst({
      where: {
        AND: [
          { email: email.toLowerCase() },
          { phone },
          { createdAt: { gte: cutoffDate } },
          { status: { not: BookingStatus.CANCELLED } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateCrmDetails(id: string, crmLeadId: string): Promise<Booking> {
    return await prisma.booking.update({
      where: { id },
      data: { 
        crmLeadId,
        status: BookingStatus.CRM_SYNCED,
        updatedAt: new Date()
      }
    });
  }

  async updateCalendarDetails(id: string, calendarEventId: string): Promise<Booking> {
    return await prisma.booking.update({
      where: { id },
      data: { 
        calendarEventId,
        updatedAt: new Date()
      }
    });
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    return await prisma.booking.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      }
    });
  }

  async findByStatus(status: BookingStatus): Promise<Booking[]> {
    return await prisma.booking.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findPendingBookings(): Promise<Booking[]> {
    return await prisma.booking.findMany({
      where: {
        status: {
          in: [BookingStatus.PENDING, BookingStatus.FAILED]
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const bookingRepository = new BookingRepository();
