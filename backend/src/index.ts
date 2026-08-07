import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import courtRoutes from "./routes/courts.js";
import bookingRoutes from "./routes/bookings.js";
import paymentRoutes from "./routes/payments.js";
import adminRoutes from "./routes/admin.js";
import { store } from "./db.js";

const app = express();
app.use(helmet());
const ALLOWED_ORIGINS = [
  "https://gor-booking.vercel.app",
  "https://gor-booking-erlan19.vercel.app",
  ...(process.env.CORS_ORIGIN?.split(",") ?? []),
];

function isLocal(origin?: string) {
  return !!origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || isLocal(origin) || ALLOWED_ORIGINS.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error("CORS blocked"));
      }
    },
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Auto-seed if DB empty (production cold start)
if (store.users.length === 0 || store.courts.length === 0) {
  const bcrypt = (await import("bcryptjs")).default;
  const { nanoid } = await import("nanoid");
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  if (store.users.length === 0) {
    store.users.push(
      { id: nanoid(10), name: "Admin GOR",  email: "admin@gor.id",  passwordHash: hash("admin123"),  role: "admin",   phone: "081200000001", createdAt: new Date().toISOString() },
      { id: nanoid(10), name: "Kasir GOR",  email: "kasir@gor.id",  passwordHash: hash("kasir123"),  role: "cashier", phone: "081200000002", createdAt: new Date().toISOString() },
      { id: nanoid(10), name: "Budi Santoso", email: "budi@mail.com", passwordHash: hash("client123"), role: "client",  phone: "081200000003", createdAt: new Date().toISOString() },
    );
    console.log("Seeded 3 default users");
  }

  if (store.courts.length === 0) {
    store.courts.push(
      { id: nanoid(8), name: "Lapangan Futsal A",    type: "Futsal",    pricePerHour: 150000, location: "Lantai 1", description: "Vinyl flooring, indoor, pencahayaan LED penuh.", active: true },
      { id: nanoid(8), name: "Lapangan Futsal B",    type: "Futsal",    pricePerHour: 140000, location: "Lantai 1", description: "Rumput sintetis, indoor.",                        active: true },
      { id: nanoid(8), name: "Badminton Court 1",    type: "Badminton", pricePerHour: 60000,  location: "Lantai 2", description: "Lantai vinyl standar BWF.",                         active: true },
      { id: nanoid(8), name: "Badminton Court 2",    type: "Badminton", pricePerHour: 60000,  location: "Lantai 2", description: "Lantai vinyl standar BWF.",                         active: true },
      { id: nanoid(8), name: "Lapangan Basket Indoor", type: "Basket", pricePerHour: 200000, location: "Lantai 1", description: "Full court, ring standar FIBA.",                    active: true },
      { id: nanoid(8), name: "Lapangan Voli",        type: "Voli",      pricePerHour: 100000, location: "Lantai 2", description: "Indoor, net standar kompetisi.",                    active: true },
    );
    console.log("Seeded 6 default courts");
  }
  store.save();
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/courts", courtRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => res.status(404).json({ error: "Route tidak ditemukan" }));

app.use((err: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.message === "CORS blocked") {
    return res.status(403).json({ error: "Origin tidak diizinkan" });
  }
  next(err);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`GOR backend running on http://localhost:${PORT}`);
});
