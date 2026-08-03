import { Router } from "express";
import { store } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/stats", requireAuth, requireRole("admin"), (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const bookingsToday = store.bookings.filter((b) => b.date === today && b.status !== "cancelled");
  const revenueToday = store.payments
    .filter((p) => p.status === "paid" && p.paidAt?.slice(0, 10) === today)
    .reduce((sum, p) => sum + p.amount, 0);
  const totalRevenue = store.payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const activeCourts = store.courts.filter((c) => c.active).length;
  const pendingBookings = store.bookings.filter((b) => b.status === "pending").length;

  const byCourt = store.courts.map((c) => ({
    courtId: c.id,
    name: c.name,
    bookingsToday: bookingsToday.filter((b) => b.courtId === c.id).length,
  }));

  res.json({
    bookingsTodayCount: bookingsToday.length,
    revenueToday,
    totalRevenue,
    activeCourts,
    totalCourts: store.courts.length,
    pendingBookings,
    totalUsers: store.users.filter((u) => u.role === "client").length,
    byCourt,
  });
});

router.get("/users", requireAuth, requireRole("admin"), (req, res) => {
  const users = store.users.map(({ passwordHash, ...rest }) => rest);
  res.json({ users });
});

export default router;
