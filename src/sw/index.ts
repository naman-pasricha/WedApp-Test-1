// Service Worker for WedApp PWA
// Uses Workbox directly (serwist handles config at build time)

// Precache manifest - injected by Serwist at build time
declare const __WB_MANIFEST: Array<{ url: string; revision: string }>;

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

precacheAndRoute(__WB_MANIFEST || []);

// Skip waiting for new service worker
// @ts-ignore - Service Worker global scope
self.skipWaiting();
// @ts-ignore - Service Worker global scope
self.clientsClaim();

// ============================================
// Push Notification Handling
// ============================================

// @ts-ignore - Service Worker global scope
self.addEventListener('push', (event: any) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options: NotificationOptions = {
      body: data.body || 'New update from the wedding!',
      icon: data.icon || '/icons/icon-192.png',
      badge: data.badge || '/icons/badge-72.png',
      tag: data.tag || 'wedding-update',
      data: data.data || {},
      requireInteraction: true,
    };

    event.waitUntil(
      // @ts-ignore - Service Worker global scope
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// @ts-ignore - Service Worker global scope
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();

  if (event.action === 'view') {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      // @ts-ignore - Service Worker global scope
      self.clients.matchAll({ type: 'window' }).then((clientList: any[]) => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
    );
  }
});

// ============================================
// Background Sync for Offline Operations
// ============================================

// @ts-ignore - Service Worker global scope
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'photo-upload') {
    event.waitUntil(syncPhotos());
  }
  if (event.tag === 'message-send') {
    event.waitUntil(syncMessages());
  }
});

async function syncPhotos() {
  console.log('Syncing photos...');
  // @ts-ignore - Service Worker global scope
  const clients = await self.clients.matchAll();
  clients.forEach((client: any) => {
    client.postMessage({ type: 'SYNC_PHOTOS' });
  });
}

async function syncMessages() {
  console.log('Syncing messages...');
  // @ts-ignore - Service Worker global scope
  const clients = await self.clients.matchAll();
  clients.forEach((client: any) => {
    client.postMessage({ type: 'SYNC_MESSAGES' });
  });
}

// ============================================
// Periodic Background Sync
// ============================================

// @ts-ignore - Service Worker global scope
self.addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'update-wedding-data') {
    event.waitUntil(updateWeddingData());
  }
});

async function updateWeddingData() {
  console.log('Updating wedding data...');
  // @ts-ignore - Service Worker global scope
  const clients = await self.clients.matchAll();
  clients.forEach((client: any) => {
    client.postMessage({ type: 'UPDATE_WEDDING_DATA' });
  });
}

// ============================================
// Message Handling from Clients
// ============================================

// @ts-ignore - Service Worker global scope
self.addEventListener('message', (event: any) => {
  if (event.data?.type === 'SKIP_WAITING') {
    // @ts-ignore - Service Worker global scope
    self.skipWaiting();
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  }

  if (event.data?.type === 'CACHE_WEDDING_DATA') {
    event.waitUntil(cacheWeddingData(event.data.weddingId, event.data.data));
  }
});

async function clearAllCaches() {
  // @ts-ignore - Service Worker global scope
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name: string) => caches.delete(name)));
}

async function cacheWeddingData(weddingId: string, data: any) {
  // @ts-ignore - Service Worker global scope
  const cache = await caches.open('wedapp-offline-data');
  const response = new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
  await cache.put(`/offline/wedding/${weddingId}`, response);
}

// ============================================
// Runtime Caching Routes (configured by Serwist at build time)
// ============================================

// API routes - Network first with offline fallback
registerRoute(
  ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'wedapp-api',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 300 }),
    ],
    networkTimeoutSeconds: 10,
  })
);

// Next.js static assets - Cache first
registerRoute(
  ({ url }: { url: URL }) => url.pathname.startsWith('/_next/static/'),
  new CacheFirst({
    cacheName: 'wedapp-static',
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  })
);

// Images - Cache first
registerRoute(
  ({ request }: { request: Request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'wedapp-images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
);

// Fonts - Cache first
registerRoute(
  ({ request }: { request: Request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'wedapp-fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  })
);

// HTML pages - Network first with offline fallback
registerRoute(
  ({ request }: { request: Request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'wedapp-pages',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }),
    ],
    networkTimeoutSeconds: 5,
  })
);

// Manifest - Cache first
registerRoute(
  ({ url }: { url: URL }) => url.pathname === '/manifest.json',
  new CacheFirst({
    cacheName: 'wedapp-static',
  })
);

// Supabase storage images - Cache first
registerRoute(
  ({ url }: { url: URL }) => url.hostname.endsWith('.supabase.co') && url.pathname.includes('/storage/v1/object/public/'),
  new CacheFirst({
    cacheName: 'wedapp-supabase-images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
);

// Google Fonts - Cache first
registerRoute(
  ({ url }: { url: URL }) => url.hostname === 'fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'wedapp-google-fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  })
);
registerRoute(
  ({ url }: { url: URL }) => url.hostname === 'fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'wedapp-google-fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  })
);