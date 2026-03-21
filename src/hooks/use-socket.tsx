'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { io, type Socket } from 'socket.io-client';

type SocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

const SOCKET_URL =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:${process.env.NEXT_PUBLIC_SOCKET_PORT ?? '3001'}`
    : '';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <SocketContext value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

export function useSocketEvent<T = unknown>(
  event: string,
  callback: (data: T) => void
) {
  const { socket } = useSocket();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const stableHandler = useCallback(
    (data: T) => callbackRef.current(data),
    []
  );

  useEffect(() => {
    if (!socket) return;

    socket.on(event, stableHandler);
    return () => {
      socket.off(event, stableHandler);
    };
  }, [socket, event, stableHandler]);
}
