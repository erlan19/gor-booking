import cron from 'node-cron';
import prisma from '../lib/prisma.js';

export function startAutoCancelJob() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const result = await prisma.booking.updateMany({
        where: {
          status: 'PENDING',
          paymentExpiry: { lte: now },
          createdBy: 'CLIENT',
        },
        data: { status: 'CANCELLED' },
      });

      if (result.count > 0) {
        console.log(`Auto-cancelled ${result.count} expired booking(s)`);
        // Fail related PENDING payments (updateMany doesn't support relation filters)
        const cancelledIds = await prisma.booking.findMany({
          where: { status: 'CANCELLED', createdBy: 'CLIENT', paymentExpiry: { lte: now } },
          select: { id: true },
        });
        if (cancelledIds.length > 0) {
          await prisma.payment.updateMany({
            where: { bookingId: { in: cancelledIds.map((b) => b.id) }, status: 'PENDING' },
            data: { status: 'FAILED' },
          });
        }
      }
    } catch (err) {
      console.error('Auto-cancel job error:', err);
    }
  });

  console.log('Auto-cancel pending bookings job started');
}
