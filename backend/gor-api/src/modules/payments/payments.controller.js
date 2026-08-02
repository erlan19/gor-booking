const { type Request, type Response } = require('express');
const crypto = require('crypto');
const prisma = require('../../lib/prisma');
const midtrans = require('../../lib/midtrans');
const { AppError } = require('../../middlewares/error.middleware');
const { env } = require('../../config/env');
const { emitBookingUpdated } = require('../../sockets/index');

// ── 1. createMidtransTransaction -- POST /api/v1/payments/create ──

export async function createMidtransTransaction(req: Request, res: Response) {
  const { bookingId } = req.body;

  if (!bookingId || typeof bookingId !== 'string') {
    throw new AppError(400, 'bookingId is required');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  if (booking.userId !== req.user!.userId) {
    throw new AppError(403, 'Not your booking');
  }

  if (booking.status !== 'PENDING') {
    throw new AppError(400, 'Booking is not in PENDING status');
  }

  if (!booking.payment) {
    throw new AppError(400, 'No payment record for this booking');
  }

  // Prevent duplicate Snap transactions for the same booking
  if (booking.payment.gatewayRefId) {
    throw new AppError(409, 'Payment transaction already exists for this booking');
  }

  const transaction = await midtrans.createTransaction({
    transaction_details: {
      order_id: booking.id,
      gross_amount: booking.totalPrice,
    },
    customer_details: {
      first_name: req.user!.name,
      email: req.user!.email,
    },
  });

  await prisma.payment.update({
    where: { bookingId: booking.id },
    data: { gatewayRefId: (transaction as any).transaction_id || booking.id },
  });

  await prisma.paymentLog.create({
    data: {
      paymentId: booking.payment.id,
      action: 'created',
      payload: JSON.stringify(transaction),
    },
  });

  res.json({ token: transaction.token, redirectUrl: transaction.redirect_url });
}

// ── 1b. createDummyPayment -- POST /api/v1/payments/dummy (for testing) ──
// Only available when PAYMENT_MODE=dummy

export async function createDummyPayment(req: Request, res: Response) {
  // Check if dummy mode is enabled
  if (env.PAYMENT_MODE !== 'dummy') {
    throw new AppError(403, 'Dummy payment mode not enabled');
  }

  const { bookingId, success = true } = req.body;

  if (!bookingId || typeof bookingId !== 'string') {
    throw new AppError(400, 'bookingId is required');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  if (booking.userId !== req.user!.userId) {
    throw new AppError(403, 'Not your booking');
  }

  if (booking.status !== 'PENDING') {
    throw new AppError(400, 'Booking is not in PENDING status');
  }

  if (!booking.payment) {
    throw new AppError(400, 'No payment record for this booking');
  }

  // Simulate payment processing
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (success) {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: booking.payment!.id },
        data: {
          status: 'SUCCESS',
          method: 'dummy',
          paidAt: new Date(),
          gatewayRefId: `dummy_${Date.now()}`,
          gatewayStatus: 'succeeded',
        },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'PAID' },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: booking.payment!.id },
        data: {
          status: 'FAILED',
          method: 'dummy',
          gatewayRefId: `dummy_${Date.now()}`,
          gatewayStatus: 'failed',
        },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
      }),
    ]);
  }

  const updatedBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (updatedBooking) {
    emitBookingUpdated(updatedBooking, 'updated');
  }

  await prisma.paymentLog.create({
    data: {
      paymentId: booking.payment!.id,
      action: success ? 'dummy_success' : 'dummy_failed',
      payload: JSON.stringify({ success, bookingId, timestamp: new Date().toISOString() }),
      ipAddress: req.ip || null,
    },
  });

  res.json({
    status: 'ok',
    success,
    message: success ? 'Dummy payment succeeded' : 'Dummy payment failed',
    booking: updatedBooking
  });
}

// ── 2. handleWebhook -- POST /api/v1/payments/webhook (public) ──

