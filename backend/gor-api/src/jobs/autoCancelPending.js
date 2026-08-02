const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { AppError } = require('../middlewares/error.middleware');

function startAutoCancelJob() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      console.log('Auto-cancel job running...');
      const now = new Date();
      console.log('Searching for expired pending bookings...');

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
          console.log(`Failing payments for ${cancelledIds.length} cancelled bookings...`);
          const paymentResult = await prisma.payment.updateMany({
            where: { bookingId: { in: cancelledIds.map((b) => b.id) }, status: 'PENDING' },
            data: { status: 'FAILED' },
          });
          console.log(`Failed ${paymentResult.count} payment(s)`);
        }
      } else {
        console.log('No expired pending bookings found');
      }
    } catch (err) {
      console.error('Auto-cancel job error:', err);
      // Don't crash the cron job on database errors
      if (err instanceof AppError) {
        console.error(`AppError: ${err.statusCode} - ${err.message}`);
      }
    }
  });

  console.log('Auto-cancel pending bookings job started');
}
