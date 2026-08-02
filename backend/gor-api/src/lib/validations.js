const { z } = require('zod');

const createBookingSchema = z.object({
  courtId: z.string().min(1),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm'),
  customerName: z.string().min(1).max(100).optional(),
  customerPhone: z.string().regex(/^\+?[\d\s-]{10,15}$/).optional(),
  notes: z.string().max(500).optional(),
});

const createWalkinBookingSchema = z.object({
  courtId: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm'),
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().regex(/^\+?[\d\s-]{10,15}$/).optional(),
  paymentMethod: z.enum(['cash', 'qris']).default('cash'),
  notes: z.string().max(500).optional(),
});

const rescheduleBookingSchema = z.object({
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm'),
});
