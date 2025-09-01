// Service Worker for offline functionality
const CACHE_NAME = 'scavenger-hunt-v20250901.6';

const rootUrl = 'https://dangowans.github.io/scavenger-hunt';

const urlsToCache = [
    rootUrl + '/',
    rootUrl + '/index.html',
    rootUrl + '/hunt.html',
    rootUrl + '/create-hunt.html',
    rootUrl + '/styles.css',
    rootUrl + '/app.js',
    rootUrl + '/hunt.js',
    rootUrl + '/create-hunt.js',
    rootUrl + '/hunts.json',
    rootUrl + '/manifest.json',
    // Add hunt files and images as they're accessed
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }
                
                // Clone the request because it's a one-time use stream
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then((response) => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response because it's a one-time use stream
                    const responseToCache = response.clone();
                    
                    // Add to cache for future offline access
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                }).catch(() => {
                    // Return a fallback for HTML requests when offline
                    if (event.request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Sync any pending data when back online
            console.log('Background sync triggered')
        );
    }
});

// Push notifications (for future enhancements)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New scavenger hunt available!',
        icon: 'icons/icon-192x192.png',
        badge: 'icons/icon-72x72.png'
    };
    
    event.waitUntil(
        self.registration.showNotification('Scavenger Hunt', options)
    );
});
