const { Server } = require('socket.io');

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    path: '/ws',
    cors: { origin: ['http://localhost:5173', 'http://localhost:5174'], methods: ['GET', 'POST'], credentials: true },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('subscribe:user', (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on('subscribe:admin', () => {
      socket.join('admin');
    });

    socket.on('subscribe:court', (courtId: string) => {
      socket.join(`court:${courtId}`);
    });

    socket.on('unsubscribe:court', (courtId: string) => {
      socket.leave(`court:${courtId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

function toDateStr(d: unknown): string {
  return d instanceof Date
    ? d.toISOString().slice(0, 10)
    : String(d).slice(0, 10);
}

function emitToBookingRooms(event: string, booking: any, extra: Record<string, unknown> = {}) {
  const date = toDateStr(booking.bookingDate);
  const payload = { booking, date, ...extra };

  getIO().to('admin').emit(event, payload);
  if (booking.userId) {
    getIO().to(`user:${booking.userId}`).emit(event, payload);
  }
  if (booking.courtId) {
    getIO().to(`court:${booking.courtId}`).emit(event, payload);
  }
}

// Emit functions (called from controllers)
function emitBookingUpdated(booking: any, action: string) {
  emitToBookingRooms('booking:updated', booking, { action });
}

function emitBookingCreated(booking: any) {
  emitToBookingRooms('booking:created', booking);
}

function emitBookingCancelled(booking: any) {
  emitToBookingRooms('booking:cancelled', booking);
}
