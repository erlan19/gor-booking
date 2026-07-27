import { clsx } from 'clsx';
import type { Booking } from '../../hooks/useSchedule';

interface SlotCellProps {
  courtId: string;
  hour: number;
  status: 'available' | 'booked' | 'blocked';
  booking?: Booking;
  onClick?: () => void;
}

const statusStyles: Record<string, string> = {
  available: 'bg-green-100 border-green-300 hover:bg-green-200 cursor-pointer',
  booked: 'bg-red-100 border-red-300 cursor-default',
  blocked: 'bg-gray-200 border-gray-300 cursor-not-allowed',
};

export function SlotCell({ courtId, hour, status, booking, onClick }: SlotCellProps) {
  return (
    <div
      data-status={status}
      data-slot={`${courtId}-${hour}`}
      data-testid={`slot-${courtId}-${hour}`}
      className={clsx(
        'h-14 border rounded-md flex flex-col items-center justify-center text-xs transition-colors select-none',
        statusStyles[status],
      )}
      onClick={status === 'available' ? onClick : undefined}
    >
      {status === 'booked' && booking && (
        <span className="text-red-700 font-medium truncate px-1">
          {booking.user?.name || 'Booked'}
        </span>
      )}
      {status === 'blocked' && <span className="text-gray-500">Tutup</span>}
      {status === 'available' && <span className="text-green-700">Tersedia</span>}
    </div>
  );
}
