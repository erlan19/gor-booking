import { type Request, type Response } from 'express';
import prisma from '../../lib/prisma.js';
import { AppError } from '../../middlewares/error.middleware.js';

// GET /api/v1/courts
export async function listCourts(_req: Request, res: Response) {
  const courts = await prisma.court.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  res.json({ courts });
}

// GET /api/v1/courts/:id
export async function getCourt(req: Request, res: Response) {
  const court = await prisma.court.findUnique({ where: { id: req.params.id } });
  if (!court) {
    throw new AppError(404, 'Court not found');
  }
  res.json({ court });
}

// POST /api/v1/courts (admin)
export async function createCourt(req: Request, res: Response) {
  const { name, type, pricePerHour } = req.body;

  if (!name || !type || !pricePerHour) {
    throw new AppError(400, 'name, type, and pricePerHour are required');
  }

  const court = await prisma.court.create({
    data: { name, type, pricePerHour: Number(pricePerHour) },
  });

  res.status(201).json({ court });
}

// PATCH /api/v1/courts/:id (admin)
export async function updateCourt(req: Request, res: Response) {
  const existing = await prisma.court.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    throw new AppError(404, 'Court not found');
  }

  const { name, type, pricePerHour, isActive } = req.body;

  const court = await prisma.court.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(pricePerHour !== undefined && { pricePerHour: Number(pricePerHour) }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  res.json({ court });
}

// DELETE /api/v1/courts/:id (admin) -- soft delete
export async function deleteCourt(req: Request, res: Response) {
  const existing = await prisma.court.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    throw new AppError(404, 'Court not found');
  }

  await prisma.court.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.json({ message: 'Court deactivated' });
}
