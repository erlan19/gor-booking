import React, { useState, useEffect } from 'react';
import { useCashierData, type Booking } from '../../hooks/useCashierData';
import { useSocket } from '../../hooks/useSocket';
import { useUiStore } from '../../store/uiStore';
import WalkInModal from './WalkInModal';

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 to 22:00

function getStatusForSlot(
  courtId: string,
  hour: number,
  bookings: Booking[]
): { status: 'available' | 'booked'; booking?: Booking } {
  const booking = bookings.find(
    (b) =>
      b.courtId === courtId &&
      b.status !== 'CANCELLED' &&
      parseInt(b.startTime.split(':')[0]) <= hour &&
      parseInt(b.endTime.split(':')[0]) > hour
  );

  if (booking) {
    return { status: 'booked', booking };
  }
  return { status: 'available' };
}

export default function POSGrid() {
  const { courts, bookings, loading, refetch } = useCashierData();
  const { isConnected, onBookingCreated, onBookingUpdated, onBookingCancelled } = useSocket();
  const { addToast } = useUiStore();
  const [selectedSlot, setSelectedSlot] = useState<{ courtId: string; startTime: string; endTime: string } | null>(null);

  useEffect(() => {
    const unsubCreated = onBookingCreated(() => {
      addToast('Booking baru diterima', 'info');
      refetch();
    });

    const unsubUpdated = onBookingUpdated(() => {
      addToast('Status booking diperbarui', 'info');
      refetch();
    });

    const unsubCancelled = onBookingCancelled(() => {
      addToast('Booking dibatalkan', 'info');
      refetch();
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubCancelled();
    };
  }, [onBookingCreated, onBookingUpdated, onBookingCancelled, addToast, refetch]);

  const handleSlotClick = (courtId: string, hour: number) => {
    const startTime = `${String(hour).padStart(2, '0')}:00`;
    const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
    setSelectedSlot({ courtId, startTime, endTime });
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
          {isConnected ? '🟢 Real-time connected' : '🔴 Offline'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header row: hours */}
          <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${HOURS.length}, minmax(32px, 1fr))` }}>
            <div className="p-1 text-xs font-bold text-gray-500">Lapangan</div>
            {HOURS.map((hour) => (
              <div key={hour} className="p-1 text-[10px] font-medium text-center text-gray-500">
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Court rows */}
          {courts.map((court) => (
            <div
              key={court.id}
              className="grid gap-1 mt-1"
              style={{ gridTemplateColumns: `120px repeat(${HOURS.length}, minmax(32px, 1fr))` }}
            >
              <div className="p-1 text-xs font-medium truncate" title={court.name}>
                {court.name}
              </div>

              {HOURS.map((hour) => {
                const { status, booking } = getStatusForSlot(court.id, hour, bookings);
                return (
                  <button
                    key={`${court.id}-${hour}`}
                    data-status={status}
                    data-slot={`${court.id}-${hour}`}
                    data-testid={`slot-${status}`}
                    disabled={status === 'booked'}
                    onClick={() => status === 'available' && handleSlotClick(court.id, hour)}
                    className={`
                      p-1 rounded text-[10px] leading-tight border
                      ${status === 'available'
                        ? 'bg-green-50 border-green-300 hover:bg-green-200 cursor-pointer'
                        : 'bg-red-50 border-red-300 cursor-default'
                      }
                    `}
                    title={status === 'booked' ? `${booking?.customerName || 'Booked'}` : 'Tersedia'}
                  >
                    {status === 'booked' ? (
                      <span className="text-red-800 truncate block">
                        {(booking?.customerName?.length || 0) > 8 ? booking?.customerName?.slice(0, 8) + '...' : booking?.customerName || 'Booked'}
                      </span>
                    ) : (
                      <span className="text-green-700">·</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500 mt-4">
        <span>🟢 = Tersedia</span>
        <span>🔴 = Terisi</span>
      </div>

      {/* WalkIn Modal */}
      {selectedSlot && (
        <WalkInModal
          open={!!selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onSuccess={refetch}
          courtId={selectedSlot.courtId}
          startTime={selectedSlot.startTime}
          endTime={selectedSlot.endTime}
        />
      )}
    </div>
  );
}
