import { useEffect, useState } from "react";
import { api, ApiError, type Booking, type Court, type PaymentMethod } from "../lib/api";
import Button from "../components/Button";
import Input from "../components/Input";
import StatusChip from "../components/StatusChip";

const HOURS = Array.from({ length: 15 }, (_, i) => 7 + i);
const METHODS: PaymentMethod[] = ["cash", "qris", "transfer", "card"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function CashierPOS() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [selected, setSelected] = useState<Court | null>(null);
  const [date, setDate] = useState(today());
  const [booked, setBooked] = useState<{ startTime: string; endTime: string }[]>([]);
  const [start, setStart] = useState<number | null>(null);
  const [duration, setDuration] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<Booking | null>(null);
  const [todayList, setTodayList] = useState<Booking[]>([]);

  useEffect(() => {
    api.courts({ }).then((res) => setCourts(res.courts));
    refreshToday();
  }, []);

  function refreshToday() {
    api.allBookings({ date: today() }).then((res) => setTodayList(res.bookings));
  }

  useEffect(() => {
    if (!selected) return;
    api.availability(selected.id, date).then((res) => setBooked(res.booked));
    setStart(null);
  }, [selected, date]);

  function isHourTaken(h: number) {
    const s = `${String(h).padStart(2, "0")}:00`;
    const e = `${String(h + 1).padStart(2, "0")}:00`;
    return booked.some((b) => b.startTime < e && s < b.endTime);
  }

  const endHour = start !== null ? start + duration : null;
  const total = selected && start !== null ? selected.pricePerHour * duration : 0;

  async function submit() {
    if (!selected || start === null) {
      setError("Pilih lapangan & jam");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await api.createCashierBooking({
        courtId: selected.id,
        date,
        startTime: `${String(start).padStart(2, "0")}:00`,
        endTime: `${String(start + duration).padStart(2, "0")}:00`,
        customerName: name,
        customerPhone: phone,
        method,
      });
      setSuccess(res.booking);
      setName("");
      setPhone("");
      setStart(null);
      api.availability(selected.id, date).then((r) => setBooked(r.booked));
      refreshToday();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat transaksi");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = selected && start !== null && name.length > 1 && phone.length >= 6;

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-10">
      <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-2">Kasir · POS</p>
      <h1 className="text-3xl font-bold mb-8">Booking Walk-in</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <p className="mb-2 text-[11px] font-bold tracking-[0.1em] uppercase text-on-surface-variant">Lapangan</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {courts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`p-3 text-left border text-sm ${
                    selected?.id === c.id
                      ? "bg-primary text-on-primary border-primary"
                      : "border-outline-variant hover:border-primary"
                  }`}
                >
                  <p className="font-semibold">{c.name}</p>
                  <p className={selected?.id === c.id ? "text-on-primary/70 text-xs" : "text-on-surface-variant text-xs"}>
                    Rp {c.pricePerHour.toLocaleString("id-ID")}/jam
                  </p>
                </button>
              ))}
            </div>
          </div>

          {selected && (
            <>
              <Input id="date" label="Tanggal" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <div>
                <p className="mb-2 text-[11px] font-bold tracking-[0.1em] uppercase text-on-surface-variant">
                  Jam Mulai
                </p>
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5">
                  {HOURS.map((h) => {
                    const taken = isHourTaken(h);
                    return (
                      <button
                        key={h}
                        disabled={taken}
                        onClick={() => { setStart(h); setDuration(1); }}
                        className={`py-2 text-xs border ${
                          start === h
                            ? "bg-primary text-on-primary border-primary"
                            : taken
                            ? "border-outline-variant text-outline line-through cursor-not-allowed"
                            : "border-outline-variant hover:border-primary"
                        }`}
                      >
                        {String(h).padStart(2, "0")}:00
                      </button>
                    );
                  })}
                </div>
              </div>

              {start !== null && (
                <div>
                  <p className="mb-2 text-[11px] font-bold tracking-[0.1em] uppercase text-on-surface-variant">
                    Durasi
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((d) => (
                      <button
                        key={d}
                        disabled={d > 1 && isHourTaken(start + d - 1)}
                        onClick={() => setDuration(d)}
                        className={`px-4 py-2 text-xs border ${
                          duration === d
                            ? "bg-primary text-on-primary border-primary"
                            : "border-outline-variant hover:border-primary disabled:opacity-30"
                        }`}
                      >
                        {d} jam
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input id="pname" label="Nama Pelanggan" value={name} onChange={(e) => setName(e.target.value)} />
                <Input id="pphone" label="No. HP" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div>
                <p className="mb-2 text-[11px] font-bold tracking-[0.1em] uppercase text-on-surface-variant">
                  Metode Bayar
                </p>
                <div className="flex gap-2 flex-wrap">
                  {METHODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      className={`px-4 py-2 text-xs border uppercase ${
                        method === m
                          ? "bg-primary text-on-primary border-primary"
                          : "border-outline-variant hover:border-primary"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="border border-outline-variant bg-surface-container-low p-6 h-fit sticky top-[92px]">
          <p className="font-semibold mb-4">Ringkasan Transaksi</p>
          {selected && start !== null ? (
            <div className="space-y-2 text-sm mb-5">
              <Row label="Lapangan" value={selected.name} />
              <Row label="Jam" value={`${String(start).padStart(2, "0")}:00-${String(endHour).padStart(2, "0")}:00`} />
              <Row label="Durasi" value={`${duration} jam`} />
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant mb-5">Pilih lapangan & jam.</p>
          )}
          <div className="flex justify-between pt-3 border-t border-outline-variant mb-5">
            <span className="text-on-surface-variant text-sm">Total</span>
            <span className="font-bold text-lg">Rp {total.toLocaleString("id-ID")}</span>
          </div>
          {error && <p className="text-danger text-xs mb-3">{error}</p>}
          <Button full disabled={!canSubmit || submitting} onClick={submit}>
            {submitting ? "Memproses..." : "Proses & Cetak"}
          </Button>

          {success && (
            <div className="mt-4 border border-success/40 bg-success-bg p-3 text-xs">
              <p className="font-semibold text-success mb-1">Transaksi berhasil</p>
              <p className="text-on-surface-variant">Booking {success.id.slice(0, 8)} · Lunas ({method})</p>
            </div>
          )}
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-12 mb-4">Transaksi Hari Ini</h2>
      <div className="border border-outline-variant divide-y divide-outline-variant">
        {todayList.length === 0 && <p className="p-4 text-sm text-on-surface-variant">Belum ada transaksi.</p>}
        {todayList.map((b) => (
          <div key={b.id} className="flex justify-between items-center p-4 text-sm">
            <div>
              <p className="font-medium">{b.customerName} · {b.startTime}-{b.endTime}</p>
              <p className="text-on-surface-variant text-xs">{b.source === "cashier" ? "Walk-in" : "Online"} · Rp {b.totalPrice.toLocaleString("id-ID")}</p>
            </div>
            <StatusChip status={b.status} />
          </div>
        ))}
      </div>
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
