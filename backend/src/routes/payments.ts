import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { store } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin", "cashier"), (req, res) => {
  const payments = [...store.payments].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  res.json({ payments });
});

router.get("/booking/:bookingId", requireAuth, (req, res) => {
  const payment = store.payments.find((p) => p.bookingId === req.params.bookingId);
  if (!payment) return res.status(404).json({ error: "Pembayaran belum dibuat" });
  const booking = store.bookings.find((b) => b.id === payment.bookingId);
  if (!booking) return res.status(404).json({ error: "Booking terkait tidak ditemukan" });
  if (req.user!.role === "client" && booking.userId !== req.user!.id) {
    return res.status(403).json({ error: "Akses ditolak" });
  }
  res.json({ payment });
});

const simulateSchema = z.object({
  method: z.enum(["cash", "transfer", "qris", "card"]),
  // simulated card/otp fields are accepted but not validated for real payment
  cardNumber: z.string().optional(),
});

// Simulates a payment gateway callback: marks payment paid + confirms booking
router.post("/:bookingId/simulate", requireAuth, (req, res) => {
  const booking = store.bookings.find((b) => b.id === req.params.bookingId);
  if (!booking) return res.status(404).json({ error: "Booking tidak ditemukan" });
  if (req.user!.role === "client" && booking.userId !== req.user!.id) {
    return res.status(403).json({ error: "Akses ditolak" });
  }
  if (booking.status === "cancelled" || booking.status === "completed") {
    return res.status(400).json({ error: "Booking ini sudah tidak bisa dibayar" });
  }
  const parsed = simulateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  let payment = store.payments.find((p) => p.bookingId === booking.id);
  const now = new Date().toISOString();
  if (!payment) {
    payment = {
      id: nanoid(10),
      bookingId: booking.id,
      amount: booking.totalPrice,
      method: parsed.data.method,
      status: "pending",
      simulatedRef: `SIM-${nanoid(8).toUpperCase()}`,
      createdAt: now,
    };
    store.payments.push(payment);
  }

  // Simulated gateway: succeeds 92% of the time, deterministic-ish jitter
  const success = Math.random() > 0.08;
  payment.method = parsed.data.method;
  payment.status = success ? "paid" : "failed";
  payment.paidAt = success ? now : undefined;
  payment.simulatedRef = `SIM-${nanoid(8).toUpperCase()}`;

  if (success) {
    booking.status = "confirmed";
  }
  store.save();
  res.json({ payment, booking });
});

export default router;
