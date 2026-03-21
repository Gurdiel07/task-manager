'use client';

import { SocketProvider } from '@/hooks/use-socket';

export function SocketWrapper({ children }: { children: React.ReactNode }) {
  return <SocketProvider>{children}</SocketProvider>;
}
