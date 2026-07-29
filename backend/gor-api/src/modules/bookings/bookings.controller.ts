import { type Request, type Response } from 'express';
import prisma from '../../lib/prisma.js';
import { AppError } from '../../middlewares/error.middleware.js';
import midtrans from '../../lib/midtrans.js';
import { emitBookingCreated, emitBookingCancelled, emitBookingUpdated } from '../../sockets/index.js';

// ── Helpers ────────────────────────────────────────────────

function isValidTime(t: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(t)) return false;
  const [h, m] = t.split(':').map(Number);
  return h < 24 && m <= 59;
}

function parseMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function normalizeDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00.000Z');
}

// ── 0. listBookings -- GET /api/v1/bookings ──────────────────

export async function listBookings(req: Request, res: Response) {
  const { date } = req.query;

  const where: Record<string, any> = {};
  if (date && typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    where.bookingDate = normalizeDate(date);
  }

  // CLIENT: only own bookings; CASHIER/ADMIN: all
  if (req.user!.role === 'CLIENT') {
    where.userId = req.user!.userId;
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      court: { select: { id: true, name: true, type: true } },
      user: { select: { id: true, name: true } },
      payment: { select: { status: true, method: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ bookings });
}

// ── 1. createBooking -- POST /api/v1/bookings ──────────────

export async function createBooking(req: Request, res: Response) {
  const { courtId, bookingDate, startTime, endTime } = req.body;

  if (!courtId || typeof courtId !== 'string') {
    throw new AppError(400, 'courtId is required');
  }
  if (!bookingDate || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
    throw new AppError(400, 'bookingDate must be YYYY-MM-DD');
  }
  if (!startTime || !isValidTime(startTime)) {
    throw new AppError(400, 'startTime must be HH:mm');
  }
  if (!endTime || !isValidTime(endTime)) {
    throw new AppError(400, 'endTime must be HH:mm');
  }
  if (parseMinutes(endTime) <= parseMinutes(startTime)) {
    throw new AppError(400, 'endTime must be after startTime');
  }

  const date = normalizeDate(bookingDate);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (date < today) {
    throw new AppError(400, 'bookingDate must be today or future');
  }

  const result = await prisma.$transaction(async (tx: any) => {
    const taken = await tx.booking.findFirst({
      where: {
        courtId,
        bookingDate: date,
        startTime,
        status: { not: 'CANCELLED' },
      },
    });
    if (taken) throw new AppError(409, 'Slot already booked');

    const blocked = await tx.scheduleBlocked.findFirst({
      where: { courtId, date, startTime },
    });
    if (blocked) throw new AppError(400, 'Slot is blocked for maintenance');

    const court = await tx.court.findUnique({ where: { id: courtId } });
    if (!court || !court.isActive) throw new AppError(400, 'Court not found or inactive');

    // Calculate duration in hours
    const durationMinutes = parseMinutes(endTime) - parseMinutes(startTime);
    const durationInHours = durationMinutes / 60;
    const totalPrice = court.pricePerHour * durationInHours;

    const booking = await tx.booking.create({
      data: {
        courtId,
        userId: req.user!.userId,
        bookingDate: date,
        startTime,
        endTime,
        totalPrice,
        status: 'PENDING',
        createdBy: 'CLIENT',
        paymentExpiry: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await tx.payment.create({
      data: {
        bookingId: booking.id,
        amount: totalPrice,
        status: 'PENDING',
      },
    });

    return booking;
  });

  // Create Midtrans snap transaction for gateway payment
  let snapToken: string | null = null;
  let redirectUrl: string | null = null;

  try {
    const transaction = await midtrans.createTransaction({
      transaction_details: {
        order_id: result.id,
        gross_amount: result.totalPrice,
      },
      customer_details: {
        first_name: req.user!.name,
        email: req.user!.email,
      },
    });
    snapToken = transaction.token;
    redirectUrl = transaction.redirect_url;

    await prisma.payment.update({
      where: { bookingId: result.id },
      data: { gatewayRefId: result.id },
    });
  } catch (err) {
    console.error('Midtrans snap creation failed:', err);
  }

  res.status(201).json({
    booking: result,
    payment: { token: snapToken, redirectUrl, status: 'PENDING' },
  });

  // Emit socket event for real-time updates
  emitBookingCreated(result);
}

// ── 2. createBookingWalkin -- POST /api/v1/bookings/walkin ─

export async function createBookingWalkin(req: Request, res: Response) {
  const { courtId, startTime, endTime, customerName, customerPhone, paymentMethod } = req.body;

  if (!courtId || typeof courtId !== 'string') {
    throw new AppError(400, 'courtId is required');
  }
  if (!customerName || typeof customerName !== 'string') {
    throw new AppError(400, 'customerName is required for walk-in');
  }
  if (!startTime || !isValidTime(startTime)) {
    throw new AppError(400, 'startTime must be HH:mm');
  }
  if (!endTime || !isValidTime(endTime)) {
    throw new AppError(400, 'endTime must be HH:mm');
  }
  if (parseMinutes(endTime) <= parseMinutes(startTime)) {
    throw new AppError(400, 'endTime must be after startTime');
  }

  const method = paymentMethod === 'qris' ? 'qris' : 'cash';
  const today = new Date().toISOString().slice(0, 10);
  const date = normalizeDate(today);

  let result: any;
  try {
    result = await prisma.$transaction(async (tx: any) => {
      const court = await tx.court.findUnique({ where: { id: courtId } });
      if (!court || !court.isActive) throw new AppError(400, 'Court not found or inactive');

      const isCash = method === 'cash';
      const durationMinutes = parseMinutes(endTime) - parseMinutes(startTime);
      const durationInHours = durationMinutes / 60;
      const totalPrice = court.pricePerHour * durationInHours;

      const booking = await tx.booking.create({
        data: {
          courtId,
          cashierId: req.user!.userId,
          customerName,
          customerPhone: customerPhone || null,
          bookingDate: date,
          startTime,
          endTime,
          totalPrice,
          status: isCash ? 'PAID' : 'PENDING',
          createdBy: 'CASHIER',
          paymentExpiry: isCash ? null : new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: totalPrice,
          method,
          status: isCash ? 'SUCCESS' : 'PENDING',
          paidAt: isCash ? new Date() : null,
        },
      });

      return booking;
    });
  } catch (err: any) {
    if (err.code === 'P2002') {
      throw new AppError(409, 'Slot already booked');
    }
    throw err;
  }

  // QRIS: generate Midtrans snap
  let snapToken: string | null = null;
  let redirectUrl: string | null = null;

  if (method === 'qris') {
    try {
      const transaction = await midtrans.createTransaction({
        transaction_details: {
          order_id: result.id,
          gross_amount: result.totalPrice,
        },
        customer_details: {
          first_name: customerName,
          phone: customerPhone,
        },
      });
      snapToken = transaction.token;
      redirectUrl = transaction.redirect_url;

      await prisma.payment.update({
        where: { bookingId: result.id },
        data: { gatewayRefId: result.id },
      });
    } catch (err) {
      console.error('Midtrans snap creation failed for QRIS:', err);
    }
  }

  res.status(201).json({
    booking: result,
    payment: method === 'qris' ? { token: snapToken, redirectUrl, status: 'PENDING' } : { status: 'SUCCESS', method: 'cash' },
  });

  // Emit socket event for real-time updates
  emitBookingCreated(result);
}

// ── 3. listMyBookings -- GET /api/v1/bookings/me ───────────

export async function listMyBookings(req: Request, res: Response) {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user!.userId },
    include: {
      court: { select: { name: true, type: true } },
      payment: { select: { status: true, method: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ bookings });
}

// ── 4. getBooking -- GET /api/v1/bookings/:id ──────────────

export async function getBooking(req: Request, res: Response) {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { court: true, payment: true },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  // Client: only own bookings. Cashier: any.
  if (req.user!.role === 'CLIENT' && booking.userId !== req.user!.userId) {
    throw new AppError(403, 'Not your booking');
  }

  res.json(booking);
}

// ── 5. cancelBooking -- PATCH /api/v1/bookings/:id/cancel ──

export async function cancelBooking(req: Request, res: Response) {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  // Client: only own bookings
  if (req.user!.role === 'CLIENT' && booking.userId !== req.user!.userId) {
    throw new AppError(403, 'Not your booking');
  }

  if (booking.status !== 'PENDING' && booking.status !== 'PAID') {
    throw new AppError(400, 'Cannot cancel booking in this status');
  }

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    }),
    prisma.payment.updateMany({
      where: { bookingId: booking.id },
      data: { status: 'FAILED' },
    }),
  ]);

  res.json({ message: 'Booking cancelled' });

  // Emit socket event for real-time updates
  emitBookingCancelled(booking);
}

