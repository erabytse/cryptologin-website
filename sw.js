// sw.js - Service Worker pour mettre en cache Pyodide
const CACHE_NAME = 'cryptologin-v1';
const PYODIDE_URLS = [
    'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js',
    'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.asm.js',
    'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.asm.wasm',
    'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/python_stdlib.zip',
];

// Installation du service worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching Pyodide assets...');
                return cache.addAll(PYODIDE_URLS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activation
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Interception des requêtes
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Intercepter les requêtes Pyodide
    if (url.origin === 'https://cdn.jsdelivr.net') {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        console.log('✅ Cache hit:', url.pathname);
                        return response;
                    }
                    return fetch(event.request).then(response => {
                        const clonedResponse = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, clonedResponse);
                        });
                        return response;
                    });
                })
        );
    }
});