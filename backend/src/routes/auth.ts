import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { z } from "zod";
import { store, type User } from "../db.js";
import { JWT_SECRET, requireAuth } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().min(6),
});

router.post("/register", (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, email, password, phone } = parsed.data;
  if (store.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: "Email sudah terdaftar" });
  }
  const user: User = {
    id: nanoid(10),
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: "client",
    phone,
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  store.save();
  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Email/password tidak valid" });
  }
  const { email, password } = parsed.data;
  const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: "Email atau password salah" });
  }
  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
  const user = store.users.find((u) => u.id === req.user!.id);
  if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
  res.json({ user: publicUser(user) });
});

function signToken(user: User) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function publicUser(user: User) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export default router;
