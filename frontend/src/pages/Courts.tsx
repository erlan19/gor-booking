import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { api, ApiError, type Court } from "../lib/api";
import Button from "../components/Button";
import Input from "../components/Input";

const TYPES = ["Semua", "Futsal", "Badminton", "Basket", "Voli"];
const HOURS = Array.from({ length: 15 }, (_, i) => 7 + i); // 07:00 - 21:00

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function Courts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courts, setCourts] = useState<Court[]>([]);
  const [type, setType] = useState("Semua");
  const [loadErr, setLoadErr] = useState("");

  const [selected, setSelected] = useState<Court | null>(null);
  const [date, setDate] = useState(today());
  const [booked, setBooked] = useState<{ startTime: string; endTime: string }[]>([]);
  const [start, setStart] = useState<number | null>(null);
  const [duration, setDuration] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [step, setStep] = useState<"pick" | "confirm">("pick");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .courts()
      .then((res) => setCourts(res.courts))
      .catch(() => setLoadErr("Gagal memuat lapangan"));
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.availability(selected.id, date).then((res) => setBooked(res.booked));
    setStart(null);
  }, [selected, date]);

  const filtered = useMemo(
    () => (type === "Semua" ? courts : courts.filter((c) => c.type === type)),
    [courts, type]
  );

  function isHourTaken(h: number) {
    const s = `${String(h).padStart(2, "0")}:00`;
    const e = `${String(h + 1).padStart(2, "0")}:00`;
    return booked.some((b) => b.startTime < e && s < b.endTime);
  }

  function openCourt(c: Court) {
    setSelected(c);
    setStep("pick");
    setError("");
    setCustomerName(user?.name ?? "");
    setCustomerPhone(user?.phone ?? "");
  }

  function selectHour(h: number) {
    if (isHourTaken(h)) return;
    setStart(h);
    setDuration(1);
  }

  const endHour = start !== null ? start + duration : null;
  const total = selected && start !== null ? selected.pricePerHour * duration : 0;

  function goConfirm() {
    if (!user) {
      navigate("/login");
      return;
    }
    if (start === null) {
      setError("Pilih jam terlebih dahulu");
      return;
    }
    setError("");
    setStep("confirm");
  }

  async function submitBooking() {
    if (!selected || start === null) return;
    setSubmitting(true);
    setError("");
    try {
      const startTime = `${String(start).padStart(2, "0")}:00`;
      const endTime = `${String(start + duration).padStart(2, "0")}:00`;
      const res = await api.createBooking({
        courtId: selected.id,
        date,
        startTime,
        endTime,
        customerName,
        customerPhone,
      });
      navigate(`/payment/${res.booking.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat booking");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-12">
      <h1 className="text-3xl font-bold mb-2">Lapangan</h1>
      <p className="text-on-surface-variant mb-8">Pilih lapangan, cek slot kosong, booking langsung.</p>

      <div className="flex gap-2 mb-8 flex-wrap">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-4 py-2 text-xs font-semibold border ${
              type === t
                ? "bg-primary text-on-primary border-primary"
                : "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loadErr && <p className="text-danger text-sm mb-4">{loadErr}</p>}

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <motion.div
          className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {filtered.map((c) => (
            <motion.button
              key={c.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
              }}
              onClick={() => openCourt(c)}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className={`text-left border p-6 transition-all duration-300 shadow-sm hover:shadow-lg ${
                selected?.id === c.id
                  ? "bg-primary text-on-primary border-primary shadow-md"
                  : "border-outline-variant bg-surface-container hover:border-primary hover:bg-surface-container-high"
              }`}
            >
              <p
                className={`text-[11px] font-bold tracking-[0.1em] uppercase mb-3 ${
                  selected?.id === c.id ? "text-on-primary/60" : "text-on-surface-variant"
                }`}
              >
                {c.type} · {c.location}
              </p>
              <p className="font-semibold text-lg mb-1">{c.name}</p>
              <p className={`text-sm mb-4 ${selected?.id === c.id ? "text-on-primary/70" : "text-on-surface-variant"}`}>
                {c.description}
              </p>
              <p className="font-bold">Rp {c.pricePerHour.toLocaleString("id-ID")}/jam</p>
            </motion.button>
          ))}
          {filtered.length === 0 && !loadErr && (
            <p className="text-on-surface-variant text-sm">Tidak ada lapangan untuk kategori ini.</p>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            className="border border-outline-variant bg-surface-container-low p-6 h-fit sticky top-[92px]"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {!selected ? (
              <p className="text-sm text-on-surface-variant">Pilih lapangan untuk lihat jadwal & booking.</p>
            ) : step === "pick" ? (
              <>
                <p className="font-semibold mb-1">{selected.name}</p>
                <p className="text-xs text-on-surface-variant mb-5">{selected.location}</p>

                <Input
                  id="date"
                  label="Tanggal"
                  type="date"
                  min={today()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
              />

              <p className="mt-5 mb-2 text-[11px] font-bold tracking-[0.1em] uppercase text-on-surface-variant">
                Jam Mulai
              </p>
              <motion.div
                className="grid grid-cols-4 gap-1.5 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {HOURS.map((h) => {
                  const taken = isHourTaken(h);
                  const active = start === h;
                  return (
                    <motion.button
                      key={h}
                      disabled={taken}
                      whileHover={{ scale: taken ? 1 : 1.02 }}
                      whileTap={{ scale: taken ? 1 : 0.98 }}
                      onClick={() => selectHour(h)}
                      className={`py-2 text-xs border transition-all duration-200 ${
                        active
                          ? "bg-primary text-on-primary border-primary"
                          : taken
                          ? "border-outline-variant text-outline line-through cursor-not-allowed opacity-50"
                          : "border-outline-variant hover:border-primary hover:shadow-sm"
                      }`}
                    >
                      {String(h).padStart(2, "0")}:00
                    </motion.button>
                  );
                })}
              </motion.div>

              {start !== null && (
                <div className="mb-4">
                  <p className="mb-2 text-[11px] font-bold tracking-[0.1em] uppercase text-on-surface-variant">
                    Durasi
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((d) => (
                      <button
                        key={d}
                        disabled={d > 1 && isHourTaken(start + d - 1)}
                        onClick={() => setDuration(d)}
                        className={`flex-1 py-2 text-xs border ${
                          duration === d
                            ? "bg-primary text-on-primary border-primary"
                            : "border-outline-variant hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed"
                        }`}
                      >
                        {d} jam
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {start !== null && (
                <motion.div
                className="flex justify-between text-sm mb-4 pt-3 border-t border-outline-variant"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: start !== null ? 1 : 0, y: start !== null ? 0 : 10 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <span className="text-on-surface-variant">Total</span>
                <span className="font-bold">Rp {total.toLocaleString("id-ID")}</span>
              </motion.div>
              )}

              {error && <p className="text-danger text-xs mb-3">{error}</p>}
              <Button full onClick={goConfirm}>
                {user ? "Lanjut Booking" : "Masuk untuk Booking"}
              </Button>
            </>
          ) : (
            <>
              <p className="font-semibold mb-1">Konfirmasi Booking</p>
              <p className="text-xs text-on-surface-variant mb-5">Periksa detail sebelum lanjut ke pembayaran.</p>

              <div className="space-y-2 text-sm mb-5">
                <Row label="Lapangan" value={selected.name} />
                <Row label="Tanggal" value={date} />
                <Row
                  label="Jam"
                  value={`${String(start).padStart(2, "0")}:00 - ${String(endHour).padStart(2, "0")}:00`}
                />
                <Row label="Durasi" value={`${duration} jam`} />
              </div>

              <Input
                id="cname"
                label="Nama Pemesan"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mb-4"
              />
              <Input
                id="cphone"
                label="No. HP"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />

              <div className="flex justify-between text-sm my-5 pt-3 border-t border-outline-variant">
                <span className="text-on-surface-variant">Total Bayar</span>
                <span className="font-bold text-lg">Rp {total.toLocaleString("id-ID")}</span>
              </div>

              {error && <p className="text-danger text-xs mb-3">{error}</p>}

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep("pick")}>
                  Kembali
                </Button>
                <Button full disabled={submitting || !customerName || !customerPhone} onClick={submitBooking}>
                  {submitting ? "Memproses..." : "Konfirmasi & Bayar"}
                </Button>
              </div>
            </>
          )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
