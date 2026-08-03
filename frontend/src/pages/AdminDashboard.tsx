import { useEffect, useState } from "react";
import { api, ApiError, type Booking, type BookingStatus, type Court } from "../lib/api";
import Button from "../components/Button";
import Input from "../components/Input";
import StatusChip from "../components/StatusChip";

type Tab = "overview" | "bookings" | "courts";

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-10">
      <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-2">Admin</p>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="flex gap-2 mb-10 border-b border-outline-variant">
        {(["overview", "bookings", "courts"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-semibold capitalize border-b-2 -mb-px ${
              tab === t ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-primary"
            }`}
          >
            {t === "overview" ? "Ringkasan" : t === "bookings" ? "Booking" : "Lapangan"}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview />}
      {tab === "bookings" && <BookingsTab />}
      {tab === "courts" && <CourtsTab />}
    </div>
  );
}

function Overview() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof api.adminStats>> | null>(null);

  useEffect(() => {
    api.adminStats().then(setStats);
  }, []);

  if (!stats) return <p className="text-on-surface-variant text-sm">Memuat...</p>;

  const cards = [
    { label: "Booking Hari Ini", value: stats.bookingsTodayCount },
    { label: "Pendapatan Hari Ini", value: `Rp ${stats.revenueToday.toLocaleString("id-ID")}` },
    { label: "Total Pendapatan", value: `Rp ${stats.totalRevenue.toLocaleString("id-ID")}` },
    { label: "Lapangan Aktif", value: `${stats.activeCourts}/${stats.totalCourts}` },
    { label: "Booking Pending", value: stats.pendingBookings },
    { label: "Total Klien", value: stats.totalUsers },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {cards.map((c) => (
          <div key={c.label} className="border border-outline-variant p-6">
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-3">{c.label}</p>
            <p className="text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4">Booking per Lapangan (Hari Ini)</h2>
      <div className="border border-outline-variant divide-y divide-outline-variant">
        {stats.byCourt.map((c) => (
          <div key={c.courtId} className="flex justify-between p-4 text-sm">
            <span>{c.name}</span>
            <span className="font-semibold">{c.bookingsToday} booking</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingsTab() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .allBookings(status ? { status } : {})
      .then((res) => setBookings(res.bookings))
      .finally(() => setLoading(false));
  }

  useEffect(load, [status]);

  async function updateStatus(id: string, s: BookingStatus) {
    await api.updateBookingStatus(id, s);
    load();
  }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {["", "pending", "confirmed", "cancelled", "completed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 text-xs font-semibold border capitalize ${
              status === s ? "bg-primary text-on-primary border-primary" : "border-outline-variant text-on-surface-variant hover:border-primary"
            }`}
          >
            {s || "Semua"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-on-surface-variant text-sm">Memuat...</p>
      ) : (
        <div className="border border-outline-variant divide-y divide-outline-variant">
          {bookings.map((b) => (
            <div key={b.id} className="flex flex-wrap justify-between items-center gap-3 p-4 text-sm">
              <div>
                <p className="font-medium">{b.customerName} · {b.date} {b.startTime}-{b.endTime}</p>
                <p className="text-on-surface-variant text-xs">
                  {b.id} · {b.source === "cashier" ? "Walk-in" : "Online"} · Rp {b.totalPrice.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusChip status={b.status} />
                {b.status === "pending" && (
                  <button
                    onClick={() => updateStatus(b.id, "confirmed")}
                    className="text-xs font-semibold text-success hover:underline"
                  >
                    Konfirmasi
                  </button>
                )}
                {b.status !== "cancelled" && b.status !== "completed" && (
                  <button
                    onClick={() => updateStatus(b.id, "cancelled")}
                    className="text-xs font-semibold text-danger hover:underline"
                  >
                    Batalkan
                  </button>
                )}
              </div>
            </div>
          ))}
          {bookings.length === 0 && <p className="p-4 text-sm text-on-surface-variant">Tidak ada data.</p>}
        </div>
      )}
    </div>
  );
}

const EMPTY_COURT = { name: "", type: "Futsal", pricePerHour: 100000, location: "", description: "", active: true };

function CourtsTab() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [form, setForm] = useState(EMPTY_COURT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function load() {
    api.courts().then((res) => setCourts(res.courts));
  }
  useEffect(load, []);

  function edit(c: Court) {
    setEditingId(c.id);
    setForm({ name: c.name, type: c.type, pricePerHour: c.pricePerHour, location: c.location, description: c.description, active: c.active });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_COURT);
  }

  async function save() {
    setError("");
    try {
      if (editingId) {
        await api.updateCourt(editingId, form);
      } else {
        await api.createCourt(form);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan");
    }
  }

  async function toggleActive(c: Court) {
    await api.updateCourt(c.id, { active: !c.active });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Hapus lapangan ini?")) return;
    await api.deleteCourt(id);
    load();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 border border-outline-variant divide-y divide-outline-variant">
        {courts.map((c) => (
          <div key={c.id} className="flex flex-wrap justify-between items-center gap-3 p-4 text-sm">
            <div>
              <p className="font-medium">{c.name} <span className="text-on-surface-variant">· {c.type}</span></p>
              <p className="text-on-surface-variant text-xs">{c.location} · Rp {c.pricePerHour.toLocaleString("id-ID")}/jam</p>
            </div>
            <div className="flex items-center gap-4">
              <StatusChip status={c.active ? "confirmed" : "cancelled"} label={c.active ? "Aktif" : "Nonaktif"} />
              <button onClick={() => toggleActive(c)} className="text-xs font-semibold hover:underline">
                {c.active ? "Nonaktifkan" : "Aktifkan"}
              </button>
              <button onClick={() => edit(c)} className="text-xs font-semibold text-primary hover:underline">
                Edit
              </button>
              <button onClick={() => remove(c.id)} className="text-xs font-semibold text-danger hover:underline">
                Hapus
              </button>
            </div>
          </div>
        ))}
        {courts.length === 0 && <p className="p-4 text-sm text-on-surface-variant">Belum ada lapangan.</p>}
      </div>

      <div className="border border-outline-variant p-6 h-fit">
        <p className="font-semibold mb-4">{editingId ? "Edit Lapangan" : "Tambah Lapangan"}</p>
        <div className="space-y-4">
          <Input id="cn" label="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input id="ct" label="Tipe" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <Input
            id="cp"
            label="Harga/jam"
            type="number"
            value={form.pricePerHour}
            onChange={(e) => setForm({ ...form, pricePerHour: Number(e.target.value) })}
          />
          <Input id="cl" label="Lokasi" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input id="cd" label="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {error && <p className="text-danger text-xs">{error}</p>}
          <div className="flex gap-3">
            {editingId && (
              <Button variant="ghost" onClick={resetForm}>
                Batal
              </Button>
            )}
            <Button full onClick={save}>
              {editingId ? "Simpan Perubahan" : "Tambah Lapangan"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
