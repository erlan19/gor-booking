import { Outlet, Routes, Route } from 'react-router-dom';
import Layout from '../../components/shared/Layout';

function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-500">Booking Hari Ini</p>
          <p className="text-3xl font-bold mt-1">0</p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-3xl font-bold mt-1">Rp 0</p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-500">Lapangan Aktif</p>
          <p className="text-3xl font-bold mt-1">6</p>
        </div>
      </div>
    </div>
  );
}

function CourtsManage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Kelola Lapangan</h1>
      <p className="text-gray-500">Tabel CRUD lapangan akan tampil di sini.</p>
    </div>
  );
}

function UsersManage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Kelola User</h1>
      <p className="text-gray-500">Daftar user akan tampil di sini.</p>
    </div>
  );
}

function BookingsManage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Semua Booking</h1>
      <p className="text-gray-500">Daftar booking akan tampil di sini.</p>
    </div>
  );
}

export default function AdminLayoutRoutes() {
  return (
    <Layout role="ADMIN">
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="courts" element={<CourtsManage />} />
        <Route path="users" element={<UsersManage />} />
        <Route path="bookings" element={<BookingsManage />} />
      </Routes>
    </Layout>
  );
}
