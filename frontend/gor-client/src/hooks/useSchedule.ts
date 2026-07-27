import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import api from '../lib/api';

export interface Booking {
  id: string;
  courtId: string;
  courtName?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice?: number;
  user?: { id: string; name: string };
}

export interface BlockedSlot {
  id: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export function useSchedule(date: Date) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    const dateStr = format(date, 'yyyy-MM-dd');
    try {
      const [bookingRes, blockedRes] = await Promise.all([
        api.get('/bookings', { params: { date: dateStr } }),
        api.get('/schedules/blocked', { params: { date: dateStr } }),
      ]);
      setBookings(bookingRes.data.bookings || bookingRes.data || []);
      setBlockedSlots(blockedRes.data.blocked || blockedRes.data || []);
    } catch {
      setBookings([]);
      setBlockedSlots([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  return { bookings, blockedSlots, loading, refetch: fetchSchedule };
}
