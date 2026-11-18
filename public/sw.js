// Service Worker for WedApp PWA
// Uses Workbox for caching strategies (loaded via importScripts)

const CACHE_NAME = 'wedapp-v1';
const IMAGE_CACHE_NAME = 'wedapp-images-v1';
const API_CACHE_NAME = 'wedapp-api-v1';
const FONT_CACHE_NAME = 'wedapp-fonts-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html',
];

// Maximum entries per cache
const MAX_IMAGE_ENTRIES = 100;
const MAX_API_ENTRIES = 50;

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) =>
            name !== CACHE_NAME &&
            name !== IMAGE_CACHE_NAME &&
            name !== API_CACHE_NAME &&
            name !== FONT_CACHE_NAME
          )
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch - different strategies per resource type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // API routes - stale while revalidate with network fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE_NAME, MAX_API_ENTRIES));
    return;
  }

  // Static assets (JS, CSS) - cache first with long expiry
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // Fonts - cache first with separate cache
  if (
    request.destination === 'font' ||
    url.pathname.match(/\.(woff|woff2|ttf|otf)$/)
  ) {
    event.respondWith(cacheFirst(request, FONT_CACHE_NAME));
    return;
  }

  // Images - cache first with separate cache and size limit
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE_NAME, MAX_IMAGE_ENTRIES));
    return;
  }

  // HTML pages - network first with offline fallback
  if (request.destination === 'document' || request.mode === 'navigate') {
    event.respondWith(networkFirstWithOffline(request));
    return;
  }

  // Default - stale while revalidate
  event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
});

// Cache first strategy
async function cacheFirst(request, cacheName = CACHE_NAME, maxEntries = Infinity) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    // Check if cache is fresh (24 hours for static, 7 days for images)
    const cachedDate = new Date(cached.headers.get('sw-cache-date') || 0);
    const maxAge = cacheName === IMAGE_CACHE_NAME ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    if (Date.now() - cachedDate.getTime() < maxAge) {
      return cached;
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-date', new Date().toISOString());

      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers,
      });

      await cache.put(request, cachedResponse);

      // Cleanup old entries if over limit
      if (maxEntries !== Infinity) {
        await cleanupCache(cache, maxEntries);
      }
    }
    return response;
  } catch {
    if (cached) return cached;
    return new Response('Offline', { status: 503 });
  }
}

// Network first with offline fallback
async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-date', new Date().toISOString());

      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers,
      });

      cache.put(request, cachedResponse);
    }
    return response;
  } catch {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    // Return offline page for navigation requests
    if (request.destination === 'document' || request.mode === 'navigate') {
      const offline = await cache.match('/offline.html');
      if (offline) return offline;
    }

    return new Response('Offline', { status: 503 });
  }
}

// Stale while revalidate
async function staleWhileRevalidate(request, cacheName = CACHE_NAME, maxEntries = Infinity) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fetch in background to update cache
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-date', new Date().toISOString());

      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers,
      });

      cache.put(request, cachedResponse);

      if (maxEntries !== Infinity) {
        cleanupCache(cache, maxEntries);
      }
    }
    return response;
  }).catch(() => {});

  // Return cached immediately if available
  if (cached) {
    event.waitUntil(fetchPromise);
    return cached;
  }

  // Otherwise wait for network
  try {
    const response = await fetchPromise;
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

// Cleanup old cache entries (LRU)
async function cleanupCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map(key => cache.delete(key)));
  }
}

// Background sync for photo uploads
self.addEventListener('sync', (event) => {
  if (event.tag === 'photo-upload') {
    event.waitUntil(syncPhotos());
  }
  if (event.tag === 'message-send') {
    event.waitUntil(syncMessages());
  }
});

async function syncPhotos() {
  // Would use IndexedDB to store pending uploads
  // Implementation would go here
  console.log('Syncing photos...');
}

async function syncMessages() {
  // Sync offline messages
  console.log('Syncing messages...');
}

// Periodic background sync (for future use)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-wedding-data') {
    event.waitUntil(updateWeddingData());
  }
});

async function updateWeddingData() {
  // Periodically fetch latest wedding data
  console.log('Updating wedding data...');
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'New update from the wedding!',
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/badge-72.png',
    tag: data.tag || 'wedding-update',
    data: data.data || {},
    actions: data.actions || [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
    );
  }
});

// Message handling from clients
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
}