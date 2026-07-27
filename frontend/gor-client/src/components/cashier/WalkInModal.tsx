import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useUiStore } from '../../store/uiStore';
import api from '../../lib/api';

interface WalkInModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courtId: string;
  startTime: string;
  endTime: string;
}

const paymentOptions = [
  { value: 'cash', label: 'Bayar Tunai' },
  { value: 'qris', label: 'QRIS' }
];

export default function WalkInModal({
  open,
  onClose,
  onSuccess,
  courtId,
  startTime,
  endTime
}: WalkInModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addToast = useUiStore(state => state.addToast);

  useEffect(() => {
    if (!open) {
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod('cash');
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      setError('Nama pelanggan wajib diisi');
      return;
    }

    if (!customerPhone.trim()) {
      setError('No. telepon wajib diisi');
      return;
    }

    if (!/^[0-9+\-\s()]{8,20}$/.test(customerPhone.trim())) {
      setError('Format nomor telepon tidak valid');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/bookings/walkin', {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        paymentMethod,
        courtId,
        startTime,
        endTime,
      });

      addToast(`Walk-in booking berhasil dibuat untuk ${customerName}`, 'success');
      onSuccess();
      onClose();

    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Gagal membuat walk-in booking';
      console.error('Walkin booking failed:', msg);
      addToast(msg, 'error');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentChange = (value: string) => {
    setPaymentMethod(value as 'cash' | 'qris');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Walk-In Booking"
      size="sm"
      data-testid="walkin-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Nama Pelanggan"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Masukkan nama lengkap"
            error={error && !customerName ? error : ''}
            required
            data-testid="customer-name-input"
          />
        </div>

        <div>
          <Input
            label="No. Telepon"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="No. Telepon"
            error={error && !customerPhone ? error : ''}
            required
            data-testid="customer-phone-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Metode Pembayaran
          </label>
          <div className="space-y-2">
            {paymentOptions.map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.value}
                  checked={paymentMethod === option.value}
                  onChange={() => handlePaymentChange(option.value)}
                  className="mr-2"
                  data-testid={`payment-${option.value}`}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600" data-testid="error-message">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
            data-testid="cancel-button"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="flex-1"
            data-testid="submit-button"
          >
            Buat Booking
          </Button>
        </div>
      </form>
    </Modal>
  );
}