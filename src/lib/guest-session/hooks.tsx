// Guest Session Hooks
// Provides React hooks for accessing guest session state

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { GuestSession, JoinRequest } from './types';
import { GuestSessionStore, useGuestSession as useStoreGuestSession } from './store';

interface GuestSessionContextValue {
  guest: GuestSession | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const GuestSessionContext = createContext<GuestSessionContextValue | null>(null);

export function GuestSessionProvider({ children }: { children: ReactNode }) {
  const { session, isJoined } = useStoreGuestSession();
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    // The store hook already handles loading session
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <GuestSessionContext.Provider value={{ guest: session, loading, refresh }}>
      {children}
    </GuestSessionContext.Provider>
  );
}

export function useGuestSession() {
  const context = useContext(GuestSessionContext);
  if (!context) {
    throw new Error('useGuestSession must be used within a GuestSessionProvider');
  }
  return context;
}

// Hook for accessing Supabase client in client components
export function useSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Hook for handling guest join flow
export function useGuestJoin(weddingSlug: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async (name: string, phone: string): Promise<GuestSession | null> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Get wedding by slug
      const { data: wedding, error: weddingError } = await supabase
        .rpc('get_wedding_by_slug', { p_slug: weddingSlug });

      if (weddingError || !wedding) {
        throw new Error('Wedding not found');
      }

      // Generate device ID if not exists
      let deviceId = localStorage.getItem('wedapp_device_id');
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('wedapp_device_id', deviceId);
      }

      // Create or get guest
      const { data: guest, error: guestError } = await supabase
        .from('guests')
        .upsert(
          {
            wedding_id: wedding.id,
            name,
            phone,
            device_id: deviceId,
          },
          { onConflict: 'wedding_id,device_id' }
        )
        .select()
        .single();

      if (guestError || !guest) {
        throw new Error('Failed to join wedding');
      }

      // Create session
      const sessionToken = crypto.randomUUID();
      const { error: sessionError } = await supabase
        .from('guest_sessions')
        .insert({
          guest_id: guest.id,
          session_token: sessionToken,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });

      if (sessionError) {
        throw new Error('Failed to create session');
      }

      const session: GuestSession = {
        guestId: guest.id,
        weddingId: wedding.id,
        sessionToken,
        name: guest.name,
        deviceId: guest.device_id || deviceId,
        joinedAt: new Date().toISOString(),
      };

      // Store in localStorage and cookie
      localStorage.setItem('wedapp_session', JSON.stringify(session));
      document.cookie = `wedapp_session=${sessionToken}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;

      return session;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { join, loading, error };
}

// Hook for guest logout
export function useGuestLogout() {
  const { refresh } = useGuestSession();

  const logout = async () => {
    localStorage.removeItem('wedapp_session');
    document.cookie = 'wedapp_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    await refresh();
  };

  return { logout };
}