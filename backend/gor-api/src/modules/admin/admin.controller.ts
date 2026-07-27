import { type Request, type Response } from 'express';
import prisma from '../../lib/prisma.js';
import { AppError } from '../../middlewares/error.middleware.js';

export async function getAllBookings(req: Request, res: Response) {
  const status = req.query.status as string | undefined;
  const date = req.query.date as string | undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Number(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (date) {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);
    where.bookingDate = { gte: start, lte: end };
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        court: { select: { name: true, type: true } },
        user: { select: { name: true, email: true, phone: true } },
        cashier: { select: { name: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  res.json({
    bookings,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getReport(req: Request, res: Response) {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

  if (!startDate || !endDate) {
    throw new AppError(400, 'startDate and endDate are required');
  }
  if (startDate > endDate) {
    throw new AppError(400, 'startDate must be before or equal to endDate');
  }

  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999);

  const bookings = await prisma.booking.findMany({
    where: {
      bookingDate: { gte: start, lte: end },
      status: { not: 'CANCELLED' },
    },
    include: { payment: true },
  });

  const totalRevenue = bookings.reduce((sum, b) => {
    if (b.payment?.status === 'SUCCESS') {
      return sum + b.totalPrice;
    }
    return sum;
  }, 0);

  res.json({
    totalRevenue,
    bookingCount: bookings.length,
    startDate,
    endDate,
    payments: bookings,
  });
}