export async function handleWebhook(req: Request, res: Response) {
  const { order_id, transaction_status, status_code, gross_amount } = req.body;

  if (!order_id) {
    throw new AppError(400, 'order_id is required');
  }

  // Signature verification
  const signatureKey = req.headers['x-midtrans-signature'] as string | undefined;

  // Production mode: always verify signature
  if (env.MIDTRANS_IS_PRODUCTION === true) {
    if (!env.MIDTRANS_SERVER_KEY) {
      throw new AppError(500, 'MIDTRANS_SERVER_KEY not set in production mode');
    }
    const payload = `${order_id}${status_code}${gross_amount}${env.MIDTRANS_SERVER_KEY}`;
    const expectedSignature = crypto.createHash('sha512').update(payload).digest('hex');

    if (!signatureKey || signatureKey !== expectedSignature) {
      throw new AppError(403, 'Invalid signature');
    }
  } else {
    // Test/Sandbox mode: skip verification with warning
    if (!env.MIDTRANS_SERVER_KEY) {
      console.warn('MIDTRANS_SERVER_KEY not set — webhook signature verification skipped (sandbox mode)');
    }
  }

  // Find booking
  const booking = await prisma.booking.findUnique({
    where: { id: order_id },
  });

  // Idempotency: skip if already processed or not in PENDING status
  if (!booking || booking.status !== 'PENDING') {
    res.json({ status: 'ok' });
    return;
  }

  const payment = await prisma.payment.findUnique({
    where: { bookingId: order_id },
  });

  if (!payment) {
    res.json({ status: 'ok' });
    return;
  }

  const isSettled = transaction_status === 'settlement' || transaction_status === 'capture';

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isSettled ? 'SUCCESS' : 'FAILED',
        method: 'gateway',
        gatewayStatus: transaction_status,
        ...(isSettled ? { paidAt: new Date() } : {}),
      },
    }),
    prisma.booking.update({
      where: { id: order_id },
      data: { status: isSettled ? 'PAID' : 'CANCELLED' },
    }),
  ]);

  const updatedBooking = await prisma.booking.findUnique({ where: { id: order_id } });
  if (updatedBooking) {
    emitBookingUpdated(updatedBooking, 'updated');
  }

  await prisma.paymentLog.create({
    data: {
      paymentId: payment.id,
      action: 'callback_webhook',
      payload: JSON.stringify(req.body),
      ipAddress: req.ip || null,
    },
  });

  res.json({ status: 'ok' });
}

// ── 3. confirmCashPayment -- POST /api/v1/payments/confirm ──

export async function confirmCashPayment(req: Request, res: Response) {
  const { bookingId } = req.body;

  if (!bookingId || typeof bookingId !== 'string') {
    throw new AppError(400, 'bookingId is required');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  if (booking.status !== 'PENDING') {
    throw new AppError(400, 'Booking is not in PENDING status');
  }

  if (!booking.payment) {
    throw new AppError(400, 'No payment record for this booking');
  }

  // Idempotency: skip if already confirmed as SUCCESS
  if (booking.payment.status === 'SUCCESS') {
    res.json({ status: 'ok', message: 'Already confirmed' });
    return;
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: booking.payment.id },
      data: {
        status: 'SUCCESS',
        method: 'cash',
        paidAt: new Date(),
      },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'PAID' },
    }),
  ]);

  const updatedBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (updatedBooking) {
    emitBookingUpdated(updatedBooking, 'updated');
  }

  await prisma.paymentLog.create({
    data: {
      paymentId: booking.payment.id,
      action: 'confirmed_cash',
      payload: JSON.stringify({
        confirmedBy: req.user!.userId,
        confirmedAt: new Date().toISOString(),
      }),
      ipAddress: req.ip || null,
    },
  });

  res.json({ status: 'ok', message: 'Cash payment confirmed' });
}
