const { type Request, type Response, type NextFunction } = require('express');

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  // Prisma unique constraint violation → 409 Conflict
  if (err.name === 'PrismaClientKnownRequestError' && (err as any).code === 'P2002') {
    res.status(409).json({ error: 'Resource already exists' });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}

/** Wrap async route handler -- catches rejected promises and forwards to errorHandler */
function wrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
