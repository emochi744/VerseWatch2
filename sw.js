// VerseWatch Service Worker
const CACHE_NAME = 'versewatch-v28';
const ASSETS = [
    './',
    './index.html',
    './style.css?v=33.0',
    './app.js?v=28.2',
    './data.js?v=22.1',
    './tmdb.js?v=22.1',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './firebase-app.js?v=22.1'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME && cache !== 'versewatch-images') {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Dynamic cache for proxy images (wsrv.nl) - STRIKT CACHE-FIRST
    if (url.hostname === 'wsrv.nl') {
        event.respondWith(
            caches.open('versewatch-images').then(async cache => {
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) return cachedResponse;

                try {
                    const networkResponse = await fetch(event.request);
                    if (networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                } catch (e) {
                    // respondWith(null) runtime exception üretebilir; boş bir placeholder Response dön.
                    return new Response('', { status: 504, headers: { 'Content-Type': 'image/*' } });
                }
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
