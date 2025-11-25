const CACHE_NAME = 'fueltrack-v1';
const DYNAMIC_CACHE = 'fueltrack-dynamic-v1';

// Files to precache immediately
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './types.ts',
  './constants.ts',
  './App.tsx',
  './components/Dashboard.tsx',
  './components/EntryForm.tsx',
  './components/History.tsx',
  './components/Settings.tsx',
  './components/AIAnalysis.tsx',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Handle API calls or other non-GET requests -> Network only
  if (event.request.method !== 'GET') {
    return;
  }

  // Strategies:
  // 1. For local files: Cache First, fallback to Network
  // 2. For external CDNs (imports): Stale While Revalidate
  
  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;

  if (isLocal) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request).then((networkResponse) => {
           return caches.open(CACHE_NAME).then((cache) => {
             cache.put(event.request, networkResponse.clone());
             return networkResponse;
           });
        });
      })
    );
  } else {
    // External resources (React, Lucide, Recharts via CDN)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
        return cachedResponse || fetchPromise;
      })
    );
  }
});