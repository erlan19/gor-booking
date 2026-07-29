import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

// Socket URL configuration for production
const getSocketUrl = () => {
  // Check for environment variable first, then use current origin
  return import.meta.env.VITE_SOCKET_URL || `${window.location.protocol.replace('http', 'ws')}//${window.location.hostname}`;
};

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  // Memoize the socket URL to avoid recalculation
  const socketUrl = getSocketUrl();

  useEffect(() => {
    if (!user || !token) return;

    const socket = io(socketUrl, {
      path: '/ws',
      auth: { token },
      transports: ['polling', 'websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('subscribe:user', user.id);
      if (user.role === 'CASHIER' || user.role === 'ADMIN') {
        socket.emit('subscribe:admin');
      }
    });

    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user?.id, token, socketUrl]);

  const onBookingUpdated = useCallback((handler: (data: any) => void) => {
    socketRef.current?.on('booking:updated', handler);
    return () => { socketRef.current?.off('booking:updated', handler); };
  }, []);

  const onBookingCreated = useCallback((handler: (data: any) => void) => {
    socketRef.current?.on('booking:created', handler);
    return () => { socketRef.current?.off('booking:created', handler); };
  }, []);

  const onBookingCancelled = useCallback((handler: (data: any) => void) => {
    socketRef.current?.on('booking:cancelled', handler);
    return () => { socketRef.current?.off('booking:cancelled', handler); };
  }, []);

  return { isConnected, onBookingUpdated, onBookingCreated, onBookingCancelled };
}
