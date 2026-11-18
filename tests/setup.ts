// Global test setup
import { vi } from 'vitest';

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

// Mock crypto.randomUUID for consistent testing (version 4 UUID format)
if (typeof global.crypto === 'undefined') {
  global.crypto = {} as any;
}
global.crypto.randomUUID = vi.fn(() => '123e4567-e89b-42d3-a456-426614174000');

// Mock document.cookie
let cookieStore = '';
Object.defineProperty(document, 'cookie', {
  get: () => cookieStore,
  set: (val: string) => { cookieStore = val; },
  configurable: true,
});

// Reset mocks before each test
beforeEach(() => {
  localStorageMock.clear();
  cookieStore = '';
  vi.clearAllMocks();
});