// ── 6. rescheduleBooking -- PATCH /api/v1/bookings/:id/reschedule

export async function rescheduleBooking(req: Request, res: Response) {
  const { bookingDate, startTime, endTime } = req.body;

  if (!bookingDate || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
    throw new AppError(400, 'bookingDate must be YYYY-MM-DD');
  }
  if (!startTime || !isValidTime(startTime)) {
    throw new AppError(400, 'startTime must be HH:mm');
  }
  if (!endTime || !isValidTime(endTime)) {
    throw new AppError(400, 'endTime must be HH:mm');
  }
  if (parseMinutes(endTime) <= parseMinutes(startTime)) {
    throw new AppError(400, 'endTime must be after startTime');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  // Client only
  if (booking.userId !== req.user!.userId) {
    throw new AppError(403, 'Not your booking');
  }

  if (booking.status !== 'PENDING' && booking.status !== 'PAID') {
    throw new AppError(400, 'Cannot reschedule booking in this status');
  }

  const newDate = normalizeDate(bookingDate);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (newDate < today) {
    throw new AppError(400, 'bookingDate must be today or future');
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Check clash at new slot (exclude current booking)
    const clash = await tx.booking.findFirst({
      where: {
        courtId: booking.courtId,
        bookingDate: newDate,
        startTime,
        status: { not: 'CANCELLED' },
        id: { not: booking.id },
      },
    });
    if (clash) throw new AppError(409, 'New slot already booked');

    const blocked = await tx.scheduleBlocked.findFirst({
      where: { courtId: booking.courtId, date: newDate, startTime },
    });
    if (blocked) throw new AppError(400, 'New slot is blocked for maintenance');

    return tx.booking.update({
      where: { id: req.params.id },
      data: {
        bookingDate: newDate,
        startTime,
        endTime,
      },
    });
  });

  res.json(updated);
}
