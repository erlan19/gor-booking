import { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma.js';
import { signToken } from '../../lib/jwt.js';
import { AppError } from '../../middlewares/error.middleware.js';

// POST /api/v1/auth/register
export async function register(req: Request, res: Response) {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    throw new AppError(400, 'name, email, and password are required');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      phone: phone || null,
      role: 'CLIENT',
    },
    select: { id: true, name: true, email: true, role: true },
  });

  const token = await signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  res.status(201).json({ user, token });
}

// POST /api/v1/auth/login
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError(400, 'email and password are required');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new AppError(401, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Invalid credentials');
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  });
}

// GET /api/v1/auth/me
export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.json({ user });
}
