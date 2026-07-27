import type { Court } from '../../hooks/useCourts';
import type { Booking, BlockedSlot } from '../../hooks/useSchedule';
import { SlotCell } from './SlotCell';

interface ScheduleGridProps {
  courts: Court[];
  bookings: Booking[];
  blockedSlots: BlockedSlot[];
  onSlotClick: (courtId: string, hour: number) => void;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 – 22:00

function getHourLabel(h: number) {
  return `${String(h).padStart(2, '0')}:00`;
}

function getSlotStatus(
  courtId: string,
  hour: number,
  bookings: Booking[],
  blockedSlots: BlockedSlot[],
): { status: 'available' | 'booked' | 'blocked'; booking?: Booking } {
  for (const b of bookings) {
    if (b.courtId !== courtId) continue;
    const bStart = parseInt(b.startTime.split(':')[0], 10);
    const bEnd = parseInt(b.endTime.split(':')[0], 10);
    if (hour >= bStart && hour < bEnd) return { status: 'booked', booking: b };
  }
  for (const s of blockedSlots) {
    if (s.courtId !== courtId) continue;
    const sStart = parseInt(s.startTime.split(':')[0], 10);
    const sEnd = parseInt(s.endTime.split(':')[0], 10);
    if (hour >= sStart && hour < sEnd) return { status: 'blocked' };
  }
  return { status: 'available' };
}

export function ScheduleGrid({ courts, bookings, blockedSlots, onSlotClick }: ScheduleGridProps) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        {/* Header row */}
        <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `140px repeat(${HOURS.length}, 1fr)` }}>
          <div className="h-10" />
          {HOURS.map((h) => (
            <div key={h} className="h-10 flex items-center justify-center text-[11px] font-medium text-gray-500">
              {getHourLabel(h)}
            </div>
          ))}
        </div>

        {/* Court rows */}
        {courts.map((court) => (
          <div
            key={court.id}
            className="grid gap-1 mb-1"
            style={{ gridTemplateColumns: `140px repeat(${HOURS.length}, 1fr)` }}
          >
            <div className="h-14 flex items-center font-medium text-sm text-gray-700 pr-2 truncate">
              {court.name}
            </div>
            {HOURS.map((h) => {
              const { status, booking } = getSlotStatus(court.id, h, bookings, blockedSlots);
              return (
                <SlotCell
                  key={`${court.id}-${h}`}
                  courtId={court.id}
                  hour={h}
                  status={status}
                  booking={booking}
                  onClick={() => onSlotClick(court.id, h)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
