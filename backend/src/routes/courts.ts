import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { store, type Court } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", (req, res) => {
  const { type, active } = req.query;
  let courts = store.courts;
  if (type) courts = courts.filter((c) => c.type === type);
  if (active !== undefined) courts = courts.filter((c) => c.active === (active === "true"));
  res.json({ courts });
});

router.get("/:id", (req, res) => {
  const court = store.courts.find((c) => c.id === req.params.id);
  if (!court) return res.status(404).json({ error: "Lapangan tidak ditemukan" });
  res.json({ court });
});

const courtSchema = z.object({
  name: z.string().min(2),
  type: z.string().min(2),
  pricePerHour: z.number().positive(),
  location: z.string().min(2),
  description: z.string().default(""),
  active: z.boolean().default(true),
});

router.post("/", requireAuth, requireRole("admin"), (req, res) => {
  const parsed = courtSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const court: Court = { id: nanoid(8), ...parsed.data };
  store.courts.push(court);
  store.save();
  res.status(201).json({ court });
});

router.put("/:id", requireAuth, requireRole("admin"), (req, res) => {
  const idx = store.courts.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Lapangan tidak ditemukan" });
  const parsed = courtSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  store.courts[idx] = { ...store.courts[idx], ...parsed.data };
  store.save();
  res.json({ court: store.courts[idx] });
});

router.delete("/:id", requireAuth, requireRole("admin"), (req, res) => {
  const idx = store.courts.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Lapangan tidak ditemukan" });
  store.courts.splice(idx, 1);
  store.save();
  res.status(204).end();
});

export default router;
