import { useState } from 'react';
import { format, addHours } from 'date-fns';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import api from '../../lib/api';
import { useUiStore } from '../../store/uiStore';
import type { Court } from '../../hooks/useCourts';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  court: Court;
  hour: number;
  date: Date;
}

export function BookingModal({ open, onClose, onSuccess, court, hour, date }: BookingModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const addToast = useUiStore((s) => s.addToast);

  const bookingDate = format(date, 'yyyy-MM-dd');
  const startTime = `${String(hour).padStart(2, '0')}:00`;
  const endTime = format(addHours(new Date(2000, 0, 1, hour), 1), 'HH:mm');

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await api.post('/bookings', { courtId: court.id, bookingDate, startTime, endTime });
      addToast('Booking berhasil!', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Gagal membuat booking', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Konfirmasi Booking" size="sm">
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Lapangan</span>
          <span className="font-medium">{court.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Tanggal</span>
          <span className="font-medium">{format(date, 'dd MMMM yyyy')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Jam</span>
          <span className="font-medium">{startTime} – {endTime}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Harga</span>
          <span className="font-medium">Rp {court.pricePerHour.toLocaleString('id-ID')}/jam</span>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button loading={submitting} onClick={handleConfirm}>Konfirmasi</Button>
        </div>
      </div>
    </Modal>
  );
}
