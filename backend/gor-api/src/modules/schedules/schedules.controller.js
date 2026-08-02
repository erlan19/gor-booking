const { type Request, type Response } = require('express');
const prisma = require('../../lib/prisma');
const { AppError } = require('../../middlewares/error.middleware');

function normalizeDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00.000Z');
}

// ── blockSlot -- POST /api/v1/schedules/block ──────────────

export async function blockSlot(req: Request, res: Response) {
  const { courtId, date, startTime, endTime, reason } = req.body;

  if (!courtId || typeof courtId !== 'string') {
    throw new AppError(400, 'courtId is required');
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new AppError(400, 'date must be YYYY-MM-DD');
  }
  if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) {
    throw new AppError(400, 'startTime must be HH:mm');
  }
  if (!endTime || !/^\d{2}:\d{2}$/.test(endTime)) {
    throw new AppError(400, 'endTime must be HH:mm');
  }
  if (endTime <= startTime) {
    throw new AppError(400, 'endTime must be after startTime');
  }

  const normalizedDate = normalizeDate(date);

  // Verify court exists and is active
  const court = await prisma.court.findUnique({ where: { id: courtId } });
  if (!court || !court.isActive) {
    throw new AppError(400, 'Court not found or inactive');
  }

  // Check for overlapping blocked slot (time range overlap, not just exact startTime match)
  const existing = await prisma.scheduleBlocked.findFirst({
    where: {
      courtId,
      date: normalizedDate,
      AND: [
        { startTime: { lt: endTime } },
        { endTime: { gt: startTime } },
      ],
    },
  });
  if (existing) {
    throw new AppError(409, 'Slot overlaps with existing block');
  }

  const blocked = await prisma.scheduleBlocked.create({
    data: {
      courtId,
      date: normalizedDate,
      startTime,
      endTime,
      reason: reason || null,
    },
    include: { court: { select: { name: true, type: true } } },
  });

  res.status(201).json(blocked);
}

// ── listBlocked -- GET /api/v1/schedules/blocked ───────────

export async function listBlocked(req: Request, res: Response) {
  const { date } = req.query;

  const where: Record<string, any> = {};
  if (date && typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    where.date = normalizeDate(date);
  }

  const blocked = await prisma.scheduleBlocked.findMany({
    where,
    include: { court: { select: { id: true, name: true, type: true } } },
    orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
  });

  res.json({ blocked });
}

// ── unblockSlot -- DELETE /api/v1/schedules/blocked/:id ────

export async function unblockSlot(req: Request, res: Response) {
  const existing = await prisma.scheduleBlocked.findUnique({
    where: { id: req.params.id },
  });

  if (!existing) {
    throw new AppError(404, 'Blocked slot not found');
  }

  await prisma.scheduleBlocked.delete({ where: { id: req.params.id } });

  res.json({ message: 'Slot unblocked' });
}
