// Guest session store - LocalStorage + cookie sync
// Provides persistent guest sessions across browser restarts

import type { GuestSession, JoinRequest, JoinResponse } from './types';
import { generateDeviceId, SESSION_KEYS } from './types';

// Cookie utilities (for httpOnly cookie fallback)
function setCookie(name: string, value: string, days = 365): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax; Secure`;
}

// LocalStorage utilities
function getLocalStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota exceeded errors
  }
}

function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

// Session store class
export class GuestSessionStore {
  private static instance: GuestSessionStore;
  private session: GuestSession | null = null;
  private listeners: Set<(session: GuestSession | null) => void> = new Set();

  private constructor() {
    // Load session on initialization
    if (typeof window !== 'undefined') {
      this.loadSession();
    }
  }

  static getInstance(): GuestSessionStore {
    if (!GuestSessionStore.instance) {
      GuestSessionStore.instance = new GuestSessionStore();
    }
    return GuestSessionStore.instance;
  }

  private loadSession(): void {
    // Try LocalStorage first
    const stored = getLocalStorage<GuestSession>(SESSION_KEYS.GUEST_SESSION);
    if (stored) {
      this.session = stored;
      // Sync to cookie for middleware
      setCookie('guest_session', stored.sessionToken);
      return;
    }

    // Fallback: check cookie and try to restore
    const token = getCookie('guest_session');
    if (token) {
      // We can't restore full session from cookie alone
      // The middleware will validate and we'll re-fetch on next page load
      this.session = null;
    }
  }

  private saveSession(session: GuestSession | null): void {
    this.session = session;
    if (session) {
      setLocalStorage(SESSION_KEYS.GUEST_SESSION, session);
      setCookie('guest_session', session.sessionToken);
    } else {
      removeLocalStorage(SESSION_KEYS.GUEST_SESSION);
      deleteCookie('guest_session');
    }
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.session));
  }

  // Subscribe to session changes
  subscribe(listener: (session: GuestSession | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Get current session
  getSession(): GuestSession | null {
    return this.session;
  }

  // Check if guest is joined to a wedding
  isJoined(weddingId?: string): boolean {
    if (!this.session) return false;
    if (weddingId && this.session.weddingId !== weddingId) return false;
    return true;
  }

  // Join a wedding
  async join(weddingId: string, request: JoinRequest): Promise<JoinResponse> {
    const deviceId = request.deviceId || generateDeviceId();
    const response = await fetch(`/api/weddings/${weddingId}/guest/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, deviceId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to join' }));
      throw new Error(error.message || 'Failed to join wedding');
    }

    const data = await response.json();
    const session: GuestSession = {
      guestId: data.guestId,
      weddingId: data.wedding.id,
      name: request.name,
      phone: request.phone,
      deviceId,
      sessionToken: data.sessionToken,
      tableId: data.tableId,
      joinedAt: new Date().toISOString(),
    };

    this.saveSession(session);
    return data;
  }

  // Leave current wedding
  leave(): void {
    this.saveSession(null);
  }

  // Update session (e.g., after table assignment)
  updateSession(updates: Partial<GuestSession>): void {
    if (this.session) {
      this.saveSession({ ...this.session, ...updates });
    }
  }

  // Get session token for API calls
  getToken(): string | null {
    return this.session?.sessionToken ?? null;
  }

  // Get guest ID
  getGuestId(): string | null {
    return this.session?.guestId ?? null;
  }

  // Get wedding ID
  getWeddingId(): string | null {
    return this.session?.weddingId ?? null;
  }
}

// React hook for session
import { useState, useEffect, useCallback } from 'react';

export function useGuestSession() {
  const store = GuestSessionStore.getInstance();
  const [session, setSession] = useState<GuestSession | null>(store.getSession());

  useEffect(() => {
    return store.subscribe(setSession);
  }, [store]);

  const join = useCallback(
    async (weddingId: string, request: JoinRequest) => {
      return store.join(weddingId, request);
    },
    [store]
  );

  const leave = useCallback(() => {
    store.leave();
  }, [store]);

  return {
    session,
    isJoined: !!session,
    join,
    leave,
    guestId: session?.guestId,
    weddingId: session?.weddingId,
    token: session?.sessionToken,
  };
}