import { useState, useEffect } from 'react';
import api from '../lib/api';

export interface Court {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
  isActive: boolean;
}

export function useCourts() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/courts')
      .then((res) => { if (!cancelled) setCourts(res.data.courts || []); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || 'Gagal memuat lapangan'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { courts, loading, error };
}
