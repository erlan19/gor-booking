const { type Request, type Response } = require('express');
const prisma = require('../../lib/prisma');
const { AppError } = require('../../middlewares/error.middleware');

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({ select: userSelect });
  res.json({ users });
}

export async function toggleUserStatus(req: Request, res: Response) {
  const { id } = req.params;

  // Prevent admin from deactivating themselves
  if (id === req.user!.userId) {
    throw new AppError(400, 'Cannot toggle your own account status');
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: userSelect,
  });

  res.json({ user: updated });
}
