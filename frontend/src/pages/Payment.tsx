import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiError, type Booking, type Court, type PaymentMethod } from "../lib/api";
import Button from "../components/Button";

const METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: "qris", label: "QRIS", icon: "qr_code_2" },
  { id: "transfer", label: "Transfer Bank", icon: "account_balance" },
  { id: "card", label: "Kartu Debit/Kredit", icon: "credit_card" },
  { id: "cash", label: "Bayar di Tempat", icon: "payments" },
];

type Phase = "select" | "processing" | "success" | "failed";

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [court, setCourt] = useState<Court | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("qris");
  const [phase, setPhase] = useState<Phase>("select");
  const [error, setError] = useState("");
  const [ref, setRef] = useState("");

  useEffect(() => {
    if (!bookingId) return;
    api
      .booking(bookingId)
      .then((res) => {
        setBooking(res.booking);
        return api.court(res.booking.courtId);
      })
      .then((res) => setCourt(res.court))
      .catch(() => setError("Booking tidak ditemukan"));
  }, [bookingId]);

  async function pay() {
    if (!bookingId) return;
    setPhase("processing");
    setError("");
    try {
      // simulated gateway delay
      await new Promise((r) => setTimeout(r, 1400));
      const res = await api.simulatePayment(bookingId, method);
      setRef(res.payment.simulatedRef);
      if (res.payment.status === "paid") {
        setBooking(res.booking);
        setPhase("success");
      } else {
        setPhase("failed");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Pembayaran gagal");
      setPhase("failed");
    }
  }

  if (error && !booking) {
    return <p className="max-w-md mx-auto mt-20 text-center text-danger">{error}</p>;
  }
  if (!booking || !court) {
    return <p className="max-w-md mx-auto mt-20 text-center text-on-surface-variant">Memuat...</p>;
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-3">
        Pembayaran (Simulasi)
      </p>
      <h1 className="text-3xl font-bold mb-8">Selesaikan Pembayaran</h1>

      <div className="border border-outline-variant bg-surface-container p-6 mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-on-surface-variant">Lapangan</span>
          <span className="font-medium">{court.name}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-on-surface-variant">Jadwal</span>
          <span className="font-medium">
            {booking.date}, {booking.startTime}-{booking.endTime}
          </span>
        </div>
        <div className="flex justify-between text-sm mb-4">
          <span className="text-on-surface-variant">Status</span>
          <span className="font-medium capitalize">{booking.status}</span>
        </div>
        <div className="flex justify-between pt-4 border-t border-outline-variant">
          <span className="text-on-surface-variant">Total</span>
          <span className="font-bold text-xl">Rp {booking.totalPrice.toLocaleString("id-ID")}</span>
        </div>
      </div>

      {phase === "select" && (
        <>
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-3">
            Metode Pembayaran
          </p>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex items-center gap-3 p-4 border text-sm ${
                  method === m.id
                    ? "bg-primary text-on-primary border-primary"
                    : "border-outline-variant hover:border-primary"
                }`}
              >
                <span className="material-symbols-outlined">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
          <Button full onClick={pay}>
            Bayar Sekarang
          </Button>
          <p className="text-xs text-on-surface-variant mt-3">
            *Ini simulasi payment gateway untuk keperluan demo, tidak ada transaksi nyata.
          </p>
        </>
      )}

      {phase === "processing" && (
        <div className="text-center py-10">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-4 block">
            progress_activity
          </span>
          <p className="text-on-surface-variant text-sm">Memproses pembayaran via {method.toUpperCase()}...</p>
        </div>
      )}

      {phase === "success" && (
        <div className="text-center py-8 border border-success/40 bg-success-bg">
          <span className="material-symbols-outlined text-4xl text-success mb-3 block">check_circle</span>
          <p className="font-semibold mb-1">Pembayaran Berhasil</p>
          <p className="text-xs text-on-surface-variant mb-6">Ref: {ref}</p>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              Ke Dashboard
            </Button>
          </div>
        </div>
      )}

      {phase === "failed" && (
        <div className="text-center py-8 border border-danger/40 bg-danger-bg">
          <span className="material-symbols-outlined text-4xl text-danger mb-3 block">cancel</span>
          <p className="font-semibold mb-1">Pembayaran Gagal</p>
          <p className="text-xs text-on-surface-variant mb-6">{error || "Gateway menolak transaksi. Coba lagi."} {ref && `(Ref: ${ref})`}</p>
          <Button onClick={() => setPhase("select")}>Coba Lagi</Button>
        </div>
      )}
    </div>
  );
}
