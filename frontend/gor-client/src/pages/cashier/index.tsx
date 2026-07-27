import { useEffect } from 'react';
import { Outlet, Routes, Route } from 'react-router-dom';
import Layout from '../../components/shared/Layout';
import POSGrid from '../../components/cashier/POSGrid';
import { useSocket } from '../../hooks/useSocket';

function Dashboard() {
  const { isConnected, onBookingCreated } = useSocket();

  useEffect(() => {
    const unsubCallback = (data: any) => {
      console.log('New booking:', data);
    };
    const unsubscribe = onBookingCreated(unsubCallback);
    return unsubscribe;
  }, [onBookingCreated]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">POS Cashier</h1>
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-yellow-800">
          Jadwal hari ini — real-time. Status koneksi: {isConnected ? 'Aktif' : 'Tidak aktif'}
        </p>
      </div>
      <POSGrid />
    </div>
  );
}

function CashierBookings() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Semua Booking</h1>
      <p className="text-gray-500">Belum ada booking hari ini.</p>
    </div>
  );
}

export default function CashierLayoutRoutes() {
  return (
    <Layout role="CASHIER">
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="bookings" element={<CashierBookings />} />
      </Routes>
    </Layout>
  );
}
