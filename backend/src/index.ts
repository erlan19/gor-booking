import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import courtRoutes from "./routes/courts.js";
import bookingRoutes from "./routes/bookings.js";
import paymentRoutes from "./routes/payments.js";
import adminRoutes from "./routes/admin.js";

const app = express();
app.use(helmet());
const ALLOWED_ORIGINS = [
  "https://gor-booking.vercel.app",
  "https://gor-booking-erlan19.vercel.app",
  ...(process.env.CORS_ORIGIN?.split(",") ?? []),
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) cb(null, true);
      else cb(new Error("CORS blocked"));
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

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/courts", courtRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => res.status(404).json({ error: "Route tidak ditemukan" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`GOR backend running on http://localhost:${PORT}`);
});
