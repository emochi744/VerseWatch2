// VerseWatch Service Worker
const CACHE_NAME = 'versewatch-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './data.js',
    './tmdb.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Dynamic cache for proxy images (wsrv.nl)
    if (url.hostname === 'wsrv.nl') {
        event.respondWith(
            caches.open('versewatch-images').then(cache => {
                return cache.match(event.request).then(response => {
                    return response || fetch(event.request).then(networkResponse => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
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
