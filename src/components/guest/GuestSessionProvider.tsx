'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useGuestSession as useSessionHook } from '@/lib/guest-session/store';
import { useRouter, usePathname } from 'next/navigation';

interface GuestSessionContextType {
  session: ReturnType<typeof useSessionHook>['session'];
  isJoined: boolean;
  join: (name: string, phone?: string) => Promise<void>;
  leave: ReturnType<typeof useSessionHook>['leave'];
  guestId: string | null;
  weddingId: string | null;
  token: string | null;
  isLoading: boolean;
}

const GuestSessionContext = createContext<GuestSessionContextType | null>(null);

interface GuestSessionProviderProps {
  children: ReactNode;
  weddingSlug: string;
}

export function GuestSessionProvider({ children, weddingSlug }: GuestSessionProviderProps) {
  const { session, isJoined, join, leave, guestId, weddingId, token } = useSessionHook();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  // Check if we're on the join page
  const isJoinPage = pathname === `/w/${weddingSlug}/join`;

  // If joined but on join page, redirect to home
  useEffect(() => {
    if (isJoined && isJoinPage) {
      router.replace(`/w/${weddingSlug}`);
    }
    setIsLoading(false);
  }, [isJoined, isJoinPage, router, weddingSlug]);

  // If not joined and not on join page, redirect to join
  useEffect(() => {
    if (!isLoading && !isJoined && !isJoinPage && pathname !== `/w/${weddingSlug}`) {
      router.replace(`/w/${weddingSlug}/join`);
    }
  }, [isLoading, isJoined, isJoinPage, pathname, router, weddingSlug]);

  const handleJoin = useCallback(
    async (name: string, phone?: string) => {
      setIsLoading(true);
      try {
        await join(weddingSlug, { name, phone });
        router.replace(`/w/${weddingSlug}`);
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    },
    [join, weddingSlug, router]
  );

  return (
    <GuestSessionContext.Provider
      value={{
        session,
        isJoined,
        join: handleJoin,
        leave,
        guestId: guestId ?? null,
        weddingId: weddingId ?? null,
        token: token ?? null,
        isLoading,
      }}
    >
      {children}
    </GuestSessionContext.Provider>
  );
}

export function useGuestSessionContext() {
  const context = useContext(GuestSessionContext);
  if (!context) {
    throw new Error('useGuestSessionContext must be used within a GuestSessionProvider');
  }
  return context;
}