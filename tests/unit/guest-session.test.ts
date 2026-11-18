// Guest session unit tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateDeviceId, getDeviceId, SESSION_KEYS } from '@/lib/guest-session/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock document.cookie
let cookieStore = '';
Object.defineProperty(document, 'cookie', {
  get: () => cookieStore,
  set: (val: string) => { cookieStore = val; },
  configurable: true,
});

describe('Guest Session', () => {
  beforeEach(() => {
    localStorageMock.clear();
    cookieStore = '';
    vi.clearAllMocks();
  });

  describe('generateDeviceId', () => {
    it('generates a UUID', () => {
      const id = generateDeviceId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('returns cached ID on subsequent calls', () => {
      const id1 = generateDeviceId();
      const id2 = generateDeviceId();
      expect(id1).toBe(id2);
    });
  });

  describe('getDeviceId', () => {
    it('returns null when no device ID stored', () => {
      expect(getDeviceId()).toBeNull();
    });

    it('returns stored device ID', () => {
      localStorageMock.setItem(SESSION_KEYS.DEVICE_ID, 'test-device-id');
      expect(getDeviceId()).toBe('test-device-id');
    });
  });

  describe('SESSION_KEYS', () => {
    it('has correct key names', () => {
      expect(SESSION_KEYS.GUEST_SESSION).toBe('wedapp_guest_session');
      expect(SESSION_KEYS.DEVICE_ID).toBe('wedapp_device_id');
    });
  });
});