import { useState, useMemo, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/shared/Layout';
import { useCourts, type Court } from '../../hooks/useCourts';
import { useSchedule, type Booking as ScheduleBooking } from '../../hooks/useSchedule';
import { ScheduleGrid } from '../../components/client/ScheduleGrid';
import { BookingModal } from '../../components/client/BookingModal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../lib/api';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../../components/ui/Button';

function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Client Dashboard</h1>
      <p className="text-gray-600">Selamat datang di GOR Booking. Pilih lapangan untuk mulai booking.</p>
    </div>
  );
}

function CourtsPage() {
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedHour, setSelectedHour] = useState<number>(6);

  const { courts, loading: courtsLoading, error: courtsError } = useCourts();
  const { bookings, blockedSlots, loading: scheduleLoading, refetch } = useSchedule(date);

  const loading = courtsLoading || scheduleLoading;

  const handleSlotClick = (courtId: string, hour: number) => {
    const court = courts.find((c) => c.id === courtId);
    if (court) {
      setSelectedCourt(court);
      setSelectedHour(hour);
    }
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pilih Lapangan</h1>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setDate((d) => { const prev = new Date(d); prev.setDate(prev.getDate() - 1); return prev; })}
            disabled={date <= today}
          >
            ← Sebelumnya
          </button>
          <span className="font-medium text-sm">
            {date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <button
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
            onClick={() => setDate((d) => { const next = new Date(d); next.setDate(next.getDate() + 1); return next; })}
          >
            Berikutnya →
          </button>
        </div>
      </div>

      {courtsError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          {courtsError}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <ScheduleGrid
          courts={courts}
          bookings={bookings}
          blockedSlots={blockedSlots}
          onSlotClick={handleSlotClick}
        />
      )}

      {selectedCourt && (
        <BookingModal
          open={!!selectedCourt}
          onClose={() => setSelectedCourt(null)}
          onSuccess={refetch}
          court={selectedCourt}
          hour={selectedHour}
          date={date}
        />
      )}
    </div>
  );
}

interface BookingRow {
  id: string;
  status: string;
  court?: { name: string };
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice?: number;
  payment?: { status: string };
}

function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const addToast = useUiStore((s) => s.addToast);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    setLoading(true);
    try {
      const { data } = await api.get('/bookings/me');
      setBookings(data.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  const handleCancel = async (id: string) => {
    if (!window.confirm('Batalkan booking ini?')) return;
    try {
      await api.patch(`/bookings/${id}/cancel`);
      addToast('Booking dibatalkan', 'success');
      fetchBookings();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Gagal membatalkan booking', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Riwayat Booking</h1>
      {bookings.length === 0 ? (
        <p className="text-gray-500">Belum ada booking.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="border rounded-lg p-4 flex items-center justify-between">
              <div className="text-sm space-y-1">
                <div className="font-medium">{b.court?.name || 'Lapangan'}</div>
                <div className="text-gray-500">
                  {b.bookingDate?.slice(0, 10)} {b.startTime} - {b.endTime}
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    b.status === 'PAID' ? 'bg-green-100 text-green-700' :
                    b.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {b.status}
                  </span>
                  {b.payment?.status && (
                    <span className="text-xs text-gray-400">Payment: {b.payment.status}</span>
                  )}
                </div>
              </div>
              {(b.status === 'PENDING' || b.status === 'PAID') && (
                <Button variant="danger" size="sm" onClick={() => handleCancel(b.id)}>
                  Batalkan
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClientLayoutRoutes() {
  return (
    <Layout role="CLIENT">
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="courts" element={<CourtsPage />} />
        <Route path="bookings" element={<BookingsPage />} />
      </Routes>
    </Layout>
  );
}
