import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export interface Court {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
  isActive: boolean;
}

export interface Booking {
  id: string;
  courtId: string;
  userId?: string;
  cashierId?: string;
  customerName?: string;
  customerPhone?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'CONFIRMED';
  createdBy: 'CLIENT' | 'CASHIER' | 'ADMIN';
}

interface CashierDataResult {
  courts: Court[];
  bookings: Booking[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useCashierData(): CashierDataResult {
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [courtsRes, bookingsRes] = await Promise.all([
        api.get('/courts'),
        api.get(`/bookings?date=${today}`),
      ]);
      setCourts(courtsRes.data.courts || courtsRes.data);
      setBookings(bookingsRes.data.bookings || bookingsRes.data);
    } catch (err) {
      console.error('Failed to fetch cashier data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { courts, bookings, loading, refetch };
}
