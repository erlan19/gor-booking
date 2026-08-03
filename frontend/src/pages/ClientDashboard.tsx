import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, type Booking } from "../lib/api";
import StatusChip from "../components/StatusChip";
import Button from "../components/Button";

export default function ClientDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api
      .myBookings()
      .then((res) => setBookings(res.bookings))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const upcoming = bookings.filter((b) => b.status === "pending" || b.status === "confirmed");
  const history = bookings.filter((b) => b.status === "cancelled" || b.status === "completed");

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-12">
      <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-2">Dashboard</p>
      <h1 className="text-3xl font-bold mb-1">Halo, {user?.name}</h1>
      <p className="text-on-surface-variant mb-10">Kelola booking lapangan kamu di sini.</p>

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold">Booking Aktif</h2>
        <Link to="/courts">
          <Button>+ Booking Baru</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-on-surface-variant text-sm">Memuat...</p>
      ) : upcoming.length === 0 ? (
        <p className="text-on-surface-variant text-sm border border-outline-variant p-6">
          Belum ada booking aktif.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {upcoming.map((b) => (
            <div key={b.id} className="border border-outline-variant bg-surface-container p-5">
              <div className="flex justify-between items-start mb-3">
                <p className="font-semibold">{b.date}</p>
                <StatusChip status={b.status} />
              </div>
              <p className="text-sm text-on-surface-variant mb-1">
                {b.startTime} - {b.endTime} · {b.durationHours} jam
              </p>
              <p className="text-sm text-on-surface-variant mb-4">Booking ID: {b.id}</p>
              <div className="flex justify-between items-center pt-3 border-t border-outline-variant">
                <span className="font-bold">Rp {b.totalPrice.toLocaleString("id-ID")}</span>
                {b.status === "pending" && (
                  <Link to={`/payment/${b.id}`} className="text-sm font-semibold text-primary hover:underline">
                    Bayar Sekarang →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-5">Riwayat</h2>
          <div className="border border-outline-variant divide-y divide-outline-variant">
            {history.map((b) => (
              <div key={b.id} className="flex justify-between items-center p-4 text-sm">
                <div>
                  <p className="font-medium">{b.date} · {b.startTime}-{b.endTime}</p>
                  <p className="text-on-surface-variant text-xs">{b.id}</p>
                </div>
                <StatusChip status={b.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
