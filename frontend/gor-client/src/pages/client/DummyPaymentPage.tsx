import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed';

export default function DummyPaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState('');

  const bookingId = searchParams.get('bookingId');
  const amount = searchParams.get('amount');
  const courtName = searchParams.get('court');
  const time = searchParams.get('time');
  const date = searchParams.get('date');

  const handleSimulate = async (success: boolean) => {
    setStatus('processing');
    setError('');

    try {
      if (success) {
        // Simulate successful payment
        await api.post(`/bookings/${bookingId}/pay`, {
          method: 'DUMMY',
          amount: Number(amount),
        });
        setStatus('success');
      } else {
        // Simulate failed payment
        setStatus('failed');
        setError('Pembayaran dibatalkan oleh sistem');
      }
    } catch (err: any) {
      setStatus('failed');
      setError(err.response?.data?.error || 'Gagal memproses pembayaran');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-dark-500 hover:text-dark-700 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="text-sm">Kembali</span>
        </button>

        {/* Payment Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <CreditCard size={20} />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Pembayaran Dummy</h1>
                <p className="text-sm text-primary-100">Simulasi pembayaran booking</p>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="p-6">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-dark-500">Lapangan</span>
                <span className="font-medium text-dark-900">{courtName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-500">Tanggal</span>
                <span className="font-medium text-dark-900">{date || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-500">Waktu</span>
                <span className="font-medium text-dark-900">{time || '-'}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3">
                <span className="text-dark-500 font-medium">Total</span>
                <span className="text-lg font-bold text-primary-600">Rp {Number(amount || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Status Display */}
            {status === 'processing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                <p className="text-dark-600">Memproses pembayaran...</p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-dark-900 mb-2">Pembayaran Berhasil!</h2>
                <p className="text-dark-500 mb-6">Booking Anda telah terkonfirmasi</p>
                <button
                  onClick={() => navigate('/client/bookings')}
                  className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors"
                >
                  Lihat Riwayat Booking
                </button>
              </motion.div>
            )}

            {status === 'failed' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-dark-900 mb-2">Pembayaran Gagal</h2>
                <p className="text-dark-500 mb-6">{error || 'Terjadi kesalahan saat memproses pembayaran'}</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="w-full bg-gray-100 text-dark-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Coba Lagi
                </button>
              </motion.div>
            )}

            {status === 'idle' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <p className="text-sm text-dark-500 text-center mb-4">Pilih simulasi pembayaran:</p>
                <button
                  onClick={() => handleSimulate(true)}
                  className="w-full bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Simulasikan Berhasil
                </button>
                <button
                  onClick={() => handleSimulate(false)}
                  className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2 border border-red-200"
                >
                  <XCircle size={18} />
                  Simulasikan Gagal
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}