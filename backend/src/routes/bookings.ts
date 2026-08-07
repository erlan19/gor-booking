import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { store, type Booking } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

const ACTIVE_STATUSES = new Set(["pending", "confirmed"]);

// GET availability: booked slots for a court on a date
router.get("/availability", (req, res) => {
  const { courtId, date } = req.query as { courtId?: string; date?: string };
  if (!courtId || !date) return res.status(400).json({ error: "courtId dan date wajib diisi" });
  const booked = store.bookings
    .filter((b) => b.courtId === courtId && b.date === date && ACTIVE_STATUSES.has(b.status))
    .map((b) => ({ startTime: b.startTime, endTime: b.endTime, status: b.status }));
  res.json({ booked });
});

router.get("/mine", requireAuth, (req, res) => {
  const bookings = store.bookings
    .filter((b) => b.userId === req.user!.id)
    .sort((a, b) => (a.date + a.startTime < b.date + b.startTime ? 1 : -1));
  res.json({ bookings });
});

router.get("/", requireAuth, requireRole("admin", "cashier"), (req, res) => {
  const { status, date, courtId } = req.query as Record<string, string | undefined>;
  let bookings = store.bookings;
  if (status) bookings = bookings.filter((b) => b.status === status);
  if (date) bookings = bookings.filter((b) => b.date === date);
  if (courtId) bookings = bookings.filter((b) => b.courtId === courtId);
  bookings = [...bookings].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  res.json({ bookings });
});

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam tidak valid");
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid");

const createSchema = z.object({
  courtId: z.string(),
  date: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  customerName: z.string().min(2),
  customerPhone: z
    .string()
    .min(8)
    .regex(/^\+?[0-9\- ]{8,15}$/, "Nomor HP tidak valid"),
});

// allowed operation hours (07:00 - 22:00), enforced on server
const OPEN_MIN = 7 * 60;
const CLOSE_MIN = 22 * 60;

router.post("/", requireAuth, (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { courtId, date, startTime, endTime, customerName, customerPhone } = parsed.data;

  const court = store.courts.find((c) => c.id === courtId);
  if (!court) return res.status(404).json({ error: "Lapangan tidak ditemukan" });
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    return res.status(400).json({ error: "Jam selesai harus setelah jam mulai" });
  }
  if (toMinutes(startTime) < OPEN_MIN || toMinutes(endTime) > CLOSE_MIN) {
    return res.status(400).json({ error: "Jam operasional 07:00 - 22:00" });
  }
  if (date < new Date().toISOString().slice(0, 10)) {
    return res.status(400).json({ error: "Tanggal tidak boleh di masa lalu" });
  }

  const conflict = store.bookings.some(
    (b) =>
      b.courtId === courtId &&
      b.date === date &&
      ACTIVE_STATUSES.has(b.status) &&
      overlaps(startTime, endTime, b.startTime, b.endTime)
  );
  if (conflict) return res.status(409).json({ error: "Slot waktu sudah dibooking" });

  const durationHours = (toMinutes(endTime) - toMinutes(startTime)) / 60;
  // price computed server-side — never trust client-supplied price
  const totalPrice = Math.round(court.pricePerHour * durationHours);
  const booking: Booking = {
    id: nanoid(10),
    courtId,
    userId: req.user!.id,
    customerName,
    customerPhone,
    date,
    startTime,
    endTime,
    durationHours,
    totalPrice,
    status: "pending",
    source: "online",
    createdAt: new Date().toISOString(),
  };
  store.bookings.push(booking);
  store.save();
  res.status(201).json({ booking });
});

// Cashier walk-in booking: auto-confirmed, no online user required
const cashierSchema = createSchema.extend({
  method: z.enum(["cash", "transfer", "qris", "card"]).default("cash"),
});


router.post("/cashier", requireAuth, requireRole("cashier", "admin"), (req, res) => {
  const parsed = cashierSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { courtId, date, startTime, endTime, customerName, customerPhone, method } = parsed.data;

  const court = store.courts.find((c) => c.id === courtId);
  if (!court) return res.status(404).json({ error: "Lapangan tidak ditemukan" });
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    return res.status(400).json({ error: "Jam selesai harus setelah jam mulai" });
  }
  if (toMinutes(startTime) < OPEN_MIN || toMinutes(endTime) > CLOSE_MIN) {
    return res.status(400).json({ error: "Jam operasional 07:00 - 22:00" });
  }
  if (date < new Date().toISOString().slice(0, 10)) {
    return res.status(400).json({ error: "Tanggal tidak boleh di masa lalu" });
  }
  const conflict = store.bookings.some(
    (b) =>
      b.courtId === courtId &&
      b.date === date &&
      ACTIVE_STATUSES.has(b.status) &&
      overlaps(startTime, endTime, b.startTime, b.endTime)
  );
  if (conflict) return res.status(409).json({ error: "Slot waktu sudah dibooking" });

  const durationHours = (toMinutes(endTime) - toMinutes(startTime)) / 60;
  const totalPrice = Math.round(court.pricePerHour * durationHours);
  const booking: Booking = {
    id: nanoid(10),
    courtId,
    customerName,
    customerPhone,
    date,
    startTime,
    endTime,
    durationHours,
    totalPrice,
    status: "confirmed",
    source: "cashier",
    createdAt: new Date().toISOString(),
  };
  store.bookings.push(booking);

  store.payments.push({
    id: nanoid(10),
    bookingId: booking.id,
    amount: totalPrice,
    method,
    status: "paid",
    simulatedRef: `POS-${nanoid(6).toUpperCase()}`,
    paidAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });
  store.save();
  res.status(201).json({ booking });
});

const statusSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
});

router.patch("/:id/status", requireAuth, requireRole("admin", "cashier"), (req, res) => {
  const idx = store.bookings.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Booking tidak ditemukan" });
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  store.bookings[idx].status = parsed.data.status;
  store.save();
  res.json({ booking: store.bookings[idx] });
});

router.get("/:id", requireAuth, (req, res) => {
  const booking = store.bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking tidak ditemukan" });
  if (req.user!.role === "client" && booking.userId !== req.user!.id) {
    return res.status(403).json({ error: "Akses ditolak" });
  }
  res.json({ booking });
});

export default router;
