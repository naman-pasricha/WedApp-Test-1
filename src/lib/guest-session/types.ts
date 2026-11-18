// Guest session types and utilities

export interface GuestSession {
  guestId: string;
  weddingId: string;
  name: string;
  phone?: string;
  deviceId: string;
  sessionToken: string;
  tableId?: string;
  joinedAt: string;
}

export interface JoinRequest {
  name: string;
  phone?: string;
  deviceId?: string;
}

export interface JoinResponse {
  guestId: string;
  sessionToken: string;
  tableId?: string;
  wedding: {
    id: string;
    slug: string;
    name: string;
    date: string;
    timezone: string;
    theme: unknown;
    heroImageUrl: string | null;
  };
}

// Generate a persistent device ID
export function generateDeviceId(): string {
  if (typeof window !== 'undefined') {
    let deviceId = localStorage.getItem('wedapp_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('wedapp_device_id', deviceId);
    }
    return deviceId;
  }
  return crypto.randomUUID();
}

// Get stored device ID
export function getDeviceId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('wedapp_device_id');
  }
  return null;
}

// Session storage keys
export const SESSION_KEYS = {
  GUEST_SESSION: 'wedapp_guest_session',
  DEVICE_ID: 'wedapp_device_id',
} as const;